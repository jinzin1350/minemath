import React, { useEffect } from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import ScorePanel from './components/ScorePanel';
import GameBoard from './components/GameBoard';
import PowerUpPanel from './components/PowerUpPanel';
import { Button } from '@/components/ui/button';
import { getQuestionByLevel } from './data/sampleQuestions';
import { getRandomEnemy } from './data/enemies';
import './App.css';

function GameContent() {
  const { gameState, startGame } = useGame();

  useEffect(() => {
    // Auto-start game for now
    // You can add a menu screen here if needed
    if (gameState.gameStatus === 'menu') {
      startGame();
    }
  }, [gameState.gameStatus, startGame]);

  // Menu Screen
  if (gameState.gameStatus === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-6xl font-pixel text-yellow-300 mb-8 drop-shadow-lg">
            ⚔️ PUZZLE QUEST
          </h1>
          <p className="text-2xl font-pixel text-white mb-8">
            Defeat Minecraft Enemies with Your Brain!
          </p>
          <Button
            onClick={startGame}
            className="font-pixel text-2xl px-12 py-6 bg-green-600 hover:bg-green-700"
          >
            🎮 START GAME
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-800 to-indigo-900 p-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-pixel text-yellow-300 text-center mb-6 drop-shadow-lg">
          ⚔️ PUZZLE QUEST
        </h1>

        <ScorePanel />

        <div className="mb-4">
          <GameBoard />
        </div>

        <PowerUpPanel />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
