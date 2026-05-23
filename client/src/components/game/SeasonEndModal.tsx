import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  TrendingUp,
  X,
  Trophy,
  Calendar,
  DollarSign,
  Loader2,
  Flame,
  Award,
  Target,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';
import { getStreakTier } from '@shared/streakTiers';

type SeasonStats = {
  bestDealProfit: number;
  bestDealLabel: string;
  totalCashFlow: number;
  dealsClosed: number;
  profitableThisSeason: number;
  xpEarnedThisSeason: number;
};

interface SeasonEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Returns the actual server unlock result so we can show real bonus amount.
  onSeasonUnlocked: () => Promise<{ bonus: number; nextSeason: number }>;
  currentSeason: number;
  seasonStats: SeasonStats | null | undefined;
  bestStreak: number;
  cash: number;
}

// Defensive — legacy or partial JSON rows could leave fields missing.
// Returning a fully-shaped object means downstream math never sees NaN.
function normalizeSeasonStats(raw: SeasonStats | null | undefined): SeasonStats {
  const s = (raw ?? {}) as Partial<SeasonStats>;
  return {
    bestDealProfit: Number.isFinite(s.bestDealProfit) ? Number(s.bestDealProfit) : 0,
    bestDealLabel: typeof s.bestDealLabel === 'string' ? s.bestDealLabel : '',
    totalCashFlow: Number.isFinite(s.totalCashFlow) ? Number(s.totalCashFlow) : 0,
    dealsClosed: Number.isFinite(s.dealsClosed) ? Number(s.dealsClosed) : 0,
    profitableThisSeason: Number.isFinite(s.profitableThisSeason) ? Number(s.profitableThisSeason) : 0,
    xpEarnedThisSeason: Number.isFinite(s.xpEarnedThisSeason) ? Number(s.xpEarnedThisSeason) : 0,
  };
}

type Phase = 'recap' | 'ad' | 'unlocking' | 'celebrate';

const AD_SECONDS = 15;

// Grade the season as a whole — combines profitable hit-rate and best-deal scale.
// Intentionally generous early so the dopamine lands; harder As later.
function gradeSeason(stats: SeasonStats): { letter: string; tone: string; line: string } {
  const { dealsClosed, profitableThisSeason, bestDealProfit, totalCashFlow } = stats;
  if (dealsClosed === 0) {
    return { letter: 'I', tone: 'text-white/40', line: 'Incomplete — you took the long view and watched.' };
  }
  const hitRate = profitableThisSeason / dealsClosed;
  const heatScore = (hitRate * 60) + Math.min(bestDealProfit / 1000, 25) + Math.min(totalCashFlow / 2000, 15);
  if (heatScore >= 85) return { letter: 'A+', tone: 'text-emerald-300', line: 'Untouchable run. Tape this season to the wall.' };
  if (heatScore >= 72) return { letter: 'A', tone: 'text-emerald-400', line: 'Sharp underwriting, clean execution. Real-investor stuff.' };
  if (heatScore >= 60) return { letter: 'B+', tone: 'text-amber-300', line: 'Solid year. A couple of decisions away from a great one.' };
  if (heatScore >= 45) return { letter: 'B', tone: 'text-amber-300', line: 'You closed deals and stayed alive. That is the job.' };
  if (heatScore >= 30) return { letter: 'C', tone: 'text-orange-300', line: 'Survived. Now go pick the lessons apart.' };
  if (heatScore >= 15) return { letter: 'D', tone: 'text-orange-400', line: 'Rough year. Every operator has them. Read the tape.' };
  return { letter: 'F', tone: 'text-red-300', line: "Tough season. Don't quit — pros learn faster on the losses." };
}

