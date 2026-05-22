import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Home, DollarSign, Sparkles, Star, Zap, Target, Award, Crown, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';

interface DealCongratulationsProps {
  isOpen: boolean;
  onClose: () => void;
  dealData: {
    propertyName: string;
    strategy: 'rent' | 'flip';
    totalCashInvested: number;
    ltv: number;
    cashFlow?: number;
    profit?: number;
    roi?: number;
    isFirstDeal?: boolean;
    didDueDiligence?: boolean;
    propertyPrice: number;
    dealCount?: number;
    hasUnfixedIssues?: boolean;
    unfixedIssueCount?: number;
    marketCondition?: string;
  } | null;
}

function generateDynamicMessage(data: DealCongratulationsProps['dealData']): {
  headline: string;
  subtext: string;
  icon: typeof Trophy;
  color: string;
  factoid: string;
} {
  if (!data) {
    return {
      headline: 'Deal Closed!',
      subtext: 'Your investment journey continues.',
      icon: Trophy,
      color: 'from-amber-500 to-yellow-600',
      factoid: 'Every deal is a learning opportunity.',
    };
  }

  const { strategy, totalCashInvested, ltv, cashFlow, profit, roi, isFirstDeal, didDueDiligence, propertyPrice, propertyName, dealCount } = data;

  if (isFirstDeal) {
    return {
      headline: 'Your First Property!',
      subtext: `${propertyName} is now in your portfolio. This is where it all begins.`,
      icon: Star,
      color: 'from-amber-400 to-orange-500',
      factoid: 'Most successful real estate investors started with just one property.',
    };
  }

  if (strategy === 'rent') {
    const monthlyCashFlow = cashFlow || 0;
    
    if (monthlyCashFlow > 500) {
      return {
        headline: 'Cash Flow Machine!',
        subtext: `${propertyName} will generate $${monthlyCashFlow.toLocaleString()}/month. That's $${(monthlyCashFlow * 12).toLocaleString()} annually working for you.`,
        icon: Zap,
        color: 'from-emerald-400 to-green-600',
        factoid: `At this rate, your investment pays for itself in ${Math.round(totalCashInvested / (monthlyCashFlow * 12))} years.`,
      };
    } else if (monthlyCashFlow > 200) {
      return {
        headline: 'Steady Income Stream',
        subtext: `${propertyName} adds $${monthlyCashFlow.toLocaleString()}/month to your portfolio. Consistent cash flow builds wealth over time.`,
        icon: TrendingUp,
        color: 'from-cyan-400 to-blue-600',
        factoid: 'Conservative cash flow deals often outperform aggressive flips in the long run.',
      };
    } else if (monthlyCashFlow > 0) {
      return {
        headline: 'Building Equity',
        subtext: `${propertyName} is cash flow positive at $${monthlyCashFlow.toLocaleString()}/month. Your tenant is paying down your mortgage.`,
        icon: Home,
        color: 'from-blue-400 to-indigo-600',
        factoid: 'Even small positive cash flow means someone else is building your wealth.',
      };
    } else {
      return {
        headline: 'Strategic Play',
        subtext: `${propertyName} has thin margins now, but appreciation and rent increases could change that.`,
        icon: Target,
        color: 'from-purple-400 to-violet-600',
        factoid: 'Many investors accept break-even cash flow in high-appreciation markets.',
      };
    }
  } else {
    const flipProfit = profit || 0;
    const flipROI = roi || 0;

    if (flipROI > 50) {
      return {
        headline: 'Home Run Flip!',
        subtext: `${propertyName} could net you $${flipProfit.toLocaleString()} profit - that's a ${flipROI.toFixed(0)}% return on your cash!`,
        icon: Crown,
        color: 'from-amber-400 to-yellow-500',
        factoid: 'Returns like this are why flipping attracts investors, but execution is everything.',
      };
    } else if (flipROI > 25) {
      return {
        headline: 'Solid Flip Deal',
        subtext: `${propertyName} targets $${flipProfit.toLocaleString()} profit with a ${flipROI.toFixed(0)}% ROI. Well within healthy margins.`,
        icon: Award,
        color: 'from-emerald-400 to-teal-600',
        factoid: 'Experienced flippers aim for 20-30% ROI to buffer against surprises.',
      };
    } else if (flipROI > 10) {
      return {
        headline: 'Conservative Flip',
        subtext: `${propertyName} projects $${flipProfit.toLocaleString()} profit. Tight margins mean execution matters.`,
        icon: Target,
        color: 'from-blue-400 to-cyan-600',
        factoid: 'Lower ROI flips can still work if you control costs and timeline.',
      };
    } else {
      return {
        headline: 'High-Risk Play',
        subtext: `${propertyName} has thin margins. One surprise could eat your profit.`,
        icon: Sparkles,
        color: 'from-orange-400 to-red-500',
        factoid: 'Tight margins are why due diligence and contingency matter so much.',
      };
    }
  }
}

