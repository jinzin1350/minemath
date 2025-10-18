import React from 'react';
import { useGame } from '../contexts/GameContext';

export default function ScorePanel() {
  const { gameState } = useGame();

  return (
    <div className="bg-minecraft-stone rounded-lg p-4 shadow-minecraft mb-4">
      <div className="flex justify-between items-center text-white font-pixel">
        {/* Level */}
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-xl">⭐</span>
          <div>
            <div className="text-xs text-gray-300">LEVEL</div>
            <div className="text-2xl font-bold">{gameState.currentLevel}</div>
          </div>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">💎</span>
          <div>
            <div className="text-xs text-gray-300">SCORE</div>
            <div className="text-2xl font-bold">{gameState.totalPoints}</div>
          </div>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-2">
          <div>
            <div className="text-xs text-gray-300">LIVES</div>
            <div className="text-2xl">
              {Array(gameState.lives)
                .fill(0)
                .map((_, i) => (
                  <span key={i}>❤️</span>
                ))}
            </div>
          </div>
        </div>

        {/* Diamonds */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">💠</span>
          <div>
            <div className="text-xs text-gray-300">DIAMONDS</div>
            <div className="text-2xl font-bold">{gameState.diamonds}</div>
          </div>
        </div>

        {/* Streak */}
        {gameState.currentStreak > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <div className="text-xs text-gray-300">STREAK</div>
              <div className="text-2xl font-bold">{gameState.currentStreak}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
