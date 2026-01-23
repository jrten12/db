import { useEffect, useState, useRef } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ChevronLeft, ChevronRight, Lightbulb, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTION_LABELS: Record<string, string> = {
  'select_property': 'Tap a property to continue',
  'lock_proforma': 'Lock your pro forma to continue',
};

export function TutorialOverlay() {
  const { 
    isActive, 
    currentStep, 
    stepIndex, 
    totalSteps, 
    nextStep, 
    previousStep, 
    endTutorial,
    isActionRequired,
  } = useTutorial();
  
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isActive || !currentStep?.targetTestId) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(`[data-testid="${currentStep.targetTestId}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
        } else {
          setTargetRect(null);
        }
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(findTarget, 100);
    const interval = setInterval(findTarget, 500);
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
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep?.id]);

  if (!isActive || !currentStep) return null;

  const isCentered = currentStep.position === 'center' || !targetRect;
  const tooltipWidth = isMobile ? Math.min(340, window.innerWidth - 24) : 480;

  const getTooltipStyle = (): React.CSSProperties => {
    if (isMobile) {
      if (isActionRequired) {
        return {
          position: 'fixed',
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          left: '12px',
          right: '12px',
          width: 'auto',
          maxWidth: 'none',
        };
      }
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: tooltipWidth,
        maxWidth: 'calc(100vw - 24px)',
      };
    }
    
    if (isCentered) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: tooltipWidth,
        maxWidth: 'calc(100vw - 32px)',
      };
    }

    const padding = 16;
    const tooltipHeight = 300;

    let top = targetRect!.top;
    let left = targetRect!.left;

    switch (currentStep.position) {
      case 'left':
        left = targetRect!.left - tooltipWidth - padding;
        top = targetRect!.top + targetRect!.height / 2 - tooltipHeight / 2;
        break;
      case 'right':
        left = targetRect!.right + padding;
        top = targetRect!.top + targetRect!.height / 2 - tooltipHeight / 2;
        break;
      case 'top':
        left = targetRect!.left + targetRect!.width / 2 - tooltipWidth / 2;
        top = targetRect!.top - tooltipHeight - padding;
        break;
      case 'bottom':
        left = targetRect!.left + targetRect!.width / 2 - tooltipWidth / 2;
        top = targetRect!.bottom + padding;
        break;
    }

    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: tooltipWidth,
    };
  };

  return (
    <div 
      ref={overlayRef}
      className={`fixed inset-0 z-[100] ${isActionRequired ? 'pointer-events-none' : ''}`}
      data-testid="tutorial-overlay"
    >
      {/* Only show blocking background when no action required - otherwise allow clicks through */}
      {!isActionRequired && (
        <div 
          className="absolute inset-0 bg-black/70"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {!isCentered && !isMobile && targetRect && (
        <div 
          className="absolute rounded-xl ring-4 ring-cyan-400 ring-offset-2 ring-offset-transparent shadow-2xl shadow-cyan-400/50 transition-all duration-300 pointer-events-none"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.7), 0 0 30px rgba(34,211,238,0.4)',
          }}
        />
      )}

      <div 
        className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-cyan-400/30 shadow-2xl shadow-cyan-400/20 transition-all duration-300 max-h-[80vh] overflow-y-auto pointer-events-auto ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        style={getTooltipStyle()}
        data-testid="tutorial-tooltip"
      >
        <div className="sticky top-0 right-0 z-10 flex justify-end p-2 pb-0">
          <button
            onClick={endTutorial}
            className="touch-target w-11 h-11 rounded-full bg-slate-700/90 hover:bg-slate-600 active:bg-slate-500 border border-slate-600 flex items-center justify-center transition-all duration-150 ios-spring tap-scale"
            data-testid="button-end-tutorial"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="px-4 pb-4 pt-1 md:px-5 md:pb-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg flex-shrink-0">
              <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-bold text-base md:text-lg truncate">{currentStep.title}</h3>
              <div className="text-cyan-400 text-xs font-medium">
                Step {stepIndex} of {totalSteps}
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-3">
            {currentStep.content}
          </p>

          {currentStep.financialConcept && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 mb-3 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="text-amber-400 font-semibold text-xs uppercase tracking-wide">
                  {currentStep.financialConcept.term}
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                {currentStep.financialConcept.explanation}
              </p>
            </div>
          )}

          <div className="h-1.5 bg-slate-700 rounded-full mb-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
            />
          </div>

          {isActionRequired && currentStep.requiresAction && (
            <div className="bg-cyan-500/20 border border-cyan-400/40 rounded-lg p-2 mb-3 text-center animate-pulse">
              <span className="text-cyan-300 text-sm font-medium">
                {ACTION_LABELS[currentStep.requiresAction] || 'Complete the action to continue'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              disabled={stepIndex <= 1}
              className="text-gray-400 hover:text-white disabled:opacity-30 px-2"
              data-testid="button-previous-step"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Back</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={endTutorial}
              className="text-gray-500 hover:text-gray-300 text-xs px-2"
              data-testid="button-skip-tutorial"
            >
              Skip
            </Button>

            <Button
              size="sm"
              onClick={nextStep}
              disabled={isActionRequired}
              className={`${isActionRequired 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400'} text-white shadow-lg px-3`}
              data-testid="button-next-step"
            >
              {stepIndex === totalSteps ? 'Finish' : 'Next'}
              {stepIndex < totalSteps && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
