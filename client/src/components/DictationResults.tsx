import { Trophy, Star, Target, TrendingUp, Home, RotateCcw } from "lucide-react";
import type { GameStats } from "@/types/dictation";

interface DictationResultsProps {
  stats: GameStats;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function DictationResults({ stats, onPlayAgain, onBackToMenu }: DictationResultsProps) {
  const { score, accuracy, correctWords, totalWords, level, mode } = stats;

  const getPerformanceMessage = () => {
    if (accuracy >= 90) return "SPELLING MASTER!";
    if (accuracy >= 75) return "GREAT JOB!";
    if (accuracy >= 60) return "GOOD EFFORT!";
    return "KEEP PRACTICING!";
  };

  const getStarCount = () => {
    if (accuracy >= 90) return 3;
    if (accuracy >= 75) return 2;
    return 1;
  };

  const stars = getStarCount();
  const modeLabel = mode === "typing" ? "TYPING MODE" : mode === "multiple-choice" ? "MULTIPLE CHOICE" : "FILL THE BLANK";

  return (
    <div className="flex-1 bg-gradient-to-b from-blue-900 to-emerald-900 flex items-center justify-center p-4 pb-20 md:pb-4" style={{ imageRendering: 'pixelated' }}>
      <div className="max-w-xl w-full border-4 border-amber-600 bg-gradient-to-b from-slate-900/95 to-emerald-950/95 rounded-lg shadow-2xl p-6">

        {/* Title */}
        <div className="text-center mb-6">
          <Trophy className="w-14 h-14 mx-auto mb-3 text-yellow-400 drop-shadow-lg" />
          <h1 className="font-pixel text-xl text-amber-200 animate-pulse mb-1" data-testid="text-results-title">
            GAME COMPLETE!
          </h1>
          <p className="font-pixel text-sm text-emerald-400" data-testid="text-performance-message">
            {getPerformanceMessage()}
          </p>
          <div className="mt-2">
            <span className="font-pixel text-[9px] text-cyan-400 bg-black/40 border border-cyan-800 px-3 py-1 rounded-md">
              {modeLabel} · LEVEL {level}
            </span>
          </div>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`w-10 h-10 ${
                i < stars
                  ? "fill-yellow-400 text-yellow-400 drop-shadow-lg"
                  : "fill-gray-700 text-gray-700"
              }`}
              data-testid={`star-${i}`}
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="text-center p-4 bg-black/40 border-2 border-blue-800 rounded-lg">
            <Target className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="font-pixel text-2xl text-blue-300" data-testid="text-score">
              {score}
            </div>
            <div className="font-pixel text-[9px] text-blue-500 mt-1">SCORE</div>
          </div>

          <div className="text-center p-4 bg-black/40 border-2 border-emerald-800 rounded-lg">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
            <div className="font-pixel text-2xl text-emerald-300" data-testid="text-accuracy">
              {accuracy}%
            </div>
            <div className="font-pixel text-[9px] text-emerald-500 mt-1">ACCURACY</div>
          </div>

          <div className="text-center p-4 bg-black/40 border-2 border-purple-800 rounded-lg">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-400" />
            <div className="font-pixel text-2xl text-purple-300" data-testid="text-correct-words">
              {correctWords}/{totalWords}
            </div>
            <div className="font-pixel text-[9px] text-purple-500 mt-1">CORRECT</div>
          </div>

          <div className="text-center p-4 bg-black/40 border-2 border-amber-800 rounded-lg">
            <Star className="w-6 h-6 mx-auto mb-2 text-amber-400" />
            <div className="font-pixel text-2xl text-amber-300" data-testid="text-level">
              {stars}/3
            </div>
            <div className="font-pixel text-[9px] text-amber-500 mt-1">STARS</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onBackToMenu}
            data-testid="button-back-to-menu"
            className="flex-1 py-4 font-pixel text-xs border-4 border-gray-600 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            MENU
          </button>
          <button
            onClick={onPlayAgain}
            data-testid="button-play-again"
            className="flex-1 py-4 font-pixel text-xs border-4 border-green-700 bg-green-800 hover:bg-green-700 text-white rounded-lg hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
