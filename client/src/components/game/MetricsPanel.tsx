import { Lock, AlertTriangle, Star, Building2, Clock } from 'lucide-react';
import { ProFormaOutputs, formatCurrency, formatPercent } from '@/lib/gameData';

interface MetricsPanelProps {
  outputs: ProFormaOutputs | null;
  isUnlocked: boolean;
}

export function MetricsPanel({ outputs, isUnlocked }: MetricsPanelProps) {
  const cashFlowNegative = outputs && outputs.cashFlowMonthly < 0;
  const cashOnCashNegative = outputs && outputs.cashOnCash < 0;

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
      )}

      <div className="metric-card" data-testid="card-badges">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-gold" fill="hsl(43 85% 55%)" />
          </div>
          <div>
            <div className="text-foreground font-semibold text-sm">Complete Rehab</div>
            <div className="text-muted-foreground text-xs">Desfortiones Pogers</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <button 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
          data-testid="button-add-property"
        >
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-foreground text-sm font-medium">Add Property</span>
        </button>

        <button 
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border hover:bg-muted transition-colors"
          data-testid="button-wait-reset"
        >
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
            <Clock className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-foreground text-sm font-medium">Wait to Reset</span>
        </button>
      </div>
    </div>
  );
}