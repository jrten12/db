import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

interface MoneyAnimationProps {
  trigger: number;
  onComplete?: () => void;
}

interface Bill {
  id: number;
  startX: number;
  endX: number;
  delay: number;
  rotation: number;
}

export function MoneyAnimation({ trigger, onComplete }: MoneyAnimationProps) {
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    if (trigger > 0) {
      const billCount = Math.min(Math.max(8, Math.floor(trigger / 25)), 18);
      const newBills: Bill[] = [];
      
      for (let i = 0; i < billCount; i++) {
        newBills.push({
          id: Date.now() + i + Math.random(),
          startX: (Math.random() - 0.5) * 100,
          endX: (Math.random() - 0.5) * 250,
          delay: i * 0.08,
          rotation: (Math.random() - 0.5) * 60,
        });
      }
      
      setBills(newBills);
      
      const timer = setTimeout(() => {
        setBills([]);
        onComplete?.();
      }, 2200);

      return () => clearTimeout(timer);
    }
  }, [trigger, onComplete]);

  if (bills.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {bills.map((bill) => (
          <motion.div
            key={bill.id}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
            }}
            initial={{ 
              opacity: 0,
              y: 20,
              x: bill.startX,
              scale: 0.5,
              rotate: 0,
            }}
            animate={{ 
              opacity: [0, 1, 1, 1, 0.8, 0],
              y: -350,
              x: bill.endX,
              scale: [0.5, 1.2, 1],
              rotate: bill.rotation,
            }}
            transition={{
              duration: 1.6,
              delay: bill.delay,
              ease: "easeOut",
              opacity: { 
                times: [0, 0.1, 0.3, 0.6, 0.85, 1],
                duration: 1.6,
              },
              scale: {
                times: [0, 0.2, 0.4],
                duration: 0.6,
              }
            }}
          >
            <div 
              className="w-14 h-9 rounded flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #4ade80 0%, #22c55e 40%, #16a34a 100%)',
                border: '2px solid #86efac',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.7), 0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <DollarSign className="w-6 h-6 text-white" strokeWidth={3} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useMoneyAnimation() {
  const [animationKey, setAnimationKey] = useState(0);

  const triggerAnimation = useCallback((amount: number) => {
    if (amount > 0) {
      setAnimationKey(Date.now());
    }
  }, []);

  const resetAnimation = useCallback(() => {
    setAnimationKey(0);
  }, []);

  return {
    animationKey,
    triggerAnimation,
    resetAnimation,
  };
}
