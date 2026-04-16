import React, { useState } from 'react';
import { RobotProfile, BattleResult, RobotColor } from '../types';
import { RobotAvatar } from './RobotAvatar';
import { CURRICULUM } from '../data/curriculum';

interface BattleArenaProps {
  userRobot: RobotProfile;
  chapterId: number;
  onBattleComplete: (result: BattleResult) => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ userRobot, chapterId, onBattleComplete }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const chapter = CURRICULUM.find(c => c.id === chapterId);
  if (!chapter) return null;

  const handleBattle = () => {
    if (!userAnswer.trim()) return;
    setIsProcessing(true);
    setTimeout(() => {
      const isWin = userAnswer.length > 10;
      const result: BattleResult = {
        winner: isWin ? 'user' : 'rival',
        userAnswer,
        rivalAnswer: 'Standard textbook answer.',
        reasoning: isWin
          ? `${userRobot.name} showed creativity and depth in the answer!`
          : 'The rival bot was more thorough this time.',
        score: isWin ? 100 : 50,
      };
      setBattleResult(result);
      setIsProcessing(false);
    }, 2000);
  };

  /* ── RESULT SCREEN ── */
  if (battleResult) {
    const won = battleResult.winner === 'user';
    return (
      <div
        className="max-w-3xl mx-auto overflow-hidden"
        style={{
          background: '#080e14',
          border: `4px solid ${won ? '#166534' : '#991b1b'}`,
          boxShadow: `0 0 40px ${won ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
        }}
      >
        {/* Result banner */}
        <div
          className="p-8 text-center"
          style={{ background: won ? '#071a0a' : '#1a0505' }}
        >
          <div className="text-5xl mb-3">{won ? '🏆' : '💔'}</div>
          <h2
            className="font-pixel text-2xl md:text-3xl mb-3 animate-pulse"
            style={{ color: won ? '#4ade80' : '#f87171' }}
          >
            {won ? 'VICTORY!' : 'DEFEAT'}
          </h2>
          <p
            className="font-pixel text-xs"
            style={{ color: won ? '#86efac' : '#fca5a5' }}
          >
            {battleResult.reasoning}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* User answer */}
          <div
            className="p-4"
            style={{ background: '#050d1a', borderLeft: '4px solid #1d4ed8', border: '1px solid #1e3a5f' }}
          >
            <div className="font-pixel text-[8px] text-blue-500 mb-2">
              {userRobot.name.toUpperCase()}'S ANSWER:
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{battleResult.userAnswer}</p>
          </div>

          {/* Rival answer */}
          <div
            className="p-4"
            style={{ background: '#1a0505', borderLeft: '4px solid #991b1b', border: '1px solid #7f1d1d' }}
          >
            <div className="font-pixel text-[8px] text-red-500 mb-2">RIVAL BOT'S ANSWER:</div>
            <p className="text-sm text-gray-400 leading-relaxed">{battleResult.rivalAnswer}</p>
          </div>

          {/* Score */}
          <div className="flex justify-center">
            <div
              className="font-pixel text-sm px-6 py-2"
              style={{
                background: won ? '#071a0a' : '#1a0505',
                border: `2px solid ${won ? '#166534' : '#991b1b'}`,
                color: won ? '#4ade80' : '#f87171',
              }}
            >
              SCORE: {battleResult.score} pts
            </div>
          </div>

          <button
            onClick={() => onBattleComplete(battleResult)}
            className="w-full py-4 font-pixel text-sm transition-all duration-100 active:translate-y-0.5 hover:brightness-110"
            style={{
              background: won ? '#15803d' : '#7f1d1d',
              border: won ? '4px solid #166534' : '4px solid #991b1b',
              borderBottom: won ? '6px solid #14532d' : '6px solid #450a0a',
              color: '#fff',
            }}
          >
            {won ? '✨ CONTINUE' : '🔄 TRY AGAIN'}
          </button>
        </div>
      </div>
    );
  }

  /* ── BATTLE ARENA ── */
  return (
    <div
      className="max-w-3xl mx-auto overflow-hidden"
      style={{
        background: '#080e14',
        border: '4px solid #991b1b',
        boxShadow: '0 0 40px rgba(239,68,68,0.25)',
      }}
    >
      {/* Header */}
      <div
        className="p-6 text-center"
        style={{ background: '#1a0505', borderBottom: '2px solid #7f1d1d' }}
      >
        <div className="font-pixel text-2xl md:text-3xl text-red-400 mb-1 animate-pulse">
          🔥 BOSS BATTLE 🔥
        </div>
        <p className="font-pixel text-xs text-gray-500 tracking-widest">
          {chapter.title.toUpperCase()}
        </p>
      </div>

      {/* VS arena */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* User robot */}
          <div className="text-center">
            <div
              className="p-4 mb-3 flex items-center justify-center"
              style={{ background: '#050d1a', border: '3px solid #1d4ed8' }}
            >
              <RobotAvatar color={userRobot.color} size="md" />
            </div>
            <div
              className="font-pixel text-xs text-blue-300 py-1 px-2"
              style={{ background: '#050d1a', border: '1px solid #1e3a5f' }}
            >
              {userRobot.name}
            </div>
            <div className="font-pixel text-[9px] text-gray-600 mt-1">
              LEVEL {userRobot.level}
            </div>
          </div>

          {/* Rival robot */}
          <div className="text-center">
            <div
              className="p-4 mb-3 flex items-center justify-center"
              style={{ background: '#1a0505', border: '3px solid #991b1b' }}
            >
              <RobotAvatar color={RobotColor.RED} size="md" />
            </div>
            <div
              className="font-pixel text-xs text-red-300 py-1 px-2"
              style={{ background: '#1a0505', border: '1px solid #7f1d1d' }}
            >
              RIVAL BOT
            </div>
            <div className="font-pixel text-[9px] text-gray-600 mt-1">STANDARD AI</div>
          </div>
        </div>

        {/* VS label */}
        <div className="text-center -mt-2 mb-6">
          <span
            className="font-pixel text-xl text-amber-400 px-4 py-1 inline-block"
            style={{ background: '#0a0f1a', border: '3px solid #b45309' }}
          >
            VS
          </span>
        </div>

        {/* Challenge prompt */}
        <div
          className="p-4 mb-5"
          style={{ background: '#0a0a05', borderLeft: '4px solid #b45309', border: '1px solid #451a03' }}
        >
          <div className="font-pixel text-[8px] text-amber-600 mb-2">⚡ CHALLENGE:</div>
          <p className="font-pixel text-xs text-amber-200 leading-relaxed">
            {chapter.bossBattlePrompt}
          </p>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            placeholder={`Let ${userRobot.name} answer the challenge...`}
            rows={4}
            className="w-full px-4 py-3 font-pixel text-xs text-white placeholder:text-gray-700 outline-none resize-none transition-all"
            style={{
              background: '#050d14',
              border: '2px solid #374151',
            }}
            disabled={isProcessing}
            onFocus={e => (e.target.style.borderColor = '#f59e0b')}
            onBlur={e => (e.target.style.borderColor = '#374151')}
          />

          <button
            onClick={handleBattle}
            disabled={!userAnswer.trim() || isProcessing}
            className="w-full py-4 font-pixel text-sm transition-all duration-100 active:translate-y-0.5"
            style={{
              background: userAnswer.trim() && !isProcessing ? '#7f1d1d' : '#1f2937',
              border: userAnswer.trim() && !isProcessing ? '4px solid #991b1b' : '4px solid #374151',
              borderBottom: userAnswer.trim() && !isProcessing ? '6px solid #450a0a' : '4px solid #374151',
              color: userAnswer.trim() && !isProcessing ? '#fca5a5' : '#4b5563',
              cursor: userAnswer.trim() && !isProcessing ? 'pointer' : 'not-allowed',
              boxShadow: userAnswer.trim() && !isProcessing ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
            }}
          >
            {isProcessing ? '⚔️ BATTLING...' : '⚔️ START BATTLE'}
          </button>
        </div>
      </div>
    </div>
  );
};
