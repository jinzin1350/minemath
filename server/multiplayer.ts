/**
 * Multiplayer module — Pusher-based (works on AWS Lambda / serverless)
 *
 * Architecture:
 *  - Game state lives in-memory (fine for single Lambda instance; for multi-instance use Redis/DynamoDB)
 *  - Each HTTP endpoint is called by the client and broadcasts via Pusher
 *  - Channels:  presence-room-{roomId}   (lobby + game events)
 *  - Pusher auth endpoint:  POST /api/multiplayer/auth
 */

import Pusher from "pusher";
import type { Express, Request, Response } from "express";

// ─────────────────────────────────────────────
// Pusher server instance (lazy-init)
// ─────────────────────────────────────────────

let _pusher: Pusher | null = null;

function getPusher(): Pusher {
  if (_pusher) return _pusher;
  const appId = process.env.PUSHER_APP_ID!;
  const key = process.env.PUSHER_KEY!;
  const secret = process.env.PUSHER_SECRET!;
  const cluster = process.env.PUSHER_CLUSTER || "us3";
  if (!appId || !key || !secret) {
    throw new Error("Pusher env vars not set (PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET)");
  }
  _pusher = new Pusher({ appId, key, secret, cluster, useTLS: true });
  return _pusher;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type GameMode = "battle" | "coop";

interface Question {
  id: number;
  text: string;
  answer: number;
  choices: number[];
}

interface PlayerState {
  userId: string;
  username: string;
  score: number;
  ready: boolean;
  answeredCurrent: boolean;
}

interface Room {
  id: string;
  hostUserId: string;
  gameMode: GameMode;
  grade: number;
  maxPlayers: number;
  status: "waiting" | "active" | "finished";
  players: Record<string, PlayerState>;
  questions: Question[];
  currentQuestionIndex: number;
  questionStartedAt: number; // epoch ms
  coopHp: number;
  coopTurn: string | null; // userId
  questionTimerHandle: ReturnType<typeof setTimeout> | null;
}

// ─────────────────────────────────────────────
// In-memory store
// ─────────────────────────────────────────────

const rooms = new Map<string, Room>();

// ─────────────────────────────────────────────
// Question generator
// ─────────────────────────────────────────────

function generateQuestion(grade: number, id: number): Question {
  let a: number, b: number, answer: number, text: string;

  if (grade <= 3) {
    const useAdd = Math.random() > 0.4;
    if (useAdd) {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      text = `${a} + ${b}`;
    } else {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      text = `${a} − ${b}`;
    }
  } else if (grade <= 5) {
    a = Math.floor(Math.random() * 10) + 2;
    b = Math.floor(Math.random() * 10) + 2;
    answer = a * b;
    text = `${a} × ${b}`;
  } else {
    const useMult = Math.random() > 0.4;
    if (useMult) {
      a = Math.floor(Math.random() * 12) + 3;
      b = Math.floor(Math.random() * 12) + 3;
      answer = a * b;
      text = `${a} × ${b}`;
    } else {
      b = Math.floor(Math.random() * 11) + 2;
      answer = Math.floor(Math.random() * 11) + 2;
      a = b * answer;
      text = `${a} ÷ ${b}`;
    }
  }

  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const delta = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + (delta === 0 ? 1 : delta);
    if (wrong !== answer && wrong > 0) wrongSet.add(wrong);
  }

  const choices = [...wrongSet, answer].sort(() => Math.random() - 0.5);
  return { id, text: `${text} = ?`, answer, choices };
}

function generateQuestions(grade: number, count = 10): Question[] {
  return Array.from({ length: count }, (_, i) => generateQuestion(grade, i));
}

// ─────────────────────────────────────────────
// Room code
// ─────────────────────────────────────────────

function generateRoomCode(): string {
  let code: string;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

// ─────────────────────────────────────────────
// Channel name helper
// ─────────────────────────────────────────────

function roomChannel(roomId: string) {
  return `presence-room-${roomId}`;
}

// ─────────────────────────────────────────────
// Broadcast helpers
// ─────────────────────────────────────────────

async function broadcast(roomId: string, event: string, data: unknown) {
  try {
    await getPusher().trigger(roomChannel(roomId), event, data);
  } catch (err) {
    console.error("[Pusher] broadcast error:", err);
  }
}

// ─────────────────────────────────────────────
// Scores helper
// ─────────────────────────────────────────────

function getScores(room: Room): Record<string, { score: number; username: string }> {
  const out: Record<string, { score: number; username: string }> = {};
  for (const [uid, p] of Object.entries(room.players)) {
    out[uid] = { score: p.score, username: p.username };
  }
  return out;
}

function getScoreMap(room: Room): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [uid, p] of Object.entries(room.players)) {
    out[uid] = p.score;
  }
  return out;
}

