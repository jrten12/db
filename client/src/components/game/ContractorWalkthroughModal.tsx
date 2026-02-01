import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, HardHat, Wrench, AlertTriangle, CheckCircle2, DollarSign, Clock, ArrowRight, Info, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { playPurchaseConfirmSound } from '@/hooks/useClickSound';
import type { Deal, Property, GameRun } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';

interface ContractorWalkthroughItem {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  originalCost: number;
  contractorCost: number;
  timelineWeeks: number;
  description: string;
  markup: number;
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
}

type ViewState = 'quote' | 'performing' | 'results' | 'already_done';

export function ContractorWalkthroughModal({ 
  isOpen, 
  onClose, 
  deal, 
  property, 
  gameRun,
  onComplete 
}: ContractorWalkthroughModalProps) {
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>('quote');
  const [quote, setQuote] = useState<WalkthroughQuote | null>(null);
  const [result, setResult] = useState<WalkthroughResult['result'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && deal && gameRun) {
      loadQuote();
    }
  }, [isOpen, deal?.id, gameRun?.id]);

  const loadQuote = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${deal.id}/contractor-walkthrough-quote?gameRunId=${gameRun.id}`);
      const data: WalkthroughQuote = await response.json();
      setQuote(data);
      
      if (data.completed) {
        setViewState('already_done');
        if (data.data) {
          setResult({
            walkthroughFee: data.data.walkthroughFee,
            repairItems: data.data.repairItems,
            totalRepairCost: data.data.totalRepairCost,
            totalOriginalCost: data.data.repairItems.reduce((sum, item) => sum + item.originalCost, 0),
            averageMarkup: 0,
          });
        }
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
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700/50 rounded-2xl">
        <div className="p-5 pb-0">
          <DialogHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <HardHat className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Contractor Walkthrough
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-400">
                  {property.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 pb-5 space-y-4">
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

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                      {result.repairItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50"
                          data-testid={`repair-item-${item.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-white text-sm truncate">
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
                          {item.timelineWeeks > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{item.timelineWeeks} week{item.timelineWeeks > 1 ? 's' : ''} to fix</span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-300">Total Repair Cost</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-white">
                            ${result.totalRepairCost.toLocaleString()}
                          </span>
                          {result.totalOriginalCost < result.totalRepairCost && (
                            <div className="text-[10px] text-slate-500">
                              (would have been ~${result.totalOriginalCost.toLocaleString()} with due diligence)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  className="w-full h-12 bg-slate-700 hover:bg-slate-600"
                  onClick={onClose}
                  data-testid="button-walkthrough-done"
                >
                  {viewState === 'already_done' ? 'Close' : 'Got It'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </AnimatePresence>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
