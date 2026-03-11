import type { Deal, Property, PropertyInvestigation, GameRun } from '@shared/schema';

export type InvestorProfileType = 
  | 'conservative_cashflow' 
  | 'aggressive_appreciation' 
  | 'high_risk_opportunist' 
  | 'detail_oriented_operator'
  | 'balanced_investor'
  | 'cautious_newcomer'
  | 'methodical_researcher'
  | 'quick_starter';

export interface InvestorProfile {
  type: InvestorProfileType;
  title: string;
  description: string;
  icon: string;
  color: string;
  traits: string[];
}

export interface PlayerScorecard {
  riskTolerance: number;
  dueDiligenceThoroughness: number;
  cashFlowVsAppreciation: number;
  capitalEfficiency: number;
  overallScore: number;
  
  riskToleranceLabel: string;
  dueDiligenceLabel: string;
  strategyLabel: string;
  efficiencyLabel: string;
}

export interface GameStats {
  totalDeals: number;
  rentalDeals: number;
  flipDeals: number;
  averageLTV: number;
  completedDiligenceItems: number;
  totalPossibleDiligence: number;
  totalInvested: number;
  totalProfit: number;
  weeksUsed: number;
  skippedDiligenceDeals: number;
  fullDiligenceDeals: number;
  highLeverageDeals: number;
  conservativeDeals: number;
  pipelineDeals: number;
  activeRentals: number;
  inRehabDeals: number;
  totalInvestigations: number;
  propertiesResearched: number;
}

const BASE_PROFILES: Record<string, Omit<InvestorProfile, 'traits'>> = {
  conservative_cashflow: {
    type: 'conservative_cashflow',
    title: 'Conservative Cash Flow Investor',
    description: 'You prioritize steady rental income over quick profits. Low leverage and thorough due diligence define your approach.',
    icon: 'landmark',
    color: 'emerald',
  },
  aggressive_appreciation: {
    type: 'aggressive_appreciation',
    title: 'Aggressive Appreciation Chaser',
    description: 'You bet on property values going up. High leverage and quick flips are your specialty.',
    icon: 'trending-up',
    color: 'blue',
  },
  high_risk_opportunist: {
    type: 'high_risk_opportunist',
    title: 'High-Risk Opportunist',
    description: 'You take big swings with minimal research. Sometimes it pays off big, sometimes it doesn\'t.',
    icon: 'zap',
    color: 'red',
  },
  detail_oriented_operator: {
    type: 'detail_oriented_operator',
    title: 'Detail-Oriented Operator',
    description: 'You leave nothing to chance. Every deal is thoroughly researched before you commit.',
    icon: 'search',
    color: 'purple',
  },
  balanced_investor: {
    type: 'balanced_investor',
    title: 'Balanced Investor',
    description: 'You blend cash flow and appreciation strategies with moderate risk management.',
    icon: 'scale',
    color: 'amber',
  },
  cautious_newcomer: {
    type: 'cautious_newcomer',
    title: 'Cautious Newcomer',
    description: 'You\'re still finding your style. Fewer deals but careful analysis shows promise.',
    icon: 'sprout',
    color: 'teal',
  },
  methodical_researcher: {
    type: 'methodical_researcher' as InvestorProfileType,
    title: 'Methodical Researcher',
    description: 'You believe in doing your homework. Properties get thoroughly analyzed before you commit a dollar.',
    icon: 'search',
    color: 'purple',
  },
  quick_starter: {
    type: 'quick_starter' as InvestorProfileType,
    title: 'Quick Starter',
    description: 'You jumped into deals fast. Speed can mean opportunity — or unexpected surprises.',
    icon: 'zap',
    color: 'blue',
  },
};

