import type { DictationWord, DictationUserProgress, DictationGameHistory } from "@shared/schema";

export type { DictationWord, DictationUserProgress, DictationGameHistory };

export type GameMode = "typing" | "multiple-choice";

export type GameState = "menu" | "playing" | "results";

export interface GameStats {
  score: number;
  accuracy: number;
  correctWords: number;
  totalWords: number;
  level: number;
  mode: GameMode;
}

export interface DictationGameProps {
  mode: GameMode;
  level: number;
  onGameComplete: (stats: GameStats) => void;
  onExit: () => void;
}

export interface QuestionState {
  word: DictationWord;
  userAnswer: string;
  isCorrect: boolean | null;
  choices?: string[]; // For multiple choice mode
}
