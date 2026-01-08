import { formatCurrency } from '@/lib/gameData';

interface StatusBarProps {
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
}

export function StatusBar({ cash, weeksRemaining, profitableDeals, goalDeals }: StatusBarProps) {
  return (
    <div className="status-bar px-4 py-3 safe-area-top" data-testid="status-bar">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" data-testid="status-cash">
          <span className="text-stone-400 text-sm font-medium">Cash:</span>
          <span className="text-gold font-bold text-lg md:text-xl font-mono">
            {formatCurrency(cash)}
          </span>
        </div>
        
        <div className="flex items-center gap-2" data-testid="status-time">
          <span className="text-stone-400 text-sm font-medium">Time:</span>
          <span className="text-white font-bold text-lg md:text-xl">
            {weeksRemaining} <span className="text-sm font-normal text-stone-300">Weeks</span>
          </span>
        </div>
        
        <div className="flex items-center gap-2" data-testid="status-goal">
          <span className="text-stone-400 text-sm font-medium">Goal:</span>
          <span className="text-white font-bold text-lg md:text-xl">
            {profitableDeals}/{goalDeals} <span className="text-sm font-normal text-stone-300">Profitable Deals</span>
          </span>
        </div>
      </div>
    </div>
  );
}