import { useEffect, useState, useRef } from 'react';

interface ProgressRingProps {
  current: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ProgressRing({
  current,
  total,
  size = 56,
  strokeWidth = 4,
  className = ''
}: ProgressRingProps) {
  const [isComplete, setIsComplete] = useState(false);
  const prevCurrent = useRef(current);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(current / total, 1);
  const strokeDashoffset = circumference - (progress * circumference);

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
        className={`progress-ring ${isComplete ? 'progress-ring-complete' : ''}`}
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="progress-ring-bg"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
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
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">
          {current}<span className="text-gray-400 text-sm">/{total}</span>
        </span>
      </div>
    </div>
  );
}
