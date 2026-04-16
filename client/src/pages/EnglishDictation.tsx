import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { NavBar } from "@/components/NavBar";
import { DictationGame } from "@/components/DictationGame";
import { DictationResults } from "@/components/DictationResults";
import { useDictation } from "@/hooks/useDictation";
import { MinecraftSteve } from "@/components/MinecraftCharacters";
import type { GameMode, GameState, GameStats } from "@/types/dictation";

function FloatingBlock({ emoji, className }: { emoji: string; className: string }) {
  return (
    <div className={`absolute select-none pointer-events-none text-2xl opacity-20 ${className}`}>
      {emoji}
    </div>
  );
}

export default function EnglishDictation() {
  const [gameState, setGameState] = useState<GameState>("menu");
  const [selectedMode, setSelectedMode] = useState<GameMode>("typing");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);

  const { progress, progressLoading, saveGameHistory, updateProgress } = useDictation();

  const handleStartGame = (mode: GameMode, level: number) => {
    setSelectedMode(mode);
    setSelectedLevel(level);
    setGameState("playing");
  };

  const handleGameComplete = (stats: GameStats) => {
    setGameStats(stats);
    setGameState("results");
    saveGameHistory({
      gameMode: stats.mode,
      score: stats.score,
      accuracy: Math.round(stats.accuracy),
      levelReached: stats.level,
      wordsTotal: stats.totalWords,
      wordsCorrect: stats.correctWords,
    });
    if (progress) {
      const newTotal = (progress.totalWordsPracticed ?? 0) + stats.totalWords;
      const newCorrect = (progress.correctWords ?? 0) + stats.correctWords;
      updateProgress({
        totalScore: (progress.totalScore ?? 0) + stats.score,
        totalWordsPracticed: newTotal,
        correctWords: newCorrect,
        accuracy: Math.round((newCorrect / newTotal) * 100),
      });
    }
  };

  const handlePlayAgain = () => { setGameState("menu"); setGameStats(null); };
  const handleBackToMenu = () => { setGameState("menu"); setGameStats(null); };
  const handleExitGame  = () => { setGameState("menu"); setGameStats(null); };

  if (gameState === "playing") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060b14' }}>
        <NavBar />
        <DictationGame mode={selectedMode} level={selectedLevel} onGameComplete={handleGameComplete} onExit={handleExitGame} />
      </div>
    );
  }

  if (gameState === "results" && gameStats) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060b14' }}>
        <NavBar />
        <DictationResults stats={gameStats} onPlayAgain={handlePlayAgain} onBackToMenu={handleBackToMenu} />
      </div>
    );
  }

  // ── MENU ────────────────────────────────────────────────────
  const modes = [
    {
      mode: "typing" as GameMode,
      icon: '⌨️',
      title: 'TYPING MODE',
      desc: 'Listen to the word, then type it correctly!',
      tag: '⌨️ TYPE',
      tagBg: 'bg-blue-700',
      border: 'border-blue-500',
      bar: 'bg-blue-500',
      btn: 'bg-blue-700 border-blue-900 hover:bg-blue-600',
      glow: 'hover:shadow-blue-500/40',
      delay: '0ms',
    },
    {
      mode: "multiple-choice" as GameMode,
      icon: '👆',
      title: 'MULTIPLE CHOICE',
      desc: 'Hear the word and pick the correct spelling!',
      tag: '👆 PICK',
      tagBg: 'bg-emerald-700',
      border: 'border-emerald-500',
      bar: 'bg-emerald-500',
      btn: 'bg-emerald-700 border-emerald-900 hover:bg-emerald-600',
      glow: 'hover:shadow-emerald-500/40',
      delay: '80ms',
    },
    {
      mode: "fill-blanks" as GameMode,
      icon: '⚡',
      title: 'FILL THE BLANK',
      desc: 'Find the missing letter to complete the word!',
      tag: '⚡ FILL',
      tagBg: 'bg-purple-700',
      border: 'border-purple-500',
      bar: 'bg-purple-500',
      btn: 'bg-purple-700 border-purple-900 hover:bg-purple-600',
      glow: 'hover:shadow-purple-500/40',
      delay: '160ms',
    },
  ];

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ background: 'linear-gradient(180deg,#060b14 0%,#0a1a0f 60%,#060b14 100%)', imageRendering: 'pixelated' }}
    >
      <NavBar />

      {/* Floating blocks */}
      <FloatingBlock emoji="📖" className="top-20 left-[5%] animate-float" />
      <FloatingBlock emoji="💎" className="top-16 right-[7%] animate-float-delay" />
      <FloatingBlock emoji="⭐" className="top-36 left-[15%] animate-float-slow" />
      <FloatingBlock emoji="🟩" className="top-28 right-[18%] animate-float" />
      <FloatingBlock emoji="🔤" className="top-48 left-[3%] animate-float-delay hidden md:block" />
      <FloatingBlock emoji="⭐" className="top-52 right-[4%] animate-float-slow hidden md:block" />

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[...Array(18)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-pulse-slow"
            style={{
              width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
              top: `${((i * 73) % 90) + 2}%`, left: `${((i * 61.8) % 98) + 1}%`,
              animationDelay: `${(i * 0.4) % 3}s`, opacity: 0.15 + (i % 5) * 0.06,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-6 pb-24 md:pb-10">

        {/* Hero */}
        <section className="text-center mb-8">
          <h1
            className="font-pixel text-2xl md:text-4xl text-blue-400 mb-1 leading-tight"
            style={{ textShadow: '0 0 24px rgba(96,165,250,0.5), 4px 4px 0 #1e3a8a' }}
          >
            🎧 ENGLISH QUEST
          </h1>
          <p className="font-pixel text-[9px] md:text-[10px] text-emerald-400 tracking-[0.3em] mb-4">
            LISTEN · SPELL · CONQUER
          </p>

          {/* Steve with speech bubble */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex flex-col items-center gap-1">
              <MinecraftSteve scale={1.4} />
              <span className="font-pixel text-[7px] text-emerald-400">STEVE</span>
            </div>
            <div
              className="border-2 border-blue-500 bg-black/80 px-4 py-2 animate-float"
              style={{ boxShadow: '0 0 12px rgba(96,165,250,0.4)' }}
            >
              <p className="font-pixel text-blue-300 text-[10px] md:text-xs">
                {!progressLoading && progress && progress.totalScore > 0
                  ? `SCORE: ${progress.totalScore} ⭐`
                  : 'READY TO LEARN?'}
              </p>
            </div>
          </div>

          {/* Progress pills */}
          {!progressLoading && progress && (
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-[#0d1117] border border-amber-700 px-3 py-1"
                style={{ borderRadius: 0 }}>
                <span className="font-pixel text-[8px] text-amber-400" data-testid="text-total-score">
                  🏆 {progress.totalScore} PTS
                </span>
              </div>
              <div className="bg-[#0d1117] border border-emerald-700 px-3 py-1"
                style={{ borderRadius: 0 }}>
                <span className="font-pixel text-[8px] text-emerald-400" data-testid="text-total-accuracy">
                  🎯 {progress.accuracy}% ACC
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Level selector */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #1d4ed8)' }} />
            <span className="font-pixel text-[8px] text-blue-700 tracking-widest">SELECT LEVEL</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #1d4ed8)' }} />
          </div>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className="font-pixel text-[10px] w-11 h-11 transition-all active:translate-y-0.5"
                style={{
                  borderRadius: 0,
                  background: selectedLevel === lvl ? '#1e3a8a' : '#0d1117',
                  border: `2px solid ${selectedLevel === lvl ? '#3b82f6' : '#1f2937'}`,
                  borderBottom: `4px solid ${selectedLevel === lvl ? '#1e3a8a' : '#111827'}`,
                  color: selectedLevel === lvl ? '#93c5fd' : '#4b5563',
                  boxShadow: selectedLevel === lvl ? '0 0 10px rgba(59,130,246,0.3)' : 'none',
                }}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #374151)' }} />
          <span className="font-pixel text-[8px] text-gray-600 tracking-widest">CHOOSE YOUR MODE</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #374151)' }} />
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {modes.map((m) => (
            <div
              key={m.mode}
              className={`relative flex flex-col bg-[#0d1117] border-2 ${m.border}
                cursor-pointer overflow-hidden transition-all duration-200
                hover:scale-[1.03] hover:shadow-2xl ${m.glow}
                animate-card-in`}
              style={{ animationDelay: m.delay, borderRadius: 0 }}
              onClick={() => handleStartGame(m.mode, selectedLevel)}
            >
              {/* Top color bar */}
              <div className={`h-2 w-full ${m.bar}`} />

              {/* Badge */}
              <div className={`absolute top-3 right-2 ${m.tagBg} px-2 py-0.5`}>
                <span className="font-pixel text-white text-[7px]">{m.tag}</span>
              </div>

              {/* Body */}
              <div className="flex flex-col flex-1 items-center justify-between p-4 pt-5 text-center">
                <div className="text-4xl mb-2 animate-bounce-slow" style={{ animationDelay: m.delay }}>
                  {m.icon}
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5">
                  <h3 className="font-pixel text-[10px] text-white leading-relaxed">{m.title}</h3>
                  <p className="text-gray-400 text-[9px] leading-relaxed px-1">{m.desc}</p>
                </div>
                <button
                  className={`mt-3 w-full py-2.5 font-pixel text-[9px] text-white
                    border-b-4 ${m.btn}
                    transition-all active:border-b-0 active:translate-y-1 tracking-widest`}
                  style={{ borderRadius: 0 }}
                >
                  ▶ PLAY NOW
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="text-center mt-8">
          <p className="font-pixel text-[7px] text-gray-700 tracking-widest">
            📖 LISTEN · SPELL · LEVEL UP · REPEAT 📖
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
