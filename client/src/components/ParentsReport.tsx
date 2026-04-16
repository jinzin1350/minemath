import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────

interface MathDay {
  date: string;
  pointsEarned: number;
  questionsAnswered: number;
  correctAnswers: number;
  level: number;
}

interface DictDay {
  date: string;
  totalGames: number;
  totalScore: number;
  totalWords: number;
  totalCorrect: number;
  accuracy: number;
  bestLevel: number;
}

interface DictMode {
  gameMode: string;
  totalGames: number;
  totalScore: number;
  totalWords: number;
  totalCorrect: number;
  accuracy: number;
}

interface DictReport {
  month: string;
  dailyHistory: DictDay[];
  modeStats: DictMode[];
  monthlySummary: {
    totalGames: number;
    totalScore: number;
    totalWords: number;
    totalCorrect: number;
    accuracy: number;
    bestLevel: number;
    activeDays: number;
  };
}

interface LeaderboardEntry {
  userId: string;
  userName: string;
  mathScore: number;
  dictationScore: number;
  totalScore: number;
  rank: number;
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatCard({
  icon, value, label, color,
}: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <div className="text-center py-4 bg-[#0d1117]"
      style={{ border: `2px solid ${color}`, boxShadow: `0 0 8px ${color}33` }}>
      <div className="h-1 w-full mb-2" style={{ background: color }} />
      <p className="text-xl font-pixel mb-0.5" style={{ color }}>{value}</p>
      <p className="font-pixel text-[8px] text-gray-600">{icon} {label}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #374151)' }} />
      <span className="font-pixel text-[8px] text-gray-600 tracking-widest">{children}</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, #374151)' }} />
    </div>
  );
}

function EmptyState({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 opacity-40">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="font-pixel text-[9px] text-gray-500">{label}</p>
    </div>
  );
}

