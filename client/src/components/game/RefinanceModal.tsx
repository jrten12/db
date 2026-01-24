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
      <DialogContent className="max-w-lg bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Building2 className="w-5 h-5 text-blue-400" />
            Refinance {property.name}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Cash out your equity with a new loan based on current market value
          </DialogDescription>
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
          <div className="py-6 space-y-4">
            <div className="bg-red-900/30 border border-red-500/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-300">Not enough equity to cash out</p>
                  <p className="text-sm text-red-200/70 mt-2">
                    Your current loan balance ({formatCurrency(options.currentLoanBalance || 0)}) is too close to the property value. 
                    After refinance fees, there's no cash left to take out.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
              <p className="text-sm text-slate-400">Current situation:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Market Value:</span>
                  <span className="text-green-400">{formatCurrency(options.currentMarketValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Loan Balance:</span>
                  <span className="text-slate-300">{formatCurrency(options.currentLoanBalance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Equity:</span>
                  <span className="text-blue-400">{formatCurrency(options.currentEquity || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Equity %:</span>
                  <span className="text-blue-400">{options.equityPercent}%</span>
                </div>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" className="w-full border-slate-600">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase">Current Market Value</p>
                <p className="text-lg font-semibold text-green-400">
                  {formatCurrency(options.currentMarketValue || 0)}
                </p>
                <p className="text-xs text-slate-500">
                  {options.currentMarketValue && property.price 
                    ? `+${((options.currentMarketValue / property.price - 1) * 100).toFixed(1)}% appreciation` 
                    : ''}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase">Current Equity</p>
                <p className="text-lg font-semibold text-blue-400">
                  {formatCurrency(options.currentEquity || 0)}
                </p>
                <p className="text-xs text-slate-500">
                  {options.equityPercent}% equity position
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase">Your Rate</p>
                <p className="text-lg font-semibold">
                  {formatPercent(options.interestRate || 0)}
                </p>
                <p className="text-xs text-slate-500">
                  Based on your financials
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase">Current Loan Balance</p>
                <p className="text-lg font-semibold text-slate-300">
                  {formatCurrency(options.currentLoanBalance || 0)}
                </p>
              </div>
            </div>

            {/* LTV Selection Section */}
            <div className="space-y-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-400" />
                  <label className="font-semibold">Select Your Loan-to-Value</label>
                </div>
                <span className="text-2xl font-bold text-blue-400">{selectedLtv}%</span>
              </div>
              
              {options.ltvOptions && options.ltvOptions.length > 0 ? (
                <>
                  <Slider
                    value={[selectedLtv]}
                    onValueChange={([val]) => setSelectedLtv(val)}
                    min={options.ltvOptions[0]?.ltv || options.minLtv || 50}
                    max={options.ltvOptions[options.ltvOptions.length - 1]?.ltv || options.maxLtv || 80}
                    step={5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-green-400">
                      {options.ltvOptions[0]?.ltv}% - Safe
                    </span>
                    <span className="text-amber-400">
                      {options.ltvOptions[options.ltvOptions.length - 1]?.ltv}% - Max Cash
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
