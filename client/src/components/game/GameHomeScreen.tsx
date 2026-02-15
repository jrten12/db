import { motion } from 'framer-motion';
import { Play, Trophy, Award, BookOpen, Zap, Wallet, Clock, Target, Sparkles } from 'lucide-react';
import { TrophyShelf } from './TrophyShelf';
import logo from '@assets/dealbreak_icon_sim_1767848951783.png';
import { formatCurrency } from '@/lib/gameData';

interface GameHomeScreenProps {
  playerName: string;
  hasActiveGame: boolean;
  onPlayGame: () => void;
  onHallOfFame: () => void;
  onBadges: () => void;
  onTutorial: () => void;
  onSettings: () => void;
  earnedTrophies?: string[];
  cash?: number;
  weeksRemaining?: number;
  profitableDeals?: number;
  goalDeals?: number;
}

export function GameHomeScreen({
  playerName,
  hasActiveGame,
  onPlayGame,
  onHallOfFame,
  onBadges,
  onTutorial,
  onSettings,
  earnedTrophies = [],
  cash,
  weeksRemaining,
  profitableDeals,
  goalDeals,
}: GameHomeScreenProps) {
  const totalTrophies = 11;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-start px-4 py-8 md:py-12 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
        <div className="relative mb-2">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-3xl blur-xl" />
          <img
            src={logo}
            alt="Dealbreak: Real Estate Simulator"
            className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl shadow-2xl"
            style={{
              boxShadow: '0 12px 60px rgba(0,0,0,0.6), 0 0 0 3px rgba(16,185,129,0.4)',
            }}
            data-testid="home-game-logo"
          />
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-white text-center" data-testid="home-greeting">
          Welcome back, <span className="text-emerald-400">{playerName}</span>!
        </h1>

        {hasActiveGame && cash !== undefined && weeksRemaining !== undefined && profitableDeals !== undefined && goalDeals !== undefined && (
          <div className="w-full grid grid-cols-3 gap-2" data-testid="home-stats-preview">
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-emerald-500/20 text-center">
              <Wallet className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-sm font-bold text-emerald-400 font-mono" data-testid="home-stat-cash">
                {formatCurrency(cash)}
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Cash</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-blue-500/20 text-center">
              <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-sm font-bold text-blue-400" data-testid="home-stat-time">
                {weeksRemaining}M
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Time Left</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-amber-500/20 text-center">
              <Target className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-sm font-bold" data-testid="home-stat-deals">
                <span className="text-emerald-400">{profitableDeals}</span>
                <span className="text-gray-400">/{goalDeals}</span>
              </div>
              <div className="text-[10px] text-gray-400 uppercase tracking-wider">Deals</div>
            </div>
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={onPlayGame}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 hover:from-emerald-500/40 hover:to-emerald-600/40 active:from-emerald-500/50 active:to-emerald-600/50 backdrop-blur-md rounded-xl border border-emerald-500/40 text-emerald-300 font-bold text-lg transition-all duration-150 ios-spring tap-scale touch-target"
            data-testid="button-play-game"
            data-sound="swoosh"
          >
            <Play className="w-6 h-6" />
            {hasActiveGame ? 'CONTINUE GAME' : 'PLAY GAME'}
          </button>

          <button
            onClick={onHallOfFame}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 active:from-amber-500/40 active:to-yellow-600/40 backdrop-blur-md rounded-xl border border-amber-500/30 text-amber-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
            data-testid="button-hall-of-fame-home"
            data-sound="swoosh"
          >
            <Trophy className="w-5 h-5" />
            HALL OF FAME
          </button>

          <button
            onClick={onBadges}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500/20 to-indigo-600/20 hover:from-purple-500/30 hover:to-indigo-600/30 active:from-purple-500/40 active:to-indigo-600/40 backdrop-blur-md rounded-xl border border-purple-500/30 text-purple-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
            data-testid="button-badges-trophies"
            data-sound="swoosh"
          >
            <Award className="w-5 h-5" />
            BADGES & TROPHIES
            <span className="ml-auto text-xs bg-purple-500/30 px-2 py-0.5 rounded-full text-purple-300">
              {earnedTrophies.length}/{totalTrophies}
            </span>
          </button>

          <button
            onClick={onTutorial}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30 active:from-blue-500/40 active:to-cyan-600/40 backdrop-blur-md rounded-xl border border-blue-500/30 text-blue-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
            data-testid="button-tutorial-home"
            data-sound="swoosh"
          >
            <BookOpen className="w-5 h-5" />
            Learn How to Play
          </button>

          <button
            onClick={onSettings}
            className="w-full relative overflow-visible flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-150 ios-spring tap-scale touch-target"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(218,165,32,0.15) 50%, rgba(212,175,55,0.25) 100%)',
              border: '1.5px solid rgba(212,175,55,0.5)',
              color: '#f0d060',
              boxShadow: '0 0 16px rgba(212,175,55,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
            data-testid="button-settings-home"
            data-sound="swoosh"
          >
            <Zap className="w-5 h-5" style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.5))' }} />
            POWER-UPS
            <Sparkles className="w-4 h-4 ml-1 opacity-70" />
          </button>
        </div>

        {earnedTrophies.length > 0 && (
          <div className="w-full mt-2">
            <TrophyShelf earnedTrophies={earnedTrophies} compact className="bg-slate-800/60 backdrop-blur rounded-xl p-3 border border-slate-700/50" />
          </div>
        )}
      </div>
    </div>
  );
}
