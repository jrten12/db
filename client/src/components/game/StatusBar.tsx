import { formatCurrency } from '@/lib/gameData';
import { Link } from 'wouter';
import logo from '@assets/image_1767847036185.png';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
}

export function StatusBar({ cash, weeksRemaining, profitableDeals, goalDeals }: StatusBarProps) {
  return (
    <div className="status-bar safe-area-top" data-testid="status-bar">
      <div className="max-w-7xl mx-auto px-4 py-2">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center gap-6">
          {/* Logo */}
          <Link href="/">
            <img 
              src={logo} 
              alt="Dealbreak: Real Estate Simulator" 
              className="h-14 w-14 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform"
              data-testid="game-logo"
            />
          </Link>
          
          {/* Stats */}
          <div className="flex items-center gap-8 flex-1">
            <div className="flex items-center gap-2" data-testid="status-cash">
              <span className="text-stone-400 text-sm font-medium">Cash:</span>
              <span className="text-gold font-bold text-xl font-mono">
                {formatCurrency(cash)}
              </span>
            </div>
            
            <div className="flex items-center gap-2" data-testid="status-time">
              <span className="text-stone-400 text-sm font-medium">Time:</span>
              <span className="text-white font-bold text-xl">
                {weeksRemaining} <span className="text-sm font-normal text-stone-300">Weeks</span>
              </span>
            </div>
            
            <div className="flex items-center gap-2" data-testid="status-goal">
              <span className="text-stone-400 text-sm font-medium">Goal:</span>
              <span className="text-white font-bold text-xl">
                {profitableDeals}/{goalDeals} <span className="text-sm font-normal text-stone-300">Profitable Deals</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top Row - Logo centered */}
          <div className="flex justify-center mb-2">
            <Link href="/">
              <img 
                src={logo} 
                alt="Dealbreak: Real Estate Simulator" 
                className="h-12 w-12 rounded-lg shadow-lg cursor-pointer"
                data-testid="game-logo-mobile"
              />
            </Link>
          </div>
          
          {/* Bottom Row - Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-center" data-testid="status-cash-mobile">
              <span className="text-gold font-bold font-mono block">{formatCurrency(cash)}</span>
              <span className="text-stone-400 text-xs">Cash</span>
            </div>
            
            <div className="text-center" data-testid="status-time-mobile">
              <span className="text-white font-bold block">{weeksRemaining} Weeks</span>
              <span className="text-stone-400 text-xs">Time Left</span>
            </div>
            
            <div className="text-center" data-testid="status-goal-mobile">
              <span className="text-white font-bold block">{profitableDeals}/{goalDeals} Deals</span>
              <span className="text-stone-400 text-xs">Goal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}