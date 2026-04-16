import { MinecraftSteve, MinecraftZombie, MinecraftBlock } from './MinecraftCharacters';
import { Link } from 'wouter';
import { Shield, BarChart3, BookOpen, Brain, CheckCircle2, ChevronDown } from 'lucide-react';

export function LandingPage() {

  const scrollToParents = () => {
    document.getElementById('for-parents')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: '#060b14', imageRendering: 'pixelated' }}
    >

      {/* ════════════════════════════════════════════
          SECTION 1 — HERO  (for kids)
      ════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #060b14 0%, #0a1a0f 70%, #060b14 100%)' }}
      >
        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse-slow"
              style={{
                width: i % 3 === 0 ? 2 : 1,
                height: i % 3 === 0 ? 2 : 1,
                top: `${((i * 73) % 90) + 2}%`,
                left: `${((i * 61.8) % 98) + 1}%`,
                animationDelay: `${(i * 0.4) % 3}s`,
                opacity: 0.2 + (i % 5) * 0.08,
              }}
            />
          ))}
        </div>

        {/* Floating blocks */}
        <div className="absolute top-16 left-[4%] text-3xl opacity-20 animate-float select-none pointer-events-none">💎</div>
        <div className="absolute top-28 right-[6%] text-2xl opacity-20 animate-float-delay select-none pointer-events-none">⭐</div>
        <div className="absolute bottom-32 left-[8%] text-2xl opacity-15 animate-float-slow select-none pointer-events-none hidden md:block">🟩</div>
        <div className="absolute bottom-24 right-[5%] text-3xl opacity-15 animate-float select-none pointer-events-none hidden md:block">💎</div>
        <div className="absolute top-1/2 left-[2%] text-xl opacity-10 animate-float-delay select-none pointer-events-none hidden lg:block">🪨</div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">

          {/* Main Title */}
          <div className="mb-4">
            <h1
              className="font-pixel text-3xl md:text-5xl lg:text-6xl text-amber-400 leading-tight"
              style={{ textShadow: '0 0 30px rgba(251,191,36,0.4), 4px 4px 0 #7c2d12' }}
            >
              ⛏️ MINECRAFT
              <br />
              <span
                className="text-emerald-400"
                style={{ textShadow: '0 0 30px rgba(52,211,153,0.4), 4px 4px 0 #064e3b' }}
              >
                MATH
              </span>
            </h1>
          </div>

          {/* Tagline for kids */}
          <p className="font-pixel text-[10px] md:text-sm text-amber-200 tracking-[0.25em] mb-8">
            LEARN · BATTLE · CONQUER
          </p>

          {/* Battle scene */}
          <div className="flex items-center justify-center gap-4 md:gap-10 mb-10">
            <div className="flex flex-col items-center gap-2">
              <MinecraftSteve scale={1.8} />
              <span className="font-pixel text-[8px] text-emerald-400">PLAYER</span>
            </div>

            <div className="flex flex-col items-center gap-3">
              {/* Floating math question */}
              <div
                className="border-2 border-amber-500 bg-black/80 px-4 md:px-6 py-3 animate-float"
                style={{ boxShadow: '0 0 16px rgba(251,191,36,0.5)' }}
              >
                <p className="font-pixel text-amber-300 text-sm md:text-lg">8 × 9 = ?</p>
              </div>
              <span className="font-pixel text-[9px] text-red-400 animate-pulse">⚡ VS ⚡</span>
            </div>

            <div className="flex flex-col items-center gap-2" style={{ transform: 'scaleX(-1)' }}>
              <MinecraftZombie isAttacking scale={1.8} />
              <span className="font-pixel text-[8px] text-red-400" style={{ transform: 'scaleX(-1)' }}>MONSTER</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/auth">
              <button
                className="font-pixel text-sm md:text-base text-white px-8 py-4 border-b-4
                  bg-emerald-600 border-emerald-900 hover:bg-emerald-500
                  transition-all hover:scale-105 active:border-b-0 active:translate-y-1
                  w-64 sm:w-auto tracking-wider"
                style={{ boxShadow: '0 0 20px rgba(52,211,153,0.3)' }}
              >
                ▶ PLAY FOR FREE
              </button>
            </Link>
            <button
              onClick={scrollToParents}
              className="font-pixel text-[10px] text-gray-400 hover:text-amber-300
                transition-colors flex items-center gap-2 px-4 py-3"
            >
              FOR PARENTS
              <ChevronDown className="h-4 w-4 animate-bounce" />
            </button>
          </div>

          {/* Quick feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {['⚔️ MATH BATTLES', '📖 ENGLISH QUEST', '🤖 AI ROBOT TRAINER', '🏆 LEADERBOARD'].map(f => (
              <span
                key={f}
                className="font-pixel text-[8px] md:text-[9px] text-gray-300
                  border border-gray-700 bg-black/40 px-3 py-1.5"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll arrow */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-gray-600" />
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 2 — WHAT'S INSIDE  (excites kids)
      ════════════════════════════════════════════ */}
      <section style={{ background: '#080d18' }} className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-pixel text-lg md:text-2xl text-amber-400 mb-2">WHAT'S INSIDE?</h2>
            <p className="text-gray-500 text-sm">4 ways to learn — all wrapped in Minecraft</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: '⚔️',
                title: 'MATH BATTLE',
                color: 'border-red-600',
                bar: 'bg-red-500',
                desc: 'Solve math problems to defeat zombies, skeletons, and creepers. Faster answers = more damage!',
                tags: ['Addition', 'Subtraction', 'Multiplication', 'Division'],
                tagColor: 'bg-red-900/50 text-red-300',
              },
              {
                icon: '📖',
                title: 'ENGLISH QUEST',
                color: 'border-blue-500',
                bar: 'bg-blue-500',
                desc: 'Listen to a word, then type it, choose it, or fill in the blanks. 500+ words across 5 levels!',
                tags: ['Typing Mode', 'Multiple Choice', 'Fill the Blank'],
                tagColor: 'bg-blue-900/50 text-blue-300',
              },
              {
                icon: '🤖',
                title: 'ROBO TRAINER',
                color: 'border-emerald-500',
                bar: 'bg-emerald-500',
                desc: 'Build your own AI robot, train it through missions, then battle other players\' robots!',
                tags: ['AI Learning', 'Boss Battles', 'XP & Levels'],
                tagColor: 'bg-emerald-900/50 text-emerald-300',
              },
              {
                icon: '🏆',
                title: 'LEADERBOARD',
                color: 'border-yellow-500',
                bar: 'bg-yellow-400',
                desc: 'Compete with players worldwide. Math + English scores combined into one global ranking.',
                tags: ['Global Ranking', 'Math Score', 'English Score'],
                tagColor: 'bg-yellow-900/50 text-yellow-300',
              },
            ].map(card => (
              <div
                key={card.title}
                className={`bg-[#0d1117] border-2 ${card.color} overflow-hidden`}
              >
                <div className={`h-1.5 w-full ${card.bar}`} />
                <div className="p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-4xl">{card.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-pixel text-xs md:text-sm text-white mb-2">{card.title}</h3>
                      <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-3">{card.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {card.tags.map(t => (
                          <span key={t} className={`font-pixel text-[7px] px-2 py-1 ${card.tagColor}`}>{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3 — FOR PARENTS
      ════════════════════════════════════════════ */}
      <section
        id="for-parents"
        style={{ background: 'linear-gradient(180deg, #070c10 0%, #0a1208 100%)' }}
        className="py-20 px-4"
      >
        <div className="max-w-5xl mx-auto">

          {/* Parent section header */}
          <div className="text-center mb-12">
            <div className="inline-block border border-emerald-700 bg-emerald-900/20 px-4 py-1.5 mb-4">
              <span className="font-pixel text-[9px] text-emerald-400 tracking-widest">FOR PARENTS</span>
            </div>
            <h2 className="font-pixel text-lg md:text-2xl text-white mb-3 leading-relaxed">
              THEY THINK THEY'RE PLAYING.
              <br />
              <span className="text-emerald-400">THEY'RE ACTUALLY LEARNING.</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              MineMath wraps Grade 1–6 curriculum inside a Minecraft-themed world kids already love.
              15 minutes a day is all it takes.
            </p>
          </div>

          {/* What they learn */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {[
              {
                icon: '🧮',
                title: 'Mathematics',
                color: 'border-red-700',
                points: [
                  'Addition & subtraction',
                  'Multiplication tables',
                  'Division problems',
                  'Grades 1–6 level',
                ],
              },
              {
                icon: '🔤',
                title: 'English Language',
                color: 'border-blue-700',
                points: [
                  '500+ vocabulary words',
                  'Spelling & listening',
                  '5 difficulty levels',
                  'Multiple practice modes',
                ],
              },
              {
                icon: '🤖',
                title: 'AI & Technology',
                color: 'border-emerald-700',
                points: [
                  'Build an AI model',
                  'Train with missions',
                  'Understand ML concepts',
                  'Future-ready skills',
                ],
              },
            ].map(subject => (
              <div key={subject.title} className={`bg-[#0d1117] border ${subject.color} p-5`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{subject.icon}</span>
                  <h3 className="font-pixel text-xs text-white">{subject.title}</h3>
                </div>
                <ul className="space-y-2">
                  {subject.points.map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Trust signals — 2x2 grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {[
              { icon: <Shield className="h-5 w-5 text-emerald-400" />, title: 'Ad-Free', desc: 'Zero ads, zero distractions' },
              { icon: <BarChart3 className="h-5 w-5 text-blue-400" />, title: 'Progress Reports', desc: 'See exactly what they learned' },
              { icon: <BookOpen className="h-5 w-5 text-amber-400" />, title: 'Curriculum-Aligned', desc: 'Grades 1–6 standard' },
              { icon: <Brain className="h-5 w-5 text-purple-400" />, title: 'AI-Ready', desc: 'Prepares for the future' },
            ].map(trust => (
              <div
                key={trust.title}
                className="bg-[#0d1117] border border-gray-800 p-4 text-center"
              >
                <div className="flex justify-center mb-2">{trust.icon}</div>
                <p className="font-pixel text-[9px] text-white mb-1">{trust.title}</p>
                <p className="text-gray-500 text-[10px] leading-relaxed">{trust.desc}</p>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-12">
            {[
              { num: '3', label: 'Subjects' },
              { num: '500+', label: 'English Words' },
              { num: '10', label: 'Game Levels' },
            ].map(stat => (
              <div key={stat.label} className="text-center border border-gray-800 bg-black/30 py-5">
                <p
                  className="font-pixel text-2xl md:text-3xl text-amber-400 mb-1"
                  style={{ textShadow: '0 0 12px rgba(251,191,36,0.3)' }}
                >
                  {stat.num}
                </p>
                <p className="font-pixel text-[8px] text-gray-500 tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Parent quote / testimonial feel */}
          <div className="border border-gray-800 bg-[#0d1117] p-6 md:p-8 mb-10 relative">
            <div className="text-4xl text-gray-700 absolute top-4 left-5 font-serif leading-none">"</div>
            <p className="text-gray-300 text-sm md:text-base italic text-center leading-relaxed px-6 md:px-10">
              My son used to hate math homework. Now he asks to play MineMath before dinner.
              His teacher said his multiplication speed has improved a lot.
            </p>
            <p className="text-center font-pixel text-[9px] text-emerald-500 mt-4">— Parent of a Grade 4 student</p>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4 — FINAL CTA
      ════════════════════════════════════════════ */}
      <section
        style={{ background: 'linear-gradient(180deg, #0a1208 0%, #060b14 100%)' }}
        className="py-20 px-4 text-center"
      >
        <div className="max-w-xl mx-auto">
          <div className="flex justify-center gap-3 mb-6">
            <MinecraftBlock type="diamond" size={20} />
            <MinecraftBlock type="grass" size={20} />
            <MinecraftBlock type="diamond" size={20} />
          </div>

          <h2
            className="font-pixel text-xl md:text-2xl text-amber-400 mb-3 leading-relaxed"
            style={{ textShadow: '0 0 20px rgba(251,191,36,0.3)' }}
          >
            READY TO START?
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            Free to use · No credit card · Safe for kids
          </p>

          <Link href="/auth">
            <button
              className="font-pixel text-sm md:text-base text-white px-10 py-4 border-b-4
                bg-emerald-600 border-emerald-900 hover:bg-emerald-500
                transition-all hover:scale-105 active:border-b-0 active:translate-y-1
                tracking-wider w-full md:w-auto"
              style={{ boxShadow: '0 0 24px rgba(52,211,153,0.25)' }}
            >
              ▶ CREATE FREE ACCOUNT
            </button>
          </Link>

          <p className="mt-4 text-gray-600 text-xs">
            Already have an account?{' '}
            <Link href="/auth">
              <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer underline">Log in here</span>
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#040709' }} className="py-6 px-4 border-t border-gray-900">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="font-pixel text-[9px] text-gray-600">⛏️ MINEMATH</span>
          <span className="text-gray-700 text-xs">Made with ❤️ for young learners everywhere</span>
          <span className="font-pixel text-[8px] text-gray-700">LEARN · BATTLE · CONQUER</span>
        </div>
      </footer>

    </div>
  );
}
