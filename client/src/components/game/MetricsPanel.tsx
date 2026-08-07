import { Lock, AlertTriangle, Star, DollarSign, Target, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { ProFormaOutputs, formatCurrency, formatPercent } from '@/lib/gameData';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const METRIC_DEFINITIONS: Record<string, string> = {
  cashFlow: "Money left over each month after paying ALL expenses including mortgage. Positive = profit. Negative = you're losing money every month!",
  cashOnCash: "Cash-on-Cash Return (CoC) - Your yearly cash profit divided by total cash invested. Example: $5,000 yearly profit on $50,000 invested = 10% CoC. Target: 8%+ for rentals.",
  capRate: "Cap Rate - Net Operating Income divided by property price. Ignores financing. Lets you compare deals fairly. 6-10% is typical for rentals.",
  totalCashInvested: "All the cash you put in: down payment + closing costs + rehab budget + contingency. This is the money at risk.",
  roi: "Return on Investment - Your profit divided by cash invested. For flips, you need 20%+ to have enough cushion for surprises.",
  minProfit: "Minimum acceptable profit on a flip. $15,000+ gives you buffer for unexpected costs and makes the work worthwhile.",
  thresholdCoC: "Why 8%? This beats most savings accounts and bonds. Below 8%, your money might earn more elsewhere with less work.",
  thresholdROI: "Why 20%? Flips are risky - surprises happen. 20% margin means even if costs are 10-15% higher, you still profit.",
};

function MetricTooltip({ term, children }: { term: keyof typeof METRIC_DEFINITIONS; children: React.ReactNode }) {
  const definition = METRIC_DEFINITIONS[term];
  if (!definition) return <>{children}</>;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-help inline-flex items-center gap-1 touch-manipulation active:opacity-70 p-1 -m-1">
          {children}
          <HelpCircle className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[100]">
        <p>{definition}</p>
      </PopoverContent>
    </Popover>
  );
}

export const STRATEGY_THRESHOLDS = {
  rent: {
    cashOnCash: 8,
    capRate: 6,
    cashFlowMonthly: 0,
  },
  flip: {
    roi: 20,
    profitMin: 15000,
  },
};

interface MetricsPanelProps {
  outputs: ProFormaOutputs | null;
  isUnlocked: boolean;
  onCommitDeal?: () => void;
  strategy?: 'rent' | 'flip';
  flipROI?: number;
  flipProfit?: number;
  isCommitting?: boolean;
  playerCash?: number;
  disabled?: boolean;
}

export function MetricsPanel({ outputs, isUnlocked, onCommitDeal, strategy = 'rent', flipROI = 0, flipProfit = 0, isCommitting = false, playerCash = 0, disabled = false }: MetricsPanelProps) {
  const cashFlowNegative = outputs && outputs.cashFlowMonthly < 0;
  const cashOnCashNegative = outputs && outputs.cashOnCash < 0;
  
  const meetsThresholds = strategy === 'rent'
    ? outputs && outputs.cashOnCash >= STRATEGY_THRESHOLDS.rent.cashOnCash && outputs.cashFlowMonthly >= 0
    : flipROI >= STRATEGY_THRESHOLDS.flip.roi && flipProfit >= STRATEGY_THRESHOLDS.flip.profitMin;

  // Don't render anything until the pro forma is unlocked
  if (!isUnlocked) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="metrics-panel">
      {/* Investment Decision Section - Enhanced for iPhone/Desktop */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 border-2 border-slate-600 shadow-xl" data-testid="card-strategy-outcome">
        <h3 className="font-display text-white text-xl font-bold mb-3 text-center tracking-tight">
          Ready to Invest?
        </h3>
        
        <p className="text-gray-300 text-sm text-center mb-2">
          {strategy === 'rent' 
            ? "Does this deal cash flow?"
            : "Will you profit after selling?"
          }
        </p>
        <p className="text-amber-400 text-sm text-center font-medium">
          True outcome revealed after purchase!
        </p>
      </div>

      {isUnlocked && outputs && (
        <>

          {onCommitDeal && outputs && (
            <>
              {/* Cash Requirement Display - Larger & clearer */}
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-medium">Need:</span>
                  <span className="font-mono font-bold text-xl text-amber-400">
                    {formatCurrency(outputs.totalCashInvested)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm font-medium">Have:</span>
                  <span className={`font-mono font-bold text-xl ${playerCash >= outputs.totalCashInvested ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(playerCash)}
                  </span>
                </div>
                {!isCommitting && playerCash < outputs.totalCashInvested && (
                  <div className="mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Need ${Math.round(outputs.totalCashInvested - playerCash).toLocaleString()} more</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={onCommitDeal}
                disabled={isCommitting || playerCash < outputs.totalCashInvested || disabled}
                className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  isCommitting 
                    ? 'bg-slate-700 text-slate-400 cursor-wait' 
                    : (playerCash < outputs.totalCashInvested || disabled)
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-emerald-500/30'
                }`}
                data-testid="button-commit-deal"
                data-no-click-sound
              >
                {isCommitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : disabled ? (
                  <>
                    <Lock className="w-5 h-5" />
                    Time Expired
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Commit to Deal
                  </>
                )}
              </button>
            </>
          )}
        </>
      )}

      {/* Target Thresholds Card - Larger & more readable */}
      <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-600 shadow-lg" data-testid="card-thresholds">
        <h3 className="font-display text-white text-base font-bold mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400" />
          Investment Thresholds
        </h3>
        
        {strategy === 'rent' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5">
              <MetricTooltip term="thresholdCoC">
                <span className="text-gray-300 text-sm font-medium">Cash-on-Cash</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">{STRATEGY_THRESHOLDS.rent.cashOnCash}%+</span>
                {isUnlocked && outputs && (
                  outputs.cashOnCash >= STRATEGY_THRESHOLDS.rent.cashOnCash
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5">
              <MetricTooltip term="cashFlow">
                <span className="text-gray-300 text-sm font-medium">Cash Flow</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">Positive</span>
                {isUnlocked && outputs && (
                  outputs.cashFlowMonthly > 0
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5">
              <MetricTooltip term="thresholdROI">
                <span className="text-gray-300 text-sm font-medium">ROI</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">{STRATEGY_THRESHOLDS.flip.roi}%+</span>
                {isUnlocked && (
                  flipROI >= STRATEGY_THRESHOLDS.flip.roi
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2.5">
              <MetricTooltip term="minProfit">
                <span className="text-gray-300 text-sm font-medium">Min Profit</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-sm">{formatCurrency(STRATEGY_THRESHOLDS.flip.profitMin)}+</span>
                {isUnlocked && (
                  flipProfit >= STRATEGY_THRESHOLDS.flip.profitMin
                    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
                    : <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className={`mt-4 pt-3 border-t border-slate-600 text-center font-bold text-sm rounded-lg p-3 ${meetsThresholds ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30' : 'text-amber-400 bg-amber-500/20 border border-amber-500/30'}`}>
            {meetsThresholds ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" /> Meets Investment Criteria
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> Below Target
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}