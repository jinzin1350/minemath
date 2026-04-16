import { useState, useEffect, useRef, useCallback } from 'react';
import { MinecraftSteve, MinecraftZombie, MinecraftSkeleton, MinecraftCreeper, MinecraftWitch, MinecraftDragon } from './MinecraftCharacters';
import { AchievementNotification } from './AchievementBadge';
import { GameInventoryBoard } from './GameInventoryBoard';

interface GameStats {
  level: number;
  score: number;
  hearts: number;
  diamonds: number;
  wrongAnswers: number;
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
  onBackToDashboard?: () => void;
  startNewGame?: () => void;
  onStatsUpdate?: (stats: GameStats) => void; // called on every stat change so parent can save mid-game
  startLevel?: number; // resume from last saved level
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconType: string;
  pointsRequired: number;
}

const mockInventoryItems = [
  { id: 'item1', name: 'Sword', rarity: 'Epic', iconName: 'sword', quantity: 1 },
  { id: 'item2', name: 'Shield', rarity: 'Rare', iconName: 'shield', quantity: 1 },
  { id: 'item3', name: 'Potion', rarity: 'Common', iconName: 'potion', quantity: 5 },
  { id: 'item4', name: 'Gold Coin', rarity: 'Common', iconName: 'coin', quantity: 10 },
  { id: 'item5', name: 'Mystery Box', iconName: 'chest', quantity: 2 },
  { id: 'item6', name: null, rarity: 'Legendary', iconName: 'gem', quantity: 1 },
  { id: 'item7', iconName: 'arrow', rarity: 'Common', quantity: 20 },
  { id: 'item8', name: 'Empty Slot' },
];

// ── Audio helper ─────────────────────────────────────────────
function playBeep(type: 'hit' | 'correct' | 'levelup' = 'hit') {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === 'hit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } else {
      // Level up: triumphant 5-note fanfare  C E G E C(high)
      const notes = [523, 659, 784, 659, 1046];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.type = 'sine';
        const t = ctx.currentTime + i * 0.13;
        o.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.start(t); o.stop(t + 0.18);
      });
      return; // early return — already handled above
    }
  } catch (_) {}
}

