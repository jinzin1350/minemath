import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMultiplayer } from "@/hooks/useMultiplayer";
import { Button } from "@/components/ui/button";

// ─────────────────────────────────────────────
// Timer bar component
// ─────────────────────────────────────────────

function TimerBar({ timeLimit, onTick }: { timeLimit: number; onTick?: (ms: number) => void }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      const ms = Date.now() - startRef.current;
      setElapsed(ms);
      onTick?.(ms);
      if (ms >= timeLimit) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [timeLimit]);

  const pct = Math.max(0, 100 - (elapsed / timeLimit) * 100);
  const color =
    pct > 50 ? "bg-green-400" : pct > 25 ? "bg-yellow-400" : "bg-red-500";

  return (
    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main battle page
// ─────────────────────────────────────────────

export default function MultiplayerBattle() {
  const [, setLocation] = useLocation();
  const { user } = useAuth() as any;

  const userId: string = user?.id || user?.userId || "guest";
  const username: string = user?.firstName || user?.email?.split("@")[0] || "Player";

  const { state, submitAnswer, disconnect } = useMultiplayer(userId, username);

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const elapsedMsRef = useRef(0);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);

  // Reset UI when a new question arrives
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setShowResult(null);
    elapsedMsRef.current = 0;
  }, [state.currentQuestion?.id]);

  // Show result flash
  useEffect(() => {
    if (state.lastResult) {
      setShowResult(state.lastResult.correct ? "correct" : "wrong");
      const t = setTimeout(() => setShowResult(null), 1200);
      return () => clearTimeout(t);
    }
  }, [state.lastResult]);

  // Redirect to home if not in a game
  useEffect(() => {
    if (state.status === "idle") {
      setLocation("/multiplayer");
    }
  }, [state.status]);

  // ─── Game Over screen ───
  if (state.status === "finished" && state.gameOver) {
    const { winner, scores } = state.gameOver;
    const iWon = winner === userId;
    const sortedPlayers = Object.entries(scores).sort(([, a], [, b]) => b.score - a.score);

    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">{iWon ? "🏆" : state.gameMode === "coop" ? "💀" : "😢"}</div>
          <h1 className="font-pixel text-3xl text-yellow-300">
            {state.gameMode === "coop"
              ? winner
                ? "DRAGON DEFEATED! 🐉"
                : "DRAGON WON... 💀"
              : iWon
              ? "YOU WIN!"
              : "YOU LOSE!"}
          </h1>
          {state.gameMode === "battle" && winner && (
            <p className="text-purple-200 mt-2">
              {winner === userId ? "Congrats!" : `${scores[winner]?.username} wins!`}
            </p>
          )}
        </div>

        {/* Score board */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 w-full max-w-sm mb-6">
          <p className="text-purple-200 text-sm font-semibold mb-4 text-center">Final Scores</p>
          {sortedPlayers.map(([uid, info], idx) => (
            <div
              key={uid}
              className={`flex items-center justify-between py-3 px-4 rounded-xl mb-2 ${
                uid === userId ? "bg-yellow-400/20 border border-yellow-400/40" : "bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{idx === 0 ? "🥇" : "🥈"}</span>
                <span className="text-white font-semibold">
                  {info.username}
                  {uid === userId && <span className="text-yellow-300 text-xs ml-1">(You)</span>}
                </span>
              </div>
              <span className="text-yellow-300 font-pixel text-lg">{info.score}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full max-w-sm">
          <Button
            className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-indigo-900 font-pixel"
            onClick={() => {
              disconnect();
              setLocation("/multiplayer");
            }}
          >
            🔄 PLAY AGAIN
          </Button>
          <Button
            variant="ghost"
            className="flex-1 text-purple-300 hover:text-white border border-purple-400/30"
            onClick={() => {
              disconnect();
              setLocation("/");
            }}
          >
            🏠 HOME
          </Button>
        </div>
      </div>
    );
  }

  // ─── Active game ───
  const { currentQuestion, questionIndex, totalQuestions, timeLimit } = state;
  const players = Object.entries(state.players);
  const myPlayer = state.players[userId];
  const opponent = players.find(([uid]) => uid !== userId);

  const isMyCoopTurn = state.gameMode === "coop" && state.coopTurnUserId === userId;

  const handleAnswer = (choice: number) => {
    if (answered || !currentQuestion) return;
    if (state.gameMode === "coop" && !isMyCoopTurn) return;
    setSelectedAnswer(choice);
    setAnswered(true);
    submitAnswer(currentQuestion.id, choice, elapsedMsRef.current);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800 flex flex-col px-4 pt-4 pb-8">
      {/* ─── Header: scores ─── */}
      <div className="flex items-center justify-between mb-4">
        {/* Me */}
        <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
          <span className="text-xl">👤</span>
          <div>
            <div className="text-white text-xs font-semibold">{myPlayer?.username || username}</div>
            <div className="text-yellow-300 font-pixel text-lg">{myPlayer?.score ?? 0}</div>
          </div>
        </div>

        {/* VS / Co-op indicator */}
        <div className="text-white font-pixel text-lg">
          {state.gameMode === "battle" ? "VS" : "🐉"}
        </div>

        {/* Opponent */}
        {opponent ? (
          <div className="bg-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <div className="text-right">
              <div className="text-white text-xs font-semibold">{opponent[1].username}</div>
              <div className="text-yellow-300 font-pixel text-lg">{opponent[1].score}</div>
            </div>
            <span className="text-xl">🧑</span>
          </div>
        ) : (
          <div className="bg-white/5 rounded-xl px-4 py-2">
            <div className="text-purple-400 text-xs">Waiting...</div>
          </div>
        )}
      </div>

      {/* ─── Co-op HP bar ─── */}
      {state.gameMode === "coop" && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-purple-200 mb-1">
            <span>🐉 Dragon HP</span>
            <span>{state.coopHp} / {state.coopMaxHp}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${(state.coopHp / state.coopMaxHp) * 100}%` }}
            />
          </div>
          {state.coopTurnUserId && (
            <p className="text-center text-xs mt-1 text-purple-200">
              {state.coopTurnUserId === userId
                ? "⚡ Your turn to answer!"
                : `🔄 ${state.players[state.coopTurnUserId]?.username || "Opponent"}'s turn`}
            </p>
          )}
        </div>
      )}

      {/* ─── Question card ─── */}
      {currentQuestion ? (
        <div className="flex-1 flex flex-col">
          {/* Progress & timer */}
          <div className="mb-3">
            <div className="flex justify-between text-purple-200 text-xs mb-1">
              <span>Question {questionIndex + 1} / {totalQuestions}</span>
              <span>⏱</span>
            </div>
            <TimerBar
              timeLimit={timeLimit}
              onTick={(ms) => { elapsedMsRef.current = ms; }}
            />
          </div>

          {/* Question text */}
          <div
            className={`bg-white/10 backdrop-blur rounded-2xl p-8 text-center mb-6 border-2 transition-all ${
              showResult === "correct"
                ? "border-green-400 bg-green-400/10"
                : showResult === "wrong"
                ? "border-red-400 bg-red-400/10"
                : "border-purple-400/30"
            }`}
          >
            {showResult && (
              <div className={`text-4xl mb-2 ${showResult === "correct" ? "text-green-400" : "text-red-400"}`}>
                {showResult === "correct" ? "✅" : "❌"}
              </div>
            )}
            <div className="font-pixel text-4xl text-white drop-shadow-lg">
              {currentQuestion.text}
            </div>
          </div>

          {/* Answer choices */}
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.choices.map((choice) => {
              const isSelected = selectedAnswer === choice;
              const wasCorrect = state.lastResult?.correct && isSelected;
              const wasWrong = !state.lastResult?.correct && isSelected && state.lastResult;
              const disabled = answered || (state.gameMode === "coop" && !isMyCoopTurn);

              return (
                <button
                  key={choice}
                  onClick={() => handleAnswer(choice)}
                  disabled={!!disabled}
                  className={`rounded-2xl py-5 text-2xl font-pixel font-bold transition-all transform active:scale-95 shadow-md ${
                    wasCorrect
                      ? "bg-green-500 text-white scale-105"
                      : wasWrong
                      ? "bg-red-500 text-white"
                      : isSelected
                      ? "bg-yellow-400 text-indigo-900"
                      : disabled
                      ? "bg-white/5 text-gray-500 cursor-not-allowed"
                      : "bg-white/15 text-white hover:bg-white/25 hover:scale-105 cursor-pointer"
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          {/* Result flash */}
          {state.lastResult && (
            <div
              className={`mt-4 text-center font-pixel text-lg ${
                state.lastResult.correct ? "text-green-300" : "text-red-300"
              }`}
            >
              {state.lastResult.userId === userId
                ? state.lastResult.correct
                  ? `+${state.lastResult.points} pts! 🎉`
                  : "Wrong! 💥"
                : state.lastResult.correct
                ? `${state.players[state.lastResult.userId]?.username} got it! (+${state.lastResult.points})`
                : `${state.players[state.lastResult.userId]?.username} missed!`}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl animate-pulse mb-4">⚡</div>
            <div className="font-pixel text-white text-xl">Get Ready!</div>
          </div>
        </div>
      )}
    </div>
  );
}
