import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, BarChart3, Gamepad2, Trophy, FileText, Volume2, Zap, Keyboard, MousePointer } from "lucide-react";
import { Link } from "wouter";
import { DictationGame } from "@/components/DictationGame";
import { DictationResults } from "@/components/DictationResults";
import { useDictation } from "@/hooks/useDictation";
import { useAuth } from "@/hooks/useAuth";
import type { GameMode, GameState, GameStats } from "@/types/dictation";

export default function EnglishDictation() {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>("menu");
  const [selectedMode, setSelectedMode] = useState<GameMode>("typing");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [gameStats, setGameStats] = useState<GameStats | null>(null);

  const { progress, progressLoading, saveGameHistory, updateProgress } = useDictation();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleStartGame = (mode: GameMode, level: number) => {
    setSelectedMode(mode);
    setSelectedLevel(level);
    setGameState("playing");
  };

  const handleGameComplete = (stats: GameStats) => {
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
    setGameState("results");

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
    
    saveGameHistory(gameData);

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
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-card border-b border-card-border sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-2 md:px-4 py-1 md:py-2">
          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Top row: Title and Logout */}
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-pixel text-xs text-foreground">⛏️ MINECRAFT MATH</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-pixel text-xs px-2 py-1 h-6"
                data-testid="button-logout"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>

            {/* Bottom row: Navigation buttons */}
            <div className="flex gap-1 w-full">
              <Link href="/" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-pixel text-xs w-full px-1 py-1 h-7"
                  data-testid="button-dashboard"
                >
                  <BarChart3 className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-pixel text-xs w-full px-1 py-1 h-7"
                  data-testid="button-game"
                >
                  <Gamepad2 className="h-3 w-3" />
                </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                className="font-pixel text-xs flex-1 px-1 py-1 h-7"
                data-testid="button-english-dictation"
              >
                <Volume2 className="h-3 w-3" />
              </Button>
              <Link href="/rank" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-pixel text-xs w-full px-1 py-1 h-7"
                  data-testid="button-leaderboard"
                >
                  <Trophy className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-pixel text-xs w-full px-1 py-1 h-7"
                  data-testid="button-report"
                >
                  <FileText className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex md:flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
              <h1 className="font-pixel text-xl text-foreground">MINECRAFT MATH</h1>
              <div className="flex gap-2">
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-pixel text-xs"
                    data-testid="button-dashboard"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    DASHBOARD
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-pixel text-xs"
                    data-testid="button-game"
                  >
                    <Gamepad2 className="h-4 w-4 mr-1" />
                    PLAY
                  </Button>
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  className="font-pixel text-xs"
                  data-testid="button-english-dictation"
                >
                  <Volume2 className="h-4 w-4 mr-1" />
                  ENGLISH
                </Button>
                <Link href="/rank">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-pixel text-xs"
                    data-testid="button-leaderboard"
                  >
                    <Trophy className="h-4 w-4 mr-1" />
                    LEADERBOARD
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-pixel text-xs"
                    data-testid="button-report"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    REPORT
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {(user as any)?.firstName || (user as any)?.name || 'Player'}!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-pixel text-xs"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                LOGOUT
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-2 md:p-4">
        {/* Progress Card */}
        {!progressLoading && progress && (
          <Card className="p-3 md:p-4 mb-4 md:mb-6 bg-card border-2 md:border-4 border-card-border">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs md:text-sm text-muted-foreground">Your Progress</div>
                <div className="font-pixel text-base md:text-lg" data-testid="text-total-score">
                  Score: {progress.totalScore}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs md:text-sm text-muted-foreground">Accuracy</div>
                <div className="font-pixel text-base md:text-lg" data-testid="text-total-accuracy">
                  {progress.accuracy}%
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Title */}
        <div className="text-center mb-4 md:mb-8">
          <h1 className="font-pixel text-2xl md:text-4xl text-foreground mb-2 md:mb-4">
            🎧 ENGLISH DICTATION
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground">
            Listen and spell words correctly!
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8">
          <Card className="p-4 md:p-6 hover-elevate cursor-pointer border-2 md:border-4 border-card-border" onClick={() => handleStartGame("typing", selectedLevel)}>
            <div className="flex items-center gap-2 md:gap-4">
              <Keyboard className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
              <div>
                <h3 className="font-pixel text-sm md:text-xl">Typing Mode</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Type the word</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover-elevate cursor-pointer border-2 md:border-4 border-card-border" onClick={() => handleStartGame("multiple-choice", selectedLevel)}>
            <div className="flex items-center gap-2 md:gap-4">
              <MousePointer className="w-8 h-8 md:w-12 md:h-12 text-green-500" />
              <div>
                <h3 className="font-pixel text-sm md:text-xl">Multiple Choice</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Choose option</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 hover-elevate cursor-pointer border-2 md:border-4 border-card-border" onClick={() => handleStartGame("fill-blanks", selectedLevel)}>
            <div className="flex items-center gap-2 md:gap-4">
              <Zap className="w-8 h-8 md:w-12 md:h-12 text-purple-500" />
              <div>
                <h3 className="font-pixel text-sm md:text-xl">Fill the Blank</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Missing letter</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}