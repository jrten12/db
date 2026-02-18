import { X, Trophy, Lock, Target, Zap, Home, DollarSign, Clock, MapPin, Star, Crown } from 'lucide-react';

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

interface BadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  earnedTrophies: string[];
}

export function BadgesModal({ isOpen, onClose, earnedTrophies }: BadgesModalProps) {
  if (!isOpen) return null;

  const tierConfig = {
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
  };

  const tiers: ('bronze' | 'silver' | 'gold')[] = ['bronze', 'silver', 'gold'];
  const earnedCount = earnedTrophies.length;

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
              {earnedCount} of {TROPHIES.length} earned
            </p>
          </div>

          <div className="w-full bg-white/5 rounded-full h-2 mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${(earnedCount / TROPHIES.length) * 100}%` }}
            />
          </div>

          {tiers.map((tier) => {
            const config = tierConfig[tier];
            const tierTrophies = TROPHIES.filter((t) => t.tier === tier);

            return (
              <div key={tier} className="mb-6">
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${config.text}`}>
                  {config.label} Tier
                </h3>
                <div className="space-y-2">
                  {tierTrophies.map((trophy) => {
                    const isEarned = earnedTrophies.includes(trophy.id);
                    const Icon = trophy.icon;

                    return (
                      <div
                        key={trophy.id}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isEarned
                            ? `bg-gradient-to-r ${config.bg} ${config.border}`
                            : 'bg-white/[0.03] border-white/[0.06] opacity-60'
                        }`}
                        data-testid={`badge-${trophy.id}`}
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
                            {trophy.name}
                          </div>
                          <div className={`text-sm ${isEarned ? 'text-gray-300' : 'text-gray-600'}`}>
                            {trophy.description}
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