function generateBonusInsight(data: DealCongratulationsProps['dealData']): string | null {
  if (!data) return null;
  
  const { ltv, didDueDiligence, dealCount, strategy, totalCashInvested, propertyPrice } = data;
  
  if (ltv >= 85) {
    return `High leverage at ${ltv}% LTV - more upside, but less room for error. Watch those payments.`;
  }
  
  if (ltv <= 60) {
    return `Conservative ${ltv}% leverage means lower payments and more cushion. Smart money move.`;
  }
  
  if (!didDueDiligence) {
    return `You skipped some due diligence. Fingers crossed there are no surprises waiting...`;
  }
  
  if ((dealCount || 0) >= 3) {
    return `Deal #${dealCount} in your portfolio. You're building real momentum now.`;
  }
  
  const downPaymentPct = Math.round((totalCashInvested / propertyPrice) * 100);
  if (downPaymentPct > 30) {
    return `Putting ${downPaymentPct}% down keeps your monthly payments comfortable.`;
  }
  
  return null;
}

function generateRenovationHint(data: DealCongratulationsProps['dealData']): string | null {
  if (!data || data.strategy !== 'rent') return null;
  
  const { hasUnfixedIssues, unfixedIssueCount, marketCondition } = data;
  
  if (hasUnfixedIssues && (unfixedIssueCount || 0) > 0) {
    const count = unfixedIssueCount || 0;
    if (marketCondition === 'excellent' || marketCondition === 'good') {
      return `This property has ${count} unfixed issue${count > 1 ? 's' : ''}. In this ${marketCondition === 'excellent' ? 'hot' : 'strong'} market, renovations cost more but can boost your rent significantly. Consider a contractor walkthrough to see the ROI.`;
    }
    if (marketCondition === 'poor' || marketCondition === 'terrible') {
      return `This property has ${count} unfixed issue${count > 1 ? 's' : ''}. Contractors are cheaper in this market, so repairs are a bargain — but rent upside may be limited.`;
    }
    return `This property has ${count} unfixed issue${count > 1 ? 's' : ''}. A contractor walkthrough can reveal renovation opportunities that boost your monthly rent.`;
  }
  
  return null;
}

export function DealCongratulations({ isOpen, onClose, dealData }: DealCongratulationsProps) {
  const message = generateDynamicMessage(dealData);
  const bonusInsight = generateBonusInsight(dealData);
  const renovationHint = generateRenovationHint(dealData);
  const IconComponent = message.icon;

  return (
    <>
      <Confetti isActive={isOpen} particleCount={60} duration={4000} />
      <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[calc(env(safe-area-inset-top,0px)+16px)] pb-[calc(env(safe-area-inset-bottom,0px)+16px)] px-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
          data-sound="close"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="bg-slate-900/95 border border-slate-700 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-colors"
              aria-label="Close"
              data-testid="button-close-congrats-x"
              data-sound="close"
            >
              <span className="text-xl leading-none">×</span>
            </button>
            <div className={`bg-gradient-to-br ${message.color} p-8 text-center`}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className="w-20 h-20 mx-auto bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              >
                <IconComponent className="w-10 h-10 text-white drop-shadow-lg" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
              >
                {message.headline}
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white/90 text-base leading-relaxed"
              >
                {message.subtext}
              </motion.p>
            </div>

            <div className="p-6 space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-800/60 rounded-xl p-4 border border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-amber-200 text-sm font-medium mb-1">Did You Know?</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{message.factoid}</p>
                  </div>
                </div>
              </motion.div>

              {bonusInsight && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-slate-800/40 rounded-xl p-4 border border-cyan-500/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <DollarSign className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-cyan-200 text-sm leading-relaxed">{bonusInsight}</p>
                  </div>
                </motion.div>
              )}

              {renovationHint && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-slate-800/40 rounded-xl p-4 border border-emerald-500/30"
                  data-testid="renovation-hint"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Wrench className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-emerald-300 text-sm font-medium mb-1">Renovation Opportunity</p>
                      <p className="text-slate-400 text-sm leading-relaxed">{renovationHint}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={onClose}
                  className={`w-full py-6 text-lg font-bold bg-gradient-to-r ${message.color} hover:opacity-90 transition-opacity`}
                  data-no-click-sound
                >
                  Continue
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
