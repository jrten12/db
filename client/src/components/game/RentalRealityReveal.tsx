import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, TrendingUp, TrendingDown, DollarSign, Target, Zap, Eye, EyeOff, ArrowRight, CheckCircle2, AlertTriangle, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';

interface RentalRealityRevealProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    propertyName: string;
    projectedRent: number;
    actualRent: number;
    projectedCashFlow: number;
    actualCashFlow: number;
    projectedVacancy: number;
    actualVacancy: number;
    projectedExpenses: number;
    actualExpenses: number;
    debtService: number;
    explanation: string;
    wasOptimistic: boolean;
    isInRehab: boolean;
    rehabMonths?: number;
  } | null;
}

function getRevealGrade(projectedCF: number, actualCF: number): { grade: string; color: string; bgColor: string; emoji: string; headline: string } {
  if (projectedCF === 0 && actualCF === 0) return { grade: '-', color: 'text-gray-400', bgColor: 'from-gray-600 to-gray-700', emoji: '', headline: 'No cash flow projected' };
  
  const diff = Math.abs(actualCF - projectedCF);
  const base = Math.max(Math.abs(projectedCF), 100);
  const pctOff = (diff / base) * 100;
  const better = actualCF >= projectedCF;

  if (pctOff <= 8) return { grade: 'A+', color: 'text-emerald-400', bgColor: 'from-emerald-600 to-emerald-800', emoji: '🎯', headline: 'Nailed It!' };
  if (pctOff <= 18) return { grade: 'A', color: 'text-emerald-400', bgColor: 'from-emerald-600 to-teal-800', emoji: '💪', headline: better ? 'Even Better Than Expected' : 'Sharp Analysis' };
  if (pctOff <= 30) return { grade: 'B', color: 'text-blue-400', bgColor: 'from-blue-600 to-indigo-800', emoji: '👍', headline: better ? 'Pleasant Surprise' : 'Close Enough' };
  if (pctOff <= 50) return { grade: 'C', color: 'text-amber-400', bgColor: 'from-amber-600 to-orange-800', emoji: '🤔', headline: better ? 'Better Than You Thought' : 'Reality Check' };
  if (pctOff <= 75) return { grade: 'D', color: 'text-orange-400', bgColor: 'from-orange-600 to-red-800', emoji: '😬', headline: better ? 'Way Under-Estimated' : 'Rough Start' };
  return { grade: 'F', color: 'text-red-400', bgColor: 'from-red-600 to-red-900', emoji: '😳', headline: better ? 'Wildly Conservative' : 'Back to the Drawing Board' };
}

