import { formatCurrency } from '@/lib/gameData';
import { Link } from 'wouter';
import { Menu, Home, X, Wallet, Clock, Target, Sparkles, Trophy, Play, Loader2, RotateCcw } from 'lucide-react';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import logo from '@assets/dealbreak_icon_sim_1767848951783.png';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
  onOpenLedger?: () => void;
  onOpenPremium?: () => void;
  onOpenHallOfFame?: () => void;
  onAdvanceWeek?: () => void;
  isAdvancingWeek?: boolean;
  onNewGame?: () => void;
}

function AnimatedNumber({ value, prefix = '', suffix = '', className = '' }: { 
  value: number | string; 
  prefix?: string; 
  suffix?: string;
  className?: string;
}) {
  const [isFlipping, setIsFlipping] = useState(false);
  const prevValue = useRef(value);
  
  useEffect(() => {
    if (String(value) !== String(prevValue.current)) {
      setIsFlipping(true);
      prevValue.current = value;
      const timeout = setTimeout(() => setIsFlipping(false), 400);
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
  testId
}: { 
  icon: React.ElementType; 
  label: string; 
  children: ReactNode;
  variant?: 'default' | 'cash' | 'time' | 'goal';
  onClick?: () => void;
  testId?: string;
}) {
  const variants = {
    default: 'stat-card-default',
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

export function StatusBar({ cash, weeksRemaining, profitableDeals, goalDeals, onOpenLedger, onOpenPremium, onOpenHallOfFame, onAdvanceWeek, isAdvancingWeek, onNewGame }: StatusBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const cashDisplay = Math.floor(cash).toLocaleString();

  return (
    <>
      <div className="modern-status-bar safe-area-top safe-area-x sticky top-0 z-40" data-testid="status-bar">
        <div className="max-w-7xl mx-auto px-3 py-1.5 md:px-4 md:py-2">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-6">
            {/* Logo */}
            <Link href="/">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-emerald-500/20 rounded-2xl blur-md group-hover:bg-emerald-500/30 transition-colors" />
                <img 
                  src={logo} 
                  alt="Dealbreak: Real Estate Simulator" 
                  className="relative h-20 w-20 rounded-xl shadow-2xl transition-all duration-300 group-hover:scale-105"
                  style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(16,185,129,0.3)',
                  }}
                  data-testid="game-logo"
                />
              </div>
            </Link>
            
            {/* Stats */}
            <div className="flex items-center gap-3 flex-1">
              <StatCard 
                icon={Wallet} 
                label="CASH" 
                variant="cash"
                onClick={onOpenLedger}
                testId="status-cash"
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="cash-value" />
              </StatCard>
              
              <StatCard icon={Clock} label="TIME LEFT" variant="time" testId="status-time">
                <AnimatedNumber value={weeksRemaining} suffix=" Months" className="time-value" />
              </StatCard>
              
              <StatCard icon={Target} label="GOAL" variant="goal" testId="status-goal">
                <span className="goal-value">
                  <span className="goal-current">{profitableDeals}</span>
                  <span className="goal-divider">/</span>
                  <span className="goal-target">{goalDeals}</span>
                  <span className="goal-label"> Profitable</span>
                </span>
              </StatCard>
            </div>

            {/* Advance Week Button */}
            {onAdvanceWeek && (
              <button
                onClick={onAdvanceWeek}
                disabled={isAdvancingWeek || weeksRemaining <= 0}
                className="touch-target flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg transition-all duration-150 ios-spring tap-scale disabled:tap-scale-none"
                data-testid="button-advance-week"
              >
                {isAdvancingWeek ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Advancing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Next Month</span>
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

          {/* Mobile Layout - Condensed Single Row */}
          <div className="md:hidden flex items-center gap-2">
            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="menu-button-mobile touch-target flex items-center justify-center tap-scale flex-shrink-0"
              data-testid="button-menu-mobile"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Stats Row */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <button 
                onClick={onOpenLedger}
                className="stat-card-mobile-compact stat-card-mobile-cash touch-target-sm tap-scale flex-1"
                data-testid="status-cash-mobile"
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="mobile-cash-value-compact" />
                <div className="stat-label-mobile-compact">Cash</div>
              </button>
              
              <div className="stat-card-mobile-compact stat-card-mobile-time touch-target-sm flex-1" data-testid="status-time-mobile">
                <AnimatedNumber value={weeksRemaining} suffix="M" className="mobile-time-value-compact" />
                <div className="stat-label-mobile-compact">Time</div>
              </div>
              
              <div className="stat-card-mobile-compact stat-card-mobile-goal touch-target-sm flex-1" data-testid="status-goal-mobile">
                <span className="mobile-goal-value-compact">
                  <span className="text-emerald-400">{profitableDeals}</span>/{goalDeals}
                </span>
                <div className="stat-label-mobile-compact">Deals</div>
              </div>
            </div>
            
            {/* Advance Week Button - Mobile */}
            {onAdvanceWeek && (
              <button
                onClick={onAdvanceWeek}
                disabled={isAdvancingWeek || weeksRemaining <= 0}
                className="touch-target flex items-center justify-center bg-blue-500 hover:bg-blue-400 active:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg transition-all duration-150 ios-spring tap-scale flex-shrink-0 w-10 h-10"
                data-testid="button-advance-week-mobile"
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
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-emerald-500/20 rounded-3xl blur-xl" />
              <img 
                src={logo} 
                alt="Dealbreak" 
                className="relative w-36 h-36 rounded-2xl shadow-2xl"
                style={{
                  boxShadow: '0 12px 60px rgba(0,0,0,0.6), 0 0 0 3px rgba(16,185,129,0.4)',
                }}
              />
            </div>

            <div className="space-y-3 w-full max-w-xs">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenHallOfFame?.();
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 hover:to-yellow-600/30 active:from-amber-500/40 active:to-yellow-600/40 backdrop-blur-md rounded-xl border border-amber-500/30 text-amber-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
                data-testid="button-hall-of-fame"
              >
                <Trophy className="w-5 h-5" />
                Hall of Fame
              </button>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenPremium?.();
                }}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 active:from-yellow-500/40 active:to-orange-500/40 backdrop-blur-md rounded-xl border border-yellow-500/30 text-yellow-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
                data-testid="button-premium"
              >
                <Sparkles className="w-5 h-5" />
                Premium Boosts
              </button>

              <Link href="/">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md rounded-xl border border-white/20 text-white font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
                  data-testid="button-main-menu"
                >
                  <Home className="w-5 h-5" />
                  Main Menu
                </button>
              </Link>

              <button
                onClick={() => setMenuOpen(false)}
                className="w-full px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 active:bg-emerald-500/40 backdrop-blur-md rounded-xl border border-emerald-500/30 text-emerald-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
                data-testid="button-resume-game"
              >
                Resume Game
              </button>

              {onNewGame && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onNewGame();
                  }}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-red-500/20 hover:bg-red-500/30 active:bg-red-500/40 backdrop-blur-md rounded-xl border border-red-500/30 text-red-400 font-semibold transition-all duration-150 ios-spring tap-scale touch-target"
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
