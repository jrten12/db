import { Clock, TrendingDown, Home, RotateCcw, Trophy, DollarSign, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';

interface GameOverModalProps {
  cash: number;
  profitableDeals: number;
  goalDeals: number;
  weeksPlayed: number;
  onReturnHome: () => void;
  onTryAgain: () => void;
  onBuyMoreWeeks?: () => void;
}

export function GameOverModal({ 
  cash, 
  profitableDeals, 
  goalDeals, 
  weeksPlayed, 
  onReturnHome, 
  onTryAgain,
  onBuyMoreWeeks 
}: GameOverModalProps) {
  const isWin = profitableDeals >= goalDeals;
  
  if (isWin) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-start justify-center z-[100] px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] overflow-y-auto" data-testid="game-over-modal">
        <div className="relative max-w-lg w-full my-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/50 via-yellow-500/30 to-black rounded-3xl blur-xl animate-pulse" />
          
          <div className="relative bg-gradient-to-br from-slate-900 via-amber-950/50 to-slate-900 border-2 border-amber-400/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />
            
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl" />
            
            <div className="relative z-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center border-4 border-amber-300/50 shadow-lg shadow-amber-500/50">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 tracking-tight">
                  VICTORY!
                </h1>
                <p className="text-amber-200/80 text-lg font-medium">
                  You've mastered the real estate game!
                </p>
              </div>
              
              <div className="bg-black/40 rounded-2xl p-6 border border-amber-400/30 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-400" />
                  <span className="text-3xl font-bold text-green-400 font-mono">
                    {formatCurrency(cash)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{profitableDeals}/{goalDeals}</div>
                    <div className="text-gray-400">Deals Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{weeksPlayed}</div>
                    <div className="text-gray-400">Months Played</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                <button
                  onClick={onTryAgain}
                  className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
                  data-testid="button-play-again"
                  data-sound="swoosh"
                >
                  <RotateCcw className="w-5 h-5" />
                  Play Again
                </button>
                
                <button
                  onClick={onReturnHome}
                  className="w-full py-3 px-6 bg-slate-800/80 hover:bg-slate-700/80 text-gray-300 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 border border-slate-600/50"
                  data-testid="button-return-home"
                  data-sound="swoosh"
                >
                  <Home className="w-5 h-5" />
                  Return to Main Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-start justify-center z-[100] px-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] overflow-y-auto" data-testid="game-over-modal">
      <div className="relative max-w-lg w-full my-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700/50 via-slate-600/30 to-black rounded-3xl blur-xl" />
        
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800/50 to-slate-900 border-2 border-slate-500/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-500 via-gray-400 to-slate-500" />
          
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-slate-400/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-slate-400/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-slate-400/20 rounded-full blur-xl" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center border-4 border-slate-400/50 shadow-lg">
                  <Clock className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-gray-200 to-slate-300 tracking-tight">
                TIME'S UP
              </h1>
              <p className="text-gray-400 text-lg font-medium">
                You've run out of time to complete your deals
              </p>
            </div>
            
            <div className="bg-black/40 rounded-2xl p-6 border border-slate-500/30 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <DollarSign className="w-6 h-6 text-green-400" />
                <span className="text-3xl font-bold text-green-400 font-mono">
                  {formatCurrency(cash)}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${profitableDeals >= goalDeals ? 'text-green-400' : 'text-red-400'}`}>
                    {profitableDeals}/{goalDeals}
                  </div>
                  <div className="text-gray-400">Deals Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{weeksPlayed}</div>
                  <div className="text-gray-400">Weeks Played</div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-500/20">
                <p className="text-gray-500 text-xs italic">
                  "Time waits for no investor. Plan ahead and move decisively."
                </p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              {onBuyMoreWeeks && (
                <button
                  onClick={onBuyMoreWeeks}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                  data-testid="button-buy-weeks"
                >
                  <ShoppingBag className="w-5 h-5" />
                  Buy More Time (Boost)
                </button>
              )}
              
              <button
                onClick={onTryAgain}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                data-testid="button-try-again"
                data-sound="swoosh"
              >
                <RotateCcw className="w-5 h-5" />
                Start New Game
              </button>
              
              <button
                onClick={onReturnHome}
                className="w-full py-3 px-6 bg-slate-800/80 hover:bg-slate-700/80 text-gray-300 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 border border-slate-600/50"
                data-testid="button-return-home"
                data-sound="swoosh"
              >
                <Home className="w-5 h-5" />
                Return to Main Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
