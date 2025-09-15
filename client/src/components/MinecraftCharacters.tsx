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
    className={`relative inline-block ${isAttacking ? 'animate-bounce' : ''}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-witch"
  >
    <img 
      src="/witch-minecraft.png" 
      alt="Minecraft Witch" 
      className="w-16 h-16 pixelated"
      style={{ 
        imageRendering: 'pixelated',
        transform: isAttacking ? 'rotate(-3deg) scale(1.05)' : 'rotate(0deg) scale(1)',
        transition: 'transform 0.2s ease',
        maxWidth: '100%',
        height: 'auto'
      }}
      onError={(e) => {
        console.error('Failed to load Witch image, trying alternative path');
        // Try alternative paths if first one fails
        const alternatives = [
          './witch-minecraft.png',
          'witch-minecraft.png',
          '/public/witch-minecraft.png'
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
        fallback.className = 'w-16 h-16 bg-purple-800 flex items-center justify-center text-white font-bold text-xs';
        fallback.textContent = 'WITCH';
        current.parentNode?.appendChild(fallback);
      }}
      onLoad={(e) => {
        console.log('Witch image loaded successfully');
      }}
    />
    
    {/* Potion effect when attacking */}
    {isAttacking && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-purple-500 font-pixel text-xs animate-bounce">🧪</div>
    )}
  </div>
);

export const MinecraftDragon = ({ isAttacking = false, scale = 1 }: MinecraftCharacterProps) => (
  <div 
    className={`relative inline-block ${isAttacking ? 'animate-pulse' : ''}`} 
    style={{ transform: `scale(${scale})`, imageRendering: 'pixelated' }}
    data-testid="character-dragon"
  >
    <img 
      src="/dragon-minecraft.png" 
      alt="Minecraft Ender Dragon" 
      className="w-20 h-20 pixelated"
      style={{ 
        imageRendering: 'pixelated',
        transform: isAttacking ? 'rotate(-5deg) scale(1.1)' : 'rotate(0deg) scale(1)',
        transition: 'transform 0.3s ease',
        maxWidth: '100%',
        height: 'auto'
      }}
      onError={(e) => {
        console.error('Failed to load Dragon image, trying alternative path');
        // Try alternative paths if first one fails
        const alternatives = [
          './dragon-minecraft.png',
          'dragon-minecraft.png',
          '/public/dragon-minecraft.png'
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
        fallback.className = 'w-20 h-20 bg-black flex items-center justify-center text-purple-400 font-bold text-xs';
        fallback.textContent = 'DRAGON';
        current.parentNode?.appendChild(fallback);
      }}
      onLoad={(e) => {
        console.log('Dragon image loaded successfully');
      }}
    />
    
    {/* Purple breath effect when attacking */}
    {isAttacking && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-purple-500 font-pixel text-xs animate-bounce">🐉</div>
    )}
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