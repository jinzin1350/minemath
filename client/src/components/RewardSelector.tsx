import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gift, Diamond, Zap, Star, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface AvailableReward {
  id: string;
  name: string;
  description: string;
  itemType: string;
  iconName: string;
  rarity: string;
}

interface RewardOpportunity {
  id: string;
  pointsMilestone: number;
  isUsed: boolean;
}

interface RewardSelectorProps {
  userPoints: number;
  onRewardSelected?: () => void;
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

// Rarity colors
const getRarityColor = (rarity: string) => {
  const colors = {
    'common': 'bg-gray-500',
    'rare': 'bg-blue-500',
    'epic': 'bg-purple-500',
    'legendary': 'bg-yellow-500',
  };
  return colors[rarity as keyof typeof colors] || 'bg-gray-500';
};

export function RewardSelector({ userPoints, onRewardSelected }: RewardSelectorProps) {
  const [availableRewards, setAvailableRewards] = useState<AvailableReward[]>([]);
  const [opportunities, setOpportunities] = useState<RewardOpportunity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<AvailableReward | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const { toast } = useToast();

  const availableOpportunity = opportunities.find(opp => !opp.isUsed);

  // Fetch opportunities on mount to show button availability
  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRewards();
      fetchOpportunities(); // Refresh when opening
    }
  }, [isOpen]);

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/rewards/available');
      if (response.ok) {
        const rewards = await response.json();
        setAvailableRewards(rewards);
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/rewards/opportunities');
      if (response.ok) {
        const opportunities = await response.json();
        setOpportunities(opportunities);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  };

  const handleSelectReward = async () => {
    if (!selectedReward || !availableOpportunity) return;

    setIsSelecting(true);
    try {
      const response = await fetch('/api/rewards/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pointsMilestone: availableOpportunity.pointsMilestone,
          rewardId: selectedReward.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to select reward');
      }

      toast({
        title: "Reward Selected! 🎁",
        description: `${selectedReward.name} has been added to your inventory!`,
      });

      // Refresh opportunities and close dialog
      await fetchOpportunities();
      setIsOpen(false);
      setSelectedReward(null);
      onRewardSelected?.();
      
      // Invalidate inventory cache
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      
    } catch (error) {
      toast({
        title: "Selection Failed",
        description: "Failed to select reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSelecting(false);
    }
  };

  if (!availableOpportunity) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="font-pixel bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black"
          data-testid="button-reward-selector"
        >
          <Gift className="w-4 h-4 mr-2" />
          CLAIM REWARD! ({availableOpportunity.pointsMilestone} pts)
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-pixel text-xl text-center flex items-center justify-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            Reward Selection - {availableOpportunity.pointsMilestone} Points Milestone
            <Award className="w-6 h-6 text-yellow-500" />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              Congratulations! You've earned {availableOpportunity.pointsMilestone} points!
            </p>
            <p className="text-foreground font-pixel">
              Select one reward to add to your inventory:
            </p>
          </div>

          {/* Minecraft-style grid */}
          <div 
            className="grid grid-cols-8 gap-2 p-4 bg-muted/50 border-2 border-card-border"
            style={{ 
              backgroundImage: 'linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.1) 25%, transparent 25%)',
              backgroundSize: '20px 20px'
            }}
          >
            {availableRewards.map((reward) => (
              <div
                key={reward.id}
                className={`
                  relative aspect-square border-2 cursor-pointer transition-all duration-200
                  ${selectedReward?.id === reward.id 
                    ? 'border-yellow-400 bg-yellow-400/20 shadow-lg scale-105' 
                    : 'border-gray-600 bg-gray-800/80 hover:border-gray-400 hover:bg-gray-700/80'
                  }
                `}
                onClick={() => setSelectedReward(reward)}
                data-testid={`reward-item-${reward.id}`}
              >
                {/* Item icon */}
                <div className="flex items-center justify-center h-full text-2xl">
                  {getItemIcon(reward.iconName)}
                </div>
                
                {/* Rarity indicator */}
                <div className={`absolute top-0 right-0 w-2 h-2 ${getRarityColor(reward.rarity)}`}></div>
                
                {/* Selected indicator */}
                {selectedReward?.id === reward.id && (
                  <div className="absolute inset-0 border-2 border-yellow-400 bg-yellow-400/30 flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Selected item details */}
          {selectedReward && (
            <Card className="border-2 border-card-border">
              <CardHeader className="pb-2">
                <CardTitle className="font-pixel text-lg flex items-center gap-2">
                  <span className="text-2xl">{getItemIcon(selectedReward.iconName)}</span>
                  {selectedReward.name}
                  <Badge className={getRarityColor(selectedReward.rarity)}>
                    {selectedReward.rarity}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{selectedReward.description}</p>
                <p className="text-sm text-muted-foreground">
                  Type: <span className="capitalize">{selectedReward.itemType}</span>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="font-pixel"
              data-testid="button-cancel-reward"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSelectReward}
              disabled={!selectedReward || isSelecting}
              className="font-pixel bg-green-600 hover:bg-green-700"
              data-testid="button-confirm-reward"
            >
              {isSelecting ? 'Adding...' : 'Select This Reward'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}