import { Play, Trophy, Award, BookOpen, Wallet, Clock, Target, RotateCcw, GraduationCap, Lightbulb, Building } from 'lucide-react';
import { TrophyShelf } from './TrophyShelf';
import { TOTAL_VISIBLE_ACHIEVEMENTS } from './BadgesModal';
import { ACHIEVEMENT_DEFINITIONS } from '@/lib/achievements';
import logo from '@assets/new_icon_db_1772940176909.png';
import { formatCurrency } from '@/lib/gameData';
import { useState, useEffect } from 'react';
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
  const totalTrophies = TOTAL_VISIBLE_ACHIEVEMENTS;
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start px-4 py-4 md:py-8">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-5">
        <div
          className="relative flex flex-col items-center gap-3 pt-2 pb-1 transition-all duration-700"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-12px)' }}
        >
          <div className="absolute -inset-10 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, rgba(16,185,129,0.04) 60%, transparent 100%)' }} />
          <div className="absolute -inset-4 rounded-full blur-xl animate-pulse" style={{ animationDuration: '4s', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-emerald-500/25 blur-md" />
            <img
              src={logo}
              alt="Dealbreak: Real Estate Simulator"
              className="relative w-[72px] h-[72px] md:w-24 md:h-24 rounded-2xl"
              style={{
                boxShadow: '0 16px 48px rgba(0,0,0,0.5), 0 0 0 2.5px rgba(16,185,129,0.45), 0 0 40px rgba(16,185,129,0.15)',
              }}
              data-testid="home-game-logo"
            />
          </div>

          <div className="text-center">
            <h1 className="text-[11px] md:text-xs font-bold tracking-[0.35em] uppercase text-emerald-400/80" data-testid="home-title">
              Dealbreak
            </h1>
            <p className="text-[9px] md:text-[10px] tracking-[0.2em] uppercase text-slate-500 mt-0.5">
              Real Estate Simulator
            </p>
          </div>
        </div>

        <div
          className="text-center transition-all duration-500 delay-200"
          style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)' }}
        >
          <h2 className="text-base md:text-xl font-semibold text-white" data-testid="home-greeting">
            Welcome back, <span className="text-emerald-400">{playerName}</span>
          </h2>
        </div>

        {hasActiveGame && cash !== undefined && weeksRemaining !== undefined && profitableDeals !== undefined && goalDeals !== undefined && (
          <div
            className="w-full grid grid-cols-3 gap-2 transition-all duration-500 delay-300"
            style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(8px)' }}
            data-testid="home-stats-preview"
          >
            <div className="bg-slate-800/70 backdrop-blur-md rounded-xl p-2.5 border border-emerald-500/15 text-center">
              <Wallet className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-emerald-400 font-mono" data-testid="home-stat-cash">
                {formatCurrency(cash)}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Cash</div>
            </div>
            <div className="bg-slate-800/70 backdrop-blur-md rounded-xl p-2.5 border border-blue-500/15 text-center">
              <Clock className="w-3.5 h-3.5 text-blue-400 mx-auto mb-0.5" />
              <div className="text-sm font-bold text-blue-400" data-testid="home-stat-time">
                {weeksRemaining <= 0 ? 'OT' : `${weeksRemaining}M`}
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{weeksRemaining <= 0 ? 'Overtime' : 'Time Left'}</div>
            </div>
            <div className="bg-slate-800/70 backdrop-blur-md rounded-xl p-2.5 border border-amber-500/15 text-center">
              <Target className="w-3.5 h-3.5 text-amber-400 mx-auto mb-0.5" />
              <div className="text-sm font-bold" data-testid="home-stat-deals">
                <span className="text-emerald-400">{profitableDeals}</span>
                <span className="text-slate-500">/{goalDeals}</span>
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Deals</div>
            </div>
          </div>
        )}

        <div className="w-full space-y-2.5">
          <button
            onClick={onPlayGame}
            className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-150 ios-spring tap-scale touch-target"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(5,150,105,0.45) 100%)',
              border: '2px solid rgba(16,185,129,0.5)',
              color: '#6ee7b7',
              boxShadow: '0 0 30px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            data-testid="button-play-game"
            data-sound="swoosh"
          >
            <Play className="w-6 h-6" />
            {hasActiveGame ? 'CONTINUE GAME' : 'START NEW GAME'}
          </button>

          {!hasActiveGame && (
            <button
              onClick={onTutorial}
              className="w-full relative overflow-hidden flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-bold transition-all duration-150 ios-spring tap-scale touch-target animate-pulse"
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
              <GraduationCap className="w-5 h-5" />
              START WITH TUTORIAL
              <span className="text-xs bg-blue-500/30 px-2 py-0.5 rounded-full text-blue-200 ml-1">Recommended</span>
            </button>
          )}

          {hasActiveGame && (
            <button
              onClick={onTutorial}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-cyan-600/20 hover:from-blue-500/30 hover:to-cyan-600/30 active:from-blue-500/40 active:to-cyan-600/40 backdrop-blur-md rounded-xl border border-blue-500/30 text-blue-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
              data-testid="button-tutorial-home"
              data-sound="swoosh"
            >
              <GraduationCap className="w-5 h-5" />
              Tutorial
            </button>
          )}

          <Link
            href="/learn"
            className="w-full relative overflow-hidden flex items-center gap-4 px-5 py-3.5 rounded-xl font-semibold transition-all duration-150 ios-spring tap-scale touch-target group"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.2) 50%, rgba(217,119,6,0.15) 100%)',
              border: '1.5px solid rgba(251,191,36,0.35)',
              boxShadow: '0 0 20px rgba(251,191,36,0.08), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            data-testid="button-learn-center"
            data-sound="swoosh"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.2)' }}>
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-amber-300 text-sm font-bold">Learn Real Estate Investing</div>
              <div className="text-amber-500/70 text-xs">13 free guides on flipping, rental analysis & more</div>
            </div>
            <BookOpen className="w-4 h-4 text-amber-500/50 flex-shrink-0 group-hover:text-amber-400 transition-colors" />
          </Link>

          <button
            onClick={onHallOfFame}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 active:from-amber-500/40 active:to-yellow-600/40 backdrop-blur-md rounded-xl border border-amber-500/30 text-amber-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
            data-testid="button-hall-of-fame-home"
            data-sound="swoosh"
          >
            <Trophy className="w-5 h-5" />
            Hall of Fame
          </button>

          <button
            onClick={onBadges}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-indigo-600/20 hover:from-purple-500/30 hover:to-indigo-600/30 active:from-purple-500/40 active:to-indigo-600/40 backdrop-blur-md rounded-xl border border-purple-500/30 text-purple-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
            data-testid="button-badges-trophies"
            data-sound="swoosh"
          >
            <Award className="w-5 h-5" />
            Badges & Trophies
            <span className="ml-auto text-xs bg-purple-500/30 px-2 py-0.5 rounded-full text-purple-300">
              {earnedTrophies.filter(id => ACHIEVEMENT_DEFINITIONS[id] && !ACHIEVEMENT_DEFINITIONS[id].secret).length}/{totalTrophies}
            </span>
          </button>

          {hasActiveGame && onRestartGame && (
            <button
              onClick={() => setShowRestartConfirm(true)}
              className="w-full flex items-center justify-center gap-3 px-6 py-2.5 bg-gradient-to-r from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 active:from-red-500/30 active:to-red-600/30 backdrop-blur-md rounded-xl border border-red-500/20 text-red-400/80 font-semibold text-sm transition-all duration-150 ios-spring tap-scale touch-target"
              data-testid="button-restart-game"
              data-sound="swoosh"
            >
              <RotateCcw className="w-4 h-4" />
              Restart Game
            </button>
          )}
        </div>

        {earnedTrophies.length > 0 && (
          <div className="w-full">
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