// ─────────────────────────────────────────────
// Game loop
// ─────────────────────────────────────────────

const QUESTION_TIME_MS = 15000;
const COOP_MAX_HP = 100;

async function startGame(room: Room) {
  room.status = "active";
  room.questions = generateQuestions(room.grade, 10);
  room.currentQuestionIndex = 0;
  if (room.gameMode === "coop") {
    room.coopHp = COOP_MAX_HP;
    room.coopTurn = Object.keys(room.players)[0];
  }
  for (const p of Object.values(room.players)) {
    p.score = 0;
    p.answeredCurrent = false;
  }

  await broadcast(room.id, "game-start", {
    questions: room.questions.map(({ answer: _a, ...q }) => q),
  });

  sendNextQuestion(room);
}

function sendNextQuestion(room: Room) {
  if (room.currentQuestionIndex >= room.questions.length) {
    endGame(room);
    return;
  }

  for (const p of Object.values(room.players)) p.answeredCurrent = false;

  const q = room.questions[room.currentQuestionIndex];
  room.questionStartedAt = Date.now();

  broadcast(room.id, "question", {
    question: { id: q.id, text: q.text, choices: q.choices },
    index: room.currentQuestionIndex,
    total: room.questions.length,
    timeLimit: QUESTION_TIME_MS,
  });

  if (room.gameMode === "coop" && room.coopTurn) {
    broadcast(room.id, "coop-turn", { userId: room.coopTurn });
  }

  if (room.questionTimerHandle) clearTimeout(room.questionTimerHandle);
  room.questionTimerHandle = setTimeout(async () => {
    const correct = room.questions[room.currentQuestionIndex].answer;
    await broadcast(room.id, "question-timeout", { correctAnswer: correct });

    if (room.gameMode === "coop") {
      room.coopHp = Math.max(0, room.coopHp - 20);
      await broadcast(room.id, "coop-damage", {
        damage: 20, hp: room.coopHp, maxHp: COOP_MAX_HP,
      });
      if (room.coopHp <= 0) { endGame(room); return; }
      advanceCoopTurn(room);
    }

    room.currentQuestionIndex++;
    sendNextQuestion(room);
  }, QUESTION_TIME_MS);
}

function advanceCoopTurn(room: Room) {
  const ids = Object.keys(room.players);
  const cur = ids.indexOf(room.coopTurn!);
  room.coopTurn = ids[(cur + 1) % ids.length];
}

async function handleAnswer(
  room: Room,
  player: PlayerState,
  questionId: number,
  answer: number,
  timeMs: number
) {
  if (room.status !== "active") return;
  if (player.answeredCurrent) return;

  const q = room.questions[room.currentQuestionIndex];
  if (!q || q.id !== questionId) return;

  if (room.gameMode === "coop" && room.coopTurn !== player.userId) return;

  player.answeredCurrent = true;
  const correct = answer === q.answer;

  let points = 0;
  if (correct) {
    const timeFraction = Math.max(0, 1 - timeMs / QUESTION_TIME_MS);
    points = Math.round(10 + timeFraction * 90);
    player.score += points;
  }

  await broadcast(room.id, "answer-result", {
    userId: player.userId,
    correct,
    points,
    scores: getScoreMap(room),
  });

  if (room.gameMode === "coop") {
    if (!correct) {
      const damage = 15;
      room.coopHp = Math.max(0, room.coopHp - damage);
      await broadcast(room.id, "coop-damage", {
        damage, hp: room.coopHp, maxHp: COOP_MAX_HP,
      });
      if (room.coopHp <= 0) {
        if (room.questionTimerHandle) clearTimeout(room.questionTimerHandle);
        endGame(room);
        return;
      }
    }
    if (room.questionTimerHandle) clearTimeout(room.questionTimerHandle);
    advanceCoopTurn(room);
    room.currentQuestionIndex++;
    setTimeout(() => sendNextQuestion(room), 1500);
  } else {
    const allAnswered = Object.values(room.players).every((p) => p.answeredCurrent);
    if (allAnswered) {
      if (room.questionTimerHandle) clearTimeout(room.questionTimerHandle);
      room.currentQuestionIndex++;
      setTimeout(() => sendNextQuestion(room), 1500);
    }
  }
}

async function endGame(room: Room) {
  if (room.questionTimerHandle) clearTimeout(room.questionTimerHandle);
  room.status = "finished";

  let winner: string | undefined;
  if (room.gameMode === "battle") {
    let maxScore = -1;
    for (const [uid, p] of Object.entries(room.players)) {
      if (p.score > maxScore) { maxScore = p.score; winner = uid; }
    }
  }

  await broadcast(room.id, "game-over", { winner, scores: getScores(room) });

  setTimeout(() => rooms.delete(room.id), 30000);
}

// ─────────────────────────────────────────────
// Register Express routes
// ─────────────────────────────────────────────

