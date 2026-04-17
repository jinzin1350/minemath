import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  answer: number;
  choices: number[];
}

interface Player {
  userId: string;
  username: string;
  ws: WebSocket;
  score: number;
  ready: boolean;
  answeredCurrent: boolean;
}

interface Room {
  id: string;
  hostUserId: string;
  gameMode: "battle" | "coop";
  grade: number;
  players: Map<string, Player>;
  status: "waiting" | "active" | "finished";
  questions: Question[];
  currentQuestionIndex: number;
  questionTimer: ReturnType<typeof setTimeout> | null;
  coopHp: number; // for coop mode
  coopTurn: string | null; // userId whose turn it is
}

// Client → Server messages
type ClientMsg =
  | { type: "CREATE_ROOM"; gameMode: "battle" | "coop"; grade: number; username: string }
  | { type: "JOIN_ROOM"; roomId: string; username: string }
  | { type: "PLAYER_READY" }
  | { type: "SUBMIT_ANSWER"; questionId: number; answer: number; timeMs: number };

// Server → Client messages
type ServerMsg =
  | { type: "ROOM_CREATED"; roomId: string; gameMode: string; grade: number }
  | { type: "PLAYER_JOINED"; userId: string; username: string; playerCount: number }
  | { type: "PLAYER_LEFT"; userId: string; username: string }
  | { type: "PLAYER_READY_UPDATE"; userId: string; allReady: boolean }
  | { type: "GAME_START"; questions: Omit<Question, "answer">[] }
  | { type: "QUESTION"; question: Omit<Question, "answer">; index: number; total: number; timeLimit: number }
  | { type: "ANSWER_RESULT"; userId: string; correct: boolean; points: number; scores: Record<string, number> }
  | { type: "COOP_DAMAGE"; damage: number; hp: number; maxHp: number }
  | { type: "COOP_TURN"; userId: string }
  | { type: "QUESTION_TIMEOUT"; correctAnswer: number }
  | { type: "GAME_OVER"; winner?: string; scores: Record<string, { score: number; username: string }> }
  | { type: "ERROR"; message: string }
  | { type: "PING" };

// ─────────────────────────────────────────────
// In-memory room store
// ─────────────────────────────────────────────

const rooms = new Map<string, Room>();
// Map WebSocket → userId + roomId
const wsMap = new Map<WebSocket, { userId: string; roomId: string }>();

// ─────────────────────────────────────────────
// Question generator
// ─────────────────────────────────────────────

function generateQuestion(grade: number, id: number): Question {
  let a: number, b: number, op: string, answer: number, text: string;

  if (grade <= 3) {
    // Grade 2-3: addition / subtraction
    const useAdd = Math.random() > 0.4;
    if (useAdd) {
      a = Math.floor(Math.random() * 50) + 1;
      b = Math.floor(Math.random() * 50) + 1;
      answer = a + b;
      text = `${a} + ${b} = ?`;
    } else {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * (a - 1)) + 1;
      answer = a - b;
      text = `${a} − ${b} = ?`;
    }
  } else if (grade <= 5) {
    // Grade 4-5: multiplication
    a = Math.floor(Math.random() * 10) + 2;
    b = Math.floor(Math.random() * 10) + 2;
    answer = a * b;
    text = `${a} × ${b} = ?`;
  } else {
    // Grade 6-8: multiplication / division
    const useMult = Math.random() > 0.4;
    if (useMult) {
      a = Math.floor(Math.random() * 12) + 3;
      b = Math.floor(Math.random() * 12) + 3;
      answer = a * b;
      text = `${a} × ${b} = ?`;
    } else {
      b = Math.floor(Math.random() * 11) + 2;
      answer = Math.floor(Math.random() * 11) + 2;
      a = b * answer;
      text = `${a} ÷ ${b} = ?`;
    }
  }

  // Generate 3 wrong choices close to correct answer
  const wrongSet = new Set<number>();
  while (wrongSet.size < 3) {
    const delta = Math.floor(Math.random() * 10) - 5;
    const wrong = answer + (delta === 0 ? 1 : delta);
    if (wrong !== answer && wrong > 0) wrongSet.add(wrong);
  }

  const choices = [...wrongSet, answer].sort(() => Math.random() - 0.5);

  return { id, text, answer, choices };
}

