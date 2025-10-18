import type { MinecraftEnemy } from '../types/game.types';

export const enemies: MinecraftEnemy[] = [
  {
    type: 'zombie',
    name: 'Zombie',
    emoji: '🧟',
    defeatSound: '💥 BOOM!',
    health: 100,
  },
  {
    type: 'skeleton',
    name: 'Skeleton',
    emoji: '💀',
    defeatSound: '⚡ ZAPPED!',
    health: 100,
  },
  {
    type: 'creeper',
    name: 'Creeper',
    emoji: '🟢',
    defeatSound: '💣 EXPLODED!',
    health: 100,
  },
  {
    type: 'spider',
    name: 'Spider',
    emoji: '🕷️',
    defeatSound: '🔥 BURNED!',
    health: 100,
  },
  {
    type: 'enderman',
    name: 'Enderman',
    emoji: '👾',
    defeatSound: '✨ VANISHED!',
    health: 100,
  },
];

export function getRandomEnemy(): MinecraftEnemy {
  const randomIndex = Math.floor(Math.random() * enemies.length);
  return { ...enemies[randomIndex] };
}
