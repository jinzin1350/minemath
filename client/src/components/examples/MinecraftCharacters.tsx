import { MinecraftSteve, MinecraftZombie, MinecraftBlock } from '../MinecraftCharacters';

export default function MinecraftCharactersExample() {
  return (
    <div className="p-8 bg-gradient-to-b from-blue-800 to-green-800 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-pixel text-white text-center">Minecraft Characters</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Steve variations */}
          <div className="bg-card p-6 rounded-lg border border-card-border">
            <h2 className="text-lg font-pixel text-card-foreground mb-4">Steve</h2>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <MinecraftSteve />
                <p className="text-sm text-muted-foreground mt-2">Normal</p>
              </div>
              <div className="text-center">
                <MinecraftSteve isDefending={true} />
                <p className="text-sm text-muted-foreground mt-2">Defending</p>
              </div>
              <div className="text-center">
                <MinecraftSteve scale={1.5} />
                <p className="text-sm text-muted-foreground mt-2">Large</p>
              </div>
            </div>
          </div>

          {/* Zombie variations */}
          <div className="bg-card p-6 rounded-lg border border-card-border">
            <h2 className="text-lg font-pixel text-card-foreground mb-4">Zombie</h2>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <MinecraftZombie />
                <p className="text-sm text-muted-foreground mt-2">Normal</p>
              </div>
              <div className="text-center">
                <MinecraftZombie isAttacking={true} />
                <p className="text-sm text-muted-foreground mt-2">Attacking</p>
              </div>
              <div className="text-center">
                <MinecraftZombie scale={0.8} />
                <p className="text-sm text-muted-foreground mt-2">Small</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blocks */}
        <div className="bg-card p-6 rounded-lg border border-card-border">
          <h2 className="text-lg font-pixel text-card-foreground mb-4">Blocks</h2>
          <div className="flex items-center justify-around">
            <div className="text-center">
              <MinecraftBlock type="grass" size={32} />
              <p className="text-sm text-muted-foreground mt-2">Grass</p>
            </div>
            <div className="text-center">
              <MinecraftBlock type="dirt" size={32} />
              <p className="text-sm text-muted-foreground mt-2">Dirt</p>
            </div>
            <div className="text-center">
              <MinecraftBlock type="stone" size={32} />
              <p className="text-sm text-muted-foreground mt-2">Stone</p>
            </div>
            <div className="text-center">
              <MinecraftBlock type="diamond" size={32} />
              <p className="text-sm text-muted-foreground mt-2">Diamond</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}