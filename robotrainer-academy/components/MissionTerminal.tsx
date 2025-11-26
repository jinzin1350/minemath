
import React, { useEffect, useState } from 'react';
import { Mission, RobotProfile, TrainingMemory, MissionRound } from '../types';
import { generateMissionScenario, getRobotResponse } from '../services/geminiService';
import { RobotAvatar } from './RobotAvatar';

interface MissionTerminalProps {
  mission: Mission;
  robot: RobotProfile;
  onMissionComplete: (memories: TrainingMemory[]) => void;
  onExit: () => void;
}

export const MissionTerminal: React.FC<MissionTerminalProps> = ({ mission, robot, onMissionComplete, onExit }) => {
  const [rounds, setRounds] = useState<MissionRound[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  
  const [input, setInput] = useState('');
  const [robotThought, setRobotThought] = useState('');
  const [phase, setPhase] = useState<'loading' | 'input' | 'processing' | 'round_complete' | 'mission_success'>('loading');
  
  const [sessionMemories, setSessionMemories] = useState<TrainingMemory[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await generateMissionScenario(mission);
      if (data.rounds && data.rounds.length > 0) {
        setRounds(data.rounds);
        setPhase('input');
      } else {
        // Error handling if AI fails
        onExit(); 
      }
    };
    load();
  }, [mission]);

  const currentScenario = rounds[currentRoundIndex];

  const handleSubmit = async () => {
    if (!input) return;
    setPhase('processing');

    // 1. Simulate Robot Learning/Reacting for this specific round
    const thought = await getRobotResponse(robot, `
      Context: Training Session Round ${currentRoundIndex + 1}/3.
      Visual Data: A collection of ${currentScenario.concept}.
      User taught me: "${input}".
      
      React to this new information nicely and confirm you learned it.
    `);
    setRobotThought(thought);

    // 2. Create Memory for this round
    const newMemory: TrainingMemory = {
      chapterId: Math.ceil(mission.id / 5),
      missionId: mission.id,
      concept: currentScenario.concept,
      value: input,
      type: mission.type === 'logic' ? 'logic' : 'vocabulary'
    };
    
    // Add to session memories
    const updatedMemories = [...sessionMemories, newMemory];
    setSessionMemories(updatedMemories);

    // 3. Move to next state
    setTimeout(() => {
        if (currentRoundIndex < rounds.length - 1) {
            setPhase('round_complete');
        } else {
            // All rounds done
            setPhase('mission_success');
        }
    }, 1500);
  };

  const handleNextRound = () => {
      setInput('');
      setRobotThought('');
      setCurrentRoundIndex(prev => prev + 1);
      setPhase('input');
  };

  const handleFinishMission = () => {
      onMissionComplete(sessionMemories);
  };

  if (phase === 'loading') {
    return (
      <div className="max-w-2xl mx-auto h-96 flex flex-col items-center justify-center bg-white rounded-3xl shadow-2xl border-4 border-indigo-200">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <div className="font-bold text-indigo-900 animate-pulse">GENERATING MISSION DATA...</div>
          <div className="text-sm text-slate-400 mt-2">Preparing 3 Rounds of Training</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-indigo-200 min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
        <div>
            <h2 className="font-black pixel-font text-sm md:text-lg">{mission.title}</h2>
            <div className="text-xs text-indigo-200 font-bold">ROUND {currentRoundIndex + 1} OF {rounds.length}</div>
        </div>
        <div className="w-32 h-2 bg-indigo-900 rounded-full overflow-hidden border border-indigo-400">
            <div 
                className="h-full bg-green-400 transition-all duration-500" 
                style={{ width: `${((currentRoundIndex) / 3) * 100}%` }}
            ></div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 p-6 md:p-8 flex flex-col items-center justify-start bg-slate-50 relative">
        
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

        {/* The "Visual Dataset" Cloud */}
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-lg border-2 border-slate-100 mb-8 relative min-h-[220px] flex flex-wrap content-center justify-center gap-3 z-0 transition-all duration-500">
            <div className="absolute top-3 left-4 text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Visual Input Stream</div>
            
            {currentScenario?.visuals?.map((visual, index) => {
                // Determine font size based on length to prevent overflow if AI returns text
                const isEmoji = visual.length <= 4; // Rudimentary emoji check (byte length)
                const fontSize = isEmoji ? 'text-3xl md:text-4xl' : 'text-xs bg-slate-100 p-1 rounded';
                
                return (
                    <div 
                        key={`${currentRoundIndex}-${index}`} 
                        className={`${fontSize} animate-bounce cursor-default hover:scale-125 transition-transform`}
                        style={{ 
                            animationDelay: `${index * 0.03}s`, 
                            animationDuration: '3s' 
                        }}
                        title={visual}
                    >
                        {visual}
                    </div>
                );
            })}
        </div>

        {/* The Question */}
        {phase !== 'mission_success' && (
            <h3 className="text-xl md:text-2xl font-black text-center text-indigo-900 mb-8 leading-tight drop-shadow-sm">
                {currentScenario?.question}
            </h3>
        )}

        {/* Interaction Zone */}
        {phase === 'input' && (
            <div className="w-full max-w-md animate-fade-in-up z-10">
                {currentScenario?.options && currentScenario.options.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                        {currentScenario.options.map(opt => (
                            <button 
                                key={opt}
                                onClick={() => { setInput(opt); handleSubmit(); }} 
                                className="bg-white border-b-4 border-indigo-100 hover:border-indigo-500 hover:bg-indigo-50 text-indigo-900 font-bold py-4 rounded-xl transition shadow-sm active:translate-y-1 active:border-b-0"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <input 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            placeholder="Type your answer..."
                            className="flex-1 p-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none text-lg font-bold shadow-inner"
                            autoFocus
                        />
                        <button 
                            onClick={handleSubmit}
                            disabled={!input}
                            className={`font-bold px-6 rounded-xl shadow-[0_4px_0_rgba(0,0,0,0.1)] active:translate-y-1 active:shadow-none transition-all
                                ${!input ? 'bg-slate-300 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}
                            `}
                        >
                            SEND
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* Robot Reaction / Round Complete */}
        {(phase === 'processing' || phase === 'round_complete' || phase === 'mission_success') && (
            <div className="w-full max-w-md animate-fade-in-up z-10">
                <div className="flex items-start gap-4 bg-white p-5 rounded-2xl border-2 border-indigo-100 shadow-xl mb-6 relative overflow-visible">
                    <div className="absolute -top-3 -left-3">
                        <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg shadow-md">💡</div>
                    </div>
                    <div className="shrink-0 pt-2">
                        <RobotAvatar color={robot.color} size="sm" isThinking={phase === 'processing'} isHappy={true} />
                    </div>
                    <div>
                        <div className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">DATA PROCESSED</div>
                        <p className="text-slate-800 font-medium leading-relaxed">
                            {phase === 'processing' ? <span className="animate-pulse">Analyzing input...</span> : `"${robotThought}"`}
                        </p>
                    </div>
                </div>

                {phase === 'round_complete' && (
                    <button 
                        onClick={handleNextRound}
                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl shadow-[0_4px_0_rgb(55,48,163)] hover:bg-indigo-700 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
                    >
                        START ROUND {currentRoundIndex + 2} <span className="text-xl">➡️</span>
                    </button>
                )}

                {phase === 'mission_success' && (
                     <div className="text-center">
                        <div className="text-5xl mb-4 animate-bounce">🌟</div>
                        <h2 className="text-2xl font-black text-green-600 mb-2">MISSION ACCOMPLISHED!</h2>
                        <p className="text-slate-500 mb-6 font-medium">Training data saved to Neural Core.</p>
                        <button 
                            onClick={handleFinishMission}
                            className="bg-green-500 text-white font-black py-4 px-12 rounded-full shadow-[0_6px_0_rgb(21,128,61)] hover:bg-green-600 hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
                        >
                            RETURN TO BASE
                        </button>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};
