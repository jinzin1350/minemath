import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MinecraftSteve, MinecraftZombie, MinecraftBlock } from './MinecraftCharacters';
import { AchievementNotification } from './AchievementBadge';
import { Heart, Diamond, Zap } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GameStats {
  level: number;
  score: number;
  hearts: number;
  diamonds: number;
  magicPower: number;
}

interface Question {
  num1: number;
  num2: number;
}

interface Enemy {
  name: string;
  speed: number;
  sound: string;
  defeatSound: string;
}

interface GameInterfaceProps {
  onGameComplete?: (stats: GameStats) => void;
  mockMode?: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconType: string;
  pointsRequired: number;
}

export function GameInterface({ onGameComplete, mockMode = false }: GameInterfaceProps) {
  const [gameStats, setGameStats] = useState<GameStats>({
    level: 1,
    score: 0,
    hearts: 3,
    diamonds: 0,
    magicPower: 0
  });
  
  const [currentQuestion, setCurrentQuestion] = useState<Question>({ num1: 0, num2: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'levelComplete'>('playing');
  const [enemyPosition, setEnemyPosition] = useState(100);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [playerDefending, setPlayerDefending] = useState(false);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [enemyMoving, setEnemyMoving] = useState(false);
  const [showMagicBlast, setShowMagicBlast] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);

  const enemies: Enemy[] = [
    { name: 'Zombie', speed: 8, sound: 'GRRRR!', defeatSound: 'ARGHHHH!' },
    { name: 'Skeleton', speed: 6, sound: 'CLACK!', defeatSound: 'CRACK!' },
    { name: 'Creeper', speed: 10, sound: 'SSSSSS!', defeatSound: 'BOOM!' },
    { name: 'Witch', speed: 5, sound: 'CACKLE!', defeatSound: 'NOOO!' },
    { name: 'Dragon', speed: 12, sound: 'ROAR!', defeatSound: 'DEFEATED!' }
  ];

  const generateQuestion = () => {
    const maxNum = Math.min(5 + gameStats.level * 2, 15);
    const num1 = Math.floor(Math.random() * maxNum) + 1;
    const num2 = Math.floor(Math.random() * maxNum) + 1;
    setCurrentQuestion({ num1, num2 });
    
    if (gameStats.level <= enemies.length) {
      setCurrentEnemy(enemies[gameStats.level - 1]);
      setEnemyPosition(100);
      setEnemyMoving(true);
    }
  };

  const handleSubmit = () => {
    const correct = currentQuestion.num1 + currentQuestion.num2;
    const answer = parseInt(userAnswer);

    if (answer === correct) {
      const earnedPoints = 10;
      setPointsEarned(earnedPoints);
      setShowPointsAnimation(true);
      setPlayerDefending(true);
      setShowMagicBlast(true);
      setEnemyMoving(false);
      
      const newStats = {
        ...gameStats,
        score: gameStats.score + earnedPoints,
        diamonds: gameStats.diamonds + 1,
        magicPower: gameStats.magicPower + gameStats.level
      };
      setGameStats(newStats);

      // Check for new achievements every 500 points
      if (!mockMode) {
        checkForAchievements(newStats.score);
      }
      
      if (currentEnemy) {
        setFeedback(`💥 ${currentEnemy.name} DEFEATED! +${earnedPoints} POINTS! 🌟`);
      } else {
        setFeedback(`✨ Perfect! +${earnedPoints} POINTS! 🌟`);
      }
      
      setShowCelebration(true);
      
      setTimeout(() => {
        setShowCelebration(false);
        setShowMagicBlast(false);
        setPlayerDefending(false);
        setShowPointsAnimation(false);
        setFeedback('');
        setUserAnswer('');
        
        if (newStats.score >= gameStats.level * 50) {
          if (gameStats.level < 5) {
            setGameStats(prev => ({ ...prev, level: prev.level + 1 }));
            setFeedback(`🎊 LEVEL UP! Now Level ${gameStats.level + 1}! 🎊`);
          } else {
            setGameState('levelComplete');
            onGameComplete?.(newStats);
          }
        } else {
          generateQuestion();
        }
      }, 2000);
    } else {
      setFeedback(`❌ Wrong! Answer: ${correct} (No points)`);
      setEnemyPosition(prev => Math.max(0, prev - 25));
      
      setTimeout(() => {
        setFeedback('');
        setUserAnswer('');
      }, 2000);
    }
  };

  const restartGame = () => {
    setGameStats({ level: 1, score: 0, hearts: 3, diamonds: 0, magicPower: 0 });
    setEnemyPosition(100);
    setEnemyAttacking(false);
    setPlayerDefending(false);
    setEnemyMoving(false);
    setShowMagicBlast(false);
    setShowPointsAnimation(false);
    setUserAnswer('');
    setFeedback('');
    setGameState('playing');
    generateQuestion();
  };

  useEffect(() => {
    generateQuestion();
  }, [gameStats.level]);

  // Check for achievements
  const checkForAchievements = async (totalPoints: number) => {
    try {
      const response = await fetch('/api/achievements/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalPoints }),
      });
      
      if (response.ok) {
        const achievements = await response.json();
        if (achievements.length > 0) {
          setNewAchievements(achievements);
          setCurrentAchievementIndex(0);
        }
      }
    } catch (error) {
      console.error('Failed to check achievements:', error);
    }
  };

  const handleAchievementClose = () => {
    if (currentAchievementIndex < newAchievements.length - 1) {
      setCurrentAchievementIndex(prev => prev + 1);
    } else {
      setNewAchievements([]);
      setCurrentAchievementIndex(0);
    }
  };

  // Enemy movement effect
  useEffect(() => {
    if (enemyMoving && currentEnemy && enemyPosition > 0) {
      const interval = setInterval(() => {
        setEnemyPosition(prev => {
          const newPos = prev - (currentEnemy.speed / 10);
          if (newPos <= 0) {
            setEnemyAttacking(true);
            setEnemyMoving(false);
            setTimeout(() => {
              const newHearts = gameStats.hearts - 1;
              setGameStats(prev => ({ ...prev, hearts: newHearts }));
              if (newHearts <= 0) {
                setGameState('gameOver');
                onGameComplete?.(gameStats);
              } else {
                setEnemyPosition(100);
                setEnemyAttacking(false);
                setEnemyMoving(true);
              }
            }, 1000);
            return 0;
          }
          return newPos;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [enemyMoving, currentEnemy, enemyPosition, gameStats.hearts]);

  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-800 to-black flex items-center justify-center p-4">
        <Card className="p-6 text-center border-4 border-destructive w-full max-w-sm bg-card">
          <div className="mb-4">
            <MinecraftZombie scale={1.2} />
          </div>
          <h2 className="text-2xl font-pixel text-destructive mb-4">GAME OVER</h2>
          <div className="bg-muted p-3 rounded mb-4 text-sm space-y-1">
            <p className="text-foreground">Score: {gameStats.score}</p>
            <p className="text-cyan-400">Diamonds: {gameStats.diamonds}</p>
            <p className="text-green-400">Level: {gameStats.level}</p>
          </div>
          <Button 
            onClick={restartGame}
            className="w-full font-pixel"
            data-testid="button-respawn"
          >
            RESPAWN
          </Button>
        </Card>
      </div>
    );
  }

  if (gameState === 'levelComplete') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-yellow-400 to-orange-500 flex items-center justify-center p-4">
        <Card className="p-6 text-center border-4 border-yellow-500 w-full max-w-sm bg-card">
          <div className="mb-4">
            <MinecraftSteve scale={1.5} />
          </div>
          <h2 className="text-2xl font-pixel text-yellow-600 mb-4">VICTORY!</h2>
          <div className="bg-muted p-3 rounded mb-4 text-sm space-y-1">
            <p className="text-foreground">Score: {gameStats.score}</p>
            <p className="text-cyan-400">Diamonds: {gameStats.diamonds}</p>
          </div>
          <Button 
            onClick={restartGame}
            className="w-full font-pixel bg-purple-600 hover:bg-purple-700"
            data-testid="button-new-game"
          >
            NEW GAME
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4" style={{ imageRendering: 'pixelated' }}>
      {/* Header Stats */}
      <Card className="p-4 mb-4 border-2 border-card-border">
        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="font-pixel text-foreground">Level {gameStats.level}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-pixel text-foreground">Score: {gameStats.score}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart 
                  key={i} 
                  size={16} 
                  className={i < gameStats.hearts ? "text-red-500 fill-current" : "text-gray-400"} 
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Diamond size={16} className="text-cyan-400" />
              <span className="font-pixel text-cyan-400">{gameStats.diamonds}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap size={16} className="text-yellow-400" />
              <span className="font-pixel text-yellow-400">{gameStats.magicPower}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Game Arena */}
      <Card className="p-4 mb-4 border-2 border-card-border relative min-h-[300px]">
        <div className="flex justify-between items-end h-full">
          {/* Player */}
          <div className="flex flex-col items-center">
            <MinecraftSteve isDefending={playerDefending} />
            <span className="font-pixel text-xs text-green-400 mt-2">YOU</span>
          </div>

          {/* Battle Effects */}
          {showMagicBlast && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl animate-ping">
              ⚡
            </div>
          )}

          {showPointsAnimation && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 font-pixel text-yellow-400 animate-bounce text-lg">
              +{pointsEarned}
            </div>
          )}

          {/* Enemy */}
          {currentEnemy && (
            <div 
              className="absolute bottom-4 transition-all duration-100"
              style={{ right: `${enemyPosition}%` }}
            >
              <MinecraftZombie isAttacking={enemyAttacking} scale={0.8} />
              <div className="text-xs text-center font-pixel text-red-400 mt-1">
                {currentEnemy.name}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Question and Answer */}
      <Card className="p-4 border-2 border-card-border">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-pixel text-foreground">
            {currentQuestion.num1} + {currentQuestion.num2} = ?
          </h2>
          
          <div className="flex gap-2 max-w-xs mx-auto">
            <Input
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Your answer"
              className="text-center font-pixel"
              data-testid="input-answer"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button 
              onClick={handleSubmit}
              disabled={!userAnswer}
              className="font-pixel px-6"
              data-testid="button-submit"
            >
              ATTACK!
            </Button>
          </div>

          {feedback && (
            <div className="font-pixel text-sm text-yellow-400 animate-pulse">
              {feedback}
            </div>
          )}

          {showCelebration && (
            <div className="text-2xl animate-bounce">🎉</div>
          )}
        </div>
      </Card>

      {/* Achievement Notifications */}
      {newAchievements.length > 0 && currentAchievementIndex < newAchievements.length && (
        <AchievementNotification
          achievement={newAchievements[currentAchievementIndex]}
          onClose={handleAchievementClose}
        />
      )}
    </div>
  );
}