import { motion, AnimatePresence } from 'framer-motion';
import { Home, DollarSign, TrendingUp, Banknote, PartyPopper, Sparkles, BadgeDollarSign, ArrowRight, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { playSaleCompleteSound } from '@/hooks/useClickSound';

interface PropertySoldAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  onShareCard?: () => void;
  saleData: {
    propertyName: string;
    salePrice: number;
    purchasePrice: number;
    mortgagePayoff: number;
    netProceeds: number;
    saleProfit: number;
    isRental: boolean;
    rehabCost?: number;
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

export function PropertySoldAnimation({ isOpen, onClose, onShareCard, saleData }: PropertySoldAnimationProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      playSaleCompleteSound();
      setShowDetails(false);
      const timer = setTimeout(() => setShowDetails(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!saleData) return null;

  const isProfitable = saleData.saleProfit >= 0;
  const profitPercent = saleData.purchasePrice > 0 
    ? ((saleData.saleProfit / saleData.purchasePrice) * 100).toFixed(1)
    : '0';

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

                    <div className="grid grid-cols-2 gap-3">
                      <motion.div
                        className="bg-slate-800/60 rounded-xl p-3 border border-slate-700"
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Home className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-gray-400">Purchase Price</span>
                        </div>
                        <p className="text-lg font-bold text-blue-300">${saleData.purchasePrice.toLocaleString()}</p>
                      </motion.div>

                      {saleData.mortgagePayoff > 0 && (
                        <motion.div
                          className="bg-slate-800/60 rounded-xl p-3 border border-slate-700"
                          initial={{ x: 20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Banknote className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-gray-400">Mortgage Paid Off</span>
                          </div>
                          <p className="text-lg font-bold text-amber-300">${saleData.mortgagePayoff.toLocaleString()}</p>
                        </motion.div>
                      )}
                    </div>

                    <motion.div
                      className={`rounded-xl p-4 border-2 ${
                        isProfitable 
                          ? 'bg-gradient-to-r from-emerald-900/50 to-green-900/50 border-green-400/50' 
                          : 'bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-400/50'
                      }`}
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4, type: 'spring' }}
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
