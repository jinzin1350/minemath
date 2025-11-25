
import React, { useState } from 'react';
import { CURRICULUM } from '../data/curriculum';
import { RobotProfile, Mission } from '../types';

interface CampaignMapProps {
  robot: RobotProfile;
  completedMissionIds: number[];
  onSelectMission: (mission: Mission) => void;
  onSelectBoss: (chapterId: number) => void;
}

export const CampaignMap: React.FC<CampaignMapProps> = ({ robot, completedMissionIds, onSelectMission, onSelectBoss }) => {
  const [expandedChapter, setExpandedChapter] = useState<number>(robot.level);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h2 className="text-3xl font-black text-center text-indigo-900 mb-8 font-pixel uppercase">
        Training Road Map
      </h2>

      <div className="space-y-6">
        {CURRICULUM.map((chapter) => {
          const isLocked = chapter.id > robot.level;
          const isCompleted = chapter.id < robot.level;
          const isCurrent = chapter.id === robot.level;

          // Calculate chapter progress
          const chapterMissionIds = chapter.missions.map(m => m.id);
          const completedInChapter = chapterMissionIds.filter(id => completedMissionIds.includes(id)).length;
          const allMissionsDone = completedInChapter === chapter.missions.length;

          return (
            <div key={chapter.id} className={`bg-white rounded-2xl shadow-lg border-b-8 transition-all duration-300 ${isLocked ? 'border-slate-300 opacity-60 grayscale' : isCompleted ? 'border-green-300 bg-green-50' : 'border-indigo-300'}`}>

              {/* Chapter Header */}
              <div
                className="p-6 cursor-pointer flex items-center justify-between"
                onClick={() => !isLocked && setExpandedChapter(expandedChapter === chapter.id ? 0 : chapter.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl border-4 ${isLocked ? 'bg-slate-200 text-slate-400 border-slate-300' : isCompleted ? 'bg-green-500 text-white border-green-600' : 'bg-indigo-500 text-white border-indigo-600'}`}>
                    {isCompleted ? '✓' : chapter.id}
                  </div>
                  <div>
                    <h3 className={`font-black text-xl ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>{chapter.title}</h3>
                    <p className="text-sm text-slate-500 hidden md:block">{chapter.description}</p>
                  </div>
                </div>

                <div className="text-right">
                    <span className="font-bold text-slate-400 text-sm">Progress</span>
                    <div className="w-24 h-2 bg-slate-200 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: `${(completedInChapter / 5) * 100}%` }}></div>
                    </div>
                </div>
              </div>

              {/* Missions List (Accordion) */}
              {!isLocked && expandedChapter === chapter.id && (
                <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                  <div className="grid gap-3 mt-4">
                    {chapter.missions.map((mission) => {
                        const isMissionDone = completedMissionIds.includes(mission.id);
                        return (
                            <button
                                key={mission.id}
                                disabled={isMissionDone}
                                onClick={() => onSelectMission(mission)}
                                className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left
                                    ${isMissionDone
                                        ? 'bg-green-100 border-green-200 text-green-800 opacity-70'
                                        : 'bg-white border-white hover:border-indigo-400 hover:shadow-md cursor-pointer'
                                    }
                                `}
                            >
                                <div>
                                    <div className="font-bold text-sm uppercase tracking-wider mb-1 opacity-60">Mission {mission.id}</div>
                                    <div className="font-bold">{mission.title}</div>
                                </div>
                                {isMissionDone ? (
                                    <span className="text-green-600 font-bold text-xs bg-green-200 px-2 py-1 rounded">DONE</span>
                                ) : (
                                    <span className="text-indigo-600 font-bold text-lg">▶</span>
                                )}
                            </button>
                        );
                    })}
                  </div>

                  {/* Boss Battle Button */}
                  <div className="mt-6 pt-4 border-t border-slate-200">
                      <button
                        disabled={!allMissionsDone}
                        onClick={() => onSelectBoss(chapter.id)}
                        className={`w-full py-4 rounded-xl font-black text-lg tracking-widest uppercase transition-all shadow-lg
                            ${allMissionsDone
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105 shadow-orange-500/30'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }
                        `}
                      >
                         {allMissionsDone ? '🔥 START BOSS BATTLE 🔥' : `Complete ${5 - completedInChapter} missions to unlock Boss`}
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
