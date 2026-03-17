import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, HardHat, Wrench, AlertTriangle, CheckCircle2, DollarSign, Clock, ArrowRight, Info, TrendingUp, Check, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { playPurchaseConfirmSound } from '@/hooks/useClickSound';
import type { Deal, Property, GameRun } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/lib/gameData';

interface ContractorWalkthroughItem {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  originalCost: number;
  contractorCost: number;
  timelineWeeks: number;
  description: string;
  markup: number;
  rentImpactPct?: number;
  marketCostMultiplier?: number;
  marketRentMultiplier?: number;
}

interface WalkthroughQuote {
  eligible: boolean;
  completed: boolean;
  walkthroughFee?: number;
  canAfford?: boolean;
  currentCash?: number;
  data?: {
    repairItems: ContractorWalkthroughItem[];
    totalRepairCost: number;
    walkthroughFee: number;
  };
}

interface WalkthroughResult {
  success: boolean;
  result?: {
    walkthroughFee: number;
    repairItems: ContractorWalkthroughItem[];
    totalRepairCost: number;
    totalOriginalCost: number;
    averageMarkup: number;
    foundTreasure?: boolean;
    treasureAmount?: number;
    marketCondition?: string;
    marketCostMultiplier?: number;
    marketRentMultiplier?: number;
  };
  error?: string;
}

interface ContractorWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  property: Property;
  gameRun: GameRun;
  onComplete: () => void;
  onTreasureFound?: (amount: number, propertyName: string) => void;
  onStartRepairs?: (dealId: number, propertyName: string, weeks: number, cost: number) => void;
}

type ViewState = 'quote' | 'performing' | 'results' | 'already_done';

