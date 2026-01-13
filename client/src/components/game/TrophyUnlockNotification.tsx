import { useState, useEffect, useCallback } from 'react';
import { Trophy, X } from 'lucide-react';
import { trophyTypes } from '@shared/schema';

interface TrophyUnlockNotificationProps {
  trophyId: string;
  onDismiss: () => void;
}

const tierColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: {
    bg: 'bg-gradient-to-br from-amber-900 to-amber-700',
    border: 'border-amber-500',
    text: 'text-amber-300',
    glow: 'shadow-amber-500/50',
  },
  silver: {
    bg: 'bg-gradient-to-br from-gray-500 to-gray-400',
    border: 'border-gray-300',
    text: 'text-gray-100',
    glow: 'shadow-gray-300/50',
  },
  gold: {
    bg: 'bg-gradient-to-br from-yellow-500 to-amber-400',
    border: 'border-yellow-300',
    text: 'text-yellow-100',
    glow: 'shadow-yellow-400/60',
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
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.5);
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
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 400);
  }, [onDismiss]);

  if (!trophy) return null;

  const colors = tierColors[trophy.tier] || tierColors.bronze;

  return (
    <div
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] transition-all duration-500 ${
        isVisible && !isExiting
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-50'
      }`}
      data-testid="trophy-unlock-notification"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm -z-10 fixed" onClick={handleDismiss} />
      
      <div
        className={`relative p-8 rounded-2xl ${colors.bg} ${colors.border} border-2 shadow-2xl ${colors.glow} min-w-[320px] max-w-[400px]`}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          data-testid="button-dismiss-trophy"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div
              className={`w-24 h-24 rounded-full ${colors.bg} border-4 ${colors.border} flex items-center justify-center shadow-lg ${colors.glow} trophy-unlock-bounce`}
            >
              <Trophy className="w-12 h-12 text-white drop-shadow-lg trophy-unlock-shine" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md trophy-unlock-sparkle">
              <span className="text-lg">✨</span>
            </div>
          </div>

          <div className={`text-sm uppercase tracking-wider font-bold mb-1 ${colors.text}`}>
            {trophy.tier} Trophy Unlocked!
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
            {trophy.name}
          </h2>

          <p className="text-white/80 text-sm">
            {trophy.description}
          </p>
        </div>
      </div>
    </div>
  );
}

interface TrophyNotificationManagerProps {
  awardedTrophies: string[];
  onAllDismissed?: () => void;
}

export function TrophyNotificationManager({ awardedTrophies, onAllDismissed }: TrophyNotificationManagerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

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

  if (awardedTrophies.length === 0 || currentIndex >= awardedTrophies.length) {
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
