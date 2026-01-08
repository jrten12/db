import { formatCurrency } from '@/lib/gameData';
import { Link } from 'wouter';
import logo from '@assets/image_1767847210293.png';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
}

export function StatusBar({ cash, weeksRemaining, profitableDeals, goalDeals }: StatusBarProps) {
  return (
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
                className="h-20 w-20 rounded-xl shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:shadow-gold/30"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 2px rgba(212,175,55,0.2)',
                }}
                data-testid="game-logo"
              />
              <div className="absolute inset-0 rounded-xl bg-gold/0 group-hover:bg-gold/10 transition-colors" />
            </div>
          </Link>
          
          {/* Stats - Glass Cards */}
          <div className="flex items-center gap-4 flex-1">
            <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" data-testid="status-cash">
              <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Cash</div>
              <div className="text-gold font-bold text-2xl font-mono">
                {formatCurrency(cash)}
              </div>
            </div>
            
            <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" data-testid="status-time">
              <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Time Left</div>
              <div className="text-white font-bold text-2xl">
                {weeksRemaining} <span className="text-base font-normal text-gray-400">Weeks</span>
              </div>
            </div>
            
            <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10" data-testid="status-goal">
              <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-0.5">Goal</div>
              <div className="text-white font-bold text-2xl">
                <span className="text-emerald-400">{profitableDeals}</span>
                <span className="text-gray-500">/</span>
                {goalDeals} <span className="text-base font-normal text-gray-400">Profitable</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          {/* Top Row - Logo centered and large */}
          <div className="flex justify-center mb-3">
            <Link href="/">
              <img 
                src={logo} 
                alt="Dealbreak: Real Estate Simulator" 
                className="h-16 w-16 rounded-xl shadow-2xl"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 2px rgba(212,175,55,0.2)',
                }}
                data-testid="game-logo-mobile"
              />
            </Link>
          </div>
          
          {/* Bottom Row - Stats in glass cards */}
          <div className="flex items-stretch justify-between gap-2">
            <div className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-center" data-testid="status-cash-mobile">
              <div className="text-gold font-bold font-mono text-lg">{formatCurrency(cash)}</div>
              <div className="text-gray-400 text-xs">Cash</div>
            </div>
            
            <div className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-center" data-testid="status-time-mobile">
              <div className="text-white font-bold text-lg">{weeksRemaining}W</div>
              <div className="text-gray-400 text-xs">Time</div>
            </div>
            
            <div className="flex-1 px-3 py-2 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 text-center" data-testid="status-goal-mobile">
              <div className="text-white font-bold text-lg">
                <span className="text-emerald-400">{profitableDeals}</span>/{goalDeals}
              </div>
              <div className="text-gray-400 text-xs">Deals</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}