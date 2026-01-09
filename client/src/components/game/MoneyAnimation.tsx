import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

interface MoneyAnimationProps {
  trigger: boolean;
  amount?: number;
  onComplete?: () => void;
}

interface Bill {
  id: number;
  x: number;
  delay: number;
  rotation: number;
  scale: number;
}

export function MoneyAnimation({ trigger, amount, onComplete }: MoneyAnimationProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true);
      const billCount = Math.min(Math.max(5, Math.floor((amount || 100) / 50)), 12);
      const newBills: Bill[] = [];
      
      for (let i = 0; i < billCount; i++) {
        newBills.push({
          id: Date.now() + i,
          x: Math.random() * 200 - 100,
          delay: i * 0.05,
          rotation: Math.random() * 60 - 30,
          scale: 0.7 + Math.random() * 0.5,
        });
      }
      
      setBills(newBills);
      
      setTimeout(() => {
        setBills([]);
        setIsAnimating(false);
        onComplete?.();
      }, 1500);
    }
  }, [trigger, amount, onComplete, isAnimating]);

  return (
    <AnimatePresence>
      {bills.map((bill) => (
        <motion.div
          key={bill.id}
          className="fixed pointer-events-none z-[200]"
          initial={{ 
            opacity: 0,
            y: 0,
            x: bill.x,
            scale: 0,
            rotate: bill.rotation,
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: -200,
            x: bill.x + (Math.random() * 40 - 20),
            scale: bill.scale,
            rotate: bill.rotation + (Math.random() * 20 - 10),
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            delay: bill.delay,
            ease: [0.25, 0.46, 0.45, 0.94],
            opacity: { times: [0, 0.1, 0.7, 1] },
          }}
          style={{
            top: '50%',
            left: '50%',
          }}
        >
          <div className="relative">
            <div className="w-12 h-8 bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 rounded-sm shadow-lg flex items-center justify-center border border-emerald-300/50">
              <DollarSign className="w-5 h-5 text-emerald-100" strokeWidth={2.5} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-sm" />
          </div>
        </motion.div>
      ))}
    </AnimatePresence>
  );
}

export function useMoneyAnimation() {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [animationAmount, setAnimationAmount] = useState(0);

  const triggerAnimation = (amount: number) => {
    setAnimationAmount(amount);
    setShouldAnimate(true);
  };

  const resetAnimation = () => {
    setShouldAnimate(false);
  };

  return {
    shouldAnimate,
    animationAmount,
    triggerAnimation,
    resetAnimation,
  };
}
