import { formatCurrency } from '@/lib/gameData';
import { Link } from 'wouter';
import { Menu, Home, X, Wallet, Clock, Target, Sparkles, Trophy, Play, Loader2, RotateCcw, Volume2, VolumeX, BarChart3 } from 'lucide-react';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ProgressRing } from './ProgressRing';
import { WeekTimeline } from './WeekTimeline';
import { playAdvanceWeekSound } from '@/hooks/useClickSound';
import { useMusic } from '@/hooks/useMusicPlayer';
import logo from '@assets/dealbreak_icon_sim_1767848951783.png';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
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
  const [countDirection, setCountDirection] = useState<'up' | 'down' | null>(null);
  const prevValue = useRef(value);

  useEffect(() => {
    const currentNum = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''));
    const prevNum = typeof prevValue.current === 'number' ? prevValue.current : parseFloat(String(prevValue.current).replace(/,/g, ''));

    if (String(value) !== String(prevValue.current)) {
      setIsFlipping(true);
      setCountDirection(currentNum > prevNum ? 'up' : 'down');
      prevValue.current = value;
      const timeout = setTimeout(() => {
        setIsFlipping(false);
        setCountDirection(null);
      }, 400);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  const valueStr = String(value);
  const digits = valueStr.split('');

  const countClass = countDirection === 'up' ? 'count-up' : countDirection === 'down' ? 'count-down' : '';

  return (
    <span className={`animated-number ${className} ${countClass}`}>
      {prefix && <span className="number-prefix">{prefix}</span>}
      <span className={`flip-number-container ${isFlipping ? 'flipping' : ''}`}>
        {digits.map((digit, i) => (
          <span
            key={i}
            className="flip-digit"
            style={{ animationDelay: `${i * 20}ms` }}
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
    default: 'stat-card-default',
    cash: 'stat-card-cash',
    time: 'stat-card-time',
    goal: 'stat-card-goal'
  };

  const pulseVariants = {
    default: '',
    cash: 'hud-pulse-cash',
    time: 'hud-pulse-time',
    goal: 'hud-pulse-goal'
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`stat-card ${variants[variant]} ${pulse ? pulseVariants[variant] : ''}`}
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

export function StatusBar({ cash, weeksRemaining, profitableDeals, goalDeals, onOpenLedger, onOpenPremium, onOpenHallOfFame, onViewStats, onAdvanceWeek, isAdvancingWeek, onNewGame, onGoHome }: StatusBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cashPulse, setCashPulse] = useState(false);
  const [timePulse, setTimePulse] = useState(false);
  const [goalPulse, setGoalPulse] = useState(false);
  const prevCash = useRef(cash);
  const prevWeeks = useRef(weeksRemaining);
  const prevDeals = useRef(profitableDeals);
  const { isPlaying: isMusicPlaying, toggleMusic } = useMusic();

  // Detect value changes and trigger pulses
  useEffect(() => {
    if (cash !== prevCash.current) {
      setCashPulse(true);
      prevCash.current = cash;
      const timeout = setTimeout(() => setCashPulse(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [cash]);

  useEffect(() => {
    if (weeksRemaining !== prevWeeks.current) {
      setTimePulse(true);
      prevWeeks.current = weeksRemaining;
      const timeout = setTimeout(() => setTimePulse(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [weeksRemaining]);

  useEffect(() => {
    if (profitableDeals !== prevDeals.current) {
      setGoalPulse(true);
      prevDeals.current = profitableDeals;
      const timeout = setTimeout(() => setGoalPulse(false), 800);
      return () => clearTimeout(timeout);
    }
  }, [profitableDeals]);

  const cashDisplay = Math.floor(cash).toLocaleString();

  return (
    <>
      <div className="modern-status-bar safe-area-top safe-area-x sticky top-0 z-40" data-testid="status-bar">
        <div className="max-w-7xl mx-auto px-3 py-1.5 md:px-4 md:py-2">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-6">
            {/* Logo + Home */}
            <div className="flex items-center gap-2">
              <button
                onClick={onGoHome}
                className="relative group cursor-pointer"
                data-testid="button-home-logo"
                data-sound="swoosh"
              >
                <img
                  src={logo}
                  alt="Dealbreak: Real Estate Simulator"
                  className="relative h-16 w-16 rounded-xl transition-all duration-300 group-hover:scale-105"
                  style={{
                    boxShadow: '0 6px 20px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,175,55,0.35)',
                  }}
                  data-testid="game-logo"
                />
              </button>
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="flex items-center gap-1.5 px-3 py-1.5 desk-panel rounded-lg text-sm text-[hsl(38_30%_78%)] hover:text-[hsl(43_72%_62%)] transition-colors"
                  data-testid="button-home-nav"
                  data-sound="swoosh"
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden lg:inline font-display">Dealbreak</span>
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 flex-1">
              <StatCard
                icon={Wallet}
                label="CASH"
                variant="cash"
                onClick={onOpenLedger}
                testId="status-cash"
                pulse={cashPulse}
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="cash-value" variant="cash" />
              </StatCard>

              <StatCard icon={Clock} label="TIME LEFT" variant="time" testId="status-time" pulse={timePulse}>
                <AnimatedNumber value={weeksRemaining} suffix=" Months" className="time-value" variant="time" />
              </StatCard>

              {/* Progress Ring for Goals */}
              <div className={`stat-card stat-card-goal ${goalPulse ? 'hud-pulse-goal' : ''}`} data-testid="status-goal">
                <div className="flex items-center gap-3">
                  <ProgressRing current={profitableDeals} total={goalDeals} size={48} strokeWidth={4} />
                  <div>
                    <div className="stat-card-header">
                      <Target className="stat-card-icon" />
                      <span className="stat-card-label">GOAL</span>
                    </div>
                    <span className="text-sm text-gray-300">Profitable Deals</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advance Week Button */}
            {onAdvanceWeek && (
              <button
                onClick={() => { playAdvanceWeekSound(); onAdvanceWeek(); }}
                disabled={isAdvancingWeek || weeksRemaining <= 0}
                className="touch-target flex items-center gap-2 px-5 py-2.5 bg-[hsl(145_48%_34%)] hover:bg-[hsl(145_50%_38%)] disabled:bg-[hsl(30_10%_28%)] disabled:cursor-not-allowed text-white font-semibold rounded-lg border border-[rgba(16,185,129,0.35)] shadow-md transition-all duration-150 ios-spring tap-scale disabled:tap-scale-none"
                data-testid="button-advance-week"
                data-no-click-sound
              >
                {isAdvancingWeek ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Advancing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Skip Month</span>
                  </>
                )}
              </button>
            )}

            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="menu-button"
              data-testid="button-menu-desktop"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Layout - single scoreboard row + one advance control */}
          <div className="md:hidden flex items-center gap-2">
            {onGoHome && (
              <button
                onClick={onGoHome}
                className="touch-target flex items-center justify-center desk-panel rounded-lg transition-all duration-150 ios-spring tap-scale flex-shrink-0 w-10 h-10"
                data-testid="button-home-mobile"
                data-sound="swoosh"
              >
                <Home className="w-5 h-5 text-[hsl(38_30%_78%)]" />
              </button>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              className="menu-button-mobile touch-target flex items-center justify-center tap-scale flex-shrink-0"
              data-testid="button-menu-mobile"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-1.5 flex-1 min-w-0 desk-panel rounded-lg px-1 py-0.5">
              <button 
                onClick={onOpenLedger}
                className="stat-card-mobile-compact stat-card-mobile-cash touch-target-sm tap-scale flex-1 border-0 bg-transparent shadow-none"
                data-testid="status-cash-mobile"
                data-sound="swoosh"
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="mobile-cash-value-compact" />
                <div className="stat-label-mobile-compact">Cash</div>
              </button>
              
              <div className="stat-card-mobile-compact stat-card-mobile-time touch-target-sm flex-1 border-0 bg-transparent shadow-none" data-testid="status-time-mobile">
                <AnimatedNumber value={weeksRemaining} suffix="M" className="mobile-time-value-compact" />
                <div className="stat-label-mobile-compact">Time</div>
              </div>
              
              <div className="stat-card-mobile-compact stat-card-mobile-goal touch-target-sm flex-1 border-0 bg-transparent shadow-none" data-testid="status-goal-mobile">
                <span className="mobile-goal-value-compact">
                  <span className="text-emerald-400">{profitableDeals}</span>/{goalDeals}
                </span>
                <div className="stat-label-mobile-compact">Deals</div>
              </div>
            </div>
            
            {onAdvanceWeek && (
              <button
                onClick={() => { playAdvanceWeekSound(); onAdvanceWeek(); }}
                disabled={isAdvancingWeek || weeksRemaining <= 0}
                className="touch-target flex items-center justify-center bg-[hsl(145_48%_34%)] hover:bg-[hsl(145_50%_38%)] active:bg-[hsl(145_48%_30%)] disabled:bg-[hsl(30_10%_28%)] disabled:cursor-not-allowed rounded-lg transition-all duration-150 ios-spring tap-scale flex-shrink-0 w-10 h-10 border border-[rgba(16,185,129,0.35)]"
                data-testid="button-advance-week-mobile"
                data-no-click-sound
                title="Skip ahead one month"
                aria-label="Skip ahead one month"
              >
                {isAdvancingWeek ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Menu Overlay - rendered via portal to escape backdrop-filter containing block */}
      {menuOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md safe-area-all" data-testid="menu-overlay">
          <div className="flex flex-col items-center justify-center min-h-screen min-h-[100dvh] p-4">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 touch-target p-3 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-full text-white transition-all duration-150 ios-spring tap-scale safe-area-top safe-area-right"
              data-testid="button-close-menu"
              data-sound="close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative mb-6 text-center">
              <img 
                src={logo} 
                alt="Dealbreak" 
                className="relative w-28 h-28 rounded-2xl mx-auto"
                style={{
                  boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.35)',
                }}
              />
              <h2 className="font-display text-2xl mt-3" style={{ color: '#d4af37' }}>Dealbreak</h2>
            </div>

            <div className="space-y-2.5 w-full max-w-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onViewStats?.();
                }}
                className="menu-row"
                data-testid="button-view-stats"
                data-sound="swoosh"
              >
                <BarChart3 className="w-5 h-5" />
                Performance Stats
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenHallOfFame?.();
                }}
                className="menu-row"
                data-testid="button-hall-of-fame"
                data-sound="swoosh"
              >
                <Trophy className="w-5 h-5 text-[hsl(43_72%_55%)]" />
                Hall of Fame
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenPremium?.();
                }}
                className="menu-row"
                data-testid="button-premium"
                data-sound="swoosh"
              >
                <Sparkles className="w-5 h-5 text-[hsl(43_72%_55%)]" />
                Premium Boosts
              </button>

              {onGoHome && (
                <button
                  onClick={() => { setMenuOpen(false); onGoHome(); }}
                  className="menu-row"
                  data-testid="button-main-menu"
                  data-sound="swoosh"
                >
                  <Home className="w-5 h-5" />
                  Home
                </button>
              )}

              <button
                onClick={() => setMenuOpen(false)}
                className="menu-row menu-row-primary"
                data-testid="button-resume-game"
              >
                Resume Game
              </button>

              <button
                onClick={toggleMusic}
                className="menu-row"
                data-testid="button-toggle-music"
              >
                {isMusicPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                {isMusicPlaying ? 'Music On' : 'Music Off'}
              </button>

              {onNewGame && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onNewGame();
                  }}
                  className="menu-row border-red-500/30 text-red-300 hover:text-red-200"
                  data-testid="button-new-game"
                >
                  <RotateCcw className="w-5 h-5" />
                  New Game
                </button>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <div className="menu-stat-card">
                <AnimatedNumber value={cashDisplay} prefix="$" className="menu-cash-value" />
                <div className="text-gray-500 text-xs">Cash</div>
              </div>
              <div className="menu-stat-card">
                <span className="menu-time-value">{weeksRemaining}M</span>
                <div className="text-gray-500 text-xs">Left</div>
              </div>
              <div className="menu-stat-card">
                <span className="menu-goal-value">
                  <span className="text-emerald-400">{profitableDeals}</span>/{goalDeals}
                </span>
                <div className="text-gray-500 text-xs">Deals</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
