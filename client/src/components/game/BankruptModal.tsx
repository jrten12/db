import { useCallback } from 'react';
import { Skull, TrendingDown, Home, RotateCcw } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';

interface BankruptModalProps {
  cash: number;
  weeksPlayed: number;
  onReturnHome: () => void;
  onTryAgain: () => void;
}

export function BankruptModal({ cash, weeksPlayed, onReturnHome, onTryAgain }: BankruptModalProps) {
  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4" data-testid="bankrupt-modal">
      <div className="relative max-w-lg w-full">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-red-800/30 to-black rounded-3xl blur-xl animate-pulse" />
        
        <div className="relative bg-gradient-to-br from-slate-900 via-red-950/50 to-slate-900 border-2 border-red-500/50 rounded-3xl p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />
          
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border-4 border-red-400/50 shadow-lg shadow-red-500/50">
                  <Skull className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 tracking-tight">
                BANKRUPT
              </h1>
              <p className="text-red-300/80 text-lg font-medium">
                Your real estate empire has collapsed
              </p>
            </div>
            
            <div className="bg-black/40 rounded-2xl p-6 border border-red-500/30 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <TrendingDown className="w-6 h-6 text-red-400" />
                <span className="text-3xl font-bold text-red-400 font-mono">
                  {formatCurrency(cash)}
                </span>
              </div>
              
              <div className="text-gray-400 text-sm">
                You ran out of money after <span className="text-white font-semibold">{weeksPlayed} months</span>
              </div>
              
              <div className="pt-2 border-t border-red-500/20">
                <p className="text-gray-500 text-xs italic">
                  "In real estate, cash is king. Never overextend without reserves."
                </p>
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <button
                onClick={onTryAgain}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                data-testid="button-try-again"
              >
                <RotateCcw className="w-5 h-5" />
                Try Again
              </button>
              
              <button
                onClick={onReturnHome}
                className="w-full py-3 px-6 bg-slate-800/80 hover:bg-slate-700/80 text-gray-300 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 border border-slate-600/50"
                data-testid="button-return-home"
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