const MODE_META: Record<string, { label: string; color: string; icon: string }> = {
  'typing':          { label: 'TYPING MODE',    color: '#3b82f6', icon: '⌨️' },
  'multiple-choice': { label: 'MULTIPLE CHOICE', color: '#10b981', icon: '👆' },
  'fill-blanks':     { label: 'FILL THE BLANK',  color: '#a855f7', icon: '⚡' },
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ParentsReport: React.FC = () => {
  const [tab, setTab] = useState<'math' | 'english' | 'rank'>('math');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // ── Queries ─────────────────────────────────────────────────────────────────

  const { data: mathData, isLoading: mathLoading } = useQuery<MathDay[]>({
    queryKey: [`/api/progress/recent?month=${selectedMonth}`],
    refetchInterval: 30_000,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: dictData, isLoading: dictLoading } = useQuery<DictReport>({
    queryKey: [`/api/dictation/progress-report?month=${selectedMonth}`],
    refetchInterval: 30_000,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: leaderboardData, isLoading: rankLoading } = useQuery<{
    leaderboard: LeaderboardEntry[];
    total: number;
  }>({
    queryKey: ['/api/leaderboard/global'],
    refetchInterval: 60_000,
  });

  const { data: userInfo } = useQuery<{ id: string; firstName?: string; email: string }>({
    queryKey: ['/api/auth/user'],
  });

  // ── Math stats ───────────────────────────────────────────────────────────────

  const mathStats = useMemo(() => {
    if (!mathData || mathData.length === 0) return null;
    const totalPoints    = mathData.reduce((s, d) => s + (d.pointsEarned || 0), 0);
    const totalQuestions = mathData.reduce((s, d) => s + (d.questionsAnswered || 0), 0);
    const totalCorrect   = mathData.reduce((s, d) => s + (d.correctAnswers || 0), 0);
    const bestLevel      = Math.max(...mathData.map(d => d.level || 1));
    const accuracy       = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    return { totalPoints, totalQuestions, totalCorrect, bestLevel, accuracy, daysPlayed: mathData.length };
  }, [mathData]);

  const mathChartData = useMemo(() => {
    if (!mathData) return [];
    return [...mathData].reverse().map(d => ({
      date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      points: d.pointsEarned,
      accuracy: d.questionsAnswered > 0 ? Math.round((d.correctAnswers / d.questionsAnswered) * 100) : 0,
    }));
  }, [mathData]);

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  const tabs: { key: 'math' | 'english' | 'rank'; label: string; color: string }[] = [
    { key: 'math',    label: '🧮 MATH',    color: '#f59e0b' },
    { key: 'english', label: '🎧 ENGLISH', color: '#3b82f6' },
    { key: 'rank',    label: '🏆 RANK',    color: '#a855f7' },
  ];

  const activeColor = tabs.find(t => t.key === tab)?.color ?? '#22c55e';

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen pb-20 md:pb-8"
      style={{ background: 'linear-gradient(180deg,#060b14 0%,#0a1a0f 60%,#060b14 100%)', imageRendering: 'pixelated' }}>

      <div className="max-w-3xl mx-auto px-4 pt-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-pixel text-base md:text-xl text-emerald-400 leading-tight"
              style={{ textShadow: '0 0 16px rgba(52,211,153,0.4)' }}>
              📊 PROGRESS REPORT
            </h1>
            <p className="font-pixel text-[8px] text-gray-600 mt-0.5">
              {userInfo?.firstName || userInfo?.email || 'Player'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="font-pixel text-[9px] px-2 py-1.5 bg-[#0d1117] text-gray-300 focus:outline-none"
              style={{ borderRadius: 0, border: '2px solid #374151' }}
            />
            <button
              onClick={() => window.print()}
              className="font-pixel text-[8px] text-gray-500 px-2 py-1.5 border border-gray-700 hover:text-gray-300 transition-colors"
              style={{ borderRadius: 0 }}
            >🖨️</button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 font-pixel text-[9px] py-2.5 transition-all"
              style={{
                borderRadius: 0,
                background: tab === t.key ? `${t.color}22` : '#0d1117',
                border: `2px solid ${tab === t.key ? t.color : '#1f2937'}`,
                borderBottom: `4px solid ${tab === t.key ? t.color + '88' : '#111827'}`,
                color: tab === t.key ? t.color : '#6b7280',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ══ MATH TAB ══════════════════════════════════════════════════════════ */}
        {tab === 'math' && (
          <div className="space-y-6">
            {mathLoading && (
              <div className="text-center py-16">
                <p className="font-pixel text-[9px] text-amber-600 animate-pulse">LOADING MATH DATA...</p>
              </div>
            )}

            {!mathLoading && !mathStats && (
              <EmptyState icon="🧮" label="NO MATH SESSIONS THIS MONTH" />
            )}

            {mathStats && (
              <>
                <SectionTitle>MONTHLY SUMMARY</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                  <StatCard icon="⭐" value={mathStats.totalPoints}   label="TOTAL POINTS"   color="#f59e0b" />
                  <StatCard icon="🎯" value={`${mathStats.accuracy}%`} label="ACCURACY"       color="#10b981" />
                  <StatCard icon="📅" value={mathStats.daysPlayed}    label="DAYS PLAYED"    color="#3b82f6" />
                  <StatCard icon="✅" value={mathStats.totalCorrect}  label="CORRECT ANS."   color="#22c55e" />
                  <StatCard icon="❌" value={mathStats.totalQuestions - mathStats.totalCorrect} label="WRONG ANS." color="#ef4444" />
                  <StatCard icon="⚡" value={`LV ${mathStats.bestLevel}`} label="BEST LEVEL"  color="#a855f7" />
                </div>

                <SectionTitle>DAILY POINTS</SectionTitle>
                <div className="bg-[#0d1117] p-3" style={{ border: '2px solid #1f2937' }}>
                  {mathChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={mathChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'inherit' }} />
                        <YAxis tick={{ fontSize: 8, fill: '#6b7280', fontFamily: 'inherit' }} />
                        <Tooltip
                          contentStyle={{ background: '#0d1117', border: '1px solid #374151', borderRadius: 0 }}
                          labelStyle={{ color: '#9ca3af', fontSize: 9 }}
                          itemStyle={{ color: '#f59e0b', fontSize: 9 }}
                        />
                        <Bar dataKey="points" fill="#f59e0b" radius={0} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon="📊" label="NO CHART DATA" />}
                </div>

                <SectionTitle>DAILY ACCURACY %</SectionTitle>
                <div className="bg-[#0d1117] p-3" style={{ border: '2px solid #1f2937' }}>
                  {mathChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={mathChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#6b7280' }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#6b7280' }} />
                        <Tooltip
                          contentStyle={{ background: '#0d1117', border: '1px solid #374151', borderRadius: 0 }}
                          labelStyle={{ color: '#9ca3af', fontSize: 9 }}
                          formatter={(v: any) => [`${v}%`, 'Accuracy']}
                        />
                        <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon="📈" label="NO CHART DATA" />}
                </div>

                {/* Day-by-day log */}
                {mathData && mathData.length > 0 && (
                  <>
                    <SectionTitle>SESSION LOG</SectionTitle>
                    <div className="bg-[#0d1117] overflow-hidden" style={{ border: '2px solid #1f2937' }}>
                      <div className="grid grid-cols-4 px-3 py-1.5 bg-black/40">
                        {['DATE', 'PTS', 'CORRECT', 'ACC%'].map(h => (
                          <span key={h} className="font-pixel text-[7px] text-gray-600">{h}</span>
                        ))}
                      </div>
                      {[...mathData].reverse().map((d, i) => {
                        const acc = d.questionsAnswered > 0 ? Math.round((d.correctAnswers / d.questionsAnswered) * 100) : 0;
                        return (
                          <div key={i} className="grid grid-cols-4 px-3 py-2 border-t border-gray-800/50">
                            <span className="font-pixel text-[8px] text-gray-500">
                              {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="font-pixel text-[8px] text-amber-400">{d.pointsEarned}</span>
                            <span className="font-pixel text-[8px] text-emerald-400">{d.correctAnswers}/{d.questionsAnswered}</span>
                            <span className="font-pixel text-[8px]" style={{ color: acc >= 80 ? '#22c55e' : acc >= 60 ? '#f59e0b' : '#ef4444' }}>
                              {acc}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ ENGLISH TAB ═══════════════════════════════════════════════════════ */}
        {tab === 'english' && (
          <div className="space-y-6">
            {dictLoading && (
              <div className="text-center py-16">
                <p className="font-pixel text-[9px] text-blue-600 animate-pulse">LOADING ENGLISH DATA...</p>
              </div>
            )}

            {!dictLoading && (!dictData || dictData.monthlySummary.totalGames === 0) && (
              <EmptyState icon="🎧" label="NO ENGLISH SESSIONS THIS MONTH" />
            )}

            {dictData && dictData.monthlySummary.totalGames > 0 && (
              <>
                <SectionTitle>MONTHLY SUMMARY</SectionTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                  <StatCard icon="⭐" value={dictData.monthlySummary.totalScore}    label="TOTAL SCORE"  color="#f59e0b" />
                  <StatCard icon="🎯" value={`${dictData.monthlySummary.accuracy}%`} label="ACCURACY"    color="#10b981" />
                  <StatCard icon="📖" value={dictData.monthlySummary.totalWords}    label="WORDS"        color="#3b82f6" />
                  <StatCard icon="📅" value={dictData.monthlySummary.activeDays}    label="DAYS ACTIVE"  color="#a855f7" />
                </div>

                <SectionTitle>BY GAME MODE</SectionTitle>
                <div className="space-y-2">
                  {['typing', 'multiple-choice', 'fill-blanks'].map(mode => {
                    const meta = MODE_META[mode];
                    const stat = dictData.modeStats.find(m => m.gameMode === mode);
                    const hasData = !!stat && stat.totalGames > 0;
                    return (
                      <div key={mode} className="bg-[#0d1117] overflow-hidden"
                        style={{ border: `2px solid ${hasData ? meta.color : '#1f2937'}`, opacity: hasData ? 1 : 0.4 }}>
                        <div className="h-1 w-full" style={{ background: hasData ? meta.color : '#1f2937' }} />
                        <div className="px-3 py-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-pixel text-[9px]" style={{ color: meta.color }}>
                              {meta.icon} {meta.label}
                            </span>
                            {hasData
                              ? <span className="font-pixel text-[7px] text-gray-600">{stat.totalGames} GAMES</span>
                              : <span className="font-pixel text-[7px] text-gray-700">NOT PLAYED</span>
                            }
                          </div>
                          {hasData && (
                            <div className="grid grid-cols-4 gap-1">
                              {[
                                ['⭐', stat.totalScore, 'SCORE'],
                                ['📖', stat.totalWords, 'WORDS'],
                                ['✅', stat.totalCorrect, 'CORRECT'],
                                ['🎯', `${stat.accuracy}%`, 'ACC'],
                              ].map(([icon, val, lbl]) => (
                                <div key={String(lbl)} className="text-center py-1.5 bg-black/30">
                                  <p className="font-pixel text-[10px]" style={{ color: meta.color }}>{val}</p>
                                  <p className="font-pixel text-[6px] text-gray-700">{icon} {lbl}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {dictData.dailyHistory.length > 0 && (
                  <>
                    <SectionTitle>DAILY ACCURACY %</SectionTitle>
                    <div className="bg-[#0d1117] p-3" style={{ border: '2px solid #1f2937' }}>
                      <ResponsiveContainer width="100%" height={140}>
                        <LineChart
                          data={[...dictData.dailyHistory].reverse().map(d => ({
                            date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            accuracy: d.accuracy,
                            score: d.totalScore,
                          }))}
                          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                          <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#6b7280' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#6b7280' }} />
                          <Tooltip
                            contentStyle={{ background: '#0d1117', border: '1px solid #374151', borderRadius: 0 }}
                            formatter={(v: any, n: string) => [n === 'accuracy' ? `${v}%` : v, n === 'accuracy' ? 'Accuracy' : 'Score']}
                          />
                          <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <SectionTitle>SESSION LOG</SectionTitle>
                    <div className="bg-[#0d1117] overflow-hidden" style={{ border: '2px solid #1f2937' }}>
                      <div className="grid grid-cols-4 px-3 py-1.5 bg-black/40">
                        {['DATE', 'SCORE', 'WORDS', 'ACC%'].map(h => (
                          <span key={h} className="font-pixel text-[7px] text-gray-600">{h}</span>
                        ))}
                      </div>
                      {[...dictData.dailyHistory].map((d, i) => (
                        <div key={i} className="grid grid-cols-4 px-3 py-2 border-t border-gray-800/50">
                          <span className="font-pixel text-[8px] text-gray-500">
                            {new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-pixel text-[8px] text-amber-400">{d.totalScore}</span>
                          <span className="font-pixel text-[8px] text-blue-400">{d.totalCorrect}/{d.totalWords}</span>
                          <span className="font-pixel text-[8px]" style={{ color: d.accuracy >= 80 ? '#22c55e' : d.accuracy >= 60 ? '#f59e0b' : '#ef4444' }}>
                            {d.accuracy}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ RANK TAB ══════════════════════════════════════════════════════════ */}
        {tab === 'rank' && (
          <div className="space-y-6">
            {rankLoading && (
              <div className="text-center py-16">
                <p className="font-pixel text-[9px] text-purple-600 animate-pulse">LOADING LEADERBOARD...</p>
              </div>
            )}

            {!rankLoading && (!leaderboardData || leaderboardData.leaderboard.length === 0) && (
              <EmptyState icon="🏆" label="NO LEADERBOARD DATA YET" />
            )}

            {leaderboardData && leaderboardData.leaderboard.length > 0 && (
              <>
                <SectionTitle>GLOBAL LEADERBOARD</SectionTitle>

                {/* My rank highlight */}
                {userInfo && (() => {
                  const me = leaderboardData.leaderboard.find(e => e.userId === userInfo.id);
                  if (!me) return null;
                  return (
                    <div className="bg-[#0d1117] px-4 py-3 mb-4 animate-float"
                      style={{ border: '2px solid #a855f7', boxShadow: '0 0 16px rgba(168,85,247,0.2)' }}>
                      <div className="h-1 w-full mb-2" style={{ background: '#a855f7' }} />
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-pixel text-[8px] text-purple-400 mb-0.5">YOUR RANK</p>
                          <p className="font-pixel text-[10px] text-white">{me.userName || userInfo.firstName || 'You'}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-pixel text-2xl text-purple-300">#{me.rank}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-pixel text-[8px] text-gray-600">TOTAL SCORE</p>
                          <p className="font-pixel text-[12px] text-amber-400">{me.totalScore}</p>
                          <p className="font-pixel text-[7px] text-gray-700">🧮{me.mathScore} 🎧{me.dictationScore}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Leaderboard table */}
                <div className="bg-[#0d1117] overflow-hidden" style={{ border: '2px solid #1f2937' }}>
                  {/* Header */}
                  <div className="grid grid-cols-12 px-3 py-1.5 bg-black/40">
                    <span className="col-span-1 font-pixel text-[7px] text-gray-600">#</span>
                    <span className="col-span-5 font-pixel text-[7px] text-gray-600">PLAYER</span>
                    <span className="col-span-2 font-pixel text-[7px] text-gray-600">MATH</span>
                    <span className="col-span-2 font-pixel text-[7px] text-gray-600">ENG</span>
                    <span className="col-span-2 font-pixel text-[7px] text-gray-600">TOTAL</span>
                  </div>

                  {leaderboardData.leaderboard.map((entry, i) => {
                    const isMe = entry.userId === userInfo?.id;
                    const rankColor = entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#9ca3af' : entry.rank === 3 ? '#b45309' : '#374151';
                    return (
                      <div key={i}
                        className="grid grid-cols-12 px-3 py-2 border-t border-gray-800/50"
                        style={{ background: isMe ? 'rgba(168,85,247,0.08)' : 'transparent' }}>
                        <span className="col-span-1 font-pixel text-[10px]" style={{ color: rankColor }}>
                          {entry.rank <= 3 ? ['🥇','🥈','🥉'][entry.rank - 1] : `${entry.rank}`}
                        </span>
                        <span className="col-span-5 font-pixel text-[8px] truncate"
                          style={{ color: isMe ? '#c084fc' : '#d1d5db' }}>
                          {entry.userName || `Player ${entry.rank}`}
                          {isMe && <span className="text-purple-500 ml-1">◀</span>}
                        </span>
                        <span className="col-span-2 font-pixel text-[8px] text-amber-400">{entry.mathScore}</span>
                        <span className="col-span-2 font-pixel text-[8px] text-blue-400">{entry.dictationScore}</span>
                        <span className="col-span-2 font-pixel text-[8px] text-emerald-400">{entry.totalScore}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="font-pixel text-[7px] text-gray-700 text-center">
                  {leaderboardData.total} PLAYERS TOTAL
                </p>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
