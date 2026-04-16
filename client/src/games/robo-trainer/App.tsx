
import React, { useState, useEffect } from 'react';
import { GamePhase, RobotProfile, RobotColor, Mission, TrainingMemory } from './types';
import { CURRICULUM } from './data/curriculum';
import { CampaignMap } from './components/CampaignMap';
import { MissionTerminal } from './components/MissionTerminal';
import { BattleArena } from './components/BattleArena';
import { RobotAvatar } from './components/RobotAvatar';

const COLOR_OPTIONS: { value: RobotColor; label: string; hex: string }[] = [
  { value: RobotColor.BLUE,   label: 'Blue',   hex: '#3b82f6' },
  { value: RobotColor.GREEN,  label: 'Green',  hex: '#22c55e' },
  { value: RobotColor.RED,    label: 'Red',    hex: '#ef4444' },
  { value: RobotColor.PURPLE, label: 'Purple', hex: '#a855f7' },
  { value: RobotColor.ORANGE, label: 'Orange', hex: '#f97316' },
];

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.WELCOME);
  const [isLoading, setIsLoading] = useState(true);

  const [robot, setRobot] = useState<RobotProfile>({
    name: '',
    color: RobotColor.BLUE,
    level: 1,
    xp: 0,
    memory: [],
  });

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<RobotColor>(RobotColor.BLUE);
  const [completedMissionIds, setCompletedMissionIds] = useState<number[]>([]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);

  // Load robot progress from database on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await fetch('/api/robo-trainer/progress', { credentials: 'include' });
        if (response.ok) {
          const progress = await response.json();
          if (progress && progress.robotName) {
            setRobot({
              name: progress.robotName,
              color: progress.robotColor as RobotColor,
              level: progress.level,
              xp: progress.xp,
              memory: progress.memory || [],
            });
            setCompletedMissionIds(progress.completedMissionIds || []);
            setPhase(GamePhase.MAP);
          }
        }
      } catch (error) {
        console.error('Failed to load robot progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []);

  // Save progress whenever robot state changes
  useEffect(() => {
    if (robot.name && !isLoading) {
      const saveProgress = async () => {
        try {
          await fetch('/api/robo-trainer/save', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              robotName: robot.name,
              robotColor: robot.color,
              level: robot.level,
              xp: robot.xp,
              memory: robot.memory,
              completedMissionIds,
            }),
          });
        } catch (error) {
          console.error('Failed to save robot progress:', error);
        }
      };
      saveProgress();
    }
  }, [robot, completedMissionIds, isLoading]);

  const createRobot = () => {
    if (!newName.trim()) return;
    setRobot(prev => ({ ...prev, name: newName.trim(), color: newColor }));
    setPhase(GamePhase.MAP);
  };

  const handleMissionSelect = (mission: Mission) => {
    setActiveMission(mission);
    setPhase(GamePhase.MISSION);
  };

  const handleMissionComplete = (memories: TrainingMemory[]) => {
    setRobot(prev => ({
      ...prev,
      memory: [...prev.memory, ...memories],
      xp: prev.xp + 30,
    }));
    if (activeMission) {
      setCompletedMissionIds(prev => [...prev, activeMission.id]);
    }
    setPhase(GamePhase.MAP);
    setActiveMission(null);
  };

  const handleBossSelect = () => setPhase(GamePhase.BATTLE);

  const handleBattleVictory = () => {
    setRobot(prev => ({ ...prev, level: Math.min(prev.level + 1, 10) }));
    setPhase(GamePhase.VICTORY);
  };

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center min-h-[60vh]"
        style={{ background: '#060b14', imageRendering: 'pixelated' }}
      >
        <div
          className="p-8 text-center"
          style={{
            background: '#0d1117',
            border: '4px solid #f59e0b',
            boxShadow: '0 0 24px rgba(245,158,11,0.3)',
          }}
        >
          <div className="flex justify-center mb-4">
            <RobotAvatar color={RobotColor.BLUE} size="md" isThinking />
          </div>
          <p className="font-pixel text-amber-300 text-xs animate-pulse tracking-widest">
            LOADING ROBO TRAINER...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-56px)] pb-20 md:pb-4"
      style={{ background: '#060b14', imageRendering: 'pixelated' }}
    >
      {/* ── Robot HUD bar ── */}
      {phase !== GamePhase.WELCOME && (
        <div style={{ background: '#0a0f1a', borderBottom: '2px solid #1e3a1a' }}>
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 overflow-hidden flex items-center justify-center"
                style={{ background: '#050d14', border: '2px solid #f59e0b' }}
              >
                <RobotAvatar color={robot.color} size="sm" />
              </div>
              <div>
                <span className="font-pixel text-amber-200 text-xs block">{robot.name}</span>
                <span className="font-pixel text-emerald-400 text-[9px]">LVL {robot.level}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* XP bar */}
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="font-pixel text-[8px] text-gray-500 mb-0.5">XP</span>
                <div className="w-24 h-2" style={{ background: '#111', border: '1px solid #374151' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: `${Math.min((robot.xp % 100), 100)}%`, background: '#fbbf24' }}
                  />
                </div>
              </div>
              <span
                className="font-pixel text-[9px] text-yellow-300 px-2 py-1"
                style={{ background: '#0a0f1a', border: '1px solid #713f12' }}
              >
                ⭐ {robot.xp} XP
              </span>
              <span
                className="font-pixel text-[9px] text-cyan-300 px-2 py-1"
                style={{ background: '#0a0f1a', border: '1px solid #164e63' }}
              >
                💾 {robot.memory.length}
              </span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-4 md:p-8">

        {/* ══ 1. WELCOME / CREATION ══ */}
        {phase === GamePhase.WELCOME && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            {/* Title */}
            <div className="mb-6">
              <h1 className="font-pixel text-2xl md:text-3xl text-amber-300 mb-1">
                BUILD YOUR
              </h1>
              <h1
                className="font-pixel text-2xl md:text-4xl"
                style={{ color: '#67e8f9', textShadow: '0 0 20px rgba(103,232,249,0.5)' }}
              >
                INTELLIGENCE
              </h1>
            </div>

            {/* Preview robot */}
            <div className="mb-4">
              <RobotAvatar color={newColor} size="lg" isHappy />
            </div>

            {/* Creation card */}
            <div
              className="p-6 max-w-sm w-full"
              style={{
                background: '#0d1117',
                border: '4px solid #f59e0b',
                boxShadow: '0 0 30px rgba(245,158,11,0.2)',
              }}
            >
              {/* Color picker */}
              <div className="flex justify-center gap-2 mb-4">
                {COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setNewColor(opt.value)}
                    title={opt.label}
                    className="w-8 h-8 transition-all duration-150"
                    style={{
                      background: opt.hex,
                      border: newColor === opt.value
                        ? '3px solid #fff'
                        : '3px solid transparent',
                      outline: newColor === opt.value ? `2px solid ${opt.hex}` : 'none',
                      outlineOffset: '2px',
                      transform: newColor === opt.value ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>

              {/* Name input */}
              <input
                type="text"
                placeholder="NAME YOUR ROBOT"
                maxLength={16}
                className="w-full text-center p-3 font-pixel text-sm text-white placeholder:text-gray-600 uppercase outline-none mb-3"
                style={{
                  background: '#050d14',
                  border: '2px solid #374151',
                }}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createRobot()}
                onFocus={e => (e.target.style.borderColor = '#f59e0b')}
                onBlur={e => (e.target.style.borderColor = '#374151')}
              />

              {/* Start button */}
              <button
                onClick={createRobot}
                disabled={!newName.trim()}
                className="w-full font-pixel text-sm text-white py-3 transition-all duration-100 active:translate-y-1"
                style={{
                  background: newName.trim() ? '#15803d' : '#1f2937',
                  border: newName.trim() ? '4px solid #166534' : '4px solid #374151',
                  borderBottom: newName.trim() ? '4px solid #14532d' : '4px solid #374151',
                  color: newName.trim() ? '#d1fae5' : '#4b5563',
                  cursor: newName.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: newName.trim() ? '0 0 16px rgba(34,197,94,0.3)' : 'none',
                }}
              >
                ▶ START TRAINING
              </button>
            </div>

            {/* Decorative pixel blocks */}
            <div className="flex gap-3 mt-6 opacity-30">
              {['#ef4444','#f97316','#22c55e','#3b82f6','#a855f7'].map((c, i) => (
                <div key={i} className="w-4 h-4 animate-pulse" style={{ background: c, animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ══ 2. CAMPAIGN MAP ══ */}
        {phase === GamePhase.MAP && (
          <CampaignMap
            robot={robot}
            completedMissionIds={completedMissionIds}
            onSelectMission={handleMissionSelect}
            onSelectBoss={handleBossSelect}
          />
        )}

        {/* ══ 3. MISSION INTERFACE ══ */}
        {phase === GamePhase.MISSION && activeMission && (
          <MissionTerminal
            mission={activeMission}
            robot={robot}
            onMissionComplete={handleMissionComplete}
            onExit={() => setPhase(GamePhase.MAP)}
          />
        )}

        {/* ══ 4. BOSS BATTLE ══ */}
        {phase === GamePhase.BATTLE && (
          <BattleArena
            userRobot={robot}
            chapterId={robot.level}
            onBattleComplete={result => {
              if (result.winner === 'user') {
                handleBattleVictory();
              } else {
                alert('You lost! Train more and try again.');
                setPhase(GamePhase.MAP);
              }
            }}
          />
        )}

        {/* ══ 5. VICTORY SCREEN ══ */}
        {phase === GamePhase.VICTORY && (
          <div className="text-center py-12">
            {/* Pixel trophy */}
            <div
              className="inline-block p-6 mb-6"
              style={{
                background: '#0d1117',
                border: '4px solid #f59e0b',
                boxShadow: '0 0 40px rgba(245,158,11,0.4)',
              }}
            >
              <div className="text-6xl mb-2">🏆</div>
              <h2 className="font-pixel text-xl text-amber-300 animate-pulse tracking-widest">
                CHAPTER COMPLETE!
              </h2>
            </div>

            <p className="font-pixel text-sm text-emerald-400 mb-6">
              Your robot has evolved. Next chapter unlocked.
            </p>

            <div className="flex justify-center mb-8">
              <RobotAvatar color={robot.color} size="lg" isHappy />
            </div>

            {/* XP earned badge */}
            <div className="flex justify-center gap-4 mb-6">
              <div
                className="font-pixel text-xs text-yellow-300 px-4 py-2"
                style={{ background: '#0a0f1a', border: '2px solid #713f12' }}
              >
                ⭐ +XP EARNED
              </div>
              <div
                className="font-pixel text-xs text-cyan-300 px-4 py-2"
                style={{ background: '#0a0f1a', border: '2px solid #164e63' }}
              >
                📶 LVL {robot.level}
              </div>
            </div>

            <button
              onClick={() => setPhase(GamePhase.MAP)}
              className="font-pixel text-sm text-white px-10 py-4 transition-all duration-100 active:translate-y-1 hover:brightness-110"
              style={{
                background: '#15803d',
                border: '4px solid #166534',
                borderBottom: '6px solid #14532d',
                boxShadow: '0 0 20px rgba(34,197,94,0.3)',
              }}
            >
              ▶ CONTINUE JOURNEY
            </button>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