export function calculateGameStats(
  deals: Deal[],
  investigations: PropertyInvestigation[],
  properties: Property[],
  weeksUsed: number
): GameStats {
  const completedDeals = deals.filter(d => 
    d.status === 'completed' || 
    d.status === 'active_rental' || 
    d.status === 'sold_rental'
  );

  const allActiveDealStatuses = ['purchased', 'in_rehab', 'active_rental', 'completed', 'sold_rental'];
  const allActiveDeals = deals.filter(d => allActiveDealStatuses.includes(d.status || ''));
  
  const rentalDeals = completedDeals.filter(d => d.strategy === 'rent');
  const flipDeals = completedDeals.filter(d => d.strategy === 'flip');
  
  const dealsForLTV = allActiveDeals.length > 0 ? allActiveDeals : completedDeals;
  const ltvValues = dealsForLTV.map(d => {
    const inputs = d.proFormaInputs as any;
    return inputs?.ltv || 75;
  });
  const averageLTV = ltvValues.length > 0 
    ? ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length 
    : 75;
  
  const totalInvested = completedDeals.reduce((sum, d) => {
    const outputs = d.proFormaOutputs as any;
    return sum + (outputs?.totalCashInvested || d.purchasePrice || 0);
  }, 0);
  
  const totalProfit = completedDeals.reduce((sum, d) => {
    const profit = d.actualProfit || 0;
    return sum + profit;
  }, 0);
  
  const purchasedPropertyIds = new Set(allActiveDeals.map(d => d.propertyId));
  
  let completedDiligenceItems = 0;
  const diligenceTypesAvailable = 4;
  let totalPossibleDiligence = purchasedPropertyIds.size * diligenceTypesAvailable;
  
  purchasedPropertyIds.forEach(propId => {
    const propInvestigations = investigations.filter(i => i.propertyId === propId);
    completedDiligenceItems += Math.min(propInvestigations.length, diligenceTypesAvailable);
  });
  
  const skippedDiligenceDeals = allActiveDeals.filter(d => {
    const propInvestigations = investigations.filter(i => i.propertyId === d.propertyId);
    return propInvestigations.length < 2;
  }).length;
  
  const fullDiligenceDeals = allActiveDeals.filter(d => {
    const propInvestigations = investigations.filter(i => i.propertyId === d.propertyId);
    return propInvestigations.length >= 4;
  }).length;
  
  const highLeverageDeals = allActiveDeals.filter(d => {
    const inputs = d.proFormaInputs as any;
    return (inputs?.ltv || 75) >= 85;
  }).length;
  
  const conservativeDeals = allActiveDeals.filter(d => {
    const inputs = d.proFormaInputs as any;
    return (inputs?.ltv || 75) <= 70;
  }).length;

  const pipelineDeals = deals.filter(d => d.status === 'purchased' || d.status === 'in_rehab').length;
  const activeRentals = deals.filter(d => d.status === 'active_rental').length;
  const inRehabDeals = deals.filter(d => d.status === 'in_rehab').length;

  const researchedPropertyIds = new Set(investigations.map(i => i.propertyId));
  
  return {
    totalDeals: completedDeals.length,
    rentalDeals: rentalDeals.length,
    flipDeals: flipDeals.length,
    averageLTV,
    completedDiligenceItems,
    totalPossibleDiligence,
    totalInvested,
    totalProfit,
    weeksUsed,
    skippedDiligenceDeals,
    fullDiligenceDeals,
    highLeverageDeals,
    conservativeDeals,
    pipelineDeals,
    activeRentals,
    inRehabDeals,
    totalInvestigations: investigations.length,
    propertiesResearched: researchedPropertyIds.size,
  };
}

