import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dashboard } from '@/components/Dashboard';
import { GameInterface } from '@/components/GameInterface';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Gamepad2 } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'game'>('dashboard');

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  const handleGameComplete = (stats: any) => {
    console.log('Game completed with stats:', stats);
    // TODO: Save game session to backend
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
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.firstName || 'Player'}!
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
    </div>
  );
}