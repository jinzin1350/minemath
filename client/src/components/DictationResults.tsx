import { MinecraftSteve } from "@/components/MinecraftCharacters";
import type { GameStats } from "@/types/dictation";

interface DictationResultsProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

function FloatingBlock({ emoji, className }: { emoji: string; className: string }) {
  return (
    <div className={`absolute select-none pointer-events-none text-2xl opacity-20 ${className}`}>
      {emoji}
    </div>
  );
}

export function DictationResults({ stats, onPlayAgain, onBackToMenu }: DictationResultsProps) {
  const { score, accuracy, correctWords, totalWords, level, mode } = stats;

  const perf = accuracy >= 90 ? "SPELLING MASTER!" : accuracy >= 75 ? "GREAT JOB!" : accuracy >= 60 ? "GOOD EFFORT!" : "KEEP PRACTICING!";
  const stars = accuracy >= 90 ? 3 : accuracy >= 75 ? 2 : 1;
  const modeLabel = mode === "typing" ? "TYPING MODE" : mode === "multiple-choice" ? "MULTIPLE CHOICE" : "FILL THE BLANK";
  const steveMsg = accuracy >= 90 ? "YOU CRUSHED IT!" : accuracy >= 75 ? "WELL DONE!" : accuracy >= 60 ? "NOT BAD!" : "TRY AGAIN!";

  return (
    <div className="relative flex-1 overflow-x-hidden pb-20 md:pb-6"
      style={{ background: 'linear-gradient(180deg,#060b14 0%,#0a1a0f 60%,#060b14 100%)', imageRendering: 'pixelated' }}>

      {/* Floating blocks */}
      <FloatingBlock emoji="⭐" className="top-16 left-[5%] animate-float" />
      <FloatingBlock emoji="🏆" className="top-12 right-[7%] animate-float-delay" />
      <FloatingBlock emoji="💎" className="top-32 left-[12%] animate-float-slow" />
      <FloatingBlock emoji="🟩" className="top-24 right-[15%] animate-float" />
      <FloatingBlock emoji="📖" className="top-48 left-[4%] animate-float-delay hidden md:block" />
      <FloatingBlock emoji="⭐" className="top-44 right-[5%] animate-float-slow hidden md:block" />

      {/* Stars background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[...Array(16)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white animate-pulse-slow"
            style={{
              width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
              top: `${((i * 73) % 90) + 2}%`, left: `${((i * 61.8) % 98) + 1}%`,
              animationDelay: `${(i * 0.4) % 3}s`, opacity: 0.15 + (i % 5) * 0.06,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">

        {/* Title */}
        <div className="text-center mb-5">
          <h1
            className="font-pixel text-xl md:text-2xl text-amber-400 mb-1 leading-tight"
            style={{ textShadow: '0 0 20px rgba(251,191,36,0.4), 4px 4px 0 #78350f' }}
            data-testid="text-results-title">
            🏆 GAME COMPLETE!
          </h1>
          <span className="font-pixel text-[8px] text-gray-600 bg-black/40 px-3 py-1"
            style={{ border: '1px solid #374151' }}>
            {modeLabel} · LEVEL {level}
          </span>
        </div>

        {/* Steve + speech bubble */}
        <div className="flex items-end gap-3 mb-5">
          <div className="flex-none flex flex-col items-center">
            <MinecraftSteve scale={1.3} />
            <span className="font-pixel text-[6px] text-emerald-500 mt-0.5">STEVE</span>
          </div>
          <div className="flex-1 bg-[#0d1117] border-2 border-amber-600 p-3 relative animate-float"
            style={{ boxShadow: '0 0 14px rgba(217,119,6,0.25)' }}>
            {/* triangle pointer */}
            <div className="absolute left-0 bottom-3 w-0 h-0"
              style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '8px solid #b45309', transform: 'translateX(-8px)' }} />
            <p className="font-pixel text-[11px] text-amber-300" data-testid="text-performance-message">
              {steveMsg}
            </p>
            <p className="font-pixel text-[8px] text-amber-700 mt-1">{perf}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-4 mb-5">
          {[0, 1, 2].map(i => (
            <span key={i} className="text-3xl transition-all"
              style={{ opacity: i < stars ? 1 : 0.12, filter: i < stars ? 'drop-shadow(0 0 6px rgba(251,191,36,0.6))' : 'grayscale(1)' }}
              data-testid={`star-${i}`}>⭐</span>
          ))}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {[
            { label: 'SCORE',    value: score,                        color: '#3b82f6', glow: 'rgba(59,130,246,0.2)',   testid: 'text-score' },
            { label: 'ACCURACY', value: `${accuracy}%`,               color: '#10b981', glow: 'rgba(16,185,129,0.2)',  testid: 'text-accuracy' },
            { label: 'CORRECT',  value: `${correctWords}/${totalWords}`, color: '#a855f7', glow: 'rgba(168,85,247,0.2)', testid: 'text-correct-words' },
            { label: 'STARS',    value: `${stars}/3`,                 color: '#f59e0b', glow: 'rgba(245,158,11,0.2)',  testid: 'text-level' },
          ].map(s => (
            <div key={s.label} className="text-center py-4 bg-[#0d1117]"
              style={{ border: `2px solid ${s.color}`, boxShadow: `0 0 10px ${s.glow}` }}>
              {/* top color bar */}
              <div className="h-1 w-full mb-2" style={{ background: s.color }} />
              <div className="font-pixel text-2xl mb-1" style={{ color: s.color, textShadow: `0 0 8px ${s.glow}` }}
                data-testid={s.testid}>{s.value}</div>
              <div className="font-pixel text-[8px] text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mb-6">
          <button onClick={onBackToMenu} data-testid="button-back-to-menu"
            className="flex-1 py-3 font-pixel text-[10px] text-gray-300 tracking-wider
              bg-gray-800 border-b-4 border-gray-900 hover:bg-gray-700
              transition-all active:border-b-0 active:translate-y-1"
            style={{ borderRadius: 0 }}>
            ← MENU
          </button>
          <button onClick={onPlayAgain} data-testid="button-play-again"
            className="flex-1 py-3 font-pixel text-[10px] text-white tracking-wider
              bg-emerald-700 border-b-4 border-emerald-900 hover:bg-emerald-600
              transition-all active:border-b-0 active:translate-y-1"
            style={{ borderRadius: 0 }}>
            ▶ PLAY AGAIN
          </button>
        </div>

        {/* Bottom tagline */}
        <div className="text-center">
          <p className="font-pixel text-[7px] text-gray-700 tracking-widest">
            📖 LISTEN · SPELL · LEVEL UP · REPEAT 📖
          </p>
        </div>

      </div>
    </div>
  );
}
