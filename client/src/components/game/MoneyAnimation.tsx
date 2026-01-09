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
  startX: number;
  endX: number;
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
      const billCount = Math.min(Math.max(6, Math.floor((amount || 100) / 30)), 15);
      const newBills: Bill[] = [];
      
      for (let i = 0; i < billCount; i++) {
        newBills.push({
          id: Date.now() + i,
          startX: Math.random() * 120 - 60,
          endX: Math.random() * 200 - 100,
          delay: i * 0.12,
          rotation: Math.random() * 40 - 20,
          scale: 1 + Math.random() * 0.4,
        });
      }
      
      setBills(newBills);
      
      setTimeout(() => {
        setBills([]);
        setIsAnimating(false);
        onComplete?.();
      }, 2500);
    }
  }, [trigger, amount, onComplete, isAnimating]);

  return (
    <AnimatePresence>
      {bills.map((bill) => (
        <motion.div
          key={bill.id}
          className="fixed pointer-events-none z-[9999]"
          initial={{ 
            opacity: 0,
            y: 0,
            x: bill.startX,
            scale: 0.3,
            rotate: 0,
          }}
          animate={{ 
            opacity: [0, 1, 1, 1, 0],
            y: -300,
            x: bill.endX,
            scale: bill.scale,
            rotate: bill.rotation,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.8,
            delay: bill.delay,
            ease: "easeOut",
            opacity: { times: [0, 0.1, 0.4, 0.8, 1], duration: 1.8 },
          }}
          style={{
            top: '45%',
            left: '50%',
            marginLeft: '-32px',
          }}
        >
          <div className="relative drop-shadow-2xl">
            <div 
              className="w-16 h-10 rounded-md flex items-center justify-center border-2 border-emerald-300"
              style={{
                background: 'linear-gradient(135deg, #34d399 0%, #10b981 50%, #059669 100%)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3)',
              }}
            >
              <DollarSign className="w-7 h-7 text-white drop-shadow-md" strokeWidth={3} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/30 rounded-md" />
            <div className="absolute -inset-1 bg-emerald-400/20 rounded-lg blur-md -z-10" />
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
