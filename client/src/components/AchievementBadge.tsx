import { Badge } from '@/components/ui/badge';
import { MinecraftBlock } from './MinecraftCharacters';
import { Trophy, Diamond, Zap, Heart, Target } from 'lucide-react';

interface AchievementBadgeProps {
  achievement: {
    id: string;
    name: string;
    description: string;
    iconType: string;
    pointsRequired: number;
    unlockedAt: string;
    isNew?: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
  showPoints?: boolean;
}

export function AchievementBadge({ achievement, size = 'md', showPoints = true }: AchievementBadgeProps) {
  const getIconComponent = () => {
    switch (achievement.iconType) {
      case 'diamond':
        return <MinecraftBlock type="diamond" size={size === 'lg' ? 32 : size === 'md' ? 24 : 16} />;
      case 'emerald':
        return <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-emerald-700 rounded-sm" style={{ imageRendering: 'pixelated' }}></div>;
      case 'gold':
        return <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-yellow-700 rounded-sm" style={{ imageRendering: 'pixelated' }}></div>;
      case 'iron':
        return <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 border-2 border-gray-700 rounded-sm" style={{ imageRendering: 'pixelated' }}></div>;
      case 'redstone':
        return <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 border-2 border-red-800 rounded-sm" style={{ imageRendering: 'pixelated' }}></div>;
      default:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getBadgeColor = () => {
    switch (achievement.iconType) {
      case 'diamond':
        return 'bg-cyan-500/20 border-cyan-400 text-cyan-100';
      case 'emerald':
        return 'bg-emerald-500/20 border-emerald-400 text-emerald-100';
      case 'gold':
        return 'bg-yellow-500/20 border-yellow-400 text-yellow-100';
      case 'iron':
        return 'bg-gray-500/20 border-gray-400 text-gray-100';
      case 'redstone':
        return 'bg-red-500/20 border-red-400 text-red-100';
      default:
        return 'bg-yellow-500/20 border-yellow-400 text-yellow-100';
    }
  };

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  return (
    <div 
      className={`relative bg-card border-2 border-card-border rounded-lg ${sizeClasses[size]} hover-elevate`}
      data-testid={`achievement-${achievement.id}`}
    >
      {achievement.isNew && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge variant="secondary" className="font-pixel text-xs bg-yellow-500 text-yellow-900 animate-pulse">
            NEW!
          </Badge>
        </div>
      )}
      
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${getBadgeColor()}`}>
          {getIconComponent()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-pixel text-sm text-foreground truncate">
            {achievement.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
          {showPoints && (
            <div className="flex items-center gap-1 mt-1">
              <Diamond className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-pixel text-cyan-400">
                {achievement.pointsRequired} pts
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AchievementNotificationProps {
  achievement: {
    name: string;
    description: string;
    iconType: string;
    pointsRequired: number;
  };
  onClose: () => void;
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right duration-500">
      <div className="bg-gradient-to-r from-yellow-600 to-orange-600 border-4 border-yellow-400 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-center gap-3">
          <div className="text-3xl animate-bounce">🏆</div>
          <div className="flex-1">
            <h3 className="font-pixel text-lg text-white mb-1">
              ACHIEVEMENT UNLOCKED!
            </h3>
            <p className="font-pixel text-sm text-yellow-100 mb-1">
              {achievement.name}
            </p>
            <p className="text-xs text-yellow-200">
              {achievement.description}
            </p>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <button
            onClick={onClose}
            className="px-4 py-1 bg-yellow-400 text-yellow-900 font-pixel text-xs rounded hover:bg-yellow-300 transition-colors"
            data-testid="button-close-achievement"
          >
            AWESOME!
          </button>
        </div>
      </div>
    </div>
  );
}