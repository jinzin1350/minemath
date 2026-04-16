import { useQuery } from '@tanstack/react-query';

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
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const RANK_COLORS: Record<number, { border: string; bg: string; text: string; glow: string }> = {
  1: { border: '#b45309', bg: '#1c0e00', text: '#fcd34d', glow: '0 0 20px rgba(245,158,11,0.4)' },
  2: { border: '#6b7280', bg: '#0f1117', text: '#d1d5db', glow: '0 0 12px rgba(107,114,128,0.3)' },
  3: { border: '#92400e', bg: '#140800', text: '#fbbf24', glow: '0 0 12px rgba(180,83,9,0.25)' },
};

function PixelRobotIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 28" width="24" height="28" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="2" width="16" height="14" fill={color} />
      <rect x="6" y="4" width="12" height="9" fill="#0a0f1a" />
      <rect x="7" y="5" width="4" height="4" fill="#67e8f9" />
      <rect x="13" y="5" width="4" height="4" fill="#67e8f9" />
      <rect x="8" y="10" width="8" height="2" fill="#67e8f9" />
      <rect x="1" y="6" width="3" height="5" fill={color} />
      <rect x="20" y="6" width="3" height="5" fill={color} />
      <rect x="9" y="16" width="6" height="3" fill="#6b7280" />
      <rect x="5" y="19" width="14" height="9" fill={color} />
      <rect x="7" y="20" width="4" height="7" fill="#6b7280" />
      <rect x="13" y="20" width="4" height="7" fill="#6b7280" />
    </svg>
  );
}

