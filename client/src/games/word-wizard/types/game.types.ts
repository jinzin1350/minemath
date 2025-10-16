export interface GameState {
  currentLevel: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  unlockedPowerUps: PowerUpType[];
  achievements: Achievement[];
  dailyChallengeCompleted: boolean;
  playerAvatar: string;
  soundEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  completedStories: Story[];
  wordCollection: string[];
  statistics: Statistics;
  powerUpInventory: PowerUpInventory;
}

export interface Statistics {
  totalCorrect: number;
  totalAttempts: number;
  averageSpeed: number;
  favoriteWordType: string;
}

export interface PowerUpInventory {
  hintBubble: number;
  fiftyFiftyEliminator: number;
  contextClue: number;
  timeFreeze: number;
  wordFamilyHelper: number;
}

export type PowerUpType = 'hintBubble' | 'fiftyFiftyEliminator' | 'contextClue' | 'timeFreeze' | 'wordFamilyHelper';

export interface PowerUp {
  type: PowerUpType;
  name: string;
  description: string;
  cost: number;
  icon: string;
}

export interface Question {
  id: string;
  level: number;
  sentence: string;
  blankPosition: number;
  correctAnswers: string[];
  closeAnswers?: string[];
  options: string[];
  category: QuestionCategory;
  hint?: string;
  contextExample?: string;
}

export type QuestionCategory = 'basic' | 'pattern' | 'context' | 'advanced';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: Date;
  icon: string;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  completedAt: Date;
  creativity: number;
}

export type LevelTitle =
  | 'Apprentice Word Wizard'
  | 'Junior Predictor'
  | 'Pattern Master'
  | 'Context Champion'
  | 'AI Grand Master';

export interface LevelInfo {
  level: number;
  title: LevelTitle;
  minPoints: number;
  maxPoints: number;
}
