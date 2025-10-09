import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MinecraftSteve, MinecraftBlock } from './MinecraftCharacters';
import { AgeSelector } from './AgeSelector';
import {
  Calendar,
  TrendingUp,
  Target,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  BarChart3,
  FileText,
  Download,
  Printer,
  Settings,
  User,
  Zap,
  Trophy,
  Keyboard,
  MousePointer,
  Volume2,
  Gamepad2,
  LogOut
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface MonthlyProgress {
  date: string;
  pointsEarned: number;
  questionsAnswered: number;
  correctAnswers: number;
  level: number;
}

interface MonthlyStats {
  totalPoints: number;
  totalQuestions: number;
  totalCorrect: number;
  totalIncorrect: number;
  averageAccuracy: number;
  daysPlayed: number;
  currentStreak: number;
  bestLevel: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

// Dictation interfaces
interface DictationDailyHistory {
  date: string;
  totalGames: number;
  totalScore: number;
  totalWords: number;
  totalCorrect: number;
  accuracy: number;
  bestLevel: number;
}

interface DictationModeStats {
  gameMode: string;
  totalGames: number;
  totalScore: number;
  totalWords: number;
  totalCorrect: number;
  accuracy: number;
}

interface DictationMonthlySummary {
  totalGames: number;
  totalScore: number;
  totalWords: number;
  totalCorrect: number;
  accuracy: number;
  bestLevel: number;
  activeDays: number;
}

interface DictationReport {
  month: string;
  dailyHistory: DictationDailyHistory[];
  modeStats: DictationModeStats[];
  monthlySummary: DictationMonthlySummary;
}

export const ParentsReport: React.FC = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAgeSelector, setShowAgeSelector] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [reportType, setReportType] = useState<'math' | 'dictation' | 'leaderboard'>('math');
  const queryClient = useQueryClient();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  // Get user info for current age
  const { data: userInfo } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  // Mutation for updating age
  const updateAgeMutation = useMutation({
    mutationFn: async (age: number) => {
      const response = await fetch('/api/auth/user/age', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ age }),
      });
      if (!response.ok) throw new Error('Failed to update age');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      setShowAgeSelector(false);
    },
  });

  // Mutation for updating name
  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch('/api/auth/user/name', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to update name');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
  });

  // Fetch monthly progress data (Math)
  const { data: monthlyProgress, isLoading: mathLoading } = useQuery({
    queryKey: [`/api/progress/recent?month=${selectedMonth}`],
    enabled: reportType === 'math',
    refetchInterval: 30000,
  }) as { data: MonthlyProgress[] | undefined, isLoading: boolean };

  // Fetch dictation progress report - Always enabled to show combined scores
  const { data: dictationReport, isLoading: dictationLoading, error: dictationError } = useQuery({
    queryKey: [`/api/dictation/progress-report?month=${selectedMonth}`],
    enabled: true, // Always enabled to show combined scores
    retry: 3,
    staleTime: 30000,
  }) as { data: DictationReport | undefined, isLoading: boolean, error: Error | null };

  // Debug dictation data
  useEffect(() => {
    if (reportType === 'dictation') {
      console.log('🔍 Dictation report state:', {
        loading: dictationLoading,
        error: dictationError,
        data: dictationReport,
        selectedMonth
      });
    }
  }, [dictationReport, dictationLoading, dictationError, reportType, selectedMonth]);

  // Fetch dictation weekly data
  const { data: dictationWeekly } = useQuery({
    queryKey: ['/api/dictation/weekly-report'],
    refetchInterval: 30000,
  }) as { data: DictationDailyHistory[] | undefined, isLoading: boolean };

  // Fetch global leaderboard for comparison
  const { data: globalLeaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/leaderboard/global'],
    refetchInterval: 60000, // Refresh every minute
  }) as { data: { leaderboard: Array<{
    userId: string;
    userName: string;
    mathScore: number;
    dictationScore: number;
    totalScore: number;
    rank: number;
  }>; total: number; timestamp: string } | undefined, isLoading: boolean };

  // Calculate comprehensive statistics
  const monthlyStats = useMemo((): MonthlyStats => {
    if (!monthlyProgress || monthlyProgress.length === 0) {
      return {
        totalPoints: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        averageAccuracy: 0,
        daysPlayed: 0,
        currentStreak: 0,
        bestLevel: 1,
        improvementTrend: 'stable'
      };
    }

    const totals = monthlyProgress.reduce((acc, day) => ({
      totalPoints: acc.totalPoints + (day.pointsEarned || 0),
      totalQuestions: acc.totalQuestions + (day.questionsAnswered || 0),
      totalCorrect: acc.totalCorrect + (day.correctAnswers || 0),
    }), { totalPoints: 0, totalQuestions: 0, totalCorrect: 0 });

    const totalIncorrect = totals.totalQuestions - totals.totalCorrect;
    const averageAccuracy = totals.totalQuestions > 0 ? (totals.totalCorrect / totals.totalQuestions) * 100 : 0;
    const bestLevel = Math.max(...monthlyProgress.map(p => p.level || 1));

    // Calculate improvement trend based on first vs last week
    const firstWeek = monthlyProgress.slice(-7);
    const lastWeek = monthlyProgress.slice(0, 7);
    const firstWeekAvg = firstWeek.reduce((sum, day) => sum + (day.correctAnswers / Math.max(day.questionsAnswered, 1)), 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, day) => sum + (day.correctAnswers / Math.max(day.questionsAnswered, 1)), 0) / lastWeek.length;

    let improvementTrend: 'improving' | 'stable' | 'declining' = 'stable';
    if (lastWeekAvg > firstWeekAvg + 0.1) improvementTrend = 'improving';
    else if (lastWeekAvg < firstWeekAvg - 0.1) improvementTrend = 'declining';

    return {
      ...totals,
      totalIncorrect,
      averageAccuracy,
      daysPlayed: monthlyProgress.length,
      currentStreak: monthlyProgress.length, // Simplified
      bestLevel,
      improvementTrend
    };
  }, [monthlyProgress]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!monthlyProgress) return [];

    return monthlyProgress.map(day => {
      const accuracy = day.questionsAnswered > 0 ? (day.correctAnswers / day.questionsAnswered) * 100 : 0;
      return {
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        points: day.pointsEarned,
        accuracy: Math.round(accuracy),
        correct: day.correctAnswers,
        incorrect: day.questionsAnswered - day.correctAnswers,
        level: day.level
      };
    }).reverse();
  }, [monthlyProgress]);

  // Accuracy distribution data for pie chart
  const accuracyDistribution = useMemo(() => {
    if (!monthlyProgress) return [];

    const ranges = { excellent: 0, good: 0, fair: 0, needsWork: 0 };

    monthlyProgress.forEach(day => {
      if (day.questionsAnswered === 0) return;
      const accuracy = (day.correctAnswers / day.questionsAnswered) * 100;

      if (accuracy >= 90) ranges.excellent++;
      else if (accuracy >= 75) ranges.good++;
      else if (accuracy >= 60) ranges.fair++;
      else ranges.needsWork++;
    });

    return [
      { name: 'Excellent (90%+)', value: ranges.excellent, color: '#22c55e' },
      { name: 'Good (75-89%)', value: ranges.good, color: '#3b82f6' },
      { name: 'Fair (60-74%)', value: ranges.fair, color: '#f59e0b' },
      { name: 'Needs Practice (<60%)', value: ranges.needsWork, color: '#ef4444' }
    ];
  }, [monthlyProgress]);

  const generateReport = () => {
    window.print();
  };

  const handleAgeChange = (age: number) => {
    updateAgeMutation.mutate(age);
  };

  // Level Selector Component
  const LevelSelector = ({ onLevelSelected }: { onLevelSelected: (level: number) => void }) => {
    const levels = [
      { level: 1, desc: "3-4 letter words", color: "from-green-900 to-emerald-900", icon: "🌱" },
      { level: 2, desc: "4-5 letter words", color: "from-blue-900 to-cyan-900", icon: "🌿" },
      { level: 3, desc: "5-6 letter words", color: "from-purple-900 to-violet-900", icon: "🌳" },
      { level: 4, desc: "6-7 letter words", color: "from-orange-900 to-red-900", icon: "🏔️" },
      { level: 5, desc: "7+ letter words", color: "from-yellow-900 to-amber-900", icon: "💎" },
    ];

    return (
      <Card className="border-4 border-amber-600 bg-gradient-to-r from-stone-900/90 to-slate-900/90 shadow-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-pixel text-3xl text-amber-200 text-center animate-pulse">
            🎯 Choose Difficulty Level
          </CardTitle>
          <p className="text-center text-emerald-300 font-pixel">
            Select the level that matches your child's ability
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {levels.map((item) => (
              <Card
                key={item.level}
                className={`border-4 border-amber-600 bg-gradient-to-br ${item.color} cursor-pointer hover:scale-105 transform transition-all duration-300 hover:shadow-2xl group`}
                onClick={() => onLevelSelected(item.level)}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3 group-hover:animate-bounce">{item.icon}</div>
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-400 group-hover:animate-spin" />
                  <div className="font-pixel text-xl text-amber-200 mb-2">Level {item.level}</div>
                  <div className="text-sm text-amber-300 font-pixel">{item.desc}</div>
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Badge className="bg-amber-600 text-white font-pixel">Select</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6 text-center">
            <p className="text-amber-300 font-pixel text-sm">
              💡 Start with Level 1 if unsure, you can always change it later!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Dictation Report Component
  const DictationReportSection = () => {
    if (dictationLoading) {
      return (
        <div className="text-center p-8">
          <div className="animate-bounce mb-4">
            <Volume2 className="h-12 w-12 mx-auto text-blue-400" />
          </div>
          <p className="font-pixel text-blue-200">Loading dictation report...</p>
          <div className="mt-4 text-sm text-blue-300">
            Please wait while we gather your English dictation statistics...
          </div>
        </div>
      );
    }

    if (dictationError) {
      return (
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4 animate-pulse" />
          <p className="font-pixel text-red-400">Error loading dictation report</p>
          <p className="text-sm text-red-500 mt-2">
            Unable to load your dictation statistics. This might be because:
          </p>
          <ul className="text-sm text-red-400 mt-2 text-left max-w-md mx-auto">
            <li>• No dictation games have been played yet</li>
            <li>• Database connection issue</li>
            <li>• Server temporarily unavailable</li>
          </ul>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700"
          >
            Refresh Page
          </Button>
        </div>
      );
    }

    if (!dictationReport || !dictationReport.monthlySummary || dictationReport.monthlySummary.totalGames === 0) {
      return (
        <div className="text-center p-8">
          <Volume2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="font-pixel text-gray-400 text-xl mb-2">No Dictation Data Available</p>
          <p className="text-sm text-gray-500 mt-2 mb-4">
            No English dictation games found for {selectedMonth}
          </p>
          <div className="bg-blue-100 p-4 rounded-lg max-w-md mx-auto">
            <h4 className="font-semibold text-blue-800 mb-2">How to get started:</h4>
            <ol className="text-sm text-blue-700 text-left space-y-1">
              <li>1. Go back to Home page</li>
              <li>2. Click "English Dictation"</li>
              <li>3. Play any game mode (Typing, Multiple Choice, or Fill Blanks)</li>
              <li>4. Return here to see your statistics</li>
            </ol>
          </div>
        </div>
      );
    }

    const { monthlySummary, dailyHistory, modeStats } = dictationReport;

    // Debug information
    console.log('📋 Dictation Report Data:', {
      monthlySummary,
      dailyHistoryLength: dailyHistory?.length || 0,
      modeStatsLength: modeStats?.length || 0,
      selectedMonth
    });

    const getModeIcon = (mode: string) => {
      switch (mode) {
        case 'typing':
          return <Keyboard className="h-6 w-6 text-blue-600" />;
        case 'multiple-choice':
          return <MousePointer className="h-6 w-6 text-green-600" />;
        case 'fill-blanks':
          return <Zap className="h-6 w-6 text-purple-600" />;
        default:
          return <Volume2 className="h-6 w-6 text-gray-600" />;
      }
    };

    const getModeName = (mode: string) => {
      switch (mode) {
        case 'typing':
          return 'Typing Mode';
        case 'multiple-choice':
          return 'Multiple Choice';
        case 'fill-blanks':
          return 'Fill the Blank';
        default:
          return mode.charAt(0).toUpperCase() + mode.slice(1);
      }
    };

    // Create placeholder data for modes with no activity
    const allModes = ['typing', 'multiple-choice', 'fill-blanks'];
    const enhancedModeStats = allModes.map(mode => {
      const existingMode = modeStats.find((m: DictationModeStats) => m.gameMode === mode);
      if (existingMode) {
        console.log(`📊 Found existing mode data for '${mode}':`, existingMode);
      } else {
        console.log(`⚪ No data found for mode '${mode}', creating placeholder`);
      }
      return existingMode || {
        gameMode: mode,
        totalGames: 0,
        totalScore: 0,
        totalWords: 0,
        totalCorrect: 0,
        accuracy: 0,
      };
    });

    return (
      <div className="space-y-6">
        {/* Overall Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-3">
              <Volume2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{monthlySummary.totalWords}</p>
                <p className="text-sm text-blue-700">Total Words</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-900">{monthlySummary.accuracy}%</p>
                <p className="text-sm text-green-700">Accuracy</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-purple-900">{monthlySummary.totalScore}</p>
                <p className="text-sm text-purple-700">Total Score</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-900">{monthlySummary.activeDays}</p>
                <p className="text-sm text-orange-700">Active Days</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance by Game Mode */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Performance by Game Mode
          </h3>
          <div className="grid gap-4">
            {enhancedModeStats.map((mode, index) => {
              const hasActivity = mode.totalGames > 0;
              return (
                <div
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-all duration-200 ${
                    hasActivity
                      ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300 hover:shadow-md'
                      : 'bg-gray-50 border-gray-300 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getModeIcon(mode.gameMode)}
                      <h4 className="font-semibold text-gray-900">{getModeName(mode.gameMode)}</h4>
                    </div>
                    {hasActivity ? (
                      <Badge className="bg-green-600 text-white">
                        {mode.totalGames} game{mode.totalGames !== 1 ? 's' : ''}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        No activity yet
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="font-bold text-blue-600 text-lg">{mode.totalGames}</p>
                      <p className="text-gray-600">Games</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="font-bold text-purple-600 text-lg">{mode.totalScore}</p>
                      <p className="text-gray-600">Score</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="font-bold text-green-600 text-lg">{mode.accuracy}%</p>
                      <p className="text-gray-600">Accuracy</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="font-bold text-orange-600 text-lg">{mode.totalWords}</p>
                      <p className="text-gray-600">Words</p>
                    </div>
                    <div className="text-center p-2 bg-white rounded border">
                      <p className="font-bold text-teal-600 text-lg">{mode.totalCorrect}</p>
                      <p className="text-gray-600">Correct</p>
                    </div>
                  </div>

                  {!hasActivity && (
                    <div className="mt-3 text-center p-3 bg-gray-100 rounded">
                      <p className="text-sm text-gray-600 mb-2">Play this mode to see statistics</p>
                      <p className="text-xs text-gray-500">
                        Go to English Dictation → Select {getModeName(mode.gameMode)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Note */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip:</strong> Try different game modes to improve various English skills.
              Typing mode helps with spelling, Multiple Choice with recognition, and Fill Blanks with letter patterns.
            </p>
          </div>
        </Card>

        {/* Performance Chart */}
        {dailyHistory.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Performance
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyHistory.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(value) => new Date(value as string).toLocaleDateString()}
                  formatter={(value: any, name: string) => [
                    name === 'accuracy' ? `${value}%` : value,
                    name === 'accuracy' ? 'Accuracy' : name === 'totalScore' ? 'Score' : 'Words'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="totalScore"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    );
  };

  if (mathLoading) {
    return (
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="bg-card border-b border-card-border sticky top-0 z-50 shadow-md">
          <div className="max-w-6xl mx-auto px-2 md:px-4 py-1 md:py-2">
            {/* Mobile Layout */}
            <div className="md:hidden">
              <div className="flex items-center justify-between mb-1">
                <h1 className="font-pixel text-xs text-foreground">⛏️ MINECRAFT MATH</h1>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="font-pixel text-xs px-2 py-1 h-6"
                >
                  <LogOut className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-1 w-full">
                <Link href="/" className="flex-1">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                    <BarChart3 className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href="/" className="flex-1">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                    <Gamepad2 className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href="/english-dictation" className="flex-1">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </Link>
                <Link href="/rank" className="flex-1">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                    <Trophy className="h-3 w-3" />
                  </Button>
                </Link>
                <Button variant="default" size="sm" className="font-pixel text-xs flex-1 px-1 py-1 h-7">
                  <FileText className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:flex md:flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-4">
                <h1 className="font-pixel text-xl text-foreground">MINECRAFT MATH</h1>
                <div className="flex gap-2">
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="font-pixel text-xs">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      DASHBOARD
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" size="sm" className="font-pixel text-xs">
                      <Gamepad2 className="h-4 w-4 mr-1" />
                      PLAY
                    </Button>
                  </Link>
                  <Link href="/english-dictation">
                    <Button variant="ghost" size="sm" className="font-pixel text-xs">
                      <Volume2 className="h-4 w-4 mr-1" />
                      ENGLISH
                    </Button>
                  </Link>
                  <Link href="/rank">
                    <Button variant="ghost" size="sm" className="font-pixel text-xs">
                      <Trophy className="h-4 w-4 mr-1" />
                      LEADERBOARD
                    </Button>
                  </Link>
                  <Button variant="default" size="sm" className="font-pixel text-xs">
                    <FileText className="h-4 w-4 mr-1" />
                    REPORT
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Welcome, {(user as any)?.firstName || (user as any)?.name || 'Player'}!
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="font-pixel text-xs"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  LOGOUT
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-6xl mx-auto p-4">
          <Card className="border-4 border-amber-600 bg-gradient-to-r from-emerald-900/90 to-cyan-900/90">
            <CardContent className="p-8 text-center">
              <div className="animate-bounce mb-4">
                <FileText className="h-12 w-12 mx-auto text-amber-200" />
              </div>
              <p className="font-pixel text-amber-200">Loading report...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-card border-b border-card-border sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-2 md:px-4 py-1 md:py-2">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-pixel text-xs text-foreground">⛏️ MINECRAFT MATH</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-pixel text-xs px-2 py-1 h-6"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex gap-1 w-full">
              <Link href="/" className="flex-1">
                <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                  <BarChart3 className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                  <Gamepad2 className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/english-dictation" className="flex-1">
                <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                  <Volume2 className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/rank" className="flex-1">
                <Button variant="ghost" size="sm" className="font-pixel text-xs w-full px-1 py-1 h-7">
                  <Trophy className="h-3 w-3" />
                </Button>
              </Link>
              <Button variant="default" size="sm" className="font-pixel text-xs flex-1 px-1 py-1 h-7">
                <FileText className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex md:flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
              <h1 className="font-pixel text-xl text-foreground">MINECRAFT MATH</h1>
              <div className="flex gap-2">
                <Link href="/">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    DASHBOARD
                  </Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs">
                    <Gamepad2 className="h-4 w-4 mr-1" />
                    PLAY
                  </Button>
                </Link>
                <Link href="/english-dictation">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs">
                    <Volume2 className="h-4 w-4 mr-1" />
                    ENGLISH
                  </Button>
                </Link>
                <Link href="/rank">
                  <Button variant="ghost" size="sm" className="font-pixel text-xs">
                    <Trophy className="h-4 w-4 mr-1" />
                    LEADERBOARD
                  </Button>
                </Link>
                <Button variant="default" size="sm" className="font-pixel text-xs">
                  <FileText className="h-4 w-4 mr-1" />
                  REPORT
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {(user as any)?.firstName || (user as any)?.name || 'Player'}!
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-pixel text-xs"
              >
                <LogOut className="h-4 w-4 mr-1" />
                LOGOUT
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto space-y-3 md:space-y-6 p-2 md:p-4">
        {/* Header */}
        <Card className="border-2 md:border-4 border-card-border bg-card shadow-md md:shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-2 left-2 opacity-30 animate-float hidden md:block">
            <MinecraftBlock type="diamond" size={8} />
          </div>
          <div className="absolute top-2 right-2 opacity-30 animate-float-delay hidden md:block">
            <MinecraftBlock type="grass" size={8} />
          </div>

          <CardHeader className="relative z-10 p-3 md:p-6">
            <div className="flex flex-col items-start md:items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2 md:gap-4 w-full">
                <FileText className="h-6 w-6 md:h-10 md:w-10 text-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <CardTitle className="font-pixel text-sm md:text-3xl text-foreground">
                    📊 Report
                  </CardTitle>
                  <p className="text-muted-foreground font-pixel text-xs md:text-sm hidden md:block">
                    Detailed statistics of your learning progress
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="font-pixel px-2 py-1 md:px-3 md:py-2 text-xs md:text-sm border-2 border-card-border rounded bg-card text-foreground flex-shrink-0"
                />

                <Button
                  onClick={() => setShowAgeSelector(true)}
                  variant="outline"
                  size="sm"
                  className="font-pixel text-xs border-2"
                >
                  <User className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden md:inline">Age: {(userInfo as any)?.age || '?'}</span>
                  <span className="md:hidden">{(userInfo as any)?.age || '?'}</span>
                </Button>
                <Button
                  onClick={generateReport}
                  variant="outline"
                  size="sm"
                  className="font-pixel text-xs border-2"
                >
                  <Printer className="h-3 w-3 md:h-4 md:w-4 md:mr-2" />
                  <span className="hidden md:inline">Print</span>
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs value={reportType} onValueChange={(value) => setReportType(value as 'math' | 'dictation' | 'leaderboard')} className="w-full">
          <div className="flex justify-center mb-3 md:mb-6">
            <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-card border-2 border-card-border p-1">
              <TabsTrigger
                value="math"
                className="font-pixel text-xs md:text-sm data-[state=active]:bg-amber-600 data-[state=active]:text-white px-1 md:px-3 py-1 md:py-2"
              >
                <span className="md:hidden">🧮</span>
                <span className="hidden md:inline">🧮 Math</span>
              </TabsTrigger>
              <TabsTrigger
                value="dictation"
                className="font-pixel text-xs md:text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white px-1 md:px-3 py-1 md:py-2"
              >
                <span className="md:hidden">🎧</span>
                <span className="hidden md:inline">🎧 English</span>
              </TabsTrigger>
              <TabsTrigger
                value="leaderboard"
                className="font-pixel text-xs md:text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white px-1 md:px-3 py-1 md:py-2"
              >
                <span className="md:hidden">🏆</span>
                <span className="hidden md:inline">🏆 Rank</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="math" className="space-y-6">
            {/* Combined Summary Statistics */}
            <div className="mb-6">
              <Card className="border-4 border-amber-600 bg-gradient-to-r from-amber-900/50 to-yellow-900/50">
                <CardHeader>
                  <CardTitle className="font-pixel text-amber-200 text-center flex items-center justify-center gap-2">
                    <Trophy className="h-6 w-6" />
                    📊 Combined Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 border-blue-600 bg-gradient-to-br from-blue-900/50 to-indigo-900/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Award className="h-6 w-6 text-blue-400" />
                          <span className="text-lg font-pixel text-blue-300">🧮 MATH</span>
                        </div>
                        <p className="text-3xl font-pixel text-blue-200">{monthlyStats.totalPoints}</p>
                        <p className="text-sm text-blue-300 font-pixel">Total Math Score</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-green-600 bg-gradient-to-br from-green-900/50 to-emerald-900/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Volume2 className="h-6 w-6 text-green-400" />
                          <span className="text-lg font-pixel text-green-300">🎧 ENGLISH</span>
                        </div>
                        <p className="text-3xl font-pixel text-green-200">
                          {dictationReport?.monthlySummary?.totalScore || 0}
                        </p>
                        <p className="text-sm text-green-300 font-pixel">Total English Score</p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-purple-600 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Trophy className="h-6 w-6 text-purple-400" />
                          <span className="text-lg font-pixel text-purple-300">🏆 TOTAL</span>
                        </div>
                        <p className="text-4xl font-pixel text-purple-200 font-bold">
                          {monthlyStats.totalPoints + (dictationReport?.monthlySummary?.totalScore || 0)}
                        </p>
                        <p className="text-sm text-purple-300 font-pixel">Combined Score</p>
                        <div className="mt-2 text-xs text-purple-400">
                          Math: {monthlyStats.totalPoints} + English: {dictationReport?.monthlySummary?.totalScore || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Individual Subject Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-2 border-blue-600 bg-gradient-to-br from-blue-900/50 to-indigo-900/50">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-pixel text-blue-200">{monthlyStats.totalPoints}</p>
                  <p className="text-sm text-blue-300 font-pixel">Total Points</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-600 bg-gradient-to-br from-green-900/50 to-emerald-900/50">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-pixel text-green-200">{Math.round(monthlyStats.averageAccuracy)}%</p>
                  <p className="text-sm text-green-300 font-pixel">Average Accuracy</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-600 bg-gradient-to-br from-yellow-900/50 to-amber-900/50">
                <CardContent className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                  <p className="text-2xl font-pixel text-yellow-200">{monthlyStats.totalQuestions}</p>
                  <p className="text-sm text-yellow-300 font-pixel">Total Questions</p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-600 bg-gradient-to-br from-purple-900/50 to-pink-900/50">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-pixel text-purple-200">{monthlyStats.daysPlayed}</p>
                  <p className="text-sm text-purple-300 font-pixel">Days Played</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Progress Chart */}
              <Card className="border-4 border-cyan-600 bg-gradient-to-br from-cyan-900/30 to-blue-900/30">
                <CardHeader>
                  <CardTitle className="font-pixel text-cyan-200 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6" />
                    Daily Progress Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="date" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(0, 0, 0, 0.9)',
                              border: '1px solid #06b6d4',
                              borderRadius: '4px'
                            }}
                          />
                          <Area type="monotone" dataKey="points" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-cyan-400 font-pixel">No data available for display yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Accuracy Distribution */}
              <Card className="border-4 border-emerald-600 bg-gradient-to-br from-emerald-900/30 to-green-900/30">
                <CardHeader>
                  <CardTitle className="font-pixel text-emerald-200 flex items-center gap-2">
                    <Target className="h-6 w-6" />
                    Answer Accuracy Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {accuracyDistribution.length > 0 && accuracyDistribution.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={accuracyDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={(entry) => `${entry.name}: ${entry.value}`}
                          >
                            {accuracyDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-emerald-400 font-pixel">No data available for display yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Statistics */}
            <Card className="border-4 border-stone-600 bg-gradient-to-br from-stone-900/50 to-slate-900/50">
              <CardHeader>
                <CardTitle className="font-pixel text-stone-200 flex items-center gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Detailed Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Accuracy Stats */}
                  <div className="space-y-4">
                    <h3 className="font-pixel text-lg text-green-300 border-b border-green-600 pb-2">📊 Accuracy Stats</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-green-200">Correct Answers:</span>
                        <Badge variant="default" className="bg-green-700">{monthlyStats.totalCorrect}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-200">Wrong Answers:</span>
                        <Badge variant="destructive">{monthlyStats.totalIncorrect}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">Average Accuracy:</span>
                        <Badge variant="secondary">{Math.round(monthlyStats.averageAccuracy)}%</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Performance Indicators */}
                  <div className="space-y-4">
                    <h3 className="font-pixel text-lg text-yellow-300 border-b border-yellow-600 pb-2">🎯 Performance Indicators</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-yellow-200">Highest Level:</span>
                        <Badge variant="outline" className="border-yellow-500">{monthlyStats.bestLevel}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-200">Active Days:</span>
                        <Badge variant="secondary">{monthlyStats.daysPlayed}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-purple-200">Progress Trend:</span>
                        <Badge
                          variant={monthlyStats.improvementTrend === 'improving' ? 'default' :
                                  monthlyStats.improvementTrend === 'stable' ? 'secondary' : 'destructive'}
                        >
                          {monthlyStats.improvementTrend === 'improving' ? '📈 Improving' :
                           monthlyStats.improvementTrend === 'stable' ? '➡️ Stable' : '📉 Needs Attention'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h3 className="font-pixel text-lg text-purple-300 border-b border-purple-600 pb-2">💡 Recommendations</h3>
                    <div className="space-y-3">
                      {monthlyStats.averageAccuracy >= 85 ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                          <p className="text-sm text-green-200">Excellent performance! Keep it up.</p>
                        </div>
                      ) : monthlyStats.averageAccuracy >= 70 ? (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
                          <p className="text-sm text-yellow-200">Good performance, but can be improved.</p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                          <p className="text-sm text-red-200">Needs more practice.</p>
                        </div>
                      )}

                      {monthlyStats.daysPlayed < 15 && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-5 w-5 text-blue-400 mt-0.5" />
                          <p className="text-sm text-blue-200">More regular practice is recommended.</p>
                        </div>
                      )}

                      {monthlyStats.improvementTrend === 'declining' && (
                        <div className="flex items-start gap-2">
                          <TrendingUp className="h-5 w-5 text-orange-400 mt-0.5" />
                          <p className="text-sm text-orange-200">Consider reviewing learning methods.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Performance Table */}
            <Card className="border-4 border-slate-600 bg-gradient-to-br from-slate-900/90 to-gray-900/90 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-gray-800 border-b border-slate-600">
                <CardTitle className="font-pixel text-slate-200 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-blue-400" />
                  Daily Performance Table
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-gray-800 border-b-2 border-slate-600">
                        <th className="text-left p-4 font-pixel text-slate-100 border-r border-slate-700">Date</th>
                        <th className="text-left p-4 font-pixel text-blue-300 border-r border-slate-700">Points</th>
                        <th className="text-left p-4 font-pixel text-purple-300 border-r border-slate-700">Questions</th>
                        <th className="text-left p-4 font-pixel text-green-300 border-r border-slate-700">Correct</th>
                        <th className="text-left p-4 font-pixel text-red-300 border-r border-slate-700">Wrong</th>
                        <th className="text-left p-4 font-pixel text-yellow-300 border-r border-slate-700">Accuracy</th>
                        <th className="text-left p-4 font-pixel text-orange-300">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartData.slice(0, 10).map((day, index) => (
                        <tr
                          key={index}
                          className={`border-b border-slate-700 hover:bg-slate-800/50 transition-colors duration-200 ${
                            index % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-800/30'
                          }`}
                        >
                          <td className="p-4 text-slate-200 font-medium border-r border-slate-700/50">{day.date}</td>
                          <td className="p-4 text-blue-400 font-pixel font-bold border-r border-slate-700/50">{day.points}</td>
                          <td className="p-4 text-purple-400 font-medium border-r border-slate-700/50">{day.correct + day.incorrect}</td>
                          <td className="p-4 text-green-400 font-bold border-r border-slate-700/50">{day.correct}</td>
                          <td className="p-4 text-red-400 font-bold border-r border-slate-700/50">{day.incorrect}</td>
                          <td className="p-4 border-r border-slate-700/50">
                            <Badge
                              variant={day.accuracy >= 85 ? 'default' : day.accuracy >= 70 ? 'secondary' : 'destructive'}
                              className={`font-pixel font-bold ${
                                day.accuracy >= 85 ? 'bg-green-600 text-white border-green-500' :
                                day.accuracy >= 70 ? 'bg-yellow-600 text-white border-yellow-500' :
                                'bg-red-600 text-white border-red-500'
                              }`}
                            >
                              {day.accuracy}%
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className="font-pixel text-orange-300 border-orange-500 bg-orange-900/30"
                            >
                              Level {day.level}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Table Footer with Summary */}
                  <div className="bg-gradient-to-r from-slate-800 to-gray-800 border-t-2 border-slate-600 p-4">
                    <div className="flex flex-wrap gap-4 justify-center text-sm font-pixel">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded"></div>
                        <span className="text-green-300">Excellent (85%+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                        <span className="text-yellow-300">Good (70-84%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded"></div>
                        <span className="text-red-300">Needs Practice (&lt;70%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dictation" className="space-y-6">
            <DictationReportSection />
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            {/* Global Leaderboard Section */}
            <Card className="border-4 border-purple-600 bg-gradient-to-br from-purple-900/30 to-pink-900/30 shadow-2xl">
              <CardHeader>
                <CardTitle className="font-pixel text-purple-200 text-center flex items-center justify-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-400" />
                  🏆 Global Student Rankings
                </CardTitle>
                <p className="text-center text-purple-300 font-pixel text-sm">
                  See how {(userInfo as any)?.name || 'your child'} compares to other students
                </p>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-bounce mb-4">
                      <Trophy className="h-12 w-12 mx-auto text-purple-400" />
                    </div>
                    <p className="font-pixel text-purple-200">Loading global rankings...</p>
                  </div>
                ) : globalLeaderboard && globalLeaderboard.leaderboard.length > 0 ? (
                  <div className="space-y-4">
                    {/* Current User's Position */}
                    {(() => {
                      const userEntry = globalLeaderboard.leaderboard.find(entry => entry.userId === (userInfo as any)?.id);
                      
                      if (userEntry) {
                        return (
                          <Card className="border-4 border-yellow-500 bg-gradient-to-r from-yellow-900/50 to-amber-900/50 shadow-xl">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="text-center">
                                    <div className="text-4xl font-pixel text-yellow-200">#{userEntry.rank}</div>
                                    <div className="text-sm text-yellow-300 font-pixel">Your Rank</div>
                                  </div>
                                  <div>
                                    <div className="font-pixel text-xl text-yellow-200">{userEntry.userName}</div>
                                    <div className="text-sm text-yellow-300">
                                      Math: {userEntry.mathScore} + English: {userEntry.dictationScore}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-3xl font-pixel text-yellow-200">{userEntry.totalScore}</div>
                                  <div className="text-sm text-yellow-300 font-pixel">Total Score</div>
                                </div>
                              </div>
                              {userEntry.rank === 1 && (
                                <div className="mt-3 text-center">
                                  <p className="font-pixel text-yellow-400 animate-pulse">
                                    👑 CHAMPION! TOP STUDENT! 👑
                                  </p>
                                </div>
                              )}
                              {userEntry.rank <= 3 && userEntry.rank > 1 && (
                                <div className="mt-3 text-center">
                                  <p className="font-pixel text-amber-400">
                                    🥉 Excellent! Top 3 student!
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      }
                      return null;
                    })()}

                    {/* Top 10 Leaderboard */}
                    <Card className="border-2 border-purple-400">
                      <CardHeader>
                        <CardTitle className="font-pixel text-purple-200 text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5" />
                          Top 10 Students
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gradient-to-r from-purple-800 to-pink-800 border-b-2 border-purple-600">
                                <th className="text-left p-4 font-pixel text-purple-100">Rank</th>
                                <th className="text-left p-4 font-pixel text-purple-100">Student Name</th>
                                <th className="text-left p-4 font-pixel text-blue-300">Math Score</th>
                                <th className="text-left p-4 font-pixel text-green-300">English Score</th>
                                <th className="text-left p-4 font-pixel text-yellow-300">Total Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {globalLeaderboard.leaderboard.slice(0, 10).map((student, index) => {
                                const isCurrentUser = student.userId === (userInfo as any)?.id;
                                
                                return (
                                  <tr
                                    key={student.userId}
                                    className={`border-b border-purple-700 transition-colors duration-200 ${
                                      isCurrentUser 
                                        ? 'bg-yellow-900/50 border-yellow-500' 
                                        : index % 2 === 0 
                                          ? 'bg-purple-900/30' 
                                          : 'bg-purple-800/30'
                                    } hover:bg-purple-700/50`}
                                  >
                                    <td className="p-4">
                                      <div className="flex items-center gap-2">
                                        {student.rank === 1 && <span className="text-2xl">👑</span>}
                                        {student.rank === 2 && <span className="text-2xl">🥈</span>}
                                        {student.rank === 3 && <span className="text-2xl">🥉</span>}
                                        <span className={`font-pixel font-bold ${
                                          student.rank <= 3 ? 'text-yellow-300' : 'text-purple-200'
                                        }`}>
                                          #{student.rank}
                                        </span>
                                      </div>
                                    </td>
                                    <td className={`p-4 font-medium ${
                                      isCurrentUser ? 'text-yellow-200 font-pixel' : 'text-purple-200'
                                    }`}>
                                      {student.userName}
                                      {isCurrentUser && (
                                        <Badge className="ml-2 bg-yellow-600 text-white font-pixel text-xs">
                                          YOU
                                        </Badge>
                                      )}
                                    </td>
                                    <td className="p-4 text-blue-400 font-pixel font-bold">
                                      {student.mathScore.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-green-400 font-pixel font-bold">
                                      {student.dictationScore.toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                      <Badge
                                        className={`font-pixel font-bold ${
                                          student.rank === 1 ? 'bg-yellow-600 text-white border-yellow-500' :
                                          student.rank <= 3 ? 'bg-orange-600 text-white border-orange-500' :
                                          'bg-purple-600 text-white border-purple-500'
                                        }`}
                                      >
                                        {student.totalScore.toLocaleString()}
                                      </Badge>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-2 border-blue-500 bg-gradient-to-br from-blue-900/50 to-indigo-900/50">
                        <CardContent className="p-4 text-center">
                          <User className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-2xl font-pixel text-blue-200">{globalLeaderboard.total}</p>
                          <p className="text-sm text-blue-300 font-pixel">Total Students</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-green-500 bg-gradient-to-br from-green-900/50 to-emerald-900/50">
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-2" />
                          <p className="text-2xl font-pixel text-green-200">
                            {Math.round(globalLeaderboard.leaderboard.reduce((sum, s) => sum + s.totalScore, 0) / globalLeaderboard.leaderboard.length).toLocaleString()}
                          </p>
                          <p className="text-sm text-green-300 font-pixel">Average Score</p>
                        </CardContent>
                      </Card>

                      <Card className="border-2 border-yellow-500 bg-gradient-to-br from-yellow-900/50 to-amber-900/50">
                        <CardContent className="p-4 text-center">
                          <Trophy className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                          <p className="text-2xl font-pixel text-yellow-200">
                            {globalLeaderboard.leaderboard[0]?.totalScore.toLocaleString() || 0}
                          </p>
                          <p className="text-sm text-yellow-300 font-pixel">Highest Score</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="text-center text-xs text-purple-400 font-pixel">
                      Last updated: {new Date(globalLeaderboard.timestamp).toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="font-pixel text-gray-400 text-xl mb-2">No Rankings Available</p>
                    <p className="text-sm text-gray-500">No students have scores to display yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Age Selector Modal */}
      {showAgeSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowAgeSelector(false)} />
          <div className="relative z-10 max-w-4xl w-full">
            <AgeSelector
              currentAge={(userInfo as any)?.age}
              onAgeSelected={handleAgeChange}
            />
            <Button
              onClick={() => setShowAgeSelector(false)}
              variant="outline"
              className="absolute top-4 right-4 font-pixel bg-red-600 hover:bg-red-700 text-white border-red-800"
            >
              ✕ Close
            </Button>
          </div>
        </div>
      )}

      {/* Level Selector Modal */}
      {showLevelSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80" onClick={() => setShowLevelSelector(false)} />
          <div className="relative z-10 max-w-6xl w-full">
            <LevelSelector
              onLevelSelected={(level) => {
                console.log('Selected level:', level);
                setShowLevelSelector(false);
                // اینجا می‌تونید level رو ذخیره کنید یا به کامپوننت دیگه ارسال کنید
              }}
            />
            <Button
              onClick={() => setShowLevelSelector(false)}
              variant="outline"
              className="absolute top-4 right-4 font-pixel bg-red-600 hover:bg-red-700 text-white border-red-800"
            >
              ✕ Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}