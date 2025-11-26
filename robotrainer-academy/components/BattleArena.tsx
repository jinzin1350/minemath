
import React, { useEffect, useState } from 'react';
import { RobotProfile, BattleResult, RobotColor } from '../types';
import { RobotAvatar } from './RobotAvatar';
import { getRobotResponse, judgeBossBattle } from '../services/geminiService';
import { CURRICULUM } from '../data/curriculum';

interface BattleArenaProps {
  userRobot: RobotProfile;
  chapterId: number;
  onBattleComplete: (result: BattleResult) => void;
}

export const BattleArena: React.FC<BattleArenaProps> = ({ userRobot, chapterId, onBattleComplete }) => {
  const [battleState, setBattleState] = useState<'intro' | 'fighting' | 'judging' | 'results'>('intro');
  const [result, setResult] = useState<BattleResult | null>(null);
  
  const currentChapter = CURRICULUM.find(c => c.id === chapterId);

  const startFight = async () => {
    if (!currentChapter) return;
    setBattleState('fighting');

    // 1. Generate User Robot's Answer based on its unique memory
    const challenge = currentChapter.bossBattlePrompt;
    const userAns = await getRobotResponse(userRobot, `BOSS BATTLE CHALLENGE: "${challenge}". Answer using your training.`);
    
    setBattleState('judging');

    // 2. Judge (which internally generates rival answer)
    const finalResult = await judgeBossBattle(currentChapter, userRobot, userAns);
    
    setResult(finalResult);
    setBattleState('results');
  };

  if (!currentChapter) return <div>Error: Chapter not found</div>;

  return (
    <div className="max-w-5xl mx-auto">
        
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 rounded-t-3xl text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
          <h2 className="text-3xl font-black italic uppercase relative z-10">BOSS BATTLE: CHAPTER {chapterId}</h2>
          <p className="opacity-90 mt-2 relative z-10">{currentChapter.title}</p>
      </div>

      <div className="bg-white p-4 md:p-8 rounded-b-3xl shadow-2xl border-x-4 border-b-4 border-slate-200">
          
          {/* Challenge Box */}
          <div className="bg-slate-100 p-6 rounded-2xl border-l-8 border-orange-500 mb-10">
              <h3 className="text-orange-600 font-bold uppercase text-xs tracking-widest mb-2">THE CHALLENGE</h3>
              <p className="text-xl md:text-2xl font-bold text-slate-800">"{currentChapter.bossBattlePrompt}"</p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-stretch gap-6">
              
              {/* User Side */}
              <div className={`flex-1 bg-indigo-50 rounded-2xl p-6 border-2 ${result?.winner === 'user' ? 'border-green-500 bg-green-50 ring-4 ring-green-200' : 'border-indigo-100'} transition-all`}>
                  <div className="flex flex-col items-center">
                      <RobotAvatar color={userRobot.color} size="md" isThinking={battleState === 'fighting'} isHappy={result?.winner === 'user'} />
                      <div className="font-black text-indigo-900 mt-4 text-xl uppercase">{userRobot.name}</div>
                      <div className="text-xs font-bold text-indigo-400 mb-4">LVL {userRobot.level}</div>
                      
                      {battleState === 'fighting' && <div className="animate-pulse text-indigo-600 font-bold">Computing Answer...</div>}
                      
                      {result && (
                          <div className="bg-white p-4 rounded-xl shadow-sm w-full text-center">
                              <p className="font-medium text-slate-700 italic">"{result.userAnswer}"</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* VS */}
              <div className="flex items-center justify-center">
                  <div className="font-black text-4xl text-slate-200 italic pixel-font">VS</div>
              </div>

              {/* Rival Side */}
              <div className={`flex-1 bg-red-50 rounded-2xl p-6 border-2 ${result?.winner === 'rival' ? 'border-red-500 ring-4 ring-red-200' : 'border-red-100'}`}>
                  <div className="flex flex-col items-center">
                      <RobotAvatar color={RobotColor.RED} size="md" isThinking={battleState === 'fighting'} isHappy={result?.winner === 'rival'} />
                      <div className="font-black text-red-900 mt-4 text-xl uppercase">RIVAL BOT</div>
                      <div className="text-xs font-bold text-red-400 mb-4">LVL 99</div>

                      {result && (
                          <div className="bg-white p-4 rounded-xl shadow-sm w-full text-center">
                              <p className="font-medium text-slate-700 italic">"{result.rivalAnswer}"</p>
                          </div>
                      )}
                  </div>
              </div>

          </div>

          {/* Action Area */}
          <div className="mt-12 text-center h-24">
              {battleState === 'intro' && (
                  <button onClick={startFight} className="bg-red-600 hover:bg-red-700 text-white font-black text-2xl py-4 px-12 rounded-full shadow-lg shadow-red-500/40 transform hover:scale-105 transition-all animate-pulse">
                      START BATTLE
                  </button>
              )}
              
              {battleState === 'judging' && (
                  <div className="text-xl font-bold text-slate-500 animate-bounce">
                      👨‍⚖️ The Judges are deciding...
                  </div>
              )}

              {battleState === 'results' && result && (
                  <div>
                      <div className={`inline-block px-8 py-2 rounded-full font-black text-2xl mb-4 text-white ${result.winner === 'user' ? 'bg-green-500' : 'bg-red-500'}`}>
                          {result.winner === 'user' ? 'VICTORY!' : 'DEFEAT'}
                      </div>
                      <p className="text-slate-600 max-w-lg mx-auto mb-4">{result.reasoning}</p>
                      <button onClick={() => onBattleComplete(result)} className="underline text-indigo-600 font-bold">
                          Continue
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
