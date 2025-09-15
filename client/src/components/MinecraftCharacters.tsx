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
    <img 
      src="/steve-minecraft.png" 
      alt="Minecraft Steve" 
      className="w-16 h-16 pixelated"
      style={{ 
        imageRendering: 'pixelated',
        transform: isDefending ? 'rotate(-5deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        maxWidth: '100%',
        height: 'auto'
      }}
      onError={(e) => {
        console.error('Failed to load Steve image, trying alternative path');
        // Try alternative paths if first one fails
        const alternatives = [
          './steve-minecraft.png',
          'steve-minecraft.png',
          '/public/steve-minecraft.png'
        ];
        const current = e.currentTarget as HTMLImageElement;
        const currentSrc = current.src;
        
        for (const alt of alternatives) {
          if (!currentSrc.includes(alt.replace('./', ''))) {
            current.src = alt;
            return;
          }
        }
        
        // If all paths fail, hide the image and show fallback
        current.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'w-16 h-16 bg-blue-500 flex items-center justify-center text-white font-bold text-xs';
        fallback.textContent = 'STEVE';
        current.parentNode?.appendChild(fallback);
      }}
      onLoad={(e) => {
        console.log('Steve image loaded successfully');
      }}
    />
    
    {isDefending && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-yellow-300 font-pixel text-xs animate-bounce">⚡</div>
    )}
  </div>
);

export const MinecraftZombie = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-bounce' : ''}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-zombie"
  >
    <img 
      src="/zombie-minecraft.png" 
      alt="Minecraft Zombie" 
      className="w-16 h-16 pixelated"
      style={{ 
        imageRendering: 'pixelated',
        transform: isAttacking ? 'rotate(-10deg)' : 'rotate(0deg)',
        transition: 'transform 0.3s ease',
        maxWidth: '100%',
        height: 'auto'
      }}
      onError={(e) => {
        console.error('Failed to load Zombie image, trying alternative path');
        // Try alternative paths if first one fails
        const alternatives = [
          './zombie-minecraft.png',
          'zombie-minecraft.png',
          '/public/zombie-minecraft.png'
        ];
        const current = e.currentTarget as HTMLImageElement;
        const currentSrc = current.src;
        
        for (const alt of alternatives) {
          if (!currentSrc.includes(alt.replace('./', ''))) {
            current.src = alt;
            return;
          }
        }
        
        // If all paths fail, hide the image and show fallback
        current.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'w-16 h-16 bg-green-600 flex items-center justify-center text-white font-bold text-xs';
        fallback.textContent = 'ZOMBIE';
        current.parentNode?.appendChild(fallback);
      }}
      onLoad={(e) => {
        console.log('Zombie image loaded successfully');
      }}
    />
    
    {isAttacking && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-green-400 font-pixel text-xs animate-bounce">🧟</div>
    )}
  </div>
);

export const MinecraftSkeleton = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-pulse' : ''}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-skeleton"
  >
    <img 
      src="/skeleton-minecraft.png" 
      alt="Minecraft Skeleton" 
      className="w-16 h-16 pixelated"
      style={{ 
        imageRendering: 'pixelated',
        transform: isAttacking ? 'rotate(-5deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        maxWidth: '100%',
        height: 'auto'
      }}
      onError={(e) => {
        console.error('Failed to load Skeleton image, trying alternative path');
        // Try alternative paths if first one fails
        const alternatives = [
          './skeleton-minecraft.png',
          'skeleton-minecraft.png',
          '/public/skeleton-minecraft.png'
        ];
        const current = e.currentTarget as HTMLImageElement;
        const currentSrc = current.src;
        
        for (const alt of alternatives) {
          if (!currentSrc.includes(alt.replace('./', ''))) {
            current.src = alt;
            return;
          }
        }
        
        // If all paths fail, hide the image and show fallback
        current.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'w-16 h-16 bg-gray-200 flex items-center justify-center text-black font-bold text-xs';
        fallback.textContent = 'SKELETON';
        current.parentNode?.appendChild(fallback);
      }}
      onLoad={(e) => {
        console.log('Skeleton image loaded successfully');
      }}
    />
    
    {isAttacking && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-orange-400 font-pixel text-xs animate-bounce">🏹</div>
    )}
  </div>
);

export const MinecraftCreeper = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-pulse' : ''}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-creeper"
  >
    <img 
      src="/creeper-minecraft.png" 
      alt="Minecraft Creeper" 
      className="w-16 h-16 pixelated"
      style={{ 
        imageRendering: 'pixelated',
        transform: isAttacking ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.2s ease',
        maxWidth: '100%',
        height: 'auto'
      }}
      onError={(e) => {
        console.error('Failed to load Creeper image, trying alternative path');
        // Try alternative paths if first one fails
        const alternatives = [
          './creeper-minecraft.png',
          'creeper-minecraft.png',
          '/public/creeper-minecraft.png'
        ];
        const current = e.currentTarget as HTMLImageElement;
        const currentSrc = current.src;
        
        for (const alt of alternatives) {
          if (!currentSrc.includes(alt.replace('./', ''))) {
            current.src = alt;
            return;
          }
        }
        
        // If all paths fail, hide the image and show fallback
        current.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = 'w-16 h-16 bg-green-500 flex items-center justify-center text-white font-bold text-xs';
        fallback.textContent = 'CREEPER';
        current.parentNode?.appendChild(fallback);
      }}
      onLoad={(e) => {
        console.log('Creeper image loaded successfully');
      }}
    />
    
    {/* Explosion effect when attacking */}
    {isAttacking && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-red-500 font-pixel text-xs animate-bounce">💥</div>
    )}
  </div>
);

