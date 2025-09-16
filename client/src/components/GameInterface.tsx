import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card'; // Import CardContent
import { MinecraftSteve, MinecraftZombie, MinecraftSkeleton, MinecraftCreeper, MinecraftWitch, MinecraftDragon, MinecraftBlock } from './MinecraftCharacters';
import { AchievementNotification } from './AchievementBadge';
import { GameInventoryBoard } from './GameInventoryBoard';
import { Heart, Diamond, Zap, Trophy } from 'lucide-react'; // Import Trophy
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
  onBackToDashboard?: () => void; // Added for navigation
  startNewGame?: () => void; // Added for starting a new game
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconType: string;
  pointsRequired: number;
}

// Mock items for GameInventoryBoard - assuming this is where item.name, item.rarity, item.iconName, item.quantity are used
// This is a placeholder and should be replaced with actual inventory data if available
const mockInventoryItems = [
  { id: 'item1', name: 'Sword', rarity: 'Epic', iconName: 'sword', quantity: 1 },
  { id: 'item2', name: 'Shield', rarity: 'Rare', iconName: 'shield', quantity: 1 },
  { id: 'item3', name: 'Potion', rarity: 'Common', iconName: 'potion', quantity: 5 },
  { id: 'item4', name: 'Gold Coin', rarity: 'Common', iconName: 'coin', quantity: 10 },
  { id: 'item5', name: 'Mystery Box', iconName: 'chest', quantity: 2 }, // Missing rarity
  { id: 'item6', name: null, rarity: 'Legendary', iconName: 'gem', quantity: 1 }, // Missing name
  { id: 'item7', iconName: 'arrow', rarity: 'Common', quantity: 20 }, // Missing name
  { id: 'item8', name: 'Empty Slot' }, // Missing rarity and iconName
];

