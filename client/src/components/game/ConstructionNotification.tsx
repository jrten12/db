import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HardHat, Hammer, Wrench, CheckCircle2, DollarSign, TrendingUp, X, AlertTriangle, Home, PartyPopper } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import { useUISounds } from '@/hooks/useUISounds';

export interface ConstructionEvent {
  id: string;
  type: 'start' | 'complete';
  propertyName: string;
  strategy: 'flip' | 'rent';
  weeksEstimated?: number;
  rehabCost?: number;
  rentIncrease?: number;
  oldRent?: number;
  newRent?: number;
}

interface ConstructionNotificationProps {
  events: ConstructionEvent[];
  onDismiss: (id: string) => void;
}

export function ConstructionNotification({ events, onDismiss }: ConstructionNotificationProps) {
  const [currentEvent, setCurrentEvent] = useState<ConstructionEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { playWhoosh, playSuccess } = useUISounds();

  useEffect(() => {
    if (events.length > 0 && !currentEvent) {
      setCurrentEvent(events[0]);
      setIsVisible(true);
      
      if (events[0].type === 'start') {
        playWhoosh();
      } else {
        playSuccess();
      }
    }
  }, [events, currentEvent, playWhoosh, playSuccess]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (currentEvent) {
        onDismiss(currentEvent.id);
        setCurrentEvent(null);
      }
    }, 300);
  };

  useEffect(() => {
    if (currentEvent) {
      const timer = setTimeout(handleClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [currentEvent]);

  if (!currentEvent) return null;

  const isStart = currentEvent.type === 'start';
  const isFlip = currentEvent.strategy === 'flip';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] pointer-events-auto"
        >
          <div className={`
            relative overflow-hidden rounded-2xl border-2 
            ${isStart 
              ? 'bg-gradient-to-br from-orange-900/95 to-amber-900/95 border-orange-500/50' 
              : 'bg-gradient-to-br from-emerald-900/95 to-green-900/95 border-emerald-500/50'
            }
            backdrop-blur-xl shadow-2xl min-w-[340px] max-w-[420px]
          `}>
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  background: isStart
                    ? [
                        'radial-gradient(circle at 20% 20%, rgba(251,146,60,0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 80%, rgba(251,146,60,0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 20%, rgba(251,146,60,0.3) 0%, transparent 50%)',
                      ]
                    : [
                        'radial-gradient(circle at 20% 20%, rgba(52,211,153,0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 80% 80%, rgba(52,211,153,0.3) 0%, transparent 50%)',
                        'radial-gradient(circle at 20% 20%, rgba(52,211,153,0.3) 0%, transparent 50%)',
                      ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>

            <div className="relative p-5">
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                data-testid="button-close-construction"
                data-sound="close"
              >
                <X className="w-5 h-5" />
              </button>

              {isStart ? (
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: [0, -15, 0, 15, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    className="w-14 h-14 rounded-xl bg-orange-500/30 border border-orange-400/50 flex items-center justify-center"
                  >
                    <HardHat className="w-8 h-8 text-orange-300" />
                  </motion.div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Hammer className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                        Construction Started
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      {currentEvent.propertyName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      {currentEvent.weeksEstimated && (
                        <span className="text-orange-200">
                          Est. {currentEvent.weeksEstimated} weeks
                        </span>
                      )}
                      {currentEvent.rehabCost && (
                        <span className="text-orange-200">
                          Budget: {formatCurrency(currentEvent.rehabCost)}
                        </span>
                      )}
                    </div>
                    {!isFlip && (
                      <p className="text-orange-300/80 text-xs mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Tenant displaced - no income during renovation
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                    className="w-14 h-14 rounded-xl bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center"
                  >
                    {isFlip ? (
                      <Home className="w-8 h-8 text-emerald-300" />
                    ) : (
                      <PartyPopper className="w-8 h-8 text-emerald-300" />
                    )}
                  </motion.div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Renovation Complete!
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      {currentEvent.propertyName}
                    </h3>
                    
                    {isFlip ? (
                      <p className="text-emerald-200 text-sm">
                        Property ready to list for sale
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {currentEvent.rentIncrease && currentEvent.rentIncrease > 0 ? (
                          <motion.div 
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex items-center gap-2 bg-emerald-500/20 rounded-lg px-3 py-2 border border-emerald-500/30"
                          >
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            <div>
                              <span className="text-emerald-300 font-bold">
                                Rent increased by {formatCurrency(currentEvent.rentIncrease)}/mo!
                              </span>
                              <div className="text-emerald-200/70 text-xs">
                                {formatCurrency(currentEvent.oldRent || 0)} → {formatCurrency(currentEvent.newRent || 0)}
                              </div>
                            </div>
                          </motion.div>
                        ) : (
                          <p className="text-emerald-200/80 text-sm">
                            Tenant returning - rental income resumes
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 6, ease: 'linear' }}
                className={`absolute bottom-0 left-0 right-0 h-1 ${
                  isStart ? 'bg-orange-400' : 'bg-emerald-400'
                } origin-left`}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useConstructionNotifications() {
  const [events, setEvents] = useState<ConstructionEvent[]>([]);

  const addConstructionStart = (
    propertyName: string,
    strategy: 'flip' | 'rent',
    weeksEstimated: number,
    rehabCost: number
  ) => {
    const event: ConstructionEvent = {
      id: `construction-${Date.now()}`,
      type: 'start',
      propertyName,
      strategy,
      weeksEstimated,
      rehabCost,
    };
    setEvents(prev => [...prev, event]);
  };

  const addConstructionComplete = (
    propertyName: string,
    strategy: 'flip' | 'rent',
    rentIncrease?: number,
    oldRent?: number,
    newRent?: number
  ) => {
    const event: ConstructionEvent = {
      id: `complete-${Date.now()}`,
      type: 'complete',
      propertyName,
      strategy,
      rentIncrease,
      oldRent,
      newRent,
    };
    setEvents(prev => [...prev, event]);
  };

  const dismissEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  return {
    events,
    addConstructionStart,
    addConstructionComplete,
    dismissEvent,
  };
}
