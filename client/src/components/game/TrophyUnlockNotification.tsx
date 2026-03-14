import { useState, useEffect, useCallback } from 'react';
import { Trophy, X } from 'lucide-react';
import { trophyTypes } from '@shared/schema';

interface TrophyUnlockNotificationProps {
  trophyId: string;
  onDismiss: () => void;
}

const tierColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  bronze: {
    bg: 'from-amber-900/95 to-amber-800/95',
    border: 'border-amber-500/60',
    text: 'text-amber-300',
    icon: 'text-amber-400',
  },
  silver: {
    bg: 'from-gray-600/95 to-gray-500/95',
    border: 'border-gray-300/60',
    text: 'text-gray-200',
    icon: 'text-gray-300',
  },
  gold: {
    bg: 'from-yellow-600/95 to-amber-500/95',
    border: 'border-yellow-300/60',
    text: 'text-yellow-200',
    icon: 'text-yellow-300',
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
      
      gain.gain.setValueAtTime(0, now + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    });
  } catch {}
}

export function TrophyUnlockNotification({ trophyId, onDismiss }: TrophyUnlockNotificationProps) {
  const trophy = trophyTypes.find(t => t.id === trophyId);
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    if (trophy) {
      playTrophySound(trophy.tier);
    }

    const timer = setTimeout(() => {
      handleDismiss();
    }, 2200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  }, [onDismiss]);

  if (!trophy) return null;

  const colors = tierColors[trophy.tier] || tierColors.bronze;

  return (
    <div
      className={`fixed top-3 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300 pointer-events-auto ${
        isVisible && !isExiting
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-4'
      }`}
      data-testid="trophy-unlock-notification"
    >
      <div
        className={`relative flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${colors.bg} ${colors.border} border backdrop-blur-md shadow-lg max-w-[340px]`}
        onClick={handleDismiss}
      >
        <div className={`w-10 h-10 rounded-full bg-black/20 flex items-center justify-center flex-shrink-0`}>
          <Trophy className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-[10px] uppercase tracking-wider font-bold ${colors.text} leading-none mb-0.5`}>
            {trophy.tier} Achievement
          </div>
          <div className="text-white font-semibold text-sm leading-tight truncate">
            {trophy.name}
          </div>
          <div className="text-white/60 text-xs leading-tight truncate">
            {trophy.description}
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="p-1 rounded-full hover:bg-black/20 transition-colors flex-shrink-0"
          data-testid="button-dismiss-trophy"
        >
          <X className="w-4 h-4 text-white/50" />
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