export function calculateScorecard(stats: GameStats): PlayerScorecard {
  const dealCount = Math.max(stats.totalDeals, stats.pipelineDeals + stats.totalDeals);

  const riskTolerance = Math.min(100, Math.max(0, 
    ((stats.averageLTV - 50) / 50) * 60 +
    (stats.highLeverageDeals / Math.max(1, dealCount)) * 40
  ));
  
  const dueDiligenceThoroughness = stats.totalPossibleDiligence > 0
    ? Math.min(100, (stats.completedDiligenceItems / stats.totalPossibleDiligence) * 100)
    : stats.totalInvestigations > 0
      ? Math.min(100, stats.totalInvestigations * 15)
      : 50;
  
  const cashFlowVsAppreciation = stats.totalDeals > 0
    ? (stats.rentalDeals / stats.totalDeals) * 100
    : stats.activeRentals > 0 ? 70
    : stats.inRehabDeals > 0 ? 30
    : 50;
  
  const roi = stats.totalInvested > 0 
    ? (stats.totalProfit / stats.totalInvested) * 100 
    : 0;
  const capitalEfficiency = Math.min(100, Math.max(0, 
    50 + roi * 2
  ));
  
  const overallScore = Math.round(
    (dueDiligenceThoroughness * 0.3) +
    (capitalEfficiency * 0.4) +
    ((100 - Math.abs(riskTolerance - 50)) * 0.15) +
    ((100 - Math.abs(cashFlowVsAppreciation - 50)) * 0.15)
  );
  
  let riskToleranceLabel: string;
  if (riskTolerance < 30) riskToleranceLabel = 'Very Conservative';
  else if (riskTolerance < 50) riskToleranceLabel = 'Moderate';
  else if (riskTolerance < 70) riskToleranceLabel = 'Aggressive';
  else riskToleranceLabel = 'Very Aggressive';
  
  let dueDiligenceLabel: string;
  if (dueDiligenceThoroughness < 30) dueDiligenceLabel = 'Minimal Research';
  else if (dueDiligenceThoroughness < 60) dueDiligenceLabel = 'Selective Research';
  else if (dueDiligenceThoroughness < 85) dueDiligenceLabel = 'Thorough Research';
  else dueDiligenceLabel = 'Exhaustive Research';
  
  let strategyLabel: string;
  if (cashFlowVsAppreciation < 25) strategyLabel = 'Pure Flipper';
  else if (cashFlowVsAppreciation < 45) strategyLabel = 'Flip-Focused';
  else if (cashFlowVsAppreciation < 55) strategyLabel = 'Balanced';
  else if (cashFlowVsAppreciation < 75) strategyLabel = 'Rental-Focused';
  else strategyLabel = 'Pure Landlord';
  
  let efficiencyLabel: string;
  if (capitalEfficiency < 30) efficiencyLabel = 'Needs Improvement';
  else if (capitalEfficiency < 50) efficiencyLabel = 'Below Average';
  else if (capitalEfficiency < 70) efficiencyLabel = 'Average';
  else if (capitalEfficiency < 85) efficiencyLabel = 'Above Average';
  else efficiencyLabel = 'Exceptional';
  
  return {
    riskTolerance: Math.round(riskTolerance),
    dueDiligenceThoroughness: Math.round(dueDiligenceThoroughness),
    cashFlowVsAppreciation: Math.round(cashFlowVsAppreciation),
    capitalEfficiency: Math.round(capitalEfficiency),
    overallScore,
    riskToleranceLabel,
    dueDiligenceLabel,
    strategyLabel,
    efficiencyLabel
  };
}

