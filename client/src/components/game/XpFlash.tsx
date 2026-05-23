import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Trophy } from 'lucide-react';
import { getStreakTier, getXpLevel } from '@shared/streakTiers';

export type XpFlashEvent = {
  id: number;
  xpGained: number;
  newXp: number;
  newStreak: number;
  prevStreak: number;
  prevXp: number;
};

interface XpFlashProps {
  event: XpFlashEvent | null;
  onDone: () => void;
}

// Lightweight dopamine beat that lives at the top center after a profitable close.
// Three flavors stacked smartly:
//   1) Always: a small "+XP" pill
//   2) If the streak crossed a tier threshold: a tier-up banner
//   3) If career XP crossed a level: a level-up banner
// Auto-dismisses after ~2.4s.
export function XpFlash({ event, onDone }: XpFlashProps) {
  useEffect(() => {
    if (!event) return;
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [event, onDone]);

  if (!event) return null;

  const prevTier = getStreakTier(event.prevStreak);
  const nextTier = getStreakTier(event.newStreak);
  const crossedTier = nextTier.title && nextTier.title !== prevTier.title;

  const prevLevel = getXpLevel(event.prevXp);
  const nextLevel = getXpLevel(event.newXp);
  const crossedLevel = nextLevel.level > prevLevel.level;

  return (
    <AnimatePresence>
      <motion.div
        key={event.id}
        initial={{ y: -40, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -16, opacity: 0 }}
        transition={{ type: 'spring', damping: 18, stiffness: 260 }}
        className="fixed left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-2 pointer-events-none"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 76px)' }}
        data-testid="xp-flash"
      >
        {/* XP pill — quiet, just acknowledges the reward */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/95 text-slate-950 shadow-[0_4px_24px_rgba(245,158,11,0.4)]">
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span className="font-mono font-bold text-sm tabular-nums">+{event.xpGained} XP</span>
        </div>

        {crossedTier && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0e0e12]/95 border border-amber-500/40 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur"
          >
            <Flame className={`w-4 h-4 ${nextTier.colorClass}`} />
            <div className="text-left">
              <div className={`text-xs uppercase tracking-widest font-bold ${nextTier.colorClass}`}>
                {nextTier.title}
              </div>
              <div className="text-white/55 text-[10px] leading-snug max-w-[200px]">{nextTier.blurb}</div>
            </div>
          </motion.div>
        )}

        {crossedLevel && (
          <motion.div
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0e0e12]/95 border border-cyan-400/40 shadow-[0_8px_30px_rgba(0,0,0,0.6)] backdrop-blur"
          >
            <Trophy className="w-4 h-4 text-cyan-300" />
            <div className="text-left">
              <div className="text-xs uppercase tracking-widest font-bold text-cyan-300">
                Level {nextLevel.level} · {nextLevel.title}
              </div>
              <div className="text-white/55 text-[10px]">New investor title unlocked.</div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
