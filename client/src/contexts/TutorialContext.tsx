import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { tutorialSteps, getNextStep, getPreviousStep, getStepProgress, type TutorialStep } from '@/lib/tutorialSteps';

interface TutorialContextType {
  isActive: boolean;
  currentStep: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
  phaseLabel: string;
  phaseIndex: number;
  totalPhases: number;
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipToStep: (stepId: string) => void;
  completeAction: (action: string) => void;
  hasCompletedTutorial: boolean;
  showTutorialPrompt: boolean;
  dismissPrompt: () => void;
  pendingAction: string | null;
  isWaitingForAction: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_KEY = 'dealbreak_tutorial';
const TUTORIAL_PROMPT_KEY = 'dealbreak_tutorial_prompt_dismissed';

interface TutorialState {
  completedActions: string[];
  currentStepId: string | null;
  hasCompletedTutorial: boolean;
}

function loadState(): TutorialState {
  try {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        completedActions: parsed.completedActions || parsed.completedSteps || [],
        currentStepId: parsed.currentStepId || null,
        hasCompletedTutorial: parsed.hasCompletedTutorial || false,
      };
    }
  } catch {}
  return { completedActions: [], currentStepId: null, hasCompletedTutorial: false };
}

function saveState(state: TutorialState): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function hasSeenPrompt(): boolean {
  try { return localStorage.getItem(TUTORIAL_PROMPT_KEY) === 'true'; } catch { return false; }
}

function markPromptSeen(): void {
  try { localStorage.setItem(TUTORIAL_PROMPT_KEY, 'true'); } catch {}
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TutorialState>(loadState);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [isActive, setIsActive] = useState(() => {
    const s = loadState();
    return !s.hasCompletedTutorial && s.currentStepId !== null;
  });

  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(() => {
    const s = loadState();
    if (!s.hasCompletedTutorial && s.currentStepId) {
      return tutorialSteps.find(st => st.id === s.currentStepId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (!state.hasCompletedTutorial && !hasSeenPrompt() && !isActive) {
      const timer = setTimeout(() => setShowTutorialPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [state.hasCompletedTutorial, isActive]);

  const progress = currentStep ? getStepProgress(currentStep.id) : { current: 0, total: tutorialSteps.length, phase: '', phaseIndex: 0, totalPhases: 7 };

  const isWaitingForAction = !!(currentStep?.action?.completionEvent && !state.completedActions.includes(currentStep.action.completionEvent));

  const startTutorial = useCallback(() => {
    const firstStep = tutorialSteps[0];
    setIsActive(true);
    setCurrentStep(firstStep);
    setShowTutorialPrompt(false);
    markPromptSeen();
    const newState: TutorialState = {
      completedActions: [],
      currentStepId: firstStep.id,
      hasCompletedTutorial: false,
    };
    setState(newState);
    saveState(newState);
  }, []);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(null);
    setPendingAction(null);
    setState(prev => {
      const newState: TutorialState = {
        ...prev,
        hasCompletedTutorial: true,
        currentStepId: null,
      };
      saveState(newState);
      return newState;
    });
    markPromptSeen();
  }, []);

  const advanceTo = useCallback((step: TutorialStep) => {
    setCurrentStep(step);
    setPendingAction(null);
    setState(prev => {
      const newState: TutorialState = {
        ...prev,
        currentStepId: step.id,
      };
      saveState(newState);
      return newState;
    });
  }, []);

  const nextStep = useCallback(() => {
    if (!currentStep) return;
    if (isWaitingForAction) {
      setPendingAction(currentStep.action?.completionEvent || null);
      return;
    }
    const next = getNextStep(currentStep.id);
    if (next) {
      advanceTo(next);
    } else {
      endTutorial();
    }
  }, [currentStep, isWaitingForAction, advanceTo, endTutorial]);

  const previousStep = useCallback(() => {
    if (!currentStep) return;
    const prev = getPreviousStep(currentStep.id);
    if (prev) advanceTo(prev);
  }, [currentStep, advanceTo]);

  const skipToStep = useCallback((stepId: string) => {
    const step = tutorialSteps.find(s => s.id === stepId);
    if (step) advanceTo(step);
  }, [advanceTo]);

  const completeAction = useCallback((action: string) => {
    setState(prev => {
      if (prev.completedActions.includes(action)) return prev;
      const newState: TutorialState = {
        ...prev,
        completedActions: [...prev.completedActions, action],
      };
      saveState(newState);
      return newState;
    });

    if (currentStep?.action?.completionEvent === action) {
      setPendingAction(null);
      const next = getNextStep(currentStep.id);
      if (next) {
        setTimeout(() => advanceTo(next), 400);
      }
    }
  }, [currentStep, advanceTo]);

  const dismissPrompt = useCallback(() => {
    setShowTutorialPrompt(false);
    markPromptSeen();
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        stepIndex: progress.current,
        totalSteps: progress.total,
        phaseLabel: progress.phase,
        phaseIndex: progress.phaseIndex,
        totalPhases: progress.totalPhases,
        startTutorial,
        endTutorial,
        nextStep,
        previousStep,
        skipToStep,
        completeAction,
        hasCompletedTutorial: state.hasCompletedTutorial,
        showTutorialPrompt,
        dismissPrompt,
        pendingAction,
        isWaitingForAction,
      }}
    >
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider');
  }
  return context;
}
