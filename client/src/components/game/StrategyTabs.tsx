import { Check } from 'lucide-react';

interface StrategyTabsProps {
  strategy: 'rent' | 'flip';
  onStrategyChange: (strategy: 'rent' | 'flip') => void;
}

export function StrategyTabs({ strategy, onStrategyChange }: StrategyTabsProps) {
  return (
    <div className="flex gap-0" data-testid="strategy-tabs">
      <button
        onClick={() => onStrategyChange('rent')}
        className={`flex items-center gap-2 px-4 py-2 rounded-l font-semibold text-sm transition-all ${
          strategy === 'rent' ? 'tab-active' : 'tab-inactive'
        }`}
        data-testid="tab-rent"
      >
        {strategy === 'rent' && <Check className="w-4 h-4" />}
        Rent
      </button>
      <button
        onClick={() => onStrategyChange('flip')}
        className={`flex items-center gap-2 px-4 py-2 rounded-r font-semibold text-sm transition-all ${
          strategy === 'flip' ? 'tab-active' : 'tab-inactive'
        }`}
        data-testid="tab-flip"
      >
        {strategy === 'flip' && <Check className="w-4 h-4" />}
        Flip
      </button>
    </div>
  );
}