function generateDynamicTraits(
  stats: GameStats,
  scorecard: PlayerScorecard,
  gameRun: GameRun,
  deals: Deal[]
): string[] {
  const traits: string[] = [];
  const monthsUsed = 52 - (gameRun.weeksRemaining || 0);
  const cashPct = (gameRun.cash / 100000) * 100;

  if (stats.totalDeals === 0 && stats.pipelineDeals === 0) {
    if (stats.propertiesResearched >= 3) {
      traits.push(`Researched ${stats.propertiesResearched} properties before buying`);
    } else if (stats.totalInvestigations > 0) {
      traits.push('Starting to investigate properties');
    } else if (monthsUsed <= 3) {
      traits.push('Taking time to learn the market');
    } else {
      traits.push('Still scouting for the right opportunity');
    }

    if (cashPct >= 95) {
      traits.push('Keeping cash reserves intact');
    } else if (cashPct < 50) {
      traits.push('Spending on research and due diligence');
    }

    traits.push('Building experience gradually');
    traits.push('Room to develop a signature style');
    return traits;
  }

  if (stats.totalDeals + stats.pipelineDeals >= 1) {
    if (stats.flipDeals > 0 && (stats.rentalDeals > 0 || stats.activeRentals > 0)) {
      const rentalCount = Math.max(stats.rentalDeals, stats.activeRentals);
      traits.push(`Diversified: ${stats.flipDeals} flip${stats.flipDeals > 1 ? 's' : ''} and ${rentalCount} rental${rentalCount > 1 ? 's' : ''}`);
    } else if (stats.flipDeals > 0) {
      traits.push(`Flip-focused — ${stats.flipDeals} completed flip${stats.flipDeals > 1 ? 's' : ''}`);
    } else if (stats.rentalDeals > 0 || stats.activeRentals > 0) {
      const rentalCount = Math.max(stats.rentalDeals, stats.activeRentals);
      traits.push(`Building rental portfolio — ${rentalCount} rental propert${rentalCount > 1 ? 'ies' : 'y'}`);
    } else if (stats.inRehabDeals > 0) {
      traits.push(`${stats.inRehabDeals} propert${stats.inRehabDeals > 1 ? 'ies' : 'y'} currently in rehab`);
    } else if (stats.pipelineDeals > 0 && stats.totalDeals === 0) {
      traits.push(`${stats.pipelineDeals} deal${stats.pipelineDeals > 1 ? 's' : ''} in the pipeline — waiting to close`);
    }
  }

  if (stats.fullDiligenceDeals > 0) {
    const rate = stats.totalDeals + stats.pipelineDeals > 0
      ? Math.round((stats.fullDiligenceDeals / (stats.totalDeals + stats.pipelineDeals)) * 100)
      : 0;
    if (rate >= 80) {
      traits.push('Full due diligence on nearly every deal');
    } else if (rate >= 50) {
      traits.push('Thorough research on most purchases');
    }
  } else if (stats.skippedDiligenceDeals > 0 && stats.totalDeals + stats.pipelineDeals > 0) {
    traits.push('Skipping due diligence on some deals');
  } else if (stats.propertiesResearched > 0 && stats.totalDeals === 0) {
    traits.push(`Researching before committing — ${stats.propertiesResearched} properties analyzed`);
  }

  if (stats.averageLTV >= 90) {
    traits.push(`High leverage strategy — averaging ${Math.round(stats.averageLTV)}% LTV`);
  } else if (stats.averageLTV <= 65) {
    traits.push(`Conservative financing — averaging ${Math.round(stats.averageLTV)}% LTV`);
  } else if (stats.totalDeals + stats.pipelineDeals > 0) {
    traits.push(`Moderate leverage at ${Math.round(stats.averageLTV)}% LTV`);
  }

  if (stats.totalProfit > 0 && stats.totalDeals > 0) {
    const roi = stats.totalInvested > 0 ? (stats.totalProfit / stats.totalInvested) * 100 : 0;
    if (roi >= 20) {
      traits.push(`Strong returns — ${Math.round(roi)}% ROI so far`);
    } else if (roi >= 5) {
      traits.push(`Profitable — ${Math.round(roi)}% ROI on closed deals`);
    } else {
      traits.push('Thin margins on completed deals');
    }
  } else if (stats.totalProfit < 0 && stats.totalDeals > 0) {
    traits.push('Learning from losses — refining strategy');
  }

  if (cashPct < 20 && stats.totalDeals > 0) {
    traits.push('Cash reserves running low');
  } else if (cashPct > 150 && monthsUsed > 10) {
    traits.push('Sitting on significant cash reserves');
  }

  if (stats.totalDeals + stats.pipelineDeals === 1 && monthsUsed <= 8) {
    traits.push('Moved quickly on first deal');
  } else if (stats.totalDeals === 0 && monthsUsed > 15) {
    traits.push('Patient approach — still waiting for the right deal');
  }

  return traits.slice(0, 4);
}