export function setupMultiplayer(app: Express) {
  // Pusher channel auth (required for presence channels)
  app.post("/api/multiplayer/auth", (req: Request, res: Response) => {
    const socketId: string = req.body.socket_id;
    const channel: string = req.body.channel_name;
    const userId: string = (req.body.userId as string) || (req.session as any)?.userId || "anon";
    const username: string = (req.body.username as string) || "Player";

    try {
      const authResponse = getPusher().authorizeChannel(socketId, channel, {
        user_id: userId,
        user_info: { username },
      });
      res.json(authResponse);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── CREATE ROOM ──────────────────────────────
  app.post("/api/multiplayer/rooms", async (req: Request, res: Response) => {
    const { userId, username, gameMode, grade } = req.body as {
      userId: string; username: string; gameMode: GameMode; grade: number;
    };

    const roomId = generateRoomCode();
    const room: Room = {
      id: roomId,
      hostUserId: userId,
      gameMode: gameMode || "battle",
      grade: grade || 3,
      maxPlayers: 2,
      status: "waiting",
      players: {
        [userId]: { userId, username, score: 0, ready: false, answeredCurrent: false },
      },
      questions: [],
      currentQuestionIndex: 0,
      questionStartedAt: 0,
      coopHp: 0,
      coopTurn: null,
      questionTimerHandle: null,
    };

    rooms.set(roomId, room);
    res.json({ roomId, gameMode: room.gameMode, grade: room.grade });
  });

  // ── JOIN ROOM ────────────────────────────────
  app.post("/api/multiplayer/rooms/:roomId/join", async (req: Request, res: Response) => {
    const { roomId } = req.params;
    const { userId, username } = req.body as { userId: string; username: string };

    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    if (room.status !== "waiting") return res.status(400).json({ error: "Game already started" });
    if (Object.keys(room.players).length >= room.maxPlayers) {
      return res.status(400).json({ error: "Room is full" });
    }

    room.players[userId] = { userId, username, score: 0, ready: false, answeredCurrent: false };

    await broadcast(roomId, "player-joined", {
      userId,
      username,
      playerCount: Object.keys(room.players).length,
      gameMode: room.gameMode,
      grade: room.grade,
    });

    res.json({ ok: true, gameMode: room.gameMode, grade: room.grade, roomId });
  });

  // ── GET ROOM INFO ────────────────────────────
  app.get("/api/multiplayer/rooms/:roomId", (req: Request, res: Response) => {
    const room = rooms.get(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({
      roomId: room.id,
      gameMode: room.gameMode,
      grade: room.grade,
      status: room.status,
      players: Object.values(room.players).map((p) => ({
        userId: p.userId,
        username: p.username,
        score: p.score,
        ready: p.ready,
      })),
    });
  });

  // ── PLAYER READY ─────────────────────────────
  app.post("/api/multiplayer/rooms/:roomId/ready", async (req: Request, res: Response) => {
    const room = rooms.get(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const { userId } = req.body as { userId: string };
    const player = room.players[userId];
    if (!player) return res.status(404).json({ error: "Player not in room" });

    player.ready = true;
    const allReady = Object.values(room.players).every((p) => p.ready);

    await broadcast(room.id, "player-ready", { userId, allReady });

    if (allReady && Object.keys(room.players).length >= 2) {
      setTimeout(() => startGame(room), 1000);
    }

    res.json({ ok: true, allReady });
  });

  // ── SUBMIT ANSWER ────────────────────────────
  app.post("/api/multiplayer/rooms/:roomId/answer", async (req: Request, res: Response) => {
    const room = rooms.get(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const { userId, questionId, answer } = req.body as {
      userId: string; questionId: number; answer: number;
    };

    const player = room.players[userId];
    if (!player) return res.status(404).json({ error: "Player not in room" });

    const timeMs = Date.now() - room.questionStartedAt;
    await handleAnswer(room, player, questionId, answer, timeMs);

    res.json({ ok: true });
  });

  // ── LEAVE ROOM ───────────────────────────────
  app.post("/api/multiplayer/rooms/:roomId/leave", async (req: Request, res: Response) => {
    const room = rooms.get(req.params.roomId);
    if (!room) return res.json({ ok: true });

    const { userId } = req.body as { userId: string };
    const player = room.players[userId];
    const username = player?.username || "Player";

    delete room.players[userId];

    await broadcast(room.id, "player-left", { userId, username });

    if (Object.keys(room.players).length === 0) {
      if (room.questionTimerHandle) clearTimeout(room.questionTimerHandle);
      rooms.delete(room.id);
    } else if (room.status === "active" && room.gameMode === "battle") {
      if (room.questionTimerHandle) clearTimeout(room.questionTimerHandle);
      endGame(room);
    }

    res.json({ ok: true });
  });
}