function generateQuestions(grade: number, count = 10): Question[] {
  return Array.from({ length: count }, (_, i) => generateQuestion(grade, i));
}

// ─────────────────────────────────────────────
// Room code generator
// ─────────────────────────────────────────────

function generateRoomCode(): string {
  let code: string;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

// ─────────────────────────────────────────────
// Send helper
// ─────────────────────────────────────────────

function send(ws: WebSocket, msg: ServerMsg) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcast(room: Room, msg: ServerMsg, excludeUserId?: string) {
  room.players.forEach((player) => {
    if (player.userId !== excludeUserId) {
      send(player.ws, msg);
    }
  });
}

function broadcastAll(room: Room, msg: ServerMsg) {
  broadcast(room, msg);
}

// ─────────────────────────────────────────────
// Scores helper
// ─────────────────────────────────────────────

function getScores(room: Room): Record<string, { score: number; username: string }> {
  const scores: Record<string, { score: number; username: string }> = {};
  room.players.forEach((p) => {
    scores[p.userId] = { score: p.score, username: p.username };
  });
  return scores;
}

function getScoreMap(room: Room): Record<string, number> {
  const scores: Record<string, number> = {};
  room.players.forEach((p) => {
    scores[p.userId] = p.score;
  });
  return scores;
}

// ─────────────────────────────────────────────
// Game loop
// ─────────────────────────────────────────────

const QUESTION_TIME_MS = 15000; // 15 seconds per question
const COOP_MAX_HP = 100;

function startGame(room: Room) {
  room.status = "active";
  room.questions = generateQuestions(room.grade, 10);
  room.currentQuestionIndex = 0;

  if (room.gameMode === "coop") {
    room.coopHp = COOP_MAX_HP;
    const firstPlayer = Array.from(room.players.keys())[0];
    room.coopTurn = firstPlayer;
  }

  // Reset scores
  room.players.forEach((p) => {
    p.score = 0;
    p.answeredCurrent = false;
  });

  broadcastAll(room, {
    type: "GAME_START",
    questions: room.questions.map(({ answer: _a, ...q }) => q),
  });

  sendNextQuestion(room);
}

function sendNextQuestion(room: Room) {
  if (room.currentQuestionIndex >= room.questions.length) {
    endGame(room);
    return;
  }

  // Reset answered flags
  room.players.forEach((p) => (p.answeredCurrent = false));

  const q = room.questions[room.currentQuestionIndex];

  broadcastAll(room, {
    type: "QUESTION",
    question: { id: q.id, text: q.text, choices: q.choices },
    index: room.currentQuestionIndex,
    total: room.questions.length,
    timeLimit: QUESTION_TIME_MS,
  });

  // For coop, broadcast whose turn it is
  if (room.gameMode === "coop" && room.coopTurn) {
    broadcastAll(room, { type: "COOP_TURN", userId: room.coopTurn });
  }

  // Auto-advance after timeout
  if (room.questionTimer) clearTimeout(room.questionTimer);
  room.questionTimer = setTimeout(() => {
    const correct = room.questions[room.currentQuestionIndex].answer;
    broadcastAll(room, { type: "QUESTION_TIMEOUT", correctAnswer: correct });

    // Coop: missed = damage
    if (room.gameMode === "coop") {
      room.coopHp = Math.max(0, room.coopHp - 20);
      broadcastAll(room, {
        type: "COOP_DAMAGE",
        damage: 20,
        hp: room.coopHp,
        maxHp: COOP_MAX_HP,
      });
      if (room.coopHp <= 0) {
        endGame(room);
        return;
      }
      advanceCoopTurn(room);
    }

    room.currentQuestionIndex++;
    sendNextQuestion(room);
  }, QUESTION_TIME_MS);
}

function advanceCoopTurn(room: Room) {
  const playerIds = Array.from(room.players.keys());
  const currentIdx = playerIds.indexOf(room.coopTurn!);
  room.coopTurn = playerIds[(currentIdx + 1) % playerIds.length];
}

function handleAnswer(room: Room, player: Player, questionId: number, answer: number, timeMs: number) {
  if (room.status !== "active") return;
  if (player.answeredCurrent) return;

  const q = room.questions[room.currentQuestionIndex];
  if (!q || q.id !== questionId) return;

  // Coop mode: only the current turn player can answer
  if (room.gameMode === "coop" && room.coopTurn !== player.userId) {
    send(player.ws, { type: "ERROR", message: "Not your turn!" });
    return;
  }

  player.answeredCurrent = true;
  const correct = answer === q.answer;

  // Calculate points: faster = more points (max 100, min 10)
  let points = 0;
  if (correct) {
    const timeFraction = Math.max(0, 1 - timeMs / QUESTION_TIME_MS);
    points = Math.round(10 + timeFraction * 90);
    player.score += points;
  }

  broadcastAll(room, {
    type: "ANSWER_RESULT",
    userId: player.userId,
    correct,
    points,
    scores: getScoreMap(room),
  });

  if (room.gameMode === "coop") {
    if (!correct) {
      // Damage on wrong answer
      const damage = 15;
      room.coopHp = Math.max(0, room.coopHp - damage);
      broadcastAll(room, {
        type: "COOP_DAMAGE",
        damage,
        hp: room.coopHp,
        maxHp: COOP_MAX_HP,
      });
      if (room.coopHp <= 0) {
        if (room.questionTimer) clearTimeout(room.questionTimer);
        endGame(room);
        return;
      }
    }
    // Coop: advance immediately after answer
    if (room.questionTimer) clearTimeout(room.questionTimer);
    advanceCoopTurn(room);
    room.currentQuestionIndex++;
    setTimeout(() => sendNextQuestion(room), 1500); // 1.5s delay to show result
  } else {
    // Battle: check if all players answered
    const allAnswered = Array.from(room.players.values()).every((p) => p.answeredCurrent);
    if (allAnswered) {
      if (room.questionTimer) clearTimeout(room.questionTimer);
      room.currentQuestionIndex++;
      setTimeout(() => sendNextQuestion(room), 1500);
    }
  }
}

function endGame(room: Room) {
  if (room.questionTimer) clearTimeout(room.questionTimer);
  room.status = "finished";

  // Find winner (battle mode)
  let winner: string | undefined;
  if (room.gameMode === "battle") {
    let maxScore = -1;
    room.players.forEach((p) => {
      if (p.score > maxScore) {
        maxScore = p.score;
        winner = p.userId;
      }
    });
  }

  broadcastAll(room, {
    type: "GAME_OVER",
    winner,
    scores: getScores(room),
  });

  // Clean up room after 30 seconds
  setTimeout(() => {
    rooms.delete(room.id);
    room.players.forEach((p) => wsMap.delete(p.ws));
  }, 30000);
}

// ─────────────────────────────────────────────
// WebSocket message handler
// ─────────────────────────────────────────────

function handleMessage(ws: WebSocket, userId: string, raw: string) {
  let msg: ClientMsg;
  try {
    msg = JSON.parse(raw);
  } catch {
    send(ws, { type: "ERROR", message: "Invalid JSON" });
    return;
  }

  switch (msg.type) {
    case "CREATE_ROOM": {
      const roomId = generateRoomCode();
      const room: Room = {
        id: roomId,
        hostUserId: userId,
        gameMode: msg.gameMode,
        grade: msg.grade,
        players: new Map(),
        status: "waiting",
        questions: [],
        currentQuestionIndex: 0,
        questionTimer: null,
        coopHp: 0,
        coopTurn: null,
      };

      const player: Player = {
        userId,
        username: msg.username || "Player 1",
        ws,
        score: 0,
        ready: false,
        answeredCurrent: false,
      };

      room.players.set(userId, player);
      rooms.set(roomId, room);
      wsMap.set(ws, { userId, roomId });

      send(ws, { type: "ROOM_CREATED", roomId, gameMode: msg.gameMode, grade: msg.grade });
      break;
    }

    case "JOIN_ROOM": {
      const room = rooms.get(msg.roomId);
      if (!room) {
        send(ws, { type: "ERROR", message: "Room not found" });
        return;
      }
      if (room.status !== "waiting") {
        send(ws, { type: "ERROR", message: "Game already started" });
        return;
      }
      if (room.players.size >= room.maxPlayers) {
        send(ws, { type: "ERROR", message: "Room is full" });
        return;
      }

      // Remove player from any previous room
      const prev = wsMap.get(ws);
      if (prev) {
        const prevRoom = rooms.get(prev.roomId);
        if (prevRoom) prevRoom.players.delete(prev.userId);
      }

      const player: Player = {
        userId,
        username: msg.username || `Player ${room.players.size + 1}`,
        ws,
        score: 0,
        ready: false,
        answeredCurrent: false,
      };

      room.players.set(userId, player);
      wsMap.set(ws, { userId, roomId: room.id });

      // Tell the newcomer about existing players
      room.players.forEach((p) => {
        if (p.userId !== userId) {
          send(ws, {
            type: "PLAYER_JOINED",
            userId: p.userId,
            username: p.username,
            playerCount: room.players.size,
          });
        }
      });

      // Tell everyone else about the newcomer
      broadcast(room, {
        type: "PLAYER_JOINED",
        userId,
        username: player.username,
        playerCount: room.players.size,
      }, userId);

      // Also send ROOM_CREATED info back to joiner (so they know mode/grade)
      send(ws, { type: "ROOM_CREATED", roomId: room.id, gameMode: room.gameMode, grade: room.grade });
      break;
    }

    case "PLAYER_READY": {
      const info = wsMap.get(ws);
      if (!info) return;
      const room = rooms.get(info.roomId);
      if (!room) return;
      const player = room.players.get(userId);
      if (!player) return;

      player.ready = true;
      const allReady = Array.from(room.players.values()).every((p) => p.ready);

      broadcastAll(room, { type: "PLAYER_READY_UPDATE", userId, allReady });

      // Start game when all players are ready (min 2 players)
      if (allReady && room.players.size >= 2) {
        setTimeout(() => startGame(room), 1000);
      }
      break;
    }

    case "SUBMIT_ANSWER": {
      const info = wsMap.get(ws);
      if (!info) return;
      const room = rooms.get(info.roomId);
      if (!room) return;
      const player = room.players.get(userId);
      if (!player) return;

      handleAnswer(room, player, msg.questionId, msg.answer, msg.timeMs);
      break;
    }
  }
}

// ─────────────────────────────────────────────
// Disconnect handler
// ─────────────────────────────────────────────

function handleDisconnect(ws: WebSocket) {
  const info = wsMap.get(ws);
  if (!info) return;

  wsMap.delete(ws);

  const room = rooms.get(info.roomId);
  if (!room) return;

  const player = room.players.get(info.userId);
  const username = player?.username || "Player";

  room.players.delete(info.userId);

  if (room.players.size === 0) {
    // Last player left — delete room
    if (room.questionTimer) clearTimeout(room.questionTimer);
    rooms.delete(room.id);
    return;
  }

  broadcast(room, { type: "PLAYER_LEFT", userId: info.userId, username });

  // If game was active and only 1 player remains → end game
  if (room.status === "active" && room.players.size < 2 && room.gameMode === "battle") {
    if (room.questionTimer) clearTimeout(room.questionTimer);
    endGame(room);
  }
}

// ─────────────────────────────────────────────
// Main setup export
// ─────────────────────────────────────────────

export function setupMultiplayer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws/multiplayer" });

  wss.on("connection", (ws, req) => {
    // Extract userId from query string: /ws/multiplayer?userId=xxx
    const url = new URL(req.url || "", `http://localhost`);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      ws.close(1008, "Missing userId");
      return;
    }

    // Keep-alive ping
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        send(ws, { type: "PING" });
      }
    }, 25000);

    ws.on("message", (data) => {
      handleMessage(ws, userId, data.toString());
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      handleDisconnect(ws);
    });

    ws.on("error", (err) => {
      console.error("[Multiplayer WS] error:", err.message);
      clearInterval(pingInterval);
      handleDisconnect(ws);
    });
  });

  console.log("[Multiplayer] WebSocket server ready at /ws/multiplayer");
}
