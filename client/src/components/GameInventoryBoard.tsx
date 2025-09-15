import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Sparkles } from 'lucide-react';

interface InventoryItem {
  id: string;
  selectedAt: string;
  pointsWhenSelected: number;
  reward: {
    id: string;
    name: string;
    description: string;
    itemType: string;
    iconName: string;
    rarity: string;
  };
}

interface GameInventoryBoardProps {
  onInventoryUpdate?: () => void;
}

// Minecraft item icon mapping
const getItemIcon = (iconName: string) => {
  const iconMap: Record<string, string> = {
    'diamond_sword': '⚔️',
    'golden_apple': '🍎',
    'tnt': '💣',
    'emerald': '💚',
    'iron_pickaxe': '⛏️',
    'redstone': '🔴',
    'enchanted_book': '📜',
    'diamond_block': '💎',
    'fire_potion': '🔥',
    'speed_potion': '💨',
    'cake': '🎂',
    'chest': '📦',
    'bow': '🏹',
    'ender_pearl': '🔮',
    'shield': '🛡️',
  };
  return iconMap[iconName] || '📦';
};

// Rarity colors for slot borders
const getRarityBorderColor = (rarity: string) => {
  const colors = {
    'common': 'border-gray-400',
    'rare': 'border-blue-400',
    'epic': 'border-purple-400',
    'legendary': 'border-yellow-400',
  };
  return colors[rarity as keyof typeof colors] || 'border-gray-400';
};

// Rarity glow effect
const getRarityGlow = (rarity: string) => {
  const glows = {
    'common': 'shadow-sm',
    'rare': 'shadow-blue-500/50 shadow-md',
    'epic': 'shadow-purple-500/50 shadow-lg',
    'legendary': 'shadow-yellow-500/50 shadow-xl',
  };
  return glows[rarity as keyof typeof glows] || 'shadow-sm';
};

export function GameInventoryBoard({ onInventoryUpdate }: GameInventoryBoardProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  useEffect(() => {
    fetchInventory();
    // Poll for inventory updates every 2 seconds during gameplay
    const interval = setInterval(fetchInventory, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
        onInventoryUpdate?.();
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  // Create 24 slots (4x6 grid) - expanded inventory
  const totalSlots = 24;
  const slots = Array.from({ length: totalSlots }, (_, index) => {
    const item = inventory[index];
    return { id: index, item };
  });

  const selectedItem = selectedSlot !== null ? slots[selectedSlot]?.item : null;

  return (
    <Card className="bg-black/80 border-2 border-amber-600 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-pixel text-sm text-amber-300 flex items-center gap-2">
          <Package className="w-4 h-4" />
          INVENTORY ({inventory.length}/{totalSlots})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Inventory Grid - 4 rows x 6 columns = 24 slots */}
        <div 
          className="grid grid-cols-6 gap-1 p-2 bg-gray-900/80 border border-gray-600"
          style={{ 
            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%)',
            backgroundSize: '8px 8px'
          }}
        >
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`
                relative aspect-square border cursor-pointer transition-all duration-200
                ${slot.item 
                  ? `${getRarityBorderColor(slot.item.reward.rarity)} bg-gray-800 ${getRarityGlow(slot.item.reward.rarity)}` 
                  : 'border-gray-700 bg-gray-900/50'
                }
                ${selectedSlot === slot.id 
                  ? 'ring-2 ring-amber-400 bg-amber-400/10' 
                  : 'hover:border-gray-500 hover:bg-gray-800/70'
                }
              `}
              onClick={() => setSelectedSlot(selectedSlot === slot.id ? null : slot.id)}
              data-testid={`inventory-slot-${slot.id}`}
            >
              {slot.item && (
                <>
                  {/* Item icon */}
                  <div className="flex items-center justify-center h-full text-lg">
                    {getItemIcon(slot.item.reward.iconName)}
                  </div>
                  
                  {/* Rarity indicator - small colored dot */}
                  <div className={`absolute top-0 right-0 w-1.5 h-1.5 rounded-full ${
                    slot.item.reward.rarity === 'common' ? 'bg-gray-400' :
                    slot.item.reward.rarity === 'rare' ? 'bg-blue-400' :
                    slot.item.reward.rarity === 'epic' ? 'bg-purple-400' :
                    'bg-yellow-400'
                  }`}></div>
                  
                  {/* Selected indicator */}
                  {selectedSlot === slot.id && (
                    <div className="absolute inset-0 border border-amber-400 bg-amber-400/20 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Selected item tooltip */}
        {selectedItem && (
          <div className="bg-black/90 border border-amber-600 p-2 text-xs">
            <div className="font-pixel text-amber-300 flex items-center gap-1">
              <span>{getItemIcon(selectedItem.reward.iconName)}</span>
              {selectedItem.reward.name}
              <Badge 
                variant="outline" 
                className={`text-xs h-4 ${
                  selectedItem.reward.rarity === 'common' ? 'border-gray-400 text-gray-400' :
                  selectedItem.reward.rarity === 'rare' ? 'border-blue-400 text-blue-400' :
                  selectedItem.reward.rarity === 'epic' ? 'border-purple-400 text-purple-400' :
                  'border-yellow-400 text-yellow-400'
                }`}
              >
                {selectedItem.reward.rarity}
              </Badge>
            </div>
            <p className="text-gray-300 mt-1">{selectedItem.reward.description}</p>
            <p className="text-gray-500 text-xs mt-1">
              Obtained: {new Date(selectedItem.selectedAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Empty inventory message */}
        {inventory.length === 0 && (
          <div className="text-center py-2">
            <p className="text-gray-500 text-xs font-pixel">
              Your inventory is empty!
            </p>
            <p className="text-gray-600 text-xs mt-1">
              Earn 500 points to claim rewards
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}