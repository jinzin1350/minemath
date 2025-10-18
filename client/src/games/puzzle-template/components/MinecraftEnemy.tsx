import React from 'react';
import type { MinecraftEnemy as EnemyType } from '../types/game.types';

interface MinecraftEnemyProps {
  enemy: EnemyType;
  position: number; // 0-100 percentage
  isAttacking?: boolean;
}

export default function MinecraftEnemy({ enemy, position, isAttacking = false }: MinecraftEnemyProps) {
  return (
    <div
      className="absolute transition-all duration-500 ease-linear"
      style={{
        left: `${position}%`,
        transform: `translateX(-50%) ${isAttacking ? 'scale(1.2)' : 'scale(1)'}`,
      }}
    >
      <div className={`text-center ${isAttacking ? 'animate-bounce' : ''}`}>
        <div className="text-6xl mb-2 filter drop-shadow-lg">
          {enemy.emoji}
        </div>
        <div className="bg-red-600 rounded-full h-3 w-24 overflow-hidden border-2 border-gray-800">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${enemy.health}%` }}
          />
        </div>
        <div className="text-white font-pixel text-sm mt-1 drop-shadow-md">
          {enemy.name}
        </div>
      </div>
    </div>
  );
}
