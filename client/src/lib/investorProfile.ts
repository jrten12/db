import type { Deal, Property, PropertyInvestigation } from '@shared/schema';

export type InvestorProfileType = 
  | 'conservative_cashflow' 
  | 'aggressive_appreciation' 
  | 'high_risk_opportunist' 
  | 'detail_oriented_operator'
  | 'balanced_investor'
  | 'cautious_newcomer';

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
}

const INVESTOR_PROFILES: Record<InvestorProfileType, InvestorProfile> = {
  conservative_cashflow: {
    type: 'conservative_cashflow',
    title: 'Conservative Cash Flow Investor',
    description: 'You prioritize steady rental income over quick profits. Low leverage and thorough due diligence define your approach.',
    icon: 'landmark',
    color: 'emerald',
    traits: [
      'Prefers rental properties for steady income',
      'Uses conservative leverage (under 70% LTV)',
      'Never skips due diligence',
      'Values cash flow over appreciation'
    ]
  },
  aggressive_appreciation: {
    type: 'aggressive_appreciation',
    title: 'Aggressive Appreciation Chaser',
    description: 'You bet on property values going up. High leverage and quick flips are your specialty.',
    icon: 'trending-up',
    color: 'blue',
    traits: [
      'Focuses on flip deals for quick profits',
      'Uses high leverage to maximize returns',
      'Moves fast, sometimes skipping diligence',
      'Bets on market appreciation'
    ]
  },
  high_risk_opportunist: {
    type: 'high_risk_opportunist',
    title: 'High-Risk Opportunist',
    description: 'You take big swings with minimal research. Sometimes it pays off big, sometimes it doesn\'t.',
    icon: 'zap',
    color: 'red',
    traits: [
      'Minimal due diligence on deals',
      'Maximum leverage on purchases',
      'Quick decisions, high volume',
      'Embraces uncertainty for potential upside'
    ]
  },
  detail_oriented_operator: {
    type: 'detail_oriented_operator',
    title: 'Detail-Oriented Operator',
    description: 'You leave nothing to chance. Every deal is thoroughly researched before you commit.',
    icon: 'search',
    color: 'purple',
    traits: [
      'Completes all available due diligence',
      'Takes time to analyze each opportunity',
      'Balanced approach to strategy',
      'Minimizes surprises through preparation'
    ]
  },
  balanced_investor: {
    type: 'balanced_investor',
    title: 'Balanced Investor',
    description: 'You blend cash flow and appreciation strategies with moderate risk management.',
    icon: 'scale',
    color: 'amber',
    traits: [
      'Mix of rental and flip properties',
      'Moderate leverage (70-85% LTV)',
      'Selective due diligence based on deal size',
      'Adaptable to market conditions'
    ]
  },
  cautious_newcomer: {
    type: 'cautious_newcomer',
    title: 'Cautious Newcomer',
    description: 'You\'re still finding your style. Fewer deals but careful analysis shows promise.',
    icon: 'sprout',
    color: 'teal',
    traits: [
      'Taking time to learn the market',
      'Careful with each decision',
      'Building experience gradually',
      'Room to develop a signature style'
    ]
  }
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
  
  const rentalDeals = completedDeals.filter(d => d.strategy === 'rent');
  const flipDeals = completedDeals.filter(d => d.strategy === 'flip');
  
  const ltvValues = completedDeals.map(d => {
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
  
  const purchasedPropertyIds = new Set(completedDeals.map(d => d.propertyId));
  
  let completedDiligenceItems = 0;
  const diligenceTypesAvailable = 4;
  let totalPossibleDiligence = purchasedPropertyIds.size * diligenceTypesAvailable;
  
  purchasedPropertyIds.forEach(propId => {
    const propInvestigations = investigations.filter(i => i.propertyId === propId);
    completedDiligenceItems += Math.min(propInvestigations.length, diligenceTypesAvailable);
  });
  
  const skippedDiligenceDeals = completedDeals.filter(d => {
    const propInvestigations = investigations.filter(i => i.propertyId === d.propertyId);
    return propInvestigations.length < 2;
  }).length;
  
  const fullDiligenceDeals = completedDeals.filter(d => {
    const propInvestigations = investigations.filter(i => i.propertyId === d.propertyId);
    return propInvestigations.length >= 4;
  }).length;
  
  const highLeverageDeals = completedDeals.filter(d => {
    const inputs = d.proFormaInputs as any;
    return (inputs?.ltv || 75) >= 85;
  }).length;
  
  const conservativeDeals = completedDeals.filter(d => {
    const inputs = d.proFormaInputs as any;
    return (inputs?.ltv || 75) <= 70;
  }).length;
  
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
    conservativeDeals
  };
}

export function calculateScorecard(stats: GameStats): PlayerScorecard {
  const riskTolerance = Math.min(100, Math.max(0, 
    ((stats.averageLTV - 50) / 50) * 60 +
    (stats.highLeverageDeals / Math.max(1, stats.totalDeals)) * 40
  ));
  
  const dueDiligenceThoroughness = stats.totalPossibleDiligence > 0
    ? Math.min(100, (stats.completedDiligenceItems / stats.totalPossibleDiligence) * 100)
    : 50;
  
  const cashFlowVsAppreciation = stats.totalDeals > 0
    ? (stats.rentalDeals / stats.totalDeals) * 100
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

export function classifyInvestorProfile(stats: GameStats, scorecard: PlayerScorecard): InvestorProfile {
  if (stats.totalDeals < 2) {
    return INVESTOR_PROFILES.cautious_newcomer;
  }
  
  if (scorecard.dueDiligenceThoroughness >= 75 && stats.fullDiligenceDeals >= stats.totalDeals * 0.6) {
    return INVESTOR_PROFILES.detail_oriented_operator;
  }
  
  if (scorecard.riskTolerance >= 70 && scorecard.dueDiligenceThoroughness < 40) {
    return INVESTOR_PROFILES.high_risk_opportunist;
  }
  
  if (scorecard.cashFlowVsAppreciation >= 65 && scorecard.riskTolerance < 50) {
    return INVESTOR_PROFILES.conservative_cashflow;
  }
  
  if (scorecard.cashFlowVsAppreciation <= 35 && scorecard.riskTolerance >= 50) {
    return INVESTOR_PROFILES.aggressive_appreciation;
  }
  
  return INVESTOR_PROFILES.balanced_investor;
}

export function getInvestorProfile(type: InvestorProfileType): InvestorProfile {
  return INVESTOR_PROFILES[type];
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
