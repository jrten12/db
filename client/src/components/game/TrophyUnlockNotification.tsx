import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, X } from 'lucide-react';
import { trophyTypes } from '@shared/schema';

interface TrophyUnlockNotificationProps {
  trophyId: string;
  onDismiss: () => void;
}

const tierConfig: Record<string, {
  bg: string;
  border: string;
  text: string;
  glowColor: string;
  particleColor: string;
  ringColor: string;
  label: string;
}> = {
  bronze: {
    bg: 'bg-gradient-to-br from-amber-950/95 via-amber-900/95 to-amber-950/95',
    border: 'border-amber-600/50',
    text: 'text-amber-400',
    glowColor: 'rgba(217, 119, 6, 0.35)',
    particleColor: '#d97706',
    ringColor: 'border-amber-500/40',
    label: 'Bronze',
  },
  silver: {
    bg: 'bg-gradient-to-br from-slate-800/95 via-slate-700/95 to-slate-800/95',
    border: 'border-slate-400/50',
    text: 'text-slate-300',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    particleColor: '#94a3b8',
    ringColor: 'border-slate-400/40',
    label: 'Silver',
  },
  gold: {
    bg: 'bg-gradient-to-br from-yellow-950/95 via-yellow-800/95 to-amber-900/95',
    border: 'border-yellow-500/60',
    text: 'text-yellow-400',
    glowColor: 'rgba(234, 179, 8, 0.4)',
    particleColor: '#eab308',
    ringColor: 'border-yellow-400/40',
    label: 'Gold',
  },
};

let sharedAudioContext: AudioContext | null = null;

function getOrCreateAudioContext(): AudioContext | null {
  try {
    if (sharedAudioContext && sharedAudioContext.state !== 'closed') {
      return sharedAudioContext;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    sharedAudioContext = new AudioContextClass();
    return sharedAudioContext;
  } catch {
    return null;
  }
}

function playTrophySound(tier: string) {
  try {
    const ctx = getOrCreateAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    const frequencies = tier === 'gold'
      ? [523.25, 659.25, 783.99, 1046.5]
      : tier === 'silver'
      ? [440, 554.37, 659.25]
      : [349.23, 440, 523.25];

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });
  } catch {}
}

function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const distance = 40 + Math.random() * 50;
    return {
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      delay: Math.random() * 0.2,
      size: 3 + Math.random() * 3,
    };
  });
}

export function TrophyUnlockNotification({ trophyId, onDismiss }: TrophyUnlockNotificationProps) {
  const trophy = trophyTypes.find(t => t.id === trophyId);
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit' | 'done'>('enter');

  const particles = useMemo(() => generateParticles(12), []);

  useEffect(() => {
    if (trophy) {
      playTrophySound(trophy.tier);
    }

    const visibleTimer = setTimeout(() => setPhase('visible'), 600);
    const exitTimer = setTimeout(() => setPhase('exit'), 3000);
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onDismiss();
    }, 3300);

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setPhase('exit');
    setTimeout(() => {
      setPhase('done');
      onDismiss();
    }, 280);
  }, [onDismiss]);

  if (!trophy || phase === 'done') return null;

  const config = tierConfig[trophy.tier] || tierConfig.bronze;
  const isExiting = phase === 'exit';

  return (
    <div
      className={`fixed inset-0 z-[9995] flex items-center justify-center pointer-events-auto ${
        isExiting ? 'trophy-overlay-exit' : 'trophy-overlay-enter'
      }`}
      onClick={handleDismiss}
      data-testid="trophy-unlock-notification"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      <div
        className={`relative ${isExiting ? 'trophy-card-exit' : 'trophy-card-enter'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`relative overflow-hidden rounded-2xl ${config.bg} ${config.border} border-2 shadow-2xl px-8 py-6 min-w-[280px] max-w-[340px]`}
        >
          <div className="absolute inset-0 trophy-shimmer pointer-events-none rounded-2xl" />

          <div className="flex flex-col items-center text-center gap-3">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full trophy-glow"
                style={{ boxShadow: `0 0 30px 10px ${config.glowColor}` }}
              />

              <div
                className={`absolute inset-[-8px] rounded-full border-2 ${config.ringColor} trophy-ring`}
              />

              {particles.map((p, i) => (
                <div
                  key={i}
                  className="trophy-particle"
                  style={{
                    '--tx': `${p.tx}px`,
                    '--ty': `${p.ty}px`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: config.particleColor,
                    animationDelay: `${0.2 + p.delay}s`,
                    left: '50%',
                    top: '50%',
                    marginLeft: `-${p.size / 2}px`,
                    marginTop: `-${p.size / 2}px`,
                  } as any}
                />
              ))}

              <div className="trophy-icon-reveal relative z-10">
                <div className={`w-14 h-14 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center`}>
                  <Trophy className={`w-7 h-7 ${config.text}`} />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={`text-[10px] font-bold uppercase tracking-[0.15em] ${config.text} trophy-tier-label`}>
                {config.label} Trophy Unlocked
              </div>
              <div className="text-white font-bold text-lg leading-tight trophy-text-name">
                {trophy.name}
              </div>
              <div className="text-white/55 text-sm leading-snug trophy-text-desc max-w-[260px]">
                {trophy.description}
              </div>
            </div>
          </div>

          <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${config.text.replace('text-', 'bg-')} opacity-60 trophy-progress-bar`} />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-black/60 border border-white/20 flex items-center justify-center hover:bg-black/80 transition-colors"
          data-testid="button-dismiss-trophy"
        >
          <X className="w-3.5 h-3.5 text-white/60" />
        </button>
      </div>
    </div>
  );
}

interface TrophyNotificationManagerProps {
  awardedTrophies: string[];
  onAllDismissed?: () => void;
  paused?: boolean;
}

export function TrophyNotificationManager({ awardedTrophies, onAllDismissed, paused = false }: TrophyNotificationManagerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [prevLength, setPrevLength] = useState(0);

  useEffect(() => {
    if (awardedTrophies.length === 0 && prevLength > 0) {
      setCurrentIndex(0);
      setDismissed(new Set());
    }
    setPrevLength(awardedTrophies.length);
  }, [awardedTrophies.length, prevLength]);

  const handleDismiss = useCallback(() => {
    if (currentIndex < awardedTrophies.length) {
      setDismissed(prev => new Set(prev).add(awardedTrophies[currentIndex]));
      if (currentIndex + 1 >= awardedTrophies.length) {
        onAllDismissed?.();
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    }
  }, [currentIndex, awardedTrophies, onAllDismissed]);

  if (paused || awardedTrophies.length === 0 || currentIndex >= awardedTrophies.length) {
    return null;
  }

  const currentTrophyId = awardedTrophies[currentIndex];
  if (dismissed.has(currentTrophyId)) {
    return null;
  }

  return <TrophyUnlockNotification trophyId={currentTrophyId} onDismiss={handleDismiss} />;
}

export function useTrophyNotifications() {
  const [pendingTrophies, setPendingTrophies] = useState<string[]>([]);

  const addTrophies = useCallback((trophyIds: string[]) => {
    if (trophyIds.length > 0) {
      setPendingTrophies(prev => [...prev, ...trophyIds]);
    }
  }, []);

  const clearTrophies = useCallback(() => {
    setPendingTrophies([]);
  }, []);

  return {
    pendingTrophies,
    addTrophies,
    clearTrophies,
  };
}
