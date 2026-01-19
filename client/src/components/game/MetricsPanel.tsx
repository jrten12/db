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
    <div className="space-y-3" data-testid="metrics-panel">
      {/* Investment Decision Section - Compact */}
      <div className="metric-card p-3" data-testid="card-strategy-outcome">
        <h3 className="font-display text-foreground text-base font-semibold mb-2 text-center">
          Ready to Invest?
        </h3>
        
        <p className="text-muted-foreground text-xs text-center mb-1">
          {strategy === 'rent' 
            ? "Does this deal cash flow?"
            : "Will you profit after selling?"
          }
        </p>
        <p className="text-amber-400 text-xs text-center">
          True outcome revealed after purchase!
        </p>
      </div>

      {isUnlocked && outputs && (
        <>

          {onCommitDeal && outputs && (
            <>
              {/* Cash Requirement Display - Compact */}
              <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700 mb-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Need:</span>
                  <span className="font-mono font-bold text-warning">
                    {formatCurrency(outputs.totalCashInvested)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Have:</span>
                  <span className={`font-mono font-bold ${playerCash >= outputs.totalCashInvested ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(playerCash)}
                  </span>
                </div>
                {playerCash < outputs.totalCashInvested && (
                  <div className="mt-1 p-1.5 bg-danger/20 border border-danger/30 rounded text-xs text-danger flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    <span>Need ${(outputs.totalCashInvested - playerCash).toLocaleString()} more</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={onCommitDeal}
                disabled={isCommitting || playerCash < outputs.totalCashInvested || disabled}
                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                  isCommitting 
                    ? 'bg-slate-700 text-slate-400 cursor-wait' 
                    : (playerCash < outputs.totalCashInvested || disabled)
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'game-button'
                }`}
                data-testid="button-commit-deal"
              >
                {isCommitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : disabled ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Time Expired
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Commit to Deal
                  </>
                )}
              </button>
            </>
          )}
        </>
      )}

      {/* Target Thresholds Card - Compact */}
      <div className="metric-card p-3" data-testid="card-thresholds">
        <h3 className="font-display text-foreground text-sm font-semibold mb-2 flex items-center gap-2">
          <Target className="w-3.5 h-3.5 text-gold" />
          Thresholds
        </h3>
        
        {strategy === 'rent' ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <MetricTooltip term="thresholdCoC">
                <span className="text-muted-foreground">Cash-on-Cash</span>
              </MetricTooltip>
              <div className="flex items-center gap-1">
                <span className="text-gold font-bold">{STRATEGY_THRESHOLDS.rent.cashOnCash}%+</span>
                {isUnlocked && outputs && (
                  outputs.cashOnCash >= STRATEGY_THRESHOLDS.rent.cashOnCash
                    ? <TrendingUp className="w-3 h-3 text-success" />
                    : <TrendingDown className="w-3 h-3 text-danger" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <MetricTooltip term="cashFlow">
                <span className="text-muted-foreground">Cash Flow</span>
              </MetricTooltip>
              <div className="flex items-center gap-1">
                <span className="text-gold font-bold">Positive</span>
                {isUnlocked && outputs && (
                  outputs.cashFlowMonthly > 0
                    ? <TrendingUp className="w-3 h-3 text-success" />
                    : <TrendingDown className="w-3 h-3 text-danger" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <MetricTooltip term="thresholdROI">
                <span className="text-muted-foreground">ROI</span>
              </MetricTooltip>
              <div className="flex items-center gap-1">
                <span className="text-gold font-bold">{STRATEGY_THRESHOLDS.flip.roi}%+</span>
                {isUnlocked && (
                  flipROI >= STRATEGY_THRESHOLDS.flip.roi
                    ? <TrendingUp className="w-3 h-3 text-success" />
                    : <TrendingDown className="w-3 h-3 text-danger" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <MetricTooltip term="minProfit">
                <span className="text-muted-foreground">Min Profit</span>
              </MetricTooltip>
              <div className="flex items-center gap-1">
                <span className="text-gold font-bold">{formatCurrency(STRATEGY_THRESHOLDS.flip.profitMin)}+</span>
                {isUnlocked && (
                  flipProfit >= STRATEGY_THRESHOLDS.flip.profitMin
                    ? <TrendingUp className="w-3 h-3 text-success" />
                    : <TrendingDown className="w-3 h-3 text-danger" />
                )}
              </div>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className={`mt-2 pt-2 border-t border-border text-center text-xs font-semibold rounded p-1.5 ${meetsThresholds ? 'text-success bg-success/10' : 'text-warning bg-warning/10'}`}>
            {meetsThresholds ? '✓ Meets Criteria' : '⚠ Below Target'}
          </div>
        )}
      </div>
    </div>
  );
}