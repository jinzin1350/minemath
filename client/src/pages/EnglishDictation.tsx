import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Zap, Keyboard, MousePointer } from "lucide-react";
import { Link } from "wouter";
import { DictationGame } from "@/components/DictationGame";
import { DictationResults } from "@/components/DictationResults";
import { useDictation } from "@/hooks/useDictation";
import { queryClient } from "@/lib/queryClient";
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

  const handleGameComplete = async (stats: GameStats) => {
    console.log(`🎮 Dictation Game Complete Handler - Mode: ${stats.mode}, Level: ${stats.level}`);
    console.log(`📊 Dictation Stats:`, stats);
    
    // Verify mode is correctly passed
    if (stats.mode === "fill-blanks") {
      console.log(`✅ Fill-blanks mode detected and ready to save to database`);
      console.log(`🔍 Fill-blanks stats details:`, {
        mode: stats.mode,
        score: stats.score,
        accuracy: stats.accuracy,
        level: stats.level,
        correctWords: stats.correctWords,
        totalWords: stats.totalWords
      });
    }
    
    setGameStats(stats);

    // Save to database with detailed logging
    const gameData = {
      gameMode: stats.mode,
      score: stats.score,
      accuracy: Math.round(stats.accuracy), // Ensure integer
      levelReached: stats.level,
      wordsTotal: stats.totalWords,
      wordsCorrect: stats.correctWords,
    };
    
    console.log(`💾 Saving dictation game data for mode '${gameData.gameMode}':`, gameData);
    console.log(`🔍 Data types:`, {
      gameMode: typeof gameData.gameMode,
      score: typeof gameData.score,
      accuracy: typeof gameData.accuracy,
      levelReached: typeof gameData.levelReached,
      wordsTotal: typeof gameData.wordsTotal,
      wordsCorrect: typeof gameData.wordsCorrect,
    });
    
    // Wait for game history to be saved
    await new Promise<void>((resolve) => {
      saveGameHistory(gameData);
      // Give some time for the mutation to complete
      setTimeout(() => resolve(), 500);
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

      console.log(`📈 Updating dictation progress:`, {
        oldScore: currentScore,
        newScore: newTotalScore,
        oldWords: currentWords,
        newWords: newTotalWords,
        oldCorrect: currentCorrect,
        newCorrect: newCorrectWords,
        newAccuracy,
      });

      updateProgress({
        totalScore: newTotalScore,
        totalWordsPracticed: newTotalWords,
        correctWords: newCorrectWords,
        accuracy: newAccuracy,
      });
    } else {
      console.warn(`⚠️ No progress data found, cannot update`);
    }

    // Force refetch of all relevant queries to update UI immediately
    await queryClient.invalidateQueries({ queryKey: ['/api/dictation/progress'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/progress/recent'] });
    
    setGameState("results");
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
    console.log(`🚪 Exiting dictation game without saving additional progress`);
    setGameState("menu");
    setGameStats(null);
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
          <Button 
            asChild
            className="font-pixel bg-red-600 hover:bg-red-700 border-2 border-red-800"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>

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
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => handleStartGame("typing", selectedLevel)}>
            <div className="flex items-center gap-4">
              <Keyboard className="w-12 h-12 text-blue-500" />
              <div>
                <h3 className="text-xl font-bold">Typing Mode</h3>
                <p className="text-muted-foreground">Type the word you hear</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => handleStartGame("multiple-choice", selectedLevel)}>
            <div className="flex items-center gap-4">
              <MousePointer className="w-12 h-12 text-green-500" />
              <div>
                <h3 className="text-xl font-bold">Multiple Choice</h3>
                <p className="text-muted-foreground">Choose from 4 options</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-elevate cursor-pointer" onClick={() => handleStartGame("fill-blanks", selectedLevel)}>
            <div className="flex items-center gap-4">
              <Zap className="w-12 h-12 text-purple-500" />
              <div>
                <h3 className="text-xl font-bold">Fill the Blank</h3>
                <p className="text-muted-foreground">Choose the missing letter</p>
              </div>
            </div>
          </Card>
        </div>


      </div>
    </div>
  );
}