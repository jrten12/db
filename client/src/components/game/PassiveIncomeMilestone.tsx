import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DollarSign, TrendingUp, Zap } from 'lucide-react';
import { getMilestoneConfig, getRandomMilestoneMessage } from '@shared/passiveIncomeMilestones';

interface PassiveIncomeMilestoneProps {
  threshold: number;
  onDismiss: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function playMilestoneChord(intensity: number) {
  const AudioCtx = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
  if (!AudioCtx) return;

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioCtx();
    const baseFreqs = [261.6, 329.6, 392.0];
    if (intensity >= 3) baseFreqs.push(523.3);
    if (intensity >= 5) baseFreqs.push(659.3);
    if (intensity >= 7) baseFreqs.push(784.0);

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.12, now);
    masterGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
    masterGain.connect(ctx.destination);

    baseFreqs.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = intensity >= 5 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * (intensity >= 4 ? 2 : 1), now);
      gain.gain.setValueAtTime(0.08, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + i * 0.08);
      osc.stop(now + 2.5);
    });

    const ctxRef = ctx;
    setTimeout(() => ctxRef.close(), 3000);
  } catch (e) {
    console.warn('Milestone audio failed:', e);
    if (ctx) ctx.close();
  }
}

function StreamParticles({ color, count }: { color: string; count: number }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: 15 + Math.random() * 70,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1.5,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="milestone-stream-particle"
          style={{
            left: `${p.left}%`,
            bottom: '10%',
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

function CounterAnimation({ target, color, duration = 1200 }: { target: number; color: string; duration?: number }) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    const delay = setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, 500);
    return () => {
      clearTimeout(delay);
      cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return (
    <span
      className="milestone-counter-glow font-mono tabular-nums"
      style={{ '--milestone-color': color } as React.CSSProperties}
      data-testid="milestone-counter"
    >
      {formatCurrency(current)}
    </span>
  );
}

export function PassiveIncomeMilestone({ threshold, onDismiss }: PassiveIncomeMilestoneProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');
  const [message] = useState(() => getRandomMilestoneMessage(threshold));
  const config = getMilestoneConfig(threshold);
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!config) return;
    playMilestoneChord(config.intensity);
    const enterTimer = setTimeout(() => setPhase('visible'), 2000);
    dismissTimer.current = setTimeout(() => {
      setPhase('exit');
      setTimeout(onDismiss, 350);
    }, 6000);
    return () => {
      clearTimeout(enterTimer);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [config, onDismiss]);

  const handleDismiss = useCallback(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    setPhase('exit');
    setTimeout(onDismiss, 350);
  }, [onDismiss]);

  if (!config) return null;

  const isPrismatic = threshold === 5000;
  const particleCount = 8 + config.intensity * 4;

  return (
    <div
      className={`fixed inset-0 z-[9996] flex items-center justify-center ${
        phase === 'exit' ? 'milestone-overlay-exit' : 'milestone-overlay-enter'
      }`}
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={phase === 'visible' ? handleDismiss : undefined}
      data-testid="milestone-overlay"
    >
      <StreamParticles color={config.particleColor} count={particleCount} />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="milestone-ambient rounded-full"
          style={{
            width: 300 + config.intensity * 40,
            height: 300 + config.intensity * 40,
            background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          }}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="milestone-ring-1 rounded-full border"
          style={{
            width: 200,
            height: 200,
            borderColor: config.color,
          }}
        />
        <div
          className="milestone-ring-2 rounded-full border absolute"
          style={{
            width: 160,
            height: 160,
            borderColor: config.color,
          }}
        />
      </div>

      <div
        className={`relative max-w-sm w-full mx-4 ${
          phase === 'exit' ? 'milestone-card-exit' : 'milestone-card-enter'
        }`}
      >
        <div
          className="rounded-2xl border border-white/[0.08] overflow-hidden"
          style={{ background: config.bgGradient }}
        >
          <div className="milestone-shimmer absolute inset-0 rounded-2xl pointer-events-none" />

          <div className="relative px-6 py-8 flex flex-col items-center text-center space-y-5">
            <div className="milestone-label flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" style={{ color: config.color }} />
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.15em] font-sans"
                style={{ color: config.color }}
              >
                Passive Income Milestone
              </span>
              <Zap className="w-3.5 h-3.5" style={{ color: config.color }} />
            </div>

            <div className={`milestone-amount ${isPrismatic ? 'milestone-prismatic' : ''}`}>
              <div className="text-4xl sm:text-5xl font-serif font-bold text-white">
                <CounterAnimation target={threshold} color={config.glowColor} />
                <span className="text-lg sm:text-xl font-sans font-normal text-white/50 ml-1">/mo</span>
              </div>
            </div>

            <div className="milestone-yearly">
              <div className="flex items-center gap-1.5 text-xs font-sans text-white/40">
                <TrendingUp className="w-3 h-3" />
                <span>{config.yearlyEquivalent} annualized</span>
              </div>
            </div>

            <div className="milestone-message max-w-[280px]">
              <p className="text-sm font-sans text-white/70 leading-relaxed italic">
                "{message}"
              </p>
            </div>

            <div className="w-full pt-2">
              <div className="h-[2px] rounded-full overflow-hidden" style={{ backgroundColor: `${config.color}15` }}>
                <div
                  className="milestone-progress-bar h-full rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              </div>
            </div>

            <button
              className={`text-[10px] font-sans transition-colors ${
                phase === 'visible' ? 'text-white/30 hover:text-white/50' : 'text-transparent pointer-events-none'
              }`}
              onClick={handleDismiss}
              data-testid="milestone-dismiss"
            >
              tap to continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
