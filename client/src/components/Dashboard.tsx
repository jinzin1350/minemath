import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { MinecraftSteve, MinecraftBlock } from './MinecraftCharacters';
import { AchievementBadge } from './AchievementBadge';
import { RewardSelector } from './RewardSelector';
import { InventoryDisplay } from './InventoryDisplay';
import { DashboardInventoryBoard } from './DashboardInventoryBoard';
import { ScoreStatusBar } from './ScoreStatusBar';
import { AgeSelector } from './AgeSelector';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Trophy, Target, TrendingUp, Diamond, Zap, Heart } from 'lucide-react';

interface DashboardData {
  user: {
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
  recentProgress: Array<{
    date: string;
    pointsEarned: number;
    questionsAnswered: number;
    correctAnswers: number;
  }>;
  totalStats: {
    totalPoints: number;
    totalQuestions: number;
    correctAnswers: number;
    currentStreak: number;
    bestLevel: number;
  };
  achievements?: Array<{
    id: string;
    name: string;
    description: string;
    iconType: string;
    pointsRequired: number;
    unlockedAt: string;
    isNew: boolean;
  }>;
}

interface DashboardProps {
  data?: DashboardData;
  onStartGame?: () => void;
  mockMode?: boolean;
}

// Mock data for demonstration
const mockData: DashboardData = {
  user: {
    firstName: 'Steve',
    lastName: 'Miner',
  },
  recentProgress: [
    { date: '2024-01-15', pointsEarned: 150, questionsAnswered: 25, correctAnswers: 20 },
    { date: '2024-01-14', pointsEarned: 120, questionsAnswered: 20, correctAnswers: 18 },
    { date: '2024-01-13', pointsEarned: 180, questionsAnswered: 30, correctAnswers: 24 },
    { date: '2024-01-12', pointsEarned: 90, questionsAnswered: 15, correctAnswers: 12 },
    { date: '2024-01-11', pointsEarned: 200, questionsAnswered: 35, correctAnswers: 28 },
    { date: '2024-01-10', pointsEarned: 160, questionsAnswered: 28, correctAnswers: 22 },
    { date: '2024-01-09', pointsEarned: 140, questionsAnswered: 22, correctAnswers: 19 },
  ],
  totalStats: {
    totalPoints: 1040,
    totalQuestions: 175,
    correctAnswers: 143,
    currentStreak: 5,
    bestLevel: 4,
  }
};

export function Dashboard({ data = mockData, onStartGame, mockMode = false }: DashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d'>('7d');
  const [achievements, setAchievements] = useState<DashboardData['achievements']>([]);
  const [showAgeSelector, setShowAgeSelector] = useState(false);

  // Fetch real data when not in mock mode
  const { data: userInfo, refetch: refetchUser } = useQuery<{
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    age?: number;
  }>({
    queryKey: ['/api/auth/user'],
    enabled: !mockMode
  });

  // Check if user needs to select age
  useEffect(() => {
    if (!mockMode && userInfo && !userInfo.age) {
      setShowAgeSelector(true);
    }
  }, [userInfo, mockMode]);

  const handleAgeSelected = async (age: number) => {
    try {
      const response = await fetch('/api/auth/user/age', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ age }),
      });

