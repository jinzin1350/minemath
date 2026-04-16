import { useQuery } from '@tanstack/react-query';
import { BottomNav } from './BottomNav';
import { NavBar } from './NavBar';

interface GlobalEntry {
  userId: string;
  userName: string;
  mathScore: number;
  dictationScore: number;
  totalScore: number;
  rank: number;
}

interface GlobalLeaderboardData {
  leaderboard: GlobalEntry[];
  currentUserEntry: GlobalEntry | null;
  total: number;
  timestamp: string;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Pixel-art Minecraft robot icon
function PixelBot({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 24" width="20" height="24" style={{ imageRendering: 'pixelated', flexShrink: 0 }}>
      <rect x="3" y="2"  width="14" height="12" fill={color} />
      <rect x="5" y="4"  width="10" height="7"  fill="#050d14" />
      <rect x="6" y="5"  width="3"  height="3"  fill="#67e8f9" />
      <rect x="11" y="5" width="3"  height="3"  fill="#67e8f9" />
      <rect x="6" y="9"  width="8"  height="2"  fill="#67e8f9" />
      <rect x="0" y="5"  width="3"  height="4"  fill={color} />
      <rect x="17" y="5" width="3"  height="4"  fill={color} />
      <rect x="7" y="14" width="6"  height="3"  fill="#374151" />
      <rect x="3" y="17" width="14" height="7"  fill={color} />
      <rect x="5" y="18" width="4"  height="6"  fill="#1f2937" />
      <rect x="11" y="18" width="4" height="6"  fill="#1f2937" />
    </svg>
  );
}

const RANK_STYLE: Record<number, { border: string; bg: string; textColor: string; glow: string; botColor: string }> = {
  1: { border: '#b45309', bg: '#160a00', textColor: '#fcd34d', glow: '0 0 18px rgba(245,158,11,0.4)', botColor: '#f59e0b' },
  2: { border: '#4b5563', bg: '#0e1016', textColor: '#d1d5db', glow: '0 0 10px rgba(75,85,99,0.25)',  botColor: '#9ca3af' },
  3: { border: '#78350f', bg: '#120700', textColor: '#fb923c', glow: '0 0 10px rgba(120,53,15,0.25)', botColor: '#d97706' },
};
const DEFAULT_STYLE = { border: '#1f2937', bg: 'transparent', textColor: '#6b7280', glow: 'none', botColor: '#374151' };

export function RankTab() {
  const { data: currentUser } = useQuery<{ id: string; firstName?: string; email: string }>({
    queryKey: ['/api/auth/user'],
  });

  const { data, isLoading, isError, refetch } = useQuery<GlobalLeaderboardData>({
    queryKey: ['/api/leaderboard/global'],
    refetchInterval: 30_000,
    staleTime: 0,
  });

  const leaderboard = data?.leaderboard ?? [];
  const myEntry = data?.currentUserEntry ?? leaderboard.find(e => e.userId === currentUser?.id) ?? null;
  const avgScore = leaderboard.length
    ? Math.round(leaderboard.reduce((s, e) => s + e.totalScore, 0) / leaderboard.length)
    : 0;
  const topScore = leaderboard.length ? Math.max(...leaderboard.map(e => e.totalScore)) : 0;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060b14' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="p-8 text-center" style={{ background: '#0d1117', border: '4px solid #f59e0b', boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}>
            <div className="text-4xl mb-3 animate-pulse">🏆</div>
            <p className="font-pixel text-amber-300 text-xs animate-pulse tracking-widest">LOADING RANKINGS...</p>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ── Error ── */
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060b14' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="p-8 text-center max-w-sm w-full" style={{ background: '#0d1117', border: '4px solid #991b1b' }}>
            <div className="text-4xl mb-3">⚠️</div>
            <p className="font-pixel text-red-300 text-xs mb-4">Connection error. Check your network.</p>
            <button onClick={() => refetch()}
              className="font-pixel text-xs text-amber-200 px-5 py-2 transition-all duration-100 active:translate-y-0.5"
              style={{ background: '#451a03', border: '3px solid #b45309', borderBottom: '5px solid #78350f' }}>
              ↻ RETRY
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ── Empty ── */
  if (!leaderboard.length) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#060b14' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="p-8 text-center max-w-sm w-full" style={{ background: '#0d1117', border: '4px solid #b45309', boxShadow: '0 0 20px rgba(180,83,9,0.2)' }}>
            <div className="text-4xl mb-3">🎮</div>
            <p className="font-pixel text-amber-300 text-xs mb-1">NO RANKINGS YET</p>
            <p className="font-pixel text-gray-600 text-[10px] mb-4">Play games to get on the leaderboard!</p>
            <button onClick={() => refetch()}
              className="font-pixel text-xs text-amber-200 px-5 py-2 transition-all duration-100 active:translate-y-0.5"
              style={{ background: '#451a03', border: '3px solid #b45309', borderBottom: '5px solid #78350f' }}>
              ↻ REFRESH
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#060b14', imageRendering: 'pixelated' }}>
      <NavBar />

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-4 pb-24 md:pb-8 space-y-4">

        {/* ── Title ── */}
        <div className="text-center py-5 px-4 relative overflow-hidden"
          style={{ background: '#0d1117', border: '4px solid #b45309', boxShadow: '0 0 28px rgba(245,158,11,0.2)' }}>
          <div className="absolute left-3 top-3 flex gap-1 opacity-25">
            {['#f59e0b','#22c55e','#3b82f6','#a855f7'].map((c, i) => (
              <div key={i} className="w-3 h-3 animate-pulse" style={{ background: c, animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          <div className="absolute right-3 top-3 flex gap-1 opacity-25">
            {['#ef4444','#f59e0b','#67e8f9'].map((c, i) => (
              <div key={i} className="w-3 h-3 animate-pulse" style={{ background: c, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <div className="font-pixel text-2xl md:text-3xl text-amber-300 mb-1">
            🏆 GLOBAL RANKINGS
          </div>
          <div className="font-pixel text-[9px] text-gray-600 tracking-widest">
            ALL STUDENTS — ALL TIME
          </div>
        </div>

        {/* ── My rank card ── */}
        {myEntry && (
          <div className="p-4 relative"
            style={{ background: '#080e1f', border: '3px solid #1d4ed8', boxShadow: '0 0 20px rgba(29,78,216,0.3)' }}>
            <div className="absolute -top-2 left-4 font-pixel text-[9px] text-blue-300 px-2 py-0.5"
              style={{ background: '#080e1f', border: '1px solid #1d4ed8' }}>
              YOUR RANK
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="font-pixel text-3xl text-blue-200 w-14 text-center"
                  style={{ textShadow: '0 0 14px rgba(59,130,246,0.7)' }}>
                  #{myEntry.rank}
                </div>
                <div>
                  <div className="font-pixel text-sm text-blue-100 mb-1">{myEntry.userName}</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="font-pixel text-[9px] text-emerald-400">⚔️ {myEntry.mathScore.toLocaleString()} math</span>
                    <span className="font-pixel text-[9px] text-purple-400">📖 {myEntry.dictationScore.toLocaleString()} english</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="font-pixel text-xl text-yellow-300"
                  style={{ textShadow: '0 0 10px rgba(253,224,71,0.5)' }}>
                  {myEntry.totalScore.toLocaleString()}
                </div>
                <div className="font-pixel text-[8px] text-gray-600">TOTAL PTS</div>
                {myEntry.rank === 1 && (
                  <div className="font-pixel text-[9px] text-amber-400 animate-pulse">👑 CHAMPION</div>
                )}
                {myEntry.rank === 2 && <div className="font-pixel text-[9px] text-gray-400">🥈 2nd place</div>}
                {myEntry.rank === 3 && <div className="font-pixel text-[9px] text-amber-600">🥉 3rd place</div>}
                {myEntry.rank > 3 && (
                  <div className="font-pixel text-[9px] text-blue-500">💪 keep going!</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Summary stats ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'STUDENTS', value: data?.total ?? 0, color: '#3b82f6', icon: '👥' },
            { label: 'AVG SCORE', value: avgScore.toLocaleString(), color: '#22c55e', icon: '📊' },
            { label: 'TOP SCORE', value: topScore.toLocaleString(), color: '#f59e0b', icon: '👑' },
          ].map(s => (
            <div key={s.label} className="text-center py-3"
              style={{ background: '#0d1117', border: `2px solid ${s.color}33`, boxShadow: `0 0 8px ${s.color}22` }}>
              <div className="h-0.5 w-full mb-2" style={{ background: s.color }} />
              <div className="font-pixel text-sm mb-0.5" style={{ color: s.color }}>{s.value}</div>
              <div className="font-pixel text-[7px] text-gray-600">{s.icon} {s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Top 3 podium ── */}
        {leaderboard.slice(0, 3).length > 0 && (
          <div>
            <div className="font-pixel text-[9px] text-gray-700 mb-2 tracking-widest">◆ TOP PLAYERS ◆</div>
            <div className="space-y-2">
              {leaderboard.slice(0, 3).map(entry => {
                const isMe = entry.userId === currentUser?.id;
                const rs = RANK_STYLE[entry.rank] ?? DEFAULT_STYLE;
                return (
                  <div key={entry.userId}
                    className="flex items-center justify-between p-3 md:p-4"
                    style={{
                      background: isMe ? '#080e1f' : rs.bg,
                      border: `3px solid ${isMe ? '#1d4ed8' : rs.border}`,
                      boxShadow: isMe ? '0 0 18px rgba(29,78,216,0.35)' : rs.glow,
                    }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 text-center text-xl flex-shrink-0">
                        {MEDAL[entry.rank]}
                      </div>
                      <PixelBot color={isMe ? '#3b82f6' : rs.botColor} />
                      <div>
                        <div className="font-pixel text-xs" style={{ color: isMe ? '#93c5fd' : rs.textColor }}>
                          {entry.userName}
                          {isMe && <span className="text-blue-400 ml-1">(YOU)</span>}
                        </div>
                        <div className="flex gap-2 mt-0.5">
                          <span className="font-pixel text-[8px] text-emerald-600">⚔️ {entry.mathScore.toLocaleString()}</span>
                          <span className="font-pixel text-[8px] text-purple-600">📖 {entry.dictationScore.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-pixel text-base md:text-lg"
                        style={{ color: isMe ? '#93c5fd' : rs.textColor, textShadow: entry.rank === 1 ? '0 0 10px rgba(253,224,71,0.5)' : 'none' }}>
                        {entry.totalScore.toLocaleString()}
                      </div>
                      <div className="font-pixel text-[8px] text-gray-700">pts</div>
                      {entry.rank > 1 && leaderboard[0] && (
                        <div className="font-pixel text-[8px] text-red-700">
                          -{(leaderboard[0].totalScore - entry.totalScore).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Full rankings table ── */}
        {leaderboard.length > 3 && (
          <div>
            <div className="font-pixel text-[9px] text-gray-700 mb-2 tracking-widest">◆ ALL RANKINGS ◆</div>
            <div style={{ background: '#0d1117', border: '2px solid #1f2937' }}>
              {/* Table header */}
              <div className="grid px-3 py-2 bg-black/40"
                style={{ gridTemplateColumns: '2rem 1fr 4rem 4rem 4rem' }}>
                {['#', 'PLAYER', 'MATH', 'ENG', 'TOTAL'].map(h => (
                  <span key={h} className="font-pixel text-[7px] text-gray-700">{h}</span>
                ))}
              </div>

              {leaderboard.map((entry, i) => {
                const isMe = entry.userId === currentUser?.id;
                return (
                  <div key={entry.userId}
                    className="grid items-center px-3 py-2"
                    style={{
                      gridTemplateColumns: '2rem 1fr 4rem 4rem 4rem',
                      borderTop: '1px solid #1a1f2a',
                      background: isMe ? 'rgba(29,78,216,0.08)' : 'transparent',
                      borderLeft: isMe ? '3px solid #1d4ed8' : '3px solid transparent',
                    }}>
                    <span className="font-pixel text-[10px]"
                      style={{ color: entry.rank <= 3 ? ['#f59e0b','#9ca3af','#d97706'][entry.rank-1] : '#374151' }}>
                      {entry.rank <= 3 ? MEDAL[entry.rank] : entry.rank}
                    </span>
                    <span className="font-pixel text-[9px] truncate pr-1"
                      style={{ color: isMe ? '#93c5fd' : '#9ca3af' }}>
                      {entry.userName}
                      {isMe && <span className="text-blue-500 ml-1">◀</span>}
                    </span>
                    <span className="font-pixel text-[8px] text-emerald-700">{entry.mathScore.toLocaleString()}</span>
                    <span className="font-pixel text-[8px] text-purple-700">{entry.dictationScore.toLocaleString()}</span>
                    <span className="font-pixel text-[8px]" style={{ color: isMe ? '#93c5fd' : '#6b7280' }}>
                      {entry.totalScore.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: '#0a0f14', border: '2px solid #1a1f2a' }}>
          <div className="font-pixel text-[8px] text-gray-700">
            🕐 {data?.timestamp ? new Date(data.timestamp).toLocaleTimeString() : '—'}
          </div>
          <button onClick={() => refetch()}
            className="font-pixel text-[9px] text-amber-400 px-3 py-1.5 transition-all duration-100 active:translate-y-0.5"
            style={{ background: '#1c0e00', border: '2px solid #451a03', borderBottom: '3px solid #2d1200' }}>
            ↻ REFRESH
          </button>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
