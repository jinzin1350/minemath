import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MinecraftSteve, MinecraftBlock } from './MinecraftCharacters';
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

  const displayName = data.user.firstName || 'Player';
  const accuracy = Math.round((data.totalStats.correctAnswers / data.totalStats.totalQuestions) * 100);

  // Format data for the chart
  const chartData = data.recentProgress.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    points: day.pointsEarned,
    accuracy: Math.round((day.correctAnswers / day.questionsAnswered) * 100)
  })).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-green-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-2 border-card-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <MinecraftSteve scale={1.2} />
                <div>
                  <CardTitle className="font-pixel text-xl text-foreground">
                    Welcome back, {displayName}!
                  </CardTitle>
                  <p className="text-muted-foreground">Ready for another math adventure?</p>
                </div>
              </div>
              <Button 
                onClick={onStartGame}
                className="font-pixel px-6 py-3 bg-green-600 hover:bg-green-700"
                data-testid="button-start-game"
              >
                START GAME
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-card-border hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-pixel text-foreground">{data.totalStats.totalPoints}</p>
                  <p className="text-sm text-muted-foreground">Total Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-card-border hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-pixel text-foreground">{accuracy}%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-card-border hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-pixel text-foreground">{data.totalStats.currentStreak}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-card-border hover-elevate">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Diamond className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-pixel text-foreground">{data.totalStats.bestLevel}</p>
                  <p className="text-sm text-muted-foreground">Best Level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Chart */}
        <Card className="border-2 border-card-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-pixel text-foreground">7-Day Progress</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('7d')}
                  className="font-pixel text-xs"
                  data-testid="button-7d"
                >
                  7 Days
                </Button>
                <Button
                  variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTimeframe('30d')}
                  className="font-pixel text-xs"
                  data-testid="button-30d"
                >
                  30 Days
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="points" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-2 border-card-border">
            <CardHeader>
              <CardTitle className="font-pixel text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <MinecraftBlock type="diamond" size={24} />
                <div>
                  <p className="font-pixel text-sm text-foreground">Math Warrior</p>
                  <p className="text-xs text-muted-foreground">Answered 100 questions correctly</p>
                </div>
                <Badge variant="secondary" className="ml-auto font-pixel">NEW</Badge>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div className="flex">
                  <Heart className="h-6 w-6 text-red-500 fill-current" />
                </div>
                <div>
                  <p className="font-pixel text-sm text-foreground">Streak Master</p>
                  <p className="text-xs text-muted-foreground">5 days in a row</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Zap className="h-6 w-6 text-yellow-500" />
                <div>
                  <p className="font-pixel text-sm text-foreground">Speed Demon</p>
                  <p className="text-xs text-muted-foreground">Beat level 3 in record time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-card-border">
            <CardHeader>
              <CardTitle className="font-pixel text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentProgress.slice(0, 5).map((day, index) => (
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