function RevealRow({ label, projected, actual, format = 'currency', delay, isRevealed }: {
  label: string;
  projected: number;
  actual: number;
  format?: 'currency' | 'percent' | 'currencyPerMonth';
  delay: number;
  isRevealed: boolean;
}) {
  const diff = actual - projected;
  const isPositive = format === 'percent' ? diff <= 0 : diff >= 0;
  const isNeutral = Math.abs(diff) < (format === 'percent' ? 0.5 : 10);
  
  const fmt = (v: number) => {
    if (format === 'percent') return `${v.toFixed(1)}%`;
    if (format === 'currencyPerMonth') return `$${Math.round(v).toLocaleString()}/mo`;
    return `$${Math.round(v).toLocaleString()}`;
  };

  const fmtDiff = (v: number) => {
    const sign = v >= 0 ? '+' : '';
    if (format === 'percent') return `${sign}${v.toFixed(1)}%`;
    return `${sign}$${Math.round(v).toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="grid grid-cols-[1fr,auto,auto] gap-2 items-center py-2 border-b border-slate-700/40 last:border-0"
    >
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-mono text-gray-500 text-right w-24">{fmt(projected)}</span>
      <div className="text-right w-28">
        <AnimatePresence>
          {isRevealed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex items-center justify-end gap-1"
            >
              <span className={`text-xs font-mono font-semibold ${isNeutral ? 'text-gray-300' : isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                {fmt(actual)}
              </span>
              {!isNeutral && (
                <span className={`text-[10px] font-mono ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {fmtDiff(diff)}
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div className="flex items-center justify-end gap-1">
              <span className="text-xs text-gray-600">???</span>
              <EyeOff className="w-3 h-3 text-gray-600" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export function RentalRealityReveal({ isOpen, onClose, data }: RentalRealityRevealProps) {
  const [phase, setPhase] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  
  useEffect(() => {
    if (isOpen && data) {
      setPhase(0);
      setIsRevealed(false);
      const t1 = setTimeout(() => setPhase(1), 400);
      const t2 = setTimeout(() => setPhase(2), 1200);
      const t3 = setTimeout(() => { setPhase(3); setIsRevealed(true); }, 2200);
      const t4 = setTimeout(() => setPhase(4), 3200);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [isOpen, data]);

  if (!data) return null;

  const grade = getRevealGrade(data.projectedCashFlow, data.actualCashFlow);
  const rentDiff = data.actualRent - data.projectedRent;
  const cfDiff = data.actualCashFlow - data.projectedCashFlow;
  const isGood = grade.grade === 'A+' || grade.grade === 'A' || grade.grade === 'B';

  return (
    <>
      <Confetti isActive={isOpen && phase >= 3 && isGood} particleCount={40} duration={3000} />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-start justify-center pt-[calc(env(safe-area-inset-top,0px)+8px)] pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3 bg-black/85 backdrop-blur-sm overflow-y-auto"
            onClick={onClose}
            data-testid="modal-rental-reality-reveal"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 40 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="bg-slate-900/95 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`bg-gradient-to-br ${phase >= 3 ? grade.bgColor : 'from-slate-700 to-slate-800'} transition-all duration-700 p-5 text-center relative overflow-hidden`}>
                {phase >= 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_white_0%,_transparent_70%)]"
                  />
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 mb-2"
                >
                  <Home className="w-4 h-4 text-white/70" />
                  <span className="text-white/70 text-xs font-medium uppercase tracking-wider">{data.propertyName}</span>
                </motion.div>

                {phase < 3 ? (
                  <motion.div
                    key="pre-reveal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h2 className="text-xl font-bold text-white mb-1">The Moment of Truth</h2>
                    <p className="text-white/60 text-sm">Your projections are about to meet reality...</p>
                    {phase >= 2 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: [0.8, 1.1, 1] }}
                        transition={{ duration: 0.5 }}
                        className="mt-3 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-5 h-5 text-cyan-400 animate-pulse" />
                        <span className="text-cyan-400 text-sm font-semibold">Revealing...</span>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="post-reveal"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                  >
                    <div className="text-3xl mb-1">{grade.emoji}</div>
                    <h2 className="text-2xl font-black text-white mb-1">{grade.headline}</h2>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <div className="bg-white/15 backdrop-blur rounded-lg px-3 py-1.5">
                        <span className={`text-2xl font-black ${grade.color}`}>{grade.grade}</span>
                      </div>
                      <div className="text-left">
                        <p className="text-white/80 text-xs">
                          {cfDiff >= 0 ? 'You earn' : 'Your cash flow is'} 
                          <span className={`font-bold ${cfDiff >= 0 ? ' text-emerald-300' : ' text-red-300'}`}>
                            {' '}${Math.abs(Math.round(cfDiff)).toLocaleString()}/mo {cfDiff >= 0 ? 'more' : 'less'}
                          </span>
                        </p>
                        <p className="text-white/50 text-[10px]">than your pro forma projected</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 overflow-hidden">
                  <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-center px-3 py-2 border-b border-slate-700/50 bg-slate-800/40">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500"></span>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 text-right w-24">Your Pro Forma</span>
                    <span className="text-[10px] uppercase tracking-wider text-cyan-400 text-right w-28">Reality</span>
                  </div>
                  
                  <div className="px-3">
                    <RevealRow
                      label="Monthly Rent"
                      projected={data.projectedRent}
                      actual={data.actualRent}
                      format="currencyPerMonth"
                      delay={0.1}
                      isRevealed={isRevealed}
                    />
                    <RevealRow
                      label="Vacancy Rate"
                      projected={data.projectedVacancy}
                      actual={data.actualVacancy}
                      format="percent"
                      delay={0.2}
                      isRevealed={isRevealed}
                    />
                    <RevealRow
                      label="Monthly Expenses"
                      projected={data.projectedExpenses}
                      actual={data.actualExpenses}
                      format="currency"
                      delay={0.3}
                      isRevealed={isRevealed}
                    />
                    <RevealRow
                      label="Debt Service"
                      projected={data.debtService}
                      actual={data.debtService}
                      format="currency"
                      delay={0.35}
                      isRevealed={isRevealed}
                    />
                  </div>

                  <div className="px-3 py-2.5 bg-slate-800/60 border-t border-slate-700/50">
                    <div className="grid grid-cols-[1fr,auto,auto] gap-2 items-center">
                      <span className="text-sm font-semibold text-white">Net Cash Flow</span>
                      <span className="text-sm font-mono font-semibold text-gray-400 text-right w-24">
                        ${Math.round(data.projectedCashFlow).toLocaleString()}/mo
                      </span>
                      <div className="text-right w-28">
                        <AnimatePresence>
                          {isRevealed ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 1.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ type: 'spring', damping: 10, delay: 0.5 }}
                              className="flex items-center justify-end gap-1"
                            >
                              <span className={`text-sm font-mono font-bold ${data.actualCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ${Math.round(data.actualCashFlow).toLocaleString()}/mo
                              </span>
                            </motion.div>
                          ) : (
                            <span className="text-sm text-gray-600 font-mono">???</span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>

                {phase >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`rounded-xl p-3 border ${
                      isGood ? 'bg-emerald-900/15 border-emerald-500/20' : 'bg-amber-900/15 border-amber-500/20'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {isGood ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : cfDiff >= 0 ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-xs text-gray-300 leading-relaxed">{data.explanation}</p>
                    </div>
                  </motion.div>
                )}

                {data.isInRehab && phase >= 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl p-3 border bg-blue-900/15 border-blue-500/20"
                  >
                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-300 leading-relaxed">
                        Rehab in progress — no tenants for {data.rehabMonths} month{(data.rehabMonths || 0) !== 1 ? 's' : ''}. 
                        You'll pay carrying costs until it's done, then these numbers kick in.
                      </p>
                    </div>
                  </motion.div>
                )}

                {rentDiff !== 0 && phase >= 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 px-1"
                  >
                    {rentDiff > 0 ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                    )}
                    <p className="text-[11px] text-gray-500">
                      {rentDiff > 0
                        ? `Your rent came in $${Math.abs(Math.round(rentDiff)).toLocaleString()}/mo higher than projected — diligence and market conditions paid off.`
                        : `Rent is $${Math.abs(Math.round(rentDiff)).toLocaleString()}/mo below your estimate. ${data.wasOptimistic ? 'Your assumptions were too optimistic.' : 'Market conditions shifted.'}`
                      }
                    </p>
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase >= 3 ? 1 : 0 }}
                  className="pt-1"
                >
                  <Button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-5 rounded-xl"
                    data-testid="button-close-rental-reveal"
                  >
                    {data.isInRehab ? 'Track Renovation' : isGood ? 'Let\'s Go!' : 'Time to Manage'}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