export function ContractorWalkthroughModal({ 
  isOpen, 
  onClose, 
  deal, 
  property, 
  gameRun,
  onComplete,
  onTreasureFound,
  onStartRepairs
}: ContractorWalkthroughModalProps) {
  const [startingRepairs, setStartingRepairs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('quote');
  const [quote, setQuote] = useState<WalkthroughQuote | null>(null);
  const [result, setResult] = useState<WalkthroughResult['result'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepairIds, setSelectedRepairIds] = useState<string[]>([]);

  // Calculate tenant break fee (1 month of current rent)
  const breakFee = useMemo(() => {
    const monthlyRent = (deal?.weeklyIncome || 0) * 4.33;
    return Math.round(monthlyRent);
  }, [deal?.weeklyIncome]);

  // Base monthly rent from proFormaOutputs (matches server calculation)
  const baseMonthlyRent = useMemo(() => {
    const proFormaOutputs = deal?.proFormaOutputs as any;
    if (proFormaOutputs?.monthlyGrossRent) return proFormaOutputs.monthlyGrossRent;
    if (property) return Math.floor((property.rentMin + property.rentMax) / 2);
    return 1500;
  }, [deal?.proFormaOutputs, property]);

  const selectedTotals = useMemo(() => {
    if (!result?.repairItems) return { cost: 0, weeks: 0, count: 0, rentImpactPct: 0, netRentImpactPct: 0, rentIncrease: 0, annualYieldPct: 0, paybackMonths: 0 };
    const selected = result.repairItems.filter(item => selectedRepairIds.includes(item.id));
    const unselected = result.repairItems.filter(item => !selectedRepairIds.includes(item.id));
    const rentImpactPct = selected.reduce((sum, item) => sum + (item.rentImpactPct || 0), 0);
    const minBumpPerItem = Math.max(25, Math.round(baseMonthlyRent * 0.02));
    const totalFixedIncrease = selected.reduce((sum, item) => {
      const pctBump = Math.round(baseMonthlyRent * ((item.rentImpactPct || 2) / 100));
      return sum + Math.max(minBumpPerItem, pctBump);
    }, 0);
    const unfixedDepressionAmt = unselected.reduce((sum) => {
      return sum + Math.round(baseMonthlyRent * 0.01);
    }, 0);
    const maxIncrease = Math.round(baseMonthlyRent * 0.25);
    const rentIncrease = Math.min(Math.max(0, totalFixedIncrease - unfixedDepressionAmt), maxIncrease);
    const netRentImpactPct = baseMonthlyRent > 0 ? Math.round((rentIncrease / baseMonthlyRent) * 100) : 0;
    const totalCost = selected.reduce((sum, item) => sum + item.contractorCost, 0);
    const annualRentGain = rentIncrease * 12;
    const annualYieldPct = totalCost > 0 ? Math.round((annualRentGain / totalCost) * 1000) / 10 : 0;
    const paybackMonths = rentIncrease > 0 ? Math.ceil(totalCost / rentIncrease) : 0;
    return {
      cost: totalCost,
      weeks: Math.max(...selected.map(item => item.timelineWeeks), 0),
      count: selected.length,
      rentImpactPct,
      netRentImpactPct,
      rentIncrease,
      annualYieldPct,
      paybackMonths,
    };
  }, [result?.repairItems, selectedRepairIds, baseMonthlyRent]);

  // Check affordability
  const affordability = useMemo(() => {
    const availableCash = gameRun?.cash || 0;
    const totalNeeded = breakFee + selectedTotals.cost;
    return {
      availableCash,
      totalNeeded,
      canAfford: availableCash >= totalNeeded,
      shortfall: Math.max(0, totalNeeded - availableCash),
    };
  }, [gameRun?.cash, breakFee, selectedTotals.cost]);

  // Toggle repair selection
  const toggleRepair = (repairId: string) => {
    setSelectedRepairIds(prev => 
      prev.includes(repairId) 
        ? prev.filter(id => id !== repairId)
        : [...prev, repairId]
    );
  };

  // Select all repairs
  const selectAllRepairs = () => {
    if (result?.repairItems) {
      setSelectedRepairIds(result.repairItems.map(item => item.id));
    }
  };

  // Select no repairs  
  const selectNoRepairs = () => {
    setSelectedRepairIds([]);
  };

  useEffect(() => {
    if (isOpen && deal && gameRun) {
      setSelectedRepairIds([]);
      setStartingRepairs(false);
      loadQuote();
    }
  }, [isOpen, deal?.id, gameRun?.id]);

  const loadQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${deal.id}/contractor-walkthrough-quote?gameRunId=${gameRun.id}`);
      const data = await response.json();
      
      if (data.error || (data.eligible === false && !data.completed)) {
        setError(data.error || 'This property is not eligible for contractor walkthrough');
        setQuote(null);
        return;
      }
      
      setQuote(data as WalkthroughQuote);
      
      if (data.completed && data.hasRemainingRepairs && data.data?.repairItems?.length > 0) {
        setViewState('already_done');
        setResult({
          walkthroughFee: data.data.walkthroughFee || 0,
          repairItems: data.data.repairItems,
          totalRepairCost: data.data.totalRepairCost,
          totalOriginalCost: data.data.repairItems.reduce((sum: number, item: any) => sum + item.originalCost, 0),
          averageMarkup: data.data.averageMarkup || 0,
          marketCondition: data.data.marketCondition,
          marketCostMultiplier: data.data.marketCostMultiplier,
          marketRentMultiplier: data.data.marketRentMultiplier,
        });
      } else if (data.completed && !data.hasRemainingRepairs) {
        setError('All repairs have been completed for this property!');
        setQuote(null);
        return;
      } else {
        setViewState('quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformWalkthrough = async () => {
    playPurchaseConfirmSound();
    setViewState('performing');
    setError(null);
    
    try {
      const response = await apiRequest('POST', `/api/deals/${deal.id}/contractor-walkthrough`, {
        gameRunId: gameRun.id,
      });
      const data: WalkthroughResult = await response.json();
      
      if (data.success && data.result) {
        setResult(data.result);
        setViewState('results');
        onComplete();
        
        // If treasure was found, trigger the treasure modal after a short delay
        if (data.result.foundTreasure && data.result.treasureAmount && onTreasureFound) {
          setTimeout(() => {
            onTreasureFound(data.result!.treasureAmount!, property.name);
          }, 500);
        }
      } else {
        setError(data.error || 'Walkthrough failed');
        setViewState('quote');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to perform walkthrough');
      setViewState('quote');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'severe': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'mild': return <CheckCircle2 className="w-3 h-3" />;
      case 'moderate': return <AlertTriangle className="w-3 h-3" />;
      case 'severe': return <AlertTriangle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/50 rounded-2xl max-h-[90vh] flex flex-col">
        <div className="p-5 pb-0">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <HardHat className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  {viewState === 'already_done' ? 'Remaining Renovations' : 'Contractor Walkthrough'}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-400">
                  {property.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4 flex-1 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm text-slate-400">Getting contractor quote...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/20 flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-red-400 text-sm">{error}</p>
              <Button 
                onClick={loadQuote} 
                variant="outline" 
                size="sm" 
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : viewState === 'quote' && quote ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="quote"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-300">
                      <p className="mb-2">
                        Hire a contractor to inspect your property and identify needed repairs.
                      </p>
                      <p className="text-slate-400 text-xs">
                        Note: Repairs found post-purchase typically cost 15-50% more than if discovered during due diligence.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 rounded-xl overflow-hidden border border-slate-700/50">
                  <div className="p-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Walkthrough Fee</span>
                      <span className="text-xl font-bold text-white">
                        ${quote.walkthroughFee?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/30">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Your Cash</span>
                      <span className={quote.canAfford ? 'text-green-400' : 'text-red-400'}>
                        ${quote.currentCash?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {!quote.canAfford && (
                  <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
                    <p className="text-sm text-red-400 text-center">
                      Insufficient funds for walkthrough
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 border-slate-600 hover:bg-slate-800"
                    onClick={onClose}
                    data-testid="button-walkthrough-cancel"
                  >
                    Maybe Later
                  </Button>
                  <Button
                    className="flex-1 h-12 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                    onClick={handlePerformWalkthrough}
                    disabled={!quote.canAfford}
                    data-testid="button-walkthrough-confirm"
                  >
                    <HardHat className="w-4 h-4 mr-2" />
                    Hire Contractor
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : viewState === 'performing' ? (
            <motion.div
              key="performing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <HardHat className="w-8 h-8 text-amber-400" />
                </div>
                <motion.div
                  className="absolute -inset-2 border-2 border-amber-400/30 rounded-full"
                  animate={{ scale: [1, 1.2, 1], opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Contractor inspecting property...</p>
                <p className="text-sm text-slate-400 mt-1">Checking for issues and needed repairs</p>
              </div>
            </motion.div>
          ) : (viewState === 'results' || viewState === 'already_done') && result ? (
            <AnimatePresence mode="wait">
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {viewState === 'results' && (
                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-green-400 font-medium text-sm">Walkthrough Complete</p>
                        <p className="text-xs text-slate-400">
                          Fee paid: ${result.walkthroughFee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {viewState === 'already_done' && (
                  <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-cyan-400" />
                      <div>
                        <p className="text-cyan-400 font-medium text-sm">
                          {result.repairItems.length} repair{result.repairItems.length !== 1 ? 's' : ''} remaining
                        </p>
                        <p className="text-xs text-slate-400">
                          Select which items to renovate next
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {result.repairItems.length === 0 ? (
                  <div className="bg-slate-800/50 rounded-xl p-6 text-center border border-slate-700/50">
                    <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-white font-medium">No Repairs Needed!</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Your property is in excellent condition.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm font-medium text-slate-300">
                        Issues Found ({result.repairItems.length})
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>Avg {result.averageMarkup}% markup</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2 px-1">
                      <span className="text-xs text-slate-400">Select repairs to do:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={selectAllRepairs}
                          className="text-xs text-cyan-400 hover:text-cyan-300"
                          data-testid="button-select-all-walkthrough"
                        >
                          All
                        </button>
                        <span className="text-slate-600">|</span>
                        <button
                          onClick={selectNoRepairs}
                          className="text-xs text-slate-400 hover:text-slate-300"
                          data-testid="button-select-none-walkthrough"
                        >
                          None
                        </button>
                      </div>
                    </div>

                    {result.marketCondition && (result.marketCondition === 'good' || result.marketCondition === 'excellent') && (
                      <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="text-amber-300 font-medium">
                              {result.marketCondition === 'excellent' ? 'Hot' : 'Strong'} Market
                            </span>
                            <p className="text-amber-200/70 mt-1">
                              {result.marketCondition === 'excellent' 
                                ? 'Labor is tight so renovation costs are higher, but rental demand means you can charge more rent.'
                                : 'Renovation costs are slightly elevated, but strong demand supports higher rents.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {result.marketCondition && (result.marketCondition === 'poor' || result.marketCondition === 'terrible') && (
                      <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-3 mb-3">
                        <div className="flex items-start gap-2">
                          <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="text-cyan-300 font-medium">
                              {result.marketCondition === 'terrible' ? 'Buyer\'s' : 'Soft'} Market
                            </span>
                            <p className="text-cyan-200/70 mt-1">
                              Contractors are cheaper right now, but rental demand is lower — rent increases may be modest.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {result.repairItems.map((item, index) => {
                        const isSelected = selectedRepairIds.includes(item.id);
                        
                        return (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              toggleRepair(item.id);
                            }}
                            className={`w-full text-left bg-slate-800/60 rounded-xl p-3 border transition-all touch-manipulation active:opacity-80 select-none ${
                              isSelected 
                                ? 'border-cyan-500/50 bg-cyan-900/20' 
                                : 'border-slate-700/50 hover:border-slate-600'
                            }`}
                            data-testid={`repair-item-${item.id}`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Checkbox */}
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isSelected 
                                  ? 'bg-cyan-500 border-cyan-500' 
                                  : 'border-slate-500'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-medium text-sm truncate ${isSelected ? 'text-cyan-100' : 'text-white'}`}>
                                    {item.name}
                                  </span>
                                  <Badge 
                                    variant="outline" 
                                    className={`text-[10px] px-1.5 py-0 h-5 ${getSeverityColor(item.severity)}`}
                                  >
                                    {getSeverityIcon(item.severity)}
                                    <span className="ml-1 capitalize">{item.severity}</span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-semibold text-white">
                                  ${item.contractorCost.toLocaleString()}
                                </div>
                                {item.markup > 0 && (
                                  <div className="text-[10px] text-red-400">
                                    +{item.markup}% markup
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs ml-8 flex-wrap">
                              {item.timelineWeeks > 0 && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  {item.timelineWeeks} month{item.timelineWeeks > 1 ? 's' : ''} to fix
                                </span>
                              )}
                              {(item.rentImpactPct || 0) > 0 && (() => {
                                const rentBump = Math.max(Math.max(25, Math.round(baseMonthlyRent * 0.02)), Math.round(baseMonthlyRent * ((item.rentImpactPct || 2) / 100)));
                                const itemYield = item.contractorCost > 0 ? Math.round((rentBump * 12 / item.contractorCost) * 100) / 10 : 0;
                                return (
                                  <>
                                    <span className="flex items-center gap-1 text-emerald-400">
                                      <TrendingUp className="w-3 h-3" />
                                      +${rentBump}/mo rent
                                    </span>
                                    <span className={`font-mono ${itemYield >= 10 ? 'text-emerald-300' : itemYield >= 5 ? 'text-cyan-400' : 'text-amber-400'}`}>
                                      {itemYield}% annual yield
                                    </span>
                                  </>
                                );
                              })()}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Cost breakdown with affordability */}
                    <div className={`rounded-xl p-4 border ${
                      affordability.canAfford 
                        ? 'bg-slate-800/80 border-slate-700/50' 
                        : 'bg-red-900/20 border-red-500/30'
                    }`}>
                      <div className="space-y-2">
                        {/* Break fee */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Tenant Break Fee (1 month)</span>
                          <span className="text-amber-400 font-mono">${breakFee.toLocaleString()}</span>
                        </div>
                        
                        {/* Selected repairs */}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">
                            Selected Repairs ({selectedTotals.count}/{result.repairItems.length})
                          </span>
                          <span className="text-white font-mono font-semibold">
                            ${selectedTotals.cost.toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Timeline */}
                        {selectedTotals.weeks > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Timeline
                            </span>
                            <span className="text-amber-400">~{selectedTotals.weeks} month{selectedTotals.weeks !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                        
                        {/* Rent increase estimate */}
                        {selectedTotals.count > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400 flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> Est. Rent Increase
                            </span>
                            <span className={`font-mono ${selectedTotals.rentIncrease > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {selectedTotals.rentIncrease > 0 
                                ? `+$${selectedTotals.rentIncrease.toLocaleString()}/mo (+${selectedTotals.netRentImpactPct}%)`
                                : 'Offset by unfixed issues'}
                            </span>
                          </div>
                        )}

                        {/* Annual yield & payback */}
                        {selectedTotals.count > 0 && selectedTotals.rentIncrease > 0 && (
                          <>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Annual Yield on Repairs</span>
                              <span className={`font-mono font-semibold ${selectedTotals.annualYieldPct >= 10 ? 'text-emerald-300' : selectedTotals.annualYieldPct >= 5 ? 'text-cyan-400' : 'text-amber-400'}`}>
                                {selectedTotals.annualYieldPct}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Payback Period</span>
                              <span className="text-slate-300 font-mono">
                                ~{selectedTotals.paybackMonths} month{selectedTotals.paybackMonths !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </>
                        )}
                        
                        {/* Divider */}
                        <div className="border-t border-slate-700/50 pt-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-300">Total Needed</span>
                            <span className={`text-lg font-bold ${affordability.canAfford ? 'text-white' : 'text-red-400'}`}>
                              ${affordability.totalNeeded.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs mt-1">
                            <span className="text-slate-500">Your Cash</span>
                            <span className={affordability.canAfford ? 'text-emerald-400' : 'text-slate-400'}>
                              ${(gameRun?.cash || 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        
                        {/* Shortfall warning */}
                        {!affordability.canAfford && selectedTotals.count > 0 && (
                          <div className="bg-red-500/10 rounded-lg p-2 mt-2 flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-xs text-red-300">
                              Short ${Math.round(affordability.shortfall).toLocaleString()} - deselect some repairs
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {result.repairItems.length > 0 && onStartRepairs && (
                  <div className="space-y-2">
                    <Button
                      className={`w-full h-12 font-semibold ${
                        affordability.canAfford && selectedTotals.count > 0
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                      }`}
                      onClick={async () => {
                        if (!affordability.canAfford || selectedTotals.count === 0) return;
                        
                        setStartingRepairs(true);
                        setError(null);
                        try {
                          const response = await apiRequest('POST', `/api/deals/${deal.id}/rental-rehab`, {
                            gameRunId: gameRun.id,
                            selectedRepairIds: selectedRepairIds,
                          });
                          const data = await response.json();
                          if (data.success) {
                            const actualRehabCost = data.totalCost != null && data.breakFee != null 
                              ? data.totalCost - data.breakFee 
                              : selectedTotals.cost;
                            onStartRepairs(deal.id, property.name, data.actualWeeks ?? selectedTotals.weeks, actualRehabCost);
                            onComplete();
                            onClose();
                          } else {
                            setError(data.error || 'Failed to start repairs');
                          }
                        } catch (err: any) {
                          setError(err.message || 'Failed to start repairs');
                        } finally {
                          setStartingRepairs(false);
                        }
                      }}
                      disabled={startingRepairs || !affordability.canAfford || selectedTotals.count === 0}
                      data-testid="button-start-repairs"
                    >
                      {startingRepairs ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Starting Repairs...
                        </>
                      ) : selectedTotals.count === 0 ? (
                        <>
                          <Wrench className="w-4 h-4 mr-2" />
                          Select Repairs Above
                        </>
                      ) : !affordability.canAfford ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Can't Afford (${Math.round(affordability.shortfall).toLocaleString()} short)
                        </>
                      ) : (
                        <>
                          <Wrench className="w-4 h-4 mr-2" />
                          Start {selectedTotals.count} Repair{selectedTotals.count !== 1 ? 's' : ''} (${selectedTotals.cost.toLocaleString()})
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-slate-400">
                      {selectedTotals.count > 0 
                        ? `Tenant receives $${breakFee.toLocaleString()} break fee. No rent during ~${selectedTotals.weeks} month rehab.`
                        : 'Select at least one repair to proceed'
                      }
                    </p>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
        
        {/* Sticky footer - always visible close button */}
        <div className="px-5 pb-5 pt-3 border-t border-slate-700/50 bg-slate-900 flex-shrink-0">
          <Button
            className="w-full h-12 bg-slate-700 hover:bg-slate-600"
            onClick={onClose}
            data-testid="button-walkthrough-done"
          >
            {viewState === 'already_done' ? 'Close' : (result && result.repairItems.length > 0) ? 'Maybe Later' : 'Close'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
