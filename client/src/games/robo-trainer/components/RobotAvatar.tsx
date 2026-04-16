
import React from 'react';
import { RobotColor } from '../types';

interface RobotAvatarProps {
  color: RobotColor;
  seed?: number;
  isHappy?: boolean;
  isThinking?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const colorMap: Record<RobotColor, { body: string; accent: string; dark: string; shadow: string }> = {
  [RobotColor.RED]:    { body: '#ef4444', accent: '#991b1b', dark: '#7f1d1d', shadow: '0 0 20px rgba(239,68,68,0.6)' },
  [RobotColor.BLUE]:   { body: '#3b82f6', accent: '#1e40af', dark: '#1e3a8a', shadow: '0 0 20px rgba(59,130,246,0.6)' },
  [RobotColor.GREEN]:  { body: '#22c55e', accent: '#15803d', dark: '#14532d', shadow: '0 0 20px rgba(34,197,94,0.6)' },
  [RobotColor.PURPLE]: { body: '#a855f7', accent: '#7e22ce', dark: '#581c87', shadow: '0 0 20px rgba(168,85,247,0.6)' },
  [RobotColor.ORANGE]: { body: '#f97316', accent: '#c2410c', dark: '#9a3412', shadow: '0 0 20px rgba(249,115,22,0.6)' },
};

export const RobotAvatar: React.FC<RobotAvatarProps> = ({
  color,
  isHappy = true,
  isThinking = false,
  size = 'md',
}) => {
  const c = colorMap[color] ?? colorMap[RobotColor.BLUE];
  const SCREEN = '#050d14';
  const SCREEN_INNER = '#0a1628';
  const GRAY = '#6b7280';
  const GRAY_DARK = '#374151';
  const EYE_COLOR = isThinking ? '#fbbf24' : '#67e8f9';
  const PUPIL = '#020810';
  const MOUTH_CLR = '#67e8f9';

  let sizeClass = 'w-28 h-32';
  if (size === 'sm') sizeClass = 'w-10 h-11';
  if (size === 'lg') sizeClass = 'w-52 h-60 md:w-64 md:h-72';

  // For happy state: arms rotated up around shoulder pivot
  const leftArmProps = isHappy
    ? { transform: 'rotate(-55 8 74)' }
    : {};
  const rightArmProps = isHappy
    ? { transform: 'rotate(55 92 74)' }
    : {};

  return (
    <div
      className={`${sizeClass} transition-all duration-500 select-none`}
      style={{ imageRendering: 'pixelated' }}
    >
      <svg
        viewBox="0 0 100 130"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          imageRendering: 'pixelated',
          filter: `drop-shadow(${c.shadow})`,
        }}
      >
        {/* ── Antenna pole ── */}
        <rect x="46" y="0" width="8" height="9" fill={GRAY} />
        {/* Antenna tip — pulses when thinking */}
        <rect
          x="43" y="0" width="14" height="7"
          fill={c.body}
          opacity={isThinking ? undefined : 1}
          className={isThinking ? 'animate-pulse' : ''}
        />
        {/* Antenna tip glow dot */}
        <rect x="47" y="1" width="6" height="4" fill={EYE_COLOR} opacity="0.8" />

        {/* ── Head block ── */}
        <rect x="10" y="5" width="80" height="60" fill={c.body} />
        {/* Head highlight (top edge) */}
        <rect x="10" y="5" width="80" height="4" fill={c.accent} opacity="0.5" />
        {/* Head shadow (right + bottom edges) */}
        <rect x="86" y="5" width="4" height="60" fill={c.dark} opacity="0.6" />
        <rect x="10" y="61" width="80" height="4" fill={c.dark} opacity="0.6" />

        {/* ── Face screen ── */}
        <rect x="17" y="12" width="66" height="46" fill={SCREEN} />
        <rect x="19" y="14" width="62" height="42" fill={SCREEN_INNER} />

        {/* ── Left eye ── */}
        <rect x="22" y="18" width="22" height="16" fill={EYE_COLOR}
          className={isThinking ? 'animate-pulse' : ''}
        />
        {/* Left eye inner */}
        <rect x="25" y="21" width="16" height="10" fill={c.dark} />
        {/* Left pupil */}
        <rect
          x="27" y="23" width="10" height="6"
          fill={PUPIL}
          className={isThinking ? 'animate-bounce' : ''}
          style={isThinking ? { animationDelay: '0ms' } : {}}
        />
        {/* Left eye glint */}
        <rect x="30" y="22" width="3" height="2" fill={EYE_COLOR} opacity="0.9" />

        {/* ── Right eye ── */}
        <rect x="56" y="18" width="22" height="16" fill={EYE_COLOR}
          className={isThinking ? 'animate-pulse' : ''}
        />
        {/* Right eye inner */}
        <rect x="59" y="21" width="16" height="10" fill={c.dark} />
        {/* Right pupil */}
        <rect
          x="61" y="23" width="10" height="6"
          fill={PUPIL}
          className={isThinking ? 'animate-bounce' : ''}
          style={isThinking ? { animationDelay: '100ms' } : {}}
        />
        {/* Right eye glint */}
        <rect x="64" y="22" width="3" height="2" fill={EYE_COLOR} opacity="0.9" />

