import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Sparkles, TrendingUp, X, Trophy, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from './Confetti';

interface SeasonEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeasonUnlocked: (bonus: number, newSeasonNumber: number) => Promise<void> | void;
  currentSeason: number;
  profitableDeals: number;
  cash: number;
}

type Phase = 'recap' | 'ad' | 'unlocking' | 'celebrate';

const AD_SECONDS = 15;

// Headline pool keeps the moment from feeling AI-generic; rotates per season.
const SEASON_HEADLINES = [
  'Season Wrapped.',
  'Another Year on the Tape.',
  'Books Closed.',
  'Year-End Recap.',
  'Final Bell.',
];

export function SeasonEndModal({
  isOpen,
  onClose,
  onSeasonUnlocked,
  currentSeason,
  profitableDeals,
  cash,
}: SeasonEndModalProps) {
  const [phase, setPhase] = useState<Phase>('recap');
  const [secondsLeft, setSecondsLeft] = useState(AD_SECONDS);
  const [unlockResult, setUnlockResult] = useState<{ bonus: number; nextSeason: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setPhase('recap');
      setSecondsLeft(AD_SECONDS);
      setUnlockResult(null);
      setError(null);
    }
  }, [isOpen]);

  // Ad countdown
  useEffect(() => {
    if (phase !== 'ad') return;
    if (secondsLeft <= 0) {
      handleAdComplete();
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  const handleAdComplete = async () => {
    setPhase('unlocking');
    setError(null);
    try {
      // Caller is responsible for hitting the unlock endpoint and getting the bonus.
      // We just pass the trigger; the parent persists state + closes us on success.
      // To keep the modal in charge of the celebration, the parent passes us back the bonus value via callback.
      const nextSeason = currentSeason + 1;
      await onSeasonUnlocked(5000, nextSeason);
      setUnlockResult({ bonus: 5000, nextSeason });
      setPhase('celebrate');
    } catch (err: any) {
      setError(err?.message || 'Could not unlock the next season.');
      setPhase('recap');
    }
  };

  const headline = SEASON_HEADLINES[(currentSeason - 1) % SEASON_HEADLINES.length];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <Confetti isActive={phase === 'celebrate'} particleCount={80} duration={4000} />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-start justify-center pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-[calc(env(safe-area-inset-bottom,0px)+12px)] px-3 bg-black/90 backdrop-blur-md overflow-y-auto"
            data-testid="modal-season-end"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.15)] my-auto"
            >
              {/* Recap phase — show wins + bring the "press play" moment */}
              {phase === 'recap' && (
                <RecapPhase
                  headline={headline}
                  currentSeason={currentSeason}
                  profitableDeals={profitableDeals}
                  cash={cash}
                  error={error}
                  onWatchAd={() => setPhase('ad')}
                  onEndGame={onClose}
                />
              )}

              {/* Ad phase — placeholder sponsor screen (drops in real SDK later) */}
              {phase === 'ad' && (
                <AdPhase secondsLeft={secondsLeft} />
              )}

              {/* Unlocking phase — brief spinner */}
              {phase === 'unlocking' && (
                <div className="p-12 flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                  <p className="text-white/70 text-sm">Unlocking next season…</p>
                </div>
              )}

              {/* Celebrate phase — dopamine hit */}
              {phase === 'celebrate' && unlockResult && (
                <CelebratePhase
                  bonus={unlockResult.bonus}
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
  headline,
  currentSeason,
  profitableDeals,
  cash,
  error,
  onWatchAd,
  onEndGame,
}: {
  headline: string;
  currentSeason: number;
  profitableDeals: number;
  cash: number;
  error: string | null;
  onWatchAd: () => void;
  onEndGame: () => void;
}) {
  return (
    <div className="text-center">
      <div className="bg-gradient-to-br from-amber-600/30 via-amber-500/15 to-transparent p-6 pt-7 relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
        <div className="flex items-center justify-center gap-2 text-amber-400/80 text-[11px] uppercase tracking-[0.18em] mb-3">
          <Trophy className="w-3.5 h-3.5" />
          <span>Season {currentSeason} · 52 Months Complete</span>
        </div>
        <h2 className="font-display text-3xl md:text-4xl text-white tracking-tight mb-2">{headline}</h2>
        <p className="text-white/55 text-sm leading-relaxed max-w-xs mx-auto">
          You ran a full year of deals. Want to keep building, or call it and lock in your results?
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 p-4 border-y border-white/5">
        <StatBlock label="Profitable Deals" value={profitableDeals.toString()} icon={TrendingUp} accent="emerald" />
        <StatBlock label="Cash on Hand" value={`$${Math.round(cash).toLocaleString()}`} icon={DollarSign} accent="amber" />
      </div>

      {/* CTAs */}
      <div className="p-5 space-y-3">
        <div className="bg-amber-500/8 border border-amber-500/25 rounded-xl px-4 py-3 text-left">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-[13px] leading-snug">
              <p className="text-amber-200 font-medium">Unlock Season {currentSeason + 1}</p>
              <p className="text-white/55 text-xs mt-0.5">
                Watch a 15-second sponsor message to add another 52 months — plus a <span className="text-amber-300 font-semibold">$5,000 season bonus</span>.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-red-300 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-left">
            {error}
          </div>
        )}

        <Button
          onClick={onWatchAd}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-xl text-base"
          data-testid="button-watch-ad-unlock-season"
        >
          <Play className="w-4 h-4 mr-2 fill-current" />
          Watch Sponsor → Unlock Season {currentSeason + 1}
        </Button>
        <button
          onClick={onEndGame}
          className="w-full h-11 text-white/55 hover:text-white/80 text-sm transition-colors"
          data-testid="button-end-game-decline-ad"
        >
          No thanks — end my game
        </button>
      </div>
    </div>
  );
}

