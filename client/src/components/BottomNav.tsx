import { Link, useLocation } from 'wouter';
import { BarChart3, Gamepad2, Volume2, Trophy, FileText } from 'lucide-react';

export function BottomNav() {
  const [location, navigate] = useLocation();

  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  const currentView = searchParams.get('view') || 'dashboard';

  const isHome = location === '/';
  const isDashboard = isHome && (currentView === 'dashboard' || currentView === '');
  const isPlay = isHome && currentView === 'game';
  const isEnglish = location === '/english-dictation';
  const isRank = location === '/rank';
  const isReport = isHome && currentView === 'report';

  const items = [
    {
      label: 'HOME',
      icon: <BarChart3 className="h-5 w-5" />,
      active: isDashboard,
      onClick: () => navigate('/?view=dashboard'),
    },
    {
      label: 'PLAY',
      icon: <Gamepad2 className="h-5 w-5" />,
      active: isPlay,
      onClick: () => navigate('/?view=game'),
    },
    {
      label: 'ENGLISH',
      icon: <Volume2 className="h-5 w-5" />,
      active: isEnglish,
      href: '/english-dictation',
    },
    {
      label: 'RANK',
      icon: <Trophy className="h-5 w-5" />,
      active: isRank,
      href: '/rank',
    },
    {
      label: 'REPORT',
      icon: <FileText className="h-5 w-5" />,
      active: isReport,
      onClick: () => navigate('/?view=report'),
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#0d1117',
        borderTop: '2px solid #1a2a1a',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.6)',
      }}
    >
      <div className="flex items-stretch h-[60px]">
        {items.map((item) => {
          const inner = (
            <div
              className="flex flex-col items-center justify-center gap-1 w-full h-full px-1 relative"
              style={{
                background: item.active ? 'rgba(52,211,153,0.12)' : 'transparent',
                borderTop: item.active ? '2px solid #34d399' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ color: item.active ? '#34d399' : '#6b7280' }}>
                {item.icon}
              </span>
              <span
                className="font-pixel leading-none"
                style={{
                  fontSize: '7px',
                  color: item.active ? '#34d399' : '#6b7280',
                  letterSpacing: '0.05em',
                }}
              >
                {item.label}
              </span>
            </div>
          );

          if (item.href) {
            return (
              <Link key={item.label} href={item.href} className="flex-1">
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex-1"
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
