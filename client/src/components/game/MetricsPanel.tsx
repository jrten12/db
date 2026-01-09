import { Lock, AlertTriangle, Star, DollarSign, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { ProFormaOutputs, formatCurrency, formatPercent } from '@/lib/gameData';

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
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold font-mono ${cashFlowNegative ? 'text-danger' : 'text-success'}`}>
                {outputs ? formatCurrency(outputs.cashFlowMonthly) : '$0'}/mo
              </div>
              <div className="text-muted-foreground text-sm mt-1">Monthly Cash Flow</div>
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
                <span className="text-muted-foreground text-sm">Monthly Cash Flow</span>
                <span className={`font-mono font-bold ${cashFlowNegative ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(outputs.cashFlowMonthly)}/mo
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cashOnCashNegative && <AlertTriangle className="w-4 h-4 text-warning" />}
                  <span className="text-muted-foreground text-sm">Cash-on-Cash Return</span>
                </div>
                <span className={`font-mono font-bold ${cashOnCashNegative ? 'text-danger' : 'text-success'}`}>
                  {formatPercent(outputs.cashOnCash)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Cap Rate</span>
                <span className="font-mono text-foreground">
                  {formatPercent(outputs.capRate)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Total Cash Invested</span>
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
              <span className="text-muted-foreground">Cash-on-Cash</span>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold">{STRATEGY_THRESHOLDS.rent.cashOnCash}%+</span>
                {isUnlocked && outputs && (
                  outputs.cashOnCash >= STRATEGY_THRESHOLDS.rent.cashOnCash 
                    ? <TrendingUp className="w-4 h-4 text-success" />
                    : <TrendingDown className="w-4 h-4 text-danger" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Monthly Cash Flow</span>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold">Positive</span>
                {isUnlocked && outputs && (
                  outputs.cashFlowMonthly > 0
                    ? <TrendingUp className="w-4 h-4 text-success" />
                    : <TrendingDown className="w-4 h-4 text-danger" />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">ROI</span>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold">{STRATEGY_THRESHOLDS.flip.roi}%+</span>
                {isUnlocked && (
                  flipROI >= STRATEGY_THRESHOLDS.flip.roi
                    ? <TrendingUp className="w-4 h-4 text-success" />
                    : <TrendingDown className="w-4 h-4 text-danger" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Min Profit</span>
              <div className="flex items-center gap-2">
                <span className="text-gold font-bold">{formatCurrency(STRATEGY_THRESHOLDS.flip.profitMin)}+</span>
                {isUnlocked && (
                  flipProfit >= STRATEGY_THRESHOLDS.flip.profitMin
                    ? <TrendingUp className="w-4 h-4 text-success" />
                    : <TrendingDown className="w-4 h-4 text-danger" />
                )}
              </div>
            </div>
          </div>
        )}

        {isUnlocked && (
          <div className={`mt-3 pt-3 border-t border-border text-center text-sm font-semibold ${meetsThresholds ? 'text-success' : 'text-warning'}`}>
            {meetsThresholds ? 'Meets Investment Criteria' : 'Below Target Thresholds'}
          </div>
        )}
      </div>
    </div>
  );
}