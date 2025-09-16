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
    console.log('🎮 handleGameComplete called with stats:', stats);
    console.log('🎮 Stats breakdown:', {
      level: stats.level,
      score: stats.score,
      hearts: stats.hearts,
      diamonds: stats.diamonds
    });
    
    try {
      // Don't save if no meaningful progress (score = 0)
      if (!stats.score || stats.score <= 0) {
        console.log('No meaningful progress to save (score = 0)');
        setCurrentView('dashboard');
        return;
      }

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

      // Clear all cached data and force fresh requests
      queryClient.clear(); // This will clear all cached data
      
      // Invalidate and force refetch all queries with specific keys
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/progress/recent'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/user/total-points'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/achievements'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/inventory'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/rewards/opportunities'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['/api/auth/user'], refetchType: 'all' })
      ]);
      
      // Wait a moment for invalidation to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Force immediate refetch of all queries
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['/api/progress/recent'] }),
        queryClient.refetchQueries({ queryKey: ['/api/user/total-points'] }),
        queryClient.refetchQueries({ queryKey: ['/api/achievements'] }),
        queryClient.refetchQueries({ queryKey: ['/api/inventory'] }),
        queryClient.refetchQueries({ queryKey: ['/api/rewards/opportunities'] })
      ]);

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
        <div className="max-w-6xl mx-auto px-2 md:px-4 py-2 md:py-3 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-0">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
            <h1 className="font-pixel text-lg md:text-xl text-foreground">MINECRAFT MATH</h1>
            <div className="flex gap-1 md:gap-2 w-full md:w-auto justify-center md:justify-start">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className="font-pixel text-xs flex-1 md:flex-none"
                data-testid="button-dashboard"
              >
                <BarChart3 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span className="hidden sm:inline">DASHBOARD</span>
                <span className="sm:hidden">DASH</span>
              </Button>
              <Button
                variant={currentView === 'game' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('game')}
                className="font-pixel text-xs flex-1 md:flex-none"
                data-testid="button-game"
              >
                <Gamepad2 className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                PLAY
              </Button>
              <Button
                variant={currentView === 'leaderboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('leaderboard')}
                className="font-pixel text-xs flex-1 md:flex-none"
                data-testid="button-leaderboard"
              >
                <Trophy className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                <span className="hidden sm:inline">LEADERBOARD</span>
                <span className="sm:hidden">RANK</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 justify-center md:justify-end w-full md:w-auto">
            <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">
              Welcome, {(user as any)?.firstName || (user as any)?.name || 'Player'}!
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="font-pixel text-xs"
              data-testid="button-logout"
            >
              <LogOut className="h-3 w-3 md:h-4 md:w-4 mr-1" />
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