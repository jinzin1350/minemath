import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Check, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ProgressData {
  isFinal: boolean;
  finalizeAt: string | null;
  pointsEarned: number;
  level: number;
  status: 'temporary' | 'final';
  timeUntilFinalization: string | null;
}

export function ScoreStatusBar() {
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Get today's progress with finalization status
  const { data: recentProgress } = useQuery({
    queryKey: ['/api/progress/recent'],
    refetchInterval: 60000, // Refresh every minute
  });

  const todayProgress = Array.isArray(recentProgress) && recentProgress.length > 0 
    ? (recentProgress[0] as ProgressData) 
    : undefined;

  // Calculate countdown to midnight finalization
  useEffect(() => {
    if (!todayProgress?.finalizeAt || todayProgress.isFinal) {
      setTimeLeft('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const finalizeTime = new Date(todayProgress.finalizeAt!);
      const diff = finalizeTime.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Finalizing...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s until midnight lock`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [todayProgress?.finalizeAt, todayProgress?.isFinal]);

  if (!todayProgress) {
    return (
      <Card className="mb-6" data-testid="status-no-progress">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No progress today</p>
              <p className="text-xs text-muted-foreground">Start playing to track your daily score!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6" data-testid="status-progress-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {todayProgress.isFinal ? (
              <Check className="h-5 w-5 text-green-500" data-testid="icon-finalized" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-500" data-testid="icon-temporary" />
            )}
            
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium" data-testid="text-score">
                  Today's Score: {todayProgress.pointsEarned || 0} points
                </p>
                <Badge 
                  variant={todayProgress.isFinal ? "default" : "secondary"} 
                  data-testid={`badge-${todayProgress.isFinal ? 'final' : 'temporary'}`}
                >
                  {todayProgress.isFinal ? 'Final' : 'Temporary'}
                </Badge>
              </div>
              
              {todayProgress.isFinal ? (
                <p className="text-xs text-muted-foreground" data-testid="text-final-status">
                  Your score is locked and counted on the leaderboard
                </p>
              ) : timeLeft ? (
                <p className="text-xs text-muted-foreground" data-testid="text-countdown">
                  {timeLeft}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground" data-testid="text-improvement">
                  Keep playing to improve your score until midnight!
                </p>
              )}
            </div>
          </div>

          {todayProgress.level && (
            <div className="text-right">
              <p className="text-sm font-medium" data-testid="text-level">Level {todayProgress.level}</p>
              <p className="text-xs text-muted-foreground">Current</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}