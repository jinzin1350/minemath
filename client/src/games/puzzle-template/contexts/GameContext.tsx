import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { GameState, GameStats, PuzzleQuestion, MinecraftEnemy, PowerUp } from '../types/game.types';

interface GameContextType {
  gameState: GameState;
  currentQuestion: PuzzleQuestion | null;
  currentEnemy: MinecraftEnemy | null;
  powerUps: PowerUp[];

  // Actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  nextQuestion: () => void;
  submitAnswer: (answer: string | number) => boolean;
  addPoints: (points: number) => void;
  usePowerUp: (type: PowerUp['type']) => void;
  loseLife: () => void;
  addDiamond: () => void;

  // Stats
  getGameStats: () => GameStats;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    totalPoints: 0,
    lives: 3,
    diamonds: 0,
    gameStatus: 'menu',
    currentStreak: 0,
  });

  const [currentQuestion, setCurrentQuestion] = useState<PuzzleQuestion | null>(null);
  const [currentEnemy, setCurrentEnemy] = useState<MinecraftEnemy | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());

  const [powerUps] = useState<PowerUp[]>([
    { type: 'hint', name: 'Hint', emoji: '💡', count: 3 },
    { type: 'skip', name: 'Skip', emoji: '⏭️', count: 2 },
    { type: 'extraTime', name: 'Extra Time', emoji: '⏰', count: 2 },
    { type: 'shield', name: 'Shield', emoji: '🛡️', count: 1 },
  ]);

  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStatus: 'playing' }));
    setStartTime(Date.now());
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStatus: 'paused' }));
  }, []);

  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStatus: 'playing' }));
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => ({ ...prev, gameStatus: 'gameOver' }));
  }, []);

  const nextQuestion = useCallback(() => {
    // TODO: Implement question generation logic
    // This should be customized per game
    console.log('Next question - implement in your game');
  }, []);

  const submitAnswer = useCallback((answer: string | number): boolean => {
    if (!currentQuestion) return false;

    setQuestionsAnswered(prev => prev + 1);
    const isCorrect = answer === currentQuestion.correctAnswer;

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setGameState(prev => ({
        ...prev,
        totalPoints: prev.totalPoints + currentQuestion.points,
        currentStreak: prev.currentStreak + 1,
      }));
      addDiamond();
      return true;
    } else {
      setGameState(prev => ({
        ...prev,
        currentStreak: 0,
      }));
      return false;
    }
  }, [currentQuestion]);

  const addPoints = useCallback((points: number) => {
    setGameState(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + points,
    }));
  }, []);

  const loseLife = useCallback(() => {
    setGameState(prev => {
      const newLives = prev.lives - 1;
      return {
        ...prev,
        lives: newLives,
        gameStatus: newLives <= 0 ? 'gameOver' : prev.gameStatus,
      };
    });
  }, []);

  const addDiamond = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      diamonds: prev.diamonds + 1,
    }));
  }, []);

  const usePowerUp = useCallback((type: PowerUp['type']) => {
    // TODO: Implement power-up logic
    console.log('Using power-up:', type);
  }, []);

  const getGameStats = useCallback((): GameStats => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const accuracy = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;

    return {
      score: gameState.totalPoints,
      accuracy,
      level: gameState.currentLevel,
      totalQuestions: questionsAnswered,
      correctAnswers,
      timeSpent,
      diamondsCollected: gameState.diamonds,
    };
  }, [gameState, questionsAnswered, correctAnswers, startTime]);

  const value: GameContextType = {
    gameState,
    currentQuestion,
    currentEnemy,
    powerUps,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    nextQuestion,
    submitAnswer,
    addPoints,
    usePowerUp,
    loseLife,
    addDiamond,
    getGameStats,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
