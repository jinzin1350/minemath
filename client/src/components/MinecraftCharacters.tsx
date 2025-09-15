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

export const MinecraftSkeleton = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-bounce' : 'animate-pulse'}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-skeleton"
  >
    {/* Head - Bone white skull */}
    <div className="relative w-12 h-12 mb-1 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-300 rounded-sm border border-gray-400"></div>
      <div className="absolute top-3 left-3 w-2 h-2 bg-black rounded-sm"></div>
      <div className="absolute top-3 right-3 w-2 h-2 bg-black rounded-sm"></div>
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gray-600 rounded-sm"></div>
    </div>
    {/* Body - Thin skeleton body */}
    <div className="relative w-6 h-12 mx-auto mb-1">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-400 rounded-sm border border-gray-500"></div>
      <div className="absolute top-1 left-1 right-1 h-1 bg-gray-600 rounded-sm"></div>
      <div className="absolute top-3 left-1 right-1 h-1 bg-gray-600 rounded-sm"></div>
    </div>
    {/* Arms - Holding bow */}
    <div 
      className="absolute top-12 -left-4 w-3 h-10 bg-gradient-to-br from-gray-100 to-gray-300 rounded-sm border border-gray-400"
      style={{ transform: isAttacking ? 'rotate(-45deg)' : 'rotate(-20deg)', transformOrigin: 'top center' }}
    ></div>
    <div 
      className="absolute top-12 -right-4 w-3 h-10 bg-gradient-to-br from-gray-100 to-gray-300 rounded-sm border border-gray-400"
      style={{ transform: isAttacking ? 'rotate(45deg)' : 'rotate(20deg)', transformOrigin: 'top center' }}
    ></div>
    {/* Bow - visible when attacking */}
    {isAttacking && (
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-amber-700 rounded-sm"></div>
    )}
    {/* Legs */}
    <div className="absolute -bottom-4 left-2 w-2 h-8 bg-gradient-to-br from-gray-100 to-gray-300 rounded-sm border border-gray-400"></div>
    <div className="absolute -bottom-4 right-2 w-2 h-8 bg-gradient-to-br from-gray-100 to-gray-300 rounded-sm border border-gray-400"></div>
  </div>
);

export const MinecraftCreeper = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-pulse' : ''}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-creeper"
  >
    {/* Head - Green creeper face */}
    <div className="relative w-12 h-12 mb-1 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 rounded-sm border border-green-800"></div>
      <div className="absolute top-2 left-3 w-2 h-3 bg-black rounded-sm"></div>
      <div className="absolute top-2 right-3 w-2 h-3 bg-black rounded-sm"></div>
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-black rounded-sm"></div>
      <div className="absolute top-8 left-4 w-1 h-1 bg-black rounded-sm"></div>
      <div className="absolute top-8 right-4 w-1 h-1 bg-black rounded-sm"></div>
    </div>
    {/* Body - Creeper body */}
    <div className="relative w-8 h-12 mx-auto mb-1">
      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-700 rounded-sm border border-green-800"></div>
      <div className="absolute top-2 left-1 w-2 h-2 bg-green-800 rounded-sm"></div>
      <div className="absolute top-2 right-1 w-2 h-2 bg-green-800 rounded-sm"></div>
    </div>
    {/* No arms - creepers don't have arms */}
    {/* Legs */}
    <div className="absolute -bottom-4 left-1 w-3 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-sm border border-green-800"></div>
    <div className="absolute -bottom-4 right-1 w-3 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-sm border border-green-800"></div>
    
    {/* Explosion effect when attacking */}
    {isAttacking && (
      <div className="absolute -top-4 -left-4 -right-4 -bottom-4 animate-ping">
        <div className="w-full h-full bg-orange-400 rounded-full opacity-50"></div>
      </div>
    )}
  </div>
);

