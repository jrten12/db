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
    content: 'You\'re about to learn real estate investing by doing it. You have $50,000 cash and 52 weeks to complete 3 profitable deals. Let\'s walk through the basics.',
    position: 'center',
    arc: 'orientation',
  },
  {
    id: 'property_list',
    title: 'Find Properties',
    content: 'This is your property pipeline. Each card shows a potential investment opportunity. Look at price, location, and condition to start evaluating.',
    targetTestId: 'property-list',
    position: 'right',
    arc: 'orientation',
    financialConcept: {
      term: 'Deal Flow',
      explanation: 'The stream of investment opportunities you evaluate. Real investors see many deals but only pursue a few.',
    },
  },
  {
    id: 'select_property',
    title: 'Select a Property',
    content: 'Click on any property card to dive deeper. In real estate, you never buy blind - always investigate first.',
    targetTestId: 'property-list',
    position: 'right',
    arc: 'orientation',
    requiresAction: 'select_property',
  },
  {
    id: 'due_diligence_intro',
    title: 'Due Diligence',
    content: 'Before buying, smart investors do research. Each investigation costs money and time, but reveals hidden information that affects your deal.',
    targetTestId: 'due-diligence-section',
    position: 'left',
    arc: 'first_deal',
    financialConcept: {
      term: 'Due Diligence',
      explanation: 'The investigation process before buying. It costs upfront but can save you from expensive surprises.',
    },
  },
  {
    id: 'investigation_types',
    title: 'Choose Your Research',
    content: 'Market Study reveals rent ranges. Contractor Walkthrough shows true rehab costs. Title Search uncovers legal issues. Each has trade-offs.',
    targetTestId: 'due-diligence-section',
    position: 'left',
    arc: 'first_deal',
  },
  {
    id: 'strategy_choice',
    title: 'Rent vs Flip',
    content: 'Two ways to profit: RENT for steady monthly income, or FLIP to renovate and sell for a quick profit. Each has different risks and rewards.',
    targetTestId: 'strategy-tabs',
    position: 'top',
    arc: 'first_deal',
    financialConcept: {
      term: 'Exit Strategy',
      explanation: 'How you plan to make money. Rentals provide ongoing cash flow. Flips offer one-time profits.',
    },
  },
  {
    id: 'pro_forma_intro',
    title: 'Build Your Pro Forma',
    content: 'A pro forma is your financial forecast. Enter your assumptions about rent, expenses, and financing to see if this deal makes sense.',
    targetTestId: 'pro-forma-panel',
    position: 'left',
    arc: 'first_deal',
    financialConcept: {
      term: 'Pro Forma',
      explanation: 'A projected financial statement. It estimates future income, expenses, and profit based on your assumptions.',
    },
  },
  {
    id: 'ltv_financing',
    title: 'Loan-to-Value (LTV)',
    content: 'LTV controls how much you borrow. Higher LTV = smaller down payment but higher interest rates. Lower LTV = more cash upfront but better terms.',
    targetTestId: 'ltv-slider',
    position: 'top',
    arc: 'first_deal',
    financialConcept: {
      term: 'Leverage',
      explanation: 'Using borrowed money to amplify returns. More leverage = higher potential gains but also higher risk.',
    },
  },
  {
    id: 'cash_flow',
    title: 'Cash Flow Matters',
    content: 'For rentals, monthly cash flow shows your profit after all expenses. Positive = money in your pocket. Negative = you\'re paying to own this property.',
    targetTestId: 'cash-flow-display',
    position: 'top',
    arc: 'first_deal',
    financialConcept: {
      term: 'Cash Flow',
      explanation: 'The money left over after paying all expenses including mortgage. This is your actual monthly profit.',
    },
  },
  {
    id: 'commit_deal',
    title: 'Lock In Your Deal',
    content: 'When you\'re ready, lock in your pro forma to commit to this investment. Your assumptions become reality - for better or worse.',
    targetTestId: 'button-calculate',
    position: 'top',
    arc: 'first_deal',
    requiresAction: 'lock_proforma',
  },
  {
    id: 'time_progression',
    title: 'Time is Money',
    content: 'Advance weeks to see your investments unfold. Rentals collect income. Flips progress through renovation. Watch your cash and weeks remaining.',
    targetTestId: 'time-progression-panel',
    position: 'left',
    arc: 'portfolio',
    financialConcept: {
      term: 'Holding Period',
      explanation: 'How long you own an investment. Longer holds mean more expenses but potentially more appreciation.',
    },
  },
  {
    id: 'portfolio_management',
    title: 'Manage Your Portfolio',
    content: 'Track your active deals here. Rentals generate weekly income. Flips move through rehab stages. You can sell properties when needed.',
    targetTestId: 'active-deals-section',
    position: 'left',
    arc: 'portfolio',
  },
  {
    id: 'win_condition',
    title: 'How to Win',
    content: 'Complete 3 profitable deals before running out of time or money. Learn from every deal - both successes and failures teach real estate skills.',
    position: 'center',
    arc: 'portfolio',
  },
  {
    id: 'tutorial_complete',
    title: 'You\'re Ready!',
    content: 'That\'s the basics! Remember: do your due diligence, understand your numbers, and don\'t be afraid to walk away from bad deals. Good luck!',
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
