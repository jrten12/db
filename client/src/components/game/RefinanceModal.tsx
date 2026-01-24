import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, TrendingUp, DollarSign, Percent, Building2, AlertCircle, ArrowRight, Banknote, Calculator, Info } from 'lucide-react';
import { api, type RefinanceOptions, type LtvOption } from '@/lib/api';
import type { Deal, Property, GameRun } from '@shared/schema';

interface RefinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  property: Property;
  gameRun: GameRun;
  onRefinance: (dealId: number, selectedLtv: number) => Promise<void>;
}

export function RefinanceModal({ isOpen, onClose, deal, property, gameRun, onRefinance }: RefinanceModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [options, setOptions] = useState<RefinanceOptions | null>(null);
  const [selectedLtv, setSelectedLtv] = useState<number>(75);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && deal && gameRun) {
      loadOptions();
    }
  }, [isOpen, deal?.id, gameRun?.id]);

  const loadOptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const opts = await api.getRefinanceOptions(deal.id, gameRun.id);
      setOptions(opts);
      if (opts.eligible && opts.ltvOptions && opts.ltvOptions.length > 0) {
        const midIndex = Math.floor(opts.ltvOptions.length / 2);
        setSelectedLtv(opts.ltvOptions[midIndex].ltv);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load refinance options');
    } finally {
      setLoading(false);
    }
  };

  const handleRefinance = async () => {
    setSubmitting(true);
    try {
      await onRefinance(deal.id, selectedLtv);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Refinance failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOption = options?.ltvOptions?.find(o => o.ltv === selectedLtv);
  
  // Get current monthly payment from deal
  const currentMonthlyPayment = useMemo(() => {
    const outputs = deal?.proFormaOutputs as any;
    return outputs?.debtServiceMonthly || outputs?.monthlyDebtService || 0;
  }, [deal]);
  
  // Calculate dynamic interest rate based on LTV (higher LTV = higher risk = higher rate)
  const getDynamicRate = (ltv: number, baseRate: number) => {
    // LTV risk adjustment: +0.5% for each 10% LTV above 65%
    const ltvPremium = ltv > 65 ? ((ltv - 65) / 10) * 0.5 : 0;
    return Math.min(12, baseRate + ltvPremium);
  };
  
  const dynamicRate = selectedOption && options?.interestRate 
    ? getDynamicRate(selectedLtv, options.interestRate)
    : options?.interestRate || 7;
  
  // Recalculate monthly payment with dynamic rate
  const recalculatedMonthlyPayment = useMemo(() => {
    if (!selectedOption || !options) return selectedOption?.monthlyPayment || 0;
    const monthlyRate = dynamicRate / 100 / 12;
    const termMonths = 360;
    const principal = selectedOption.newLoanAmount;
    if (monthlyRate === 0) return principal / termMonths;
    return Math.round(principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1));
  }, [selectedOption, dynamicRate, options]);
  
  const paymentChange = recalculatedMonthlyPayment - currentMonthlyPayment;

  const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const formatPercent = (n: number) => `${n.toFixed(2)}%`;
  
  // Check if there are no viable LTV options
  const noViableOptions = options?.eligible && (!options.ltvOptions || options.ltvOptions.length === 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-slate-700 text-white">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30">
              <Building2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Refinance {property.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Unlock your equity with a cash-out refinance
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400 py-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        ) : !options?.eligible ? (
          <div className="py-6 space-y-4">
            <div className="bg-amber-900/30 border border-amber-500/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-300">{options?.reason}</p>
                  {options?.weeksUntilEligible && options.weeksUntilEligible > 0 && (
                    <p className="text-sm text-amber-200/70 mt-2">
                      ⏳ {options.weeksUntilEligible} more weeks until eligible (seasoning period)
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-sm text-slate-400">
              <p className="flex items-center gap-2">
                <Info className="w-4 h-4" />
                Banks require a "seasoning period" of 8 weeks before refinancing to verify property performance.
              </p>
            </div>
            <Button onClick={onClose} variant="outline" className="w-full border-slate-600">
              Got it
            </Button>
          </div>
        ) : noViableOptions ? (
          (() => {
            // Calculate what they need to cash out
            const marketValue = options.currentMarketValue || 0;
            const loanBalance = options.currentLoanBalance || 0;
            const currentEquity = options.currentEquity || 0;
            const equityPercent = options.equityPercent || 0;
            const maxLtv = options.maxLtv || 80; // Use actual max LTV from options
            const refinanceFeeRate = 0.02; // 2% refinance fees
            
            // To cash out, they need: (newLoanAmount - fees) > currentLoanBalance
            // newLoanAmount = marketValue * maxLtv
            // So: marketValue * maxLtv * (1 - feeRate) > loanBalance
            // Required equity % to break even: 1 - maxLtv + (maxLtv * feeRate) = 25% + 1.5% = ~26.5%
            const minEquityNeeded = Math.round((1 - maxLtv / 100 + (maxLtv / 100 * refinanceFeeRate)) * 100);
            
            // How much do they need to pay down?
            const maxLoanForCashOut = marketValue * (maxLtv / 100) * (1 - refinanceFeeRate);
            const payDownNeeded = Math.max(0, loanBalance - maxLoanForCashOut);
            
            // OR: How much appreciation would they need?
            // For current loan balance to allow cash out: loanBalance / (maxLtv/100 * (1-feeRate)) = requiredValue
            const requiredValueForCashOut = loanBalance / ((maxLtv / 100) * (1 - refinanceFeeRate));
            const appreciationNeeded = Math.max(0, requiredValueForCashOut - marketValue);
            
            return (
              <div className="py-6 space-y-4">
                <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-300">Not enough equity to cash out</p>
                      <p className="text-sm text-red-200/70 mt-2">
                        You have {equityPercent}% equity, but you need at least <span className="text-amber-300 font-medium">{minEquityNeeded}%</span> to cash out after refinance fees.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Current situation */}
                <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                  <p className="text-sm text-slate-400">Current situation:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Market Value:</span>
                      <span className="text-green-400">{formatCurrency(marketValue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Loan Balance:</span>
                      <span className="text-slate-300">{formatCurrency(loanBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Your Equity:</span>
                      <span className="text-blue-400">{formatCurrency(currentEquity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Equity %:</span>
                      <span className={equityPercent >= minEquityNeeded ? 'text-green-400' : 'text-amber-400'}>{equityPercent}%</span>
                    </div>
                  </div>
                </div>
                
                {/* What they need to do */}
                <div className="bg-cyan-900/20 border border-cyan-600/30 rounded-lg p-3 space-y-3">
                  <p className="text-sm text-cyan-300 font-medium flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    How to unlock cash-out refinancing:
                  </p>
                  <div className="space-y-2 text-sm">
                    {payDownNeeded > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-medium">Option 1:</span>
                        <span className="text-slate-300">
                          Pay down <span className="text-cyan-300 font-medium">{formatCurrency(payDownNeeded)}</span> more of your loan principal
                        </span>
                      </div>
                    )}
                    {appreciationNeeded > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-cyan-400 font-medium">Option 2:</span>
                        <span className="text-slate-300">
                          Wait for <span className="text-cyan-300 font-medium">{formatCurrency(appreciationNeeded)}</span> more appreciation ({((appreciationNeeded / marketValue) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 pt-1 border-t border-slate-700/50">
                    Max refinance LTV is {maxLtv}% with {(refinanceFeeRate * 100).toFixed(0)}% fees, so you need &gt;{minEquityNeeded}% equity to get cash back.
                  </p>
                </div>
                
                <Button onClick={onClose} variant="outline" className="w-full border-slate-600">
                  Close
                </Button>
              </div>
            );
          })()
        ) : (
          <div className="space-y-5 py-2">
            {/* Property Value Hero Section */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-green-900/40 via-emerald-900/30 to-cyan-900/40 border border-green-500/30 p-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-400/10 rounded-full blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-400/80 uppercase tracking-wider font-medium">Market Value</p>
                  <p className="text-3xl font-bold text-green-400">
                    {formatCurrency(options.currentMarketValue || 0)}
                  </p>
                  {options.currentMarketValue && property.price && (
                    <p className="text-sm text-green-300/70 mt-1">
                      +{((options.currentMarketValue / property.price - 1) * 100).toFixed(1)}% appreciation
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-cyan-400/80 uppercase tracking-wider font-medium">Your Equity</p>
                  <p className="text-2xl font-bold text-cyan-400">
                    {formatCurrency(options.currentEquity || 0)}
                  </p>
                  <p className="text-sm text-cyan-300/70 mt-1">
                    {options.equityPercent}% position
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase">Loan Balance</p>
                <p className="text-lg font-semibold text-slate-300">
                  {formatCurrency(options.currentLoanBalance || 0)}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-xs text-slate-500 uppercase">Your Rate</p>
                <p className="text-lg font-semibold text-blue-400">
                  {formatPercent(options.interestRate || 0)}
                </p>
              </div>
            </div>

            {/* LTV Selection Section */}
            <div className="space-y-4 bg-gradient-to-br from-blue-950/30 to-indigo-950/30 rounded-xl p-4 border border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <label className="font-semibold">Choose Your Leverage</label>
                </div>
                <div className="px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30">
                  <span className="text-xl font-bold text-blue-400">{selectedLtv}% LTV</span>
                </div>
              </div>
              
              {options.ltvOptions && options.ltvOptions.length > 0 ? (
                <>
                  <Slider
                    value={[selectedLtv]}
                    onValueChange={([val]) => setSelectedLtv(val)}
                    min={options.ltvOptions[0]?.ltv || options.minLtv || 50}
                    max={options.ltvOptions[options.ltvOptions.length - 1]?.ltv || options.maxLtv || 90}
                    step={5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      {options.ltvOptions[0]?.ltv}% Conservative
                    </span>
                    <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {options.ltvOptions[options.ltvOptions.length - 1]?.ltv}% Max Cash
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-400">
                  No viable LTV options available
                </div>
              )}
            </div>

            {/* Payment Comparison Section */}
            {selectedOption && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-600 overflow-hidden">
                {/* Monthly Payment Comparison */}
                <div className="p-4 border-b border-slate-700">
                  <div className="text-xs text-slate-500 uppercase mb-3 flex items-center gap-1">
                    <Banknote className="w-3 h-3" />
                    Monthly Payment Comparison
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Current</p>
                      <p className="text-lg font-semibold text-slate-300">{formatCurrency(currentMonthlyPayment)}</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <ArrowRight className="w-5 h-5 text-blue-400" />
                      <span className={`text-xs font-medium ${paymentChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {paymentChange > 0 ? '+' : ''}{formatCurrency(paymentChange)}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500">New</p>
                      <p className="text-lg font-semibold text-white">{formatCurrency(recalculatedMonthlyPayment)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Cash Out Highlight */}
                <div className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      Cash Out to Your Pocket
                    </span>
                    <span className="text-2xl font-bold text-green-400">
                      {formatCurrency(selectedOption.cashOut)}
                    </span>
                  </div>
                </div>
                
                {/* Loan Details */}
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">New Loan Amount</span>
                    <span className="text-white">{formatCurrency(selectedOption.newLoanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Interest Rate</span>
                    <span className="text-white">{formatPercent(dynamicRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Refinance Fees (2%)</span>
                    <span className="text-red-400">-{formatCurrency(selectedOption.refinanceFees)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pays Off Old Loan</span>
                    <span className="text-slate-300">-{formatCurrency(options.currentLoanBalance || 0)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Rate Explanation */}
            {options.playerMetrics && (
              <div className="text-xs text-slate-500 bg-slate-800/30 rounded-lg p-3 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Rate based on: {options.playerMetrics.dti}% debt-to-income, 
                  {' '}{options.playerMetrics.reserveMonths.toFixed(1)} months cash reserves.
                  Higher LTV = higher rate (bank risk premium).
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-slate-600 hover:bg-slate-800"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefinance}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={submitting || !selectedOption || selectedOption.cashOut <= 0}
                data-testid="button-confirm-refinance"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Refinance
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
