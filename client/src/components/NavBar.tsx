import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, Gamepad2, Volume2, Bot, Trophy, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function NavBar() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  // Navigate to a home sub-view using search params
  const goToView = (view: string) => {
    navigate(`/?view=${view}`);
  };

  // Determine active state for each item
  const isEnglish = location === '/english-dictation';
  const isRoboTrainer = location === '/robo-trainer';
  const isRank = location === '/rank';

  // For home sub-views, read from URL
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const currentView = searchParams.get('view') || 'dashboard';
  const isHome = location === '/';

  const isDashboard = isHome && (currentView === 'dashboard' || currentView === '');
  const isPlay = isHome && currentView === 'game';
  const isReport = isHome && currentView === 'report';

  const btnClass = (active: boolean) =>
    `font-pixel text-xs ${active ? '' : ''}`;

  return (
    <nav className="bg-card border-b border-card-border sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-2 md:px-4 py-1 md:py-2">
        {/* Mobile: just title + logout */}
        <div className="md:hidden flex items-center justify-between">
          <h1 className="font-pixel text-xs text-foreground">⛏️ MINECRAFT MATH</h1>
          <Button variant="outline" size="sm" onClick={handleLogout} className="font-pixel text-xs px-2 py-1 h-7">
            <LogOut className="h-3 w-3 mr-1" />EXIT
          </Button>
        </div>

        {/* Desktop */}
        <div className="hidden md:flex md:flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-4">
            <h1 className="font-pixel text-xl text-foreground">MINECRAFT MATH</h1>
            <div className="flex gap-2">
              <Button
                variant={isDashboard ? 'default' : 'ghost'}
                size="sm"
                onClick={() => goToView('dashboard')}
                className={btnClass(isDashboard)}
              >
                <BarChart3 className="h-4 w-4 mr-1" />DASHBOARD
              </Button>

              <Button
                variant={isPlay ? 'default' : 'ghost'}
                size="sm"
                onClick={() => goToView('game')}
                className={btnClass(isPlay)}
              >
                <Gamepad2 className="h-4 w-4 mr-1" />PLAY
              </Button>

              <Link href="/english-dictation">
                <Button variant={isEnglish ? 'default' : 'ghost'} size="sm" className={btnClass(isEnglish)}>
                  <Volume2 className="h-4 w-4 mr-1" />ENGLISH
                </Button>
              </Link>

              <Link href="/robo-trainer">
                <Button variant={isRoboTrainer ? 'default' : 'ghost'} size="sm" className={btnClass(isRoboTrainer)}>
                  <Bot className="h-4 w-4 mr-1" />ROBO TRAINER
                </Button>
              </Link>

              <Link href="/rank">
                <Button variant={isRank ? 'default' : 'ghost'} size="sm" className={btnClass(isRank)}>
                  <Trophy className="h-4 w-4 mr-1" />LEADERBOARD
                </Button>
              </Link>

              <Button
                variant={isReport ? 'default' : 'ghost'}
                size="sm"
                onClick={() => goToView('report')}
                className={btnClass(isReport)}
              >
                <FileText className="h-4 w-4 mr-1" />REPORT
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {(user as any)?.firstName || (user as any)?.name || 'Player'}!
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="font-pixel text-xs">
              <LogOut className="h-4 w-4 mr-1" />LOGOUT
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