      if (response.ok) {
        setShowAgeSelector(false);
        refetchUser(); // Refresh user data
      } else {
        console.error('Failed to update age');
      }
    } catch (error) {
      console.error('Error updating age:', error);
    }
  };

  const { data: recentProgress, isLoading: progressLoading, refetch: refetchProgress } = useQuery<Array<{
    date: string;
    pointsEarned: number;
    questionsAnswered: number;
    correctAnswers: number;
  }>>({
    queryKey: [`/api/progress/recent?days=${selectedTimeframe === '7d' ? 7 : 30}`],
    enabled: !mockMode,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch achievements if not in mock mode
  const { data: achievementsData, refetch: refetchAchievements } = useQuery({
    queryKey: ['/api/achievements'],
    enabled: !mockMode,
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  useEffect(() => {
    if (achievementsData) {
      setAchievements(achievementsData as DashboardData['achievements']);
    }
  }, [achievementsData]);

  // Calculate total stats from recent progress
  const calculateTotalStats = (progressData: any[]) => {
    if (!progressData || progressData.length === 0) {
      return {
        totalPoints: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        currentStreak: 0,
        bestLevel: 1
      };
    }

    const totals = progressData.reduce((acc, day) => ({
      totalPoints: acc.totalPoints + day.pointsEarned,
      totalQuestions: acc.totalQuestions + day.questionsAnswered,
      correctAnswers: acc.correctAnswers + day.correctAnswers
    }), { totalPoints: 0, totalQuestions: 0, correctAnswers: 0 });

    return {
      ...totals,
      currentStreak: progressData.length, // Simple approximation
      bestLevel: Math.max(1, Math.floor(totals.totalPoints / 200))
    };
  };

  // Use real data if available, otherwise fall back to mock data
  const dashboardData = mockMode || !userInfo || !recentProgress ? data : {
    user: {
      firstName: userInfo.firstName || 'Player',
      lastName: userInfo.lastName || '',
      profileImageUrl: userInfo.profileImageUrl
    },
    recentProgress: recentProgress || [],
    totalStats: calculateTotalStats(recentProgress || [])
  };

  // Show age selector if needed
  if (showAgeSelector) {
    return <AgeSelector onAgeSelected={handleAgeSelected} />;
  }

  const displayName = dashboardData.user.firstName || 'Player';
  const accuracy = dashboardData.totalStats.totalQuestions > 0 
    ? Math.round((dashboardData.totalStats.correctAnswers / dashboardData.totalStats.totalQuestions) * 100)
    : 0;

  // Format data for the chart with timezone-safe English date
  const chartData = (dashboardData.recentProgress || []).map(day => {
    // Parse date string as UTC to avoid timezone shifts
    const date = new Date(`${day.date}T00:00:00Z`);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        timeZone: 'UTC'
      }),
      points: day.pointsEarned || 0,
      accuracy: day.questionsAnswered > 0 
        ? Math.round((day.correctAnswers / day.questionsAnswered) * 100)
        : 0
    };
  }).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Score Status Bar with Finalization Info */}
        <ScoreStatusBar />
        {/* Enhanced Header with Minecraft Style */}
        <Card className="border-4 border-amber-600 bg-gradient-to-r from-emerald-900/90 to-cyan-900/90 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Floating decorative blocks */}
          <div className="absolute top-2 left-2 opacity-30 animate-float">
            <MinecraftBlock type="grass" size={8} />
          </div>
          <div className="absolute top-2 right-2 opacity-30 animate-float-delay">
            <MinecraftBlock type="stone" size={8} />
          </div>
          <div className="absolute bottom-2 left-8 opacity-20 animate-bounce">
            <MinecraftBlock type="dirt" size={6} />
          </div>
          <div className="absolute bottom-2 right-8 opacity-20 animate-pulse">
            <MinecraftBlock type="diamond" size={6} />
          </div>

          <CardHeader className="pb-2 md:pb-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
                <div className="relative animate-bounce-slow">
                  <MinecraftSteve scale={1.0} />
                  {/* Hide sparkle effects on mobile */}
                  <div className="absolute -top-2 -right-2 text-yellow-400 animate-pulse hidden md:block">✨</div>
                  <div className="absolute -bottom-2 -left-2 text-blue-400 animate-bounce hidden md:block">💎</div>
                </div>
                <div>
                  <CardTitle className="font-pixel text-lg md:text-2xl text-amber-200 animate-pulse bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
                    Welcome back, {displayName}!
                  </CardTitle>
                  <p className="text-emerald-300 font-pixel text-xs md:text-sm animate-fade-in">
                    🏹 Ready for math adventure? ⚔️
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-2 md:gap-3 w-full md:w-auto">
                <div className="flex gap-2">
                  <div className="animate-bounce-slow">
                    <InventoryDisplay userPoints={dashboardData.totalStats.totalPoints} />
                  </div>
                  <div className="animate-pulse">
                    <RewardSelector 
                      userPoints={dashboardData.totalStats.totalPoints}
                      onRewardSelected={() => {
                        refetchAchievements(); // Refresh achievements after selection
                      }}
                    />
                  </div>
                  {!mockMode && userInfo?.age && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAgeSelector(true)}
                      className="font-pixel border-2 hover:scale-105 transition-all duration-200 text-xs"
                      title={`Current age: ${userInfo.age}`}
                    >
                      ⚙️ {userInfo.age}y
                    </Button>
                  )}
                </div>
                <Button 
                  onClick={onStartGame}
                  className="font-pixel px-6 md:px-10 py-3 md:py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-2 md:border-4 border-red-900 text-white shadow-2xl hover:scale-110 transition-all duration-300 animate-pulse relative text-sm md:text-base"
                  data-testid="button-start-game"
                >
                  <span className="relative z-10 flex items-center gap-1 md:gap-2">
                    ⚔️ START GAME 🏹
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-ping rounded"></div>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          {/* Today's Points Card */}
          <Card className="border-2 md:border-4 border-blue-600 hover-elevate bg-gradient-to-br from-blue-900/50 to-indigo-900/50 shadow-xl relative overflow-hidden group">
            <CardContent className="p-2 md:p-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <div className="p-1 md:p-3 bg-blue-500/30 rounded-lg border border-blue-400 md:border-2 animate-pulse">
                  <Calendar className="h-4 w-4 md:h-7 md:w-7 text-blue-400 animate-bounce" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-3xl font-pixel text-blue-200 drop-shadow-lg animate-pulse">
                    {(dashboardData.recentProgress || []).find(p => {
                      // Get today's date in user's local timezone (matches backend)
                      const now = new Date();
                      const year = now.getFullYear();
                      const month = String(now.getMonth() + 1).padStart(2, '0');
                      const day = String(now.getDate()).padStart(2, '0');
                      const today = `${year}-${month}-${day}`;
                      return p.date === today;
                    })?.pointsEarned || 0}
                  </p>
                  <p className="text-xs md:text-sm text-blue-300 font-pixel">📅 Today</p>
                  <p className="text-xs text-blue-400 font-pixel">Total: {dashboardData.totalStats.totalPoints}</p>
                </div>
              </div>
              {/* Floating effects - hide on mobile */}
              <div className="absolute top-1 right-1 text-blue-400 animate-bounce hidden md:block">📅</div>
              <div className="absolute bottom-1 left-1 text-cyan-400 animate-pulse hidden md:block">⭐</div>
            </CardContent>
          </Card>

          <Card className="border-2 md:border-4 border-yellow-600 hover-elevate bg-gradient-to-br from-yellow-900/50 to-amber-900/50 shadow-xl relative overflow-hidden group">
            <CardContent className="p-2 md:p-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <div className="p-1 md:p-3 bg-yellow-500/30 rounded-lg border border-yellow-400 md:border-2 animate-pulse">
                  <Trophy className="h-4 w-4 md:h-7 md:w-7 text-yellow-400 animate-bounce" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-3xl font-pixel text-yellow-200 drop-shadow-lg animate-pulse">{dashboardData.totalStats.totalPoints}</p>
                  <p className="text-xs md:text-sm text-yellow-300 font-pixel">🏆 Points</p>
                </div>
              </div>
              {/* Floating sparkles - hide on mobile */}
              <div className="absolute top-1 right-1 text-yellow-400 animate-spin hidden md:block">✨</div>
              <div className="absolute bottom-1 left-1 text-amber-400 animate-ping hidden md:block">⭐</div>
            </CardContent>
          </Card>

          <Card className="border-2 md:border-4 border-green-600 hover-elevate bg-gradient-to-br from-green-900/50 to-emerald-900/50 shadow-xl relative overflow-hidden group">
            <CardContent className="p-2 md:p-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <div className="p-1 md:p-3 bg-green-500/30 rounded-lg border border-green-400 md:border-2 animate-pulse">
                  <Target className="h-4 w-4 md:h-7 md:w-7 text-green-400 animate-bounce" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-3xl font-pixel text-green-200 drop-shadow-lg animate-pulse">{accuracy}%</p>
                  <p className="text-xs md:text-sm text-green-300 font-pixel">🎯 Accuracy</p>
                </div>
              </div>
              {/* Floating target - hide on mobile */}
              <div className="absolute top-1 right-1 text-green-400 animate-bounce hidden md:block">🎯</div>
              <div className="absolute bottom-1 left-1 text-emerald-400 animate-pulse hidden md:block">💚</div>
            </CardContent>
          </Card>

          <Card className="border-2 md:border-4 border-orange-600 hover-elevate bg-gradient-to-br from-orange-900/50 to-red-900/50 shadow-xl relative overflow-hidden group">
            <CardContent className="p-2 md:p-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <div className="p-1 md:p-3 bg-orange-500/30 rounded-lg border border-orange-400 md:border-2 animate-pulse">
                  <TrendingUp className="h-4 w-4 md:h-7 md:w-7 text-orange-400 animate-bounce" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-3xl font-pixel text-orange-200 drop-shadow-lg animate-pulse">{dashboardData.totalStats.currentStreak}</p>
                  <p className="text-xs md:text-sm text-orange-300 font-pixel">🔥 Streak</p>
                </div>
              </div>
              {/* Fire effects - hide on mobile */}
              <div className="absolute top-1 right-1 text-orange-400 animate-bounce hidden md:block">🔥</div>
              <div className="absolute bottom-1 left-1 text-red-400 animate-pulse hidden md:block">⚡</div>
            </CardContent>
          </Card>

          <Card className="border-2 md:border-4 border-purple-600 hover-elevate bg-gradient-to-br from-purple-900/50 to-pink-900/50 shadow-xl relative overflow-hidden group">
            <CardContent className="p-2 md:p-4 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-3">
                <div className="p-1 md:p-3 bg-purple-500/30 rounded-lg border border-purple-400 md:border-2 animate-pulse">
                  <Diamond className="h-4 w-4 md:h-7 md:w-7 text-purple-400 animate-bounce" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-xl md:text-3xl font-pixel text-purple-200 drop-shadow-lg animate-pulse">{dashboardData.totalStats.bestLevel}</p>
                  <p className="text-xs md:text-sm text-purple-300 font-pixel">💎 Level</p>
                </div>
              </div>
              {/* Diamond effects - hide on mobile */}
              <div className="absolute top-1 right-1 text-purple-400 animate-spin hidden md:block">💎</div>
              <div className="absolute bottom-1 left-1 text-pink-400 animate-pulse hidden md:block">👑</div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Progress Chart */}
        <Card className="border-4 border-cyan-600 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 shadow-2xl relative overflow-hidden">
          {/* Floating decorative elements */}
          <div className="absolute top-2 left-4 opacity-20 animate-float">
            <MinecraftBlock type="diamond" size={6} />
          </div>
          <div className="absolute top-2 right-4 opacity-20 animate-bounce">
            <MinecraftBlock type="grass" size={6} />
          </div>

          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="font-pixel text-cyan-200 flex items-center gap-2 animate-pulse">
                📊 7-Day Progress ⚡
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('7d')}
                  className="font-pixel text-xs border-2 hover:scale-105 transition-all duration-200"
                  data-testid="button-7d"
                >
                  ⚡ 7 Days
                </Button>
                <Button
                  variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('30d')}
                  className="font-pixel text-xs border-2 hover:scale-105 transition-all duration-200"
                  data-testid="button-30d"
                >
                  🗓️ 30 Days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-64 p-4 bg-black/20 rounded-lg border-2 border-cyan-700">
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center animate-pulse">
                  <div className="mb-4 relative">
                    <MinecraftSteve scale={0.8} />
                    <div className="absolute -top-2 -right-2 text-yellow-400 animate-bounce">⭐</div>
                  </div>
                  <h3 className="font-pixel text-cyan-300 text-lg mb-2">📊 No Data Yet!</h3>
                  <p className="text-cyan-400 text-sm font-pixel mb-2">
                    🎮 Start playing to see your progress chart!
                  </p>
                  <p className="text-cyan-500 text-xs">
                    Your daily points and accuracy will appear here
                  </p>
                  <div className="mt-4 flex gap-2">
                    <div className="animate-bounce">🎯</div>
                    <div className="animate-pulse">📈</div>
                    <div className="animate-bounce">🏆</div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" stroke="#22d3ee" />
                    <XAxis dataKey="date" className="text-xs font-pixel" stroke="#67e8f9" />
                    <YAxis className="text-xs font-pixel" stroke="#67e8f9" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.9)', 
                        border: '2px solid #06b6d4',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#67e8f9' }}
                      itemStyle={{ color: '#22d3ee' }}
                    />
                    <Bar 
                      dataKey="points" 
                      fill="url(#gradient)" 
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements & Activity with Inventory */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
          {/* Dashboard Inventory Board */}
          <div className="lg:col-span-1">
            <DashboardInventoryBoard userPoints={dashboardData.totalStats.totalPoints} />
          </div>

          <Card className="border-2 border-card-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-pixel text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Achievement Badges ({achievements?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements && achievements.length > 0 ? (
                achievements.slice(0, 3).map((achievement) => (
                  <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    size="sm"
                    showPoints={false}
                  />
                ))
              ) : (
                <div className="text-center py-4">
                  <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Play games to earn achievement badges!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    First badge unlocks at 500 points
                  </p>
                </div>
              )}
              {achievements && achievements.length > 3 && (
                <div className="text-center pt-2">
                  <Badge variant="outline" className="font-pixel text-xs">
                    +{achievements.length - 3} more badges
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-card-border lg:col-span-1">
            <CardHeader>
              <CardTitle className="font-pixel text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(dashboardData.recentProgress || []).slice(0, 5).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-pixel text-sm text-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {day.correctAnswers}/{day.questionsAnswered} correct
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-pixel text-sm text-foreground">{day.pointsEarned} pts</p>
                      <p className="text-xs text-green-400">
                        {Math.round((day.correctAnswers / day.questionsAnswered) * 100)}% accuracy
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}