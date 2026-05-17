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
      
      const soundTimer = setTimeout(() => {
        if (achievement) {
          if (achievement.tier === 'diamond' || achievement.tier === 'platinum') {
            playEpicAchievement();
          } else {
            playAchievement();
          }
        }
      }, 200);
      
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 2200);
      
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
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed left-1/2 -translate-x-1/2 z-[60] pointer-events-auto"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
        >
          <div 
            className={`
              relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg}
              backdrop-blur-md shadow-lg
              max-w-[340px]
            `}
            onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
          >
            <div className="relative px-4 py-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/20 transition-colors"
                data-testid="button-close-achievement"
                data-sound="close"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>

              <div className="flex items-center gap-3 pr-6">
                <div
                  className={`
                    w-10 h-10 rounded-lg ${colors.bg} border ${colors.border}
                    flex items-center justify-center flex-shrink-0
                  `}
                >
                  <IconComponent className={`w-5 h-5 ${colors.text}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${colors.text} leading-none mb-0.5`}>
                    {achievement.tier} Achievement
                  </div>
                  <div className="text-white font-semibold text-sm leading-tight truncate">
                    {achievement.name}
                  </div>
                  <div className="text-gray-400 text-xs leading-tight truncate">
                    {achievement.description}
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 2.2, ease: 'linear' }}
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${colors.text.replace('text-', 'bg-')} origin-left`}
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
