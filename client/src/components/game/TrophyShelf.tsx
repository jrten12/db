import { Trophy, Lock, Banknote, TrendingUp, Crown, Coins, Rocket, Flame, Building2, Hammer, RefreshCw, ShieldCheck, Home, Key, RotateCcw, Zap, Layers, Dices } from 'lucide-react';
import { ACHIEVEMENT_DEFINITIONS, type AchievementTier } from '@/lib/achievements';
import { TOTAL_VISIBLE_ACHIEVEMENTS } from './BadgesModal';

const ICON_MAP: Record<string, typeof Trophy> = {
  'banknote': Banknote,
  'trending-up': TrendingUp,
  'crown': Crown,
  'coins': Coins,
  'rocket': Rocket,
  'flame': Flame,
  'building-2': Building2,
  'hammer': Hammer,
  'refresh-cw': RefreshCw,
  'shield-check': ShieldCheck,
  'home': Home,
  'key': Key,
  'rotate-ccw': RotateCcw,
  'zap': Zap,
  'layers': Layers,
  'dice-5': Dices,
  'trophy': Trophy,
};

function getIcon(iconName: string) {
  return ICON_MAP[iconName] || Trophy;
}

const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'bg-gradient-to-br from-amber-700 to-amber-900 border-amber-600',
  silver: 'bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400',
  gold: 'bg-gradient-to-br from-yellow-400 to-amber-500 border-yellow-500',
  platinum: 'bg-gradient-to-br from-cyan-400 to-cyan-600 border-cyan-400',
  diamond: 'bg-gradient-to-br from-purple-400 to-purple-600 border-purple-400',
};

const ALL_ACHIEVEMENTS = Object.values(ACHIEVEMENT_DEFINITIONS).filter(a => !a.secret);

interface TrophyShelfProps {
  earnedTrophies?: string[];
  compact?: boolean;
  className?: string;
}

export function TrophyShelf({ earnedTrophies = [], compact = false, className = '' }: TrophyShelfProps) {
  const displayAchievements = compact ? ALL_ACHIEVEMENTS.slice(0, 6) : ALL_ACHIEVEMENTS;
  const earnedCount = earnedTrophies.filter(id => ACHIEVEMENT_DEFINITIONS[id] && !ACHIEVEMENT_DEFINITIONS[id].secret).length;
  const totalCount = TOTAL_VISIBLE_ACHIEVEMENTS;

  return (
    <div className={`${className}`}>
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Trophies</span>
          <span className="text-xs text-emerald-400 font-medium">{earnedCount}/{totalCount}</span>
        </div>
      )}
      <div className="trophy-shelf flex-wrap">
        {displayAchievements.map((achievement) => {
          const isEarned = earnedTrophies.includes(achievement.id);
          const Icon = getIcon(achievement.icon);

          return (
            <div
              key={achievement.id}
              className={`trophy-mini ${isEarned ? `trophy-mini-earned ${TIER_COLORS[achievement.tier]}` : 'trophy-mini-locked'}`}
              title={`${achievement.name}: ${achievement.description}`}
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
