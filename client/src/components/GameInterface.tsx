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
  operation: '+' | '-' | '*';
  answer: number;
  points: number;
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
  const [timeLeft, setTimeLeft] = useState(15); // 15 seconds timer
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

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
    { name: 'Zombie', speed: 1.5, sound: '💀 GRRRR!', defeatSound: '💥 ARGHHHH!' },
    { name: 'Skeleton', speed: 1.2, sound: '🏹 CLACK CLACK!', defeatSound: '💀 CRACK!' },
    { name: 'Creeper', speed: 1.8, sound: '💣 SSSSSS!', defeatSound: '💥 BOOM!' },
    { name: 'Witch', speed: 1.0, sound: '🧙‍♀️ CACKLE!', defeatSound: '⚡ NOOO!' },
    { name: 'Dragon', speed: 2.0, sound: '🐲 ROAAAAR!', defeatSound: '🔥 DEFEATED!' }
  ];

  const generateQuestion = async () => {
    // Get user age for difficulty adjustment
    let userAge = 10; // Default age
    try {
      if (!mockMode) {
        const response = await fetch('/api/auth/user');
        if (response.ok) {
          const userData = await response.json();
          userAge = userData.age || 10;
        }
      }
    } catch (error) {
      console.log('Could not fetch user age, using default');
    }

    // Canadian education system difficulty levels
    const getDifficultySettings = (age: number, level: number) => {
      const baseLevel = Math.min(level, 5); // Cap at level 5
      
      if (age >= 8 && age <= 9) {
        // Grade 3: Basic addition and subtraction
        return {
          additionMax: Math.min(10 + baseLevel * 2, 20),
          subtractionMax: Math.min(10 + baseLevel * 2, 20),
          multiplicationMax: 3, // Very basic: 1x1 to 3x3
          allowDivision: false,
          operations: ['+', '-'] as const
        };
      } else if (age >= 10 && age <= 11) {
        // Grade 4-5: Introduction to multiplication, larger addition/subtraction
        return {
          additionMax: Math.min(25 + baseLevel * 5, 50),
          subtractionMax: Math.min(25 + baseLevel * 5, 50),
          multiplicationMax: Math.min(5 + baseLevel, 10),
          allowDivision: baseLevel >= 2,
          operations: ['+', '-', '*'] as const
        };
      } else if (age >= 12 && age <= 13) {
        // Grade 6-7: More complex operations
        return {
          additionMax: Math.min(50 + baseLevel * 10, 100),
          subtractionMax: Math.min(50 + baseLevel * 10, 100),
          multiplicationMax: Math.min(10 + baseLevel * 2, 15),
          allowDivision: true,
          operations: ['+', '-', '*', '/'] as const
        };
      } else if (age >= 14 && age <= 15) {
        // Grade 8-9: Advanced operations
        return {
          additionMax: Math.min(75 + baseLevel * 15, 150),
          subtractionMax: Math.min(75 + baseLevel * 15, 150),
          multiplicationMax: Math.min(15 + baseLevel * 3, 25),
          allowDivision: true,
          operations: ['+', '-', '*', '/'] as const
        };
      } else {
        // Grade 10+ or adults: Most challenging
        return {
          additionMax: Math.min(100 + baseLevel * 20, 200),
          subtractionMax: Math.min(100 + baseLevel * 20, 200),
          multiplicationMax: Math.min(20 + baseLevel * 5, 50),
          allowDivision: true,
          operations: ['+', '-', '*', '/'] as const
        };
      }
    };

    const settings = getDifficultySettings(userAge, gameStats.level);
    const availableOperations = settings.allowDivision && gameStats.level >= 2 
      ? settings.operations 
      : settings.operations.filter(op => op !== '/');
    
    const operation = availableOperations[Math.floor(Math.random() * availableOperations.length)];
    
    let num1: number, num2: number, answer: number, points: number;
    
    if (operation === '+') {
      // Addition
      num1 = Math.floor(Math.random() * settings.additionMax) + 1;
      num2 = Math.floor(Math.random() * settings.additionMax) + 1;
      answer = num1 + num2;
      points = 10;
    } else if (operation === '-') {
      // Subtraction (ensure positive result)
      num1 = Math.floor(Math.random() * settings.subtractionMax) + 10;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      answer = num1 - num2;
      points = 15;
    } else if (operation === '*') {
      // Multiplication
      num1 = Math.floor(Math.random() * settings.multiplicationMax) + 1;
      num2 = Math.floor(Math.random() * settings.multiplicationMax) + 1;
      answer = num1 * num2;
      points = 20;
    } else {
      // Division (ensure whole number result)
      num2 = Math.floor(Math.random() * 9) + 2; // divisor 2-10
      answer = Math.floor(Math.random() * 15) + 1; // quotient 1-15
      num1 = num2 * answer; // dividend
      points = 25;
    }
    
    setCurrentQuestion({ num1, num2, operation: operation as '+' | '-' | '*', answer, points });

    // Reset timer to 15 seconds
    setTimeLeft(15);
    setQuestionStartTime(Date.now());

    // Show different enemies on each question for variety!
    const randomEnemyIndex = Math.floor(Math.random() * enemies.length);
    setCurrentEnemy(enemies[randomEnemyIndex]);
    setEnemyPosition(0); // Start from left side
    setEnemyAttacking(false); // Reset attack state
    setEnemyMoving(true); // Start moving
  };

  const handleSubmit = () => {
    const userAnswerNumber = parseInt(userAnswer);

    if (userAnswerNumber === currentQuestion.answer) {
      const earnedPoints = currentQuestion.points;
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

      // Different celebration messages based on operation
      let celebrationEmoji = '';
      if (currentQuestion.operation === '+') celebrationEmoji = '➕';
      else if (currentQuestion.operation === '-') celebrationEmoji = '➖'; 
      else if (currentQuestion.operation === '*') celebrationEmoji = '✖️';

      if (currentEnemy) {
        setFeedback(`${currentEnemy.defeatSound} ${celebrationEmoji} +${earnedPoints} POINTS! 🌟`);
      } else {
        setFeedback(`✨ Perfect! ${celebrationEmoji} +${earnedPoints} POINTS! 🌟`);
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
            setTimeout(() => {
              setFeedback('');
              generateQuestion();
            }, 2000);
          } else {
            setGameState('levelComplete');
            onGameComplete?.(newStats);
          }
        } else {
          generateQuestion();
        }
      }, 2000);
    } else {
      setFeedback(`❌ Wrong answer! Correct answer: ${currentQuestion.answer} (No points earned)`);
      
      // Wrong answer gives enemy advantage - reduces time by 3 seconds
      setTimeLeft(prev => Math.max(1, prev - 3));

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
  }, [gameState, gameStats.level]); // Only depend on gameState and level changes

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

  // Timer countdown effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Time's up! Enemy wins
            setEnemyAttacking(true);
            setEnemyMoving(false);
            setFeedback('⏰ Time\'s up! Enemy attacks!');
            
            setTimeout(() => {
              const newHearts = gameStats.hearts - 1;
              setGameStats(prev => ({ ...prev, hearts: newHearts }));
              if (newHearts <= 0) {
                setGameState('gameOver');
                onGameComplete?.(gameStats);
              } else {
                setFeedback('');
                setUserAnswer('');
                generateQuestion();
              }
            }, 2000);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState, gameStats.hearts, onGameComplete]); // Remove timeLeft from dependencies

  // Enemy movement effect - consistent movement over 15 seconds
  useEffect(() => {
    if (enemyMoving && currentEnemy && enemyPosition < 100) {
      const startTime = Date.now();
      const duration = 15000; // 15 seconds in milliseconds
      
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1); // 0 to 1
        const newPosition = progress * 100; // 0 to 100%
        
        setEnemyPosition(newPosition);
        
        // Stop when enemy reaches player or time is up
        if (progress >= 1) {
          setEnemyMoving(false);
          clearInterval(interval);
        }
      }, 50); // Update every 50ms for smooth animation
      
      return () => clearInterval(interval);
    }
  }, [enemyMoving, currentEnemy]);

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

      {/* Game Arena - Enhanced mobile layout */}
      <Card className="p-3 md:p-4 mb-3 md:mb-4 border-2 border-card-border relative min-h-[140px] md:min-h-[300px] bg-gradient-to-b from-sky-300 to-green-400 overflow-hidden">
        {/* Minecraft-style background blocks */}
        <div className="absolute top-0 left-0 right-0 h-3 md:h-8 bg-gradient-to-r from-green-600 via-green-700 to-green-600 opacity-40"></div>
        <div className="absolute bottom-0 left-0 right-0 h-3 md:h-8 bg-gradient-to-r from-amber-800 via-amber-900 to-amber-800"></div>

        {/* Floating blocks decoration - minimal on mobile */}
        <div className="hidden md:block absolute top-4 left-4">
          <MinecraftBlock type="grass" size={12} />
        </div>
        <div className="hidden md:block absolute top-4 right-4">
          <MinecraftBlock type="stone" size={12} />
        </div>

        <div className="relative z-10 flex justify-between items-center h-full px-1 md:px-0">
          {/* Enemy - Enhanced mobile positioning */}
          {currentEnemy && (
            <div className="flex flex-col items-center absolute bottom-4 scale-90 md:scale-100 transition-all duration-200"
                 style={{ 
                   left: `${enemyPosition}%`,
                   transform: `translateX(-50%)` // Center the enemy on its position
                 }}>
              {currentEnemy.name === 'Zombie' && <MinecraftZombie isAttacking={enemyAttacking} scale={0.7} />}
              {currentEnemy.name === 'Skeleton' && <MinecraftSkeleton isAttacking={enemyAttacking} scale={0.7} />}
              {currentEnemy.name === 'Creeper' && <MinecraftCreeper isAttacking={enemyAttacking} scale={0.7} />}
              {currentEnemy.name === 'Witch' && <MinecraftWitch isAttacking={enemyAttacking} scale={0.7} />}
              {currentEnemy.name === 'Dragon' && <MinecraftDragon isAttacking={enemyAttacking} scale={0.5} />}
              <div className="text-xs text-center font-pixel text-red-400 mt-1 bg-black bg-opacity-60 px-1 py-0.5 rounded">
                {currentEnemy.name === 'Zombie' && '🧟'}
                {currentEnemy.name === 'Skeleton' && '💀'}
                {currentEnemy.name === 'Creeper' && '💣'}
                {currentEnemy.name === 'Witch' && '🧙‍♀️'}
                {currentEnemy.name === 'Dragon' && '🐲'}
                <span className="hidden sm:inline ml-1">{currentEnemy.name}</span>
              </div>
            </div>
          )}

          {/* Player - Enhanced positioning */}
          <div className="flex flex-col items-center relative scale-90 md:scale-100">
            <MinecraftSteve isDefending={playerDefending} />
            <span className="font-pixel text-xs text-green-400 mt-1 md:mt-2 bg-black bg-opacity-60 px-2 py-0.5 rounded">
              🛡️ <span className="hidden sm:inline ml-1">STEVE</span>
            </span>
            {/* Magic power indicator */}
            {magicPower > 0 && (
              <div className="absolute -top-1 md:-top-4 -right-1 md:-right-4 bg-purple-600 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-xs font-pixel animate-pulse border border-purple-400">
                {magicPower}
              </div>
            )}
          </div>

          {/* Battle Effects - Enhanced mobile visibility */}
          {showMagicBlast && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="flex gap-1 text-xl md:text-4xl animate-ping">
                <div className="text-yellow-400 animate-spin">⚡</div>
                <div className="text-blue-400 animate-pulse">💫</div>
                <div className="text-purple-400 animate-bounce">✨</div>
              </div>
            </div>
          )}

          {showPointsAnimation && (
            <div className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 font-pixel text-yellow-400 animate-bounce text-sm md:text-lg z-20 bg-black bg-opacity-70 px-3 py-1 rounded-lg border-2 border-yellow-400 shadow-lg">
              +{pointsEarned} XP
            </div>
          )}

          {/* Enemy approaching warning - Better mobile visibility */}
          {currentEnemy && enemyPosition >= 70 && !playerDefending && (
            <div className="absolute top-3 md:top-1/4 left-1/2 transform -translate-x-1/2 text-red-400 font-pixel text-xs md:text-sm animate-pulse bg-black bg-opacity-80 px-2 md:px-4 py-1 md:py-2 rounded-lg border-2 border-red-500 shadow-lg">
              ⚠️ DANGER! ⚠️
            </div>
          )}
        </div>
      </Card>

      {/* Main Game Content - Side by side layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Question and Answer - Enhanced mobile layout */}
        <Card className="lg:col-span-2 p-3 md:p-4 border-2 border-card-border bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-sm">
          <div className="text-center space-y-3 md:space-y-4">
            <div className="space-y-3 md:space-y-3">
              <h2 className="text-xl md:text-2xl font-pixel text-foreground bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent border-2 border-blue-400 bg-black bg-opacity-40 px-3 md:px-4 py-2 md:py-3 rounded-lg shadow-lg">
                ⚡ {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ? ⚡
              </h2>
              
              {/* Show point value for current question */}
              <div className={`text-center font-pixel text-sm px-3 py-1 rounded-lg border-2 inline-block ${
                currentQuestion.operation === '+' ? 'bg-green-900/70 border-green-400 text-green-100' :
                currentQuestion.operation === '-' ? 'bg-blue-900/70 border-blue-400 text-blue-100' :
                'bg-purple-900/70 border-purple-400 text-purple-100'
              }`}>
                {currentQuestion.operation === '+' && '➕ Addition: 10 points'}
                {currentQuestion.operation === '-' && '➖ Subtraction: 15 points'}
                {currentQuestion.operation === '*' && '✖️ Multiplication: 20 points'}
              </div>
              
              {/* Timer Display - Better mobile visibility */}
              <div className={`text-center font-pixel text-base md:text-lg px-3 md:px-4 py-2 md:py-2 rounded-lg border-2 shadow-md transition-all duration-300 ${
                timeLeft <= 5 
                  ? 'bg-red-900/70 border-red-400 text-red-100 animate-pulse scale-105' 
                  : timeLeft <= 10 
                  ? 'bg-yellow-900/70 border-yellow-400 text-yellow-100 animate-pulse' 
                  : 'bg-green-900/70 border-green-400 text-green-100'
              }`}>
                ⏰ <span className="hidden sm:inline">Time: </span>{timeLeft}s
              </div>
            </div>

            <div className="flex gap-2 md:gap-3 max-w-sm mx-auto">
              <Input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Answer"
                className="text-center font-pixel text-base md:text-base h-10 md:h-11 bg-background/90 border-2 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                data-testid="input-answer"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                onClick={handleSubmit}
                disabled={!userAnswer}
                className="font-pixel px-4 md:px-6 text-sm md:text-sm bg-red-600 hover:bg-red-700 border-2 border-red-800 text-white shadow-lg hover:scale-105 transition-all duration-200 h-10 md:h-11 min-w-[80px] md:min-w-[100px]"
                data-testid="button-submit"
              >
                ⚔️ <span className="hidden sm:inline ml-1">ATTACK</span>
              </Button>
            </div>

            {feedback && (
              <div className="font-pixel text-sm md:text-sm text-yellow-200 animate-pulse bg-black bg-opacity-70 px-3 md:px-4 py-2 md:py-2 rounded-lg border-2 border-yellow-400 shadow-md max-w-md mx-auto">
                {feedback}
              </div>
            )}

            {showCelebration && (
              <div className="text-2xl md:text-3xl animate-bounce flex gap-2 justify-center py-2">
                🎉 🏆 🎉
              </div>
            )}
          </div>
        </Card>

        {/* Game Inventory Board - Hidden on mobile to save space */}
        <div className="lg:col-span-1 hidden md:block">
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