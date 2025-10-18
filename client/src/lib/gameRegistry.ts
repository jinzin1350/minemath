// Game Registry System
// This file helps you register and manage games in the MineMath platform

export interface GameInfo {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string; // Emoji or icon name
  category: 'math' | 'language' | 'logic' | 'science' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard';
  minAge?: number;
  maxAge?: number;
  isActive: boolean;
  component?: React.LazyExoticComponent<any>;
}

export const games: GameInfo[] = [
  {
    id: 'math-game',
    name: 'Math Battle',
    description: 'Fight enemies with math problems',
    route: '/',
    icon: '🔢',
    category: 'math',
    difficulty: 'medium',
    minAge: 8,
    isActive: true,
  },
  {
    id: 'english-dictation',
    name: 'English Dictation',
    description: 'Listen and spell words correctly',
    route: '/english-dictation',
    icon: '🎧',
    category: 'language',
    difficulty: 'medium',
    minAge: 8,
    isActive: true,
  },
  {
    id: 'word-wizard',
    name: 'Word Wizard',
    description: 'AI-powered vocabulary adventure',
    route: '/word-wizard',
    icon: '🧙',
    category: 'language',
    difficulty: 'medium',
    minAge: 10,
    isActive: true,
  },
  // Add your new games here
  // {
  //   id: 'puzzle-quest',
  //   name: 'Puzzle Quest',
  //   description: 'Logic puzzles with Minecraft enemies',
  //   route: '/puzzle-quest',
  //   icon: '🧩',
  //   category: 'logic',
  //   difficulty: 'medium',
  //   minAge: 10,
  //   isActive: true,
  // },
];

// Helper functions
export function getGameById(id: string): GameInfo | undefined {
  return games.find(game => game.id === id);
}

export function getGamesByCategory(category: GameInfo['category']): GameInfo[] {
  return games.filter(game => game.category === category && game.isActive);
}

export function getGamesForAge(age: number): GameInfo[] {
  return games.filter(
    game =>
      game.isActive &&
      (!game.minAge || age >= game.minAge) &&
      (!game.maxAge || age <= game.maxAge)
  );
}

export function getAllActiveGames(): GameInfo[] {
  return games.filter(game => game.isActive);
}

// Helper to register a new game
export function registerGame(gameInfo: GameInfo): void {
  const existingIndex = games.findIndex(g => g.id === gameInfo.id);
  if (existingIndex >= 0) {
    games[existingIndex] = gameInfo;
  } else {
    games.push(gameInfo);
  }
}
