import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpCircle, ArrowDownCircle, Info, X } from 'lucide-react';
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
  position: number;
}> = {
  terrible: {
    label: 'Terrible Market',
    shortLabel: 'Terrible',
    color: 'text-red-400',
    bgColor: 'bg-[hsl(0_35%_14%)]',
    borderColor: 'border-red-800/50',
    icon: TrendingDown,
    position: 0,
  },
  poor: {
    label: 'Poor Market',
    shortLabel: 'Poor',
    color: 'text-orange-300',
    bgColor: 'bg-[hsl(24_30%_14%)]',
    borderColor: 'border-orange-800/45',
    icon: TrendingDown,
    position: 1,
  },
  neutral: {
    label: 'Neutral Market',
    shortLabel: 'Neutral',
    color: 'text-[hsl(43_55%_68%)]',
    bgColor: 'bg-[hsl(32_22%_14%)]',
    borderColor: 'border-[rgba(180,140,70,0.35)]',
    icon: Minus,
    position: 2,
  },
  good: {
    label: 'Good Market',
    shortLabel: 'Good',
    color: 'text-emerald-400',
    bgColor: 'bg-[hsl(145_25%_12%)]',
    borderColor: 'border-emerald-800/45',
    icon: TrendingUp,
    position: 3,
  },
  excellent: {
    label: 'Excellent Market',
    shortLabel: 'Excellent',
    color: 'text-[hsl(43_72%_62%)]',
    bgColor: 'bg-[hsl(38_28%_12%)]',
    borderColor: 'border-[rgba(212,175,55,0.4)]',
    icon: ArrowUpCircle,
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
    sm: 'h-8 px-2.5 text-sm gap-1.5',
    md: 'h-10 px-3.5 text-base gap-2',
    lg: 'h-12 px-4 text-lg gap-2.5',
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div 
      className={`
        inline-flex items-center rounded-md
        ${config.bgColor} ${config.borderColor} border
        ${sizeClasses[size]}
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
  const [showInfo, setShowInfo] = useState(false);
  const config = MARKET_CONFIG[condition] || MARKET_CONFIG.neutral;
  const Icon = config.icon;
  
  const segments = ['terrible', 'poor', 'neutral', 'good', 'excellent'] as const;
  const segmentColors = [
    'bg-red-500',
    'bg-orange-500', 
    'bg-[hsl(43_55%_50%)]',
    'bg-emerald-500',
    'bg-[hsl(43_72%_55%)]',
  ];
  
  return (
    <>
      <div 
        className={`
          flex items-center gap-2.5 rounded-xl desk-panel
          ${config.borderColor} border-2
          ${compact ? 'px-2.5 py-2' : 'px-3.5 py-2.5'}
          ${className}
        `}
        data-testid="market-bar"
      >
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Market</span>
          <button
            onClick={() => setShowInfo(true)}
            className="p-0.5 rounded-full hover:bg-white/10 transition-colors touch-target-sm"
            data-testid="button-market-info"
            aria-label="Learn about market conditions"
          >
            <Info className="w-3 h-3 text-[hsl(35_15%_55%)] hover:text-[hsl(43_60%_70%)]" />
          </button>
        </div>
        
        <div className="h-4 w-px bg-[rgba(180,140,70,0.25)] flex-shrink-0" />
        
        <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${config.color} flex-shrink-0`} />
        
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className={`text-sm font-bold ${config.color} truncate`}>
            {config.shortLabel}
          </span>
          
          <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden bg-black/30">
            {segments.map((seg, idx) => (
              <div
                key={seg}
                className={`
                  flex-1 transition-all duration-500
                  ${idx <= config.position ? segmentColors[idx] : 'bg-white/10'}
                  ${idx === config.position ? 'ring-1 ring-white/40' : ''}
                `}
              />
            ))}
          </div>
        </div>
      </div>

      {showInfo && (
        <div 
          className="fixed z-[9999] bg-black/80"
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="bg-[hsl(220,14%,10%)] border border-white/8 rounded-xl p-3"
            style={{ 
              position: 'fixed',
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              width: '88%',
              maxWidth: '300px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-display font-semibold text-[hsl(43_60%_72%)]">Living Market</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="w-6 h-6 flex items-center justify-center bg-white/8 hover:bg-white/12 rounded-full flex-shrink-0"
                data-testid="button-close-market-info"
                data-sound="close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            
            <p className="text-[11px] text-[hsl(35_15%_70%)] mb-3 leading-relaxed">
              List prices, rents, ARV, vacancy, and exits all drift with market weather — gently, not chaotically. Conditions shift about once a month.
            </p>
            
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(43_72%_55%)]" />
                <span className="text-[hsl(43_60%_70%)] font-medium">Excellent</span>
                <span className="text-[hsl(30_12%_55%)]">Strong exits & rents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-emerald-400 font-medium">Good</span>
                <span className="text-[hsl(30_12%_55%)]">Favorable conditions</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(43_55%_50%)]" />
                <span className="text-[hsl(43_55%_68%)] font-medium">Neutral</span>
                <span className="text-[hsl(30_12%_55%)]">Balanced</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-orange-300 font-medium">Poor</span>
                <span className="text-[hsl(30_12%_55%)]">Softer demand</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-400 font-medium">Terrible</span>
                <span className="text-[hsl(30_12%_55%)]">Higher vacancy, weaker sales</span>
              </div>
            </div>
            
            <p className="text-[hsl(30_12%_50%)] text-[10px] mt-3 pt-2 border-t border-[rgba(180,140,70,0.2)]">
              Time flips for better weather — rentals still earn while you wait.
            </p>
          </div>
        </div>
      )}
    </>
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
        flex items-center gap-2 rounded-lg desk-surface
        ${config.borderColor} border
        px-4 py-3
        animate-in fade-in slide-in-from-top-2 duration-300
      `}
      data-testid="market-change-notification"
    >
      {improved ? (
        <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
      ) : declined ? (
        <ArrowDownCircle className="w-6 h-6 text-red-400" />
      ) : (
        <config.icon className={`w-6 h-6 ${config.color}`} />
      )}
      
      <div className="flex flex-col">
        <span className="text-sm font-display font-semibold text-[hsl(38_30%_90%)]">
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
