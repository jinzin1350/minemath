/**
 * useMultiplayer — client-driven game logic over Pusher
 *
 * Since Lambda is stateless, the HOST client drives the game:
 *  - generates questions (server sends them in create-room response)
 *  - fires game-start, question, question-timeout events via /api/multiplayer/event
 * All clients receive events via Pusher presence channel.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import Pusher, { type Channel } from "pusher-js";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type GameMode = "battle" | "coop";

export interface MPQuestion {
  id: number;
  text: string;
  choices: number[];
  answer: number; // host keeps this; non-host ignores
}

export interface PlayerInfo {
  username: string;
  score: number;
  ready: boolean;
}

export interface PlayerScore {
  score: number;
  username: string;
}

export interface MultiplayerState {
  roomId: string | null;
  gameMode: GameMode | null;
  grade: number | null;
  isHost: boolean;
  status: "idle" | "lobby" | "active" | "finished";
  players: Record<string, PlayerInfo>;
  currentQuestion: MPQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  timeLimit: number;
  lastResult: { userId: string; correct: boolean; points: number } | null;
  coopHp: number;
  coopMaxHp: number;
  coopTurnUserId: string | null;
  gameOver: { winner?: string; scores: Record<string, PlayerScore> } | null;
  error: string | null;
  loading: boolean;
}

const INITIAL: MultiplayerState = {
  roomId: null, gameMode: null, grade: null, isHost: false,
  status: "idle", players: {}, currentQuestion: null,
  questionIndex: 0, totalQuestions: 10, timeLimit: 15000,
  lastResult: null, coopHp: 100, coopMaxHp: 100,
  coopTurnUserId: null, gameOver: null, error: null, loading: false,
};

const QUESTION_TIME_MS = 15000;
const COOP_MAX_HP = 100;

// ─────────────────────────────────────────────
// Pusher singleton
// ─────────────────────────────────────────────

let pusherInstance: Pusher | null = null;
function getPusher(): Pusher {
  if (pusherInstance) return pusherInstance;
  const key = import.meta.env.VITE_PUSHER_KEY as string;
  const cluster = (import.meta.env.VITE_PUSHER_CLUSTER as string) || "us3";
  if (!key) throw new Error("VITE_PUSHER_KEY not set");
  pusherInstance = new Pusher(key, {
    cluster,
    authEndpoint: "/api/multiplayer/auth",
    auth: { params: {} },
  });
  return pusherInstance;
}

// ─────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

// Relay an event through the server → Pusher channel
async function relay(roomId: string, event: string, data: unknown) {
  await api("/api/multiplayer/event", "POST", { roomId, event, data });
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useMultiplayer(userId: string | null, username: string) {
  const [state, setState] = useState<MultiplayerState>({ ...INITIAL });
  const channelRef = useRef<Channel | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const questionsRef = useRef<MPQuestion[]>([]);       // host only
  const scoresRef = useRef<Record<string, number>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionStartRef = useRef<number>(0);
  const coopHpRef = useRef(COOP_MAX_HP);
  const coopTurnRef = useRef<string | null>(null);
  const playersRef = useRef<Record<string, PlayerInfo>>({});
  const currentQIdxRef = useRef(0);
  const answeredRef = useRef<Set<string>>(new Set());

  // ── Cleanup ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const roomId = roomIdRef.current;
      if (channelRef.current && roomId) {
        channelRef.current.unbind_all();
        getPusher().unsubscribe(`presence-room-${roomId}`);
      }
    };
  }, []);

  // ── Host: send next question ──────────────────
  const hostSendQuestion = useCallback(async (roomId: string, idx: number) => {
    const qs = questionsRef.current;
    if (idx >= qs.length) {
      // Game over
      const scores: Record<string, PlayerScore> = {};
      Object.entries(playersRef.current).forEach(([uid, p]) => {
        scores[uid] = { score: p.score, username: p.username };
      });
      let winner: string | undefined;
      let maxScore = -1;
      Object.entries(scoresRef.current).forEach(([uid, score]) => {
        if (score > maxScore) { maxScore = score; winner = uid; }
      });
      await relay(roomId, "game-over", { winner, scores });
      return;
    }

    answeredRef.current = new Set();
    currentQIdxRef.current = idx;
    const q = qs[idx];
    questionStartRef.current = Date.now();

    await relay(roomId, "question", {
      question: { id: q.id, text: q.text, choices: q.choices },
      index: idx,
      total: qs.length,
      timeLimit: QUESTION_TIME_MS,
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await relay(roomId, "question-timeout", { correctAnswer: q.answer, questionId: q.id });
      setTimeout(() => hostSendQuestion(roomId, idx + 1), 1500);
    }, QUESTION_TIME_MS);
  }, []);

  // ── Host: handle answer from anyone ──────────
  const hostHandleAnswer = useCallback(async (
    roomId: string, answerUserId: string, questionId: number, answer: number
  ) => {
    const qs = questionsRef.current;
    const idx = currentQIdxRef.current;
    const q = qs[idx];
    if (!q || q.id !== questionId) return;
    if (answeredRef.current.has(answerUserId)) return;

    answeredRef.current.add(answerUserId);
    const correct = answer === q.answer;
    const timeMs = Date.now() - questionStartRef.current;

    let points = 0;
    if (correct) {
      const frac = Math.max(0, 1 - timeMs / QUESTION_TIME_MS);
      points = Math.round(10 + frac * 90);
      scoresRef.current[answerUserId] = (scoresRef.current[answerUserId] || 0) + points;
      playersRef.current[answerUserId] = {
        ...(playersRef.current[answerUserId] || { username: "", ready: false }),
        score: scoresRef.current[answerUserId],
      };
    }

    await relay(roomId, "answer-result", {
      userId: answerUserId, correct, points, scores: { ...scoresRef.current },
    });

    // All players answered → advance
    const playerIds = Object.keys(playersRef.current);
    const allAnswered = playerIds.every((uid) => answeredRef.current.has(uid));
    if (allAnswered) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setTimeout(() => hostSendQuestion(roomId, idx + 1), 1500);
    }
  }, [hostSendQuestion]);

  // ── Subscribe to Pusher channel ───────────────
  const subscribeToRoom = useCallback((roomId: string, isHost: boolean) => {
    const pusher = getPusher();
    (pusher.config as any).auth = { params: { userId, username } };

    const ch = pusher.subscribe(`presence-room-${roomId}`);
    channelRef.current = ch;

    ch.bind("player-joined", (data: { userId: string; username: string }) => {
      playersRef.current[data.userId] = { username: data.username, score: 0, ready: false };
      setState((s) => ({
        ...s,
        status: "lobby",
        players: {
          ...s.players,
          [data.userId]: { username: data.username, score: 0, ready: false },
        },
      }));
    });

    ch.bind("player-left", (data: { userId: string }) => {
      delete playersRef.current[data.userId];
      setState((s) => {
        const p = { ...s.players };
        delete p[data.userId];
        return { ...s, players: p };
      });
    });

    ch.bind("player-ready", (data: { userId: string; allReady: boolean; readyPlayers: string[] }) => {
      // Update ready state
      if (playersRef.current[data.userId]) {
        playersRef.current[data.userId].ready = true;
      }
      setState((s) => ({
        ...s,
        players: {
          ...s.players,
          [data.userId]: { ...(s.players[data.userId] || { username: "", score: 0 }), ready: true },
        },
      }));

      // Host starts game when all ready
      if (isHost && data.allReady) {
        const rId = roomIdRef.current!;
        // init scores
        Object.keys(playersRef.current).forEach((uid) => { scoresRef.current[uid] = 0; });
        relay(rId, "game-start", {
          questions: questionsRef.current.map(({ answer: _a, ...q }) => q),
          totalQuestions: questionsRef.current.length,
        }).then(() => {
          setTimeout(() => hostSendQuestion(rId, 0), 500);
        });
      }
    });

    ch.bind("game-start", (data: { totalQuestions: number }) => {
      setState((s) => ({
        ...s,
        status: "active",
        totalQuestions: data.totalQuestions || 10,
        gameOver: null,
        lastResult: null,
        coopHp: COOP_MAX_HP,
      }));
    });

    ch.bind("question", (data: { question: MPQuestion; index: number; total: number; timeLimit: number }) => {
      setState((s) => ({
        ...s,
        currentQuestion: data.question,
        questionIndex: data.index,
        totalQuestions: data.total,
        timeLimit: data.timeLimit,
        lastResult: null,
      }));
    });

    ch.bind("answer-result", (data: { userId: string; correct: boolean; points: number; scores: Record<string, number> }) => {
      setState((s) => {
        const updated = { ...s.players };
        Object.entries(data.scores).forEach(([uid, score]) => {
          if (updated[uid]) updated[uid] = { ...updated[uid], score };
        });
        return { ...s, players: updated, lastResult: { userId: data.userId, correct: data.correct, points: data.points } };
      });
    });

    ch.bind("submit-answer", (data: { userId: string; questionId: number; answer: number }) => {
      if (isHost && roomIdRef.current) {
        hostHandleAnswer(roomIdRef.current, data.userId, data.questionId, data.answer);
      }
    });

    ch.bind("question-timeout", () => {
      setState((s) => ({ ...s, lastResult: null }));
    });

    ch.bind("game-over", (data: { winner?: string; scores: Record<string, PlayerScore> }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState((s) => ({ ...s, status: "finished", gameOver: data, currentQuestion: null }));
    });
  }, [userId, username, hostSendQuestion, hostHandleAnswer]);

  // ── Actions ───────────────────────────────────

  const createRoom = useCallback(async (gameMode: GameMode, grade: number) => {
    if (!userId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await api("/api/multiplayer/rooms", "POST", { userId, username, gameMode, grade });
      const roomId: string = data.roomId;
      roomIdRef.current = roomId;
      questionsRef.current = data.questions; // host keeps full questions with answers
      scoresRef.current = { [userId]: 0 };
      playersRef.current = { [userId]: { username, score: 0, ready: false } };

      setState((s) => ({
        ...s, roomId, gameMode: data.gameMode, grade: data.grade,
        status: "lobby", isHost: true, loading: false,
        players: { [userId]: { username, score: 0, ready: false } },
      }));
      subscribeToRoom(roomId, true);
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, [userId, username, subscribeToRoom]);

  const joinRoom = useCallback(async (roomId: string) => {
    if (!userId) return;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      await api(`/api/multiplayer/rooms/${roomId}/join`, "POST", { userId, username });
      roomIdRef.current = roomId;
      playersRef.current[userId] = { username, score: 0, ready: false };
      scoresRef.current[userId] = 0;

      setState((s) => ({
        ...s, roomId, status: "lobby", isHost: false, loading: false,
        players: { ...s.players, [userId]: { username, score: 0, ready: false } },
      }));
      subscribeToRoom(roomId, false);
    } catch (e: any) {
      setState((s) => ({ ...s, loading: false, error: e.message }));
    }
  }, [userId, username, subscribeToRoom]);

  const setReady = useCallback(async () => {
    const roomId = roomIdRef.current;
    if (!roomId || !userId) return;

    // Mark self ready locally
    if (playersRef.current[userId]) playersRef.current[userId].ready = true;
    setState((s) => ({
      ...s,
      players: {
        ...s.players,
        [userId]: { ...(s.players[userId] || { username, score: 0 }), ready: true },
      },
    }));

    // Check if all players are ready
    const allReady = Object.values(playersRef.current).every((p) => p.ready);
    const readyPlayers = Object.keys(playersRef.current).filter((uid) => playersRef.current[uid].ready);

    await relay(roomId, "player-ready", { userId, allReady, readyPlayers });
  }, [userId, username]);

  const submitAnswer = useCallback(async (questionId: number, answer: number) => {
    const roomId = roomIdRef.current;
    if (!roomId || !userId) return;

    if (state.isHost) {
      // Host handles answer directly
      await hostHandleAnswer(roomId, userId, questionId, answer);
    } else {
      // Guest relays answer to host via Pusher
      await relay(roomId, "submit-answer", { userId, questionId, answer });
    }
  }, [userId, state.isHost, hostHandleAnswer]);

  const disconnect = useCallback(async () => {
    const roomId = roomIdRef.current;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (roomId && userId) {
      await api(`/api/multiplayer/rooms/${roomId}/leave`, "POST", { userId, username }).catch(() => {});
      if (channelRef.current) {
        channelRef.current.unbind_all();
        getPusher().unsubscribe(`presence-room-${roomId}`);
        channelRef.current = null;
      }
      roomIdRef.current = null;
    }
    questionsRef.current = [];
    scoresRef.current = {};
    playersRef.current = {};
    setState({ ...INITIAL });
  }, [userId, username]);

  return { state, createRoom, joinRoom, setReady, submitAnswer, disconnect };
}