export function Leaderboard() {
  const { data: currentUser } = useQuery<{ id: string; firstName: string; lastName: string }>({
    queryKey: ['/api/auth/user'],
  });

  const { data, isLoading, isError, refetch } = useQuery<GlobalLeaderboardData>({
    queryKey: ['/api/leaderboard/global'],
    refetchInterval: 30_000,
  });

  const leaderboard = data?.leaderboard ?? [];
  const currentUserEntry = data?.currentUserEntry ?? null;
  const myEntry = currentUserEntry ?? leaderboard.find(e => e.userId === currentUser?.id) ?? null;

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060b14' }}>
        <div
          className="p-8 text-center"
          style={{ background: '#0d1117', border: '4px solid #f59e0b', boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}
        >
          <div className="text-4xl mb-3 animate-pulse">🏆</div>
          <p className="font-pixel text-amber-300 text-xs animate-pulse tracking-widest">
            LOADING LEADERBOARD...
          </p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060b14' }}>
        <div
          className="p-8 text-center max-w-sm w-full"
          style={{ background: '#0d1117', border: '4px solid #991b1b' }}
        >
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-pixel text-red-300 text-xs mb-4">Failed to load leaderboard</p>
          <button
            onClick={() => refetch()}
            className="font-pixel text-xs text-amber-200 px-4 py-2 transition-all duration-100 active:translate-y-0.5"
            style={{ background: '#451a03', border: '3px solid #b45309', borderBottom: '5px solid #78350f' }}
          >
            ↻ RETRY
          </button>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (!leaderboard.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#060b14' }}>
        <div
          className="p-8 text-center max-w-sm w-full"
          style={{ background: '#0d1117', border: '4px solid #b45309', boxShadow: '0 0 20px rgba(180,83,9,0.2)' }}
        >
          <div className="text-4xl mb-3">🎮</div>
          <p className="font-pixel text-amber-300 text-xs mb-1">NO SCORES YET</p>
          <p className="font-pixel text-gray-500 text-[10px] mb-4">
            Play games to get on the leaderboard!
          </p>
          <button
            onClick={() => refetch()}
            className="font-pixel text-xs text-amber-200 px-4 py-2 transition-all duration-100 active:translate-y-0.5"
            style={{ background: '#451a03', border: '3px solid #b45309', borderBottom: '5px solid #78350f' }}
          >
            ↻ REFRESH
          </button>
        </div>
      </div>
    );
  }

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div
      className="min-h-screen pb-20 md:pb-4"
      style={{ background: '#060b14', imageRendering: 'pixelated' }}
    >
      <div className="max-w-2xl mx-auto p-4 space-y-4">

        {/* ── Title banner ── */}
        <div
          className="text-center py-5 px-4 relative overflow-hidden"
          style={{ background: '#0d1117', border: '4px solid #b45309', boxShadow: '0 0 30px rgba(245,158,11,0.2)' }}
        >
          {/* decorative pixel blocks */}
          <div className="absolute left-3 top-3 flex gap-1 opacity-30">
            {['#ef4444','#f97316','#22c55e'].map((c,i) => (
              <div key={i} className="w-3 h-3 animate-pulse" style={{ background: c, animationDelay: `${i*0.2}s` }} />
            ))}
          </div>
          <div className="absolute right-3 top-3 flex gap-1 opacity-30">
            {['#3b82f6','#a855f7','#f59e0b'].map((c,i) => (
              <div key={i} className="w-3 h-3 animate-pulse" style={{ background: c, animationDelay: `${i*0.15}s` }} />
            ))}
          </div>

          <div className="font-pixel text-2xl md:text-3xl text-amber-300 mb-1">
            🏆 LEADERBOARD
          </div>
          <div className="font-pixel text-[10px] text-gray-500 tracking-widest">
            ALL-TIME CHAMPIONS
          </div>
          <div className="font-pixel text-[9px] text-gray-700 mt-1">
            {data?.total ?? 0} players ranked
          </div>
        </div>

        {/* ── My rank card ── */}
        {myEntry && (
          <div
            className="p-4 relative"
            style={{
              background: '#0a0e1f',
              border: '3px solid #1d4ed8',
              boxShadow: '0 0 20px rgba(29,78,216,0.3)',
            }}
          >
            <div
              className="absolute -top-2 left-4 font-pixel text-[9px] text-blue-300 px-2 py-0.5"
              style={{ background: '#0a0e1f', border: '1px solid #1d4ed8' }}
            >
              YOUR RANK
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="font-pixel text-2xl text-blue-200 w-12 text-center"
                  style={{ textShadow: '0 0 12px rgba(59,130,246,0.6)' }}
                >
                  #{myEntry.rank}
                </div>
                <div>
                  <div className="font-pixel text-sm text-blue-200">{myEntry.userName}</div>
                  <div className="flex gap-3 mt-0.5">
                    <span className="font-pixel text-[9px] text-emerald-400">
                      ⚔️ {myEntry.mathScore.toLocaleString()} math
                    </span>
                    <span className="font-pixel text-[9px] text-purple-400">
                      📖 {myEntry.dictationScore.toLocaleString()} english
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="font-pixel text-lg text-yellow-300"
                  style={{ textShadow: '0 0 10px rgba(253,224,71,0.5)' }}
                >
                  {myEntry.totalScore.toLocaleString()}
                </div>
                <div className="font-pixel text-[9px] text-gray-600">TOTAL PTS</div>
                {myEntry.rank === 1 && (
                  <div className="font-pixel text-[9px] text-amber-400 animate-pulse mt-0.5">
                    👑 CHAMPION
                  </div>
                )}
                {myEntry.rank <= 3 && myEntry.rank > 1 && (
                  <div className="font-pixel text-[9px] text-amber-500 mt-0.5">
                    {MEDAL[myEntry.rank]} PODIUM
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Top 3 podium ── */}
        {top3.length > 0 && (
          <div>
            <div className="font-pixel text-[9px] text-gray-600 mb-2 tracking-widest">
              ◆ TOP PLAYERS ◆
            </div>
            <div className="space-y-2">
              {top3.map(entry => {
                const isMe = entry.userId === currentUser?.id;
                const rc = RANK_COLORS[entry.rank] ?? { border: '#374151', bg: '#080e14', text: '#9ca3af', glow: 'none' };
                return (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between p-4 transition-all"
                    style={{
                      background: isMe ? '#0a0e1f' : rc.bg,
                      border: `3px solid ${isMe ? '#1d4ed8' : rc.border}`,
                      boxShadow: isMe ? '0 0 18px rgba(29,78,216,0.35)' : rc.glow,
                    }}
                  >
                    {/* Rank + avatar */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 text-center">
                        <div className="text-2xl">{MEDAL[entry.rank] ?? `#${entry.rank}`}</div>
                      </div>
                      <PixelRobotIcon color={isMe ? '#3b82f6' : entry.rank === 1 ? '#f59e0b' : entry.rank === 2 ? '#9ca3af' : '#d97706'} />
                      <div>
                        <div
                          className="font-pixel text-xs"
                          style={{ color: isMe ? '#93c5fd' : rc.text }}
                        >
                          {entry.userName}
                          {isMe && <span className="text-blue-400 ml-1">(YOU)</span>}
                        </div>
                        <div className="flex gap-2 mt-0.5">
                          <span className="font-pixel text-[8px] text-emerald-500">
                            ⚔️ {entry.mathScore.toLocaleString()}
                          </span>
                          <span className="font-pixel text-[8px] text-purple-500">
                            📖 {entry.dictationScore.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <div
                        className="font-pixel text-lg"
                        style={{
                          color: isMe ? '#93c5fd' : rc.text,
                          textShadow: entry.rank === 1 ? '0 0 12px rgba(253,224,71,0.6)' : 'none',
                        }}
                      >
                        {entry.totalScore.toLocaleString()}
                      </div>
                      <div className="font-pixel text-[8px] text-gray-600">pts</div>
                      {entry.rank === 1 && (
                        <div className="font-pixel text-[8px] text-amber-400 animate-pulse">
                          👑 #1
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Remaining players ── */}
        {rest.length > 0 && (
          <div>
            <div className="font-pixel text-[9px] text-gray-600 mb-2 tracking-widest">
              ◆ ALL PLAYERS ◆
            </div>
            <div
              style={{ background: '#0d1117', border: '2px solid #1f2937' }}
            >
              {rest.map((entry, idx) => {
                const isMe = entry.userId === currentUser?.id;
                return (
                  <div
                    key={entry.userId}
                    className="flex items-center justify-between px-4 py-3 transition-all"
                    style={{
                      background: isMe ? '#0a0e1f' : 'transparent',
                      borderBottom: idx < rest.length - 1 ? '1px solid #1a1f2a' : 'none',
                      borderLeft: isMe ? '3px solid #1d4ed8' : '3px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="font-pixel text-xs w-8 text-center"
                        style={{ color: isMe ? '#93c5fd' : '#4b5563' }}
                      >
                        #{entry.rank}
                      </div>
                      <div>
                        <div
                          className="font-pixel text-[10px]"
                          style={{ color: isMe ? '#93c5fd' : '#9ca3af' }}
                        >
                          {entry.userName}
                          {isMe && <span className="text-blue-400 ml-1">(YOU)</span>}
                        </div>
                        <div className="flex gap-2 mt-0.5">
                          <span className="font-pixel text-[8px] text-emerald-700">
                            ⚔️ {entry.mathScore.toLocaleString()}
                          </span>
                          <span className="font-pixel text-[8px] text-purple-700">
                            📖 {entry.dictationScore.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="font-pixel text-xs"
                      style={{ color: isMe ? '#93c5fd' : '#6b7280' }}
                    >
                      {entry.totalScore.toLocaleString()}
                      <span className="text-[8px] text-gray-700 ml-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Footer / refresh ── */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: '#0a0f14', border: '2px solid #1a1f2a' }}
        >
          <div className="font-pixel text-[9px] text-gray-700">
            🌙 Updates every 30 seconds
          </div>
          <button
            onClick={() => refetch()}
            className="font-pixel text-[9px] text-amber-400 px-3 py-1.5 transition-all duration-100 active:translate-y-0.5"
            style={{ background: '#1c0e00', border: '2px solid #451a03', borderBottom: '3px solid #2d1200' }}
          >
            ↻ REFRESH
          </button>
        </div>

      </div>
    </div>
  );
}
