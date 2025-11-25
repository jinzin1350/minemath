import React, { useState } from 'react';
import { RobotProfile, BattleResult } from '../types';
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
      // Simple battle logic
      const rivalAnswer = "Standard textbook answer.";
      const isWin = userAnswer.length > 10; // Simple win condition: longer answer wins

      const result: BattleResult = {
        winner: isWin ? 'user' : 'rival',
        userAnswer,
        rivalAnswer,
        reasoning: isWin
          ? `${userRobot.name} showed creativity and depth in the answer!`
          : 'The rival bot was more thorough this time.',
        score: isWin ? 100 : 50
      };

      setBattleResult(result);
      setIsProcessing(false);
    }, 2000);
  };

  const handleFinish = () => {
    if (battleResult) {
      onBattleComplete(battleResult);
    }
  };

  if (battleResult) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
        <div className={`p-8 text-center ${battleResult.winner === 'user' ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white`}>
          <h2 className="text-4xl font-black mb-4">
            {battleResult.winner === 'user' ? '🏆 VICTORY!' : '💔 DEFEAT'}
          </h2>
          <p className="text-xl opacity-90">{battleResult.reasoning}</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="font-bold text-blue-900 mb-2">{userRobot.name}'s Answer:</div>
            <p className="text-slate-800">{battleResult.userAnswer}</p>
          </div>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <div className="font-bold text-orange-900 mb-2">Rival Bot's Answer:</div>
            <p className="text-slate-800">{battleResult.rivalAnswer}</p>
          </div>

          <button
            onClick={handleFinish}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-lg hover:bg-indigo-700 transition"
          >
            {battleResult.winner === 'user' ? '✨ CONTINUE' : '🔄 TRY AGAIN'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white text-center">
        <h2 className="text-4xl font-black mb-2">🔥 BOSS BATTLE 🔥</h2>
        <p className="text-xl opacity-90">{chapter.title}</p>
      </div>

      {/* Battle Arena */}
      <div className="p-8">
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-center">
            <div className="bg-blue-50 rounded-xl p-4 mb-3">
              <RobotAvatar color={userRobot.color} size="md" />
            </div>
            <div className="font-black text-xl text-blue-900">{userRobot.name}</div>
            <div className="text-sm text-slate-500">Level {userRobot.level}</div>
          </div>

          <div className="text-center">
            <div className="bg-red-50 rounded-xl p-4 mb-3">
              <RobotAvatar color="red" size="md" />
            </div>
            <div className="font-black text-xl text-red-900">RIVAL BOT</div>
            <div className="text-sm text-slate-500">Standard AI</div>
          </div>
        </div>

        {/* Challenge */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded mb-6">
          <div className="font-bold text-yellow-900 mb-2">⚡ CHALLENGE:</div>
          <p className="text-slate-800 text-lg">{chapter.bossBattlePrompt}</p>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder={`Let ${userRobot.name} answer the challenge...`}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 outline-none font-bold min-h-[120px]"
            disabled={isProcessing}
          />

          <button
            onClick={handleBattle}
            disabled={!userAnswer.trim() || isProcessing}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-lg hover:bg-orange-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
          >
            {isProcessing ? '⚔️ BATTLING...' : '⚔️ START BATTLE'}
          </button>
        </div>
      </div>
    </div>
  );
};
