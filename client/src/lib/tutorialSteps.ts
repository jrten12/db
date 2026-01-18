export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  targetTestId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  financialConcept?: {
    term: string;
    explanation: string;
  };
  arc: 'orientation' | 'first_deal' | 'portfolio';
  requiresAction?: string;
  highlightArea?: string;
}

export const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Dealbreak!',
    content: 'Learn real estate investing by doing it. You have $50,000 and 52 weeks to complete 3 profitable deals.',
    position: 'center',
    arc: 'orientation',
  },
  {
    id: 'property_list',
    title: 'Browse Properties',
    content: 'Each card is a potential investment. Look at price, size, and condition. Tap any property to see details.',
    targetTestId: 'property-list',
    position: 'bottom',
    arc: 'orientation',
    requiresAction: 'select_property',
    financialConcept: {
      term: 'Deal Flow',
      explanation: 'The stream of opportunities you evaluate. Good investors see many deals but only buy a few.',
    },
  },
  {
    id: 'due_diligence',
    title: 'Do Your Research',
    content: 'Before buying, investigate! Each option costs time and money but reveals hidden information. Skip at your own risk.',
    targetTestId: 'due-diligence-section',
    position: 'bottom',
    arc: 'first_deal',
    financialConcept: {
      term: 'Due Diligence',
      explanation: 'Investigation before buying. Costs upfront but saves you from expensive surprises.',
    },
  },
  {
    id: 'strategy_choice',
    title: 'Choose Your Strategy',
    content: 'RENT for steady monthly income, or FLIP to renovate and sell for quick profit. Each has different risks and rewards.',
    targetTestId: 'strategy-tabs',
    position: 'bottom',
    arc: 'first_deal',
    financialConcept: {
      term: 'Exit Strategy',
      explanation: 'How you plan to make money. Rentals provide cash flow. Flips offer one-time profits.',
    },
  },
  {
    id: 'pro_forma',
    title: 'Build Your Numbers',
    content: 'Fill in your assumptions about rent, expenses, and financing. The pro forma shows if this deal makes money.',
    targetTestId: 'pro-forma-panel',
    position: 'top',
    arc: 'first_deal',
    financialConcept: {
      term: 'Pro Forma',
      explanation: 'A financial forecast. It estimates income, expenses, and profit based on your assumptions.',
    },
  },
  {
    id: 'commit_deal',
    title: 'Lock In Your Deal',
    content: 'Fill in all the fields, then the "Ready to Buy" button appears. Click it to commit to your investment!',
    targetTestId: 'pro-forma-panel',
    position: 'top',
    arc: 'first_deal',
  },
  {
    id: 'time_progression',
    title: 'Advance Time',
    content: 'Click "Advance Week" to see your investments unfold. Rentals collect income. Flips progress through renovation.',
    targetTestId: 'time-progression-panel',
    position: 'top',
    arc: 'portfolio',
    financialConcept: {
      term: 'Holding Period',
      explanation: 'How long you own an investment. Watch your cash and weeks remaining!',
    },
  },
  {
    id: 'tutorial_complete',
    title: 'You\'re Ready!',
    content: 'Complete 3 profitable deals to win. Do your research, understand your numbers, and don\'t be afraid to walk away from bad deals. Good luck!',
    position: 'center',
    arc: 'portfolio',
  },
];

export const tutorialArcs = {
  orientation: tutorialSteps.filter(s => s.arc === 'orientation'),
  first_deal: tutorialSteps.filter(s => s.arc === 'first_deal'),
  portfolio: tutorialSteps.filter(s => s.arc === 'portfolio'),
};

export function getTutorialStep(stepId: string): TutorialStep | undefined {
  return tutorialSteps.find(s => s.id === stepId);
}

export function getNextStep(currentStepId: string): TutorialStep | undefined {
  const currentIndex = tutorialSteps.findIndex(s => s.id === currentStepId);
  if (currentIndex === -1 || currentIndex === tutorialSteps.length - 1) {
    return undefined;
  }
  return tutorialSteps[currentIndex + 1];
}

export function getPreviousStep(currentStepId: string): TutorialStep | undefined {
  const currentIndex = tutorialSteps.findIndex(s => s.id === currentStepId);
  if (currentIndex <= 0) {
    return undefined;
  }
  return tutorialSteps[currentIndex - 1];
}

export function getStepProgress(stepId: string): { current: number; total: number } {
  const currentIndex = tutorialSteps.findIndex(s => s.id === stepId);
  return {
    current: currentIndex + 1,
    total: tutorialSteps.length,
  };
}
