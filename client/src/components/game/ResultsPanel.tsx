import { useEffect } from 'react';
import { ProFormaOutputs, formatCurrency } from '@/lib/gameData';
import { TrendingDown, TrendingUp, AlertTriangle, HelpCircle, Lightbulb, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import mortgageIcon from '@assets/generated_images/mortgage_document_game_icon.png';
import coinsIcon from '@assets/generated_images/gold_coins_stack_icon.png';

interface ResultsPanelProps {
  strategy: 'rent' | 'flip';
  outputs: ProFormaOutputs;
  flipProfit?: number;
  flipROI?: number;
  holdWeeks?: number;
  hasAppraisal?: boolean;
  onContinue: () => void;
}

interface ExplanationItem {
  type: 'error' | 'warning' | 'info' | 'tip';
  title: string;
  description: string;
}

export function ResultsPanel({ strategy, outputs, flipProfit = 0, flipROI = 0, holdWeeks = 0, hasAppraisal = true, onContinue }: ResultsPanelProps) {
  // Scroll to top and play sound when results panel mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Play results alert sound
    const audio = new Audio('/sounds/results-alert.wav');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore autoplay errors - some browsers block audio without user interaction
    });
  }, []);

  const isPositiveCashFlow = outputs.cashFlowMonthly > 0;
  const isGoodCashOnCash = outputs.cashOnCash > 8;
  const isGoodCapRate = outputs.capRate > 6;
  const isPositiveProfit = flipProfit > 0;
  const isGoodROI = flipROI > 20;
  
  const showFlipUnknown = strategy === 'flip' && !hasAppraisal;
  
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
    if (showFlipUnknown) {
      explanations.push({
        type: 'warning',
        title: 'Unknown ARV',
        description: `You skipped the Comp Analysis! Without knowing the After Repair Value, you're gambling on what buyers will pay. Your actual profit is unknown until you sell.`
      });
      explanations.push({
        type: 'info',
        title: 'Risky Decision',
        description: `Smart investors complete due diligence before committing capital. You'll discover the true value when you sell - hope it's not a loss!`
      });
    } else {
      if (!isPositiveProfit) {
        explanations.push({
          type: 'error',
          title: 'Projected Flip Profit',
          description: `Your all-in costs exceeded the ARV. This flip loses ${formatCurrency(Math.abs(flipProfit))}. Consider a lower purchase price or reduced rehab scope.`
        });
      } else if (flipProfit < 20000) {
        explanations.push({
          type: 'warning',
          title: 'Projected Flip Profit',
          description: `Your projected profit of ${formatCurrency(flipProfit)} is relatively thin. Unexpected costs could eat into margins quickly.`
        });
      } else {
        explanations.push({
          type: 'tip',
          title: 'Projected Flip Profit',
          description: `Strong projected profit of ${formatCurrency(flipProfit)}! This provides a healthy buffer for unexpected costs.`
        });
      }
      
      if (flipROI < 15) {
        explanations.push({
          type: 'warning',
          title: 'Return on Investment',
          description: `Your ${flipROI.toFixed(1)}% ROI is below the 20% target. The risk may not justify the return.`
        });
      } else if (flipROI < 20) {
        explanations.push({
          type: 'info',
          title: 'Return on Investment',
          description: `Your ${flipROI.toFixed(1)}% ROI is close but aim for 20%+ to account for market fluctuations.`
        });
      } else {
        explanations.push({
          type: 'tip',
          title: 'Return on Investment',
          description: `Excellent! Your ${flipROI.toFixed(1)}% ROI exceeds the 20% benchmark for flip investments.`
        });
      }
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
      : 'For flips, aim for at least 20% ROI to account for unexpected costs and market fluctuations.'
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
                    <div className="trophy-icon-container" style={{ padding: '0.75rem' }}>
                      {isPositiveCashFlow ? (
                        <TrendingUp className="w-6 h-6 text-emerald-400 trophy-icon-success" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-400 trophy-icon-danger" />
                      )}
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Monthly Cash Flow</div>
                      <div className={`text-2xl font-bold font-mono ${isPositiveCashFlow ? 'text-emerald-400' : 'text-red-400'}`} style={{ filter: isPositiveCashFlow ? 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' : 'drop-shadow(0 0 8px rgba(239,68,68,0.4))' }}>
                        {isPositiveCashFlow ? '' : '-'}{formatCurrency(Math.abs(outputs.cashFlowMonthly))}/mo
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="trophy-icon-container" style={{ padding: '0.75rem' }}>
                      {isGoodCashOnCash ? (
                        <Check className="w-6 h-6 text-emerald-400 trophy-icon-success" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-400 trophy-icon-warning" />
                      )}
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Cash-on-Cash Return</div>
                      <div className={`text-2xl font-bold font-mono ${outputs.cashOnCash > 0 ? (isGoodCashOnCash ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`} style={{ filter: outputs.cashOnCash > 0 ? (isGoodCashOnCash ? 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' : 'drop-shadow(0 0 8px rgba(251,191,36,0.4))') : 'drop-shadow(0 0 8px rgba(239,68,68,0.4))' }}>
                        {outputs.cashOnCash.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isGoodCapRate ? (
                      <Check className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className="cursor-help touch-manipulation active:opacity-70 p-2 -m-2">
                            <HelpCircle className="w-6 h-6 text-blue-400 hover:text-blue-300 transition-colors" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="right" className="max-w-sm bg-slate-800 border-blue-500/50 text-gray-200 text-sm p-4 z-[100]">
                          <div className="space-y-2">
                            <p className="font-semibold text-blue-400">What is Cap Rate?</p>
                            <p className="text-gray-300">Cap Rate (Capitalization Rate) measures your property's return if you paid all cash - no mortgage. It's calculated as Net Operating Income ÷ Property Value.</p>
                            <p className="text-emerald-400 text-xs mt-2">→ Most investors look for 6-10% cap rates. Below 6% means you're paying a premium for the property.</p>
                          </div>
                        </PopoverContent>
                      </Popover>
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
                    <div className="trophy-icon-container" style={{ padding: '0.75rem' }}>
                      {showFlipUnknown ? (
                        <HelpCircle className="w-6 h-6 text-amber-400 trophy-icon-warning" />
                      ) : isPositiveProfit ? (
                        <TrendingUp className="w-6 h-6 text-emerald-400 trophy-icon-success" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-400 trophy-icon-danger" />
                      )}
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Projected Profit</div>
                      {showFlipUnknown ? (
                        <div className="text-2xl font-bold font-mono text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' }}>
                          ???
                        </div>
                      ) : (
                        <div className={`text-2xl font-bold font-mono ${isPositiveProfit ? 'text-emerald-400' : 'text-red-400'}`} style={{ filter: isPositiveProfit ? 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' : 'drop-shadow(0 0 8px rgba(239,68,68,0.4))' }}>
                          {isPositiveProfit ? '' : '-'}{formatCurrency(Math.abs(flipProfit))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="trophy-icon-container" style={{ padding: '0.75rem' }}>
                      {showFlipUnknown ? (
                        <HelpCircle className="w-6 h-6 text-amber-400 trophy-icon-warning" />
                      ) : isGoodROI ? (
                        <Check className="w-6 h-6 text-emerald-400 trophy-icon-success" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-amber-400 trophy-icon-warning" />
                      )}
                    </div>
                    <div>
                      <div className="text-gray-400 text-sm">Return on Investment</div>
                      {showFlipUnknown ? (
                        <div className="text-2xl font-bold font-mono text-amber-400" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.4))' }}>
                          ???
                        </div>
                      ) : (
                        <div className={`text-2xl font-bold font-mono ${flipROI > 0 ? (isGoodROI ? 'text-emerald-400' : 'text-amber-400') : 'text-red-400'}`} style={{ filter: flipROI > 0 ? (isGoodROI ? 'drop-shadow(0 0 8px rgba(16,185,129,0.5))' : 'drop-shadow(0 0 8px rgba(251,191,36,0.4))') : 'drop-shadow(0 0 8px rgba(239,68,68,0.4))' }}>
                          {flipROI.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button type="button" className="cursor-help touch-manipulation active:opacity-70 p-2 -m-2">
                          <HelpCircle className="w-6 h-6 text-blue-400 hover:text-blue-300 transition-colors" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent side="right" className="max-w-sm bg-slate-800 border-blue-500/50 text-gray-200 text-sm p-4 z-[100]">
                        <div className="space-y-2">
                          <p className="font-semibold text-blue-400">What is Hold Time?</p>
                          <p className="text-gray-300">Hold Time is how long you own the property before selling. Every week costs money - loan interest, taxes, insurance, utilities. The longer you hold, the more these "carrying costs" eat into your profit.</p>
                          <p className="text-emerald-400 text-xs mt-2">→ For flips, aim for 12-16 weeks max. Longer holds mean more risk and lower returns.</p>
                        </div>
                      </PopoverContent>
                    </Popover>
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
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Verdict Summary */}
          <div className={`rounded-xl border p-5 ${
            strategy === 'rent' 
              ? (isPositiveCashFlow && isGoodCashOnCash 
                  ? 'bg-emerald-500/10 border-emerald-500/50' 
                  : 'bg-red-500/10 border-red-500/50')
              : showFlipUnknown
                  ? 'bg-amber-500/10 border-amber-500/50'
                  : (isPositiveProfit && isGoodROI 
                      ? 'bg-emerald-500/10 border-emerald-500/50' 
                      : 'bg-red-500/10 border-red-500/50')
          }`} data-testid="deal-verdict">
            <div className="flex items-center gap-3 mb-3">
              <div className="trophy-icon-container" style={{ padding: '1rem' }}>
                {strategy === 'rent' ? (
                  isPositiveCashFlow && isGoodCashOnCash ? (
                    <Check className="w-8 h-8 text-emerald-400 trophy-icon-success" />
                  ) : (
                    <X className="w-8 h-8 text-red-400 trophy-icon-danger" />
                  )
                ) : showFlipUnknown ? (
                  <HelpCircle className="w-8 h-8 text-amber-400 trophy-icon-warning" />
                ) : (
                  isPositiveProfit && isGoodROI ? (
                    <Check className="w-8 h-8 text-emerald-400 trophy-icon-success" />
                  ) : (
                    <X className="w-8 h-8 text-red-400 trophy-icon-danger" />
                  )
                )}
              </div>
              <h3 className={`text-xl font-bold ${
                strategy === 'rent'
                  ? (isPositiveCashFlow && isGoodCashOnCash ? 'text-emerald-400' : 'text-red-400')
                  : showFlipUnknown ? 'text-amber-400' : (isPositiveProfit && isGoodROI ? 'text-emerald-400' : 'text-red-400')
              }`} style={{
                filter: strategy === 'rent' 
                  ? ((isPositiveCashFlow && isGoodCashOnCash)
                      ? 'drop-shadow(0 0 12px rgba(16,185,129,0.6))'
                      : 'drop-shadow(0 0 12px rgba(239,68,68,0.5))')
                  : showFlipUnknown
                      ? 'drop-shadow(0 0 12px rgba(251,191,36,0.6))'
                      : ((isPositiveProfit && isGoodROI)
                          ? 'drop-shadow(0 0 12px rgba(16,185,129,0.6))'
                          : 'drop-shadow(0 0 12px rgba(239,68,68,0.5))')
              }}>
                {strategy === 'rent'
                  ? (isPositiveCashFlow && isGoodCashOnCash ? '🏆 Deal Meets Rental Thresholds' : '❌ Deal Fails Rental Thresholds')
                  : showFlipUnknown ? '⚠️ Outcome Unknown - No Appraisal' : (isPositiveProfit && isGoodROI ? '🏆 Deal Meets Flip Thresholds' : '❌ Deal Fails Flip Thresholds')
                }
              </h3>
            </div>
            
            <div className="text-gray-300 text-sm space-y-2">
              {strategy === 'rent' ? (
                <>
                  <p>
                    <strong>Required:</strong> 8% Cash-on-Cash + Positive Cash Flow
                  </p>
                  <p>
                    <strong>Your Deal:</strong> {outputs.cashOnCash.toFixed(1)}% CoC {isGoodCashOnCash ? '✓' : '✗'} | {formatCurrency(outputs.cashFlowMonthly)}/mo {isPositiveCashFlow ? '✓' : '✗'}
                  </p>
                  <p className="text-gray-400 mt-2">
                    {isPositiveCashFlow && isGoodCashOnCash 
                      ? `This deal works because your rent covers all expenses with margin. Your vacancy buffer and contingency provide protection against surprises.`
                      : !isPositiveCashFlow 
                        ? `This deal fails because rent doesn't cover your mortgage and expenses. Consider: Is rent too optimistic? Is the purchase price too high? Are you using the right financing?`
                        : `This deal has positive cash flow but ${outputs.cashOnCash.toFixed(1)}% CoC is below the 8% threshold. Your capital would work harder elsewhere. Consider negotiating a lower price or finding higher rents.`
                    }
                  </p>
                </>
              ) : showFlipUnknown ? (
                <>
                  <p>
                    <strong>Status:</strong> You skipped the Comp Analysis due diligence
                  </p>
                  <p>
                    <strong>Your Deal:</strong> ROI ??? | Profit ???
                  </p>
                  <p className="text-gray-400 mt-2">
                    Without knowing the After Repair Value (ARV), you can't calculate profit or ROI. You're essentially gambling on what buyers will pay. The true outcome will be revealed when you sell.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Required:</strong> 20% ROI + $15,000 Minimum Profit
                  </p>
                  <p>
                    <strong>Your Deal:</strong> {flipROI.toFixed(1)}% ROI {isGoodROI ? '✓' : '✗'} | {formatCurrency(flipProfit)} profit {flipProfit >= 15000 ? '✓' : '✗'}
                  </p>
                  <p className="text-gray-400 mt-2">
                    {isPositiveProfit && isGoodROI
                      ? `This deal works because your ARV estimate minus all costs leaves ${formatCurrency(flipProfit)} profit. Your contingency helps protect this margin.`
                      : !isPositiveProfit
                        ? `This deal loses money. Either your ARV is too optimistic, rehab costs are underestimated, or the purchase price is too high. Check your assumptions.`
                        : `Profit is positive but ${flipROI.toFixed(1)}% ROI is below the 20% threshold. This margin is too thin to absorb surprises. You need more spread between purchase price and ARV.`
                    }
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 rounded-xl border border-slate-700 p-5">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-700 pb-2">
              Detailed Analysis
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
          data-no-click-sound
        >
          Continue
        </button>
      </div>
    </div>
  );
}
