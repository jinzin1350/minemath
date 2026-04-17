import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useMultiplayer, type GameMode } from "@/hooks/useMultiplayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Grade selector options
const GRADES = [2, 3, 4, 5, 6, 7, 8];

export default function MultiplayerLobby() {
  const [, setLocation] = useLocation();
  const { user } = useAuth() as any;

  const userId: string = user?.id || user?.userId || "guest";
  const username: string = user?.firstName || user?.email?.split("@")[0] || "Player";

  const { state, createRoom, joinRoom, setReady } = useMultiplayer(userId, username);

  const [tab, setTab] = useState<"create" | "join">("create");
  const [selectedMode, setSelectedMode] = useState<GameMode>("battle");
  const [selectedGrade, setSelectedGrade] = useState(3);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  // If game is starting → go to battle page
  if (state.status === "active") {
    setLocation("/multiplayer/battle");
    return null;
  }

  const handleCreate = () => {
    createRoom(selectedMode, selectedGrade);
  };

  const handleJoin = () => {
    if (joinCode.trim().length < 4) {
      setJoinError("Enter a 4-digit room code");
      return;
    }
    setJoinError("");
    joinRoom(joinCode);
  };

  const allPlayerIds = Object.keys(state.players);
  const myReady = state.players[userId]?.ready ?? false;
  const allReady = allPlayerIds.length >= 2 && allPlayerIds.every((id) => state.players[id].ready);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-800 flex flex-col items-center justify-start pt-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">⚔️</div>
        <h1 className="font-pixel text-3xl text-yellow-300 drop-shadow-lg">MATH BATTLE</h1>
        <p className="text-purple-200 mt-1 text-sm">Challenge a friend in real-time!</p>
      </div>

      {/* Error banner */}
      {state.error && (
        <div className="bg-red-600/80 text-white rounded-xl px-6 py-3 mb-4 text-sm font-semibold">
          ⚠️ {state.error}
        </div>
      )}

      {/* ─── LOBBY VIEW (after room is created/joined) ─── */}
      {state.status === "lobby" && state.roomId ? (
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-purple-400/30">
            {/* Room code */}
            <div className="text-center mb-6">
              <p className="text-purple-200 text-sm mb-1">Room Code</p>
              <div className="bg-yellow-400 text-indigo-900 font-pixel text-4xl rounded-xl py-3 px-6 tracking-widest shadow-lg">
                {state.roomId}
              </div>
              <p className="text-purple-300 text-xs mt-2">Share this code with your friend</p>
            </div>

            {/* Mode & Grade badge */}
            <div className="flex gap-2 justify-center mb-6">
              <span className="bg-purple-600/60 text-white text-xs px-3 py-1 rounded-full">
                {state.gameMode === "battle" ? "⚔️ Battle" : "🐉 Co-op Dragon"}
              </span>
              <span className="bg-blue-600/60 text-white text-xs px-3 py-1 rounded-full">
                Grade {state.grade}
              </span>
            </div>

            {/* Players list */}
            <div className="mb-6">
              <p className="text-purple-200 text-sm mb-3 font-semibold">Players ({allPlayerIds.length}/2)</p>
              <div className="space-y-2">
                {allPlayerIds.map((uid) => {
                  const p = state.players[uid];
                  return (
                    <div
                      key={uid}
                      className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{uid === userId ? "👤" : "🧑"}</span>
                        <span className="text-white font-semibold">
                          {p.username}
                          {uid === userId && (
                            <span className="text-purple-300 text-xs ml-2">(You)</span>
                          )}
                          {uid === state.roomId && (
                            <span className="text-yellow-300 text-xs ml-2">👑 Host</span>
                          )}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          p.ready
                            ? "bg-green-500/80 text-white"
                            : "bg-gray-500/50 text-gray-300"
                        }`}
                      >
                        {p.ready ? "✓ READY" : "waiting..."}
                      </span>
                    </div>
                  );
                })}

                {allPlayerIds.length < 2 && (
                  <div className="flex items-center justify-center bg-white/5 rounded-xl px-4 py-3 border-2 border-dashed border-purple-500/40">
                    <span className="text-purple-400 text-sm">Waiting for opponent...</span>
                    <span className="ml-2 animate-pulse">🔄</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ready button */}
            <Button
              className={`w-full font-pixel text-lg py-6 rounded-xl transition-all ${
                myReady
                  ? "bg-green-600 hover:bg-green-700 cursor-default"
                  : "bg-yellow-500 hover:bg-yellow-400 text-indigo-900"
              }`}
              onClick={() => !myReady && setReady()}
              disabled={myReady}
            >
              {myReady ? "✅ READY!" : "⚡ I'M READY"}
            </Button>

            {allReady && (
              <p className="text-green-300 text-center text-sm mt-3 animate-pulse font-semibold">
                🚀 All ready! Game starting...
              </p>
            )}
          </div>

          <Button
            variant="ghost"
            className="mt-4 w-full text-purple-300 hover:text-white"
            onClick={() => window.location.reload()}
          >
            ← Leave Room
          </Button>
        </div>
      ) : (
        /* ─── SETUP VIEW ─── */
        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/10 rounded-xl p-1">
            <button
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                tab === "create"
                  ? "bg-yellow-400 text-indigo-900"
                  : "text-purple-200 hover:text-white"
              }`}
              onClick={() => setTab("create")}
            >
              ✨ Create Room
            </button>
            <button
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                tab === "join"
                  ? "bg-yellow-400 text-indigo-900"
                  : "text-purple-200 hover:text-white"
              }`}
              onClick={() => setTab("join")}
            >
              🔑 Join Room
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-purple-400/30">
            {tab === "create" ? (
              <>
                {/* Game Mode */}
                <div className="mb-6">
                  <p className="text-purple-200 text-sm mb-3 font-semibold">Game Mode</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["battle", "coop"] as GameMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSelectedMode(mode)}
                        className={`rounded-xl p-4 text-center transition-all border-2 ${
                          selectedMode === mode
                            ? "border-yellow-400 bg-yellow-400/20"
                            : "border-purple-500/30 bg-white/5 hover:border-purple-400"
                        }`}
                      >
                        <div className="text-3xl mb-1">{mode === "battle" ? "⚔️" : "🐉"}</div>
                        <div className="text-white font-semibold text-sm">
                          {mode === "battle" ? "Math Battle" : "Co-op Dragon"}
                        </div>
                        <div className="text-purple-300 text-xs mt-1">
                          {mode === "battle" ? "Race to answer first!" : "Defeat the dragon together!"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade */}
                <div className="mb-6">
                  <p className="text-purple-200 text-sm mb-3 font-semibold">Grade</p>
                  <div className="flex gap-2 flex-wrap">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        onClick={() => setSelectedGrade(g)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                          selectedGrade === g
                            ? "bg-yellow-400 text-indigo-900"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full bg-green-500 hover:bg-green-400 text-white font-pixel text-lg py-6 rounded-xl"
                  onClick={handleCreate}
                  disabled={!state.connected && state.status === "idle"}
                >
                  🎮 CREATE ROOM
                </Button>
              </>
            ) : (
              <>
                <p className="text-purple-200 text-sm mb-3 font-semibold">Enter Room Code</p>
                <Input
                  className="bg-white/10 border-purple-400/40 text-white text-center text-3xl font-pixel tracking-widest mb-2 h-16 rounded-xl"
                  placeholder="1234"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ""))}
                />
                {joinError && (
                  <p className="text-red-400 text-sm mb-3">{joinError}</p>
                )}
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-indigo-900 font-pixel text-lg py-6 rounded-xl mt-4"
                  onClick={handleJoin}
                >
                  🔑 JOIN ROOM
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            className="mt-4 w-full text-purple-300 hover:text-white"
            onClick={() => setLocation("/")}
          >
            ← Back to Home
          </Button>
        </div>
      )}
    </div>
  );
}
