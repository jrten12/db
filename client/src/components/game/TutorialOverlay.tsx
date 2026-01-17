import { useEffect, useState, useRef } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';
import { X, ChevronLeft, ChevronRight, Lightbulb, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTION_LABELS: Record<string, string> = {
  'select_property': 'Click on a property card to continue',
  'lock_proforma': 'Lock in your pro forma to continue',
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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStep?.targetTestId) {
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const element = document.querySelector(`[data-testid="${currentStep.targetTestId}"]`);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    findTarget();
    const interval = setInterval(findTarget, 500);
    window.addEventListener('resize', findTarget);
    window.addEventListener('scroll', findTarget, true);

    return () => {
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

  const getTooltipPosition = () => {
    if (isCentered) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const tooltipWidth = 380;
    const tooltipHeight = 280;

    let top = targetRect!.top;
    let left = targetRect!.right + padding;

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

    top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));
    left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));

    return { top: `${top}px`, left: `${left}px` };
  };

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      data-testid="tutorial-overlay"
    >
      {!isCentered && targetRect && (
        <>
          <div className="absolute inset-0 bg-black/60 pointer-events-auto" />
          <div 
            className="absolute rounded-xl ring-4 ring-purple-500 ring-offset-4 ring-offset-transparent shadow-2xl shadow-purple-500/50 transition-all duration-300"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 40px rgba(168,85,247,0.5)',
            }}
          />
        </>
      )}

      {isCentered && (
        <div className="absolute inset-0 bg-black/70 pointer-events-auto" />
      )}

      <div 
        className={`absolute w-[380px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/20 pointer-events-auto transition-all duration-300 ${isAnimating ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
        style={getTooltipPosition()}
        data-testid="tutorial-tooltip"
      >
        <div className="absolute -top-3 -right-3">
          <button
            onClick={endTutorial}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 border border-slate-600 flex items-center justify-center transition-colors"
            data-testid="button-end-tutorial"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{currentStep.title}</h3>
              <div className="text-purple-400 text-xs font-medium">
                Step {stepIndex} of {totalSteps}
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            {currentStep.content}
          </p>

          {currentStep.financialConcept && (
            <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-3 mb-4 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-semibold text-xs uppercase tracking-wide">
                  {currentStep.financialConcept.term}
                </span>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                {currentStep.financialConcept.explanation}
              </p>
            </div>
          )}

          <div className="h-1.5 bg-slate-700 rounded-full mb-4 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
            />
          </div>

          {isActionRequired && currentStep.requiresAction && (
            <div className="bg-purple-500/20 border border-purple-500/40 rounded-lg p-2 mb-3 text-center">
              <span className="text-purple-300 text-sm font-medium">
                {ACTION_LABELS[currentStep.requiresAction] || 'Complete the action to continue'}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={previousStep}
              disabled={stepIndex <= 1}
              className="text-gray-400 hover:text-white disabled:opacity-30"
              data-testid="button-previous-step"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={endTutorial}
              className="text-gray-500 hover:text-gray-300 text-xs"
              data-testid="button-skip-tutorial"
            >
              Skip Tutorial
            </Button>

            <Button
              size="sm"
              onClick={nextStep}
              disabled={isActionRequired}
              className={`${isActionRequired 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400'} text-white shadow-lg`}
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
