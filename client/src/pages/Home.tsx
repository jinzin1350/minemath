import { useState, useEffect, useRef } from 'react';
import { useSearch } from 'wouter';
import { HomePage } from '@/components/HomePage';
import { GameInterface } from '@/components/GameInterface';
import { Leaderboard } from '@/components/Leaderboard';
import { ParentsReport } from '@/components/ParentsReport';
import { BottomNav } from '@/components/BottomNav';
import { NavBar } from '@/components/NavBar';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

type HomeView = 'dashboard' | 'game' | 'leaderboard' | 'report';

export default function Home() {
  const search = useSearch();
  const { toast } = useToast();

  // Ref so GameInterface can register its current stats for mid-game saves
  const gameStatsRef = useRef<any>(null);

  // Derive current view from URL ?view= param
  const getViewFromSearch = (s: string): HomeView => {
    const params = new URLSearchParams(s);
    const v = params.get('view');
    if (v === 'game') return 'game';
    if (v === 'report') return 'report';
    if (v === 'leaderboard') return 'leaderboard';
    return 'dashboard';
  };

  const [currentView, setCurrentView] = useState<HomeView>(() => getViewFromSearch(search));
  const [startLevel, setStartLevel] = useState<number>(1);
  // persists the last reached level across game sessions (updated after every save)
  const lastLevelRef = useRef<number>(1);

  // Sync view when URL search param changes (e.g. BottomNav navigates to /?view=report)
  // If user navigates AWAY from game mid-play, save progress first
  useEffect(() => {
    const newView = getViewFromSearch(search);
    if (currentView === 'game' && newView !== 'game') {
      // User navigated away from game via BottomNav — save progress
      const s = gameStatsRef.current;
      if (s && (s.diamonds + s.wrongAnswers) > 0) {
        handleGameComplete(s);
        return; // handleGameComplete will call setCurrentView itself
      }
    }
    setCurrentView(newView);
  }, [search]);


  const handleGameComplete = async (stats: any) => {
    console.log('🎮 handleGameComplete called with stats:', stats);
    console.log('🎮 Stats breakdown:', {
      level: stats.level,
      score: stats.score,
      hearts: stats.hearts,
      diamonds: stats.diamonds
    });
    
    try {
      const pointsEarned = stats.score || 0;
      const level = stats.level || 1;
      const correctAnswers = stats.diamonds || 0;          // +1 per correct answer
      const wrongAnswers = stats.wrongAnswers || 0;        // tracked directly in game
      const questionsAnswered = correctAnswers + wrongAnswers;

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

      // Update last known level from server response so next game starts correctly
      if (progressData.level && progressData.level > lastLevelRef.current) {
        lastLevelRef.current = progressData.level;
      }

      // Remove cached progress data so report always fetches fresh on next mount
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0]?.toString().startsWith('/api/progress/recent')
      });
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0]?.toString().startsWith('/api/dictation/progress-report')
      });

      // Invalidate other queries so they refetch when active
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/rewards/opportunities'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/leaderboard/global'] });

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
      <NavBar />

      {/* Main Content */}
      <div className="pb-16 md:pb-0">
        {currentView === 'dashboard' && (
          <HomePage
            onStartGame={(lvl) => {
              // use the level passed from HomePage (from API cache),
              // but always prefer the ref which is updated after every save
              const level = Math.max(lvl ?? 1, lastLevelRef.current);
              setStartLevel(level);
              setCurrentView('game');
            }}
            savedLevel={lastLevelRef.current}
          />
        )}

        {currentView === 'game' && (
          <GameInterface
            onGameComplete={handleGameComplete}
            onBackToDashboard={() => setCurrentView('dashboard')}
            onStatsUpdate={(s) => { gameStatsRef.current = s; }}
            startLevel={startLevel}
          />
        )}

        {currentView === 'leaderboard' && (
          <Leaderboard />
        )}

        {currentView === 'report' && (
          <ParentsReport />
        )}
      </div>

      <BottomNav />
    </div>
  );
}