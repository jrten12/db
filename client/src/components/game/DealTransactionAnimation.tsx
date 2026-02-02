import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, DollarSign, Landmark, CheckCircle, ArrowDown, Wallet, FileCheck } from 'lucide-react';

interface DealTransactionAnimationProps {
  isVisible: boolean;
  propertyName: string;
  purchasePrice: number;
  downPayment: number;
  closingCosts: number;
  loanOriginationFee: number;
  loanAmount: number;
  strategy: 'rent' | 'flip';
  onComplete?: () => void;
}

export function DealTransactionAnimation({
  isVisible,
  propertyName,
  purchasePrice,
  downPayment,
  closingCosts,
  loanOriginationFee,
  loanAmount,
  strategy,
  onComplete,
}: DealTransactionAnimationProps) {
  const [step, setStep] = useState(0);
  const totalCash = downPayment + closingCosts + loanOriginationFee;
  const processingSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    processingSoundRef.current = new Audio('/sounds/processing.mp3');
    processingSoundRef.current.volume = 0.5;
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setStep(0);
      return;
    }

    if (processingSoundRef.current) {
      processingSoundRef.current.currentTime = 0;
      processingSoundRef.current.play().catch(() => {});
    }

    const timers = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 800),
      setTimeout(() => setStep(3), 1300),
      setTimeout(() => setStep(4), 1800),
      setTimeout(() => setStep(5), 2300),
      setTimeout(() => {
        setStep(6);
        onComplete?.();
      }, 3000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [isVisible, onComplete]);

  const formatMoney = (n: number) => `$${n.toLocaleString()}`;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 20 }}
            className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-emerald-500/30 p-6 max-w-md w-full shadow-2xl shadow-emerald-500/10"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center"
              >
                <Building2 className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-white mb-1">Processing Deal</h2>
              <p className="text-emerald-400 font-medium">{propertyName}</p>
              <p className="text-gray-400 text-sm mt-1 capitalize">{strategy} Strategy</p>
            </div>

            <div className="space-y-3">
              <TransactionRow
                icon={<Wallet className="w-5 h-5" />}
                label="Your Cash Investment"
                amount={formatMoney(totalCash)}
                active={step >= 1}
                type="debit"
              />
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 2 ? 1 : 0 }}
                className="flex justify-center"
              >
                <ArrowDown className="w-5 h-5 text-gray-500" />
              </motion.div>

              <TransactionRow
                icon={<DollarSign className="w-5 h-5" />}
                label="Down Payment"
                amount={formatMoney(downPayment)}
                active={step >= 2}
                type="debit"
                indent
              />

              <TransactionRow
                icon={<FileCheck className="w-5 h-5" />}
                label="Closing Costs"
                amount={formatMoney(closingCosts)}
                active={step >= 3}
                type="debit"
                indent
              />

              <TransactionRow
                icon={<Landmark className="w-5 h-5" />}
                label="Loan Fees"
                amount={formatMoney(loanOriginationFee)}
                active={step >= 3}
                type="debit"
                indent
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 4 ? 1 : 0 }}
                className="flex justify-center py-2"
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              </motion.div>

              <TransactionRow
                icon={<Landmark className="w-5 h-5" />}
                label="Bank Loan Funded"
                amount={formatMoney(loanAmount)}
                active={step >= 4}
                type="credit"
              />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: step >= 5 ? 1 : 0 }}
                className="flex justify-center py-2"
              >
                <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              </motion.div>

              <TransactionRow
                icon={<Building2 className="w-5 h-5" />}
                label="Property Acquired"
                amount={formatMoney(purchasePrice)}
                active={step >= 5}
                type="neutral"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: step >= 6 ? 1 : 0, y: step >= 6 ? 0 : 20 }}
              className="mt-6 text-center"
            >
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
                <CheckCircle className="w-5 h-5" />
                <span>Deal Complete!</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                {strategy === 'rent' 
                  ? 'Your rental property is now generating income.'
                  : 'Your flip project is underway. Time to renovate!'}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TransactionRow({
  icon,
  label,
  amount,
  active,
  type,
  indent = false,
}: {
  icon: React.ReactNode;
  label: string;
  amount: string;
  active: boolean;
  type: 'debit' | 'credit' | 'neutral';
  indent?: boolean;
}) {
  const colorClass = type === 'debit' 
    ? 'text-red-400' 
    : type === 'credit' 
    ? 'text-emerald-400' 
    : 'text-white';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: active ? 1 : 0.3, 
        x: active ? 0 : -20,
        scale: active ? 1 : 0.95,
      }}
      transition={{ type: 'spring', damping: 20 }}
      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        active 
          ? 'bg-slate-800/80 border border-slate-700' 
          : 'bg-slate-900/50'
      } ${indent ? 'ml-4' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div className={`${active ? colorClass : 'text-gray-600'}`}>
          {icon}
        </div>
        <span className={`text-sm font-medium ${active ? 'text-gray-200' : 'text-gray-600'}`}>
          {label}
        </span>
      </div>
      <span className={`font-mono font-bold ${active ? colorClass : 'text-gray-600'}`}>
        {type === 'debit' ? '-' : type === 'credit' ? '+' : ''}{amount}
      </span>
    </motion.div>
  );
}
