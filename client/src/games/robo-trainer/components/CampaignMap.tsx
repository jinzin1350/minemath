
import React, { useState } from 'react';
import { CURRICULUM } from '../data/curriculum';
import { RobotProfile, Mission } from '../types';

interface CampaignMapProps {
  robot: RobotProfile;
  completedMissionIds: number[];
  onSelectMission: (mission: Mission) => void;
  onSelectBoss: (chapterId: number) => void;
}

export const CampaignMap: React.FC<CampaignMapProps> = ({
  robot,
  completedMissionIds,
  onSelectMission,
  onSelectBoss,
}) => {
  const [expandedChapter, setExpandedChapter] = useState<number>(robot.level);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="font-pixel text-lg md:text-xl text-amber-300 tracking-widest">
          🗺️ TRAINING ROAD MAP
        </h2>
        <div className="flex justify-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-2 h-2 animate-pulse" style={{ background: '#f59e0b', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {CURRICULUM.map(chapter => {
          const isLocked    = chapter.id > robot.level;
          const isCompleted = chapter.id < robot.level;
          const isCurrent   = chapter.id === robot.level;
          const isExpanded  = expandedChapter === chapter.id;

          const completedInChapter = chapter.missions.filter(m => completedMissionIds.includes(m.id)).length;
          const allMissionsDone    = completedInChapter === chapter.missions.length;

          const borderColor = isLocked ? '#1f2937' : isCompleted ? '#166534' : '#b45309';
          const bgColor     = isLocked ? '#050a0f' : isCompleted ? '#071a0a' : '#080e14';
          const titleColor  = isLocked ? '#374151' : isCompleted ? '#4ade80' : '#fcd34d';

          return (
            <div
              key={chapter.id}
              style={{
                background: bgColor,
                border: `3px solid ${borderColor}`,
                opacity: isLocked ? 0.5 : 1,
              }}
            >
              {/* Chapter header */}
              <div
                className="p-4 flex items-center justify-between cursor-pointer"
                onClick={() => !isLocked && setExpandedChapter(isExpanded ? 0 : chapter.id)}
              >
                <div className="flex items-center gap-3">
                  {/* Chapter badge */}
                  <div
                    className="w-10 h-10 flex items-center justify-center font-pixel text-sm flex-shrink-0"
                    style={{
                      background: isLocked ? '#111' : isCompleted ? '#14532d' : '#451a03',
                      border: `3px solid ${borderColor}`,
                      color: titleColor,
                    }}
                  >
                    {isCompleted ? '✓' : chapter.id}
                  </div>

                  <div>
                    <h3 className="font-pixel text-xs" style={{ color: titleColor }}>
                      {chapter.title.toUpperCase()}
                    </h3>
                    <p className="text-[10px] text-gray-600 hidden md:block mt-0.5">
                      {chapter.description}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="font-pixel text-[9px] text-gray-500 mb-1">
                    {completedInChapter}/{chapter.missions.length}
                  </div>
                  <div
                    className="w-20 h-2 overflow-hidden"
                    style={{ background: '#0d1117', border: '1px solid #1f2937' }}
                  >
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${(completedInChapter / chapter.missions.length) * 100}%`,
                        background: isCompleted ? '#22c55e' : '#f59e0b',
                      }}
                    />
                  </div>
                  <div
                    className="font-pixel text-[8px] mt-1"
                    style={{ color: titleColor }}
                  >
                    {!isLocked && (isExpanded ? '▲' : '▼')}
                  </div>
                </div>
              </div>

              {/* Missions list */}
              {!isLocked && isExpanded && (
                <div
                  className="px-4 pb-4"
                  style={{ borderTop: '1px solid #1f2937' }}
                >
                  <div className="grid gap-2 mt-3">
                    {chapter.missions.map(mission => {
                      const isMissionDone = completedMissionIds.includes(mission.id);
                      return (
                        <button
                          key={mission.id}
                          disabled={isMissionDone}
                          onClick={() => onSelectMission(mission)}
                          className="flex items-center justify-between p-3 text-left w-full transition-all duration-100 active:translate-y-px"
                          style={{
                            background: isMissionDone ? '#071a0a' : '#0a1628',
                            border: `2px solid ${isMissionDone ? '#166534' : '#1e3a5f'}`,
                            opacity: isMissionDone ? 0.7 : 1,
                            cursor: isMissionDone ? 'default' : 'pointer',
                          }}
                          onMouseEnter={e => {
                            if (!isMissionDone) (e.currentTarget as HTMLElement).style.borderColor = '#f59e0b';
                          }}
                          onMouseLeave={e => {
                            if (!isMissionDone) (e.currentTarget as HTMLElement).style.borderColor = '#1e3a5f';
                          }}
                        >
                          <div>
                            <div className="font-pixel text-[8px] text-gray-600 mb-0.5">
                              MISSION {mission.id}
                            </div>
                            <div
                              className="font-pixel text-[10px]"
                              style={{ color: isMissionDone ? '#4ade80' : '#e5e7eb' }}
                            >
                              {mission.title}
                            </div>
                          </div>
                          {isMissionDone ? (
                            <span
                              className="font-pixel text-[8px] text-green-400 px-2 py-1 flex-shrink-0"
                              style={{ background: '#071a0a', border: '1px solid #166534' }}
                            >
                              ✓ DONE
                            </span>
                          ) : (
                            <span className="text-amber-400 font-bold text-lg flex-shrink-0">▶</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Boss battle button */}
                  <div className="mt-4" style={{ borderTop: '1px solid #1f2937', paddingTop: '12px' }}>
                    <button
                      disabled={!allMissionsDone}
                      onClick={() => onSelectBoss(chapter.id)}
                      className="w-full py-3 font-pixel text-xs tracking-widest uppercase transition-all duration-100 active:translate-y-0.5"
                      style={{
                        background: allMissionsDone ? '#7f1d1d' : '#0d1117',
                        border: allMissionsDone ? '4px solid #991b1b' : '4px solid #1f2937',
                        borderBottom: allMissionsDone ? '6px solid #450a0a' : '4px solid #1f2937',
                        color: allMissionsDone ? '#fca5a5' : '#4b5563',
                        cursor: allMissionsDone ? 'pointer' : 'not-allowed',
                        boxShadow: allMissionsDone ? '0 0 20px rgba(239,68,68,0.3)' : 'none',
                      }}
                      onMouseEnter={e => {
                        if (allMissionsDone) (e.currentTarget as HTMLElement).style.background = '#991b1b';
                      }}
                      onMouseLeave={e => {
                        if (allMissionsDone) (e.currentTarget as HTMLElement).style.background = '#7f1d1d';
                      }}
                    >
                      {allMissionsDone
                        ? '🔥 START BOSS BATTLE 🔥'
                        : `Complete ${chapter.missions.length - completedInChapter} more mission${chapter.missions.length - completedInChapter !== 1 ? 's' : ''} to unlock Boss`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
