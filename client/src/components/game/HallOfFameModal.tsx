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

const tierColors: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-900 border-amber-600',
  silver: 'from-gray-300 to-gray-500 border-gray-400',
  gold: 'from-yellow-400 to-amber-500 border-yellow-300',
};

const tierBgColors: Record<string, string> = {
  bronze: 'bg-amber-700/20',
  silver: 'bg-gray-400/20',
  gold: 'bg-yellow-400/20',
};

function TrophyBadge({ trophyId, size = 'md' }: { trophyId: string; size?: 'sm' | 'md' }) {
  const trophy = trophyTypes.find(t => t.id === trophyId);
  if (!trophy) return null;

  const Icon = iconMap[trophy.icon] || Trophy;
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br ${tierColors[trophy.tier]} border-2 flex items-center justify-center shadow-lg`}
      title={`${trophy.name}: ${trophy.description}`}
    >
      <Icon className={`${iconSize} text-white drop-shadow`} />
    </div>
  );
}

function PlayerCard({ player, rank }: { player: HallOfFamePlayer & { trophies: PlayerTrophy[] }; rank: number }) {
  const getRankBadge = () => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-400' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-300' };
    if (rank === 3) return { emoji: '🥉', color: 'text-amber-600' };
    return { emoji: `#${rank}`, color: 'text-gray-400' };
  };

  const badge = getRankBadge();

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
      <div className="flex items-start gap-4">
        <div className={`text-2xl font-bold ${badge.color} min-w-[40px]`}>
          {badge.emoji}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg truncate">{player.playerName}</h3>
          
          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
            <div className="text-gray-400">
              Total Profit: <span className="text-emerald-400 font-medium">${player.totalProfitEarned.toLocaleString()}</span>
            </div>
            <div className="text-gray-400">
              Games Won: <span className="text-blue-400 font-medium">{player.gamesWon}</span>
            </div>
            <div className="text-gray-400">
              Deals: <span className="text-purple-400 font-medium">{player.totalDealsCompleted}</span>
            </div>
            <div className="text-gray-400">
              Games: <span className="text-gray-300 font-medium">{player.totalGamesPlayed}</span>
            </div>
          </div>

          {player.trophies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
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
  return (
    <div className="mt-8 pt-6 border-t border-white/10">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-gold" />
        Available Trophies
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {trophyTypes.map((trophy) => {
          const Icon = iconMap[trophy.icon] || Trophy;
          return (
            <div
              key={trophy.id}
              className={`p-3 rounded-xl ${tierBgColors[trophy.tier]} border border-white/10 text-center`}
            >
              <div className={`w-12 h-12 mx-auto rounded-full bg-gradient-to-br ${tierColors[trophy.tier]} border-2 flex items-center justify-center shadow-lg mb-2`}>
                <Icon className="w-6 h-6 text-white drop-shadow" />
              </div>
              <div className="text-white font-medium text-sm">{trophy.name}</div>
              <div className="text-gray-400 text-xs mt-1">{trophy.description}</div>
            </div>
          );
        })}
      </div>
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
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="flex flex-col items-center py-12 px-4 min-h-full">
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
