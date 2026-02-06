import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Banknote, TrendingUp, Crown, Coins, Rocket, Flame, Building2, Hammer, 
  RefreshCw, ShieldCheck, Home, Key, RotateCcw, Zap, Layers, Dice5, X,
  type LucideIcon 
} from 'lucide-react';
import { 
  ACHIEVEMENT_DEFINITIONS, 
  TIER_COLORS, 
  type AchievementDefinition 
} from '@/lib/achievements';
import { useUISounds } from '@/hooks/useUISounds';

const ICON_MAP: Record<string, LucideIcon> = {
  'banknote': Banknote,
  'trending-up': TrendingUp,
  'crown': Crown,
  'coins': Coins,
  'rocket': Rocket,
  'flame': Flame,
  'building-2': Building2,
  'hammer': Hammer,
  'refresh-cw': RefreshCw,
  'shield-check': ShieldCheck,
  'home': Home,
  'key': Key,
  'rotate-ccw': RotateCcw,
  'zap': Zap,
  'layers': Layers,
  'dice-5': Dice5,
  'trophy': Trophy,
};

interface AchievementPopupProps {
  achievementId: string | null;
  onClose: () => void;
}

export function AchievementPopup({ achievementId, onClose }: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { playAchievement, playEpicAchievement } = useUISounds();

  useEffect(() => {
    if (achievementId) {
      setIsVisible(true);
      const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
      
      // Delay sound slightly to avoid overlap with week advance sound
      const soundTimer = setTimeout(() => {
        if (achievement) {
          if (achievement.tier === 'diamond' || achievement.tier === 'platinum') {
            playEpicAchievement();
          } else {
            playAchievement();
          }
        }
      }, 300);
      
      // Show for just a beat (2.5 seconds) then fade out
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 400);
      }, 2500);
      
      return () => {
        clearTimeout(soundTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [achievementId, playAchievement, playEpicAchievement, onClose]);

  if (!achievementId) return null;

  const achievement = ACHIEVEMENT_DEFINITIONS[achievementId];
  if (!achievement) return null;

  const colors = TIER_COLORS[achievement.tier];
  const IconComponent = ICON_MAP[achievement.icon] || Trophy;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto"
        >
          <div 
            className={`
              relative overflow-hidden rounded-2xl border-2 ${colors.border} ${colors.bg}
              backdrop-blur-xl shadow-2xl ${colors.glow} shadow-lg
              min-w-[320px] max-w-[400px]
            `}
          >
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className={`absolute inset-0 ${colors.bg} opacity-50`}
                animate={{
                  background: [
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                    'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            
            <div className="relative p-5">
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
                data-testid="button-close-achievement"
                data-sound="swoosh"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                  className={`
                    w-16 h-16 rounded-xl ${colors.bg} border ${colors.border}
                    flex items-center justify-center relative
                  `}
                >
                  <motion.div
                    animate={{ 
                      boxShadow: [
                        `0 0 20px 5px ${colors.glow.replace('shadow-', '').replace('/30', '').replace('/40', '').replace('/50', '').replace('/60', '')}40`,
                        `0 0 40px 10px ${colors.glow.replace('shadow-', '').replace('/30', '').replace('/40', '').replace('/50', '').replace('/60', '')}60`,
                        `0 0 20px 5px ${colors.glow.replace('shadow-', '').replace('/30', '').replace('/40', '').replace('/50', '').replace('/60', '')}40`,
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-xl"
                  />
                  <IconComponent className={`w-8 h-8 ${colors.text} relative z-10`} />
                </motion.div>

                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                        {achievement.tier} Achievement
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg mb-0.5">
                      {achievement.name}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {achievement.description}
                    </p>
                  </motion.div>
                </div>
              </div>

              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`absolute bottom-0 left-0 right-0 h-1 ${colors.text.replace('text-', 'bg-')} origin-left`}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface AchievementQueueProps {
  queue: string[];
  onDismiss: (id: string) => void;
}

export function AchievementQueue({ queue, onDismiss }: AchievementQueueProps) {
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(() => {
    if (queue.length > 0 && !currentId) {
      setCurrentId(queue[0]);
    }
  }, [queue, currentId]);

  const handleClose = () => {
    if (currentId) {
      onDismiss(currentId);
      setCurrentId(null);
    }
  };

  return <AchievementPopup achievementId={currentId} onClose={handleClose} />;
}
