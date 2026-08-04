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
        <div className="max-w-7xl mx-auto px-3 py-2.5 md:px-4 md:py-3">
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
                  className="relative h-[4.5rem] w-[4.5rem] rounded-xl transition-all duration-300 group-hover:scale-105"
                  style={{
                    boxShadow: '0 6px 20px rgba(0,0,0,0.45), 0 0 0 2px rgba(212,175,55,0.4), 0 4px 0 rgba(20,12,6,0.85)',
                  }}
                  data-testid="game-logo"
                />
              </button>
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="flex flex-col items-start px-3 py-2 desk-panel rounded-xl border-2 border-[rgba(180,140,70,0.35)] text-[hsl(38_30%_78%)] hover:text-[hsl(43_72%_62%)] transition-colors"
                  data-testid="button-home-nav"
                  data-sound="swoosh"
                >
                  <span className="font-display text-xl leading-none" style={{ color: '#d4af37' }}>Dealbreak</span>
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-[hsl(35_15%_55%)] mt-1">Main Menu</span>
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
                pulse={cashPulse}
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="cash-value" variant="cash" />
              </StatCard>

              <StatCard icon={Clock} label="TIME LEFT" variant="time" testId="status-time" pulse={timePulse}>
                <AnimatedNumber value={weeksRemaining} suffix=" Months" className="time-value" variant="time" />
              </StatCard>

              <div className={`stat-card stat-card-goal ${goalPulse ? 'hud-pulse-goal' : ''}`} data-testid="status-goal">
                <div className="flex items-center gap-3">
                  <ProgressRing current={profitableDeals} total={goalDeals} size={56} strokeWidth={5} />
                  <div>
                    <div className="stat-card-header">
                      <Target className="stat-card-icon" />
                      <span className="stat-card-label">GOAL</span>
                    </div>
                    <span className="text-base font-semibold text-[hsl(40_25%_82%)]">
                      <span className="text-emerald-400 font-mono text-xl">{profitableDeals}</span>
                      <span className="text-[hsl(35_12%_50%)]"> / {goalDeals}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {onAdvanceWeek && (
              <button
                onClick={() => { playAdvanceWeekSound(); onAdvanceWeek(); }}
                disabled={isAdvancingWeek || weeksRemaining <= 0}
                className="touch-target flex items-center gap-2 px-6 py-3.5 bg-[hsl(145_50%_34%)] hover:bg-[hsl(145_52%_38%)] disabled:bg-[hsl(30_10%_28%)] disabled:cursor-not-allowed text-white font-bold text-base uppercase tracking-wide rounded-xl border-2 border-[hsl(145_45%_26%)] shadow-[0_4px_0_hsl(145_60%_18%)] transition-all duration-150 ios-spring tap-scale disabled:tap-scale-none disabled:shadow-none"
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

          {/* Mobile Layout — chunky game scoreboard */}
          <div className="md:hidden flex items-center gap-2.5">
            <button
              onClick={() => setMenuOpen(true)}
              className="menu-button-mobile touch-target flex items-center justify-center tap-scale flex-shrink-0 w-12 h-12 rounded-xl border-2 border-[rgba(180,140,70,0.4)]"
              data-testid="button-menu-mobile"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="hud-scoreboard-mobile">
              <button 
                onClick={onOpenLedger}
                className="stat-card-mobile-compact stat-card-mobile-cash touch-target tap-scale flex-1"
                data-testid="status-cash-mobile"
                data-sound="swoosh"
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="mobile-cash-value-compact" />
                <div className="stat-label-mobile-compact">Cash</div>
              </button>
              
              <div className="stat-card-mobile-compact stat-card-mobile-time touch-target flex-1" data-testid="status-time-mobile">
                <AnimatedNumber value={weeksRemaining} suffix="M" className="mobile-time-value-compact" />
                <div className="stat-label-mobile-compact">Time</div>
              </div>
              
              <div className="stat-card-mobile-compact stat-card-mobile-goal touch-target flex-1" data-testid="status-goal-mobile">
                <span className="mobile-goal-value-compact">
                  <span className="text-emerald-400">{profitableDeals}</span>
                  <span className="text-[hsl(35_12%_55%)]">/{goalDeals}</span>
                </span>
                <div className="stat-label-mobile-compact">Deals</div>
              </div>
            </div>
            
            {onAdvanceWeek && (
              <button
                onClick={() => { playAdvanceWeekSound(); onAdvanceWeek(); }}
                disabled={isAdvancingWeek || weeksRemaining <= 0}
                className="touch-target flex items-center justify-center bg-[hsl(145_50%_34%)] hover:bg-[hsl(145_52%_38%)] active:bg-[hsl(145_48%_30%)] disabled:bg-[hsl(30_10%_28%)] disabled:cursor-not-allowed rounded-xl transition-all duration-150 ios-spring tap-scale flex-shrink-0 w-12 h-12 border-2 border-[hsl(145_45%_26%)] shadow-[0_3px_0_hsl(145_60%_18%)]"
                data-testid="button-advance-week-mobile"
                data-no-click-sound
                title="Skip ahead one month"
                aria-label="Skip ahead one month"
              >
                {isAdvancingWeek ? (
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                ) : (
                  <Play className="w-6 h-6 text-white" fill="currentColor" />
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

            <div className="relative mb-7 text-center">
              <img 
                src={logo} 
                alt="Dealbreak" 
                className="relative w-32 h-32 rounded-2xl mx-auto"
                style={{
                  boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 2px rgba(212,175,55,0.4), 0 6px 0 rgba(20,12,6,0.9)',
                }}
              />
              <h2
                className="font-display text-4xl mt-4 leading-none"
                style={{ color: '#d4af37', textShadow: '0 3px 0 rgba(80,55,10,0.85)' }}
              >
                Dealbreak
              </h2>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[hsl(35_15%_55%)] mt-2">Pause Menu</p>
            </div>

            <div className="space-y-3 w-full max-w-sm">
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

            <div className="mt-8 w-full max-w-sm game-scoreboard">
              <div className="game-scoreboard-cell">
                <AnimatedNumber value={cashDisplay} prefix="$" className="game-scoreboard-value text-emerald-400" />
                <div className="game-scoreboard-label">Cash</div>
              </div>
              <div className="game-scoreboard-cell">
                <span className="game-scoreboard-value text-[hsl(43_70%_72%)]">{weeksRemaining}M</span>
                <div className="game-scoreboard-label">Left</div>
              </div>
              <div className="game-scoreboard-cell">
                <span className="game-scoreboard-value">
                  <span className="text-emerald-400">{profitableDeals}</span>
                  <span className="text-[hsl(35_15%_55%)]">/{goalDeals}</span>
                </span>
                <div className="game-scoreboard-label">Deals</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
