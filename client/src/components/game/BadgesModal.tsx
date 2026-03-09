import { X, Trophy, Lock, Banknote, TrendingUp, Crown, Coins, Rocket, Flame, Building2, Hammer, RefreshCw, ShieldCheck, Home, Key, RotateCcw, Zap, Layers, Dices } from 'lucide-react';
import { ACHIEVEMENT_DEFINITIONS, TIER_COLORS, type AchievementTier } from '@/lib/achievements';

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

const TIER_ORDER: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const TIER_DISPLAY: Record<AchievementTier, { label: string; bg: string; border: string; iconBg: string; text: string }> = {
  bronze: {
    label: 'Bronze',
    bg: 'from-amber-700/30 to-amber-900/20',
    border: 'border-amber-600/40',
    iconBg: 'bg-gradient-to-br from-amber-700 to-amber-900',
    text: 'text-amber-400',
  },
  silver: {
    label: 'Silver',
    bg: 'from-gray-400/20 to-gray-600/10',
    border: 'border-gray-400/40',
    iconBg: 'bg-gradient-to-br from-gray-300 to-gray-500',
    text: 'text-gray-300',
  },
  gold: {
    label: 'Gold',
    bg: 'from-yellow-400/20 to-amber-500/10',
    border: 'border-yellow-500/40',
    iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    text: 'text-yellow-400',
  },
  platinum: {
    label: 'Platinum',
    bg: 'from-cyan-400/20 to-cyan-600/10',
    border: 'border-cyan-400/40',
    iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    text: 'text-cyan-300',
  },
  diamond: {
    label: 'Diamond',
    bg: 'from-purple-400/20 to-purple-600/10',
    border: 'border-purple-400/40',
    iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
    text: 'text-purple-300',
  },
};

const ALL_ACHIEVEMENTS = Object.values(ACHIEVEMENT_DEFINITIONS).filter(a => !a.secret);
export const TOTAL_VISIBLE_ACHIEVEMENTS = ALL_ACHIEVEMENTS.length;

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedTrophies: string[];
}

export function BadgesModal({ isOpen, onClose, earnedTrophies }: BadgesModalProps) {
  if (!isOpen) return null;

  const earnedCount = earnedTrophies.filter(id => ACHIEVEMENT_DEFINITIONS[id] && !ACHIEVEMENT_DEFINITIONS[id].secret).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center pt-16 pb-12 px-4 min-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-[100] min-w-[48px] min-h-[48px] flex items-center justify-center"
          data-testid="button-close-badges"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500/20 to-indigo-600/10 rounded-2xl border border-purple-500/30 mb-4">
              <Trophy className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2" data-testid="text-badges-title">
              Badges & Trophies
            </h2>
            <p className="text-gray-400">
              {earnedCount} of {TOTAL_VISIBLE_ACHIEVEMENTS} earned
            </p>
          </div>

          <div className="w-full bg-white/5 rounded-full h-2 mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${(earnedCount / TOTAL_VISIBLE_ACHIEVEMENTS) * 100}%` }}
            />
          </div>

          {TIER_ORDER.map((tier) => {
            const config = TIER_DISPLAY[tier];
            const tierAchievements = ALL_ACHIEVEMENTS.filter((a) => a.tier === tier);
            if (tierAchievements.length === 0) return null;

            return (
              <div key={tier} className="mb-6">
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${config.text}`}>
                  {config.label} Tier
                </h3>
                <div className="space-y-2">
                  {tierAchievements.map((achievement) => {
                    const isEarned = earnedTrophies.includes(achievement.id);
                    const Icon = getIcon(achievement.icon);

                    return (
                      <div
                        key={achievement.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isEarned
                            ? `bg-gradient-to-r ${config.bg} ${config.border}`
                            : 'bg-white/[0.03] border-white/[0.06] opacity-60'
                        }`}
                        data-testid={`badge-${achievement.id}`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isEarned ? config.iconBg : 'bg-white/10'
                          }`}
                        >
                          {isEarned ? (
                            <Icon className="w-5 h-5 text-white" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold ${isEarned ? 'text-white' : 'text-gray-500'}`}>
                            {achievement.name}
                          </div>
                          <div className={`text-sm ${isEarned ? 'text-gray-300' : 'text-gray-600'}`}>
                            {achievement.description}
                          </div>
                        </div>
                        {isEarned && (
                          <div className={`shrink-0 ${config.text}`}>
                            <Trophy className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