export function classifyInvestorProfile(stats: GameStats, scorecard: PlayerScorecard): InvestorProfile {
  if (stats.totalDeals >= 2) {
    return classifyEstablishedProfile(stats, scorecard);
  }

  const hasActivity = stats.pipelineDeals > 0 || stats.totalDeals >= 1;

  if (hasActivity) {
    return classifyEarlyProfile(stats, scorecard);
  }

  if (stats.propertiesResearched >= 3) {
    return {
      ...BASE_PROFILES.methodical_researcher,
      traits: [],
    };
  }

  return {
    ...BASE_PROFILES.cautious_newcomer,
    traits: [],
  };
}

function classifyEstablishedProfile(stats: GameStats, scorecard: PlayerScorecard): InvestorProfile {
  if (scorecard.dueDiligenceThoroughness >= 75 && stats.fullDiligenceDeals >= (stats.totalDeals + stats.pipelineDeals) * 0.6) {
    return { ...BASE_PROFILES.detail_oriented_operator, traits: [] };
  }
  
  if (scorecard.riskTolerance >= 70 && scorecard.dueDiligenceThoroughness < 40) {
    return { ...BASE_PROFILES.high_risk_opportunist, traits: [] };
  }
  
  if (scorecard.cashFlowVsAppreciation >= 65 && scorecard.riskTolerance < 50) {
    return { ...BASE_PROFILES.conservative_cashflow, traits: [] };
  }
  
  if (scorecard.cashFlowVsAppreciation <= 35 && scorecard.riskTolerance >= 50) {
    return { ...BASE_PROFILES.aggressive_appreciation, traits: [] };
  }
  
  return { ...BASE_PROFILES.balanced_investor, traits: [] };
}

function classifyEarlyProfile(stats: GameStats, scorecard: PlayerScorecard): InvestorProfile {
  if (scorecard.dueDiligenceThoroughness >= 70) {
    return { ...BASE_PROFILES.methodical_researcher, traits: [] };
  }

  if (scorecard.dueDiligenceThoroughness < 30 && scorecard.riskTolerance >= 60) {
    return { ...BASE_PROFILES.quick_starter, traits: [] };
  }

  if (stats.activeRentals > 0 && scorecard.riskTolerance < 50) {
    return { ...BASE_PROFILES.conservative_cashflow, traits: [] };
  }

  if (stats.inRehabDeals > 0 && scorecard.riskTolerance >= 50) {
    return { ...BASE_PROFILES.aggressive_appreciation, traits: [] };
  }

  return { ...BASE_PROFILES.balanced_investor, traits: [] };
}

export function getDynamicProfile(
  stats: GameStats,
  scorecard: PlayerScorecard,
  gameRun: GameRun,
  deals: Deal[]
): InvestorProfile {
  const baseProfile = classifyInvestorProfile(stats, scorecard);
  const dynamicTraits = generateDynamicTraits(stats, scorecard, gameRun, deals);

  const monthsUsed = 52 - (gameRun.weeksRemaining || 0);
  let description = baseProfile.description;

  if (stats.totalDeals === 0 && stats.pipelineDeals === 0) {
    if (stats.propertiesResearched >= 3) {
      description = `You've analyzed ${stats.propertiesResearched} properties without buying yet. Knowledge is power — when you strike, you'll be informed.`;
    } else if (monthsUsed <= 5) {
      description = "You're still finding your style. Fewer deals but careful analysis shows promise.";
    } else if (monthsUsed > 20) {
      description = "Taking the slow approach. The clock is ticking — the best investors act on their research.";
    } else {
      description = "You're surveying the landscape. Time to start narrowing down on a target property.";
    }
  } else if (stats.totalDeals === 0 && stats.pipelineDeals > 0) {
    description = `You have ${stats.pipelineDeals} deal${stats.pipelineDeals > 1 ? 's' : ''} in the pipeline. Your investing style will take shape as deals close.`;
  } else if (stats.totalDeals === 1) {
    const deal = deals.find(d => d.status === 'completed' || d.status === 'active_rental' || d.status === 'sold_rental');
    if (deal && (deal.actualProfit || 0) > 0) {
      description = "Your first deal was profitable. One down — keep the momentum going.";
    } else if (deal && (deal.actualProfit || 0) < 0) {
      description = "First deal didn't go as planned, but every investor learns from the first one. Adjust and go again.";
    } else {
      description = "You've closed your first deal. Your investing personality is starting to emerge.";
    }
  }

  return {
    ...baseProfile,
    description,
    traits: dynamicTraits,
  };
}

