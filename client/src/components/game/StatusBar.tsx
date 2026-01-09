import { formatCurrency } from '@/lib/gameData';
import { Link } from 'wouter';
import { Menu, Home, X, Wallet } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import logo from '@assets/dealbreak_icon_sim_1767848951783.png';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
  onOpenLedger?: () => void;
}

function ScoreboardValue({
  value,
  className,
  children,
}: {
  value: string | number;
  className?: string;
  children: ReactNode;
}) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), 450);
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <span className={`scoreboard-value ${animate ? 'scoreboard-flip' : ''} ${className ?? ''}`}>
      {children}
    </span>
  );
}

export function StatusBar({ cash, weeksRemaining, profitableDeals, goalDeals, onOpenLedger }: StatusBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="status-bar safe-area-top" data-testid="status-bar">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-8">
            {/* Logo - Large and Prominent */}
            <Link href="/">
              <div className="relative group cursor-pointer">
                <img 
                  src={logo} 
                  alt="Dealbreak: Real Estate Simulator" 
                  className="h-24 w-24 rounded-2xl shadow-2xl transition-all duration-300 group-hover:scale-105"
                  style={{
                    boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 3px rgba(212,175,55,0.4), 0 0 20px rgba(212,175,55,0.2)',
                  }}
                  data-testid="game-logo"
                />
                <div className="absolute inset-0 rounded-2xl bg-gold/0 group-hover:bg-gold/10 transition-colors" />
              </div>
            </Link>
            
            {/* Stats - Glass Cards */}
            <div className="flex items-center gap-4 flex-1">
              <button 
                onClick={onOpenLedger}
                className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer text-left" 
                data-testid="status-cash"
              >
                <div className="flex items-center gap-1 text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">
                  Cash <Wallet className="w-3 h-3" />
                </div>
                <div>
                  <ScoreboardValue value={cash} className="text-gold font-bold text-2xl font-mono">
                    {formatCurrency(cash)}
                  </ScoreboardValue>
                </div>
              </button>
              
              <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" data-testid="status-time">
                <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Time Left</div>
                <div className="text-white font-bold text-2xl">
                  <ScoreboardValue value={weeksRemaining} className="text-white font-bold text-2xl">
                    {weeksRemaining}
                  </ScoreboardValue>{' '}
                  <span className="text-base font-normal text-gray-400">Weeks</span>
                </div>
              </div>
              
              <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" data-testid="status-goal">
                <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Goal</div>
                <div className="text-white font-bold text-2xl">
                  <ScoreboardValue
                    value={`${profitableDeals}-${goalDeals}`}
                    className="text-white font-bold text-2xl"
                  >
                    <span className="text-emerald-400">{profitableDeals}</span>
                    <span className="text-gray-500">/</span>
                    {goalDeals}
                  </ScoreboardValue>{' '}
                  <span className="text-base font-normal text-gray-400">Profitable</span>
                </div>
              </div>
            </div>

            {/* Menu Button - Desktop */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-gray-300 hover:text-white transition-all"
              data-testid="button-menu-desktop"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden">
            {/* Top Row - Logo and Menu */}
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-lg border border-white/10 text-gray-300"
                data-testid="button-menu-mobile"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <Link href="/">
                <img 
                  src={logo} 
                  alt="Dealbreak: Real Estate Simulator" 
                  className="h-16 w-16 rounded-xl shadow-2xl"
                  style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(212,175,55,0.4), 0 0 15px rgba(212,175,55,0.2)',
                  }}
                  data-testid="game-logo-mobile"
                />
              </Link>
              
              <div className="w-9" />
            </div>
            
            {/* Bottom Row - Stats in glass cards */}
            <div className="flex items-stretch justify-between gap-2">
              <button 
                onClick={onOpenLedger}
                className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-center hover:bg-white/10 transition-colors" 
                data-testid="status-cash-mobile"
              >
                <div>
                  <ScoreboardValue value={cash} className="text-gold font-bold font-mono text-lg">
                    {formatCurrency(cash)}
                  </ScoreboardValue>
                </div>
                <div className="text-gray-400 text-xs flex items-center justify-center gap-1">Cash <Wallet className="w-3 h-3" /></div>
              </button>
              
              <div className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-center" data-testid="status-time-mobile">
                <div>
                  <ScoreboardValue value={weeksRemaining} className="text-white font-bold text-lg">
                    {weeksRemaining}W
                  </ScoreboardValue>
                </div>
                <div className="text-gray-400 text-xs">Time</div>
              </div>
              
              <div className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-center" data-testid="status-goal-mobile">
                <div>
                  <ScoreboardValue
                    value={`${profitableDeals}-${goalDeals}`}
                    className="text-white font-bold text-lg"
                  >
                    <span className="text-emerald-400">{profitableDeals}</span>/{goalDeals}
                  </ScoreboardValue>
                </div>
                <div className="text-gray-400 text-xs">Deals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" data-testid="menu-overlay">
          <div className="flex flex-col items-center justify-center min-h-screen p-4">
            {/* Close Button */}
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              data-testid="button-close-menu"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Logo */}
            <img 
              src={logo} 
              alt="Dealbreak" 
              className="w-40 h-40 rounded-3xl shadow-2xl mb-8"
              style={{
                boxShadow: '0 12px 60px rgba(0,0,0,0.6), 0 0 0 4px rgba(212,175,55,0.5), 0 0 40px rgba(212,175,55,0.3)',
              }}
            />

            {/* Menu Items */}
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

            {/* Game Stats in Menu */}
            <div className="mt-8 flex gap-4">
              <div className="px-4 py-2 bg-white/5 rounded-lg text-center">
                <div>
                  <ScoreboardValue value={cash} className="text-gold font-bold font-mono">
                    {formatCurrency(cash)}
                  </ScoreboardValue>
                </div>
                <div className="text-gray-500 text-xs">Cash</div>
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-lg text-center">
                <div>
                  <ScoreboardValue value={weeksRemaining} className="text-white font-bold">
                    {weeksRemaining}W
                  </ScoreboardValue>
                </div>
                <div className="text-gray-500 text-xs">Left</div>
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-lg text-center">
                <div>
                  <ScoreboardValue
                    value={`${profitableDeals}-${goalDeals}`}
                    className="text-white font-bold"
                  >
                    {profitableDeals}/{goalDeals}
                  </ScoreboardValue>
                </div>
                <div className="text-gray-500 text-xs">Deals</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
