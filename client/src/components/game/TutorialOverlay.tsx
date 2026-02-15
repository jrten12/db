import { useEffect, useState, useRef, useMemo } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ChevronLeft, ChevronRight, HandMetal, Search, DollarSign, Clock, BarChart3, Home, Hammer, Trophy, Lightbulb, Target, Shield, Star } from 'lucide-react';

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wave: HandMetal,
  search: Search,
  cash: DollarSign,
  clock: Clock,
  chart: BarChart3,
  home: Home,
  hammer: Hammer,
  trophy: Trophy,
  lightbulb: Lightbulb,
  target: Target,
  shield: Shield,
  star: Star,
};

const PHASE_COLORS: Record<string, string> = {
  welcome: 'from-purple-500 to-pink-500',
  dashboard: 'from-cyan-500 to-blue-500',
  property: 'from-emerald-500 to-teal-500',
  diligence: 'from-amber-500 to-orange-500',
  proforma: 'from-blue-500 to-indigo-500',
  ownership: 'from-green-500 to-emerald-500',
  wrapup: 'from-yellow-500 to-amber-500',
};

const PHASE_ICON_BG: Record<string, string> = {
  welcome: 'from-purple-400 to-pink-500',
  dashboard: 'from-cyan-400 to-blue-500',
  property: 'from-emerald-400 to-teal-500',
  diligence: 'from-amber-400 to-orange-500',
  proforma: 'from-blue-400 to-indigo-500',
  ownership: 'from-green-400 to-emerald-500',
  wrapup: 'from-yellow-400 to-amber-500',
};

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    stepIndex,
    totalSteps,
    phaseLabel,
    phaseIndex,
    totalPhases,
    nextStep,
    previousStep,
    endTutorial,
    isWaitingForAction,
  } = useTutorial();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const testIds = [currentStep.targetTestId, currentStep.fallbackTestId].filter(Boolean);
    if (testIds.length === 0) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      for (const testId of testIds) {
        const el = document.querySelector(`[data-testid="${testId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setTargetRect(rect);
            return;
          }
        }
      }
      setTargetRect(null);
    };

    const timer = setTimeout(findTarget, 150);
    const interval = setInterval(findTarget, 600);
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget, true);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', findTarget);
      window.removeEventListener('scroll', findTarget, true);
    };
  }, [isActive, currentStep]);

  useEffect(() => {
    if (currentStep) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 250);
      return () => clearTimeout(timer);
    }
  }, [currentStep?.id]);

  const spotlightStyle = useMemo(() => {
    if (!targetRect) return null;
    const pad = 8;
    return {
      top: targetRect.top - pad,
      left: targetRect.left - pad,
      width: targetRect.width + pad * 2,
      height: targetRect.height + pad * 2,
    };
  }, [targetRect]);

  if (!isActive || !currentStep) return null;

  const isCentered = currentStep.position === 'center' || !targetRect;
  const phase = currentStep.phase || 'welcome';
  const phaseGradient = PHASE_COLORS[phase] || PHASE_COLORS.welcome;
  const iconBg = PHASE_ICON_BG[phase] || PHASE_ICON_BG.welcome;
  const StepIcon = STEP_ICONS[currentStep.icon || 'lightbulb'] || Lightbulb;
  const progressPct = (stepIndex / totalSteps) * 100;
  const hasDetail = !!currentStep.detail;
  const hasTip = !!currentStep.tip;

  const getCardPosition = (): React.CSSProperties => {
    if (isMobile) {
      if (isWaitingForAction) {
        return {
          position: 'fixed',
          bottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
          left: '8px',
          right: '8px',
          zIndex: 102,
        };
      }
      return {
        position: 'fixed',
        bottom: 'max(12px, env(safe-area-inset-bottom, 0px))',
        left: '8px',
        right: '8px',
        zIndex: 102,
      };
    }

    if (isCentered) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 480,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 102,
      };
    }

    const cardW = 440;
    const cardH = 340;
    const gap = 20;
    let top = 0;
    let left = 0;

    const rect = targetRect!;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    if (spaceBelow > cardH + gap) {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - cardW / 2;
    } else if (spaceAbove > cardH + gap) {
      top = rect.top - cardH - gap;
      left = rect.left + rect.width / 2 - cardW / 2;
    } else if (spaceRight > cardW + gap) {
      left = rect.right + gap;
      top = rect.top + rect.height / 2 - cardH / 2;
    } else if (spaceLeft > cardW + gap) {
      left = rect.left - cardW - gap;
      top = rect.top + rect.height / 2 - cardH / 2;
    } else {
      top = Math.max(16, rect.bottom + gap);
      left = window.innerWidth / 2 - cardW / 2;
    }

    top = Math.max(16, Math.min(top, window.innerHeight - cardH - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - cardW - 16));

    return {
      position: 'fixed',
      top,
      left,
      width: cardW,
      zIndex: 102,
    };
  };

  return (
    <>
      {/* Dark overlay with spotlight cutout */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-200 ${isWaitingForAction ? 'pointer-events-none' : ''}`}
        data-testid="tutorial-overlay"
        onClick={(e) => {
          if (!isWaitingForAction) e.stopPropagation();
        }}
      >
        {!isWaitingForAction && (
          <div className="absolute inset-0 bg-black/75" />
        )}
        {isWaitingForAction && !isMobile && (
          <div className="absolute inset-0 bg-black/50" />
        )}

        {/* Spotlight ring around target element */}
        {spotlightStyle && !isCentered && (
          <div
            className="absolute rounded-xl pointer-events-none transition-all duration-300"
            style={{
              ...spotlightStyle,
              boxShadow: isWaitingForAction
                ? `0 0 0 4px rgba(34,211,238,0.8), 0 0 0 9999px rgba(0,0,0,0.5), 0 0 40px 10px rgba(34,211,238,0.3)`
                : `0 0 0 3px rgba(34,211,238,0.6), 0 0 0 9999px rgba(0,0,0,0.75), 0 0 30px 5px rgba(34,211,238,0.2)`,
              zIndex: 101,
            }}
          />
        )}

        {/* Pulsing arrow pointing to target (mobile) */}
        {spotlightStyle && !isCentered && isMobile && !isWaitingForAction && (
          <div
            className="absolute pointer-events-none z-[101] animate-bounce"
            style={{
              top: spotlightStyle.top - 32,
              left: spotlightStyle.left + spotlightStyle.width / 2 - 12,
            }}
          >
            <div className="w-6 h-6 border-b-2 border-r-2 border-cyan-400 rotate-45 transform" />
          </div>
        )}
      </div>

      {/* Tutorial card */}
      <div
        ref={cardRef}
        className={`fixed pointer-events-auto transition-all duration-250 ${isAnimating ? 'opacity-0 translate-y-2 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}
        style={getCardPosition()}
        data-testid="tutorial-card"
      >
        <div className="bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/50 overflow-hidden">
          {/* Phase header bar */}
          <div className={`bg-gradient-to-r ${phaseGradient} px-4 py-2.5 flex items-center justify-between`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider truncate">
                {phaseLabel}
              </span>
              <span className="text-white/60 text-xs">
                ({phaseIndex}/{totalPhases})
              </span>
            </div>
            <button
              onClick={endTutorial}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 flex items-center justify-center transition-colors flex-shrink-0"
              data-testid="button-end-tutorial"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-3 md:px-5 md:py-4">
            {/* Title with icon */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <StepIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-white font-bold text-base md:text-lg leading-tight">{currentStep.title}</h3>
              </div>
            </div>

            {/* Main content */}
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              {currentStep.content}
            </p>

            {/* Detail text (expandable feel) */}
            {hasDetail && (
              <div className="bg-slate-800/60 rounded-lg px-3 py-2.5 mb-3 border border-slate-700/40">
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                  {currentStep.detail}
                </p>
              </div>
            )}

            {/* Pro tip */}
            {hasTip && (
              <div className="bg-amber-500/10 rounded-lg px-3 py-2 mb-3 border border-amber-500/20 flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-300/90 text-xs leading-relaxed">
                  {currentStep.tip}
                </p>
              </div>
            )}

            {/* Action prompt */}
            {isWaitingForAction && currentStep.action && (
              <div className="bg-cyan-500/15 border border-cyan-400/30 rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                <span className="text-cyan-300 text-sm font-medium">
                  {currentStep.action.label}
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${phaseGradient} rounded-full transition-all duration-500`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-gray-500 text-xs font-mono flex-shrink-0">
                {stepIndex}/{totalSteps}
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={previousStep}
                disabled={stepIndex <= 1}
                className="h-10 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-30 disabled:pointer-events-none text-gray-300 flex items-center gap-1 transition-colors text-sm"
                data-testid="button-previous-step"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <button
                onClick={endTutorial}
                className="h-10 px-3 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-slate-800 active:bg-slate-700 transition-colors text-xs"
                data-testid="button-skip-tutorial"
              >
                Skip All
              </button>

              <div className="flex-1" />

              <button
                onClick={nextStep}
                disabled={isWaitingForAction}
                className={`h-10 px-5 rounded-lg font-semibold text-sm flex items-center gap-1 transition-all ${
                  isWaitingForAction
                    ? 'bg-slate-700 text-gray-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${phaseGradient} text-white shadow-lg hover:shadow-xl active:scale-[0.97]`
                }`}
                data-testid="button-next-step"
              >
                {stepIndex === totalSteps ? 'Done!' : 'Next'}
                {stepIndex < totalSteps && !isWaitingForAction && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
