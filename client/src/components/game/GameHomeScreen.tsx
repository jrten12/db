import { Play, Trophy, Award, BookOpen, Wallet, Clock, Target, RotateCcw, GraduationCap, ArrowRight } from 'lucide-react';
import { TrophyShelf } from './TrophyShelf';
import logo from '@assets/dealbreak_icon_sim_1767848951783.png';
import { formatCurrency } from '@/lib/gameData';
import { useState } from 'react';
import { Link } from 'wouter';

interface GameHomeScreenProps {
  playerName: string;
  hasActiveGame: boolean;
  onPlayGame: () => void;
  onHallOfFame: () => void;
  onBadges: () => void;
  onTutorial: () => void;
  onRestartGame?: () => void;
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
  onRestartGame,

  earnedTrophies = [],
  cash,
  weeksRemaining,
  profitableDeals,
  goalDeals,
}: GameHomeScreenProps) {
  const totalTrophies = 11;
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-start px-4 py-6 md:py-10 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5">
        <div className="relative mb-1">
          <div className="absolute -inset-6 bg-emerald-500/15 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
          <div className="absolute -inset-3 bg-emerald-500/10 rounded-3xl blur-lg" />
          <img
            src={logo}
            alt="Dealbreak: Real Estate Simulator"
            className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl shadow-2xl"
            style={{
              boxShadow: '0 12px 60px rgba(0,0,0,0.6), 0 0 0 3px rgba(16,185,129,0.4)',
            }}
            data-testid="home-game-logo"
          />
        </div>

        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-white" data-testid="home-greeting">
            Welcome back, <span className="text-emerald-400">{playerName}</span>!
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real Estate Investment Simulator</p>
        </div>

        {hasActiveGame && cash !== undefined && weeksRemaining !== undefined && profitableDeals !== undefined && goalDeals !== undefined && (
          <div className="w-full grid grid-cols-3 gap-2" data-testid="home-stats-preview">
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-emerald-500/20 text-center">
              <Wallet className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="text-sm font-bold text-emerald-400 font-mono" data-testid="home-stat-cash">
                {formatCurrency(cash)}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Cash</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-blue-500/20 text-center">
              <Clock className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-sm font-bold text-blue-400" data-testid="home-stat-time">
                {weeksRemaining <= 0 ? 'OT' : `${weeksRemaining}M`}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">{weeksRemaining <= 0 ? 'Overtime' : 'Time Left'}</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-amber-500/20 text-center">
              <Target className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="text-sm font-bold" data-testid="home-stat-deals">
                <span className="text-emerald-400">{profitableDeals}</span>
                <span className="text-gray-400">/{goalDeals}</span>
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Deals</div>
            </div>
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={onPlayGame}
            className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-6 py-5 rounded-xl font-bold text-lg transition-all duration-150 ios-spring tap-scale touch-target"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.45) 100%)',
              border: '2px solid rgba(16,185,129,0.5)',
              color: '#6ee7b7',
              boxShadow: '0 0 30px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            data-testid="button-play-game"
            data-sound="swoosh"
          >
            <Play className="w-7 h-7" />
            {hasActiveGame ? 'CONTINUE GAME' : 'START NEW GAME'}
          </button>

          {!hasActiveGame && (
            <button
              onClick={onTutorial}
              className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-150 ios-spring tap-scale touch-target animate-pulse"
              style={{
                animationDuration: '2.5s',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.3) 0%, rgba(37,99,235,0.4) 100%)',
                border: '2px solid rgba(59,130,246,0.5)',
                color: '#93c5fd',
                boxShadow: '0 0 20px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
              data-testid="button-tutorial-home"
              data-sound="swoosh"
            >
              <GraduationCap className="w-6 h-6" />
              START WITH TUTORIAL
              <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded-full text-blue-200 ml-1">Recommended</span>
            </button>
          )}

          {hasActiveGame && (
            <button
              onClick={onTutorial}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30 active:from-blue-500/40 active:to-cyan-600/40 backdrop-blur-md rounded-xl border border-blue-500/30 text-blue-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
              data-testid="button-tutorial-home"
              data-sound="swoosh"
            >
              <GraduationCap className="w-5 h-5" />
              Tutorial
            </button>
          )}

          <Link
            href="/learn"
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-teal-500/15 to-emerald-600/15 hover:from-teal-500/25 hover:to-emerald-600/25 active:from-teal-500/35 active:to-emerald-600/35 backdrop-blur-md rounded-xl border border-teal-500/25 text-teal-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
            data-testid="button-learn-center"
            data-sound="swoosh"
          >
            <BookOpen className="w-5 h-5" />
            Learning Center
            <ArrowRight className="w-4 h-4 ml-auto opacity-50" />
          </Link>

          <div className="w-full grid grid-cols-2 gap-3">
            <button
              onClick={onHallOfFame}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 active:from-amber-500/40 active:to-yellow-600/40 backdrop-blur-md rounded-xl border border-amber-500/30 text-amber-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
              data-testid="button-hall-of-fame-home"
              data-sound="swoosh"
            >
              <Trophy className="w-5 h-5" />
              Hall of Fame
            </button>

            <button
              onClick={onBadges}
              className="flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-purple-500/20 to-indigo-600/20 hover:from-purple-500/30 hover:to-indigo-600/30 active:from-purple-500/40 active:to-indigo-600/40 backdrop-blur-md rounded-xl border border-purple-500/30 text-purple-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
              data-testid="button-badges-trophies"
              data-sound="swoosh"
            >
              <Award className="w-5 h-5" />
              <span className="truncate">Badges</span>
              <span className="text-xs bg-purple-500/30 px-1.5 py-0.5 rounded-full text-purple-300 flex-shrink-0">
                {earnedTrophies.length}/{totalTrophies}
              </span>
            </button>
          </div>

          {hasActiveGame && onRestartGame && (
            <button
              onClick={() => setShowRestartConfirm(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 active:from-red-500/30 active:to-red-600/30 backdrop-blur-md rounded-xl border border-red-500/20 text-red-400/80 font-semibold text-sm transition-all duration-150 ios-spring tap-scale touch-target"
              data-testid="button-restart-game"
              data-sound="swoosh"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Game
            </button>
          )}
        </div>

        {earnedTrophies.length > 0 && (
          <div className="w-full mt-1">
            <TrophyShelf earnedTrophies={earnedTrophies} compact className="bg-slate-800/60 backdrop-blur rounded-xl p-3 border border-slate-700/50" />
          </div>
        )}
      </div>

      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white text-center mb-2">
              Start Over?
            </h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Your current game will be saved to the Hall of Fame, and you'll start fresh with a new game.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="flex-1 px-4 py-3 bg-slate-700/80 hover:bg-slate-700 rounded-xl text-gray-300 font-semibold transition-colors touch-target"
                data-testid="button-restart-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowRestartConfirm(false);
                  onRestartGame?.();
                }}
                className="flex-1 px-4 py-3 bg-red-600/80 hover:bg-red-600 rounded-xl text-white font-semibold transition-colors touch-target"
                data-testid="button-restart-confirm"
              >
                Restart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
