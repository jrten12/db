import { ProFormaOutputs, formatCurrency } from '@/lib/gameData';
import { TrendingDown, TrendingUp, AlertTriangle, HelpCircle, Lightbulb, X, Check } from 'lucide-react';
import mortgageIcon from '@assets/generated_images/mortgage_document_game_icon.png';
import coinsIcon from '@assets/generated_images/gold_coins_stack_icon.png';

interface ResultsPanelProps {
  strategy: 'rent' | 'flip';
  outputs: ProFormaOutputs;
  flipProfit?: number;
  flipROI?: number;
  holdWeeks?: number;
  onContinue: () => void;
}

interface ExplanationItem {
  type: 'error' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
}

export function ResultsPanel({ strategy, outputs, flipProfit = 0, flipROI = 0, holdWeeks = 0, onContinue }: ResultsPanelProps) {
  const isPositiveCashFlow = outputs.cashFlowMonthly > 0;
  const isGoodCashOnCash = outputs.cashOnCash > 8;
  const isGoodCapRate = outputs.capRate > 6;
  const isPositiveProfit = flipProfit > 0;
  const isGoodROI = flipROI > 15;
  
  const explanations: ExplanationItem[] = [];
  
  if (strategy === 'rent') {
    if (!isPositiveCashFlow) {
      explanations.push({
        type: 'error',
        title: 'Monthly Cash Flow',
        description: `Your mortgage payment (${formatCurrency(outputs.debtServiceMonthly)}) and expenses greatly exceeded rent after accounting for vacancy and costs.`
      });
    } else {
      explanations.push({
        type: 'tip',
        title: 'Monthly Cash Flow',
        description: `You're earning ${formatCurrency(outputs.cashFlowMonthly)}/month after all expenses. This property generates positive cash flow!`
      });
    }
    
    if (outputs.cashOnCash < 0) {
      explanations.push({
        type: 'warning',
        title: 'Cash-on-Cash Return',
        description: `Your ${formatCurrency(Math.abs(outputs.cashFlowMonthly))}/month loss amounted to a ${outputs.cashOnCash.toFixed(1)}% return due to significant out-of-pocket cash investment.`
      });
    } else if (outputs.cashOnCash < 8) {
      explanations.push({
        type: 'info',
        title: 'Cash-on-Cash Return',
        description: `Your ${outputs.cashOnCash.toFixed(1)}% return is below the typical 8-12% target. Consider negotiating a lower purchase price or increasing rent.`
      });
    } else {
      explanations.push({
        type: 'tip',
        title: 'Cash-on-Cash Return',
        description: `Excellent! Your ${outputs.cashOnCash.toFixed(1)}% cash-on-cash return exceeds the 8% benchmark for rental properties.`
      });
    }
    
    if (outputs.capRate < 5) {
      explanations.push({
        type: 'info',
        title: 'Cap Rate',
        description: `As a result of the ${isPositiveCashFlow ? 'lower income' : 'negative cash flow'}, your Cap Rate is ${outputs.capRate.toFixed(1)}% (too low). Consider adjusting rehab-costs or financing.`
      });
    }
  } else {
    if (!isPositiveProfit) {
      explanations.push({
        type: 'error',
        title: 'Flip Profit',
        description: `Your all-in costs exceeded the ARV. This flip loses ${formatCurrency(Math.abs(flipProfit))}. Consider a lower purchase price or reduced rehab scope.`
      });
    } else if (flipProfit < 20000) {
      explanations.push({
        type: 'warning',
        title: 'Flip Profit',
        description: `Your projected profit of ${formatCurrency(flipProfit)} is relatively thin. Unexpected costs could eat into margins quickly.`
      });
    } else {
      explanations.push({
        type: 'tip',
        title: 'Flip Profit',
        description: `Strong projected profit of ${formatCurrency(flipProfit)}! This provides a healthy buffer for unexpected costs.`
      });
    }
    
    if (flipROI < 10) {
      explanations.push({
        type: 'warning',
        title: 'Return on Investment',
        description: `Your ${flipROI.toFixed(1)}% ROI is below the 15-20% target. The risk may not justify the return.`
      });
    } else if (flipROI < 15) {
      explanations.push({
        type: 'info',
        title: 'Return on Investment',
        description: `Your ${flipROI.toFixed(1)}% ROI is acceptable but aim for 15-20% to account for market fluctuations.`
      });
    } else {
      explanations.push({
        type: 'tip',
        title: 'Return on Investment',
        description: `Excellent! Your ${flipROI.toFixed(1)}% ROI exceeds the 15% benchmark for flip investments.`
      });
    }
    
    if (holdWeeks > 16) {
      explanations.push({
        type: 'warning',
        title: 'Hold Time',
        description: `Your ${holdWeeks} week timeline is lengthy. Longer holds increase carrying costs and market risk.`
      });
    }
  }
  
  explanations.push({
    type: 'tip',
    title: 'Tip',
    description: strategy === 'rent' 
      ? 'Aiming for a positive Monthly Cash Flow and a Cap Rate above 6-8% is typically a safer bet for a rental property.'
      : 'For flips, aim for at least 15-20% ROI to account for unexpected costs and market fluctuations.'
  });

  const getIcon = (type: ExplanationItem['type']) => {
    switch (type) {
      case 'error': return <X className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info': return <HelpCircle className="w-5 h-5 text-blue-400" />;
      case 'tip': return <Lightbulb className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getBorderColor = (type: ExplanationItem['type']) => {
    switch (type) {
      case 'error': return 'border-l-red-500';
      case 'warning': return 'border-l-amber-500';
      case 'info': return 'border-l-blue-400';
      case 'tip': return 'border-l-yellow-400';
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-amber-700/50 shadow-2xl overflow-hidden" data-testid="results-panel">
      {/* Header */}
      <div className="text-center py-6 border-b border-amber-700/30">
        <h1 className="text-4xl font-bold text-white tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
          RESULTS
        </h1>
        <p className="text-amber-400 mt-2 font-medium">
          {strategy === 'rent' ? 'Rental Strategy Analysis' : 'Flip Strategy Analysis'}
        </p>
      </div>

      {/* Content Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Metrics */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">
              Real-Time Metrics
            </h3>
            
            <div className="space-y-4">
              {strategy === 'rent' ? (
                <>
                  <div className="flex items-center gap-3">
                    {isPositiveCashFlow ? (
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <div className="text-gray-400 text-sm">Monthly Cash Flow</div>
                      <div className={`text-2xl font-bold font-mono ${isPositiveCashFlow ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositiveCashFlow ? '' : '-'}{formatCurrency(Math.abs(outputs.cashFlowMonthly))}/mo
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isGoodCashOnCash ? (
                      <Check className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    )}
                    <div>
                      <div className="text-gray-400 text-sm">Cash-on-Cash Return</div>
                      <div className={`text-2xl font-bold font-mono ${outputs.cashOnCash > 0 ? (isGoodCashOnCash ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`}>
                        {outputs.cashOnCash.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isGoodCapRate ? (
                      <Check className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <HelpCircle className="w-6 h-6 text-blue-400" />
                    )}
                    <div>
                      <div className="text-gray-400 text-sm">Cap Rate</div>
                      <div className={`text-2xl font-bold font-mono ${isGoodCapRate ? 'text-emerald-400' : 'text-blue-400'}`}>
                        {outputs.capRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {isPositiveProfit ? (
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <div className="text-gray-400 text-sm">Projected Profit</div>
                      <div className={`text-2xl font-bold font-mono ${isPositiveProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositiveProfit ? '' : '-'}{formatCurrency(Math.abs(flipProfit))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isGoodROI ? (
                      <Check className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    )}
                    <div>
                      <div className="text-gray-400 text-sm">Return on Investment</div>
                      <div className={`text-2xl font-bold font-mono ${flipROI > 0 ? (isGoodROI ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`}>
                        {flipROI.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-blue-400" />
                    <div>
                      <div className="text-gray-400 text-sm">Hold Time</div>
                      <div className="text-2xl font-bold font-mono text-white">
                        {holdWeeks} weeks
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Decorative Elements */}
            <div className="mt-6 flex items-end justify-between opacity-60">
              <img 
                src={mortgageIcon} 
                alt="" 
                className="w-20 h-20 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <img 
                src={coinsIcon} 
                alt="" 
                className="w-16 h-16 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Explanations */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-5 h-full">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">
              Explanation
            </h3>
            
            <div className="space-y-4">
              {explanations.map((item, index) => (
                <div 
                  key={index}
                  className={`bg-slate-800/50 rounded-lg p-4 border-l-4 ${getBorderColor(item.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getIcon(item.type)}</div>
                    <div>
                      <span className="font-semibold text-white">{item.title}:</span>
                      <span className="text-gray-300 ml-2">{item.description}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer with Continue Button */}
      <div className="p-6 pt-0">
        <div className="text-center text-gray-400 text-sm mb-4">
          {strategy === 'rent' 
            ? 'Tip: Aiming for a positive Monthly Cash Flow and a Cap Rate above 6-8% is typically a safer bet for a rental property.'
            : 'Tip: For flips, aim for at least 15-20% ROI to account for unexpected costs and market fluctuations.'
          }
        </div>
        
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all duration-300"
          style={{
            background: 'linear-gradient(180deg, #4ade80 0%, #16a34a 50%, #15803d 100%)',
            boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            border: '2px solid #22c55e',
          }}
          data-testid="button-continue-results"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
