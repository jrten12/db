export interface TutorialStep {
  id: string;
  title: string;
  content: string;
  detail?: string;
  targetTestId?: string;
  fallbackTestId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: 'wave' | 'search' | 'cash' | 'clock' | 'chart' | 'home' | 'hammer' | 'trophy' | 'lightbulb' | 'target' | 'shield' | 'star';
  action?: {
    type: 'tap' | 'observe' | 'scroll';
    label: string;
    completionEvent?: string;
  };
  tip?: string;
  phase: 'welcome' | 'dashboard' | 'property' | 'diligence' | 'proforma' | 'ownership' | 'wrapup';
}

export const tutorialSteps: TutorialStep[] = [
  // PHASE 1: WELCOME
  {
    id: 'welcome',
    title: 'Welcome to Dealbreak!',
    content: 'You\'re about to learn real estate investing by actually doing it. No textbooks, no lectures - just real deals with real consequences.',
    detail: 'You start with $100,000 in cash and 12 months on the clock. Your goal: complete 2 profitable deals before time runs out.',
    icon: 'wave',
    position: 'center',
    phase: 'welcome',
  },
  {
    id: 'how_it_works',
    title: 'How the Game Works',
    content: 'Every month you\'ll browse available properties, research them, crunch the numbers, and decide whether to buy.',
    detail: 'Think of it like house hunting, but you\'re buying properties to make money - either by renting them out for monthly income, or by fixing them up and selling them for a profit.',
    icon: 'lightbulb',
    position: 'center',
    phase: 'welcome',
  },

  // PHASE 2: DASHBOARD ORIENTATION
  {
    id: 'your_cash',
    title: 'Your Cash',
    content: 'This is how much money you have available right now. Every purchase, repair, and fee comes out of this.',
    detail: 'If this hits $0 and you owe money, you\'re bankrupt. Keep an eye on it!',
    targetTestId: 'status-cash-mobile',
    fallbackTestId: 'status-bar',
    icon: 'cash',
    position: 'bottom',
    phase: 'dashboard',
  },
  {
    id: 'your_time',
    title: 'Time Remaining',
    content: 'You have a limited number of months. Research takes time. Renovations take time. Even finding a tenant takes time.',
    detail: 'Every action uses up months, so be strategic about what you spend your time on.',
    targetTestId: 'status-time-mobile',
    fallbackTestId: 'status-bar',
    icon: 'clock',
    position: 'bottom',
    phase: 'dashboard',
  },
  {
    id: 'your_goal',
    title: 'Your Goal',
    content: 'Complete 2 profitable deals to win! A "profitable deal" means you made money - either from rent or from flipping.',
    detail: 'You don\'t need to hit a home run every time. Even small profits count toward your goal.',
    targetTestId: 'status-goal-mobile',
    fallbackTestId: 'status-bar',
    icon: 'trophy',
    position: 'bottom',
    phase: 'dashboard',
  },

  // PHASE 3: PROPERTY BROWSING
  {
    id: 'property_market',
    title: 'The Property Market',
    content: 'These are properties for sale right now. Each card shows the asking price, location, and condition.',
    detail: 'Not every property is a good deal. Part of the game is learning which ones to pursue and which ones to skip.',
    targetTestId: 'property-list',
    icon: 'search',
    position: 'top',
    phase: 'property',
  },
  {
    id: 'tap_property',
    title: 'Tap a Property',
    content: 'Tap any property card to see its full details. You\'ll see photos, financial ranges, and options for research.',
    detail: 'Looking at a property is free and doesn\'t cost any time. Take your time browsing!',
    targetTestId: 'property-list',
    icon: 'target',
    position: 'top',
    phase: 'property',
    action: {
      type: 'tap',
      label: 'Tap any property card to continue',
      completionEvent: 'select_property',
    },
  },

  // PHASE 4: DUE DILIGENCE
  {
    id: 'property_detail',
    title: 'Property Details',
    content: 'Now you can see the full picture. The price ranges shown are estimates - they\'ll get more accurate as you do research.',
    detail: 'Notice the wide ranges? That\'s uncertainty. Research narrows those ranges so you know what you\'re really getting into.',
    targetTestId: 'property-detail-modal',
    icon: 'home',
    position: 'center',
    phase: 'diligence',
  },
  {
    id: 'diligence_intro',
    title: 'Do Your Research First!',
    content: 'Before buying, you should investigate the property. Each research option reveals different information.',
    detail: 'Some research is free (just costs time), while others cost money. Skipping research is risky - you might miss expensive problems!',
    targetTestId: 'due-diligence-section',
    icon: 'shield',
    position: 'bottom',
    phase: 'diligence',
  },
  {
    id: 'diligence_types',
    title: 'Types of Research',
    content: 'Market Rent Study tells you what tenants will actually pay. Comparable Sales shows you what the property is really worth. Contractor Walkthrough reveals repair costs. Inspection finds hidden problems.',
    detail: 'The more research you do, the more confident your numbers will be. Skipping research is like buying a car without test driving it.',
    targetTestId: 'due-diligence-section',
    icon: 'search',
    position: 'bottom',
    phase: 'diligence',
    tip: 'Start with the free options (Market Rent Study and Comparable Sales) - they only cost time, not money.',
  },
  {
    id: 'financial_estimates',
    title: 'Watch Your Estimates Improve',
    content: 'As you complete research, your Financial Estimates panel fills in with better numbers. Wide ranges narrow down to precise values.',
    detail: 'This is the heart of real estate investing - reducing uncertainty before committing your money.',
    targetTestId: 'financial-estimates-panel',
    icon: 'chart',
    position: 'top',
    phase: 'diligence',
  },

  // PHASE 5: PRO FORMA & DEAL
  {
    id: 'strategy_choice',
    title: 'Choose Your Strategy',
    content: 'You have two ways to make money from a property:',
    detail: 'RENT IT OUT - Buy it, maybe fix it up, then collect monthly rent from tenants. Steady income over time.\n\nFLIP IT - Buy it, renovate it, then sell it for more than you paid. Quick one-time profit.',
    targetTestId: 'button-strategy-rent',
    icon: 'lightbulb',
    position: 'top',
    phase: 'proforma',
  },
  {
    id: 'proforma_intro',
    title: 'Build Your Financial Plan',
    content: 'The Pro Forma is where you plug in your assumptions about the deal. How much rent will you charge? How much will repairs cost? How much will you borrow?',
    detail: 'Every field matters. If you guess wrong on rent or repairs, you could lose money. That\'s why research is so important!',
    targetTestId: 'button-pro-forma',
    icon: 'chart',
    position: 'top',
    phase: 'proforma',
    tip: 'Fields glow green when filled in. Fill them all to unlock the Buy button.',
  },
  {
    id: 'making_offer',
    title: 'Ready to Buy?',
    content: 'Once all your numbers are filled in, you can make an offer. The money comes out of your cash immediately.',
    detail: 'Make sure you have enough cash left over for unexpected costs. Going bankrupt means game over!',
    targetTestId: 'button-make-offer',
    icon: 'cash',
    position: 'top',
    phase: 'proforma',
    tip: 'Your first property purchase is protected - the game won\'t let you go bankrupt on deal #1.',
  },

  // PHASE 6: OWNERSHIP & TIME
  {
    id: 'skip_month',
    title: 'Advancing Time',
    content: 'Use "Skip Month" to move time forward. Your rentals collect income, your flips progress through renovation, and new properties appear.',
    detail: 'Each month that passes, things happen: tenants pay rent, contractors work on renovations, and the market changes.',
    targetTestId: 'button-advance-week-mobile-right',
    fallbackTestId: 'button-advance-week',
    icon: 'clock',
    position: 'top',
    phase: 'ownership',
  },
  {
    id: 'market_changes',
    title: 'The Market Changes',
    content: 'Real estate markets go up and down. When you sell a property, the current market conditions affect your sale price.',
    detail: 'A hot market means higher prices. A cold market means lower prices. You can\'t control the market, but you can choose when to sell.',
    icon: 'chart',
    position: 'center',
    phase: 'ownership',
  },

  // PHASE 7: WRAP UP
  {
    id: 'key_lessons',
    title: 'Key Lessons to Remember',
    content: 'Research before buying. Don\'t over-leverage (borrowing too much is risky). Keep cash reserves for surprises. Not every deal is worth doing - it\'s okay to pass.',
    detail: 'The best investors aren\'t the ones who buy the most properties. They\'re the ones who buy the RIGHT properties.',
    icon: 'star',
    position: 'center',
    phase: 'wrapup',
  },
  {
    id: 'tutorial_complete',
    title: 'You\'re Ready!',
    content: 'Go find your first deal. Start with research, trust your numbers, and don\'t be afraid to walk away from a bad deal.',
    detail: 'You can restart this tutorial anytime from the Home screen. Good luck!',
    icon: 'trophy',
    position: 'center',
    phase: 'wrapup',
  },
];

export const PHASE_LABELS: Record<string, string> = {
  welcome: 'Getting Started',
  dashboard: 'Your Dashboard',
  property: 'Finding Properties',
  diligence: 'Doing Research',
  proforma: 'Crunching Numbers',
  ownership: 'Owning Property',
  wrapup: 'Final Tips',
};

export const PHASE_ORDER = ['welcome', 'dashboard', 'property', 'diligence', 'proforma', 'ownership', 'wrapup'];

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

export function getStepProgress(stepId: string): { current: number; total: number; phase: string; phaseIndex: number; totalPhases: number } {
  const step = tutorialSteps.find(s => s.id === stepId);
  const currentIndex = tutorialSteps.findIndex(s => s.id === stepId);
  const phase = step?.phase || 'welcome';
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  return {
    current: currentIndex + 1,
    total: tutorialSteps.length,
    phase: PHASE_LABELS[phase] || phase,
    phaseIndex: phaseIndex + 1,
    totalPhases: PHASE_ORDER.length,
  };
}
