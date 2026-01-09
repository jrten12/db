import { formatCurrency } from '@/lib/gameData';
import { Link } from 'wouter';
import { Menu, Home, X, Wallet, Clock, Target } from 'lucide-react';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import logo from '@assets/dealbreak_icon_sim_1767848951783.png';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
  onOpenLedger?: () => void;
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

export function StatusBar({ cash, weeksRemaining, profitableDeals, goalDeals, onOpenLedger }: StatusBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const cashDisplay = Math.floor(cash).toLocaleString();

  return (
    <>
      <div className="modern-status-bar safe-area-top" data-testid="status-bar">
        <div className="max-w-7xl mx-auto px-4 py-3">
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
                <AnimatedNumber value={weeksRemaining} suffix=" Weeks" className="time-value" />
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

            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              className="menu-button"
              data-testid="button-menu-desktop"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Top Row */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="menu-button-mobile"
                data-testid="button-menu-mobile"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <Link href="/">
                <div className="relative">
                  <div className="absolute -inset-1 bg-emerald-500/20 rounded-xl blur-sm" />
                  <img 
                    src={logo} 
                    alt="Dealbreak" 
                    className="relative h-14 w-14 rounded-lg shadow-2xl"
                    style={{
                      boxShadow: '0 6px 24px rgba(0,0,0,0.5), 0 0 0 2px rgba(16,185,129,0.3)',
                    }}
                    data-testid="game-logo-mobile"
                  />
                </div>
              </Link>
              
              <div className="w-9" />
            </div>
            
            {/* Mobile Stats */}
            <div className="flex items-stretch justify-between gap-2">
              <button 
                onClick={onOpenLedger}
                className="stat-card-mobile stat-card-mobile-cash"
                data-testid="status-cash-mobile"
              >
                <AnimatedNumber value={cashDisplay} prefix="$" className="mobile-cash-value" />
                <div className="stat-label-mobile">
                  <Wallet className="w-3 h-3" /> Cash
                </div>
              </button>
              
              <div className="stat-card-mobile stat-card-mobile-time" data-testid="status-time-mobile">
                <AnimatedNumber value={weeksRemaining} suffix="W" className="mobile-time-value" />
                <div className="stat-label-mobile">Time</div>
              </div>
              
              <div className="stat-card-mobile stat-card-mobile-goal" data-testid="status-goal-mobile">
                <span className="mobile-goal-value">
                  <span className="text-emerald-400">{profitableDeals}</span>/{goalDeals}
                </span>
                <div className="stat-label-mobile">Deals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md" data-testid="menu-overlay">
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
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

            <div className="space-y-4 w-full max-w-xs">
              <Link href="/">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/20 text-white font-semibold transition-all"
                  data-testid="button-main-menu"
                >
                  <Home className="w-5 h-5" />
                  Main Menu
                </button>
              </Link>
              
              <button
                onClick={() => setMenuOpen(false)}
                className="w-full px-6 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-md rounded-xl border border-emerald-500/30 text-emerald-400 font-semibold transition-all"
                data-testid="button-resume-game"
              >
                Resume Game
              </button>
            </div>

            <div className="mt-8 flex gap-4">
              <div className="menu-stat-card">
                <AnimatedNumber value={cashDisplay} prefix="$" className="menu-cash-value" />
                <div className="text-gray-500 text-xs">Cash</div>
              </div>
              <div className="menu-stat-card">
                <span className="menu-time-value">{weeksRemaining}W</span>
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
        </div>
      )}
    </>
  );
}
