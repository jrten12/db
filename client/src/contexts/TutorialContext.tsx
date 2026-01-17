import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { tutorialSteps, getNextStep, getPreviousStep, type TutorialStep } from '@/lib/tutorialSteps';

interface TutorialContextType {
  isActive: boolean;
  currentStep: TutorialStep | null;
  stepIndex: number;
  totalSteps: number;
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
  isActionRequired: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const TUTORIAL_STORAGE_KEY = 'dealbreak_tutorial';
const TUTORIAL_PROMPT_KEY = 'dealbreak_tutorial_prompt_dismissed';

interface TutorialState {
  completedSteps: string[];
  currentStepId: string | null;
  hasCompletedTutorial: boolean;
}

function loadTutorialState(): TutorialState {
  try {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load tutorial state:', e);
  }
  return {
    completedSteps: [],
    currentStepId: null,
    hasCompletedTutorial: false,
  };
}

function saveTutorialState(state: TutorialState): void {
  try {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save tutorial state:', e);
  }
}

function hasSeenPrompt(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_PROMPT_KEY) === 'true';
  } catch {
    return false;
  }
}

function markPromptSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_PROMPT_KEY, 'true');
  } catch (e) {
    console.error('Failed to mark prompt seen:', e);
  }
}

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TutorialState>(loadTutorialState);
  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const [isActive, setIsActive] = useState(() => {
    const stored = loadTutorialState();
    return !stored.hasCompletedTutorial && stored.currentStepId !== null;
  });

  const [currentStep, setCurrentStep] = useState<TutorialStep | null>(() => {
    const stored = loadTutorialState();
    if (!stored.hasCompletedTutorial && stored.currentStepId) {
      return tutorialSteps.find(s => s.id === stored.currentStepId) || null;
    }
    return null;
  });

  useEffect(() => {
    if (!state.hasCompletedTutorial && !hasSeenPrompt() && !isActive) {
      const timer = setTimeout(() => setShowTutorialPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [state.hasCompletedTutorial, isActive]);

  const stepIndex = currentStep 
    ? tutorialSteps.findIndex(s => s.id === currentStep.id) + 1 
    : 0;

  const startTutorial = useCallback(() => {
    const firstStep = tutorialSteps[0];
    setIsActive(true);
    setCurrentStep(firstStep);
    setShowTutorialPrompt(false);
    markPromptSeen();
    const newState = {
      ...state,
      currentStepId: firstStep.id,
      completedSteps: [],
    };
    setState(newState);
    saveTutorialState(newState);
  }, [state]);

  const endTutorial = useCallback(() => {
    setIsActive(false);
    setCurrentStep(null);
    const newState = {
      ...state,
      hasCompletedTutorial: true,
      currentStepId: null,
    };
    setState(newState);
    saveTutorialState(newState);
    markPromptSeen();
  }, [state]);

  const nextStep = useCallback(() => {
    if (!currentStep) return;

    if (currentStep.requiresAction && !state.completedSteps.includes(currentStep.requiresAction)) {
      setPendingAction(currentStep.requiresAction);
      return;
    }

    const next = getNextStep(currentStep.id);
    if (next) {
      setCurrentStep(next);
      const newState = {
        ...state,
        completedSteps: [...state.completedSteps, currentStep.id],
        currentStepId: next.id,
      };
      setState(newState);
      saveTutorialState(newState);
      setPendingAction(null);
    } else {
      endTutorial();
    }
  }, [currentStep, state, endTutorial]);

  const previousStep = useCallback(() => {
    if (!currentStep) return;
    const prev = getPreviousStep(currentStep.id);
    if (prev) {
      setCurrentStep(prev);
      setPendingAction(null);
    }
  }, [currentStep]);

  const skipToStep = useCallback((stepId: string) => {
    const step = tutorialSteps.find(s => s.id === stepId);
    if (step) {
      setCurrentStep(step);
      setPendingAction(null);
    }
  }, []);

  const completeAction = useCallback((action: string) => {
    let newState = state;
    if (!state.completedSteps.includes(action)) {
      newState = {
        ...state,
        completedSteps: [...state.completedSteps, action],
      };
      setState(newState);
      saveTutorialState(newState);
    }
    if (pendingAction === action && currentStep) {
      setPendingAction(null);
      const next = getNextStep(currentStep.id);
      if (next) {
        setTimeout(() => {
          setCurrentStep(next);
          const advancedState = {
            ...newState,
            completedSteps: [...newState.completedSteps, currentStep.id],
            currentStepId: next.id,
          };
          setState(advancedState);
          saveTutorialState(advancedState);
        }, 300);
      }
    }
  }, [state, pendingAction, currentStep]);

  const dismissPrompt = useCallback(() => {
    setShowTutorialPrompt(false);
    markPromptSeen();
  }, []);

  const isActionRequired = !!(currentStep?.requiresAction && !state.completedSteps.includes(currentStep.requiresAction));

  return (
    <TutorialContext.Provider
      value={{
        isActive,
        currentStep,
        stepIndex,
        totalSteps: tutorialSteps.length,
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
        isActionRequired,
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