export function getInvestorProfile(type: InvestorProfileType): InvestorProfile {
  const base = BASE_PROFILES[type];
  if (!base) return { ...BASE_PROFILES.cautious_newcomer, traits: [] };
  return { ...base, traits: [] };
}

export interface Benchmark {
  metric: string;
  playerValue: number;
  averageValue: number;
  percentile: number;
  message: string;
  isPositive: boolean;
}

export function generateBenchmarks(
  stats: GameStats,
  scorecard: PlayerScorecard,
  aggregateStats?: {
    avgDiligenceRate: number;
    avgROI: number;
    avgDealsPerGame: number;
    avgLTV: number;
  }
): Benchmark[] {
  const benchmarks: Benchmark[] = [];
  
  const defaults = aggregateStats || {
    avgDiligenceRate: 45,
    avgROI: 12,
    avgDealsPerGame: 2.5,
    avgLTV: 78
  };
  
  const playerDiligenceRate = scorecard.dueDiligenceThoroughness;
  const diligencePercentile = Math.min(100, Math.max(0, 
    50 + (playerDiligenceRate - defaults.avgDiligenceRate) * 1.5
  ));
  
  benchmarks.push({
    metric: 'Due Diligence Completion',
    playerValue: playerDiligenceRate,
    averageValue: defaults.avgDiligenceRate,
    percentile: Math.round(diligencePercentile),
    message: diligencePercentile >= 80
      ? 'Top 20% in due diligence completion rate'
      : diligencePercentile >= 50
        ? 'Above-average research on your deals'
        : 'Most players do more research before buying',
    isPositive: diligencePercentile >= 50
  });
  
  const playerROI = stats.totalInvested > 0 
    ? (stats.totalProfit / stats.totalInvested) * 100 
    : 0;
  const roiPercentile = Math.min(100, Math.max(0,
    50 + (playerROI - defaults.avgROI) * 3
  ));
  
  benchmarks.push({
    metric: 'Return on Investment',
    playerValue: Math.round(playerROI),
    averageValue: defaults.avgROI,
    percentile: Math.round(roiPercentile),
    message: roiPercentile >= 80
      ? 'Top 20% ROI for this market!'
      : roiPercentile >= 50
        ? 'Solid returns on your investments'
        : 'Room to improve your profit margins',
    isPositive: roiPercentile >= 50
  });
  
  const dealsPercentile = Math.min(100, Math.max(0,
    50 + (stats.totalDeals - defaults.avgDealsPerGame) * 15
  ));
  
  benchmarks.push({
    metric: 'Deal Volume',
    playerValue: stats.totalDeals,
    averageValue: defaults.avgDealsPerGame,
    percentile: Math.round(dealsPercentile),
    message: dealsPercentile >= 70
      ? 'High-volume investor - more active than most players'
      : dealsPercentile >= 40
        ? 'Typical deal activity for your time'
        : 'Selective approach - fewer deals than average',
    isPositive: dealsPercentile >= 40
  });
  
  const ltvDiff = Math.abs(stats.averageLTV - defaults.avgLTV);
  const isLowerLTV = stats.averageLTV < defaults.avgLTV;
  
  benchmarks.push({
    metric: 'Leverage Usage',
    playerValue: Math.round(stats.averageLTV),
    averageValue: defaults.avgLTV,
    percentile: isLowerLTV ? 60 + ltvDiff : 40 - ltvDiff * 0.5,
    message: isLowerLTV
      ? 'More conservative leverage than most investors'
      : stats.averageLTV > 85
        ? 'High leverage strategy - riskier than most players'
        : 'Typical leverage for this market',
    isPositive: stats.averageLTV <= 80
  });
  
  return benchmarks;
}
