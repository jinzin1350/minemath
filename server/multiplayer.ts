/**
 * Multiplayer — Pusher-based, Lambda-compatible
 *
 * Since Lambda is stateless (no shared memory between invocations),
 * all game state lives in the Pusher channel + client side.
 * The server only acts as a Pusher auth proxy and thin message relay.
 *
 * Flow:
 *  1. POST /api/multiplayer/rooms         → create room (returns roomId)
 *  2. POST /api/multiplayer/rooms/:id/join
 *  3. Client (host) generates questions, drives game via Pusher client events
 *  4. POST /api/multiplayer/event         → relay any game event via Pusher
 */

import Pusher from "pusher";
import type { Express, Request, Response } from "express";

// ─────────────────────────────────────────────
// Pusher server (lazy)
// ─────────────────────────────────────────────

let _pusher: Pusher | null = null;
function getPusher(): Pusher {
  if (_pusher) return _pusher;
  const { PUSHER_APP_ID: appId, PUSHER_KEY: key, PUSHER_SECRET: secret } = process.env;
  const cluster = process.env.PUSHER_CLUSTER || "us3";
  if (!appId || !key || !secret) throw new Error("Pusher env vars missing");
  _pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return _pusher;
}

// ─────────────────────────────────────────────
// Question generator (also used server-side for seed)
// ─────────────────────────────────────────────

export type GameMode = "battle" | "coop";

interface Question {
  id: number;
  text: string;
  answer: number;
  choices: number[];
}

function makeQuestion(grade: number, id: number): Question {
  let a: number, b: number, answer: number, expr: string;
  if (grade <= 3) {
    if (Math.random() > 0.4) {
      a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1;
      answer = a + b; expr = `${a} + ${b}`;
    } else {
      a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b; expr = `${a} − ${b}`;
    }
  } else if (grade <= 5) {
    a = Math.floor(Math.random() * 10) + 2; b = Math.floor(Math.random() * 10) + 2;
    answer = a * b; expr = `${a} × ${b}`;
  } else {
    if (Math.random() > 0.4) {
      a = Math.floor(Math.random() * 12) + 3; b = Math.floor(Math.random() * 12) + 3;
      answer = a * b; expr = `${a} × ${b}`;
    } else {
      b = Math.floor(Math.random() * 11) + 2; answer = Math.floor(Math.random() * 11) + 2;
      a = b * answer; expr = `${a} ÷ ${b}`;
    }
  }
  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const d = Math.floor(Math.random() * 10) - 5;
    const w = answer + (d === 0 ? 1 : d);
    if (w !== answer && w > 0) wrongs.add(w);
  }
  return { id, text: `${expr} = ?`, answer, choices: [...wrongs, answer].sort(() => Math.random() - 0.5) };
}

function makeQuestions(grade: number, n = 10): Question[] {
  return Array.from({ length: n }, (_, i) => makeQuestion(grade, i));
}

// ─────────────────────────────────────────────
// Room code generator (simple, no persistence needed)
// ─────────────────────────────────────────────

function randomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ─────────────────────────────────────────────
// Register routes
// ─────────────────────────────────────────────

export function setupMultiplayer(app: Express) {

  // ── Pusher channel auth ─────────────────────
  app.post("/api/multiplayer/auth", (req: Request, res: Response) => {
    const { socket_id, channel_name, userId, username } = req.body;
    if (!socket_id || !channel_name) return res.status(400).json({ error: "Missing params" });
    const uid = userId || (req.session as any)?.userId || "anon";
    try {
      const auth = getPusher().authorizeChannel(socket_id, channel_name, {
        user_id: uid,
        user_info: { username: username || "Player" },
      });
      res.json(auth);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ── Create room — returns roomId + full question set ──
  app.post("/api/multiplayer/rooms", async (req: Request, res: Response) => {
    const { userId, username, gameMode, grade } = req.body as {
      userId: string; username: string; gameMode: GameMode; grade: number;
    };
    const roomId = randomCode();
    const questions = makeQuestions(grade || 3, 10);

    // Notify channel (nobody subscribed yet, that's fine — host will get this via the response)
    await getPusher().trigger(`presence-room-${roomId}`, "room-created", {
      roomId, gameMode, grade, hostUserId: userId,
    }).catch(() => {});

    res.json({ roomId, gameMode, grade, questions });
  });

  // ── Join room ───────────────────────────────
  app.post("/api/multiplayer/rooms/:roomId/join", async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { userId, username } = req.body;
    await getPusher().trigger(`presence-room-${roomId}`, "player-joined", {
      userId, username, roomId,
    }).catch(() => {});
    res.json({ ok: true, roomId });
  });

  // ── Generic event relay ─────────────────────
  // Client POSTs here → server pushes via Pusher to all channel subscribers
  // This avoids needing client-side Pusher triggers (which require a paid plan)
  app.post("/api/multiplayer/event", async (req: Request, res: Response) => {
    const { roomId, event, data } = req.body as {
      roomId: string; event: string; data: unknown;
    };
    if (!roomId || !event) return res.status(400).json({ error: "Missing roomId or event" });

    // Whitelist allowed events
    const allowed = [
      "player-ready", "game-start", "question", "answer-result",
      "coop-damage", "coop-turn", "question-timeout", "game-over", "player-left",
    ];
    if (!allowed.includes(event)) return res.status(400).json({ error: "Event not allowed" });

    await getPusher().trigger(`presence-room-${roomId}`, event, data ?? {});
    res.json({ ok: true });
  });

  // ── Leave room ──────────────────────────────
  app.post("/api/multiplayer/rooms/:roomId/leave", async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { userId, username } = req.body;
    await getPusher().trigger(`presence-room-${roomId}`, "player-left", { userId, username }).catch(() => {});
    res.json({ ok: true });
  });
}
