import { TrendingUp, TrendingDown, Minus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import type { MarketCondition } from '@shared/schema';

interface MarketIndicatorProps {
  condition: MarketCondition;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MARKET_CONFIG: Record<MarketCondition, {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: typeof TrendingUp;
  glowColor: string;
  position: number; // 0-4 for the gradient bar
}> = {
  terrible: {
    label: 'Terrible Market',
    shortLabel: 'Terrible',
    color: 'text-red-400',
    bgColor: 'bg-red-950/60',
    borderColor: 'border-red-700/50',
    icon: TrendingDown,
    glowColor: 'shadow-red-500/30',
    position: 0,
  },
  poor: {
    label: 'Poor Market',
    shortLabel: 'Poor',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950/60',
    borderColor: 'border-orange-700/50',
    icon: TrendingDown,
    glowColor: 'shadow-orange-500/30',
    position: 1,
  },
  neutral: {
    label: 'Neutral Market',
    shortLabel: 'Neutral',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950/60',
    borderColor: 'border-yellow-700/50',
    icon: Minus,
    glowColor: 'shadow-yellow-500/30',
    position: 2,
  },
  good: {
    label: 'Good Market',
    shortLabel: 'Good',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-950/60',
    borderColor: 'border-emerald-700/50',
    icon: TrendingUp,
    glowColor: 'shadow-emerald-500/30',
    position: 3,
  },
  excellent: {
    label: 'Excellent Market',
    shortLabel: 'Excellent',
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-950/60',
    borderColor: 'border-cyan-700/50',
    icon: ArrowUpCircle,
    glowColor: 'shadow-cyan-500/40',
    position: 4,
  },
};

export function MarketIndicator({ 
  condition, 
  showLabel = true, 
  size = 'md',
  className = '' 
}: MarketIndicatorProps) {
  const config = MARKET_CONFIG[condition] || MARKET_CONFIG.neutral;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'h-6 px-2 text-xs gap-1',
    md: 'h-8 px-3 text-sm gap-1.5',
    lg: 'h-10 px-4 text-base gap-2',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div 
      className={`
        inline-flex items-center rounded-full
        ${config.bgColor} ${config.borderColor} border
        ${sizeClasses[size]}
        shadow-lg ${config.glowColor}
        backdrop-blur-sm
        transition-all duration-300
        ${className}
      `}
      data-testid="market-indicator"
    >
      <Icon className={`${iconSizes[size]} ${config.color}`} />
      {showLabel && (
        <span className={`font-semibold ${config.color} whitespace-nowrap`}>
          {size === 'sm' ? config.shortLabel : config.label}
        </span>
      )}
    </div>
  );
}

interface MarketBarProps {
  condition: MarketCondition;
  className?: string;
  compact?: boolean;
}

export function MarketBar({ condition, className = '', compact = false }: MarketBarProps) {
  const config = MARKET_CONFIG[condition] || MARKET_CONFIG.neutral;
  const Icon = config.icon;
  
  const segments = ['terrible', 'poor', 'neutral', 'good', 'excellent'] as const;
  const segmentColors = [
    'bg-red-500',
    'bg-orange-500', 
    'bg-yellow-500',
    'bg-emerald-500',
    'bg-cyan-400',
  ];
  
  return (
    <div 
      className={`
        flex items-center gap-2 rounded-lg
        ${config.bgColor} ${config.borderColor} border
        ${compact ? 'px-2 py-1.5' : 'px-3 py-2'}
        shadow-lg ${config.glowColor}
        backdrop-blur-sm
        ${className}
      `}
      data-testid="market-bar"
    >
      <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${config.color} flex-shrink-0`} />
      
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold ${config.color} truncate`}>
            {compact ? config.shortLabel : config.label}
          </span>
          {!compact && (
            <span className="text-xs text-muted-foreground/70">
              Changes Monthly
            </span>
          )}
        </div>
        
        <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-black/30">
          {segments.map((seg, idx) => (
            <div
              key={seg}
              className={`
                flex-1 transition-all duration-500
                ${idx <= config.position ? segmentColors[idx] : 'bg-white/10'}
                ${idx === config.position ? 'ring-1 ring-white/50' : ''}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function MarketChangeNotification({ 
  condition, 
  previousCondition 
}: { 
  condition: MarketCondition; 
  previousCondition?: MarketCondition;
}) {
  const config = MARKET_CONFIG[condition] || MARKET_CONFIG.neutral;
  const prevConfig = previousCondition ? MARKET_CONFIG[previousCondition] : null;
  
  const improved = prevConfig && config.position > prevConfig.position;
  const declined = prevConfig && config.position < prevConfig.position;
  
  return (
    <div 
      className={`
        flex items-center gap-2 rounded-lg
        ${config.bgColor} ${config.borderColor} border
        px-4 py-3
        shadow-xl ${config.glowColor}
        backdrop-blur-md
        animate-in fade-in slide-in-from-top-2 duration-300
      `}
      data-testid="market-change-notification"
    >
      {improved ? (
        <ArrowUpCircle className={`w-6 h-6 text-emerald-400`} />
      ) : declined ? (
        <ArrowDownCircle className={`w-6 h-6 text-red-400`} />
      ) : (
        <config.icon className={`w-6 h-6 ${config.color}`} />
      )}
      
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">
          Market Update
        </span>
        <span className={`text-sm ${config.color}`}>
          {improved ? 'Market improved to ' : declined ? 'Market declined to ' : ''}
          {config.label}
        </span>
      </div>
    </div>
  );
}
