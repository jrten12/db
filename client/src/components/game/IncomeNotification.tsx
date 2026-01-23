/**
 * Income Notification Component
 *
 * Animated notification that appears when income is received
 * (rental payments, flip sale proceeds, curveball bonuses)
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Home, Sparkles } from 'lucide-react';

export interface IncomeEvent {
  id: string;
  amount: number;
  type: 'rental' | 'flip' | 'curveball';
  title: string;
  description?: string;
  emoji?: string;
  color?: 'green' | 'blue' | 'yellow' | 'purple';
}

interface IncomeNotificationProps {
  events: IncomeEvent[];
  onDismiss: (id: string) => void;
}

const getIconForType = (type: IncomeEvent['type']) => {
  switch (type) {
    case 'rental':
      return Home;
    case 'flip':
      return TrendingUp;
    case 'curveball':
      return Sparkles;
    default:
      return DollarSign;
  }
};

const getColorClasses = (color?: string) => {
  switch (color) {
    case 'green':
      return 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400';
    case 'blue':
      return 'bg-gradient-to-r from-blue-500 to-cyan-600 border-blue-400';
    case 'yellow':
      return 'bg-gradient-to-r from-yellow-500 to-orange-600 border-yellow-400';
    case 'purple':
      return 'bg-gradient-to-r from-purple-500 to-pink-600 border-purple-400';
    default:
      return 'bg-gradient-to-r from-green-500 to-emerald-600 border-green-400';
  }
};

export function IncomeNotification({ events, onDismiss }: IncomeNotificationProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    events.forEach((event) => {
      const timer = setTimeout(() => {
        onDismiss(event.id);
      }, 4000);

      return () => clearTimeout(timer);
    });
  }, [events, onDismiss]);

  return (
    <div className="fixed top-[calc(env(safe-area-inset-top,0px)+180px)] right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {events.map((event, index) => {
          const Icon = getIconForType(event.type);
          const colorClasses = getColorClasses(event.color);

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 100, scale: 0.8 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: 1,
                transition: {
                  type: 'spring',
                  stiffness: 500,
                  damping: 30,
                },
              }}
              exit={{
                opacity: 0,
                x: 100,
                scale: 0.8,
                transition: { duration: 0.2 },
              }}
              className="pointer-events-auto"
            >
              <div
                className={`${colorClasses} text-white rounded-lg shadow-2xl border-2 p-4 min-w-[320px] max-w-md overflow-hidden relative`}
              >
                {/* Shine animation overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{
                    x: '200%',
                    transition: {
                      duration: 1.5,
                      ease: 'easeInOut',
                      delay: 0.2,
                    },
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex items-start gap-3">
                  {/* Icon with pulse animation */}
                  <motion.div
                    className="bg-white/20 rounded-full p-2 backdrop-blur-sm"
                    animate={{
                      scale: [1, 1.1, 1],
                      transition: {
                        duration: 0.5,
                        repeat: 3,
                        repeatDelay: 0.5,
                      },
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>

                  {/* Text content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">
                        {event.emoji && <span className="mr-1">{event.emoji}</span>}
                        {event.title}
                      </h3>
                    </div>

                    {event.description && (
                      <p className="text-sm text-white/90 mt-1">{event.description}</p>
                    )}

                    {/* Amount with counting animation */}
                    <motion.div
                      className="text-2xl font-bold mt-2 flex items-center gap-1"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        transition: {
                          type: 'spring',
                          stiffness: 400,
                          damping: 20,
                          delay: 0.3,
                        },
                      }}
                    >
                      <DollarSign className="w-6 h-6" />
                      <CountUpAnimation target={event.amount} duration={800} />
                    </motion.div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => onDismiss(event.id)}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

/**
 * Animated number counter
 */
function CountUpAnimation({ target, duration }: { target: number; duration: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Ease out quad function for smooth deceleration
      const easeOutQuad = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * easeOutQuad));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [target, duration]);

  return (
    <span>
      {new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(count)}
    </span>
  );
}

/**
 * Hook to manage income notification queue
 */
export function useIncomeNotifications() {
  const [events, setEvents] = useState<IncomeEvent[]>([]);

  const addIncomeEvent = (event: Omit<IncomeEvent, 'id'>) => {
    const newEvent: IncomeEvent = {
      ...event,
      id: `${Date.now()}-${Math.random()}`,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const dismissEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const addRentalPayment = (
    netIncome: number,
    grossRent: number,
    totalExpenses: number,
    propertyName?: string
  ) => {
    // Just show "Weekly cash flow" - the breakdown was confusing
    const description = netIncome >= 0 
      ? 'Weekly cash flow after expenses'
      : 'Expenses exceeded rent this week';
    addIncomeEvent({
      amount: netIncome,
      type: 'rental',
      title: propertyName ? `${propertyName}` : 'Weekly Rental Income',
      description,
      emoji: '🏠',
      color: netIncome >= 0 ? 'green' : 'yellow',
    });
  };

  const addFlipProceeds = (amount: number, profit: number, propertyName?: string) => {
    addIncomeEvent({
      amount,
      type: 'flip',
      title: 'Flip Sale Complete!',
      description: `Net profit: $${profit.toLocaleString()}${
        propertyName ? ` • ${propertyName}` : ''
      }`,
      emoji: '🎉',
      color: 'blue',
    });
  };

  const addCurveballBonus = (
    amount: number,
    title: string,
    description: string,
    emoji?: string,
    color?: 'green' | 'blue' | 'yellow' | 'purple'
  ) => {
    addIncomeEvent({
      amount,
      type: 'curveball',
      title,
      description,
      emoji,
      color: color || 'purple',
    });
  };

  return {
    events,
    dismissEvent,
    addRentalPayment,
    addFlipProceeds,
    addCurveballBonus,
  };
}
