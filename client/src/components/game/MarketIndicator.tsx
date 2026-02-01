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
  const [showInfo, setShowInfo] = useState(false);
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
    <>
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
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">Market</span>
          <button
            onClick={() => setShowInfo(true)}
            className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
            data-testid="button-market-info"
            aria-label="Learn about market conditions"
          >
            <Info className="w-3 h-3 text-white/50 hover:text-white/80" />
          </button>
        </div>
        
        <div className="h-4 w-px bg-white/20 flex-shrink-0" />
        
        <Icon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} ${config.color} flex-shrink-0`} />
        
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <span className={`text-xs font-semibold ${config.color} truncate`}>
            {config.shortLabel}
          </span>
          
          <div className="flex gap-0.5 h-1 rounded-full overflow-hidden bg-black/30">
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

      {showInfo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-white">Market Conditions</h3>
              <button
                onClick={() => setShowInfo(false)}
                className="p-1 rounded-full hover:bg-white/10 transition-colors"
                data-testid="button-close-market-info"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            <div className="space-y-3 text-sm text-slate-300">
              <p>
                The real estate market fluctuates monthly, affecting how much you can sell flip properties for.
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span><strong className="text-cyan-300">Excellent</strong> - Best prices, up to +15%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span><strong className="text-emerald-400">Good</strong> - Favorable prices, up to +10%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span><strong className="text-yellow-400">Neutral</strong> - Fair market value</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span><strong className="text-orange-400">Poor</strong> - Lower prices, up to -10%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span><strong className="text-red-400">Terrible</strong> - Worst prices, up to -15%</span>
                </div>
              </div>
              
              <p className="text-slate-400 text-xs mt-3">
                Tip: Time your flip sales for good or excellent markets to maximize profits!
              </p>
            </div>
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
