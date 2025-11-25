
export enum GamePhase {
  WELCOME = 'WELCOME',
  MAP = 'MAP',
  MISSION = 'MISSION',
  BATTLE = 'BATTLE',
  VICTORY = 'VICTORY'
}

export enum RobotColor {
  RED = 'red',
  BLUE = 'blue',
  GREEN = 'green',
  PURPLE = 'purple',
  ORANGE = 'orange',
}

export interface RobotProfile {
  name: string;
  color: RobotColor;
  level: number;
  xp: number;
  // The cumulative knowledge base
  memory: TrainingMemory[];
}

export interface RobotConfig {
  name: string;
  color: RobotColor;
  personality: string;
  powerWords: string[];
  style: 'Formal' | 'Cool';
  emojis: string[];
  obsession: string;
  defensePhrase: string;
  victoryMove: string;
  avatarSeed: number;
}

export interface TrainingMemory {
  chapterId: number;
  missionId: number;
  concept: string; // e.g., "Apple"
  value: string;   // e.g., "Red delicious fruit" or "Seeb"
  type: 'vocabulary' | 'rule' | 'preference' | 'logic';
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  type: 'teach' | 'quiz' | 'logic' | 'creative';
  promptContext: string; // Instructions for Gemini to generate the specific content
}

export interface MissionRound {
  question: string;
  visuals: string[]; // 20+ emojis
  concept: string;
  options?: string[];
}

export interface MissionSession {
  rounds: MissionRound[];
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  missions: Mission[];
  bossBattlePrompt: string; // The specific challenge for the end of chapter
}

export interface BattleResult {
  winner: 'user' | 'rival' | 'tie';
  userAnswer: string;
  rivalAnswer: string;
  reasoning: string;
  score: number;
}