function AdPhase({ secondsLeft }: { secondsLeft: number }) {
  return (
    <div className="bg-black text-center min-h-[380px] flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 bg-black/80 border-b border-white/5">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Sponsor Message</span>
        <span className="text-[10px] uppercase tracking-widest text-amber-400/80 tabular-nums">
          {secondsLeft}s
        </span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 bg-gradient-to-br from-slate-800 via-slate-900 to-black">
        {/* Placeholder sponsor card — swap for real ad SDK iframe/player */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-xs bg-gradient-to-br from-amber-500/15 to-slate-900 border border-amber-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 text-amber-400/70 text-[10px] uppercase tracking-widest mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Live · Placeholder</span>
          </div>
          <p className="text-white/85 font-display text-xl leading-tight mb-2">
            Your sponsor message will play here.
          </p>
          <p className="text-white/45 text-xs leading-relaxed">
            This is a 15-second slot. Once you sign up with a publisher (GameMonetize, AdinPlay, or Google Ad Manager), this becomes their rewarded video player.
          </p>
        </motion.div>

        <div className="w-full max-w-xs">
          <div className="h-1 bg-white/8 rounded-full overflow-hidden">
            <motion.div
              key={secondsLeft}
              initial={{ width: `${((AD_SECONDS - secondsLeft) / AD_SECONDS) * 100}%` }}
              animate={{ width: `${((AD_SECONDS - secondsLeft + 1) / AD_SECONDS) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
            />
          </div>
          <p className="text-white/40 text-[11px] mt-2">
            Reward unlocks automatically when the timer ends.
          </p>
        </div>
      </div>
    </div>
  );
}

function CelebratePhase({
  bonus,
  nextSeason,
  onContinue,
}: {
  bonus: number;
  nextSeason: number;
  onContinue: () => void;
}) {
  return (
    <div className="text-center p-8 bg-gradient-to-br from-emerald-600/20 via-amber-500/10 to-transparent">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 0.1 }}
        className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.5)] mb-5"
      >
        <Calendar className="w-10 h-10 text-slate-950" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="font-display text-3xl text-white mb-1"
      >
        Season {nextSeason} is open.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-white/60 text-sm mb-5"
      >
        52 fresh months on the clock.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 rounded-full px-4 py-2 mb-6"
      >
        <DollarSign className="w-4 h-4 text-emerald-300" />
        <span className="text-emerald-200 font-semibold tabular-nums">
          +${bonus.toLocaleString()} season bonus
        </span>
      </motion.div>

      <Button
        onClick={onContinue}
        className="w-full h-12 bg-white text-slate-950 hover:bg-white/90 font-semibold rounded-xl"
        data-testid="button-continue-new-season"
      >
        Let's Run It Back
      </Button>
    </div>
  );
}

function StatBlock({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof Trophy;
  accent: 'emerald' | 'amber';
}) {
  const accentClass = accent === 'emerald' ? 'text-emerald-300' : 'text-amber-300';
  const bgClass = accent === 'emerald' ? 'bg-emerald-500/10' : 'bg-amber-500/10';
  return (
    <div className={`rounded-xl ${bgClass} px-3 py-3 text-left`}>
      <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-widest mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className={`font-mono text-lg font-bold ${accentClass} tabular-nums`}>{value}</div>
    </div>
  );
}