export const MinecraftWitch = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-bounce' : 'animate-pulse'}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-witch"
  >
    {/* Head with witch hat */}
    <div className="relative w-12 h-12 mb-1 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-purple-500 rounded-sm border border-purple-600"></div>
      <div className="absolute -top-3 left-2 right-2 h-6 bg-gradient-to-br from-purple-800 to-purple-900 rounded-sm border border-black"></div>
      <div className="absolute top-3 left-3 w-1 h-1 bg-green-400 rounded-sm"></div>
      <div className="absolute top-3 right-3 w-1 h-1 bg-green-400 rounded-sm"></div>
      <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-purple-800 rounded-sm"></div>
      {/* Wart on nose */}
      <div className="absolute top-4 left-6 w-1 h-1 bg-green-700 rounded-sm"></div>
    </div>
    {/* Body - Purple robes */}
    <div className="relative w-8 h-12 mx-auto mb-1">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 rounded-sm border border-purple-900"></div>
      <div className="absolute top-2 left-1 w-2 h-2 bg-black rounded-sm"></div>
    </div>
    {/* Arms - One holding potion */}
    <div 
      className="absolute top-12 -left-3 w-3 h-8 bg-gradient-to-br from-purple-300 to-purple-500 rounded-sm border border-purple-600"
      style={{ transform: 'rotate(-20deg)', transformOrigin: 'top center' }}
    ></div>
    <div 
      className="absolute top-12 -right-3 w-3 h-8 bg-gradient-to-br from-purple-300 to-purple-500 rounded-sm border border-purple-600"
      style={{ transform: isAttacking ? 'rotate(45deg)' : 'rotate(20deg)', transformOrigin: 'top center' }}
    ></div>
    {/* Potion bottle */}
    {isAttacking && (
      <div className="absolute top-10 right-1 w-2 h-3 bg-gradient-to-br from-green-400 to-green-600 rounded-sm border border-green-700"></div>
    )}
    {/* Legs */}
    <div className="absolute -bottom-4 left-1 w-3 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm border border-black"></div>
    <div className="absolute -bottom-4 right-1 w-3 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm border border-black"></div>
  </div>
);

export const MinecraftDragon = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-bounce' : 'animate-pulse'}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-dragon"
  >
    {/* Dragon Head - Large and menacing */}
    <div className="relative w-16 h-14 mb-1 mx-auto">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black rounded-sm border border-gray-900"></div>
      <div className="absolute top-2 left-4 w-2 h-2 bg-purple-500 rounded-sm"></div>
      <div className="absolute top-2 right-4 w-2 h-2 bg-purple-500 rounded-sm"></div>
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-red-600 rounded-sm"></div>
      {/* Horns */}
      <div className="absolute -top-2 left-3 w-2 h-4 bg-gray-600 rounded-sm rotate-12"></div>
      <div className="absolute -top-2 right-3 w-2 h-4 bg-gray-600 rounded-sm -rotate-12"></div>
      {/* Fire breath when attacking */}
      {isAttacking && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-8 h-3 bg-gradient-to-r from-red-500 to-orange-400 rounded-sm opacity-80"></div>
      )}
    </div>
    {/* Body - Large dragon body */}
    <div className="relative w-12 h-16 mx-auto mb-1">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm border border-black"></div>
      <div className="absolute top-2 left-2 w-3 h-3 bg-purple-800 rounded-sm"></div>
      <div className="absolute top-6 right-2 w-3 h-3 bg-purple-800 rounded-sm"></div>
    </div>
    {/* Wings */}
    <div 
      className="absolute top-14 -left-6 w-8 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-sm border border-gray-900"
      style={{ transform: isAttacking ? 'rotate(-20deg)' : 'rotate(-10deg)', transformOrigin: 'bottom right' }}
    ></div>
    <div 
      className="absolute top-14 -right-6 w-8 h-12 bg-gradient-to-br from-gray-600 to-gray-800 rounded-sm border border-gray-900"
      style={{ transform: isAttacking ? 'rotate(20deg)' : 'rotate(10deg)', transformOrigin: 'bottom left' }}
    ></div>
    {/* Legs - Dragon claws */}
    <div className="absolute -bottom-4 left-2 w-4 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm border border-black"></div>
    <div className="absolute -bottom-4 right-2 w-4 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm border border-black"></div>
    
    {/* Tail */}
    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-3 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-sm border border-black rotate-45"></div>
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