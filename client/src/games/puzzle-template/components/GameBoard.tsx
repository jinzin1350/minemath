import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGame } from '../contexts/GameContext';
import MinecraftEnemy from './MinecraftEnemy';

interface GameBoardProps {
  onGameComplete?: (stats: any) => void;
}

export default function GameBoard({ onGameComplete }: GameBoardProps) {
  const { gameState, currentQuestion, currentEnemy, submitAnswer, getGameStats, loseLife, nextQuestion } = useGame();
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [enemyPosition, setEnemyPosition] = useState(0);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);

  // Timer countdown
  useEffect(() => {
    if (gameState.gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });

      // Enemy moves closer as time runs out
      setEnemyPosition((prev) => Math.min(100, prev + (100 / 30)));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStatus, currentQuestion]);

  const handleTimeout = () => {
    setFeedback('⏰ Time\'s up!');
    loseLife();
    setTimeout(() => {
      setFeedback('');
      resetRound();
      nextQuestion();
    }, 2000);
  };

  const handleSubmit = () => {
    if (!userAnswer.trim() || !currentQuestion) return;

    const isCorrect = submitAnswer(userAnswer);

    if (isCorrect) {
      setFeedback(`✅ Correct! +${currentQuestion.points} points!`);
      setEnemyHealth((prev) => Math.max(0, prev - 33));

      setTimeout(() => {
        setFeedback('');
        setUserAnswer('');
        resetRound();

        if (enemyHealth <= 33) {
          // Enemy defeated, next enemy
          setEnemyHealth(100);
        }

        nextQuestion();
      }, 2000);
    } else {
      setFeedback(`❌ Wrong! Correct answer: ${currentQuestion.correctAnswer}`);
      loseLife();

      setTimeout(() => {
        setFeedback('');
        setUserAnswer('');
        resetRound();
        nextQuestion();
      }, 2000);
    }
  };

  const resetRound = () => {
    setTimeLeft(30);
    setEnemyPosition(0);
  };

  // Game Over
  if (gameState.gameStatus === 'gameOver') {
    const stats = getGameStats();

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-minecraft-dirt rounded-lg p-8">
        <h2 className="text-4xl font-pixel text-red-500 mb-4">💀 GAME OVER</h2>
        <div className="bg-black bg-opacity-60 rounded-lg p-6 text-white font-pixel">
          <p className="text-xl mb-2">Final Score: {stats.score}</p>
          <p className="text-lg mb-2">Level Reached: {stats.level}</p>
          <p className="text-lg mb-2">Accuracy: {stats.accuracy.toFixed(1)}%</p>
          <p className="text-lg mb-4">Diamonds: {stats.diamondsCollected}</p>
          <Button onClick={() => window.location.reload()} className="font-pixel bg-green-600 hover:bg-green-700">
            🔄 PLAY AGAIN
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-minecraft-grass rounded-lg p-6 shadow-minecraft">
      {/* Timer Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white font-pixel">⏱️ TIME LEFT</span>
          <span className="text-yellow-300 font-pixel text-xl">{timeLeft}s</span>
        </div>
        <div className="bg-gray-800 rounded-full h-4 overflow-hidden border-2 border-gray-700">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft > 20 ? 'bg-green-500' : timeLeft > 10 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
      </div>

      {/* Enemy Display */}
      {currentEnemy && (
        <div className="relative h-32 bg-minecraft-stone rounded-lg mb-6 overflow-hidden">
          <MinecraftEnemy
            enemy={{ ...currentEnemy, health: enemyHealth }}
            position={enemyPosition}
            isAttacking={enemyPosition > 80}
          />
        </div>
      )}

      {/* Question Display */}
      {currentQuestion && (
        <div className="bg-white rounded-lg p-6 mb-4 shadow-lg">
          <h3 className="text-2xl font-pixel text-gray-800 mb-4">{currentQuestion.question}</h3>

          {currentQuestion.options ? (
            // Multiple Choice
            <div className="grid grid-cols-2 gap-3">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => {
                    setUserAnswer(option);
                    setTimeout(() => handleSubmit(), 100);
                  }}
                  className="font-pixel text-lg p-6 bg-blue-500 hover:bg-blue-600"
                  disabled={!!feedback}
                >
                  {option}
                </Button>
              ))}
            </div>
          ) : (
            // Text Input
            <div className="flex gap-3">
              <Input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Type your answer..."
                className="font-pixel text-lg p-6"
                disabled={!!feedback}
                autoFocus
              />
              <Button
                onClick={handleSubmit}
                disabled={!userAnswer.trim() || !!feedback}
                className="font-pixel text-lg px-8 bg-green-600 hover:bg-green-700"
              >
                ⚔️ SUBMIT
              </Button>
            </div>
          )}

          {currentQuestion.hint && (
            <div className="mt-4 text-sm text-gray-600 font-pixel">
              💡 Hint: {currentQuestion.hint}
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className={`text-center text-2xl font-pixel p-4 rounded-lg ${
          feedback.includes('✅') ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {feedback}
        </div>
      )}
    </div>
  );
}
