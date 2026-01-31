import { X, Trophy, Award, Star, Gem, Clock, Zap, Home, Search, CreditCard, Hammer, DollarSign, Building, Crown, Medal, TrendingUp, Target, Flame } from 'lucide-react';
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

function TrophyBadge({ trophyId, size = 'md', earned = true }: { trophyId: string; size?: 'sm' | 'md' | 'lg'; earned?: boolean }) {
  const trophy = trophyTypes.find(t => t.id === trophyId);
  if (!trophy) return null;

  const Icon = iconMap[trophy.icon] || Trophy;
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';
  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';

  return (
    <div
      className={`trophy-badge ${sizeClasses} ${tierClasses[trophy.tier]} ${earned ? '' : 'opacity-40 grayscale'}`}
      title={`${trophy.name}: ${trophy.description}`}
    >
      <Icon className={`${iconSize} text-white drop-shadow-lg relative z-10`} />
    </div>
  );
}

function ChampionCard({ player, rank }: { player: HallOfFamePlayer & { trophies: PlayerTrophy[] }; rank: number }) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;
  
  const getRankStyle = () => {
    if (isFirst) return {
      icon: Crown,
      iconColor: 'text-yellow-400',
      bg: 'bg-gradient-to-br from-yellow-500/30 via-amber-500/20 to-yellow-600/30',
      border: 'border-2 border-yellow-400/60',
      glow: 'shadow-[0_0_30px_rgba(234,179,8,0.3)]',
      label: 'CHAMPION',
      labelColor: 'text-yellow-400',
    };
    if (isSecond) return {
      icon: Medal,
      iconColor: 'text-gray-300',
      bg: 'bg-gradient-to-br from-gray-400/20 via-slate-500/20 to-gray-500/20',
      border: 'border border-gray-400/50',
      glow: 'shadow-lg',
      label: 'RUNNER UP',
      labelColor: 'text-gray-300',
    };
    if (isThird) return {
      icon: Award,
      iconColor: 'text-amber-500',
      bg: 'bg-gradient-to-br from-amber-700/20 via-orange-600/20 to-amber-800/20',
      border: 'border border-amber-600/50',
      glow: 'shadow-lg',
      label: 'THIRD PLACE',
      labelColor: 'text-amber-500',
    };
    return {
      icon: Star,
      iconColor: 'text-gray-500',
      bg: 'bg-white/5',
      border: 'border border-white/10',
      glow: '',
      label: `#${rank}`,
      labelColor: 'text-gray-500',
    };
  };

  const style = getRankStyle();
  const RankIcon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} ${style.glow} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] ${isFirst ? 'relative overflow-hidden' : ''}`}>
      {isFirst && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-transparent to-yellow-400/10 animate-pulse pointer-events-none" />
      )}
      
      <div className="flex items-start gap-4 relative z-10">
        <div className={`flex flex-col items-center justify-center ${isFirst ? 'w-20' : 'w-16'}`}>
          <RankIcon className={`${isFirst ? 'w-12 h-12' : 'w-8 h-8'} ${style.iconColor} ${isFirst ? 'animate-bounce' : ''}`} style={isFirst ? { animationDuration: '2s' } : {}} />
          <span className={`text-xs font-bold mt-1 ${style.labelColor} uppercase tracking-wider`}>{style.label}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold truncate ${isFirst ? 'text-2xl text-yellow-300' : 'text-xl text-white'}`}>
            {player.playerName}
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
            <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl px-3 py-2 text-center">
              <DollarSign className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-emerald-400 font-bold text-lg">${player.totalProfitEarned.toLocaleString()}</div>
              <div className="text-emerald-300/70 text-xs">Total Profit</div>
            </div>
            <div className="bg-purple-500/20 border border-purple-500/40 rounded-xl px-3 py-2 text-center">
              <Target className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-purple-400 font-bold text-lg">{player.totalDealsCompleted}</div>
              <div className="text-purple-300/70 text-xs">Deals Closed</div>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl px-3 py-2 text-center">
              <TrendingUp className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-blue-400 font-bold text-lg">${player.bestGameProfit.toLocaleString()}</div>
              <div className="text-blue-300/70 text-xs">Best Game</div>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-xl px-3 py-2 text-center">
              <Flame className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-amber-400 font-bold text-lg">{player.gamesWon}</div>
              <div className="text-amber-300/70 text-xs">Wins</div>
            </div>
          </div>

          {player.trophies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
              <span className="text-xs text-gray-500 uppercase tracking-wide mr-1">Trophies:</span>
              {player.trophies.slice(0, 8).map((t, i) => (
                <TrophyBadge key={i} trophyId={t.trophyId} size="sm" />
              ))}
              {player.trophies.length > 8 && (
                <span className="text-xs text-gray-500 self-center">+{player.trophies.length - 8} more</span>
              )}
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
        <Gem className="w-6 h-6 text-purple-400" />
        Unlock These Achievements
      </h3>
      
      {groupedTrophies.gold.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wide">Legendary</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupedTrophies.gold.map((trophy) => (
              <div
                key={trophy.id}
                className={`trophy-card p-4 rounded-xl ${tierBgColors.gold} border flex items-center gap-4 hover:scale-[1.02] transition-transform`}
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

      {groupedTrophies.silver.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Medal className="w-5 h-5 text-gray-300" />
            <span className="text-gray-300 font-semibold text-sm uppercase tracking-wide">Elite</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {groupedTrophies.silver.map((trophy) => (
              <div
                key={trophy.id}
                className={`trophy-card p-4 rounded-xl ${tierBgColors.silver} border flex items-center gap-4 hover:scale-[1.02] transition-transform`}
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

      {groupedTrophies.bronze.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm uppercase tracking-wide">Starter</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groupedTrophies.bronze.map((trophy) => (
              <div
                key={trophy.id}
                className={`trophy-card p-3 rounded-xl ${tierBgColors.bronze} border text-center hover:scale-[1.02] transition-transform`}
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

  const topPlayers = players.filter(p => 
    p.totalProfitEarned > 0 || 
    p.totalDealsCompleted > 0 || 
    p.gamesWon > 0 || 
    p.totalGamesPlayed > 1 ||
    (p.trophies && p.trophies.length > 0)
  );
  const hasAnyActivity = topPlayers.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto overflow-x-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-yellow-900/10 via-transparent to-purple-900/10 pointer-events-none" />
      
      <div className="flex flex-col items-center py-8 px-4 min-h-full overflow-x-hidden relative">
        <button
          onClick={onClose}
          className="fixed top-4 right-4 p-3 bg-slate-800/80 hover:bg-slate-700 rounded-full text-white transition-all z-10"
          data-testid="button-close-hall-of-fame"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-xl animate-pulse" />
              <div className="relative inline-flex items-center justify-center p-5 bg-gradient-to-br from-yellow-500/30 to-amber-600/20 rounded-2xl border-2 border-yellow-500/50 mb-4 shadow-[0_0_40px_rgba(234,179,8,0.3)]">
                <Trophy className="w-14 h-14 text-yellow-400" />
              </div>
            </div>
            <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 mb-3 tracking-tight">
              Hall of Fame
            </h2>
            <p className="text-gray-400 text-lg">The greatest real estate moguls of all time</p>
          </div>

          {isLoading ? (
            <div className="text-center py-16">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
                <Trophy className="w-8 h-8 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-gray-400 mt-6 text-lg">Loading legends...</p>
            </div>
          ) : !hasAnyActivity ? (
            <div className="text-center py-16 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-3xl border border-white/10">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gray-500/20 rounded-full blur-xl" />
                <div className="relative p-6 bg-slate-800 rounded-full border border-slate-700">
                  <Trophy className="w-16 h-16 text-gray-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Champions Yet</h3>
              <p className="text-gray-400 text-lg mb-2">Complete deals and make profits to earn your place here!</p>
              <p className="text-gray-500 text-sm">Your stats are recorded when you finish a game.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topPlayers.map((player, index) => (
                <ChampionCard key={player.id} player={player} rank={index + 1} />
              ))}
            </div>
          )}

          <TrophyShowcase />

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-gray-500 text-sm">
              Stats are recorded when you complete or exit a game. Keep playing to climb the ranks!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