        {/* ── Mouth ── */}
        {isThinking ? (
          /* Thinking: 3 bouncing dots */
          <>
            <rect x="33" y="43" width="6" height="6" fill={EYE_COLOR} className="animate-bounce" style={{ animationDelay: '0ms' }} />
            <rect x="47" y="43" width="6" height="6" fill={EYE_COLOR} className="animate-bounce" style={{ animationDelay: '120ms' }} />
            <rect x="61" y="43" width="6" height="6" fill={EYE_COLOR} className="animate-bounce" style={{ animationDelay: '240ms' }} />
          </>
        ) : isHappy ? (
          /* Happy: pixel-art staircase smile */
          <>
            <rect x="24" y="41" width="6" height="4" fill={MOUTH_CLR} />
            <rect x="30" y="44" width="6" height="4" fill={MOUTH_CLR} />
            <rect x="36" y="46" width="28" height="4" fill={MOUTH_CLR} />
            <rect x="64" y="44" width="6" height="4" fill={MOUTH_CLR} />
            <rect x="70" y="41" width="6" height="4" fill={MOUTH_CLR} />
          </>
        ) : (
          /* Neutral: flat line */
          <rect x="28" y="43" width="44" height="5" fill={MOUTH_CLR} />
        )}

        {/* ── Ears ── */}
        <rect x="3" y="18" width="7" height="24" fill={c.accent} />
        <rect x="90" y="18" width="7" height="24" fill={c.accent} />
        {/* Ear detail lights */}
        <rect x="4" y="22" width="5" height="4" fill={EYE_COLOR} opacity="0.7" />
        <rect x="91" y="22" width="5" height="4" fill={EYE_COLOR} opacity="0.7" />
        <rect x="4" y="30" width="5" height="4" fill={c.body} opacity="0.7" />
        <rect x="91" y="30" width="5" height="4" fill={c.body} opacity="0.7" />

        {/* ── Neck ── */}
        <rect x="38" y="65" width="8" height="9" fill={GRAY_DARK} />
        <rect x="46" y="65" width="8" height="9" fill={GRAY} />
        <rect x="54" y="65" width="8" height="9" fill={GRAY_DARK} />

        {/* ── Body ── */}
        <rect x="14" y="74" width="72" height="40" fill={c.body} />
        {/* Body highlight */}
        <rect x="14" y="74" width="72" height="3" fill={c.accent} opacity="0.5" />
        {/* Body shadow */}
        <rect x="82" y="74" width="4" height="40" fill={c.dark} opacity="0.6" />

        {/* Chest screen */}
        <rect x="22" y="81" width="56" height="26" fill={SCREEN} />
        <rect x="24" y="83" width="52" height="22" fill={SCREEN_INNER} />

        {/* Chest display details */}
        <rect x="28" y="87" width="18" height="4" fill={c.body} opacity="0.9" />
        <rect x="28" y="95" width="14" height="4" fill={c.accent} opacity="0.9" />
        <rect x="54" y="87" width="8" height="4" fill={EYE_COLOR} opacity="0.8" />
        <rect x="54" y="95" width="12" height="4" fill={EYE_COLOR} opacity="0.5" />
        {/* Blinking indicator */}
        <rect x="67" y="87" width="5" height="5" fill={EYE_COLOR}
          className={isThinking ? 'animate-pulse' : ''}
          opacity={isThinking ? 1 : 0.4}
        />

        {/* ── Left arm ── */}
        <rect x="2" y="74" width="12" height="30" fill={c.body} {...leftArmProps} />
        <rect x="4" y="74" width="8" height="30" fill={c.accent} opacity="0.3" {...leftArmProps} />
        {/* Left hand */}
        <rect x="2" y="104" width="12" height="8" fill={c.dark} {...leftArmProps} />

        {/* ── Right arm ── */}
        <rect x="86" y="74" width="12" height="30" fill={c.body} {...rightArmProps} />
        <rect x="88" y="74" width="8" height="30" fill={c.accent} opacity="0.3" {...rightArmProps} />
        {/* Right hand */}
        <rect x="86" y="104" width="12" height="8" fill={c.dark} {...rightArmProps} />

        {/* ── Legs ── */}
        <rect x="24" y="114" width="20" height="16" fill={c.accent} />
        <rect x="56" y="114" width="20" height="16" fill={c.accent} />
        {/* Feet */}
        <rect x="22" y="127" width="24" height="3" fill={c.body} />
        <rect x="54" y="127" width="24" height="3" fill={c.body} />

        {/* Leg detail lines */}
        <rect x="24" y="118" width="20" height="2" fill={c.dark} opacity="0.4" />
        <rect x="56" y="118" width="20" height="2" fill={c.dark} opacity="0.4" />
      </svg>
    </div>
  );
};
