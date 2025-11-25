import React, { useState } from 'react';
import { Mission, RobotProfile, TrainingMemory } from '../types';
import { RobotAvatar } from './RobotAvatar';

interface MissionTerminalProps {
  mission: Mission;
  robot: RobotProfile;
  onMissionComplete: (memories: TrainingMemory[]) => void;
  onExit: () => void;
}

// Simple scenarios without AI
const getSimpleScenario = (missionType: string, missionId: number) => {
  const scenarios = [
    { visuals: ['🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎'], question: 'The robot sees these objects but needs a label. What should we call them?', concept: 'Apple' },
    { visuals: ['🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌'], question: 'New data detected! What is this yellow fruit?', concept: 'Banana' },
    { visuals: ['🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽', '🍎', '🍎', '🍎', '🍎', '🍎', '🍎', '⚽', '⚽', '⚽', '⚽', '⚽', '⚽'], question: 'Mixed objects detected! Help the robot separate food from toys.', concept: 'Classification' },
  ];

  return scenarios;
};

export const MissionTerminal: React.FC<MissionTerminalProps> = ({ mission, robot, onMissionComplete, onExit }) => {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [input, setInput] = useState('');
  const [robotThought, setRobotThought] = useState('');
  const [sessionMemories, setSessionMemories] = useState<TrainingMemory[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const scenarios = getSimpleScenario(mission.type, mission.id);
  const currentScenario = scenarios[currentRoundIndex];

  const handleSubmit = () => {
    if (!input.trim()) return;
    setIsProcessing(true);

    // Simulate robot learning
    setTimeout(() => {
      setRobotThought(`🤖 Beep boop! I learned about "${input}"! Adding to my memory banks... 💾`);

      const newMemory: TrainingMemory = {
        chapterId: Math.ceil(mission.id / 5),
        missionId: mission.id,
        concept: currentScenario.concept,
        value: input,
        type: mission.type === 'logic' ? 'logic' : 'vocabulary'
      };

      setSessionMemories(prev => [...prev, newMemory]);
      setIsProcessing(false);
    }, 1000);
  };

  const handleNextRound = () => {
    setInput('');
    setRobotThought('');
    if (currentRoundIndex < scenarios.length - 1) {
      setCurrentRoundIndex(prev => prev + 1);
    } else {
      onMissionComplete(sessionMemories);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-indigo-200 min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold opacity-80">MISSION {mission.id}</div>
            <h2 className="text-2xl font-black">{mission.title}</h2>
            <p className="text-sm opacity-90 mt-1">{mission.description}</p>
          </div>
          <button onClick={onExit} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold transition">
            ✕ EXIT
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          {scenarios.map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded ${i <= currentRoundIndex ? 'bg-white' : 'bg-white/30'}`}></div>
          ))}
        </div>
      </div>

      {/* Robot Display */}
      <div className="flex justify-center py-6 bg-slate-50">
        <RobotAvatar color={robot.color} isThinking={isProcessing} />
      </div>

      {/* Visual Grid */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-8 gap-2 bg-slate-900 p-4 rounded-xl">
          {currentScenario.visuals.map((emoji, i) => (
            <div key={i} className="text-2xl text-center bg-slate-800 rounded p-2">{emoji}</div>
          ))}
        </div>
      </div>

      {/* Question */}
      <div className="px-6 py-4 flex-1">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="font-bold text-blue-900">{currentScenario.question}</p>
        </div>

        {/* Robot Response */}
        {robotThought && (
          <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p className="text-green-900">{robotThought}</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-slate-50 border-t border-slate-200">
        {!robotThought ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Type your answer..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-500 outline-none font-bold"
              disabled={isProcessing}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition"
            >
              {isProcessing ? '⏳' : 'TEACH'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleNextRound}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-black hover:bg-green-700 transition"
          >
            {currentRoundIndex < scenarios.length - 1 ? '▶ NEXT ROUND' : '✓ COMPLETE MISSION'}
          </button>
        )}
      </div>
    </div>
  );
};
