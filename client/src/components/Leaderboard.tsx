import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { MinecraftSteve, MinecraftBlock } from './MinecraftCharacters';
import { Trophy, Crown, Medal, Star, Calendar, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  pointsEarned: number;
  rank: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  date: string | null;
  total: number;
  message?: string;
}

export function Leaderboard() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Fetch leaderboard data
  const { data: leaderboardData, isLoading, refetch } = useQuery({
    queryKey: ['/api/leaderboard', selectedDate],
    refetchInterval: 30000, // Refresh every 30 seconds
  }) as { data: LeaderboardData | undefined, isLoading: boolean, refetch: () => void };

  // Auto-select latest finalized date if available
  useEffect(() => {
    if (leaderboardData?.date && !selectedDate) {
      setSelectedDate(leaderboardData.date);
    }
  }, [leaderboardData?.date, selectedDate]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" data-testid="icon-rank-1" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" data-testid="icon-rank-2" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" data-testid="icon-rank-3" />;
      default:
        return <Star className="h-5 w-5 text-muted-foreground" data-testid={`icon-rank-${rank}`} />;
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

  const formatDate = (dateString: string) => {
    const date = new Date(`${dateString}T00:00:00Z`);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-4 border-amber-600 bg-gradient-to-r from-emerald-900/90 to-cyan-900/90">
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-200" />
              <p className="font-pixel text-amber-200">Loading leaderboard...</p>
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
                Daily Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <MinecraftSteve scale={1.5} />
              </div>
              <p className="font-pixel text-amber-200 mb-2" data-testid="text-no-scores">
                {leaderboardData?.message || "No finalized scores available yet"}
              </p>
              <p className="text-emerald-300 text-sm">
                Scores are finalized at midnight in your timezone!
              </p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="mt-4 font-pixel"
                data-testid="button-refresh"
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
                    Daily Champions
                  </CardTitle>
                  <p className="text-emerald-300 font-pixel text-sm">
                    🏆 Final scores for {leaderboardData.date ? formatDate(leaderboardData.date) : 'today'} 🏆
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                size="sm"
                className="font-pixel"
                data-testid="button-refresh-header"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                REFRESH
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Leaderboard */}
        <Card className="border-4 border-amber-600 bg-gradient-to-b from-stone-900/90 to-slate-900/90 shadow-2xl">
          <CardContent className="p-0">
            <div className="space-y-2 p-4">
              {leaderboardData.leaderboard.map((entry, index) => (
                <div
                  key={`${entry.userId}-${entry.rank}`}
                  className={`
                    flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200
                    ${entry.rank === 1 
                      ? 'bg-gradient-to-r from-yellow-900/50 to-amber-900/50 border-yellow-500 shadow-lg shadow-yellow-500/20' 
                      : entry.rank === 2
                      ? 'bg-gradient-to-r from-slate-800/50 to-gray-800/50 border-gray-400 shadow-md shadow-gray-400/20'
                      : entry.rank === 3
                      ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-600 shadow-md shadow-amber-600/20'
                      : 'bg-gradient-to-r from-stone-800/30 to-slate-800/30 border-stone-600 hover:border-stone-500'
                    }
                  `}
                  data-testid={`leaderboard-entry-${entry.rank}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getRankIcon(entry.rank)}
                      <Badge 
                        variant={getRankBadgeVariant(entry.rank)}
                        className="font-pixel min-w-[3rem] justify-center"
                        data-testid={`badge-rank-${entry.rank}`}
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
                          ${entry.rank === 1 
                            ? 'text-yellow-200 text-lg' 
                            : entry.rank <= 3 
                            ? 'text-amber-200' 
                            : 'text-stone-200'
                          }
                        `} data-testid={`text-username-${entry.rank}`}>
                          {entry.userName}
                        </p>
                        {entry.rank === 1 && (
                          <p className="text-xs text-yellow-400 font-pixel animate-pulse">
                            👑 CHAMPION 👑
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className={`
                      font-pixel font-bold text-lg
                      ${entry.rank === 1 
                        ? 'text-yellow-200' 
                        : entry.rank <= 3 
                        ? 'text-amber-200' 
                        : 'text-stone-200'
                      }
                    `} data-testid={`text-points-${entry.rank}`}>
                      {entry.pointsEarned.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Final Score
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-stone-600 p-4 bg-stone-900/50">
              <div className="flex items-center justify-between text-sm text-stone-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span data-testid="text-date-info">
                    Showing {leaderboardData.total} finalized scores
                  </span>
                </div>
                <span className="font-pixel text-xs">
                  Scores lock at midnight 🌙
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}