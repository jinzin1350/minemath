import React from 'react';
import { Button } from '@/components/ui/button';
import { useGame } from '../contexts/GameContext';

export default function PowerUpPanel() {
  const { powerUps, usePowerUp, gameState } = useGame();

  return (
    <div className="bg-minecraft-stone rounded-lg p-4 shadow-minecraft">
      <h3 className="text-white font-pixel text-lg mb-3">⚡ POWER-UPS</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {powerUps.map((powerUp) => (
          <Button
            key={powerUp.type}
            onClick={() => usePowerUp(powerUp.type)}
            disabled={powerUp.count === 0 || gameState.gameStatus !== 'playing'}
            className="font-pixel bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <span className="text-2xl mr-2">{powerUp.emoji}</span>
            <div className="text-left">
              <div className="text-xs">{powerUp.name}</div>
              <div className="text-xs text-gray-300">x{powerUp.count}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
