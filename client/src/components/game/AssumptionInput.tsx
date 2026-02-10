import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatCurrency } from '@/lib/gameData';

type PresetOption = {
  label: string;
  value: number;
  description: string;
  color: 'conservative' | 'market' | 'aggressive';
};

interface AssumptionInputProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  presets?: PresetOption[];
  source?: string;
  drivesOutput?: string;
  format?: 'currency' | 'percent' | 'weeks' | 'number';
  helpText?: string;
  compact?: boolean;
}

const formatValue = (value: number | null, format: AssumptionInputProps['format']): string => {
  if (value === null) return '—';
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return `${value}%`;
    case 'weeks':
      return `${value}mo`;
    default:
      return value.toLocaleString();
  }
};

const getPresetColor = (color: PresetOption['color'], isSelected: boolean) => {
  const colors = {
    conservative: isSelected 
      ? 'bg-emerald-500/30 border-emerald-500 text-emerald-400' 
      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400/70 hover:border-emerald-500/50',
    market: isSelected 
      ? 'bg-blue-500/30 border-blue-500 text-blue-400' 
      : 'bg-blue-500/10 border-blue-500/30 text-blue-400/70 hover:border-blue-500/50',
    aggressive: isSelected 
      ? 'bg-amber-500/30 border-amber-500 text-amber-400' 
      : 'bg-amber-500/10 border-amber-500/30 text-amber-400/70 hover:border-amber-500/50',
  };
  return colors[color];
};

