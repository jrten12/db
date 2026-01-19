import { X, Trophy, Award, Star, Gem, Clock, Zap, Home, Search, CreditCard, Hammer, DollarSign, Building } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { HallOfFamePlayer, PlayerTrophy } from '@shared/schema';
import { trophyTypes } from '@shared/schema';

interface HallOfFameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  'trophy': Trophy,
  'dollar-sign': DollarSign,
  'hammer': Hammer,
  'home': Home,
  'search': Search,
  'credit-card': CreditCard,
  'zap': Zap,
  'gem': Gem,
  'star': Star,
  'clock': Clock,
  'award': Award,
  'building': Building,
};

const tierClasses: Record<string, string> = {
  bronze: 'trophy-bronze',
  silver: 'trophy-silver',
  gold: 'trophy-gold',
};

const tierBgColors: Record<string, string> = {
  bronze: 'bg-gradient-to-br from-amber-900/30 to-amber-700/20 border-amber-700/50',
  silver: 'bg-gradient-to-br from-gray-600/30 to-gray-400/20 border-gray-500/50',
  gold: 'bg-gradient-to-br from-yellow-600/30 to-amber-500/20 border-yellow-500/50',
};

const tierLabelColors: Record<string, string> = {
  bronze: 'text-amber-400',
  silver: 'text-gray-300',
  gold: 'text-yellow-400',
};

function TrophyBadge({ trophyId, size = 'md', earned = true }: { trophyId: string; size?: 'sm' | 'md' | 'lg'; earned?: boolean }) {
  const trophy = trophyTypes.find(t => t.id === trophyId);
  if (!trophy) return null;

  const Icon = iconMap[trophy.icon] || Trophy;
  const sizeClasses = size === 'sm' ? 'w-10 h-10' : size === 'lg' ? 'w-16 h-16' : 'w-14 h-14';
  const iconSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-7 h-7';

  return (
    <div
      className={`trophy-badge ${sizeClasses} ${tierClasses[trophy.tier]} ${earned ? '' : 'opacity-40 grayscale'}`}
      title={`${trophy.name}: ${trophy.description}`}
    >
      <Icon className={`${iconSize} text-white drop-shadow-lg relative z-10`} />
    </div>
  );
}

function PlayerCard({ player, rank }: { player: HallOfFamePlayer & { trophies: PlayerTrophy[] }; rank: number }) {
  const getRankBadge = () => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-400', bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/40' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-300', bg: 'bg-gradient-to-r from-gray-400/20 to-slate-500/10 border-gray-400/40' };
    if (rank === 3) return { emoji: '🥉', color: 'text-amber-600', bg: 'bg-gradient-to-r from-amber-700/20 to-orange-600/10 border-amber-600/40' };
    return { emoji: `#${rank}`, color: 'text-gray-400', bg: 'bg-white/5 border-white/10' };
  };

  const badge = getRankBadge();

  return (
    <div className={`${badge.bg} border rounded-xl p-5 hover:scale-[1.01] transition-all duration-200 shadow-lg`}>
      <div className="flex items-start gap-4">
        <div className={`text-3xl font-bold ${badge.color} min-w-[50px] text-center`}>
          {badge.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-xl truncate mb-3">{player.playerName}</h3>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              <div className="text-emerald-300 text-xs uppercase tracking-wide mb-0.5">Total Profit</div>
              <div className="text-emerald-400 font-bold text-lg">${player.totalProfitEarned.toLocaleString()}</div>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg px-3 py-2">
              <div className="text-purple-300 text-xs uppercase tracking-wide mb-0.5">Deals Closed</div>
              <div className="text-purple-400 font-bold text-lg">{player.totalDealsCompleted}</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-3 py-2">
              <div className="text-blue-300 text-xs uppercase tracking-wide mb-0.5">Best Game</div>
              <div className="text-blue-400 font-bold text-lg">${player.bestGameProfit.toLocaleString()}</div>
            </div>
          </div>

          {player.trophies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
              {player.trophies.map((t, i) => (
                <TrophyBadge key={i} trophyId={t.trophyId} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrophyShowcase() {
  const groupedTrophies = {
    gold: trophyTypes.filter(t => t.tier === 'gold'),
    silver: trophyTypes.filter(t => t.tier === 'silver'),
    bronze: trophyTypes.filter(t => t.tier === 'bronze'),
  };

  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <Trophy className="w-6 h-6 text-gold trophy-icon-gold" />
        Trophy Collection
      </h3>
      
      {/* Gold Trophies */}
      {groupedTrophies.gold.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full trophy-gold" />
            <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">Legendary</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupedTrophies.gold.map((trophy) => (
              <div
                key={trophy.id}
                className={`trophy-card p-4 rounded-xl ${tierBgColors.gold} border flex items-center gap-4`}
              >
                <TrophyBadge trophyId={trophy.id} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="text-yellow-400 font-bold">{trophy.name}</div>
                  <div className="text-gray-400 text-sm">{trophy.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Silver Trophies */}
      {groupedTrophies.silver.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full trophy-silver" />
            <span className="text-gray-300 font-semibold text-sm uppercase tracking-wide">Elite</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupedTrophies.silver.map((trophy) => (
              <div
                key={trophy.id}
                className={`trophy-card p-4 rounded-xl ${tierBgColors.silver} border flex items-center gap-4`}
              >
                <TrophyBadge trophyId={trophy.id} />
                <div className="flex-1 min-w-0">
                  <div className="text-gray-200 font-bold">{trophy.name}</div>
                  <div className="text-gray-400 text-sm">{trophy.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bronze Trophies */}
      {groupedTrophies.bronze.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full trophy-bronze" />
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-wide">Starter</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groupedTrophies.bronze.map((trophy) => (
              <div
                key={trophy.id}
                className={`trophy-card p-3 rounded-xl ${tierBgColors.bronze} border text-center`}
              >
                <div className="flex justify-center mb-2">
                  <TrophyBadge trophyId={trophy.id} size="md" />
                </div>
                <div className="text-amber-300 font-medium text-sm">{trophy.name}</div>
                <div className="text-gray-500 text-xs mt-1">{trophy.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HallOfFameModal({ isOpen, onClose }: HallOfFameModalProps) {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['hallOfFame'],
    queryFn: () => api.getHallOfFame(),
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden">
      <div className="flex flex-col items-center py-12 px-4 min-h-full overflow-x-hidden">
        <button
          onClick={onClose}
          className="fixed top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
          data-testid="button-close-hall-of-fame"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-gold/20 to-amber-600/10 rounded-2xl border border-gold/30 mb-4">
              <Trophy className="w-12 h-12 text-gold" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Hall of Fame</h2>
            <p className="text-gray-400 text-lg">Top real estate moguls and their achievements</p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto" />
              <p className="text-gray-400 mt-4">Loading legends...</p>
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Players Yet</h3>
              <p className="text-gray-400">Be the first to enter the Hall of Fame!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((player, index) => (
                <PlayerCard key={player.id} player={player} rank={index + 1} />
              ))}
            </div>
          )}

          <TrophyShowcase />
        </div>
      </div>
    </div>
  );
}
