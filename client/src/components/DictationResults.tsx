import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    if (accuracy >= 90) return "Excellent! You're a spelling master!";
    if (accuracy >= 75) return "Great job! Keep practicing!";
    if (accuracy >= 60) return "Good effort! You're improving!";
    return "Keep practicing! You can do better!";
  };

  const getStarCount = () => {
    if (accuracy >= 90) return 3;
    if (accuracy >= 75) return 2;
    return 1;
  };

  const stars = getStarCount();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-white/95">
        {/* Title */}
        <div className="text-center mb-8">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-3xl font-bold mb-2" data-testid="text-results-title">
            Game Complete!
          </h1>
          <p className="text-lg text-muted-foreground" data-testid="text-performance-message">
            {getPerformanceMessage()}
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <Star
              key={i}
              className={`w-12 h-12 ${
                i < stars
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-300 text-gray-300"
              }`}
              data-testid={`star-${i}`}
            />
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-blue-900" data-testid="text-score">
              {score}
            </div>
            <div className="text-sm text-blue-700">Total Score</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-green-900" data-testid="text-accuracy">
              {accuracy}%
            </div>
            <div className="text-sm text-green-700">Accuracy</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-purple-900" data-testid="text-correct-words">
              {correctWords}/{totalWords}
            </div>
            <div className="text-sm text-purple-700">Correct Words</div>
          </div>

          <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
            <Star className="w-8 h-8 mx-auto mb-2 text-orange-600" />
            <div className="text-2xl font-bold text-orange-900" data-testid="text-level">
              Level {level}
            </div>
            <div className="text-sm text-orange-700 capitalize">{mode === "typing" ? "Type Mode" : "Multiple Choice"}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            onClick={onBackToMenu}
            variant="outline"
            className="flex-1 py-6 text-lg hover-elevate"
            data-testid="button-back-to-menu"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Menu
          </Button>
          <Button
            onClick={onPlayAgain}
            className="flex-1 py-6 text-lg"
            data-testid="button-play-again"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
