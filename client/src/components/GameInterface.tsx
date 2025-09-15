import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MinecraftSteve, MinecraftZombie, MinecraftSkeleton, MinecraftCreeper, MinecraftWitch, MinecraftDragon, MinecraftBlock } from './MinecraftCharacters';
import { AchievementNotification } from './AchievementBadge';
import { GameInventoryBoard } from './GameInventoryBoard';
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

  // Keep latest gameStats in ref for cleanup
  const gameStatsRef = useRef(gameStats);
  useEffect(() => {
    gameStatsRef.current = gameStats;
  }, [gameStats]);

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

  // Mock data and states for the old `handleAnswerSubmit` function, which are not directly used in the new implementation but were part of the original structure that needed replacement.
  // These are kept to ensure the context of the change is clear, but their values are not critical as the new `handleSubmit` logic supersedes them.
  const [score, setScore] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [enemyHealth, setEnemyHealth] = useState(100);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStartTime, setGameStartTime] = useState(Date.now());
  const [currentProblem, setCurrentProblem] = useState({ answer: 0 }); // Placeholder for the old structure
  const [answer, setAnswer] = useState(''); // Placeholder for the old structure

  const enemies: Enemy[] = [
    { name: 'Zombie', speed: 8, sound: '💀 GRRRR!', defeatSound: '💥 ARGHHHH!' },
    { name: 'Skeleton', speed: 6, sound: '🏹 CLACK CLACK!', defeatSound: '💀 CRACK!' },
    { name: 'Creeper', speed: 10, sound: '💣 SSSSSS!', defeatSound: '💥 BOOM!' },
    { name: 'Witch', speed: 5, sound: '🧙‍♀️ CACKLE!', defeatSound: '⚡ NOOO!' },
    { name: 'Dragon', speed: 12, sound: '🐲 ROAAAAR!', defeatSound: '🔥 DEFEATED!' }
  ];

  const generateQuestion = () => {
    const maxNum = Math.min(5 + gameStats.level * 2, 15);
    const num1 = Math.floor(Math.random() * maxNum) + 1;
    const num2 = Math.floor(Math.random() * maxNum) + 1;
    setCurrentQuestion({ num1, num2 });

    // Show different enemies on each question for variety!
    const randomEnemyIndex = Math.floor(Math.random() * enemies.length);
    setCurrentEnemy(enemies[randomEnemyIndex]);
    setEnemyPosition(100);
    setEnemyMoving(true);
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
        setFeedback(`${currentEnemy.defeatSound} +${earnedPoints} POINTS! 🌟`);
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

  // Auto-save progress when component unmounts (user leaves game)
  useEffect(() => {
    return () => {
      // Save progress when component unmounts only if there's meaningful progress
      const currentStats = gameStatsRef.current;
      if (currentStats.score > 0) {
        console.log('Auto-saving progress on component unmount:', currentStats);
        onGameComplete?.(currentStats);
      }
    };
  }, [onGameComplete]); // Only depend on onGameComplete, use ref for latest gameStats

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
      <Card className="p-4 mb-4 border-2 border-card-border relative min-h-[300px] bg-gradient-to-b from-sky-300 to-green-400 overflow-hidden">
        {/* Minecraft-style background blocks */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-green-600 via-green-700 to-green-600 opacity-30"></div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-amber-800 via-amber-900 to-amber-800"></div>

        {/* Floating blocks decoration */}
        <div className="absolute top-4 left-4">
          <MinecraftBlock type="grass" size={12} />
        </div>
        <div className="absolute top-4 right-4">
          <MinecraftBlock type="stone" size={12} />
        </div>
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
          <MinecraftBlock type="dirt" size={8} />
        </div>

        <div className="relative z-10 flex justify-between items-end h-full">
          {/* Player */}
          <div className="flex flex-col items-center relative">
            <MinecraftSteve isDefending={playerDefending} />
            <span className="font-pixel text-xs text-green-400 mt-2 bg-black bg-opacity-50 px-2 py-1 rounded">
              🛡️ STEVE
            </span>
            {/* Magic power indicator */}
            {gameStats.magicPower > 0 && (
              <div className="absolute -top-4 -right-4 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-pixel animate-pulse">
                {gameStats.magicPower}
              </div>
            )}
          </div>

          {/* Battle Effects */}
          {showMagicBlast && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl animate-ping z-20">
              <div className="text-yellow-400 animate-spin">⚡</div>
              <div className="text-blue-400 animate-pulse">💫</div>
              <div className="text-purple-400 animate-bounce">✨</div>
            </div>
          )}

          {showPointsAnimation && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 font-pixel text-yellow-400 animate-bounce text-lg z-20 bg-black bg-opacity-50 px-3 py-1 rounded-lg border-2 border-yellow-400">
              +{pointsEarned} XP
            </div>
          )}

          {/* Enemy approaching warning */}
          {currentEnemy && enemyPosition <= 30 && !playerDefending && (
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-red-500 font-pixel text-sm animate-pulse bg-black bg-opacity-70 px-4 py-2 rounded-lg border-2 border-red-500">
              ⚠️ {currentEnemy.sound} ⚠️
            </div>
          )}

          {/* Enemy */}
          {currentEnemy && (
            <div 
              className="absolute bottom-4 transition-all duration-100"
              style={{ right: `${enemyPosition}%` }}
            >
              {currentEnemy.name === 'Zombie' && <MinecraftZombie isAttacking={enemyAttacking} scale={0.8} />}
              {currentEnemy.name === 'Skeleton' && <MinecraftSkeleton isAttacking={enemyAttacking} scale={0.8} />}
              {currentEnemy.name === 'Creeper' && <MinecraftCreeper isAttacking={enemyAttacking} scale={0.8} />}
              {currentEnemy.name === 'Witch' && <MinecraftWitch isAttacking={enemyAttacking} scale={0.8} />}
              {currentEnemy.name === 'Dragon' && <MinecraftDragon isAttacking={enemyAttacking} scale={0.6} />}
              <div className="text-xs text-center font-pixel text-red-400 mt-1">
                {currentEnemy.name === 'Zombie' && '🧟'} 
                {currentEnemy.name === 'Skeleton' && '💀'} 
                {currentEnemy.name === 'Creeper' && '💣'} 
                {currentEnemy.name === 'Witch' && '🧙‍♀️'} 
                {currentEnemy.name === 'Dragon' && '🐲'} 
                {currentEnemy.name}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Game Content - Side by side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Question and Answer */}
        <Card className="lg:col-span-2 p-4 border-2 border-card-border">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-pixel text-foreground bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent border-2 border-blue-400 bg-black bg-opacity-30 px-4 py-2 rounded-lg">
              ⚡ {currentQuestion.num1} + {currentQuestion.num2} = ? ⚡
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
                className="font-pixel px-6 bg-red-600 hover:bg-red-700 border-2 border-red-800 text-white shadow-lg hover:scale-105 transition-all duration-200"
                data-testid="button-submit"
              >
                ⚔️ ATTACK!
              </Button>
            </div>

            {feedback && (
              <div className="font-pixel text-sm text-yellow-400 animate-pulse bg-black bg-opacity-50 px-4 py-2 rounded-lg border border-yellow-400">
                {feedback}
              </div>
            )}

            {showCelebration && (
              <div className="text-2xl animate-bounce flex gap-2">
                🎉 🏆 🎉
              </div>
            )}
          </div>
        </Card>

        {/* Game Inventory Board */}
        <div className="lg:col-span-1">
          <GameInventoryBoard 
            onInventoryUpdate={() => {
              // Optionally trigger any updates needed
            }}
          />
        </div>
      </div>

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