import { Link, useLocation } from 'wouter';
import { BarChart3, Gamepad2, Volume2, Trophy, FileText } from 'lucide-react';

type HomeView = 'dashboard' | 'game' | 'leaderboard' | 'report';

interface BottomNavProps {
  homeView?: HomeView;
  onViewChange?: (view: HomeView) => void;
}

export function BottomNav({ homeView, onViewChange }: BottomNavProps) {
  const [location, setLocation] = useLocation();
  const isHome = location === '/';

  const handleHomeItem = (view: HomeView) => {
    if (isHome && onViewChange) {
      onViewChange(view);
    } else {
      setLocation('/');
    }
  };

  const itemClass = (active: boolean) =>
    `flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
      active ? 'text-primary' : 'text-muted-foreground'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        <button
          onClick={() => handleHomeItem('dashboard')}
          className={itemClass(isHome && homeView === 'dashboard')}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="font-pixel text-[8px]">HOME</span>
        </button>

        <button
          onClick={() => handleHomeItem('game')}
          className={itemClass(isHome && homeView === 'game')}
        >
          <Gamepad2 className="h-5 w-5" />
          <span className="font-pixel text-[8px]">PLAY</span>
        </button>

        <Link href="/english-dictation">
          <button className={itemClass(location === '/english-dictation')}>
            <Volume2 className="h-5 w-5" />
            <span className="font-pixel text-[8px]">ENGLISH</span>
          </button>
        </Link>

        <Link href="/rank">
          <button className={itemClass(location === '/rank')}>
            <Trophy className="h-5 w-5" />
            <span className="font-pixel text-[8px]">RANK</span>
          </button>
        </Link>

        <button
          onClick={() => handleHomeItem('report')}
          className={itemClass(isHome && homeView === 'report')}
        >
          <FileText className="h-5 w-5" />
          <span className="font-pixel text-[8px]">REPORT</span>
        </button>
      </div>
    </nav>
  );
}
