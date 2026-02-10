import { Trophy, Lock, Target, Zap, Home, DollarSign, Clock, MapPin, Star, Award, Crown } from 'lucide-react';

interface TrophyInfo {
  id: string;
  name: string;
  icon: typeof Trophy;
  tier: 'bronze' | 'silver' | 'gold';
  description: string;
}

const TROPHIES: TrophyInfo[] = [
  { id: 'first_blood', name: 'First Blood', icon: Target, tier: 'bronze', description: 'Complete your first deal' },
  { id: 'in_the_black', name: 'In the Black', icon: DollarSign, tier: 'bronze', description: 'Complete a profitable deal' },
  { id: 'detective', name: 'Detective', icon: Zap, tier: 'bronze', description: 'Complete all due diligence on 5 properties' },
  { id: 'flip_master', name: 'Flip Master', icon: Home, tier: 'silver', description: 'Complete 5 successful flips' },
  { id: 'landlord', name: 'Landlord', icon: Home, tier: 'silver', description: 'Own 3 rental properties in one game' },
  { id: 'big_spender', name: 'Big Spender', icon: DollarSign, tier: 'silver', description: 'Spend over $750,000 on properties' },
  { id: 'survivor', name: 'Survivor', icon: Clock, tier: 'silver', description: 'Win with less than 2 months remaining' },
  { id: 'urban_expert', name: 'Urban Expert', icon: MapPin, tier: 'silver', description: 'Complete 5 deals in urban areas' },
  { id: 'speed_demon', name: 'Speed Demon', icon: Zap, tier: 'gold', description: 'Win a game with 20+ months remaining' },
  { id: 'millionaire', name: 'Millionaire', icon: Crown, tier: 'gold', description: 'Earn $750,000 total profit across all games' },
  { id: 'perfectionist', name: 'Perfectionist', icon: Star, tier: 'gold', description: 'Win without any failed deals' },
];

interface TrophyShelfProps {
  earnedTrophies?: string[];
  compact?: boolean;
  className?: string;
}

export function TrophyShelf({ earnedTrophies = [], compact = false, className = '' }: TrophyShelfProps) {
  const tierColors = {
    bronze: 'bg-gradient-to-br from-amber-700 to-amber-900 border-amber-600',
    silver: 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400',
    gold: 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-500',
  };

  const displayTrophies = compact ? TROPHIES.slice(0, 6) : TROPHIES;
  const earnedCount = earnedTrophies.length;
  const totalCount = TROPHIES.length;

  return (
    <div className={`${className}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Trophies</span>
          <span className="text-xs text-emerald-400 font-medium">{earnedCount}/{totalCount}</span>
        </div>
      )}
      <div className="trophy-shelf flex-wrap">
        {displayTrophies.map((trophy) => {
          const isEarned = earnedTrophies.includes(trophy.id);
          const Icon = trophy.icon;

          return (
            <div
              key={trophy.id}
              className={`trophy-mini ${isEarned ? `trophy-mini-earned ${tierColors[trophy.tier]}` : 'trophy-mini-locked'}`}
              title={`${trophy.name}: ${trophy.description}`}
            >
              {isEarned ? (
                <Icon className="w-3 h-3 text-white" />
              ) : (
                <Lock className="w-3 h-3" />
              )}
            </div>
          );
        })}
        {compact && earnedCount > 6 && (
          <div className="trophy-mini trophy-mini-locked text-[10px]">
            +{earnedCount - 6}
          </div>
        )}
      </div>
    </div>
  );
}

// Progress indicator for specific trophy
interface TrophyProgressProps {
  trophyId: string;
  current: number;
  target: number;
  className?: string;
}

export function TrophyProgress({ trophyId, current, target, className = '' }: TrophyProgressProps) {
  const trophy = TROPHIES.find(t => t.id === trophyId);
  if (!trophy) return null;

  const progress = Math.min(current / target, 1);
  const Icon = trophy.icon;

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        progress >= 1
          ? 'bg-emerald-500/20 text-emerald-400'
          : 'bg-white/10 text-gray-400'
      }`}>
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <span className="text-gray-300">{trophy.name}</span>
          <span className={progress >= 1 ? 'text-emerald-400' : 'text-gray-500'}>
            {current}/{target}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progress >= 1 ? 'bg-emerald-500' : 'bg-white/30'
            }`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
