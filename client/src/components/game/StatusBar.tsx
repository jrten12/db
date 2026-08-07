import { formatCurrency } from '@/lib/gameData';
import { Link } from 'wouter';
import { Menu, Home, X, Wallet, Clock, Target, Trophy, Play, Loader2, RotateCcw, Volume2, VolumeX, BarChart3, Flame } from 'lucide-react';
import { getStreakTier } from '@shared/streakTiers';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ProgressRing } from './ProgressRing';
import { WeekTimeline } from './WeekTimeline';
import { playAdvanceWeekSound } from '@/hooks/useClickSound';
import { useMusic } from '@/hooks/useMusicPlayer';
import logo from '@assets/dealbreak_brand_icon.png';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
  seasonsUnlocked?: number;
  currentStreak?: number;
  profitableDeals: number;
  goalDeals: number;
  onOpenLedger?: () => void;
  onOpenPremium?: () => void;
  onOpenHallOfFame?: () => void;
  onViewStats?: () => void;
  onAdvanceWeek?: () => void;
  isAdvancingWeek?: boolean;
  onNewGame?: () => void;
  onGoHome?: () => void;
}

function AnimatedNumber({ value, prefix = '', suffix = '', className = '', variant = 'default' }: {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
  variant?: 'default' | 'cash' | 'time' | 'goal';
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (String(value) !== String(prevValue.current)) {
      setIsFlipping(true);
      prevValue.current = value;
      const timeout = setTimeout(() => {
        setIsFlipping(false);
      }, 250);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  const valueStr = String(value);
  const digits = valueStr.split('');

  return (
    <span className={`animated-number ${className}`}>
      {prefix && <span className="number-prefix">{prefix}</span>}
      <span className={`flip-number-container ${isFlipping ? 'flipping' : ''}`}>
        {digits.map((digit, i) => (
          <span
            key={i}
            className="flip-digit"
            style={{ animationDelay: `${i * 15}ms` }}
          >
            {digit}
          </span>
        ))}
      </span>
      {suffix && <span className="number-suffix">{suffix}</span>}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  children,
  variant = 'default',
  onClick,
  testId,
  pulse = false
}: {
  icon: React.ElementType;
  label: string;
  children: ReactNode;
  variant?: 'default' | 'cash' | 'time' | 'goal';
  onClick?: () => void;
  testId?: string;
  pulse?: boolean;
}) {
  const variants = {
    default: '',
    cash: 'stat-card-cash',
    time: 'stat-card-time',
    goal: 'stat-card-goal'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`stat-card ${variants[variant]}`}
      onClick={onClick}
      data-testid={testId}
    >
      <div className="stat-card-header">
        <Icon className="stat-card-icon" />
        <span className="stat-card-label">{label}</span>
      </div>
      <div className="stat-card-value">
        {children}
      </div>
    </Component>
  );
}

export function StatusBar({ cash, weeksRemaining, seasonsUnlocked = 1, currentStreak = 0, profitableDeals, goalDeals, onOpenLedger, onOpenPremium, onOpenHallOfFame, onViewStats, onAdvanceWeek, isAdvancingWeek, onNewGame, onGoHome }: StatusBarProps) {
  // Streak tier for HUD badge. Hidden entirely below 2 — no badge clutter for new players.
  const tier = getStreakTier(currentStreak);
  const showStreak = currentStreak >= 2 && !!tier.title;
  const [menuOpen, setMenuOpen] = useState(false);
  const { isPlaying: isMusicPlaying, toggleMusic } = useMusic();

  const cashDisplay = Math.floor(cash).toLocaleString();

  return (
    <>
      <div className="modern-status-bar safe-area-top safe-area-x sticky top-0 z-40" data-testid="status-bar">
        <div className="max-w-7xl mx-auto px-3 py-2 md:px-5 md:py-2.5">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-5">
            <div className="flex items-center gap-3">
              <button
                onClick={onGoHome}
                className="relative group cursor-pointer"
                data-testid="button-home-logo"
                data-sound="swoosh"
              >
                <img
                  src={logo}
                  alt="Dealbreak: Real Estate Simulator"
                  className="h-12 w-12 rounded-lg transition-opacity duration-150 group-hover:opacity-80"
                  data-testid="game-logo"
                />
              </button>
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/40 hover:text-white/70 transition-colors duration-150"
                  data-testid="button-home-nav"
                  data-sound="swoosh"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline">Home</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3 flex-1">
              <StatCard
                icon={Wallet}
                label="CASH"
                variant="cash"
                onClick={onOpenLedger}
                testId="status-cash"
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="cash-value" variant="cash" />
              </StatCard>

              <StatCard icon={Clock} label={`SEASON ${seasonsUnlocked} · MONTHS LEFT`} variant="time" testId="status-time">
                <AnimatedNumber value={weeksRemaining} suffix=" mo" className="time-value" variant="time" />
              </StatCard>

              <div className="stat-card stat-card-goal" data-testid="status-goal">
                <div className="flex items-center gap-3">
                  <ProgressRing current={profitableDeals} total={goalDeals} size={40} strokeWidth={3} />
                  <div>
                    <div className="stat-card-header">
                      <Target className="stat-card-icon" />
                      <span className="stat-card-label">GOAL</span>
                    </div>
                    <span className="text-sm text-white/50">Profitable Deals</span>
                  </div>
                </div>
              </div>

              {showStreak && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.025] border border-amber-500/20"
                  data-testid="status-streak"
                  title={`${currentStreak} profitable closes in a row · ${tier.title}`}
                >
                  <Flame className={`w-3.5 h-3.5 ${tier.colorClass}`} />
                  <div className="flex flex-col leading-none">
                    <span className={`font-mono text-sm font-bold tabular-nums ${tier.colorClass}`}>×{currentStreak}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/40 mt-0.5">{tier.title}</span>
                  </div>
                </div>
              )}
            </div>

            {onAdvanceWeek && (
              <button
                onClick={() => { playAdvanceWeekSound(); onAdvanceWeek(); }}
                disabled={isAdvancingWeek}
                className="touch-target flex items-center gap-2 px-5 py-2.5 bg-[hsl(152,44%,42%)] hover:bg-[hsl(152,44%,48%)] disabled:bg-white/8 disabled:text-white/30 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-150 tap-scale"
                data-testid="button-advance-week"
                data-no-click-sound
              >
                {isAdvancingWeek ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Advancing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" fill="currentColor" />
                    <span>Skip Month</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              className="menu-button border-2 border-[rgba(180,140,70,0.35)] rounded-xl p-3.5"
              data-testid="button-menu-desktop"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex items-center gap-1.5">
            <button
              onClick={() => setMenuOpen(true)}
              className="menu-button-mobile touch-target flex items-center justify-center tap-scale flex-shrink-0 w-12 h-12 rounded-xl border-2 border-[rgba(180,140,70,0.4)]"
              data-testid="button-menu-mobile"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button 
                onClick={onOpenLedger}
                className="stat-card-mobile-compact stat-card-mobile-cash touch-target-sm tap-scale flex-[2] min-w-0 overflow-hidden"
                data-testid="status-cash-mobile"
                data-sound="swoosh"
              >
                <div className="whitespace-nowrap overflow-hidden text-ellipsis">
                  <AnimatedNumber value={cashDisplay} prefix="$" className="mobile-cash-value-compact" />
                </div>
                <div className="stat-label-mobile-compact">Cash</div>
              </button>
              
              <div className="stat-card-mobile-compact touch-target-sm flex-1 min-w-0" data-testid="status-time-mobile">
                <div className="whitespace-nowrap">
                  <AnimatedNumber value={weeksRemaining} className="mobile-time-value-compact" />
                </div>
                <div className="stat-label-mobile-compact">S{seasonsUnlocked} · Mo</div>
              </div>

              {showStreak && (
                <div
                  className="stat-card-mobile-compact touch-target-sm flex-shrink-0 flex flex-col items-center justify-center px-2"
                  data-testid="status-streak-mobile"
                  title={`${tier.title} · ${currentStreak} in a row`}
                >
                  <div className="flex items-center gap-1">
                    <Flame className={`w-3 h-3 ${tier.colorClass}`} />
                    <span className={`font-mono text-xs font-bold tabular-nums ${tier.colorClass}`}>×{currentStreak}</span>
                  </div>
                  <div className="stat-label-mobile-compact">Streak</div>
                </div>
              )}
              
              <div
                className="stat-card-mobile-compact touch-target-sm flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5"
                data-testid="status-goal-mobile"
              >
                <ProgressRing
                  current={profitableDeals}
                  total={goalDeals}
                  size={34}
                  strokeWidth={3}
                  compact
                  className="mobile-goal-ring"
                />
                <div className="stat-label-mobile-compact">Deals</div>
              </div>
            </div>
            
            
          </div>
        </div>
      </div>

      {menuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl safe-area-all" data-testid="menu-overlay">
          <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 touch-target p-3 text-white/40 hover:text-white/70 transition-colors duration-150 safe-area-top safe-area-right"
              data-testid="button-close-menu"
              data-sound="close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mb-10">
              <img 
                src={logo} 
                alt="Dealbreak" 
                className="w-24 h-24 rounded-2xl"
              />
              <h2
                className="font-display text-4xl mt-4 leading-none"
                style={{ color: '#d4af37', textShadow: '0 3px 0 rgba(80,55,10,0.85)' }}
              >
                Dealbreak
              </h2>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[hsl(35_15%_55%)] mt-2">Pause Menu</p>
            </div>

            <div className="space-y-2.5 w-full max-w-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onViewStats?.();
                }}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white/4 hover:bg-white/8 rounded-lg border border-white/6 text-white/70 hover:text-white/90 font-medium transition-all duration-150 tap-scale touch-target"
                data-testid="button-view-stats"
                data-sound="swoosh"
              >
                <BarChart3 className="w-4.5 h-4.5" />
                Performance Stats
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenHallOfFame?.();
                }}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white/4 hover:bg-white/8 rounded-lg border border-white/6 text-white/70 hover:text-white/90 font-medium transition-all duration-150 tap-scale touch-target"
                data-testid="button-hall-of-fame"
                data-sound="swoosh"
              >
                <Trophy className="w-4.5 h-4.5" />
                Hall of Fame
              </button>

              {onGoHome && (
                <button
                  onClick={() => { setMenuOpen(false); onGoHome(); }}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white/4 hover:bg-white/8 rounded-lg border border-white/6 text-white/70 hover:text-white/90 font-medium transition-all duration-150 tap-scale touch-target"
                  data-testid="button-main-menu"
                  data-sound="swoosh"
                >
                  <Home className="w-4.5 h-4.5" />
                  Home
                </button>
              )}

              <button
                onClick={() => setMenuOpen(false)}
                className="w-full px-5 py-4 bg-[hsl(152,44%,42%)] hover:bg-[hsl(152,44%,48%)] rounded-lg text-white font-medium transition-all duration-150 tap-scale touch-target"
                data-testid="button-resume-game"
              >
                Resume Game
              </button>

              <button
                onClick={toggleMusic}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white/4 hover:bg-white/8 rounded-lg border border-white/6 text-white/70 hover:text-white/90 font-medium transition-all duration-150 tap-scale touch-target"
                data-testid="button-toggle-music"
              >
                {isMusicPlaying ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                {isMusicPlaying ? 'Music On' : 'Music Off'}
              </button>

              {onNewGame && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onNewGame();
                  }}
                  className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white/4 hover:bg-white/8 rounded-lg border border-white/6 text-red-400/70 hover:text-red-400/90 font-medium transition-all duration-150 tap-scale touch-target"
                  data-testid="button-new-game"
                >
                  <RotateCcw className="w-4.5 h-4.5" />
                  New Game
                </button>
              )}
            </div>

            <div className="mt-10 flex gap-6">
              <div className="text-center">
                <div className="font-mono font-semibold text-[hsl(152,44%,50%)] text-lg" style={{ letterSpacing: '-0.03em' }}>${cashDisplay}</div>
                <div className="text-white/25 text-[10px] uppercase tracking-widest mt-1">Cash</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-white/80 text-lg">{weeksRemaining}</div>
                <div className="text-white/25 text-[10px] uppercase tracking-widest mt-1">S{seasonsUnlocked} · Months</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg">
                  <span className="text-[hsl(152,44%,50%)]">{profitableDeals}</span>
                  <span className="text-white/20">/{goalDeals}</span>
                </div>
                <div className="text-white/25 text-[10px] uppercase tracking-widest mt-1">Deals</div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-white/15 text-[10px] tracking-wider uppercase">v3.15</p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
