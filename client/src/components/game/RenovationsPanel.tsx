import { useState, useMemo } from 'react';
import { Hammer, Check, ChevronDown, ChevronUp, TrendingUp, Clock, DollarSign, Home } from 'lucide-react';
import { PROPERTY_UPGRADES, type PropertyUpgrade } from '@shared/propertyIssues';
import { FINISH_LEVEL_CONFIG } from '@/lib/gameData';

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  kitchen: { label: 'Kitchen', icon: '🍳' },
  bathroom: { label: 'Bathroom', icon: '🚿' },
  interior: { label: 'Interior', icon: '🏠' },
  systems: { label: 'Systems', icon: '⚡' },
  curb: { label: 'Curb Appeal', icon: '🌿' },
};

interface RenovationsPanelProps {
  selectedRenovationIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  finishLevel: 'builder' | 'luxury';
  strategy?: 'rent' | 'flip';
  baseMonthlyRent?: number;
  disabled?: boolean;
  conditionTag?: string;
}

export function RenovationsPanel({
  selectedRenovationIds,
  onSelectionChange,
  finishLevel,
  strategy,
  baseMonthlyRent,
  disabled = false,
  conditionTag = 'Fair',
}: RenovationsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const finishConfig = FINISH_LEVEL_CONFIG[finishLevel || 'builder'];

  const availableUpgrades = useMemo(() => {
    return PROPERTY_UPGRADES.filter(u => u.availableConditions.includes(conditionTag));
  }, [conditionTag]);

  const getUpgradeCost = (upgrade: PropertyUpgrade): number => {
    const baseCost = Math.round((upgrade.costMin + upgrade.costMax) / 2);
    return Math.round(baseCost * finishConfig.costMultiplier);
  };

  const totals = useMemo(() => {
    const selected = availableUpgrades.filter(u => selectedRenovationIds.includes(u.id));
    return {
      cost: selected.reduce((sum, u) => sum + getUpgradeCost(u), 0),
      weeks: selected.reduce((sum, u) => sum + u.timelineWeeks, 0),
      rentBoost: selected.reduce((sum, u) => sum + u.rentImpactPct, 0),
      arvBoost: selected.reduce((sum, u) => sum + u.saleImpactPct, 0),
      count: selected.length,
    };
  }, [availableUpgrades, selectedRenovationIds, finishLevel]);

  const toggleUpgrade = (upgradeId: string) => {
    if (disabled) return;
    if (selectedRenovationIds.includes(upgradeId)) {
      onSelectionChange(selectedRenovationIds.filter(id => id !== upgradeId));
    } else {
      onSelectionChange([...selectedRenovationIds, upgradeId]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onSelectionChange(availableUpgrades.map(u => u.id));
  };

  const selectNone = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  if (availableUpgrades.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/60 border border-violet-500/20 rounded-xl overflow-hidden" data-testid="panel-renovations">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        data-testid="button-toggle-renovations"
        data-no-click-sound
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Hammer className="w-5 h-5 text-violet-400" />
          </div>
          <div className="text-left">
            <h3 className="text-cyan-100 font-semibold">
              Renovations ({availableUpgrades.length} available)
            </h3>
            <p className="text-slate-400 text-sm">
              {totals.count === 0
                ? 'Add value with strategic upgrades'
                : `${totals.count} selected — $${totals.cost.toLocaleString()}`}
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-slate-700/50 p-4 space-y-3">
          <div className="bg-violet-900/20 border border-violet-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-2">
              <Home className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="text-violet-300 font-medium">Strategic Upgrades</span>
                <p className="text-violet-200/70 mt-1">
                  Renovations add value beyond repairs. They boost rent and sale price but cost money and time.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Select renovations:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                disabled={disabled}
                className="text-xs text-violet-400 hover:text-violet-300 disabled:opacity-50"
                data-testid="button-select-all-renovations"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={selectNone}
                disabled={disabled}
                className="text-xs text-slate-400 hover:text-slate-300 disabled:opacity-50"
                data-testid="button-select-none-renovations"
              >
                None
              </button>
            </div>
          </div>

          {availableUpgrades.map((upgrade) => {
            const isSelected = selectedRenovationIds.includes(upgrade.id);
            const cost = getUpgradeCost(upgrade);
            const categoryInfo = CATEGORY_LABELS[upgrade.category] || { label: upgrade.category, icon: '🔧' };

            return (
              <button
                key={upgrade.id}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleUpgrade(upgrade.id);
                }}
                disabled={disabled}
                className={`w-full text-left p-3 rounded-lg border transition-all touch-manipulation active:opacity-80 select-none ${
                  isSelected
                    ? 'bg-violet-500/20 border-violet-500/40'
                    : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                data-testid={`button-renovation-${upgrade.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg ${
                    isSelected ? 'bg-violet-500/30' : 'bg-slate-600/30'
                  }`}>
                    {categoryInfo.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-violet-500 border-violet-500'
                          : 'border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-cyan-100' : 'text-slate-200'}`}>
                        {upgrade.name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {categoryInfo.label}
                      </span>
                    </div>

                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {upgrade.description}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs flex-wrap">
                      <span className="flex items-center gap-1 text-violet-300">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-mono font-bold">${cost.toLocaleString()}</span>
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3 h-3" />
                        {upgrade.timelineWeeks} wk{upgrade.timelineWeeks !== 1 ? 's' : ''}
                      </span>
                      {strategy === 'rent' && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp className="w-3 h-3" />
                          +{upgrade.rentImpactPct}% rent
                        </span>
                      )}
                      {strategy === 'flip' && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <TrendingUp className="w-3 h-3" />
                          +{upgrade.saleImpactPct}% ARV
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {totals.count > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Renovation Cost:</span>
                <span className="text-violet-200 font-semibold font-mono">
                  ${totals.cost.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Additional Timeline:</span>
                <span className="text-amber-400 text-xs">
                  +{totals.weeks} week{totals.weeks !== 1 ? 's' : ''}
                </span>
              </div>
              {strategy === 'rent' && baseMonthlyRent && baseMonthlyRent > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Projected Rent Boost:</span>
                  <span className="text-emerald-400 text-xs">
                    +{totals.rentBoost.toFixed(1)}% (~+${Math.round(baseMonthlyRent * totals.rentBoost / 100).toLocaleString()}/mo)
                  </span>
                </div>
              )}
              {strategy === 'flip' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Projected ARV Boost:</span>
                  <span className="text-emerald-400 text-xs">
                    +{totals.arvBoost.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
