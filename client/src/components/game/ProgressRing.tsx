import { useEffect, useState, useRef } from 'react';

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Hide center label — useful when parent shows the count separately */
  hideLabel?: boolean;
  /** Smaller center typography for mobile HUD chips */
  compact?: boolean;
}

export function ProgressRing({
  current,
  total,
  size = 56,
  strokeWidth = 4,
  className = '',
  hideLabel = false,
  compact = false,
}: ProgressRingProps) {
  const [isComplete, setIsComplete] = useState(false);
  const prevCurrent = useRef(current);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const safeTotal = Math.max(total, 1);
  const progress = Math.min(current / safeTotal, 1);
  const strokeDashoffset = circumference - progress * circumference;
  const done = current >= total && total > 0;

  useEffect(() => {
    if (current > prevCurrent.current && current === total) {
      setIsComplete(true);
      const timeout = setTimeout(() => setIsComplete(false), 800);
      return () => clearTimeout(timeout);
    }
    prevCurrent.current = current;
  }, [current, total]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        className={`progress-ring ${isComplete ? 'progress-ring-complete' : ''} ${done ? 'progress-ring-done' : ''}`}
        width={size}
        height={size}
        aria-hidden={hideLabel}
        role={hideLabel ? undefined : 'img'}
        aria-label={hideLabel ? undefined : `${current} of ${total} deals`}
      >
        <circle
          className="progress-ring-bg"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="progress-ring-fill"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset,
          }}
        />
      </svg>
      {!hideLabel ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-white tabular-nums leading-none ${compact ? 'text-[11px]' : 'text-lg'}`}>
            {current}
            <span className={`text-white/35 ${compact ? 'text-[9px]' : 'text-sm'}`}>/{total}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
