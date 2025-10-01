
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { MinecraftSteve, MinecraftBlock } from './MinecraftCharacters';
import { Trophy, Crown, Medal, Star, RefreshCw, User, TrendingUp } from 'lucide-react';

interface GlobalLeaderboardEntry {
  userId: string;
  userName: string;
  mathScore: number;
  dictationScore: number;
  totalScore: number;
  rank: number;
}

interface GlobalLeaderboardData {
  leaderboard: GlobalLeaderboardEntry[];
  total: number;
  timestamp: string;
}

export function RankTab() {
  // Fetch current user info
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Fetch global leaderboard data
  const { data: leaderboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/leaderboard/global'],
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: GlobalLeaderboardData | undefined, isLoading: boolean, refetch: () => void };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return "default" as const;
      case 2:
      case 3:
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-amber-600 bg-gradient-to-r from-emerald-900/90 to-cyan-900/90">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-200" />
              <p className="font-pixel text-amber-200">Loading rankings...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!leaderboardData?.leaderboard?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-amber-600 bg-gradient-to-r from-emerald-900/90 to-cyan-900/90">
            <CardHeader>
              <CardTitle className="font-pixel text-2xl text-amber-200 text-center">
                <Trophy className="inline h-8 w-8 mr-2" />
                Global Rankings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <MinecraftSteve scale={1.5} />
              </div>
              <p className="font-pixel text-amber-200 mb-2">
                No rankings available yet
              </p>
              <p className="text-emerald-300 text-sm mb-4">
                Play some games to see your ranking!
              </p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="font-pixel"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                REFRESH
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-4 border-amber-600 bg-gradient-to-r from-emerald-900/90 to-cyan-900/90 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Decorative blocks */}
          <div className="absolute top-2 left-2 opacity-30 animate-float">
            <MinecraftBlock type="gold" size={8} />
          </div>
          <div className="absolute top-2 right-2 opacity-30 animate-float-delay">
            <MinecraftBlock type="diamond" size={8} />
          </div>
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Trophy className="h-10 w-10 text-yellow-500" />
                <div>
                  <CardTitle className="font-pixel text-3xl text-amber-200 animate-pulse">
                    🏆 Global Rankings 🏆
                  </CardTitle>
                  <p className="text-emerald-300 font-pixel text-sm">
                    All registered students ranked by total score
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
                className="font-pixel"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                REFRESH
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* User's Rank Summary */}
        {currentUser && leaderboardData && (
          <Card className="border-4 border-blue-600 bg-gradient-to-r from-blue-900/90 to-indigo-900/90 shadow-2xl">
            <CardHeader>
              <CardTitle className="font-pixel text-xl text-blue-200 text-center">
                🎯 Your Global Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {(() => {
                const userEntry = leaderboardData.leaderboard.find(entry => entry.userId === currentUser.id);
                if (userEntry) {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-6">
                        <div className="text-center">
                          <p className="text-4xl font-pixel text-blue-200">#{userEntry.rank}</p>
                          <p className="text-sm text-blue-300">Your Rank</p>
                        </div>
                        <div className="text-center">
                          <p className="text-4xl font-pixel text-yellow-200">{userEntry.totalScore}</p>
                          <p className="text-sm text-yellow-300">Total Score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-pixel text-green-200">{userEntry.mathScore}</p>
                          <p className="text-sm text-green-300">Math Score</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-pixel text-purple-200">{userEntry.dictationScore}</p>
                          <p className="text-sm text-purple-300">English Score</p>
                        </div>
                      </div>
                      {userEntry.rank === 1 && (
                        <p className="font-pixel text-yellow-400 animate-pulse">
                          👑 YOU ARE THE CHAMPION! 👑
                        </p>
                      )}
                      {userEntry.rank <= 3 && userEntry.rank > 1 && (
                        <p className="font-pixel text-amber-400">
                          🏆 You're on the podium! Amazing work!
                        </p>
                      )}
                      {userEntry.rank > 3 && (
                        <p className="font-pixel text-blue-300">
                          💪 Keep playing to climb higher!
                        </p>
                      )}
                    </div>
                  );
                } else {
                  return (
                    <div className="space-y-2">
                      <p className="font-pixel text-gray-400">🎮 Not ranked yet</p>
                      <p className="text-sm text-gray-500">Play some games to get on the leaderboard!</p>
                    </div>
                  );
                }
              })()}
            </CardContent>
          </Card>
        )}

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-900/50 to-indigo-900/50">
            <CardContent className="p-4 text-center">
              <User className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-pixel text-blue-200">{leaderboardData.total}</p>
              <p className="text-sm text-blue-300 font-pixel">Total Students</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-500 bg-gradient-to-br from-green-900/50 to-emerald-900/50">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-pixel text-green-200">
                {Math.round(leaderboardData.leaderboard.reduce((sum, s) => sum + s.totalScore, 0) / leaderboardData.leaderboard.length).toLocaleString()}
              </p>
              <p className="text-sm text-green-300 font-pixel">Average Score</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-900/50 to-amber-900/50">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-pixel text-yellow-200">
                {Math.max(...leaderboardData.leaderboard.map(s => s.totalScore)).toLocaleString()}
              </p>
              <p className="text-sm text-yellow-300 font-pixel">Highest Score</p>
            </CardContent>
          </Card>
        </div>

        {/* Rankings List */}
        <Card className="border-4 border-amber-600 bg-gradient-to-b from-stone-900/90 to-slate-900/90 shadow-2xl">
          <CardHeader>
            <CardTitle className="font-pixel text-2xl text-amber-200 text-center">
              🏆 All Students Rankings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {leaderboardData.leaderboard.map((entry, index) => {
                const isCurrentUser = currentUser && entry.userId === currentUser.id;
                return (
                <div
                  key={`${entry.userId}-${entry.rank}`}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 relative
                    ${isCurrentUser
                      ? 'bg-gradient-to-r from-blue-900/70 to-cyan-900/70 border-blue-400 shadow-lg shadow-blue-400/30 ring-2 ring-blue-300 animate-pulse-slow'
                      : entry.rank === 1 
                      ? 'bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-yellow-500 shadow-lg shadow-yellow-500/20' 
                      : entry.rank === 2
                      ? 'bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-gray-400 shadow-md shadow-gray-400/20'
                      : entry.rank === 3
                      ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-gradient-to-r from-stone-800/30 to-slate-800/30 border-stone-600 hover:border-stone-500'
                    }
                  `}
                >
                  {isCurrentUser && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-pixel animate-bounce">
                      YOU
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <Badge 
                        variant={getRankBadgeVariant(entry.rank)}
                        className="font-pixel min-w-[3rem] justify-center"
                      >
                        #{entry.rank}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`
                        transform transition-transform
                        ${entry.rank === 1 ? 'scale-110 animate-bounce-slow' : ''}
                      `}>
                        <MinecraftSteve scale={entry.rank === 1 ? 1.2 : 0.8} />
                      </div>
                      <div>
                        <p className={`
                          font-pixel font-medium
                          ${isCurrentUser
                            ? 'text-blue-200 text-lg'
                            : entry.rank === 1 
                            ? 'text-yellow-200 text-lg' 
                            : entry.rank <= 3 
                            ? 'text-amber-200' 
                            : 'text-stone-200'
                          }
                        `}>
                          {isCurrentUser ? `${entry.userName} (You)` : entry.userName}
                        </p>
                        {entry.rank === 1 && (
                          <p className="text-xs text-yellow-400 font-pixel animate-pulse">
                            👑 CHAMPION 👑
                          </p>
                        )}
                        <div className="flex gap-3 text-xs mt-1">
                          <span className="text-green-400 font-pixel">Math: {entry.mathScore}</span>
                          <span className="text-purple-400 font-pixel">English: {entry.dictationScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`
                      font-pixel font-bold text-lg
                      ${isCurrentUser
                        ? 'text-blue-200'
                        : entry.rank === 1 
                        ? 'text-yellow-200' 
                        : entry.rank <= 3 
                        ? 'text-amber-200' 
                        : 'text-stone-200'
                      }
                    `}>
                      {entry.totalScore.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Score
                    </p>
                    {entry.rank > 1 && leaderboardData.leaderboard[0] && (
                      <p className="text-xs text-red-400 font-pixel">
                        -{(leaderboardData.leaderboard[0].totalScore - entry.totalScore).toLocaleString()} from #1
                      </p>
                    )}
                  </div>
                </div>
              );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-600 p-4 bg-stone-900/50">
              <div className="flex items-center justify-between text-sm text-stone-400">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  <span>
                    Showing {leaderboardData.total} registered students
                  </span>
                </div>
                <span className="font-pixel text-xs">
                  Updated: {new Date(leaderboardData.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
