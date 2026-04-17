import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { MinecraftSteve, MinecraftZombie } from './MinecraftCharacters';
import { Link } from 'wouter';

interface GameCardProps {
  icon: string;
  title: string;
  description: string;
  tag: string;
  tagBg: string;
  borderColor: string;
  topBarColor: string;
  btnColor: string;
  glowColor: string;
  delay: string;
  onClick?: () => void;
  href?: string;
}

function GameCard({
  icon, title, description, tag, tagBg,
  borderColor, topBarColor, btnColor, glowColor, delay,
  onClick, href,
}: GameCardProps) {
  const content = (
    <div
      className={`
        relative flex flex-col h-full
        bg-[#0d1117] border-2 ${borderColor}
        rounded-none cursor-pointer
        transition-all duration-200
        hover:scale-[1.04] hover:shadow-2xl ${glowColor}
        overflow-hidden
        animate-card-in
      `}
      style={{ animationDelay: delay, imageRendering: 'pixelated' }}
      onClick={onClick}
    >
      {/* Top color bar */}
      <div className={`h-2 w-full ${topBarColor}`} />

      {/* Badge */}
      <div className={`absolute top-4 right-3 ${tagBg} px-2 py-0.5 rounded-none`}>
        <span className="font-pixel text-white text-[7px]">{tag}</span>
      </div>

      {/* Card body */}
      <div className="flex flex-col flex-1 items-center justify-between p-4 pt-5 text-center">
        {/* Icon */}
        <div className="text-5xl md:text-6xl mb-3 animate-bounce-slow" style={{ animationDelay: delay }}>
          {icon}
        </div>

        {/* Text */}
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <h3 className="font-pixel text-[10px] md:text-xs text-white leading-relaxed">
            {title}
          </h3>
          <p className="text-gray-400 text-[9px] md:text-[10px] leading-relaxed px-1">
            {description}
          </p>
        </div>

        {/* Play button */}
        <button
          className={`
            mt-4 w-full py-2.5 font-pixel text-[9px] md:text-[10px] text-white
            border-b-4 ${btnColor}
            transition-all active:border-b-0 active:translate-y-1
            tracking-widest
          `}
        >
          ▶ PLAY NOW
        </button>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return content;
}

// Decorative floating pixel blocks
function FloatingBlock({ emoji, className }: { emoji: string; className: string }) {
  return (
    <div className={`absolute select-none pointer-events-none text-2xl md:text-3xl opacity-20 md:opacity-30 ${className}`}>
      {emoji}
    </div>
  );
}

interface HomePageProps {
  onStartGame: (startLevel?: number) => void;
  savedLevel?: number; // last level from parent ref (always up to date after a save)
}

export function HomePage({ onStartGame, savedLevel }: HomePageProps) {
  const { user } = useAuth();
  const firstName = (user as any)?.firstName || (user as any)?.name || 'Player';

  // Fetch last saved level from API as fallback (for first load / page refresh)
  const { data: recentProgress } = useQuery<{ level: number }[]>({
    queryKey: ['/api/progress/recent'],
    staleTime: 60_000,
  });
  const apiLevel = recentProgress && recentProgress.length > 0
    ? Math.max(...recentProgress.map(p => p.level || 1))
    : 1;

  // savedLevel from parent ref is always freshest; API is fallback on first load
  const lastLevel = Math.max(savedLevel ?? 1, apiLevel);

  const cards: GameCardProps[] = [
    {
      icon: '⚔️',
      title: 'MATH BATTLE',
      description: `Defeat zombies & skeletons by solving math fast!`,
      tag: `⚡ LV ${lastLevel}`,
      tagBg: lastLevel >= 4 ? 'bg-purple-600' : lastLevel >= 3 ? 'bg-orange-600' : lastLevel >= 2 ? 'bg-yellow-600' : 'bg-red-600',
      borderColor: 'border-red-600',
      topBarColor: 'bg-red-500',
      btnColor: 'bg-red-700 border-red-900 hover:bg-red-600',
      glowColor: 'hover:shadow-red-600/50',
      delay: '0ms',
      onClick: () => onStartGame(lastLevel),
    },
    {
      icon: '📖',
      title: 'ENGLISH QUEST',
      description: 'Hear it. Spell it. Level up your English!',
      tag: '🎧 LISTEN',
      tagBg: 'bg-blue-600',
      borderColor: 'border-blue-500',
      topBarColor: 'bg-blue-500',
      btnColor: 'bg-blue-700 border-blue-900 hover:bg-blue-600',
      glowColor: 'hover:shadow-blue-500/50',
      delay: '80ms',
      href: '/english-dictation',
    },
    {
      icon: '🤖',
      title: 'ROBO TRAINER',
      description: 'Build your AI robot warrior and challenge others!',
      tag: '🤖 AI',
      tagBg: 'bg-emerald-600',
      borderColor: 'border-emerald-500',
      topBarColor: 'bg-emerald-500',
      btnColor: 'bg-emerald-700 border-emerald-900 hover:bg-emerald-600',
      glowColor: 'hover:shadow-emerald-500/50',
      delay: '160ms',
      href: '/robo-trainer',
    },
    {
      icon: '🏆',
      title: 'LEADERBOARD',
      description: "See how you rank against players worldwide!",
      tag: '👑 GLOBAL',
      tagBg: 'bg-yellow-600',
      borderColor: 'border-yellow-500',
      topBarColor: 'bg-yellow-400',
      btnColor: 'bg-yellow-600 border-yellow-800 hover:bg-yellow-500',
      glowColor: 'hover:shadow-yellow-400/50',
      delay: '240ms',
      href: '/rank',
    },
    {
      icon: '🎮',
      title: 'MULTIPLAYER',
      description: 'Challenge a friend in real-time Math Battle or Co-op!',
      tag: '🔴 LIVE',
      tagBg: 'bg-pink-600',
      borderColor: 'border-pink-500',
      topBarColor: 'bg-pink-500',
      btnColor: 'bg-pink-700 border-pink-900 hover:bg-pink-600',
      glowColor: 'hover:shadow-pink-500/50',
      delay: '320ms',
      href: '/multiplayer',
    },
  ];

  return (
    <div
      className="relative min-h-[calc(100vh-56px)] overflow-hidden pb-20 md:pb-8"
      style={{
        background: 'linear-gradient(180deg, #060b14 0%, #0a1a0f 60%, #060b14 100%)',
        imageRendering: 'pixelated',
      }}
    >
      {/* ── Floating decorative blocks ── */}
      <FloatingBlock emoji="💎" className="top-16 left-[5%] animate-float" />
      <FloatingBlock emoji="🟩" className="top-24 left-[12%] animate-float-delay" />
      <FloatingBlock emoji="🪨" className="top-10 right-[8%] animate-float-slow" />
      <FloatingBlock emoji="⭐" className="top-32 right-[15%] animate-float" />
      <FloatingBlock emoji="💎" className="top-8 left-[40%] animate-float-delay" />
      <FloatingBlock emoji="🟫" className="top-44 left-[2%] animate-float-slow hidden md:block" />
      <FloatingBlock emoji="⭐" className="top-52 right-[3%] animate-float hidden md:block" />

      {/* ── Subtle star field ── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full animate-pulse-slow"
            style={{
              top: `${Math.sin(i * 137.5) * 40 + 45}%`,
              left: `${((i * 61.8) % 100)}%`,
              animationDelay: `${(i * 0.3) % 3}s`,
              opacity: 0.3 + (i % 4) * 0.1,
            }}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="relative z-10 text-center px-4 pt-8 md:pt-12 pb-6 md:pb-10">

        {/* Title */}
        <div className="mb-2">
          <h1
            className="font-pixel text-2xl md:text-4xl lg:text-5xl text-amber-400 leading-tight"
            style={{ textShadow: '0 0 20px rgba(251,191,36,0.5), 4px 4px 0 #7c2d12' }}
          >
            ⛏️ MINECRAFT MATH
          </h1>
        </div>

        {/* Tagline */}
        <p className="font-pixel text-[10px] md:text-sm text-emerald-400 tracking-[0.3em] mb-1">
          LEARN · BATTLE · CONQUER
        </p>

        {/* Welcome */}
        <p className="text-gray-400 text-xs md:text-sm mb-6 md:mb-8">
          Welcome back, <span className="text-amber-300 font-semibold">{firstName}</span>! ⚡ Ready to battle?
        </p>

        {/* ── Battle Scene ── */}
        <div className="flex items-center justify-center gap-3 md:gap-6 mb-2">
          {/* Steve */}
          <div className="flex flex-col items-center gap-1">
            <MinecraftSteve scale={1.2} />
            <span className="font-pixel text-[7px] text-emerald-400">YOU</span>
          </div>

          {/* VS + Math Question */}
          <div className="flex flex-col items-center gap-2">
            <div
              className="border-2 border-amber-500 bg-black/80 px-3 md:px-5 py-2 md:py-3 animate-pulse-slow"
              style={{ boxShadow: '0 0 12px rgba(251,191,36,0.4)' }}
            >
              <p className="font-pixel text-amber-300 text-[10px] md:text-sm">12 × 7 = ?</p>
            </div>
            <span className="font-pixel text-[8px] md:text-[10px] text-red-400 animate-pulse">⚡ VS ⚡</span>
          </div>

          {/* Zombie (flipped) */}
          <div className="flex flex-col items-center gap-1" style={{ transform: 'scaleX(-1)' }}>
            <MinecraftZombie isAttacking scale={1.2} />
            <span className="font-pixel text-[7px] text-red-400" style={{ transform: 'scaleX(-1)' }}>ENEMY</span>
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════
          DIVIDER
      ══════════════════════════════════════ */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent" />
          <span className="font-pixel text-[8px] text-amber-600 tracking-widest">CHOOSE YOUR GAME</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-700 to-transparent" />
        </div>
      </div>

      {/* ══════════════════════════════════════
          GAME CARDS GRID
      ══════════════════════════════════════ */}
      <section className="relative z-10 max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {cards.map((card) => (
            <GameCard key={card.title} {...card} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          BOTTOM TAGLINE
      ══════════════════════════════════════ */}
      <div className="relative z-10 text-center mt-8 px-4">
        <p className="font-pixel text-[7px] md:text-[9px] text-gray-600 tracking-widest">
          ⛏️ MINE · LEARN · CONQUER · REPEAT ⛏️
        </p>
      </div>

    </div>
  );
}
