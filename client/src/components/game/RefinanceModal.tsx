import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, TrendingUp, DollarSign, Percent, Building2, AlertCircle } from 'lucide-react';
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

  const formatCurrency = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const formatPercent = (n: number) => `${n.toFixed(2)}%`;

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
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertCircle className="w-5 h-5" />
              <span>{options?.reason}</span>
            </div>
            {options?.weeksUntilEligible && (
              <p className="text-sm text-slate-400">
                {options.weeksUntilEligible} weeks until you can refinance this property.
              </p>
            )}
            <Button onClick={onClose} variant="outline" className="w-full">
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

            {options.playerMetrics && (
              <div className="text-xs text-slate-500 px-1">
                Your rate is based on: {options.playerMetrics.dti}% debt-to-income, 
                {options.playerMetrics.reserveMonths.toFixed(1)} months cash reserves
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Choose Loan-to-Value (LTV)</label>
                <span className="text-lg font-bold text-blue-400">{selectedLtv}%</span>
              </div>
              
              {options.ltvOptions && options.ltvOptions.length > 0 && (
                <Slider
                  value={[selectedLtv]}
                  onValueChange={([val]) => setSelectedLtv(val)}
                  min={options.minLtv || 50}
                  max={options.maxLtv || 80}
                  step={5}
                  className="py-4"
                />
              )}

              <div className="flex justify-between text-xs text-slate-500">
                <span>Lower LTV = Less cash, lower risk</span>
                <span>Higher LTV = More cash, higher payment</span>
              </div>
            </div>

            {selectedOption && (
              <div className="p-4 bg-gradient-to-r from-blue-900/30 to-green-900/30 border border-blue-500/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-green-400 font-semibold">
                  <DollarSign className="w-5 h-5" />
                  Cash Out: {formatCurrency(selectedOption.cashOut)}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">New Loan Amount:</span>
                    <span className="ml-2">{formatCurrency(selectedOption.newLoanAmount)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Refinance Fees:</span>
                    <span className="ml-2 text-red-400">-{formatCurrency(selectedOption.refinanceFees)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">New Monthly Payment:</span>
                    <span className="ml-2">{formatCurrency(selectedOption.monthlyPayment)}/mo</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Interest Rate:</span>
                    <span className="ml-2">{formatPercent(options.interestRate || 0)}</span>
                  </div>
                </div>
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
