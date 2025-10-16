import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameState, PowerUpType, Achievement, Story } from '../types/game.types';

interface GameContextType {
  gameState: GameState;
  addPoints: (points: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  unlockPowerUp: (powerUp: PowerUpType) => void;
  usePowerUp: (powerUp: PowerUpType) => boolean;
  unlockAchievement: (achievement: Achievement) => void;
  saveStory: (story: Story) => void;
  updateStatistics: (correct: boolean, speed: number) => void;
  setLevel: (level: number) => void;
  toggleSound: () => void;
  resetGame: () => void;
  saveProgress: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  currentLevel: 1,
  totalPoints: 0,
  currentStreak: 0,
  bestStreak: 0,
  unlockedPowerUps: [],
  achievements: [],
  dailyChallengeCompleted: false,
  playerAvatar: 'default',
  soundEnabled: true,
  difficulty: 'normal',
  completedStories: [],
  wordCollection: [],
  statistics: {
    totalCorrect: 0,
    totalAttempts: 0,
    averageSpeed: 0,
    favoriteWordType: '',
  },
  powerUpInventory: {
    hintBubble: 3,  // Start with 3
    fiftyFiftyEliminator: 2,  // Start with 2
    contextClue: 2,  // Start with 2
    timeFreeze: 1,  // Start with 1
    wordFamilyHelper: 5, // Start with 5 (it's free to use)
  },
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load saved game state from localStorage
    const savedState = localStorage.getItem('aiWordWizardGameState');
    if (savedState) {
      try {
        return JSON.parse(savedState);
      } catch (e) {
        console.error('Failed to parse saved game state:', e);
        return initialGameState;
      }
    }
    return initialGameState;
  });

  // Auto-save game state whenever it changes
  useEffect(() => {
    localStorage.setItem('aiWordWizardGameState', JSON.stringify(gameState));
  }, [gameState]);

  const addPoints = (points: number) => {
    setGameState((prev) => ({
      ...prev,
      totalPoints: Math.max(0, prev.totalPoints + points),
    }));
  };

  const incrementStreak = () => {
    setGameState((prev) => {
      const newStreak = prev.currentStreak + 1;
      return {
        ...prev,
        currentStreak: newStreak,
        bestStreak: Math.max(newStreak, prev.bestStreak),
      };
    });
  };

  const resetStreak = () => {
    setGameState((prev) => ({
      ...prev,
      currentStreak: 0,
    }));
  };

  const unlockPowerUp = (powerUp: PowerUpType) => {
    setGameState((prev) => {
      if (prev.unlockedPowerUps.includes(powerUp)) {
        return prev;
      }
      return {
        ...prev,
        unlockedPowerUps: [...prev.unlockedPowerUps, powerUp],
        powerUpInventory: {
          ...prev.powerUpInventory,
          [powerUp]: prev.powerUpInventory[powerUp] + 1,
        },
      };
    });
  };

  const usePowerUp = (powerUp: PowerUpType): boolean => {
    const costs: Record<PowerUpType, number> = {
      hintBubble: 5,
      fiftyFiftyEliminator: 10,
      contextClue: 8,
      timeFreeze: 15,
      wordFamilyHelper: 0, // Free power-up
    };

    const cost = costs[powerUp];

    if (gameState.powerUpInventory[powerUp] <= 0) {
      return false;
    }

    if (powerUp !== 'wordFamilyHelper' && gameState.totalPoints < cost) {
      return false;
    }

    setGameState((prev) => ({
      ...prev,
      totalPoints: powerUp !== 'wordFamilyHelper' ? prev.totalPoints - cost : prev.totalPoints,
      powerUpInventory: {
        ...prev.powerUpInventory,
        [powerUp]: prev.powerUpInventory[powerUp] - 1,
      },
    }));

    return true;
  };

  const unlockAchievement = (achievement: Achievement) => {
    setGameState((prev) => {
      if (prev.achievements.some((a) => a.id === achievement.id)) {
        return prev;
      }
      return {
        ...prev,
        achievements: [
          ...prev.achievements,
          { ...achievement, unlocked: true, unlockedAt: new Date() },
        ],
      };
    });
  };

  const saveStory = (story: Story) => {
    setGameState((prev) => ({
      ...prev,
      completedStories: [...prev.completedStories, story],
    }));
  };

  const updateStatistics = (correct: boolean, speed: number) => {
    setGameState((prev) => {
      const newTotalAttempts = prev.statistics.totalAttempts + 1;
      const newTotalCorrect = correct
        ? prev.statistics.totalCorrect + 1
        : prev.statistics.totalCorrect;
      const newAverageSpeed =
        (prev.statistics.averageSpeed * prev.statistics.totalAttempts + speed) /
        newTotalAttempts;

      return {
        ...prev,
        statistics: {
          ...prev.statistics,
          totalCorrect: newTotalCorrect,
          totalAttempts: newTotalAttempts,
          averageSpeed: newAverageSpeed,
        },
      };
    });
  };

  const setLevel = (level: number) => {
    setGameState((prev) => ({
      ...prev,
      currentLevel: level,
    }));
  };

  const toggleSound = () => {
    setGameState((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }));
  };

  const resetGame = () => {
    setGameState(initialGameState);
  };

  const saveProgress = () => {
    localStorage.setItem('aiWordWizardGameState', JSON.stringify(gameState));
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        addPoints,
        incrementStreak,
        resetStreak,
        unlockPowerUp,
        usePowerUp,
        unlockAchievement,
        saveStory,
        updateStatistics,
        setLevel,
        toggleSound,
        resetGame,
        saveProgress,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