export const MinecraftWitch = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-witch"
  >
    {/* Head with large witch hat */}
    <div className="relative w-16 h-20 mb-1 mx-auto">
      {/* Witch hat - black with purple band */}
      <div className="absolute -top-8 left-2 right-2 h-12 bg-black"></div>
      <div className="absolute -top-6 left-1 right-1 h-2 bg-purple-600"></div>
      
      {/* Villager-like face */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-orange-200"></div>
      
      {/* Eyes */}
      <div className="absolute top-4 left-4 w-2 h-2 bg-black"></div>
      <div className="absolute top-4 right-4 w-2 h-2 bg-black"></div>
      
      {/* Long protruding nose with wart */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-2 h-4 bg-orange-300"></div>
      <div className="absolute top-7 left-9 w-1 h-1 bg-green-700"></div>
      
      {/* Mouth */}
      <div className="absolute top-11 left-6 w-4 h-1 bg-orange-300"></div>
    </div>
    
    {/* Body - Deep purple robe */}
    <div className="relative w-16 h-24 mx-auto mb-1">
      <div className="absolute inset-0 bg-purple-800"></div>
      {/* Robe details */}
      <div className="absolute top-0 left-2 right-2 h-3 bg-purple-900"></div>
      <div className="absolute top-8 left-4 w-2 h-2 bg-purple-700"></div>
    </div>
    
    {/* Arms - folded when idle, potion when attacking */}
    <div 
      className="absolute top-16 -left-4 w-4 h-12 bg-orange-200"
      style={{ 
        transform: isAttacking ? 'rotate(-30deg)' : 'rotate(-10deg)', 
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease'
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-8 bg-purple-800"></div>
    </div>
    <div 
      className="absolute top-16 -right-4 w-4 h-12 bg-orange-200"
      style={{ 
        transform: isAttacking ? 'rotate(30deg)' : 'rotate(10deg)', 
        transformOrigin: 'top center',
        transition: 'transform 0.2s ease'
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-8 bg-purple-800"></div>
    </div>
    
    {/* Potion bottle when attacking */}
    {isAttacking && (
      <div className="absolute top-12 right-0 w-3 h-4 bg-green-400">
        <div className="absolute top-0 left-1 right-1 h-1 bg-gray-600"></div>
      </div>
    )}
    
    {/* Legs - hidden under robe */}
    <div className="absolute -bottom-12 left-3 w-4 h-12 bg-gray-800"></div>
    <div className="absolute -bottom-12 right-3 w-4 h-12 bg-gray-800"></div>
  </div>
);

export const MinecraftDragon = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-dragon"
  >
    {/* Ender Dragon Head - No horns, purple features */}
    <div className="relative w-20 h-16 mb-1 mx-auto">
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Purple glowing eyes */}
      <div className="absolute top-4 left-4 w-3 h-3 bg-purple-400"></div>
      <div className="absolute top-4 right-4 w-3 h-3 bg-purple-400"></div>
      
      {/* Dragon snout */}
      <div className="absolute top-8 left-6 w-8 h-4 bg-gray-900"></div>
      
      {/* Purple breath when attacking */}
      {isAttacking && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-12 h-4 bg-purple-500 opacity-80">
          <div className="absolute left-2 top-1 w-2 h-2 bg-purple-300"></div>
          <div className="absolute right-2 top-1 w-2 h-2 bg-purple-300"></div>
        </div>
      )}
    </div>
    
    {/* Body - Large black dragon body */}
    <div className="relative w-16 h-24 mx-auto mb-1">
      <div className="absolute inset-0 bg-black"></div>
      {/* Purple accents */}
      <div className="absolute top-4 left-2 w-4 h-4 bg-purple-900"></div>
      <div className="absolute top-12 right-2 w-4 h-4 bg-purple-900"></div>
      <div className="absolute top-20 left-6 w-4 h-4 bg-purple-900"></div>
    </div>
    
    {/* Large Dark Wings */}
    <div 
      className="absolute top-16 -left-8 w-12 h-16 bg-gray-900"
      style={{ 
        transform: isAttacking ? 'rotate(-25deg)' : 'rotate(-15deg)', 
        transformOrigin: 'bottom right',
        transition: 'transform 0.3s ease'
      }}
    >
      {/* Wing membrane details */}
      <div className="absolute top-2 left-2 w-8 h-12 bg-gray-800"></div>
    </div>
    <div 
      className="absolute top-16 -right-8 w-12 h-16 bg-gray-900"
      style={{ 
        transform: isAttacking ? 'rotate(25deg)' : 'rotate(15deg)', 
        transformOrigin: 'bottom left',
        transition: 'transform 0.3s ease'
      }}
    >
      {/* Wing membrane details */}
      <div className="absolute top-2 right-2 w-8 h-12 bg-gray-800"></div>
    </div>
    
    {/* Dragon Claws */}
    <div className="absolute -bottom-8 left-2 w-5 h-8 bg-gray-900"></div>
    <div className="absolute -bottom-8 right-2 w-5 h-8 bg-gray-900"></div>
    
    {/* Long Dragon Tail */}
    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-4 h-12 bg-black"></div>
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