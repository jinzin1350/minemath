
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { MinecraftSteve, MinecraftBlock } from './MinecraftCharacters';
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
  Printer
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

export function ParentsReport() {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Fetch monthly progress data
  const { data: monthlyProgress, isLoading } = useQuery({
    queryKey: [`/api/progress/recent?month=${selectedMonth}`],
    refetchInterval: 30000,
  }) as { data: MonthlyProgress[] | undefined, isLoading: boolean };

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

  if (isLoading) {
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
            <MinecraftBlock type="emerald" size={8} />
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
        <Card className="border-4 border-amber-600 bg-gradient-to-br from-amber-900/30 to-orange-900/30">
          <CardHeader>
            <CardTitle className="font-pixel text-amber-200 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Daily Performance Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-600">
                    <th className="text-left p-3 font-pixel text-amber-200">Date</th>
                    <th className="text-left p-3 font-pixel text-amber-200">Points</th>
                    <th className="text-left p-3 font-pixel text-amber-200">Questions</th>
                    <th className="text-left p-3 font-pixel text-amber-200">Correct</th>
                    <th className="text-left p-3 font-pixel text-amber-200">Wrong</th>
                    <th className="text-left p-3 font-pixel text-amber-200">Accuracy</th>
                    <th className="text-left p-3 font-pixel text-amber-200">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.slice(0, 10).map((day, index) => (
                    <tr key={index} className="border-b border-amber-800/30 hover:bg-amber-900/20">
                      <td className="p-3 text-amber-100">{day.date}</td>
                      <td className="p-3 text-blue-300 font-pixel">{day.points}</td>
                      <td className="p-3 text-purple-300">{day.correct + day.incorrect}</td>
                      <td className="p-3 text-green-300">{day.correct}</td>
                      <td className="p-3 text-red-300">{day.incorrect}</td>
                      <td className="p-3">
                        <Badge 
                          variant={day.accuracy >= 85 ? 'default' : day.accuracy >= 70 ? 'secondary' : 'destructive'}
                        >
                          {day.accuracy}%
                        </Badge>
                      </td>
                      <td className="p-3 text-yellow-300">{day.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
