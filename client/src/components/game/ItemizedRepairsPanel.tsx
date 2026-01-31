import { useState, useMemo } from 'react';
import { Wrench, Check, X, AlertTriangle, DollarSign, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { PropertyIssue } from '@/lib/propertyIssues';

interface ItemizedRepairsPanelProps {
  issues: PropertyIssue[];
  selectedIssueIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  contractorType: 'cheap' | 'fast';
  costMultiplier?: number;
  showPostPurchaseMarkup?: boolean;
  disabled?: boolean;
}

const SEVERITY_COLORS = {
  mild: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  moderate: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  severe: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
};

const SEVERITY_LABELS = {
  mild: 'Low Priority',
  moderate: 'Medium Priority',
  severe: 'High Priority',
};

export function ItemizedRepairsPanel({
  issues,
  selectedIssueIds,
  onSelectionChange,
  contractorType,
  costMultiplier = 1,
  showPostPurchaseMarkup = false,
  disabled = false,
}: ItemizedRepairsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getIssueCost = (issue: PropertyIssue): { min: number; max: number } => {
    const baseMin = issue.costRangeMin;
    const baseMax = issue.costRangeMax;
    
    let min = baseMin;
    let max = baseMax;
    
    if (contractorType === 'cheap') {
      min = Math.round(baseMin * 0.85);
      max = Math.round(baseMax * 0.95);
    } else {
      min = Math.round(baseMin * 1.25);
      max = Math.round(baseMax * 1.4);
    }
    
    min = Math.round(min * costMultiplier);
    max = Math.round(max * costMultiplier);
    
    return { min, max };
  };

  const getIssueTime = (issue: PropertyIssue): number => {
    if (contractorType === 'cheap') {
      return Math.ceil(issue.timelineImpactWeeks * 1.5);
    } else {
      return Math.ceil(issue.timelineImpactWeeks * 0.7);
    }
  };

  const totals = useMemo(() => {
    const selected = issues.filter(i => selectedIssueIds.includes(i.id));
    return {
      costMin: selected.reduce((sum, i) => sum + getIssueCost(i).min, 0),
      costMax: selected.reduce((sum, i) => sum + getIssueCost(i).max, 0),
      weeks: selected.reduce((sum, i) => sum + getIssueTime(i), 0),
      count: selected.length,
    };
  }, [issues, selectedIssueIds, contractorType, costMultiplier]);

  const toggleIssue = (issueId: string) => {
    if (disabled) return;
    if (selectedIssueIds.includes(issueId)) {
      onSelectionChange(selectedIssueIds.filter(id => id !== issueId));
    } else {
      onSelectionChange([...selectedIssueIds, issueId]);
    }
  };

  const selectAll = () => {
    if (disabled) return;
    onSelectionChange(issues.map(i => i.id));
  };

  const selectNone = () => {
    if (disabled) return;
    onSelectionChange([]);
  };

  if (issues.length === 0) {
    return (
      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
        <div className="flex items-center gap-2 text-emerald-400">
          <Check className="w-5 h-5" />
          <span className="font-medium">No issues discovered</span>
        </div>
        <p className="text-emerald-300/70 text-sm mt-1">
          Property is in good condition based on your diligence.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/60 border border-cyan-500/20 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        data-testid="button-toggle-repairs"
        data-no-click-sound
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Wrench className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left">
            <h3 className="text-cyan-100 font-semibold">
              Property Issues ({issues.length} found)
            </h3>
            <p className="text-slate-400 text-sm">
              {totals.count === 0 
                ? 'Select issues to fix'
                : `${totals.count} selected - $${totals.costMin.toLocaleString()}-$${totals.costMax.toLocaleString()}`}
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
          {showPostPurchaseMarkup && (
            <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="text-amber-300 font-medium">Post-Purchase Pricing</span>
                  <p className="text-amber-200/70 mt-1">
                    Repairs cost -2% to +12% more than if done during purchase. Get diligence next time!
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Select repairs:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                disabled={disabled}
                className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                data-testid="button-select-all-repairs"
              >
                Select All
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={selectNone}
                disabled={disabled}
                className="text-xs text-slate-400 hover:text-slate-300 disabled:opacity-50"
                data-testid="button-select-none-repairs"
              >
                None
              </button>
            </div>
          </div>

          {issues.map((issue) => {
            const isSelected = selectedIssueIds.includes(issue.id);
            const colors = SEVERITY_COLORS[issue.severity];
            const cost = getIssueCost(issue);
            const weeks = getIssueTime(issue);

            return (
              <button
                key={issue.id}
                onClick={() => toggleIssue(issue.id)}
                disabled={disabled}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/40'
                    : 'bg-slate-700/30 border-slate-600/30 hover:border-slate-500/50'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                data-testid={`button-repair-${issue.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    isSelected 
                      ? 'bg-cyan-500 border-cyan-500' 
                      : 'border-slate-500'
                  }`}>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${isSelected ? 'text-cyan-100' : 'text-slate-200'}`}>
                        {issue.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} ${colors.border} border`}>
                        {SEVERITY_LABELS[issue.severity]}
                      </span>
                    </div>
                    
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                      {issue.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <DollarSign className="w-3 h-3" />
                        ${cost.min.toLocaleString()}-${cost.max.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-amber-400">
                        <Clock className="w-3 h-3" />
                        {weeks} week{weeks !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {totals.count > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Total Selected:</span>
                <div className="text-right">
                  <div className="text-cyan-100 font-semibold">
                    ${totals.costMin.toLocaleString()}-${totals.costMax.toLocaleString()}
                  </div>
                  <div className="text-amber-400 text-xs">
                    ~{totals.weeks} weeks
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
