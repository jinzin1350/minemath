import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Sparkles, Gift } from 'lucide-react';

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

interface DashboardInventoryBoardProps {
  userPoints: number;
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

export function DashboardInventoryBoard({ userPoints }: DashboardInventoryBoardProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  };

  // Create 24 slots (4x6 grid) for dashboard view - expanded inventory
  const totalSlots = 24;
  const slots = Array.from({ length: totalSlots }, (_, index) => {
    const item = inventory[index];
    return { id: index, item };
  });

  const selectedItem = selectedSlot !== null ? slots[selectedSlot]?.item : null;

  // Calculate next milestone
  const nextMilestone = Math.ceil((userPoints + 1) / 500) * 500;
  const pointsToNext = nextMilestone - userPoints;

  return (
    <Card className="border-4 border-amber-600 bg-gradient-to-br from-amber-900/50 to-orange-900/50 shadow-xl relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-1 right-1 opacity-30 animate-bounce">
        <Package className="w-4 h-4 text-amber-400" />
      </div>

      <CardHeader className="pb-3 relative z-10">
        <CardTitle className="font-pixel text-amber-200 flex items-center gap-2 text-lg animate-pulse">
          <Package className="w-5 h-5" />
          📦 INVENTORY ({inventory.length}/{totalSlots})
          <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 relative z-10">
        {/* Inventory Grid - 4 rows x 6 columns = 24 slots */}
        <div 
          className="grid grid-cols-6 gap-1.5 p-3 bg-black/40 border-2 border-amber-700 rounded-lg"
          style={{ 
            backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%)',
            backgroundSize: '8px 8px'
          }}
        >
          {slots.map((slot) => (
            <div
              key={slot.id}
              className={`relative aspect-square border-2 cursor-pointer transition-all duration-200 rounded-[4px] ${slot.item && slot.item.reward
              ? `${getRarityBorderColor(slot.item.reward.rarity)} bg-gray-800 ${getRarityGlow(slot.item.reward.rarity)}`
              : 'border-gray-700 bg-gray-900/50'
            }`}
              onClick={() => setSelectedSlot(selectedSlot === slot.id ? null : slot.id)}
              data-testid={`dashboard-inventory-slot-${slot.id}`}
            >
              {slot.item && (
                <>
                  {/* Item icon */}
                  <div className="flex items-center justify-center h-full text-lg">
                    {getItemIcon(slot.item.reward.iconName || 'chest')}
                  </div>

                  {/* Rarity indicator - small colored dot */}
                  <div className={`absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                    slot.item.reward.rarity === 'common' ? 'bg-gray-400' :
                    slot.item.reward.rarity === 'rare' ? 'bg-blue-400' :
                    slot.item.reward.rarity === 'epic' ? 'bg-purple-400' :
                    'bg-yellow-400'
                  }`}></div>

                  {/* Selected indicator */}
                  {selectedSlot === slot.id && (
                    <div className="absolute inset-0 border border-amber-400 bg-amber-400/20 flex items-center justify-center rounded-sm">
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
          <div className="bg-black/90 border-2 border-amber-600 p-2 text-xs rounded-lg">
            <div className="font-pixel text-amber-300 flex items-center gap-1">
              <span>{getItemIcon(selectedItem.reward.iconName || 'chest')}</span>
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

        {/* Status message */}
        {inventory.length === 0 ? (
          <div className="text-center py-2">
            <p className="text-amber-300 text-xs font-pixel">
              🎁 Your inventory is empty!
            </p>
            <p className="text-amber-500 text-xs mt-1">
              Need {pointsToNext} more points to unlock rewards
            </p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-amber-300 text-xs font-pixel">
              🎉 {inventory.length} reward{inventory.length === 1 ? '' : 's'} collected!
            </p>
            {pointsToNext > 0 && (
              <p className="text-amber-500 text-xs mt-1">
                {pointsToNext} points to next reward milestone
              </p>
            )}
          </div>
        )}

        {/* Quick reward status */}
        {userPoints >= 500 && (userPoints % 500) < 50 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500 p-2 rounded-lg animate-pulse">
            <Gift className="w-4 h-4 text-yellow-400" />
            <p className="text-yellow-300 text-xs font-pixel">
              🎊 Reward available to claim!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}