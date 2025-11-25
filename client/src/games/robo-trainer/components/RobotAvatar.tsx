
import React from 'react';
import { RobotColor } from '../types';

interface RobotAvatarProps {
  color: RobotColor;
  seed?: number;
  isHappy?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<RobotColor, { bg: string, accent: string, glow: string }> = {
  [RobotColor.RED]: { bg: 'fill-red-500', accent: 'fill-red-700', glow: 'drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]' },
  [RobotColor.BLUE]: { bg: 'fill-blue-500', accent: 'fill-blue-700', glow: 'drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]' },
  [RobotColor.GREEN]: { bg: 'fill-green-500', accent: 'fill-green-700', glow: 'drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]' },
  [RobotColor.PURPLE]: { bg: 'fill-purple-500', accent: 'fill-purple-700', glow: 'drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]' },
  [RobotColor.ORANGE]: { bg: 'fill-orange-500', accent: 'fill-orange-700', glow: 'drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]' },
};

export const RobotAvatar: React.FC<RobotAvatarProps> = ({ color, isHappy = true, isThinking = false, size = 'md' }) => {
  const styles = colorMap[color];
  // Using explicit classes for size to ensure Tailwind picks them up
  let sizeClass = 'w-32 h-32';
  if (size === 'sm') sizeClass = 'w-12 h-12 md:w-16 md:h-16';
  if (size === 'lg') sizeClass = 'w-48 h-48 md:w-64 md:h-64';

  const antennaClass = isThinking ? 'animate-pulse' : '';

  return (
    <div className={`${sizeClass} transition-all duration-500 ${isThinking ? 'scale-105' : ''}`}>
      <svg viewBox="0 0 200 200" className={`w-full h-full ${styles.glow}`}>
        {/* Antenna */}
        <rect x="95" y="10" width="10" height="30" className="fill-gray-400" />
        <circle cx="100" cy="10" r="8" className={`${styles.accent} ${antennaClass}`} />

        {/* Head */}
        <rect x="40" y="40" width="120" height="100" rx="20" className={styles.bg} />

        {/* Screen/Face */}
        <rect x="55" y="60" width="90" height="60" rx="10" className="fill-slate-900" />

        {/* Eyes */}
        {isThinking ? (
            <>
             <circle cx="80" cy="85" r="8" className="fill-cyan-400 animate-bounce" style={{ animationDelay: '0s' }} />
             <circle cx="100" cy="85" r="8" className="fill-cyan-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
             <circle cx="120" cy="85" r="8" className="fill-cyan-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
            </>
        ) : (
            <>
                <circle cx="75" cy="85" r="10" className="fill-cyan-300" />
                <circle cx="125" cy="85" r="10" className="fill-cyan-300" />
                {/* Mouth */}
                {isHappy ? (
                    <path d="M 75 105 Q 100 120 125 105" fill="none" stroke="cyan" strokeWidth="4" strokeLinecap="round" />
                ) : (
                    <line x1="75" y1="110" x2="125" y2="110" stroke="cyan" strokeWidth="4" strokeLinecap="round" />
                )}
            </>
        )}

        {/* Ears */}
        <rect x="25" y="75" width="15" height="30" rx="5" className={styles.accent} />
        <rect x="160" y="75" width="15" height="30" rx="5" className={styles.accent} />

        {/* Neck */}
        <rect x="70" y="140" width="60" height="20" className="fill-gray-400" />

        {/* Body Top */}
        <path d="M 50 160 Q 100 160 150 160 L 150 200 L 50 200 Z" className={styles.bg} />
      </svg>
    </div>
  );
};