export function GameInterface({ onGameComplete, mockMode = false, onBackToDashboard = () => {}, startNewGame = () => {} }: GameInterfaceProps) {
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
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'levelComplete' | 'menu'>('playing'); // Added 'menu' state
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
    setEnemyPosition(0);
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
    setEnemyPosition(0);
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
    // Start the game with a question when the component mounts or level changes
    if (gameState === 'playing') {
      generateQuestion();
    }
  }, [gameState, gameStats.level]); // Depend on gameState and level

  // Auto-save progress when component unmounts (user leaves game)
  useEffect(() => {
    console.log('GameInterface mounted, setting up auto-save cleanup');
    return () => {
      // Save progress when component unmounts only if there's meaningful progress
      const currentStats = gameStatsRef.current;
      console.log('GameInterface unmounting with stats:', currentStats);
      if (currentStats.score > 0) {
        console.log('Auto-saving progress on component unmount:', currentStats);
        onGameComplete?.(currentStats);
      } else {
        console.log('No meaningful progress to save (score = 0)');
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
    if (enemyMoving && currentEnemy && enemyPosition < 100) {
      const interval = setInterval(() => {
        setEnemyPosition(prev => {
          const newPos = prev + (currentEnemy.speed / 10);
          if (newPos >= 100) {
            setEnemyAttacking(true);
            setEnemyMoving(false);
            setTimeout(() => {
              const newHearts = gameStats.hearts - 1;
              setGameStats(prev => ({ ...prev, hearts: newHearts }));
              if (newHearts <= 0) {
                setGameState('gameOver');
                onGameComplete?.(gameStats);
              } else {
                setEnemyPosition(0);
                setEnemyAttacking(false);
                setEnemyMoving(true);
              }
            }, 1000);
            return 100;
          }
          return newPos;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [enemyMoving, currentEnemy, enemyPosition, gameStats.hearts, onGameComplete, gameStats]); // Added dependencies

  // Game menu state handling
  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-green-900 flex items-center justify-center p-4">
        <Card className="p-6 text-center border-4 border-yellow-500 w-full max-w-sm bg-card">
          <div className="mb-4">
            <MinecraftSteve scale={1.5} />
          </div>
          <h2 className="text-2xl font-pixel text-yellow-600 mb-4">MATH ADVENTURE</h2>
          <p className="text-foreground mb-4">Press "NEW GAME" to begin your quest!</p>
          <Button
            onClick={() => {
              setGameState('playing');
              startNewGame();
            }}
            className="w-full font-pixel bg-purple-600 hover:bg-purple-700"
            data-testid="button-start-game"
          >
            START ADVENTURE
          </Button>
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            className="w-full mt-4 font-pixel border-2 hover:scale-105 transition-all duration-200"
          >
            ← BACK TO DASHBOARD
          </Button>
        </Card>
      </div>
    );
  }

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

  // Destructure gameStats for easier access in JSX
  const { score: currentScore, hearts, diamonds, magicPower } = gameStats;

  return (
    // Removed redundant outer div and applied main styles directly
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4" style={{ imageRendering: 'pixelated' }}>
      {/* Game Header */}
      <div className="relative z-10 p-3 md:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between mb-3 md:mb-6 gap-2 md:gap-0">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
              <Button
                onClick={onBackToDashboard}
                variant="outline"
                size="sm"
                className="font-pixel border-2 hover:scale-105 transition-all duration-200 text-xs md:text-sm w-full md:w-auto"
              >
                ← DASHBOARD
              </Button>
              <h1 className="font-pixel text-sm md:text-2xl text-white animate-pulse text-center">
                🏹 MINECRAFT MATH ⚔️
              </h1>
            </div>
            <div className="flex gap-2 md:gap-3 w-full md:w-auto justify-center">
              <Button
                onClick={startNewGame}
                variant="outline"
                size="sm"
                className="font-pixel border-2 hover:scale-105 transition-all duration-200 text-xs md:text-sm flex-1 md:flex-none"
                disabled={gameState !== 'playing'} // Only disable if not playing
              >
                🔄 NEW GAME
              </Button>
            </div>
          </div>
          {/* Game Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-3 md:mb-6">
            <Card className="border-2 border-red-600 bg-gradient-to-br from-red-900/80 to-red-800/60">
              <CardContent className="p-2 md:p-4 text-center">
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <Heart className="h-4 w-4 md:h-6 md:w-6 text-red-400 animate-pulse" />
                  <span className="font-pixel text-white text-sm md:text-lg">{hearts}</span>
                </div>
                <p className="text-red-300 text-xs md:text-sm font-pixel">❤️ Lives</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-600 bg-gradient-to-br from-blue-900/80 to-blue-800/60">
              <CardContent className="p-2 md:p-4 text-center">
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <Trophy className="h-4 w-4 md:h-6 md:w-6 text-yellow-400 animate-bounce" />
                  <span className="font-pixel text-white text-sm md:text-lg">{currentScore}</span>
                </div>
                <p className="text-blue-300 text-xs md:text-sm font-pixel">🏆 Score</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-600 bg-gradient-to-br from-green-900/80 to-green-800/60">
              <CardContent className="p-2 md:p-4 text-center">
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <Zap className="h-4 w-4 md:h-6 md:w-6 text-yellow-400 animate-pulse" />
                  <span className="font-pixel text-white text-sm md:text-lg">{gameStats.level}</span>
                </div>
                <p className="text-green-300 text-xs md:text-sm font-pixel">⚡ Level</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-600 bg-gradient-to-br from-purple-900/80 to-purple-800/60">
              <CardContent className="p-2 md:p-4 text-center">
                <div className="flex items-center justify-center gap-1 md:gap-2 mb-1 md:mb-2">
                  <Diamond className="h-4 w-4 md:h-6 md:w-6 text-cyan-400 animate-spin" />
                  <span className="font-pixel text-white text-sm md:text-lg">{diamonds}</span>
                </div>
                <p className="text-purple-300 text-xs md:text-sm font-pixel">💎 Gems</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

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

        <div className="relative z-10 flex justify-end items-end h-full">
          {/* Player - positioned on the right */}
          <div className="flex flex-col items-center relative">
            <MinecraftSteve isDefending={playerDefending} />
            <span className="font-pixel text-xs text-green-400 mt-2 bg-black bg-opacity-50 px-2 py-1 rounded">
              🛡️ STEVE
            </span>
            {/* Magic power indicator */}
            {magicPower > 0 && (
              <div className="absolute -top-4 -right-4 bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-pixel animate-pulse">
                {magicPower}
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
          {currentEnemy && enemyPosition >= 70 && !playerDefending && (
            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-red-500 font-pixel text-sm animate-pulse bg-black bg-opacity-70 px-4 py-2 rounded-lg border-2 border-red-500">
              ⚠️ {currentEnemy.sound} ⚠️
            </div>
          )}

          {/* Enemy */}
          {currentEnemy && (
            <div
              className="absolute bottom-4 transition-all duration-100"
              style={{ left: `${enemyPosition}%` }}
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
            // Pass mock items or actual inventory data here
            items={mockInventoryItems}
            onItemClick={(item) => console.log('Clicked on item:', item)} // Placeholder for item click handler
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