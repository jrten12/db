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
}

export function MetricsPanel({ outputs, isUnlocked, onCommitDeal, strategy = 'rent', flipROI = 0, flipProfit = 0 }: MetricsPanelProps) {
  const cashFlowNegative = outputs && outputs.cashFlowMonthly < 0;
  const cashOnCashNegative = outputs && outputs.cashOnCash < 0;
  
  const meetsThresholds = strategy === 'rent'
    ? outputs && outputs.cashOnCash >= STRATEGY_THRESHOLDS.rent.cashOnCash && outputs.cashFlowMonthly >= 0
    : flipROI >= STRATEGY_THRESHOLDS.flip.roi && flipProfit >= STRATEGY_THRESHOLDS.flip.profitMin;

  return (
    <div className="space-y-4" data-testid="metrics-panel">
      <div className="metric-card" data-testid="card-strategy-outcome">
        <h3 className="font-display text-foreground text-lg font-semibold mb-4 text-center">
          Strategy Outcome
        </h3>
        
        {!isUnlocked ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center">
              <Lock className="w-6 h-6 text-danger" />
            </div>
            <p className="text-muted-foreground text-sm text-center">
              Complete Pro Forma to Unlock
            </p>
          </div>
        ) : strategy === 'rent' ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold font-mono ${cashFlowNegative ? 'text-danger' : 'text-success'}`}>
                {outputs ? formatCurrency(outputs.cashFlowMonthly) : '$0'}/mo
              </div>
              <div className="text-muted-foreground text-sm mt-1">Monthly Cash Flow</div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold font-mono ${flipProfit < 0 ? 'text-danger' : 'text-success'}`}>
                {formatCurrency(flipProfit)}
              </div>
              <div className="text-muted-foreground text-sm mt-1">Flip Profit</div>
            </div>
            <div className="text-center">
              <div className={`text-xl font-bold font-mono ${flipROI < STRATEGY_THRESHOLDS.flip.roi ? 'text-warning' : 'text-success'}`}>
                {flipROI.toFixed(1)}% ROI
              </div>
            </div>
          </div>
        )}
      </div>

      {isUnlocked && outputs && (
        <>
          <div className="metric-card" data-testid="card-real-time-metrics">
            <h3 className="font-display text-foreground text-base font-semibold mb-4">
              Real-Time Metrics
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <MetricTooltip term="cashFlow">
                  <span className="text-muted-foreground text-sm">Monthly Cash Flow</span>
                </MetricTooltip>
                <span className={`font-mono font-bold ${cashFlowNegative ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(outputs.cashFlowMonthly)}/mo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cashOnCashNegative && <AlertTriangle className="w-4 h-4 text-warning" />}
                  <MetricTooltip term="cashOnCash">
                    <span className="text-muted-foreground text-sm">Cash-on-Cash (CoC)</span>
                  </MetricTooltip>
                </div>
                <span className={`font-mono font-bold ${cashOnCashNegative ? 'text-danger' : 'text-success'}`}>
                  {formatPercent(outputs.cashOnCash)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <MetricTooltip term="capRate">
                  <span className="text-muted-foreground text-sm">Cap Rate</span>
                </MetricTooltip>
                <span className="font-mono text-foreground">
                  {formatPercent(outputs.capRate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <MetricTooltip term="totalCashInvested">
                  <span className="text-muted-foreground text-sm">Total Cash Invested</span>
                </MetricTooltip>
                <span className="font-mono text-foreground">
                  {formatCurrency(outputs.totalCashInvested)}
                </span>
              </div>
            </div>
          </div>

          {onCommitDeal && (
            <button 
              onClick={onCommitDeal}
              className="game-button w-full flex items-center justify-center gap-2"
              data-testid="button-commit-deal"
            >
              <DollarSign className="w-5 h-5" />
              Commit to Deal
            </button>
          )}
        </>
      )}

      {/* Target Thresholds Card */}
      <div className="metric-card" data-testid="card-thresholds">
        <h3 className="font-display text-foreground text-base font-semibold mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-gold" />
          Success Thresholds
        </h3>
        
        {strategy === 'rent' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <MetricTooltip term="thresholdCoC">
                <span className="text-muted-foreground">Cash-on-Cash</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold trophy-icon-gold">{STRATEGY_THRESHOLDS.rent.cashOnCash}%+</span>
                {isUnlocked && outputs && (
                  outputs.cashOnCash >= STRATEGY_THRESHOLDS.rent.cashOnCash
                    ? <div className="trophy-icon-container"><TrendingUp className="w-4 h-4 text-success trophy-icon-success" /></div>
                    : <div className="trophy-icon-container"><TrendingDown className="w-4 h-4 text-danger trophy-icon-danger" /></div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <MetricTooltip term="cashFlow">
                <span className="text-muted-foreground">Monthly Cash Flow</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold trophy-icon-gold">Positive</span>
                {isUnlocked && outputs && (
                  outputs.cashFlowMonthly > 0
                    ? <div className="trophy-icon-container"><TrendingUp className="w-4 h-4 text-success trophy-icon-success" /></div>
                    : <div className="trophy-icon-container"><TrendingDown className="w-4 h-4 text-danger trophy-icon-danger" /></div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <MetricTooltip term="thresholdROI">
                <span className="text-muted-foreground">ROI</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold trophy-icon-gold">{STRATEGY_THRESHOLDS.flip.roi}%+</span>
                {isUnlocked && (
                  flipROI >= STRATEGY_THRESHOLDS.flip.roi
                    ? <div className="trophy-icon-container"><TrendingUp className="w-4 h-4 text-success trophy-icon-success" /></div>
                    : <div className="trophy-icon-container"><TrendingDown className="w-4 h-4 text-danger trophy-icon-danger" /></div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <MetricTooltip term="minProfit">
                <span className="text-muted-foreground">Min Profit</span>
              </MetricTooltip>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold trophy-icon-gold">{formatCurrency(STRATEGY_THRESHOLDS.flip.profitMin)}+</span>
                {isUnlocked && (
                  flipProfit >= STRATEGY_THRESHOLDS.flip.profitMin
                    ? <div className="trophy-icon-container"><TrendingUp className="w-4 h-4 text-success trophy-icon-success" /></div>
                    : <div className="trophy-icon-container"><TrendingDown className="w-4 h-4 text-danger trophy-icon-danger" /></div>
                )}
              </div>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className={`mt-3 pt-3 border-t border-border text-center text-sm font-semibold rounded-lg p-2 ${meetsThresholds ? 'text-success trophy-success-bg' : 'text-warning trophy-warning-bg'}`}>
            {meetsThresholds ? '✓ Meets Investment Criteria' : '⚠ Below Target Thresholds'}
          </div>
        )}
      </div>
    </div>
  );
}