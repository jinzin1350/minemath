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
  Gamepad2
} from 'lucide-react';
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
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAgeSelector, setShowAgeSelector] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [reportType, setReportType] = useState<'math' | 'dictation'>('math');
  const queryClient = useQueryClient();

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

  // Fetch monthly progress data (Math)
  const { data: monthlyProgress, isLoading: mathLoading } = useQuery({
    queryKey: [`/api/progress/recent?month=${selectedMonth}`],
    enabled: reportType === 'math',
    refetchInterval: 30000,
  }) as { data: MonthlyProgress[] | undefined, isLoading: boolean };

  // Fetch dictation progress report
  const { data: dictationReport, isLoading: dictationLoading, error: dictationError } = useQuery({
    queryKey: [`/api/dictation/progress-report?month=${selectedMonth}`],
    enabled: reportType === 'dictation',
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
        </div>
      );
    }

    if (dictationError) {
      return (
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4 animate-pulse" />
          <p className="font-pixel text-red-400">Error loading dictation report.</p>
          <p className="text-sm text-red-500 mt-2">Please try again later or contact support.</p>
          <pre className="text-xs text-red-600 mt-4 text-left max-w-xl mx-auto">{dictationError.message}</pre>
        </div>
      );
    }

    if (!dictationReport || dictationReport.monthlySummary.totalGames === 0) {
      return (
        <div className="text-center p-8">
          <Volume2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="font-pixel text-gray-400">No dictation data available for this month</p>
          <p className="text-sm text-gray-500 mt-2">Start playing English Dictation to see reports here!</p>
        </div>
      );
    }

    const { monthlySummary, dailyHistory, modeStats } = dictationReport;

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
        {modeStats && modeStats.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5" />
              Performance by Game Mode
            </h3>
            <div className="grid gap-4">
              {enhancedModeStats.map((mode, index) => (
                <div key={index} className={`border rounded-lg p-4 ${mode.totalGames > 0 ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    {getModeIcon(mode.gameMode)}
                    <h4 className="font-semibold text-gray-900">{getModeName(mode.gameMode)}</h4>
                    {mode.totalGames === 0 && (
                      <span className="text-xs bg-gray-300 text-gray-600 px-2 py-1 rounded">No activity yet</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-blue-600">{mode.totalGames}</p>
                      <p className="text-gray-600">Games</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-purple-600">{mode.totalScore}</p>
                      <p className="text-gray-600">Score</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-green-600">{mode.accuracy}%</p>
                      <p className="text-gray-600">Accuracy</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-orange-600">{mode.totalWords}</p>
                      <p className="text-gray-600">Words</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-teal-600">{mode.totalCorrect}</p>
                      <p className="text-gray-600">Correct</p>
                    </div>
                  </div>
                  {mode.totalGames === 0 && (
                    <div className="mt-3 text-center text-sm text-gray-500">
                      Play this mode to see statistics
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

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
      <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
        <div className="max-w-6xl mx-auto">
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
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-4 border-amber-600 bg-gradient-to-r from-emerald-900/90 to-cyan-900/90 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-2 left-2 opacity-30 animate-float">
            <MinecraftBlock type="diamond" size={8} />
          </div>
          <div className="absolute top-2 right-2 opacity-30 animate-float-delay">
            <MinecraftBlock type="grass" size={8} />
          </div>

          <CardHeader className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <FileText className="h-10 w-10 text-amber-200" />
                <div>
                  <CardTitle className="font-pixel text-2xl md:text-3xl text-amber-200 animate-pulse">
                    📊 Parents Monthly Report
                  </CardTitle>
                  <p className="text-emerald-300 font-pixel text-sm">
                    Detailed statistics of your child's math progress
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-2">
                <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="font-pixel px-3 py-2 border-2 border-amber-600 rounded bg-stone-800 text-amber-200"
                />
                <Button 
                  onClick={() => setShowAgeSelector(true)}
                  variant="outline"
                  className="font-pixel border-2 border-blue-600 text-blue-300 hover:bg-blue-600 hover:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Age: {(userInfo as any)?.age || 'Not Set'}
                </Button>
                <Button 
                  onClick={() => setShowLevelSelector(true)}
                  variant="outline"
                  className="font-pixel border-2 border-purple-600 text-purple-300 hover:bg-purple-600 hover:text-white"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Difficulty Level
                </Button>
                <Button 
                  onClick={generateReport}
                  className="font-pixel bg-green-700 hover:bg-green-800 border-2 border-green-900"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content with Tabs */}
        <Tabs value={reportType} onValueChange={(value) => setReportType(value as 'math' | 'dictation')} className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-stone-800 border-2 border-amber-600">
              <TabsTrigger 
                value="math" 
                className="font-pixel data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                🧮 Math Report
              </TabsTrigger>
              <TabsTrigger 
                value="dictation" 
                className="font-pixel data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                🎧 Dictation Report
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="math" className="space-y-6">
            {/* Summary Statistics */}
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