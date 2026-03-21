import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, PartyPopper, Sparkles, BadgeDollarSign, ArrowRight, Share2, ChevronDown, ChevronUp, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { playSaleCompleteSound } from '@/hooks/useClickSound';

interface ProFormaProjection {
  projectedProfit?: number;
  projectedROI?: number;
  projectedMonthlyCashFlow?: number;
  projectedCashOnCash?: number;
  projectedSalePrice?: number;
  projectedRent?: number;
  projectedTotalExpenses?: number;
  totalRentalIncome?: number;
  totalExpensesPaid?: number;
  monthsHeld?: number;
  actualMonthlyCashFlow?: number;
  totalRentalIncomeCollected?: number;
  strategy: 'rent' | 'flip';
}

interface PropertySoldAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  onShareCard?: () => void;
  proFormaProjections?: ProFormaProjection | null;
  saleData: {
    propertyName: string;
    salePrice: number;
    purchasePrice: number;
    mortgagePayoff: number;
    netProceeds: number;
    saleProfit: number;
    isRental: boolean;
    rehabCost?: number;
    sellingCosts?: number;
    closingCosts?: number;
    holdingCosts?: number;
    loanFees?: number;
  } | null;
}

const confettiColors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];

function Confetti() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3"
          initial={{
            x: '50%',
            y: '40%',
            scale: 0,
            rotate: 0,
          }}
          animate={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            scale: [0, 1, 1, 0.5],
            rotate: Math.random() * 720 - 360,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: 'easeOut',
          }}
          style={{
            backgroundColor: confettiColors[Math.floor(Math.random() * confettiColors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

function MoneyRain() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{
            x: `${Math.random() * 100}%`,
            y: -50,
            rotate: 0,
            opacity: 0.8,
          }}
          animate={{
            y: '120%',
            rotate: [0, 15, -15, 10, -10, 0],
            opacity: [0.8, 1, 1, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: Math.random() * 1.5,
            ease: 'easeIn',
          }}
        >
          <DollarSign className="w-6 h-6 text-green-400" />
        </motion.div>
      ))}
    </div>
  );
}