export function GameInterface({ onGameComplete, mockMode = false, onBackToDashboard = () => {}, startNewGame = () => {}, onStatsUpdate, startLevel = 1 }: GameInterfaceProps) {
  const [gameStats, setGameStats] = useState<GameStats>({
    level: startLevel, score: 0, hearts: 3, diamonds: 0, wrongAnswers: 0, magicPower: 0
  });
  const gameStatsRef = useRef(gameStats);
  useEffect(() => {
    gameStatsRef.current = gameStats;
    onStatsUpdate?.(gameStats); // keep parent ref in sync for mid-game saves
  }, [gameStats]);

  const [currentQuestion, setCurrentQuestion] = useState<Question>({ num1: 0, num2: 0 } as Question);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'gameOver' | 'levelComplete' | 'menu'>('playing');
  const [enemyPosition, setEnemyPosition] = useState(0);
  const [enemyAttacking, setEnemyAttacking] = useState(false);
  const [playerDefending, setPlayerDefending] = useState(false);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [enemyMoving, setEnemyMoving] = useState(false);
  const [showMagicBlast, setShowMagicBlast] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  // Fix 3: collision explosion
  const [showExplosion, setShowExplosion] = useState(false);
  // Level up celebration overlay
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [levelUpNumber, setLevelUpNumber] = useState(1);
  const collisionInProgressRef = useRef(false);

  const enemies: Enemy[] = [
    { name: 'Zombie',   speed: 1.5, sound: '💀 GRRRR!',      defeatSound: '💥 ARGHHHH!' },
    { name: 'Skeleton', speed: 1.2, sound: '🏹 CLACK CLACK!', defeatSound: '💀 CRACK!' },
    { name: 'Creeper',  speed: 1.8, sound: '💣 SSSSSS!',      defeatSound: '💥 BOOM!' },
    { name: 'Witch',    speed: 1.0, sound: '🧙‍♀️ CACKLE!',   defeatSound: '⚡ NOOO!' },
    { name: 'Dragon',   speed: 2.0, sound: '🐲 ROAAAAR!',     defeatSound: '🔥 DEFEATED!' },
  ];

  const generateQuestion = useCallback(async () => {
    collisionInProgressRef.current = false;
    let userAge = 10;
    try {
      if (!mockMode) {
        const r = await fetch('/api/auth/user');
        if (r.ok) { const d = await r.json(); userAge = d.age || 10; }
      }
    } catch (_) {}

    const getDiff = (age: number, level: number) => {
      const bl = Math.min(level, 5);
      if (age <= 9)  return { addMax: Math.min(10+bl*2,20),  subMax: Math.min(10+bl*2,20),  mulMax: 3,            ops: ['+','-'] as const };
      if (age <= 11) return { addMax: Math.min(25+bl*5,50),  subMax: Math.min(25+bl*5,50),  mulMax: Math.min(5+bl,10),   ops: ['+','-','*'] as const };
      if (age <= 13) return { addMax: Math.min(50+bl*10,100),subMax: Math.min(50+bl*10,100),mulMax: Math.min(10+bl*2,15),ops: ['+','-','*','/'] as const };
      return            { addMax: Math.min(75+bl*15,150),subMax: Math.min(75+bl*15,150),mulMax: Math.min(15+bl*3,25),ops: ['+','-','*','/'] as const };
    };

    const s = getDiff(userAge, gameStats.level);
    const ops = s.ops.filter(o => o !== '/' || gameStats.level >= 2);
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1: number, n2: number, ans: number, pts: number;

    if (op === '+')      { n1 = Math.floor(Math.random()*s.addMax)+1; n2 = Math.floor(Math.random()*s.addMax)+1; ans = n1+n2; pts = 10; }
    else if (op === '-') { n1 = Math.floor(Math.random()*s.subMax)+10; n2 = Math.floor(Math.random()*(n1-1))+1; ans = n1-n2; pts = 15; }
    else if (op === '*') { n1 = Math.floor(Math.random()*s.mulMax)+1; n2 = Math.floor(Math.random()*s.mulMax)+1; ans = n1*n2; pts = 20; }
    else                 { n2 = Math.floor(Math.random()*9)+2; ans = Math.floor(Math.random()*15)+1; n1 = n2*ans; pts = 25; }

    setCurrentQuestion({ num1: n1, num2: n2, operation: op as '+' | '-' | '*', answer: ans, points: pts });
    setTimeLeft(15);
    setEnemyPosition(0);
    setEnemyAttacking(false);
    setEnemyMoving(true);
    setShowExplosion(false);
    setCurrentEnemy(enemies[Math.floor(Math.random() * enemies.length)]);
  }, [gameStats.level, mockMode]);

  // Fix 3: collision handler
  const handleCollision = useCallback(() => {
    if (collisionInProgressRef.current) return;
    collisionInProgressRef.current = true;
    setEnemyMoving(false);
    setShowExplosion(true);
    playBeep('hit');

    const currentStats = gameStatsRef.current;
    const newHearts = Math.max(0, currentStats.hearts - 1);
    // Build the final snapshot NOW (before setState async update)
    const updatedStats = { ...currentStats, hearts: newHearts, wrongAnswers: currentStats.wrongAnswers + 1 };
    setGameStats(updatedStats);

    setTimeout(() => {
      setShowExplosion(false);
      if (newHearts <= 0) {
        setGameState('gameOver');
        onGameComplete?.(updatedStats); // ✅ use snapshot, not stale ref
      } else {
        setFeedback('');
        setUserAnswer('');
        generateQuestion();
      }
    }, 1600);
  }, [generateQuestion, onGameComplete]);

  const handleSubmit = useCallback(() => {
    if (collisionInProgressRef.current) return;
    const num = parseInt(userAnswer);
    if (num === currentQuestion.answer) {
      const pts = currentQuestion.points;
      setPointsEarned(pts);
      setShowPointsAnimation(true);
      setPlayerDefending(true);
      setShowMagicBlast(true);
      setEnemyMoving(false);
      playBeep('correct');

      const newStats = {
        ...gameStatsRef.current,
        score: gameStatsRef.current.score + pts,
        diamonds: gameStatsRef.current.diamonds + 1,
        magicPower: gameStatsRef.current.magicPower + gameStatsRef.current.level,
      };
      setGameStats(newStats);
      if (!mockMode) checkForAchievements(newStats.score);

      const opEmoji = currentQuestion.operation === '+' ? '➕' : currentQuestion.operation === '-' ? '➖' : '✖️';
      setFeedback(currentEnemy ? `${currentEnemy.defeatSound} ${opEmoji} +${pts} PTS!` : `✨ PERFECT! ${opEmoji} +${pts} PTS!`);
      setShowCelebration(true);

      setTimeout(() => {
        setShowCelebration(false);
        setShowMagicBlast(false);
        setPlayerDefending(false);
        setShowPointsAnimation(false);
        setFeedback('');
        setUserAnswer('');

        if (newStats.score >= gameStatsRef.current.level * 50) {
          if (gameStatsRef.current.level < 5) {
            // snapshot level-up immediately so ref stays in sync
            const levelUpStats = { ...gameStatsRef.current, level: gameStatsRef.current.level + 1 };
            setGameStats(levelUpStats);
            gameStatsRef.current = levelUpStats;
            playBeep('levelup');
            // show level-up overlay
            setLevelUpNumber(levelUpStats.level);
            setShowLevelUp(true);
            setTimeout(() => setShowLevelUp(false), 2500);
          } else {
            setGameState('levelComplete');
            onGameComplete?.(newStats);
            return;
          }
        }
        generateQuestion();
      }, 1800);
    } else {
      // Build snapshot immediately so ref stays in sync for next onGameComplete call
      const wrongStats = {
        ...gameStatsRef.current,
        score: Math.max(0, gameStatsRef.current.score - 2),
        wrongAnswers: gameStatsRef.current.wrongAnswers + 1,
      };
      setGameStats(wrongStats);
      gameStatsRef.current = wrongStats; // ✅ keep ref in sync right away
      setFeedback('❌ WRONG! TRY AGAIN!');
      setEnemyPosition(prev => Math.min(85, prev + 12));
      setUserAnswer('');
      setTimeout(() => setFeedback(''), 900);
    }
  }, [userAnswer, currentQuestion, currentEnemy, generateQuestion, mockMode, onGameComplete]);

  const restartGame = () => {
    collisionInProgressRef.current = false;
    setGameStats({ level: 1, score: 0, hearts: 3, diamonds: 0, wrongAnswers: 0, magicPower: 0 });
    setEnemyPosition(0);
    setEnemyAttacking(false);
    setPlayerDefending(false);
    setEnemyMoving(false);
    setShowMagicBlast(false);
    setShowPointsAnimation(false);
    setShowExplosion(false);
    setUserAnswer('');
    setFeedback('');
    setGameState('playing');
  };

  // Save progress then go home — called when user taps ← HOME mid-game
  const handleGoHome = () => {
    const s = gameStatsRef.current;
    const totalAnswered = s.diamonds + s.wrongAnswers;
    if (totalAnswered > 0) {
      // always save if at least one question was answered
      onGameComplete?.(s);
    } else {
      onBackToDashboard();
    }
  };

  useEffect(() => {
    if (gameState === 'playing') generateQuestion();
  }, [gameState]);

  // NOTE: intentionally no unmount cleanup calling onGameComplete —
  // doing so would double-save progress and corrupt daily stats in the DB.

  const checkForAchievements = async (totalPoints: number) => {
    try {
      const r = await fetch('/api/achievements/check', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalPoints }),
      });
      if (r.ok) {
        const a = await r.json();
        if (a.length > 0) { setNewAchievements(a); setCurrentAchievementIndex(0); }
      }
    } catch (_) {}
  };

  const handleAchievementClose = () => {
    if (currentAchievementIndex < newAchievements.length - 1) setCurrentAchievementIndex(p => p + 1);
    else { setNewAchievements([]); setCurrentAchievementIndex(0); }
  };

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t);
          // Fix 3: time up = collision
          handleCollision();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [gameState, handleCollision]);

  // Enemy movement
  useEffect(() => {
    if (!enemyMoving || !currentEnemy) return;
    const start = Date.now();
    const duration = 15000;
    const iv = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      // Enemy moves from 5% to 80% (leaves room so char doesn't overlap player)
      setEnemyPosition(5 + p * 75);
      if (p >= 1) { setEnemyMoving(false); clearInterval(iv); }
    }, 50);
    return () => clearInterval(iv);
  }, [enemyMoving, currentEnemy]);

  // ── GAME OVER ──────────────────────────────────────────────
  if (gameState === 'gameOver') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg,#1a0000 0%,#060b14 100%)' }}>
        <div className="w-full max-w-xs text-center">
          <div className="flex justify-center mb-4"><MinecraftZombie scale={1.8} /></div>
          <div className="border-2 border-red-700 bg-[#0d1117] p-6"
            style={{ boxShadow: '0 0 30px rgba(220,38,38,0.3)' }}>
            <h2 className="font-pixel text-2xl text-red-400 mb-5" style={{ textShadow: '0 0 12px rgba(220,38,38,0.5)' }}>GAME OVER</h2>
            <div className="space-y-1.5 mb-5 border border-gray-800 bg-black/40 p-4">
              <p className="font-pixel text-[10px] text-amber-400">SCORE: {gameStats.score}</p>
              <p className="font-pixel text-[10px] text-emerald-400">CORRECT: {gameStats.diamonds}</p>
              <p className="font-pixel text-[10px] text-red-400">WRONG: {gameStats.wrongAnswers}</p>
            </div>
            <button onClick={restartGame} data-testid="button-respawn"
              className="w-full font-pixel text-[11px] text-white py-3 tracking-widest
                bg-red-700 border-b-4 border-red-900 hover:bg-red-600
                transition-all active:border-b-0 active:translate-y-1" style={{ borderRadius: 0 }}>
              ▶ RESPAWN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LEVEL COMPLETE ─────────────────────────────────────────
  if (gameState === 'levelComplete') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg,#0a1a00 0%,#060b14 100%)' }}>
        <div className="w-full max-w-xs text-center">
          <div className="flex justify-center mb-4"><MinecraftSteve scale={1.8} /></div>
          <div className="border-2 border-amber-500 bg-[#0d1117] p-6"
            style={{ boxShadow: '0 0 30px rgba(251,191,36,0.25)' }}>
            <h2 className="font-pixel text-2xl text-amber-400 mb-1" style={{ textShadow: '0 0 12px rgba(251,191,36,0.4)' }}>VICTORY!</h2>
            <p className="font-pixel text-[9px] text-emerald-400 tracking-widest mb-5">YOU CONQUERED ALL LEVELS</p>
            <div className="space-y-1.5 mb-5 border border-gray-800 bg-black/40 p-4">
              <p className="font-pixel text-[10px] text-amber-400">SCORE: {gameStats.score}</p>
              <p className="font-pixel text-[10px] text-emerald-400">CORRECT: {gameStats.diamonds}</p>
              <p className="font-pixel text-[10px] text-red-400">WRONG: {gameStats.wrongAnswers}</p>
            </div>
            <button onClick={restartGame} data-testid="button-new-game"
              className="w-full font-pixel text-[11px] text-white py-3 tracking-widest
                bg-emerald-700 border-b-4 border-emerald-900 hover:bg-emerald-600
                transition-all active:border-b-0 active:translate-y-1" style={{ borderRadius: 0 }}>
              ▶ PLAY AGAIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PLAYING ────────────────────────────────────────────────
  const { score: currentScore, hearts, diamonds, wrongAnswers, magicPower } = gameStats;

  const opStyle = currentQuestion.operation === '+'
    ? { border: '#22c55e', bg: 'rgba(34,197,94,0.08)', text: '#86efac', label: '➕ +10 PTS' }
    : currentQuestion.operation === '-'
    ? { border: '#3b82f6', bg: 'rgba(59,130,246,0.08)', text: '#93c5fd', label: '➖ +15 PTS' }
    : { border: '#a855f7', bg: 'rgba(168,85,247,0.08)', text: '#d8b4fe', label: '✖️ +20 PTS' };

  const timerStyle = timeLeft <= 5
    ? { border: '#ef4444', bg: 'rgba(239,68,68,0.12)', text: '#fca5a5', pulse: true }
    : timeLeft <= 10
    ? { border: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fcd34d', pulse: false }
    : { border: '#22c55e', bg: 'rgba(34,197,94,0.1)',   text: '#86efac', pulse: false };

  // ── Arena JSX (shared between mobile and desktop) ──────────
  const ArenaContent = (
    <div className="relative w-full h-full overflow-hidden">
      {/* Sky stars */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{ width: 1, height: 1, top: `${8+(i*11)%40}%`, left: `${(i*19)%88+5}%`, opacity: 0.3 }} />
      ))}
      {/* Ground */}
      <div className="absolute bottom-0 left-0 right-0 h-7"
        style={{ background: 'repeating-linear-gradient(90deg,#2d4a1a 0,#2d4a1a 16px,#3a5c22 16px,#3a5c22 32px)' }} />
      <div className="absolute bottom-7 left-0 right-0 h-2" style={{ background: '#5c2d0a' }} />

      {/* Enemy */}
      {currentEnemy && !showExplosion && (
        <div className="absolute" style={{ left: `${enemyPosition}%`, bottom: 36, transform: 'translateX(-50%)', transition: 'left 0.05s linear' }}>
          {currentEnemy.name === 'Zombie'   && <MinecraftZombie   isAttacking={enemyAttacking} scale={1} />}
          {currentEnemy.name === 'Skeleton' && <MinecraftSkeleton isAttacking={enemyAttacking} scale={1} />}
          {currentEnemy.name === 'Creeper'  && <MinecraftCreeper  isAttacking={enemyAttacking} scale={1} />}
          {currentEnemy.name === 'Witch'    && <MinecraftWitch    isAttacking={enemyAttacking} scale={1} />}
          {currentEnemy.name === 'Dragon'   && <MinecraftDragon   isAttacking={enemyAttacking} scale={0.75} />}
          <div className="font-pixel text-[6px] text-red-400 text-center bg-black/70 px-1 mt-0.5">
            {currentEnemy.name === 'Zombie' && '🧟'}{currentEnemy.name === 'Skeleton' && '💀'}
            {currentEnemy.name === 'Creeper' && '💣'}{currentEnemy.name === 'Witch' && '🧙'}{currentEnemy.name === 'Dragon' && '🐲'}
          </div>
        </div>
      )}

      {/* Explosion */}
      {showExplosion && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60">
          <div className="text-5xl animate-ping">💥</div>
          <div className="font-pixel text-[10px] text-red-400 mt-2 animate-pulse">
            {hearts > 1 ? '❤️ -1 LIFE!' : '💔 LAST LIFE!'}
          </div>
        </div>
      )}

      {/* Player */}
      {!showExplosion && (
        <div className="absolute" style={{ right: 24, bottom: 36 }}>
          <MinecraftSteve isDefending={playerDefending} scale={1} />
          <div className="font-pixel text-[6px] text-emerald-400 text-center bg-black/70 px-1 mt-0.5">🛡️</div>
          {magicPower > 0 && (
            <div className="absolute -top-3 -right-2 bg-purple-700 text-white font-pixel text-[7px]
              w-5 h-5 flex items-center justify-center border border-purple-400 animate-pulse">
              {magicPower}
            </div>
          )}
        </div>
      )}

      {/* Magic blast */}
      {showMagicBlast && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="flex gap-2 text-3xl animate-ping"><span>⚡</span><span>💫</span><span>✨</span></div>
        </div>
      )}
      {/* Points */}
      {showPointsAnimation && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
          <span className="font-pixel text-sm text-amber-300 animate-bounce bg-black/80 px-3 py-1"
            style={{ border: '2px solid #f59e0b' }}>+{pointsEarned} XP</span>
        </div>
      )}
      {/* Danger */}
      {currentEnemy && enemyPosition >= 65 && !playerDefending && !showExplosion && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 animate-pulse">
          <span className="font-pixel text-[9px] text-red-300 bg-black/90 px-3 py-1"
            style={{ border: '2px solid #ef4444' }}>⚠ DANGER!</span>
        </div>
      )}
    </div>
  );

  // ── Question + Input panel JSX ──────────────────────────────
  const QuestionPanel = (
    <div className="bg-[#0d1117] p-3 md:p-4" style={{ border: '2px solid #1a3a1a', borderTop: 'none' }}>
      {/* Question */}
      <div className="text-center py-2.5 px-4 mb-2"
        style={{ border: `2px solid ${opStyle.border}`, background: opStyle.bg }}>
        <p className="font-pixel text-xl md:text-2xl text-white tracking-widest">
          {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?
        </p>
      </div>
      {/* Points + Timer */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center py-1.5" style={{ border: `1px solid ${opStyle.border}`, background: opStyle.bg }}>
          <span className="font-pixel text-[8px]" style={{ color: opStyle.text }}>{opStyle.label}</span>
        </div>
        <div className="text-center py-1.5" style={{ border: `1px solid ${timerStyle.border}`, background: timerStyle.bg }}>
          <span className={`font-pixel text-[8px] ${timerStyle.pulse ? 'animate-pulse' : ''}`}
            style={{ color: timerStyle.text }}>⏰ {timeLeft}s</span>
        </div>
      </div>
      {/* Input + Attack */}
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={userAnswer}
          onChange={e => setUserAnswer(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
          placeholder="Answer..."
          data-testid="input-answer"
          className="flex-1 bg-black/70 border border-gray-600 text-white text-center font-pixel text-xl px-3 py-3
            focus:outline-none focus:border-emerald-500 placeholder:text-gray-700 transition-colors"
          style={{ borderRadius: 0, fontSize: '1.25rem' }}
          autoComplete="off"
        />
        <button
          onClick={handleSubmit}
          disabled={!userAnswer}
          data-testid="button-submit"
          className="font-pixel text-[10px] text-white px-4 py-3 tracking-wider
            bg-red-700 border-b-4 border-red-900 hover:bg-red-600
            transition-all active:border-b-0 active:translate-y-1
            disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          style={{ borderRadius: 0 }}>
          ⚔️ ATTACK
        </button>
      </div>
      {/* Feedback */}
      {feedback && (
        <div className="text-center py-1.5 px-3" style={{ border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)' }}>
          <p className="font-pixel text-[9px] text-amber-300">{feedback}</p>
        </div>
      )}
      {showCelebration && (
        <div className="flex justify-center gap-2 text-xl animate-bounce py-1">🎉 🏆 🎉</div>
      )}
    </div>
  );

  // ── Custom on-screen keypad (mobile only) ──────────────────
  const keypadPress = (val: string) => {
    if (val === '⌫') {
      setUserAnswer(prev => prev.slice(0, -1));
    } else {
      setUserAnswer(prev => (prev + val).slice(0, 4)); // max 4 digits
    }
  };

  return (
    <>
      {/* ══ LEVEL UP OVERLAY (mobile + desktop) ══ */}
      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.65)' }}>
          <style>{`
            @keyframes lvlPop {
              0%   { transform: scale(0.3) rotate(-8deg); opacity: 0; }
              60%  { transform: scale(1.15) rotate(2deg); opacity: 1; }
              80%  { transform: scale(0.95) rotate(0deg); }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes lvlGlow {
              0%, 100% { text-shadow: 0 0 20px rgba(251,191,36,0.8); }
              50%       { text-shadow: 0 0 40px rgba(251,191,36,1), 0 0 80px rgba(251,191,36,0.5); }
            }
          `}</style>
          <div className="text-center"
            style={{ animation: 'lvlPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            <div className="text-7xl mb-2">⚡</div>
            <div className="font-pixel text-amber-400 text-3xl mb-2 tracking-widest"
              style={{ animation: 'lvlGlow 1s ease-in-out infinite' }}>
              LEVEL UP!
            </div>
            <div className="font-pixel text-white mb-3"
              style={{ fontSize: '5rem', lineHeight: 1, textShadow: '0 0 30px rgba(168,85,247,0.9), 4px 4px 0 #4c1d95' }}>
              {levelUpNumber}
            </div>
            <div className="font-pixel text-emerald-400 text-[11px] tracking-[0.3em]">
              ★ NEW LEVEL UNLOCKED ★
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          MOBILE layout — fixed keypad, no system keyboard
      ═══════════════════════════════════════ */}
      <div className="md:hidden flex flex-col"
        style={{ height: 'calc(100dvh - 60px)', background: '#060b14', imageRendering: 'pixelated', overflow: 'hidden' }}>

        {/* Top bar */}
        <div className="flex-none" style={{ background: '#0d1117', borderBottom: '2px solid #1a2a1a' }}>
          <div className="px-3 py-2 flex items-center justify-between">
            <button onClick={handleGoHome}
              className="font-pixel text-[8px] text-gray-400 border border-gray-700 px-3 py-1.5"
              style={{ borderRadius: 0 }}>← HOME</button>
            <h1 className="font-pixel text-[10px] text-amber-400"
              style={{ textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>⛏️ MATH BATTLE</h1>
            <button onClick={restartGame}
              className="font-pixel text-[8px] text-gray-400 border border-gray-700 px-3 py-1.5"
              style={{ borderRadius: 0 }}>🔄 NEW</button>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex-none grid grid-cols-4 gap-1.5 px-2 py-1.5" style={{ background: '#08100c' }}>
          {[
            { icon: '❤️', value: hearts,          label: 'LIVES',  border: '#dc2626' },
            { icon: '🏆', value: currentScore,    label: 'SCORE',  border: '#f59e0b' },
            { icon: '⚡', value: gameStats.level,  label: 'LEVEL',  border: '#22c55e' },
            { icon: '❌', value: wrongAnswers,     label: 'WRONG',  border: '#ef4444' },
          ].map(s => (
            <div key={s.label} className="bg-[#0d1117] text-center py-1.5" style={{ border: `2px solid ${s.border}` }}>
              <div className="text-sm leading-none">{s.icon}</div>
              <div className="font-pixel text-white text-xs leading-none mt-0.5">{s.value}</div>
              <div className="font-pixel text-[6px] text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Arena — fixed small height so keypad always fits */}
        <div className="flex-none mx-2 mt-1.5 relative overflow-hidden"
          style={{ height: '160px', background: 'linear-gradient(180deg,#071220 0%,#0d2010 65%,#1a0d00 100%)', border: '2px solid #1a3a1a' }}>
          {ArenaContent}
        </div>

        {/* ── Bottom panel: question + keypad ── */}
        <div className="flex-none mx-2 mb-2 mt-1.5 bg-[#0d1117]"
          style={{ border: '2px solid #1a3a1a' }}>

          {/* Question + timer row */}
          <div className="flex items-center gap-1.5 p-1.5">
            <div className="flex-1 text-center py-1.5"
              style={{ border: `2px solid ${opStyle.border}`, background: opStyle.bg }}>
              <p className="font-pixel text-base text-white">
                {currentQuestion.num1} {currentQuestion.operation} {currentQuestion.num2} = ?
              </p>
            </div>
            <div className="text-center py-1 px-2.5"
              style={{ border: `2px solid ${timerStyle.border}`, background: timerStyle.bg, minWidth: 46 }}>
              <p className={`font-pixel text-[10px] ${timerStyle.pulse ? 'animate-pulse' : ''}`}
                style={{ color: timerStyle.text }}>⏰</p>
              <p className={`font-pixel text-sm leading-none ${timerStyle.pulse ? 'animate-pulse' : ''}`}
                style={{ color: timerStyle.text }}>{timeLeft}</p>
            </div>
          </div>

          {/* Answer display */}
          <div className="mx-1.5 mb-1.5 text-center py-2"
            style={{ border: '2px solid #374151', background: '#111827' }}
            data-testid="input-answer">
            <span className="font-pixel text-xl text-white tracking-widest">
              {userAnswer || <span className="text-gray-600 text-base">_ _ _ _</span>}
            </span>
          </div>

          {/* Feedback / celebration inside panel */}
          {feedback && (
            <div className="mx-2 mb-2 text-center py-1.5" style={{ border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)' }}>
              <p className="font-pixel text-[9px] text-amber-300">{feedback}</p>
            </div>
          )}
          {showCelebration && (
            <div className="flex justify-center gap-2 text-lg animate-bounce pb-1">🎉 🏆 🎉</div>
          )}

          {/* ── Number Pad ── */}
          <div className="grid grid-cols-3 gap-1 p-1.5">
            {['7','8','9','4','5','6','1','2','3','⌫','0','⚔️'].map((key) => {
              const isAttack = key === '⚔️';
              const isBack   = key === '⌫';
              return (
                <button
                  key={key}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    if (isAttack) handleSubmit();
                    else keypadPress(key);
                  }}
                  disabled={isAttack && !userAnswer}
                  data-testid={isAttack ? 'button-submit' : undefined}
                  className="py-2 font-pixel text-sm select-none
                    transition-all active:translate-y-0.5"
                  style={{
                    borderRadius: 0,
                    background: isAttack ? '#b91c1c' : isBack ? '#1f2937' : '#1a2a1a',
                    border: `2px solid ${isAttack ? '#7f1d1d' : isBack ? '#374151' : '#2d4a1a'}`,
                    borderBottom: `3px solid ${isAttack ? '#7f1d1d' : isBack ? '#111827' : '#1a3010'}`,
                    color: isAttack ? '#fff' : isBack ? '#9ca3af' : '#d1fae5',
                    opacity: isAttack && !userAnswer ? 0.4 : 1,
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════
          DESKTOP layout — scrollable
      ═══════════════════════════════════════ */}
      <div className="hidden md:block min-h-screen pb-8"
        style={{ background: 'linear-gradient(180deg,#060b14 0%,#0a1a0f 60%,#060b14 100%)', imageRendering: 'pixelated' }}>

        {/* Top bar */}
        <div className="sticky top-0 z-30" style={{ background: '#0d1117', borderBottom: '2px solid #1a2a1a' }}>
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <button onClick={handleGoHome}
              className="font-pixel text-[8px] text-gray-400 hover:text-amber-300 border border-gray-700 px-3 py-1.5 transition-colors"
              style={{ borderRadius: 0 }}>← HOME</button>
            <h1 className="font-pixel text-sm text-amber-400"
              style={{ textShadow: '0 0 10px rgba(251,191,36,0.3)' }}>⛏️ MATH BATTLE</h1>
            <button onClick={restartGame}
              className="font-pixel text-[8px] text-gray-400 hover:text-emerald-300 border border-gray-700 px-3 py-1.5 transition-colors"
              style={{ borderRadius: 0 }}>🔄 NEW</button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pt-4 space-y-3">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: '❤️', value: hearts,          label: 'LIVES',  border: '#dc2626', glow: 'rgba(220,38,38,0.2)' },
              { icon: '🏆', value: currentScore,    label: 'SCORE',  border: '#f59e0b', glow: 'rgba(245,158,11,0.2)' },
              { icon: '⚡', value: gameStats.level,  label: 'LEVEL',  border: '#22c55e', glow: 'rgba(34,197,94,0.2)' },
              { icon: '❌', value: wrongAnswers,     label: 'WRONG',  border: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
            ].map(s => (
              <div key={s.label} className="bg-[#0d1117] text-center py-3"
                style={{ border: `2px solid ${s.border}`, boxShadow: `0 0 8px ${s.glow}` }}>
                <div className="text-xl leading-none mb-1">{s.icon}</div>
                <div className="font-pixel text-white text-lg leading-none mb-1">{s.value}</div>
                <div className="font-pixel text-[7px] text-gray-500 tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Arena */}
          <div className="relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg,#071220 0%,#0d2010 65%,#1a0d00 100%)', border: '2px solid #1a3a1a', height: '240px' }}>
            {ArenaContent}
          </div>

          {/* Question panel */}
          {QuestionPanel}

          {/* Inventory */}
          <div className="hidden lg:block">
            <GameInventoryBoard items={mockInventoryItems} onItemClick={() => {}} />
          </div>
        </div>
      </div>

      {newAchievements.length > 0 && currentAchievementIndex < newAchievements.length && (
        <AchievementNotification achievement={newAchievements[currentAchievementIndex]} onClose={handleAchievementClose} />
      )}
    </>
  );
}
