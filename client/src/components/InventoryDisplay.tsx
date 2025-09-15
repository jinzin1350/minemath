import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface InventoryDisplayProps {
  userPoints: number;
}

// Minecraft item icon mapping (same as RewardSelector)
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

// Rarity colors (same as RewardSelector)
const getRarityColor = (rarity: string) => {
  const colors = {
    'common': 'bg-gray-500',
    'rare': 'bg-blue-500',
    'epic': 'bg-purple-500',
    'legendary': 'bg-yellow-500',
  };
  return colors[rarity as keyof typeof colors] || 'bg-gray-500';
};

export function InventoryDisplay({ userPoints }: InventoryDisplayProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchInventory();
    }
  }, [isOpen]);

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="font-pixel"
          data-testid="button-inventory"
        >
          <Package className="w-4 h-4 mr-2" />
          INVENTORY ({inventory.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-pixel text-xl text-center flex items-center justify-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Your Inventory Collection
            <Sparkles className="w-6 h-6 text-yellow-500" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {inventory.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-pixel">
                Your inventory is empty!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Play games to earn points and claim rewards every 500 points!
              </p>
            </div>
          ) : (
            <>
              <div className="text-center">
                <p className="text-muted-foreground">
                  You have collected {inventory.length} reward{inventory.length === 1 ? '' : 's'}!
                </p>
              </div>

              {/* Minecraft-style inventory grid */}
              <div 
                className="grid grid-cols-9 gap-2 p-4 bg-muted/50 border-2 border-card-border"
                style={{ 
                  backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%)',
                  backgroundSize: '20px 20px'
                }}
              >
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className={`
                      relative aspect-square border-2 cursor-pointer transition-all duration-200
                      ${selectedItem?.id === item.id 
                        ? 'border-blue-400 bg-blue-400/20 shadow-lg scale-105' 
                        : 'border-gray-600 bg-gray-800/80 hover:border-gray-400 hover:bg-gray-700/80'
                      }
                    `}
                    onClick={() => setSelectedItem(item)}
                    data-testid={`inventory-item-${item.id}`}
                  >
                    {/* Item icon */}
                    <div className="flex items-center justify-center h-full text-2xl">
                      {getItemIcon(item.reward.iconName)}
                    </div>
                    
                    {/* Rarity indicator */}
                    <div className={`absolute top-0 right-0 w-2 h-2 ${getRarityColor(item.reward.rarity)}`}></div>
                    
                    {/* Selected indicator */}
                    {selectedItem?.id === item.id && (
                      <div className="absolute inset-0 border-2 border-blue-400 bg-blue-400/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 27 - inventory.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square border-2 border-gray-700 bg-gray-900/50"
                  />
                ))}
              </div>

              {/* Selected item details */}
              {selectedItem && (
                <Card className="border-2 border-card-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-pixel text-lg flex items-center gap-2">
                      <span className="text-2xl">{getItemIcon(selectedItem.reward.iconName)}</span>
                      {selectedItem.reward.name}
                      <Badge className={getRarityColor(selectedItem.reward.rarity)}>
                        {selectedItem.reward.rarity}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-2">{selectedItem.reward.description}</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Type: <span className="capitalize">{selectedItem.reward.itemType}</span></p>
                      <p>Obtained: {new Date(selectedItem.selectedAt).toLocaleDateString()}</p>
                      <p>Points when selected: {selectedItem.pointsWhenSelected}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}