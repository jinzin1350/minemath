/**
 * useMultiplayer — Pusher-based real-time multiplayer hook
 *
 * - Communicates with server via REST API calls (/api/multiplayer/*)
 * - Receives real-time events via Pusher presence channel (presence-room-{roomId})
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
  roomId: null,
  gameMode: null,
  grade: null,
  status: "idle",
  players: {},
  currentQuestion: null,
  questionIndex: 0,
  totalQuestions: 10,
  timeLimit: 15000,
  lastResult: null,
  coopHp: 100,
  coopMaxHp: 100,
  coopTurnUserId: null,
  gameOver: null,
  error: null,
  loading: false,
};

// ─────────────────────────────────────────────
// Pusher client (singleton)
// ─────────────────────────────────────────────

let pusherInstance: Pusher | null = null;

function getPusherClient(): Pusher {
  if (pusherInstance) return pusherInstance;

  const key = import.meta.env.VITE_PUSHER_KEY as string;
  const cluster = (import.meta.env.VITE_PUSHER_CLUSTER as string) || "us3";

  if (!key) {
    throw new Error("VITE_PUSHER_KEY env var not set");
  }

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

async function apiCall(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useMultiplayer(userId: string | null, username: string) {
  const [state, setState] = useState<MultiplayerState>({ ...INITIAL });
  const channelRef = useRef<Channel | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // ── Subscribe to Pusher room channel ──────────
  const subscribeToRoom = useCallback(
    (roomId: string) => {
      const pusher = getPusherClient();

      // update auth params to include userId + username
      (pusher.config as any).auth = {
        params: { userId, username },
      };

      const channel = pusher.subscribe(`presence-room-${roomId}`);
      channelRef.current = channel;

      channel.bind("player-joined", (data: any) => {
        setState((s) => ({
          ...s,
          status: "lobby",
          gameMode: data.gameMode ?? s.gameMode,
          grade: data.grade ?? s.grade,
          players: {
            ...s.players,
            [data.userId]: { username: data.username, score: 0, ready: false },
          },
        }));
      });

      channel.bind("player-left", (data: { userId: string }) => {
        setState((s) => {
          const p = { ...s.players };
          delete p[data.userId];
          return { ...s, players: p };
        });
      });

      channel.bind("player-ready", (data: { userId: string; allReady: boolean }) => {
        setState((s) => ({
          ...s,
          players: {
            ...s.players,
            [data.userId]: { ...(s.players[data.userId] || { username: "", score: 0 }), ready: true },
          },
        }));
      });

      channel.bind("game-start", (data: { questions: MPQuestion[] }) => {
        setState((s) => ({
          ...s,
          status: "active",
          totalQuestions: data.questions.length,
          gameOver: null,
          lastResult: null,
          coopHp: s.coopMaxHp,
        }));
      });

      channel.bind("question", (data: { question: MPQuestion; index: number; total: number; timeLimit: number }) => {
        setState((s) => ({
          ...s,
          currentQuestion: data.question,
          questionIndex: data.index,
          totalQuestions: data.total,
          timeLimit: data.timeLimit,
          lastResult: null,
        }));
      });

      channel.bind("answer-result", (data: { userId: string; correct: boolean; points: number; scores: Record<string, number> }) => {
        setState((s) => {
          const updatedPlayers = { ...s.players };
          for (const [uid, score] of Object.entries(data.scores)) {
            if (updatedPlayers[uid]) {
              updatedPlayers[uid] = { ...updatedPlayers[uid], score };
            }
          }
          return {
            ...s,
            players: updatedPlayers,
            lastResult: { userId: data.userId, correct: data.correct, points: data.points },
          };
        });
      });

      channel.bind("coop-damage", (data: { damage: number; hp: number; maxHp: number }) => {
        setState((s) => ({ ...s, coopHp: data.hp, coopMaxHp: data.maxHp }));
      });

      channel.bind("coop-turn", (data: { userId: string }) => {
        setState((s) => ({ ...s, coopTurnUserId: data.userId }));
      });

      channel.bind("question-timeout", () => {
        setState((s) => ({ ...s, lastResult: null }));
      });

      channel.bind("game-over", (data: { winner?: string; scores: Record<string, PlayerScore> }) => {
        setState((s) => ({
          ...s,
          status: "finished",
          gameOver: data,
          currentQuestion: null,
        }));
      });
    },
    [userId, username]
  );

  // ── Cleanup on unmount ────────────────────────
  useEffect(() => {
    return () => {
      if (channelRef.current && roomIdRef.current) {
        channelRef.current.unbind_all();
        getPusherClient().unsubscribe(`presence-room-${roomIdRef.current}`);
      }
    };
  }, []);

  // ── Actions ───────────────────────────────────

  const createRoom = useCallback(
    async (gameMode: GameMode, grade: number) => {
      if (!userId) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await apiCall("/api/multiplayer/rooms", "POST", {
          userId, username, gameMode, grade,
        });
        const roomId: string = data.roomId;
        roomIdRef.current = roomId;

        setState((s) => ({
          ...s,
          roomId,
          gameMode: data.gameMode,
          grade: data.grade,
          status: "lobby",
          loading: false,
          players: {
            [userId]: { username, score: 0, ready: false },
          },
        }));

        subscribeToRoom(roomId);
      } catch (err: any) {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      }
    },
    [userId, username, subscribeToRoom]
  );

  const joinRoom = useCallback(
    async (roomId: string) => {
      if (!userId) return;
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await apiCall(`/api/multiplayer/rooms/${roomId}/join`, "POST", {
          userId, username,
        });
        roomIdRef.current = roomId;

        // Fetch current room state
        const roomData = await apiCall(`/api/multiplayer/rooms/${roomId}`, "GET");

        const players: Record<string, PlayerInfo> = {};
        for (const p of roomData.players as any[]) {
          players[p.userId] = { username: p.username, score: p.score, ready: p.ready };
        }

        setState((s) => ({
          ...s,
          roomId,
          gameMode: data.gameMode,
          grade: data.grade,
          status: "lobby",
          loading: false,
          players,
        }));

        subscribeToRoom(roomId);
      } catch (err: any) {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      }
    },
    [userId, username, subscribeToRoom]
  );

  const setReady = useCallback(async () => {
    const roomId = roomIdRef.current;
    if (!roomId || !userId) return;
    try {
      await apiCall(`/api/multiplayer/rooms/${roomId}/ready`, "POST", { userId });
      setState((s) => ({
        ...s,
        players: {
          ...s.players,
          [userId]: { ...(s.players[userId] || { username, score: 0 }), ready: true },
        },
      }));
    } catch (err: any) {
      setState((s) => ({ ...s, error: err.message }));
    }
  }, [userId, username]);

  const submitAnswer = useCallback(
    async (questionId: number, answer: number) => {
      const roomId = roomIdRef.current;
      if (!roomId || !userId) return;
      try {
        await apiCall(`/api/multiplayer/rooms/${roomId}/answer`, "POST", {
          userId, questionId, answer,
        });
      } catch (err: any) {
        setState((s) => ({ ...s, error: err.message }));
      }
    },
    [userId]
  );

  const disconnect = useCallback(async () => {
    const roomId = roomIdRef.current;
    if (roomId && userId) {
      await apiCall(`/api/multiplayer/rooms/${roomId}/leave`, "POST", { userId }).catch(() => {});
      if (channelRef.current) {
        channelRef.current.unbind_all();
        getPusherClient().unsubscribe(`presence-room-${roomId}`);
        channelRef.current = null;
      }
      roomIdRef.current = null;
    }
    setState({ ...INITIAL });
  }, [userId]);

  return { state, createRoom, joinRoom, setReady, submitAnswer, disconnect };
}
