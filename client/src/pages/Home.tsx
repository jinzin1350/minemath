import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { GameInterface } from '@/components/GameInterface';
import { Leaderboard } from '@/components/Leaderboard';
import { ParentsReport } from '@/components/ParentsReport';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Gamepad2, Trophy, FileText, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

export default function Home() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'game' | 'leaderboard' | 'report'>('dashboard');
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
      // Use predicate to match all progress queries regardless of days parameter
      await queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0]?.toString().startsWith('/api/progress/recent')
      });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/rewards/opportunities'] });

      // Force refetch of all queries to ensure UI updates
      await queryClient.refetchQueries();

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
      <nav className="bg-card border-b border-card-border sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-2 md:px-4 py-1 md:py-2">
          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Top row: Title and Logout */}
            <div className="flex items-center justify-between mb-1">
              <h1 className="font-pixel text-xs text-foreground">⛏️ MINECRAFT MATH</h1>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-pixel text-xs px-2 py-1 h-6"
                data-testid="button-logout"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>

            {/* Bottom row: Navigation buttons */}
            <div className="flex gap-1 w-full">
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className="font-pixel text-xs flex-1 px-1 py-1 h-7"
                data-testid="button-dashboard"
              >
                <BarChart3 className="h-3 w-3" />
              </Button>
              <Button
                variant={currentView === 'game' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('game')}
                className="font-pixel text-xs flex-1 px-1 py-1 h-7"
                data-testid="button-game"
              >
                <Gamepad2 className="h-3 w-3" />
              </Button>
              <Link href="/english-dictation" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-pixel text-xs w-full px-1 py-1 h-7"
                  data-testid="button-english-dictation"
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              </Link>
              <Link href="/rank" className="flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-pixel text-xs w-full px-1 py-1 h-7"
                  data-testid="button-leaderboard"
                >
                  <Trophy className="h-3 w-3" />
                </Button>
              </Link>
              <Button
                variant={currentView === 'report' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('report')}
                className="font-pixel text-xs flex-1 px-1 py-1 h-7"
                data-testid="button-report"
              >
                <FileText className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex md:flex-row items-center justify-between">
            <div className="flex flex-row items-center gap-4">
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
                <Link href="/english-dictation">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-pixel text-xs"
                    data-testid="button-english-dictation"
                  >
                    <Volume2 className="h-4 w-4 mr-1" />
                    ENGLISH
                  </Button>
                </Link>
                <Link href="/rank">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-pixel text-xs"
                    data-testid="button-leaderboard"
                  >
                    <Trophy className="h-4 w-4 mr-1" />
                    LEADERBOARD
                  </Button>
                </Link>
                <Button
                  variant={currentView === 'report' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView('report')}
                  className="font-pixel text-xs"
                  data-testid="button-report"
                >
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
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                LOGOUT
              </Button>
            </div>
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
      
      {currentView === 'report' && (
        <ParentsReport />
      )}
    </div>
  );
}