function ComparisonRow({ label, projected, actual, format = 'currency', higherIsBetter = true }: {
  label: string;
  projected: number;
  actual: number;
  format?: 'currency' | 'percent' | 'currencyPerMonth';
  higherIsBetter?: boolean;
}) {
  const diff = actual - projected;
  const isGood = higherIsBetter ? diff >= 0 : diff <= 0;
  const isClose = Math.abs(diff) < Math.abs(projected) * 0.05;

  const fmt = (v: number) => {
    if (format === 'percent') return `${v.toFixed(1)}%`;
    if (format === 'currencyPerMonth') return `${v < 0 ? '-' : ''}$${Math.abs(Math.round(v)).toLocaleString()}/mo`;
    return `${v < 0 ? '-' : ''}$${Math.abs(Math.round(v)).toLocaleString()}`;
  };

  const diffFmt = (v: number) => {
    const sign = v > 0 ? '+' : v < 0 ? '-' : '';
    if (format === 'percent') return `${sign}${Math.abs(v).toFixed(1)}%`;
    if (format === 'currencyPerMonth') return `${sign}$${Math.abs(Math.round(v)).toLocaleString()}/mo`;
    return `${sign}$${Math.abs(Math.round(v)).toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center py-1.5 text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-300 font-mono text-right w-20">{fmt(projected)}</span>
      <span className="text-white font-mono font-semibold text-right w-20">{fmt(actual)}</span>
      <span className={`font-mono text-right w-20 font-semibold ${
        isClose ? 'text-gray-400' : isGood ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {isClose ? '~' : diffFmt(diff)}
      </span>
    </div>
  );
}

const GRADE_RANK: Record<string, number> = { 'A+': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5, 'F': 6, '-': 7 };

function isGoodGrade(grade: string): boolean {
  return (GRADE_RANK[grade] || 7) <= 3;
}

function getAccuracyGrade(projectedProfit: number, actualProfit: number): { grade: string; color: string; message: string } {
  if (projectedProfit === 0 && actualProfit === 0) return { grade: '-', color: 'text-gray-400', message: 'No projection available' };

  const diff = Math.abs(actualProfit - projectedProfit);
  const base = Math.max(Math.abs(projectedProfit), 1000);
  let pctOff = (diff / base) * 100;

  const outperformed = actualProfit > projectedProfit;
  if (outperformed) pctOff *= 0.7;

  if (pctOff <= 5) return { grade: 'A+', color: 'text-emerald-400', message: 'Spot-on underwriting! Your projections were nearly perfect.' };
  if (pctOff <= 15) return { grade: 'A', color: 'text-emerald-400', message: outperformed ? 'Conservative but accurate analysis — you left a little upside on the table.' : 'Strong analysis. Your estimates were close to reality.' };
  if (pctOff <= 25) return { grade: 'B', color: 'text-blue-400', message: outperformed ? 'Solid projections. You were conservative, which is a good habit.' : 'Decent projections. Some assumptions were off but close enough.' };
  if (pctOff <= 40) return { grade: 'C', color: 'text-amber-400', message: 'Projections had notable gaps. Review your assumptions for next time.' };
  if (pctOff <= 60) return { grade: 'D', color: 'text-orange-400', message: 'Significant gap between prediction and reality. Diligence matters.' };
  return { grade: 'F', color: 'text-red-400', message: 'Your projections were way off. Focus on better market research and conservative estimates.' };
}

function getWhyDifferent(proj: ProFormaProjection, saleData: NonNullable<PropertySoldAnimationProps['saleData']>): string[] {
  const reasons: string[] = [];

  if (proj.strategy === 'flip') {
    const actualProfit = saleData.saleProfit;
    const projectedProfit = proj.projectedProfit || 0;
    const profitDiff = actualProfit - projectedProfit;

    if (proj.projectedSalePrice && Math.abs(saleData.salePrice - proj.projectedSalePrice) > proj.projectedSalePrice * 0.03) {
      if (saleData.salePrice > proj.projectedSalePrice) {
        reasons.push('Market conditions pushed the sale price above your ARV estimate — good news for your bottom line.');
      } else {
        reasons.push('The actual sale price came in below your projected ARV — market shifts or property condition may have played a role.');
      }
    }
    if (profitDiff < -5000 && !reasons.length) {
      reasons.push('Unexpected costs during the hold period — curveballs, longer timelines, or higher carrying costs reduced your profit.');
    }
  } else {
    const projectedMonthly = proj.projectedMonthlyCashFlow ?? 0;
    const actualMonthly = proj.actualMonthlyCashFlow ?? 0;
    const cashFlowDiff = actualMonthly - projectedMonthly;

    if (saleData.saleProfit < -2000) {
      reasons.push(`Selling this rental resulted in a $${Math.abs(saleData.saleProfit).toLocaleString()} capital loss — selling costs, market conditions, and holding expenses ate into (or exceeded) your equity. This significantly impacts your overall deal return.`);
    } else if (saleData.saleProfit > 5000) {
      reasons.push(`You captured $${saleData.saleProfit.toLocaleString()} in appreciation when you sold — a nice bonus on top of your rental cash flow.`);
    }

    if (cashFlowDiff > 50) {
      reasons.push('Your rental earned more cash flow than projected — possibly from higher actual rent, fewer vacancies, or lower operating expenses.');
    } else if (cashFlowDiff < -50) {
      reasons.push('Curveballs, maintenance events, or unfixed property issues reduced your actual cash flow below what you projected.');
    }

    if (Math.abs(cashFlowDiff) > 200) {
      reasons.push('Random events like surprise repairs and vacancy gaps can significantly shift actual rental income from projections — conservative estimates help absorb these hits.');
    }
  }

  if (reasons.length === 0) {
    if (proj.strategy === 'rent') {
      const projectedMonthly = proj.projectedMonthlyCashFlow ?? 0;
      const actualMonthly = proj.actualMonthlyCashFlow ?? 0;
      if (Math.abs(actualMonthly - projectedMonthly) < 50) {
        reasons.push('Your cash flow projections were quite accurate! Good underwriting means predictable rental income.');
      } else {
        reasons.push('Several small factors — maintenance timing, vacancy gaps, and market shifts — combined to create the gap between projected and actual cash flow.');
      }
    } else {
      const profitDiff = Math.abs(saleData.saleProfit - (proj.projectedProfit || 0));
      if (profitDiff < 2000) {
        reasons.push('Your projections were quite accurate! Good underwriting translates to predictable outcomes.');
      } else {
        reasons.push('Several small factors — market shifts, timing, and random events — combined to create the gap between projection and reality.');
      }
    }
  }

  return reasons;
}

export function PropertySoldAnimation({ isOpen, onClose, onShareCard, saleData, proFormaProjections }: PropertySoldAnimationProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showComparison, setShowComparison] = useState(true);

  useEffect(() => {
    if (isOpen) {
      playSaleCompleteSound();
      setShowDetails(false);
      setShowBreakdown(false);
      setShowComparison(true);
      const timer = setTimeout(() => setShowDetails(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!saleData) return null;

  const isProfitable = saleData.saleProfit >= 0;
  const profitPercent = saleData.purchasePrice > 0 
    ? ((saleData.saleProfit / saleData.purchasePrice) * 100).toFixed(1)
    : '0';

  const breakdownItems = [
    { label: 'Purchase Price', amount: saleData.purchasePrice, color: 'text-blue-300' },
    ...(saleData.rehabCost && saleData.rehabCost > 0 ? [{ label: 'Rehab / Renovation', amount: saleData.rehabCost, color: 'text-orange-300' }] : []),
    ...(saleData.closingCosts && saleData.closingCosts > 0 ? [{ label: 'Closing Costs', amount: saleData.closingCosts, color: 'text-slate-300' }] : []),
    ...(saleData.loanFees && saleData.loanFees > 0 ? [{ label: 'Loan Fees', amount: saleData.loanFees, color: 'text-slate-300' }] : []),
    ...(saleData.holdingCosts && saleData.holdingCosts > 0 ? [{ label: 'Holding Costs', amount: saleData.holdingCosts, color: 'text-amber-300' }] : []),
    ...(saleData.sellingCosts && saleData.sellingCosts > 0 ? [{ label: 'Selling Costs', amount: saleData.sellingCosts, color: 'text-red-300' }] : []),
  ];
  const totalCosts = breakdownItems.reduce((sum, item) => sum + item.amount, 0);

  const hasProjections = !!(proFormaProjections && proFormaProjections.strategy);

  const isRentalStrategy = hasProjections && proFormaProjections!.strategy === 'rent';

  let accuracyGrade: ReturnType<typeof getAccuracyGrade> | null = null;
  let effectiveProjections = proFormaProjections;

  if (hasProjections && isRentalStrategy) {
    effectiveProjections = { ...proFormaProjections! };
  } else if (hasProjections) {
    const projectedProfitValue = proFormaProjections!.projectedProfit ?? 0;
    accuracyGrade = getAccuracyGrade(projectedProfitValue, saleData.saleProfit);
    effectiveProjections = { ...proFormaProjections!, projectedProfit: projectedProfitValue };
  }

  const whyReasons = hasProjections && effectiveProjections ? getWhyDifferent(effectiveProjections, saleData) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <Confetti />
          <MoneyRain />

          <motion.div
            className="relative z-10 w-full max-w-md mx-4 my-auto"
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 border-2 border-green-500/50 shadow-[0_0_60px_rgba(34,197,94,0.3)]">
              <motion.div
                className="text-center"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 mb-4 shadow-lg shadow-green-500/40"
                  animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                      '0 10px 40px rgba(34,197,94,0.4)',
                      '0 10px 60px rgba(34,197,94,0.6)',
                      '0 10px 40px rgba(34,197,94,0.4)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <BadgeDollarSign className="w-10 h-10 text-white" />
                </motion.div>

                <motion.h2
                  className="text-3xl font-black text-white mb-2"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                >
                  PROPERTY SOLD!
                </motion.h2>

                <motion.p
                  className="text-lg text-gray-300 mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {saleData.propertyName}
                </motion.p>
              </motion.div>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-xl p-4 border border-green-500/30">
                      <div className="flex items-center justify-center gap-3 mb-3">
                        <PartyPopper className="w-5 h-5 text-yellow-400" />
                        <span className="text-sm text-green-300 font-medium uppercase tracking-wider">Sale Complete</span>
                        <PartyPopper className="w-5 h-5 text-yellow-400 scale-x-[-1]" />
                      </div>
                      
                      <div className="text-center">
                        <p className="text-4xl font-black text-green-400 mb-1">
                          ${saleData.salePrice.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">Sale Price</p>
                      </div>
                    </div>

                    <motion.div
                      className={`rounded-xl p-4 border-2 ${
                        isProfitable 
                          ? 'bg-gradient-to-r from-emerald-900/50 to-green-900/50 border-green-400/50' 
                          : 'bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-400/50'
                      }`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Net Proceeds</p>
                          <p className="text-xl font-bold text-white">${saleData.netProceeds.toLocaleString()}</p>
                        </div>
                        <ArrowRight className={`w-6 h-6 ${isProfitable ? 'text-green-400' : 'text-red-400'}`} />
                        <div className="text-right">
                          <p className="text-xs text-gray-400 mb-1">{isProfitable ? 'Profit' : 'Loss'}</p>
                          <p className={`text-2xl font-black ${isProfitable ? 'text-green-400' : 'text-red-400'}`}>
                            {isProfitable ? '+' : ''}${saleData.saleProfit.toLocaleString()}
                          </p>
                          <p className={`text-sm ${isProfitable ? 'text-green-300/70' : 'text-red-300/70'}`}>
                            {isProfitable ? '+' : ''}{profitPercent}% ROI
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {hasProjections && (
                      <motion.div
                        className="bg-slate-800/60 rounded-xl border border-cyan-500/30 overflow-hidden"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <button
                          onClick={() => setShowComparison(!showComparison)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/20 transition-colors"
                          data-testid="button-toggle-proforma-comparison"
                        >
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="text-sm font-semibold text-cyan-300">
                              {isRentalStrategy ? 'Rental Performance Summary' : 'Your Prediction vs Reality'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {accuracyGrade && (
                              <span className={`text-lg font-black ${accuracyGrade.color}`}>{accuracyGrade.grade}</span>
                            )}
                            {showComparison ? (
                              <ChevronUp className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {showComparison && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-3">
                                <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-center pb-1.5 border-b border-slate-700/50">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500"></span>
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 text-right w-20">Projected</span>
                                  <span className="text-[10px] uppercase tracking-wider text-cyan-400 text-right w-20">Actual</span>
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 text-right w-20">Diff</span>
                                </div>

                                {proFormaProjections!.strategy === 'flip' ? (
                                  <>
                                    {proFormaProjections!.projectedSalePrice !== undefined && proFormaProjections!.projectedSalePrice > 0 && (
                                      <ComparisonRow
                                        label="Sale Price"
                                        projected={proFormaProjections!.projectedSalePrice}
                                        actual={saleData.salePrice}
                                      />
                                    )}
                                    {proFormaProjections!.projectedProfit !== undefined && (
                                      <ComparisonRow
                                        label="Profit"
                                        projected={proFormaProjections!.projectedProfit}
                                        actual={saleData.saleProfit}
                                      />
                                    )}
                                    {proFormaProjections!.projectedROI !== undefined && proFormaProjections!.projectedROI !== 0 && (
                                      <ComparisonRow
                                        label="ROI"
                                        projected={proFormaProjections!.projectedROI}
                                        actual={parseFloat(profitPercent)}
                                        format="percent"
                                      />
                                    )}
                                  </>
                                ) : (
                                  <>
                                    {proFormaProjections!.projectedMonthlyCashFlow !== undefined && (
                                      <ComparisonRow
                                        label="Monthly Cash Flow"
                                        projected={proFormaProjections!.projectedMonthlyCashFlow}
                                        actual={proFormaProjections!.actualMonthlyCashFlow ?? 0}
                                        format="currencyPerMonth"
                                      />
                                    )}
                                    {(() => {
                                      const projTotal = (proFormaProjections!.projectedMonthlyCashFlow ?? 0) * (proFormaProjections!.monthsHeld || 1);
                                      const actualTotal = proFormaProjections!.totalRentalIncomeCollected
                                        ?? ((proFormaProjections!.actualMonthlyCashFlow ?? 0) * (proFormaProjections!.monthsHeld || 1));
                                      return (
                                        <ComparisonRow
                                          label={`Total Rental Income (${proFormaProjections!.monthsHeld || 0}mo)`}
                                          projected={projTotal}
                                          actual={actualTotal}
                                        />
                                      );
                                    })()}
                                    <div className="pt-1 mt-1" style={{ borderTop: '1px solid rgba(100,116,139,0.2)' }}>
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Exit Sale Profit</span>
                                        <span className={`font-mono font-semibold ${saleData.saleProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                          {saleData.saleProfit >= 0 ? '+' : ''}${saleData.saleProfit.toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-gray-600 mt-0.5">Capital gain/loss from selling</p>
                                    </div>
                                    {(() => {
                                      const projTotal = (proFormaProjections!.projectedMonthlyCashFlow ?? 0) * (proFormaProjections!.monthsHeld || 1);
                                      const actualRentalTotal = proFormaProjections!.totalRentalIncomeCollected
                                        ?? ((proFormaProjections!.actualMonthlyCashFlow ?? 0) * (proFormaProjections!.monthsHeld || 1));
                                      const totalReturn = actualRentalTotal + saleData.saleProfit;
                                      return (
                                        <div className="pt-1.5 mt-1.5" style={{ borderTop: '1px solid rgba(100,116,139,0.3)' }}>
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-white font-medium">Total Deal Return</span>
                                            <div className="text-right">
                                              <span className={`font-mono font-bold ${totalReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {totalReturn >= 0 ? '+' : ''}${totalReturn.toLocaleString()}
                                              </span>
                                              <span className="text-gray-500 text-[10px] ml-1">
                                                vs ${projTotal.toLocaleString()} projected
                                              </span>
                                            </div>
                                          </div>
                                          <p className="text-[10px] text-gray-600 mt-0.5">Rental income + sale profit/loss</p>
                                        </div>
                                      );
                                    })()}
                                  </>
                                )}

                                {accuracyGrade && !isRentalStrategy && (
                                  <div className={`mt-2 rounded-lg p-3 border ${
                                    isGoodGrade(accuracyGrade.grade)
                                      ? 'bg-emerald-900/20 border-emerald-500/20' 
                                      : (GRADE_RANK[accuracyGrade.grade] || 7) <= 4
                                        ? 'bg-amber-900/20 border-amber-500/20'
                                        : 'bg-red-900/20 border-red-500/20'
                                  }`}>
                                    <div className="flex items-start gap-2">
                                      {isGoodGrade(accuracyGrade.grade) ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                      )}
                                      <div>
                                        <p className="text-xs text-gray-300 leading-relaxed">
                                          {accuracyGrade.message}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {isRentalStrategy && (
                                  <div className="mt-2 rounded-lg p-3 border bg-slate-800/40 border-slate-600/30">
                                    <div className="flex items-start gap-2">
                                      <Target className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                                      <p className="text-xs text-gray-400 leading-relaxed">
                                        This property was underwritten as a rental, not a flip. Sale proceeds aren't graded against rental cash flow projections — they're different strategies with different metrics.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {whyReasons.length > 0 && (
                                  <div className="space-y-1.5 pt-1">
                                    <p className="text-[10px] uppercase tracking-wider text-gray-500">Why the difference?</p>
                                    {whyReasons.map((reason, i) => (
                                      <p key={i} className="text-xs text-gray-400 leading-relaxed pl-3 border-l-2 border-cyan-500/30">
                                        {reason}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    <motion.div
                      className="bg-slate-800/40 rounded-xl border border-slate-700/50 overflow-hidden"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <button
                        onClick={() => setShowBreakdown(!showBreakdown)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-700/20 transition-colors"
                        data-testid="button-toggle-deal-breakdown"
                      >
                        <span className="text-sm font-semibold text-gray-300">Deal Breakdown</span>
                        {showBreakdown ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <AnimatePresence>
                        {showBreakdown && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 space-y-1.5">
                              <div className="flex items-center justify-between py-1.5 border-b border-slate-700/50">
                                <span className="text-xs font-medium text-green-400">Sale Price</span>
                                <span className="text-sm font-bold text-green-400">+${saleData.salePrice.toLocaleString()}</span>
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-gray-500 pt-1">Costs</div>
                              {breakdownItems.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <span className="text-xs text-gray-400">{item.label}</span>
                                  <span className={`text-xs font-medium ${item.color}`}>-${item.amount.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-700/50">
                                <span className="text-xs font-medium text-gray-300">Total Costs</span>
                                <span className="text-xs font-bold text-gray-300">-${totalCosts.toLocaleString()}</span>
                              </div>
                              {saleData.mortgagePayoff > 0 && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-500 italic">Mortgage payoff (from proceeds)</span>
                                  <span className="text-gray-500">-${saleData.mortgagePayoff.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.p
                      className="text-center text-sm text-gray-500 italic"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      {isProfitable 
                        ? saleData.saleProfit > 50000 
                          ? "Outstanding exit! That's how you build wealth." 
                          : "Nice work locking in those gains!"
                        : "Markets don't always cooperate. Learn and move forward."}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-2"
                    >
                      {onShareCard && (
                        <button
                          onClick={onShareCard}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97]"
                          style={{
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2))',
                            border: '1.5px solid rgba(99,102,241,0.4)',
                            color: '#a5b4fc',
                          }}
                          data-testid="button-share-deal-result"
                        >
                          <Share2 className="w-4 h-4" />
                          Share Your Deal
                        </button>
                      )}
                      <Button
                        onClick={onClose}
                        className="w-full py-5 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500"
                        data-no-click-sound
                        data-sound="close"
                      >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Continue
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