export function AssumptionInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  presets = [],
  source,
  drivesOutput,
  format = 'number',
  helpText,
  compact = false,
}: AssumptionInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localValue, setLocalValue] = useState(value ?? min);
  const sliderRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value !== null) {
      setLocalValue(value);
    }
  }, [value]);

  const handleSliderChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handlePresetClick = (presetValue: number) => {
    setLocalValue(presetValue);
    onChange(presetValue);
  };

  const progress = ((localValue - min) / (max - min)) * 100;
  const selectedPreset = presets.find(p => p.value === localValue);

  if (compact) {
    return (
      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 text-xs font-medium">{label}</span>
            {helpText && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-gray-500 hover:text-gray-300 transition-colors p-1 -m-1">
                    <HelpCircle className="w-3 h-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="center" sideOffset={8} collisionPadding={16} className="max-w-[90vw] sm:max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[100]">
                  <p>{helpText}</p>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <span className="text-white font-bold font-mono text-sm">
            {formatValue(value, format)}
          </span>
        </div>
        
        {presets.length > 0 && (
          <div className="flex gap-1">
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetClick(preset.value)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${getPresetColor(preset.color, localValue === preset.value)}`}
                data-testid={`preset-${label.toLowerCase().replace(/\s+/g, '-')}-${preset.label.toLowerCase()}`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
        
        <input
          ref={sliderRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #334155 ${progress}%, #334155 100%)`
          }}
          data-testid={`slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>{formatValue(min, format)}</span>
          <span>{formatValue(max, format)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-medium text-sm">{label}</span>
              {helpText && (
                <Popover>
                  <PopoverTrigger asChild>
                    <span className="text-gray-500 hover:text-gray-300 cursor-help" onClick={(e) => e.stopPropagation()}>
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent side="top" align="center" sideOffset={8} collisionPadding={16} className="max-w-[90vw] sm:max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[100]">
                    <p>{helpText}</p>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {source && (
              <p className="text-gray-500 text-xs mt-0.5">Source: {source}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`font-bold font-mono ${value !== null ? 'text-blue-400' : 'text-gray-500'}`}>
              {formatValue(value, format)}
            </span>
            {selectedPreset && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${getPresetColor(selectedPreset.color, true)}`}>
                {selectedPreset.label}
              </span>
            )}
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-700/50 pt-4">
          {presets.length > 0 && (
            <div className="space-y-2">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Quick Options</p>
              <div className="grid grid-cols-3 gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset.value)}
                    className={`p-3 rounded-xl border transition-all text-left ${getPresetColor(preset.color, localValue === preset.value)}`}
                    data-testid={`preset-${label.toLowerCase().replace(/\s+/g, '-')}-${preset.label.toLowerCase()}`}
                  >
                    <div className="font-bold font-mono text-sm">{formatValue(preset.value, format)}</div>
                    <div className="text-xs opacity-70 mt-0.5">{preset.label}</div>
                    <div className="text-[10px] opacity-50 mt-1 line-clamp-2">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Fine-Tune</p>
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-600/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-xs">Drag to adjust</span>
                <span className="text-blue-400 font-bold font-mono text-lg">{formatValue(localValue, format)}</span>
              </div>
              
              <input
                ref={sliderRef}
                type="range"
                min={min}
                max={max}
                step={step}
                value={localValue}
                onChange={(e) => handleSliderChange(Number(e.target.value))}
                className="w-full h-3 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #334155 ${progress}%, #334155 100%)`
                }}
                data-testid={`slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
              />
              
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{formatValue(min, format)}</span>
                <span>{formatValue(max, format)}</span>
              </div>
            </div>
          </div>

          {drivesOutput && (
            <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-300">This affects</span>
                <ArrowRight className="w-3 h-3 text-blue-400" />
                <span className="text-blue-400 font-medium">{drivesOutput}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface PercentAssumptionProps {
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  baseAmount: number;
  baseLabel: string;
  min?: number;
  max?: number;
  step?: number;
  presets?: Array<{ label: string; value: number; color: 'conservative' | 'market' | 'aggressive' }>;
  helpText?: string;
}

export function PercentAssumption({
  label,
  value,
  onChange,
  baseAmount,
  baseLabel,
  min = 0,
  max = 20,
  step = 0.5,
  presets = [],
  helpText,
}: PercentAssumptionProps) {
  const [localValue, setLocalValue] = useState(value ?? min);
  
  useEffect(() => {
    if (value !== null) {
      setLocalValue(value);
    }
  }, [value]);

  const handleChange = (newValue: number) => {
    setLocalValue(newValue);
    onChange(newValue);
  };

  const dollarAmount = Math.round(baseAmount * (localValue / 100));
  const progress = ((localValue - min) / (max - min)) * 100;

  return (
    <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-400 text-xs font-medium">{label}</span>
          {helpText && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-gray-500 hover:text-gray-300 transition-colors p-1 -m-1">
                  <HelpCircle className="w-3 h-3" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="center" sideOffset={8} collisionPadding={16} className="max-w-[90vw] sm:max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-3 z-[100]">
                <p>{helpText}</p>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="text-right">
          <span className="text-white font-bold font-mono text-sm">{localValue}%</span>
          <span className="text-gray-500 text-xs ml-1">= {formatCurrency(dollarAmount)}/yr</span>
        </div>
      </div>
      
      {presets.length > 0 && (
        <div className="flex gap-1">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleChange(preset.value)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${getPresetColor(preset.color, localValue === preset.value)}`}
              data-testid={`preset-${label.toLowerCase().replace(/\s+/g, '-')}-${preset.label.toLowerCase()}`}
            >
              {preset.value}%
            </button>
          ))}
        </div>
      )}
      
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progress}%, #334155 ${progress}%, #334155 100%)`
        }}
        data-testid={`slider-${label.toLowerCase().replace(/\s+/g, '-')}`}
      />
      
      <div className="flex justify-between items-center text-[10px]">
        <span className="text-gray-500">{min}%</span>
        <span className="text-gray-600 italic">% of {baseLabel}</span>
        <span className="text-gray-500">{max}%</span>
      </div>
    </div>
  );
}

export function FormulaConnection({ 
  from, 
  to, 
  operation = '+' 
}: { 
  from: string; 
  to: string; 
  operation?: '+' | '-' | '×' | '=' 
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-gray-400 text-xs">{from}</span>
      <div className="flex-1 border-t border-dashed border-gray-600 relative">
        <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-slate-800 px-1.5 text-xs text-blue-400 font-mono">
          {operation}
        </span>
      </div>
      <ArrowRight className="w-3 h-3 text-blue-400" />
      <span className="text-blue-400 text-xs font-medium">{to}</span>
    </div>
  );
}
