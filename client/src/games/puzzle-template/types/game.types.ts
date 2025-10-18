// Game Types for Minecraft-themed Puzzle Games

export interface GameState {
  currentLevel: number;
  totalPoints: number;
  lives: number;
  diamonds: number;
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver' | 'levelComplete';
  currentStreak: number;
}

export interface GameStats {
  score: number;
  accuracy: number;
  level: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  diamondsCollected: number;
}

export interface PuzzleQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
  hint?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MinecraftEnemy {
  type: 'zombie' | 'skeleton' | 'creeper' | 'spider' | 'enderman';
  name: string;
  emoji: string;
  defeatSound: string;
  health: number;
}

export interface PowerUp {
  type: 'hint' | 'skip' | 'extraTime' | 'shield';
  name: string;
  emoji: string;
  count: number;
}
