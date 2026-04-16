import { useState } from 'react';
import { MinecraftSteve, MinecraftZombie } from '@/components/MinecraftCharacters';
import { Loader2 } from 'lucide-react';
import { Link } from 'wouter';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/login' : '/api/signup';
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden relative"
      style={{ background: 'linear-gradient(180deg, #060b14 0%, #0a1a0f 60%, #060b14 100%)' }}
    >
      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        {[...Array(22)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse-slow"
            style={{
              width: i % 3 === 0 ? 2 : 1,
              height: i % 3 === 0 ? 2 : 1,
              top: `${((i * 73) % 90) + 2}%`,
              left: `${((i * 61.8) % 98) + 1}%`,
              animationDelay: `${(i * 0.4) % 3}s`,
              opacity: 0.15 + (i % 5) * 0.06,
            }}
          />
        ))}
      </div>

      {/* Floating blocks */}
      <div className="absolute top-12 left-[5%] text-2xl opacity-15 animate-float select-none pointer-events-none hidden md:block">💎</div>
      <div className="absolute top-24 right-[7%] text-xl opacity-15 animate-float-delay select-none pointer-events-none hidden md:block">⭐</div>
      <div className="absolute bottom-20 left-[8%] text-2xl opacity-10 animate-float-slow select-none pointer-events-none hidden md:block">🟩</div>
      <div className="absolute bottom-28 right-[6%] text-xl opacity-10 animate-float select-none pointer-events-none hidden md:block">🪨</div>

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Back to home */}
        <div className="text-center mb-6">
          <Link href="/">
            <span className="font-pixel text-[9px] text-gray-500 hover:text-amber-400 transition-colors cursor-pointer tracking-widest">
              ← BACK TO HOME
            </span>
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-6">
          <h1
            className="font-pixel text-2xl md:text-3xl text-amber-400 leading-tight mb-1"
            style={{ textShadow: '0 0 20px rgba(251,191,36,0.4), 3px 3px 0 #7c2d12' }}
          >
            ⛏️ MINEMATH
          </h1>
          <p className="font-pixel text-[9px] text-emerald-500 tracking-[0.3em]">LEARN · BATTLE · CONQUER</p>
        </div>

        {/* Character */}
        <div className="flex items-end justify-center gap-6 mb-6">
          <div className="flex flex-col items-center gap-1">
            <MinecraftSteve scale={1.6} />
            <span className="font-pixel text-[7px] text-emerald-400">YOU</span>
          </div>
          <div
            className="border-2 border-amber-500 bg-black/80 px-4 py-2 mb-8 animate-float"
            style={{ boxShadow: '0 0 12px rgba(251,191,36,0.4)' }}
          >
            <p className="font-pixel text-amber-300 text-[10px]">
              {isLogin ? 'WELCOME BACK!' : 'JOIN THE BATTLE!'}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1" style={{ transform: 'scaleX(-1)' }}>
            <MinecraftZombie scale={1.6} />
            <span className="font-pixel text-[7px] text-red-400" style={{ transform: 'scaleX(-1)' }}>ENEMY</span>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex mb-6 border-2 border-gray-700 bg-black/40">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 font-pixel text-[9px] tracking-wider transition-all ${
              isLogin
                ? 'bg-emerald-700 text-white border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            disabled={isLoading}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 font-pixel text-[9px] tracking-wider transition-all ${
              !isLogin
                ? 'bg-emerald-700 text-white border-b-2 border-emerald-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
            disabled={isLoading}
          >
            SIGN UP
          </button>
        </div>

        {/* Form */}
        <div className="bg-[#0d1117] border-2 border-gray-700 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">

            {!isLogin && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-pixel text-[8px] text-gray-400 block mb-1.5 tracking-wider">
                    FIRST NAME
                  </label>
                  <input
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required={!isLogin}
                    disabled={isLoading}
                    placeholder="Alex"
                    className="w-full bg-black/60 border border-gray-600 text-white text-sm px-3 py-2
                      focus:outline-none focus:border-emerald-500 placeholder:text-gray-700
                      disabled:opacity-50 transition-colors"
                    style={{ borderRadius: 0 }}
                  />
                </div>
                <div>
                  <label className="font-pixel text-[8px] text-gray-400 block mb-1.5 tracking-wider">
                    LAST NAME
                  </label>
                  <input
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="(optional)"
                    className="w-full bg-black/60 border border-gray-600 text-white text-sm px-3 py-2
                      focus:outline-none focus:border-emerald-500 placeholder:text-gray-700
                      disabled:opacity-50 transition-colors"
                    style={{ borderRadius: 0 }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-pixel text-[8px] text-gray-400 block mb-1.5 tracking-wider">
                EMAIL
              </label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="player@example.com"
                className="w-full bg-black/60 border border-gray-600 text-white text-sm px-3 py-2
                  focus:outline-none focus:border-emerald-500 placeholder:text-gray-700
                  disabled:opacity-50 transition-colors"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div>
              <label className="font-pixel text-[8px] text-gray-400 block mb-1.5 tracking-wider">
                PASSWORD
              </label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                disabled={isLoading}
                placeholder="••••••••"
                className="w-full bg-black/60 border border-gray-600 text-white text-sm px-3 py-2
                  focus:outline-none focus:border-emerald-500 placeholder:text-gray-700
                  disabled:opacity-50 transition-colors"
                style={{ borderRadius: 0 }}
              />
              {!isLogin && (
                <p className="font-pixel text-[7px] text-gray-600 mt-1.5">MIN 6 CHARACTERS</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="border border-red-700 bg-red-900/20 px-3 py-2">
                <p className="font-pixel text-[8px] text-red-400">⚠ {error.toUpperCase()}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-pixel text-[10px] text-white py-3 tracking-widest
                bg-emerald-700 border-b-4 border-emerald-900 hover:bg-emerald-600
                transition-all active:border-b-0 active:translate-y-1
                disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 mt-2"
              style={{ borderRadius: 0 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isLogin ? 'LOGGING IN...' : 'CREATING ACCOUNT...'}
                </>
              ) : (
                isLogin ? '▶ LOGIN' : '▶ CREATE ACCOUNT'
              )}
            </button>
          </form>
        </div>

        {/* Bottom note */}
        <p className="text-center font-pixel text-[7px] text-gray-700 mt-5 tracking-widest">
          FREE TO PLAY · SAFE FOR KIDS · NO ADS
        </p>

      </div>
    </div>
  );
}
