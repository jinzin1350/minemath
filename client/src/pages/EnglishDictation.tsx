import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Zap, Keyboard, MousePointer } from "lucide-react";
import { Link } from "wouter";
import { DictationGame } from "@/components/DictationGame";
import { DictationResults } from "@/components/DictationResults";
import { useDictation } from "@/hooks/useDictation";
import type { GameMode, GameState, GameStats } from "@/types/dictation";

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
    
    // Save to database
    saveGameHistory({
      gameMode: stats.mode,
      score: stats.score,
      accuracy: stats.accuracy,
      levelReached: stats.level,
      wordsTotal: stats.totalWords,
      wordsCorrect: stats.correctWords,
    });
    
    // Update user progress
    if (progress) {
      const currentScore = progress.totalScore ?? 0;
      const currentWords = progress.totalWordsPracticed ?? 0;
      const currentCorrect = progress.correctWords ?? 0;
      
      const newTotalScore = currentScore + stats.score;
      const newTotalWords = currentWords + stats.totalWords;
      const newCorrectWords = currentCorrect + stats.correctWords;
      const newAccuracy = Math.round((newCorrectWords / newTotalWords) * 100);
      
      updateProgress({
        totalScore: newTotalScore,
        totalWordsPracticed: newTotalWords,
        correctWords: newCorrectWords,
        accuracy: newAccuracy,
      });
    }
  };

  const handlePlayAgain = () => {
    setGameState("menu");
    setGameStats(null);
  };

  const handleBackToMenu = () => {
    setGameState("menu");
    setGameStats(null);
  };

  const handleExitGame = () => {
    setGameState("menu");
  };

  // Render game states
  if (gameState === "playing") {
    return (
      <DictationGame
        mode={selectedMode}
        level={selectedLevel}
        onGameComplete={handleGameComplete}
        onExit={handleExitGame}
      />
    );
  }

  if (gameState === "results" && gameStats) {
    return (
      <DictationResults
        stats={gameStats}
        onPlayAgain={handlePlayAgain}
        onBackToMenu={handleBackToMenu}
      />
    );
  }

  // Menu state
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 hover-elevate"
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          
          {!progressLoading && progress && (
            <div className="bg-white/90 px-4 py-2 rounded-md">
              <div className="text-sm text-muted-foreground">Your Progress</div>
              <div className="font-bold" data-testid="text-total-score">
                Total Score: {progress.totalScore}
              </div>
              <div className="text-sm" data-testid="text-total-accuracy">
                Accuracy: {progress.accuracy}%
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            English Dictation
          </h1>
          <p className="text-xl text-white/90">
            Listen and spell words correctly!
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-white/95 hover-elevate cursor-pointer">
            <div className="flex items-start gap-4 mb-4">
              <Keyboard className="w-12 h-12 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Type Mode</h2>
                <p className="text-muted-foreground">
                  Type the words you hear
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  onClick={() => handleStartGame("typing", level)}
                  data-testid={`button-typing-level-${level}`}
                  className="hover-elevate"
                >
                  Level {level}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white/95 hover-elevate cursor-pointer">
            <div className="flex items-start gap-4 mb-4">
              <MousePointer className="w-12 h-12 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold mb-2">Multiple Choice</h2>
                <p className="text-muted-foreground">
                  Choose the correct word
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  variant="secondary"
                  onClick={() => handleStartGame("multiple-choice", level)}
                  data-testid={`button-multiple-choice-level-${level}`}
                  className="hover-elevate"
                >
                  Level {level}
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Level Descriptions */}
        <Card className="p-6 bg-white/95">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-600" />
            Level Descriptions
          </h3>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { level: 1, desc: "3-4 letter words" },
              { level: 2, desc: "4-5 letter words" },
              { level: 3, desc: "5-6 letter words" },
              { level: 4, desc: "6-7 letter words" },
              { level: 5, desc: "7+ letter words" },
            ].map((item) => (
              <div key={item.level} className="text-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-bold">Level {item.level}</div>
                  <div className="text-sm text-muted-foreground">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
