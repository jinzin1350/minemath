import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// Types (mirrored from server/multiplayer.ts)
// ─────────────────────────────────────────────

export interface MPQuestion {
  id: number;
  text: string;
  choices: number[];
}

export type GameMode = "battle" | "coop";

export interface PlayerScore {
  score: number;
  username: string;
}

export type ServerMsg =
  | { type: "ROOM_CREATED"; roomId: string; gameMode: string; grade: number }
  | { type: "PLAYER_JOINED"; userId: string; username: string; playerCount: number }
  | { type: "PLAYER_LEFT"; userId: string; username: string }
  | { type: "PLAYER_READY_UPDATE"; userId: string; allReady: boolean }
  | { type: "GAME_START"; questions: MPQuestion[] }
  | { type: "QUESTION"; question: MPQuestion; index: number; total: number; timeLimit: number }
  | { type: "ANSWER_RESULT"; userId: string; correct: boolean; points: number; scores: Record<string, number> }
  | { type: "COOP_DAMAGE"; damage: number; hp: number; maxHp: number }
  | { type: "COOP_TURN"; userId: string }
  | { type: "QUESTION_TIMEOUT"; correctAnswer: number }
  | { type: "GAME_OVER"; winner?: string; scores: Record<string, PlayerScore> }
  | { type: "ERROR"; message: string }
  | { type: "PING" };

export type ClientMsg =
  | { type: "CREATE_ROOM"; gameMode: GameMode; grade: number; username: string }
  | { type: "JOIN_ROOM"; roomId: string; username: string }
  | { type: "PLAYER_READY" }
  | { type: "SUBMIT_ANSWER"; questionId: number; answer: number; timeMs: number };

// ─────────────────────────────────────────────
// Game state
// ─────────────────────────────────────────────

export interface MultiplayerState {
  connected: boolean;
  roomId: string | null;
  gameMode: GameMode | null;
  grade: number | null;
  players: Record<string, { username: string; score: number; ready: boolean }>;
  myUserId: string | null;
  status: "idle" | "lobby" | "active" | "finished";
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
}

const initialState: MultiplayerState = {
  connected: false,
  roomId: null,
  gameMode: null,
  grade: null,
  players: {},
  myUserId: null,
  status: "idle",
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
};

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useMultiplayer(userId: string | null, username: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<MultiplayerState>({ ...initialState, myUserId: userId });

  // Update myUserId when userId changes
  useEffect(() => {
    setState((s) => ({ ...s, myUserId: userId }));
  }, [userId]);

  const connect = useCallback(() => {
    if (!userId) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.host;
    const url = `${protocol}://${host}/ws/multiplayer?userId=${encodeURIComponent(userId)}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setState((s) => ({ ...s, connected: true, error: null }));
    };

    ws.onclose = () => {
      setState((s) => ({ ...s, connected: false }));
    };

    ws.onerror = () => {
      setState((s) => ({ ...s, error: "Connection error" }));
    };

    ws.onmessage = (event) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "PING") return; // ignore pings

      setState((s) => handleServerMsg(s, msg, userId));
    };
  }, [userId]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setState({ ...initialState, myUserId: userId });
  }, [userId]);

  const send = useCallback((msg: ClientMsg) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const createRoom = useCallback(
    (gameMode: GameMode, grade: number) => {
      connect();
      // Small delay to let connection open
      setTimeout(() => {
        send({ type: "CREATE_ROOM", gameMode, grade, username });
      }, 300);
    },
    [connect, send, username]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      connect();
      setTimeout(() => {
        send({ type: "JOIN_ROOM", roomId: roomId.trim(), username });
      }, 300);
    },
    [connect, send, username]
  );

  const setReady = useCallback(() => {
    send({ type: "PLAYER_READY" });
  }, [send]);

  const submitAnswer = useCallback(
    (questionId: number, answer: number, timeMs: number) => {
      send({ type: "SUBMIT_ANSWER", questionId, answer, timeMs });
    },
    [send]
  );

  // Auto-disconnect on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { state, createRoom, joinRoom, setReady, submitAnswer, disconnect };
}

// ─────────────────────────────────────────────
// State reducer (pure)
// ─────────────────────────────────────────────

function handleServerMsg(
  s: MultiplayerState,
  msg: ServerMsg,
  myUserId: string
): MultiplayerState {
  switch (msg.type) {
    case "ROOM_CREATED":
      return {
        ...s,
        roomId: msg.roomId,
        gameMode: msg.gameMode as GameMode,
        grade: msg.grade,
        status: "lobby",
        players: {
          ...s.players,
          [myUserId]: { username: s.players[myUserId]?.username || "You", score: 0, ready: false },
        },
      };

    case "PLAYER_JOINED":
      return {
        ...s,
        status: s.status === "idle" ? "lobby" : s.status,
        players: {
          ...s.players,
          [msg.userId]: { username: msg.username, score: 0, ready: false },
        },
      };

    case "PLAYER_LEFT": {
      const newPlayers = { ...s.players };
      delete newPlayers[msg.userId];
      return { ...s, players: newPlayers };
    }

    case "PLAYER_READY_UPDATE":
      return {
        ...s,
        players: {
          ...s.players,
          [msg.userId]: { ...(s.players[msg.userId] || { username: "", score: 0 }), ready: true },
        },
      };

    case "GAME_START":
      return {
        ...s,
        status: "active",
        totalQuestions: msg.questions.length,
        gameOver: null,
        lastResult: null,
        coopHp: s.coopMaxHp,
      };

    case "QUESTION":
      return {
        ...s,
        currentQuestion: msg.question,
        questionIndex: msg.index,
        totalQuestions: msg.total,
        timeLimit: msg.timeLimit,
        lastResult: null,
      };

    case "ANSWER_RESULT": {
      const updatedPlayers = { ...s.players };
      Object.entries(msg.scores).forEach(([uid, score]) => {
        if (updatedPlayers[uid]) {
          updatedPlayers[uid] = { ...updatedPlayers[uid], score };
        }
      });
      return {
        ...s,
        players: updatedPlayers,
        lastResult: { userId: msg.userId, correct: msg.correct, points: msg.points },
      };
    }

    case "COOP_DAMAGE":
      return { ...s, coopHp: msg.hp, coopMaxHp: msg.maxHp };

    case "COOP_TURN":
      return { ...s, coopTurnUserId: msg.userId };

    case "QUESTION_TIMEOUT":
      return { ...s, lastResult: null };

    case "GAME_OVER":
      return {
        ...s,
        status: "finished",
        gameOver: { winner: msg.winner, scores: msg.scores },
        currentQuestion: null,
      };

    case "ERROR":
      return { ...s, error: msg.message };

    default:
      return s;
  }
}