export function SeasonEndModal({
  isOpen,
  onClose,
  onSeasonUnlocked,
  currentSeason,
  seasonStats,
  bestStreak,
  cash,
}: SeasonEndModalProps) {
  const [phase, setPhase] = useState<Phase>('recap');
  const [secondsLeft, setSecondsLeft] = useState(AD_SECONDS);
  const [unlockResult, setUnlockResult] = useState<{ bonus: number; nextSeason: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Freeze the season number at modal-open time. The parent's `currentSeason`
  // updates the moment we call setGameRun() after unlock — without freezing,
  // the ticker would animate from "new season → new season" (same number).
  const [frozenSeason, setFrozenSeason] = useState(currentSeason);

  useEffect(() => {
    if (isOpen) {
      setPhase('recap');
      setSecondsLeft(AD_SECONDS);
      setUnlockResult(null);
      setError(null);
      setFrozenSeason(currentSeason);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (phase !== 'ad') return;
    if (secondsLeft <= 0) {
      handleAdComplete();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, secondsLeft]);

  const handleAdComplete = async () => {
    setPhase('unlocking');
    setError(null);
    try {
      const result = await onSeasonUnlocked();
      setUnlockResult(result);
      setPhase('celebrate');
    } catch (err: any) {
      setError(err?.message || 'Could not unlock the next season.');
      setPhase('recap');
    }
  };

  const stats = normalizeSeasonStats(seasonStats);
  const grade = gradeSeason(stats);
  const tier = getStreakTier(bestStreak);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti isActive={phase === 'celebrate'} particleCount={100} duration={4500} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-start justify-center pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-[calc(env(safe-area-inset-bottom,0px)+12px)] px-3 bg-black/92 backdrop-blur-md overflow-y-auto"
            data-testid="modal-season-end"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 24, stiffness: 280 }}
              className="relative bg-[#0e0e12] border border-amber-500/25 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_80px_rgba(212,175,55,0.12)] my-auto"
            >
              {/* Close — only visible during recap so player can opt out */}
              {phase === 'recap' && (
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
                  data-testid="button-close-season-end"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {phase === 'recap' && (
                <RecapPhase
                  currentSeason={frozenSeason}
                  stats={stats}
                  grade={grade}
                  tier={tier}
                  bestStreak={bestStreak}
                  cash={cash}
                  error={error}
                  onWatchAd={() => setPhase('ad')}
                  onEndGame={onClose}
                />
              )}

              {phase === 'ad' && <AdPhase secondsLeft={secondsLeft} />}

              {phase === 'unlocking' && (
                <div className="p-12 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                  <p className="text-white/70 text-sm">Opening next season…</p>
                </div>
              )}

              {phase === 'celebrate' && unlockResult && (
                <CelebratePhase
                  bonus={unlockResult.bonus}
                  prevSeason={frozenSeason}
                  nextSeason={unlockResult.nextSeason}
                  onContinue={onClose}
                />
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RecapPhase({
  currentSeason,
  stats,
  grade,
  tier,
  bestStreak,
  cash,
  error,
  onWatchAd,
  onEndGame,
}: {
  currentSeason: number;
  stats: SeasonStats;
  grade: ReturnType<typeof gradeSeason>;
  tier: ReturnType<typeof getStreakTier>;
  bestStreak: number;
  cash: number;
  error: string | null;
  onWatchAd: () => void;
  onEndGame: () => void;
}) {
  const hitRate = stats.dealsClosed > 0 ? Math.round((stats.profitableThisSeason / stats.dealsClosed) * 100) : 0;

  return (
    <div>
      {/* Editorial header — serif headline, no gradient orb, no glow */}
      <div className="px-6 pt-7 pb-5 border-b border-white/5">
        <div className="flex items-center gap-2 text-amber-400/70 text-[10px] uppercase tracking-[0.22em] mb-3">
          <Trophy className="w-3 h-3" />
          <span>Season {currentSeason} · Recap</span>
        </div>
        <h2
          className="text-white text-[28px] leading-[1.1] tracking-tight"
          style={{ fontFamily: 'var(--font-premium)', fontWeight: 400 }}
        >
          {grade.letter === 'I'
            ? 'You watched the year go by.'
            : grade.letter.startsWith('A')
              ? 'You ran a tight ship this year.'
              : grade.letter.startsWith('B')
                ? 'A working year on the tape.'
                : 'The market tested you this year.'}
        </h2>
        <p className="text-white/55 text-sm leading-relaxed mt-2 italic" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {grade.line}
        </p>
      </div>

      {/* Big grade + best deal */}
      <div className="grid grid-cols-[auto_1fr] gap-4 items-center px-6 py-5 border-b border-white/5">
        <div className="text-center">
          <div className={`font-display text-[64px] leading-none ${grade.tone}`} style={{ fontFamily: 'var(--font-premium)' }}>
            {grade.letter}
          </div>
          <div className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Season Grade</div>
        </div>
        <div className="border-l border-white/5 pl-4">
          <div className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Best Deal</div>
          {stats.bestDealProfit > 0 ? (
            <>
              <div className="font-mono text-emerald-300 text-xl font-bold tabular-nums">
                +${Math.round(stats.bestDealProfit).toLocaleString()}
              </div>
              <div className="text-white/50 text-xs mt-0.5">{stats.bestDealLabel || 'Closed deal'}</div>
            </>
          ) : (
            <div className="text-white/40 text-sm italic">No closes this season.</div>
          )}
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-px bg-white/5">
        <StatCell icon={TrendingUp} label="Deals" value={stats.dealsClosed.toString()} tone="text-white/85" />
        <StatCell icon={Target} label="Hit Rate" value={`${hitRate}%`} tone={hitRate >= 60 ? 'text-emerald-300' : 'text-amber-300'} />
        <StatCell icon={DollarSign} label="P&L" value={`${stats.totalCashFlow >= 0 ? '+' : '−'}$${Math.abs(Math.round(stats.totalCashFlow / 1000))}k`} tone={stats.totalCashFlow >= 0 ? 'text-emerald-300' : 'text-red-300'} />
      </div>

      {/* Streak row */}
      {bestStreak > 0 && (
        <div className="px-6 py-3 flex items-center justify-between border-b border-white/5 bg-white/[0.015]">
          <div className="flex items-center gap-2.5">
            <Flame className={`w-4 h-4 ${tier.colorClass}`} />
            <div>
              <div className={`text-sm font-semibold ${tier.colorClass}`}>{tier.title || 'Streak'}</div>
              <div className="text-white/40 text-[11px]">Best streak: {bestStreak} in a row</div>
            </div>
          </div>
          <Award className="w-4 h-4 text-white/20" />
        </div>
      )}

      {/* Cash + CTA */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Cash on hand</span>
          <span className="font-mono font-bold text-white/85 tabular-nums">${Math.round(cash).toLocaleString()}</span>
        </div>

        {error && (
          <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>
        )}

        <Button
          onClick={onWatchAd}
          className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-[15px]"
          data-testid="button-watch-ad-unlock-season"
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Watch sponsor · Open Season {currentSeason + 1}
        </Button>
        <button
          onClick={onEndGame}
          className="w-full h-10 text-white/45 hover:text-white/75 text-[13px] transition-colors"
          data-testid="button-end-game-decline-ad"
        >
          End my game here
        </button>
      </div>
    </div>
  );
}

function StatCell({ icon: Icon, label, value, tone }: { icon: typeof Trophy; label: string; value: string; tone: string }) {
  return (
    <div className="bg-[#0e0e12] px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1 text-white/30 text-[9px] uppercase tracking-widest mb-1">
        <Icon className="w-2.5 h-2.5" />
        <span>{label}</span>
      </div>
      <div className={`font-mono text-base font-bold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function AdPhase({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className="bg-black min-h-[420px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-black/80 border-b border-white/5">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Sponsor Message</span>
        <span className="text-[10px] uppercase tracking-widest text-amber-400/80 tabular-nums">{secondsLeft}s</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-xs bg-[#15151a] border border-amber-500/15 rounded-xl p-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-amber-400/70 text-[10px] uppercase tracking-widest mb-4">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Sponsor placeholder</span>
          </div>
          <p className="text-white/85 text-xl leading-tight mb-2" style={{ fontFamily: 'var(--font-premium)' }}>
            Your sponsor video plays here.
          </p>
          <p className="text-white/45 text-xs leading-relaxed">
            We'll drop in the real player once you connect with GameMonetize, AdinPlay, or Google Ad Manager.
          </p>
        </motion.div>
        <div className="w-full max-w-xs">
          <div className="h-1 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              key={secondsLeft}
              initial={{ width: `${((AD_SECONDS - secondsLeft) / AD_SECONDS) * 100}%` }}
              animate={{ width: `${((AD_SECONDS - secondsLeft + 1) / AD_SECONDS) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              className="h-full bg-amber-400"
            />
          </div>
          <p className="text-white/40 text-[11px] mt-2 text-center">Reward unlocks when the timer ends.</p>
        </div>
      </div>
    </div>
  );
}

// Big season ticker — three reels flip from the old season number to the new.
// Adds a real "year on the calendar" beat instead of a generic confetti pop.
function SeasonTicker({ prevSeason, nextSeason }: { prevSeason: number; nextSeason: number }) {
  const [val, setVal] = useState(prevSeason);
  useEffect(() => {
    const t = setTimeout(() => setVal(nextSeason), 350);
    return () => clearTimeout(t);
  }, [nextSeason]);
  return (
    <div className="flex items-center justify-center gap-3 my-4">
      <span className="font-mono text-white/30 text-[11px] uppercase tracking-widest">Season</span>
      <div className="relative h-[58px] w-[64px] overflow-hidden bg-black/40 rounded-md border border-amber-500/30">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={val}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className="absolute inset-0 flex items-center justify-center font-mono text-[44px] font-black text-amber-300 tabular-nums"
            style={{ textShadow: '0 0 20px rgba(245,158,11,0.4)' }}
          >
            {val}
          </motion.div>
        </AnimatePresence>
      </div>
      <ArrowRight className="w-4 h-4 text-amber-400/60" />
      <span className="font-mono text-amber-400/80 text-[11px] uppercase tracking-widest">Open</span>
    </div>
  );
}

function CelebratePhase({
  bonus,
  prevSeason,
  nextSeason,
  onContinue,
}: {
  bonus: number;
  prevSeason: number;
  nextSeason: number;
  onContinue: () => void;
}) {
  return (
    <div className="text-center px-7 py-8">
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 0.1 }}
        className="w-16 h-16 mx-auto bg-amber-400 rounded-2xl flex items-center justify-center shadow-[0_0_50px_rgba(245,158,11,0.5)] mb-2"
      >
        <Calendar className="w-8 h-8 text-slate-950" />
      </motion.div>

      <SeasonTicker prevSeason={prevSeason} nextSeason={nextSeason} />

      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white text-2xl tracking-tight"
        style={{ fontFamily: 'var(--font-premium)', fontWeight: 400 }}
      >
        Books are open again.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
        className="text-white/55 text-sm mt-1 mb-5 italic"
        style={{ fontFamily: 'Cormorant Garamond, serif' }}
      >
        Fifty-two fresh months on the clock.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.85, type: 'spring' }}
        className="inline-flex items-center gap-2 bg-emerald-500/12 border border-emerald-400/30 rounded-full px-4 py-1.5 mb-6"
      >
        <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
        <span className="text-emerald-200 font-semibold text-sm tabular-nums">
          +${bonus.toLocaleString()} season bonus
        </span>
      </motion.div>

      <Button
        onClick={onContinue}
        className="w-full h-12 bg-white text-slate-950 hover:bg-white/90 font-semibold rounded-xl"
        data-testid="button-continue-new-season"
      >
        Let's run it back
      </Button>
    </div>
  );
}
