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

type ArrowDirection = 'up' | 'down' | 'left' | 'right' | 'none';

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
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);
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

    let hasScrolled = false;

    const findTarget = () => {
      for (const testId of testIds) {
        const el = document.querySelector(`[data-testid="${testId}"]`) as HTMLElement | null;
        if (el) {
          if (!hasScrolled) {
            hasScrolled = true;
            const elRect = el.getBoundingClientRect();
            const viewH = window.innerHeight;
            const isOffScreen = elRect.top < 0 || elRect.bottom > viewH || elRect.top > viewH * 0.7;
            if (isOffScreen) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => {
                const updatedRect = el.getBoundingClientRect();
                if (updatedRect.width > 0 && updatedRect.height > 0) {
                  setTargetRect(updatedRect);
                }
              }, 400);
              return;
            }
          }
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

  useEffect(() => {
    if (cardRef.current) {
      const observer = new ResizeObserver(() => {
        if (cardRef.current) {
          setCardRect(cardRef.current.getBoundingClientRect());
        }
      });
      observer.observe(cardRef.current);
      setTimeout(() => {
        if (cardRef.current) setCardRect(cardRef.current.getBoundingClientRect());
      }, 300);
      return () => observer.disconnect();
    }
  }, [currentStep?.id, targetRect]);

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

  const getCardPosition = (): { style: React.CSSProperties; direction: ArrowDirection } => {
    if (isCentered) {
      return {
        style: {
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isMobile ? undefined : 480,
          maxWidth: 'calc(100vw - 32px)',
          zIndex: 102,
          ...(isMobile ? { left: '16px', right: '16px', transform: 'translateY(-50%)' } : {}),
        },
        direction: 'none',
      };
    }

    const rect = targetRect!;
    const gap = 16;

    if (isMobile) {
      const viewH = window.innerHeight;
      const measuredH = cardRect?.height || 260;
      const safeTop = 10;
      const safeBottom = viewH - 10;
      const targetCenterY = rect.top + rect.height / 2;

      const spaceAboveTarget = rect.top - safeTop;
      const spaceBelowTarget = safeBottom - rect.bottom;

      if (spaceBelowTarget >= measuredH + gap && rect.bottom + gap + measuredH < safeBottom) {
        return {
          style: {
            position: 'fixed',
            top: Math.min(rect.bottom + gap, safeBottom - measuredH),
            left: '12px',
            right: '12px',
            zIndex: 102,
          },
          direction: 'up',
        };
      }

      if (spaceAboveTarget >= measuredH + gap) {
        return {
          style: {
            position: 'fixed',
            top: Math.max(safeTop, rect.top - gap - measuredH),
            left: '12px',
            right: '12px',
            zIndex: 102,
          },
          direction: 'down',
        };
      }

      const cardTop = targetCenterY < viewH / 2
        ? Math.min(rect.bottom + gap, safeBottom - measuredH)
        : Math.max(safeTop, rect.top - gap - measuredH);

      return {
        style: {
          position: 'fixed',
          top: Math.max(safeTop, Math.min(cardTop, safeBottom - measuredH)),
          left: '12px',
          right: '12px',
          zIndex: 102,
        },
        direction: targetCenterY < viewH / 2 ? 'up' : 'down',
      };
    }

    const cardW = 420;
    const cardH = 320;
    let top = 0;
    let left = 0;
    let dir: ArrowDirection = 'none';

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    if (spaceBelow > cardH + gap) {
      top = rect.bottom + gap;
      left = rect.left + rect.width / 2 - cardW / 2;
      dir = 'up';
    } else if (spaceAbove > cardH + gap) {
      top = rect.top - cardH - gap;
      left = rect.left + rect.width / 2 - cardW / 2;
      dir = 'down';
    } else if (spaceRight > cardW + gap) {
      left = rect.right + gap;
      top = rect.top + rect.height / 2 - cardH / 2;
      dir = 'left';
    } else if (spaceLeft > cardW + gap) {
      left = rect.left - cardW - gap;
      top = rect.top + rect.height / 2 - cardH / 2;
      dir = 'right';
    } else {
      top = Math.max(16, rect.bottom + gap);
      left = window.innerWidth / 2 - cardW / 2;
      dir = 'up';
    }

    top = Math.max(16, Math.min(top, window.innerHeight - cardH - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - cardW - 16));

    return {
      style: {
        position: 'fixed',
        top,
        left,
        width: cardW,
        zIndex: 102,
      },
      direction: dir,
    };
  };

  const { style: cardStyle, direction } = getCardPosition();

  const getArrowElement = () => {
    if (isCentered || !targetRect || direction === 'none') return null;

    const rect = targetRect;
    const targetCx = rect.left + rect.width / 2;
    const targetCy = rect.top + rect.height / 2;
    const arrowSize = 14;

    if (isMobile) {
      if (direction === 'up') {
        return (
          <div
            className="fixed pointer-events-none z-[103]"
            style={{
              left: Math.max(32, Math.min(targetCx - arrowSize, window.innerWidth - 32 - arrowSize * 2)),
              top: rect.bottom + 2,
            }}
          >
            <div className="relative">
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${arrowSize}px solid transparent`,
                  borderRight: `${arrowSize}px solid transparent`,
                  borderBottom: `${arrowSize}px solid rgba(34,211,238,0.9)`,
                  filter: 'drop-shadow(0 -2px 4px rgba(34,211,238,0.4))',
                }}
              />
            </div>
          </div>
        );
      }
      if (direction === 'down') {
        return (
          <div
            className="fixed pointer-events-none z-[103]"
            style={{
              left: Math.max(32, Math.min(targetCx - arrowSize, window.innerWidth - 32 - arrowSize * 2)),
              top: rect.top - arrowSize - 2,
            }}
          >
            <div className="relative">
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: `${arrowSize}px solid transparent`,
                  borderRight: `${arrowSize}px solid transparent`,
                  borderTop: `${arrowSize}px solid rgba(34,211,238,0.9)`,
                  filter: 'drop-shadow(0 2px 4px rgba(34,211,238,0.4))',
                }}
              />
            </div>
          </div>
        );
      }
    }

    if (!cardRef.current) return null;
    const card = cardRef.current.getBoundingClientRect();
    const cardCx = card.left + card.width / 2;
    const cardCy = card.top + card.height / 2;

    if (direction === 'up') {
      const arrowX = Math.max(card.left + 30, Math.min(targetCx, card.right - 30));
      return (
        <div
          className="fixed pointer-events-none z-[103]"
          style={{ left: arrowX - arrowSize, top: card.top - arrowSize }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid transparent`,
              borderBottom: `${arrowSize}px solid rgb(30, 41, 59)`,
              filter: 'drop-shadow(0 -2px 4px rgba(34,211,238,0.5))',
            }}
          />
        </div>
      );
    }
    if (direction === 'down') {
      const arrowX = Math.max(card.left + 30, Math.min(targetCx, card.right - 30));
      return (
        <div
          className="fixed pointer-events-none z-[103]"
          style={{ left: arrowX - arrowSize, top: card.bottom }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid transparent`,
              borderTop: `${arrowSize}px solid rgb(30, 41, 59)`,
              filter: 'drop-shadow(0 2px 4px rgba(34,211,238,0.5))',
            }}
          />
        </div>
      );
    }
    if (direction === 'left') {
      const arrowY = Math.max(card.top + 30, Math.min(targetCy, card.bottom - 30));
      return (
        <div
          className="fixed pointer-events-none z-[103]"
          style={{ left: card.left - arrowSize, top: arrowY - arrowSize }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: `${arrowSize}px solid transparent`,
              borderBottom: `${arrowSize}px solid transparent`,
              borderRight: `${arrowSize}px solid rgb(30, 41, 59)`,
              filter: 'drop-shadow(-2px 0 4px rgba(34,211,238,0.5))',
            }}
          />
        </div>
      );
    }
    if (direction === 'right') {
      const arrowY = Math.max(card.top + 30, Math.min(targetCy, card.bottom - 30));
      return (
        <div
          className="fixed pointer-events-none z-[103]"
          style={{ left: card.right, top: arrowY - arrowSize }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: `${arrowSize}px solid transparent`,
              borderBottom: `${arrowSize}px solid transparent`,
              borderLeft: `${arrowSize}px solid rgb(30, 41, 59)`,
              filter: 'drop-shadow(2px 0 4px rgba(34,211,238,0.5))',
            }}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <>
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

        {spotlightStyle && !isCentered && (
          <div
            className="absolute pointer-events-none z-[101] animate-pulse"
            style={{
              top: spotlightStyle.top - 2,
              left: spotlightStyle.left - 2,
              width: spotlightStyle.width + 4,
              height: spotlightStyle.height + 4,
              borderRadius: '0.75rem',
              border: '2px solid rgba(34,211,238,0.5)',
            }}
          />
        )}
      </div>

      {getArrowElement()}

      <div
        ref={cardRef}
        className={`fixed pointer-events-auto transition-all duration-250 ${isAnimating ? 'opacity-0 translate-y-2 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}
        style={cardStyle}
        data-testid="tutorial-card"
      >
        <div className="bg-slate-900 rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/50 overflow-hidden" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className={`bg-gradient-to-r ${phaseGradient} px-4 py-2 flex items-center justify-between`}>
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

          <div className="px-4 py-3 md:px-5 md:py-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 140px)' }}>
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconBg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <StepIcon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <h3 className="text-white font-bold text-base md:text-lg leading-tight">{currentStep.title}</h3>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              {currentStep.content}
            </p>

            {hasDetail && (
              <div className="bg-slate-800/60 rounded-lg px-3 py-2.5 mb-3 border border-slate-700/40">
                <p className="text-gray-400 text-xs md:text-sm leading-relaxed whitespace-pre-line">
                  {currentStep.detail}
                </p>
              </div>
            )}

            {hasTip && (
              <div className="bg-amber-500/10 rounded-lg px-3 py-2 mb-3 border border-amber-500/20 flex items-start gap-2">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-300/90 text-xs leading-relaxed">
                  {currentStep.tip}
                </p>
              </div>
            )}

            {isWaitingForAction && currentStep.action && (
              <div className="bg-cyan-500/15 border border-cyan-400/30 rounded-lg px-3 py-2.5 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
                <span className="text-cyan-300 text-sm font-medium">
                  {currentStep.action.label}
                </span>
              </div>
            )}

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
