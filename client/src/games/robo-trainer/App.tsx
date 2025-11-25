
import React, { useState } from 'react';
import { GamePhase, RobotProfile, RobotColor, Mission, TrainingMemory } from './types';
import { CURRICULUM } from './data/curriculum';
import { CampaignMap } from './components/CampaignMap';
import { MissionTerminal } from './components/MissionTerminal';
import { BattleArena } from './components/BattleArena';
import { RobotAvatar } from './components/RobotAvatar';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.WELCOME);

  // Robot State
  const [robot, setRobot] = useState<RobotProfile>({
    name: '',
    color: RobotColor.BLUE,
    level: 1, // Determines current chapter (1-10)
    xp: 0,
    memory: []
  });

  // Creation Form State
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<RobotColor>(RobotColor.BLUE);

  // Gameplay State
  const [completedMissionIds, setCompletedMissionIds] = useState<number[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  const createRobot = () => {
    if(!newName) return;
    setRobot(prev => ({ ...prev, name: newName, color: newColor }));
    setPhase(GamePhase.MAP);
  };

  const handleMissionSelect = (mission: Mission) => {
    setActiveMission(mission);
    setPhase(GamePhase.MISSION);
  };

  const handleMissionComplete = (memories: TrainingMemory[]) => {
    setRobot(prev => ({
        ...prev,
        // Add all 3 new memories from the session
        memory: [...prev.memory, ...memories],
        xp: prev.xp + 30 // 10xp per round * 3
    }));

    if (activeMission) {
        setCompletedMissionIds(prev => [...prev, activeMission.id]);
    }
    setPhase(GamePhase.MAP);
    setActiveMission(null);
  };

  const handleBossSelect = () => {
    setPhase(GamePhase.BATTLE);
  };

  const handleBattleVictory = () => {
      // Level up!
      setRobot(prev => ({
          ...prev,
          level: Math.min(prev.level + 1, 10)
      }));
      setPhase(GamePhase.VICTORY);
  };

  return (
    <div className="min-h-screen bg-sky-100 font-sans text-slate-800 pb-10">

      {/* Top Navigation */}
      <nav className="bg-white shadow-sm p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold font-pixel">AI</div>
                  <span className="font-black text-indigo-900 tracking-tight hidden md:inline">RoboTrainer Academy</span>
              </div>

              {phase !== GamePhase.WELCOME && (
                  <div className="flex items-center gap-4">
                       <div className="hidden md:flex flex-col text-right">
                           <span className="text-xs font-bold text-slate-400">LVL {robot.level}</span>
                           <span className="font-bold text-indigo-900">{robot.name}</span>
                       </div>
                       <div className="w-10 h-10 border-2 border-slate-100 rounded-full overflow-hidden bg-slate-50">
                           <RobotAvatar color={robot.color} size="sm" />
                       </div>
                  </div>
              )}
          </div>
      </nav>

      <main className="max-w-6xl mx-auto p-4 md:p-8">

        {/* 1. WELCOME / CREATION */}
        {phase === GamePhase.WELCOME && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <h1 className="text-4xl md:text-6xl font-black text-indigo-900 mb-8 font-pixel leading-snug">
                    BUILD YOUR<br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">INTELLIGENCE</span>
                </h1>

                <div className="bg-white p-8 rounded-3xl shadow-xl border-b-8 border-indigo-100 max-w-md w-full">
                    <div className="mb-6 flex justify-center">
                        <RobotAvatar color={newColor} size="lg" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-center gap-2 mb-4">
                            {Object.values(RobotColor).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setNewColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 ${newColor === c ? 'border-black scale-110' : 'border-transparent'}`}
                                    style={{backgroundColor: c}}
                                />
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="NAME YOUR ROBOT"
                            className="w-full text-center p-4 bg-slate-50 rounded-xl font-bold border-2 border-slate-200 focus:border-indigo-500 outline-none uppercase"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <button
                            onClick={createRobot}
                            disabled={!newName}
                            className={`w-full py-4 rounded-xl font-black text-white text-lg transition-all ${!newName ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30'}`}
                        >
                            START TRAINING
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 2. CAMPAIGN MAP */}
        {phase === GamePhase.MAP && (
            <CampaignMap
                robot={robot}
                completedMissionIds={completedMissionIds}
                onSelectMission={handleMissionSelect}
                onSelectBoss={handleBossSelect}
            />
        )}

        {/* 3. MISSION INTERFACE */}
        {phase === GamePhase.MISSION && activeMission && (
            <div>
                <MissionTerminal
                    mission={activeMission}
                    robot={robot}
                    onMissionComplete={handleMissionComplete}
                    onExit={() => setPhase(GamePhase.MAP)}
                />
            </div>
        )}

        {/* 4. BOSS BATTLE */}
        {phase === GamePhase.BATTLE && (
            <BattleArena
                userRobot={robot}
                chapterId={robot.level}
                onBattleComplete={(result) => {
                    if (result.winner === 'user') {
                        handleBattleVictory();
                    } else {
                        // If lose, simple alert for now, then back to map
                        alert("You lost! Train more and try again.");
                        setPhase(GamePhase.MAP);
                    }
                }}
            />
        )}

        {/* 5. VICTORY SCREEN */}
        {phase === GamePhase.VICTORY && (
            <div className="text-center py-20">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-4xl font-black text-indigo-900 mb-4">CHAPTER COMPLETE!</h2>
                <p className="text-xl text-slate-600 mb-8">Your robot has evolved. Next chapter unlocked.</p>
                <div className="flex justify-center mb-8">
                     <RobotAvatar color={robot.color} size="lg" isHappy={true} />
                </div>
                <button
                    onClick={() => setPhase(GamePhase.MAP)}
                    className="bg-green-500 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg hover:bg-green-600 transition"
                >
                    CONTINUE JOURNEY
                </button>
            </div>
        )}

      </main>
    </div>
  );
};

export default App;
