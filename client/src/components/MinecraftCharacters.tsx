interface MinecraftCharacterProps {
  isDefending?: boolean;
  isAttacking?: boolean;
  scale?: number;
}

export const MinecraftSteve = ({ isDefending = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isDefending ? 'animate-pulse' : ''}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-steve"
  >
    {/* Head */}
    <div className="relative w-12 h-12 mb-1 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-orange-300 rounded-sm border border-orange-400"></div>
      <div className="absolute top-0 left-2 right-2 h-2 bg-amber-800 rounded-sm"></div>
      <div className="absolute top-3 left-3 w-1 h-1 bg-cyan-600 rounded-sm"></div>
      <div className="absolute top-3 right-3 w-1 h-1 bg-cyan-600 rounded-sm"></div>
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-orange-600 rounded-sm"></div>
    </div>
    {/* Body */}
    <div className="relative w-8 h-12 mx-auto mb-1">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-sm border border-cyan-600"></div>
    </div>
    {/* Arms */}
    <div 
      className="absolute top-12 -left-2 w-3 h-8 bg-gradient-to-br from-orange-200 to-orange-300 rounded-sm border border-orange-400"
      style={{ transform: isDefending ? 'rotate(-45deg)' : 'rotate(-10deg)', transformOrigin: 'top center' }}
    ></div>
    <div 
      className="absolute top-12 -right-2 w-3 h-8 bg-gradient-to-br from-orange-200 to-orange-300 rounded-sm border border-orange-400"
      style={{ transform: isDefending ? 'rotate(45deg)' : 'rotate(10deg)', transformOrigin: 'top center' }}
    ></div>
    {/* Legs */}
    <div className="absolute -bottom-4 left-1 w-3 h-8 bg-gradient-to-br from-blue-800 to-blue-900 rounded-sm border border-blue-900"></div>
    <div className="absolute -bottom-4 right-1 w-3 h-8 bg-gradient-to-br from-blue-800 to-blue-900 rounded-sm border border-blue-900"></div>
    
    {isDefending && (
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-yellow-300 font-pixel text-xs animate-bounce">⚡</div>
    )}
  </div>
);

export const MinecraftZombie = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-bounce' : 'animate-pulse'}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-zombie"
  >
    {/* Head */}
    <div className="relative w-12 h-12 mb-1 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-sm border border-green-700"></div>
      <div className="absolute top-0 left-2 right-2 h-2 bg-green-700 rounded-sm"></div>
      <div className="absolute top-3 left-3 w-1 h-1 bg-red-600 rounded-sm"></div>
      <div className="absolute top-3 right-3 w-1 h-1 bg-gray-200 rounded-sm"></div>
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-gray-800 rounded-sm"></div>
    </div>
    {/* Body */}
    <div className="relative w-8 h-12 mx-auto mb-1">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-sm border border-cyan-800"></div>
      <div className="absolute top-2 left-1 w-2 h-2 bg-gray-700 rounded-sm"></div>
    </div>
    {/* Arms */}
    <div 
      className="absolute top-12 -left-3 w-3 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-sm border border-green-700"
      style={{ transform: 'rotate(-30deg)', transformOrigin: 'top center' }}
    ></div>
    <div 
      className="absolute top-12 -right-3 w-3 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-sm border border-green-700"
      style={{ transform: 'rotate(30deg)', transformOrigin: 'top center' }}
    ></div>
    {/* Legs */}
    <div className="absolute -bottom-4 left-1 w-3 h-8 bg-gradient-to-br from-blue-700 to-blue-800 rounded-sm border border-blue-900"></div>
    <div className="absolute -bottom-4 right-1 w-3 h-8 bg-gradient-to-br from-blue-700 to-blue-800 rounded-sm border border-blue-900"></div>
  </div>
);

interface MinecraftBlockProps {
  type: 'grass' | 'dirt' | 'stone' | 'diamond';
  size?: number;
}

export const MinecraftBlock = ({ type, size = 16 }: MinecraftBlockProps) => {
  const blockStyles = {
    grass: 'bg-gradient-to-b from-green-400 to-green-600 border-green-700',
    dirt: 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-900',
    stone: 'bg-gradient-to-b from-gray-500 to-gray-700 border-gray-800',
    diamond: 'bg-gradient-to-b from-cyan-400 to-cyan-600 border-cyan-700'
  };
  
  return (
    <div 
      className={`${blockStyles[type]} border-2 rounded-sm shadow-lg`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        imageRendering: 'pixelated'
      }}
      data-testid={`block-${type}`}
    ></div>
  );
};