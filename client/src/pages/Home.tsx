import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { GameInterface } from '@/components/GameInterface';
import { Leaderboard } from '@/components/Leaderboard';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Gamepad2, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function Home() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'game' | 'leaderboard'>('dashboard');
  const { toast } = useToast();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleGameComplete = async (stats: any) => {
    console.log('Game completed with stats:', stats);
    
    try {
      // Calculate points and game data from stats
      const pointsEarned = stats.score || 0;
      const level = stats.level || 1;
      
      // For now, we'll calculate rough estimates
      // In a real implementation, you'd track these during the game
      const questionsAnswered = Math.max(1, Math.floor(pointsEarned / 10)); // Assume ~10 points per question
      const correctAnswers = Math.max(1, Math.floor(questionsAnswered * 0.8)); // Assume 80% accuracy
      
      console.log('Saving progress:', {
        pointsEarned,
        questionsAnswered,
        correctAnswers,
        level
      });

      // Save temporary progress to backend (until midnight finalization)
      const response = await fetch('/api/progress/temporary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Send cookies for authentication
        body: JSON.stringify({
          pointsEarned,
          questionsAnswered,
          correctAnswers,
          level,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone // Auto-detect user timezone
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      const progressData = await response.json();
      console.log('Progress saved successfully:', progressData);

      // Invalidate queries to refresh dashboard data
      queryClient.invalidateQueries({ queryKey: ['/api/progress/recent'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });

      toast({
        title: "Game Complete! 🎉",
        description: `You earned ${pointsEarned} points! Progress saved.`,
      });

    } catch (error) {
      console.error('Failed to save game progress:', error);
      
      toast({
        title: "Game Complete! 🎉",
        description: `You earned ${stats.score || 0} points! (Progress not saved - please try again)`,
        variant: "destructive",
      });
    }
    
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-card border-b border-card-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-pixel text-xl text-foreground">MINECRAFT MATH</h1>
            <div className="flex gap-2">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className="font-pixel text-xs"
                data-testid="button-dashboard"
              >
                <BarChart3 className="h-4 w-4 mr-1" />
                DASHBOARD
              </Button>
              <Button
                variant={currentView === 'game' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('game')}
                className="font-pixel text-xs"
                data-testid="button-game"
              >
                <Gamepad2 className="h-4 w-4 mr-1" />
                PLAY
              </Button>
              <Button
                variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('leaderboard')}
                className="font-pixel text-xs"
                data-testid="button-leaderboard"
              >
                <Trophy className="h-4 w-4 mr-1" />
                LEADERBOARD
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {(user as any)?.firstName || user?.name || 'Player'}!
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="font-pixel text-xs"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-1" />
              LOGOUT
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      {currentView === 'dashboard' && (
        <Dashboard onStartGame={() => setCurrentView('game')} />
      )}
      
      {currentView === 'game' && (
        <GameInterface onGameComplete={handleGameComplete} />
      )}
      
      {currentView === 'leaderboard' && (
        <Leaderboard />
      )}
    </div>
  );
}