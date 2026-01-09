export interface PropertyIssue {
  id: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  costRangeMin: number;
  costRangeMax: number;
  timelineImpactWeeks: number;
  description: string;
  discoveredBy: ('contractor_walkthrough' | 'inspection' | 'title_search')[];
}

export interface DiligenceOption {
  id: 'market_study' | 'appraisal' | 'contractor_walkthrough' | 'inspection' | 'title_search';
  name: string;
  cost: number;
  timeWeeks: number;
  description: string;
  reveals: string;
  narrowsField: 'rent' | 'arv' | 'rehab' | 'issues' | 'title';
}

export const DILIGENCE_OPTIONS: DiligenceOption[] = [
  {
    id: 'market_study',
    name: 'Market Rent Study',
    cost: 400,
    timeWeeks: 0.5,
    description: 'Analyze comparable rentals to determine achievable rent',
    reveals: 'Narrows rent estimate from speculation to market data',
    narrowsField: 'rent',
  },
  {
    id: 'appraisal',
    name: 'Comparable Sales Analysis',
    cost: 600,
    timeWeeks: 1,
    description: 'Review recent sales to estimate after-repair value',
    reveals: 'Narrows ARV estimate based on actual comps',
    narrowsField: 'arv',
  },
  {
    id: 'contractor_walkthrough',
    name: 'Contractor Walkthrough',
    cost: 1200,
    timeWeeks: 1,
    description: 'Licensed contractor evaluates structural and repair needs',
    reveals: 'Narrows rehab cost and timeline estimates',
    narrowsField: 'rehab',
  },
  {
    id: 'inspection',
    name: 'Property Inspection',
    cost: 450,
    timeWeeks: 0.5,
    description: 'Professional inspector checks for hidden defects',
    reveals: 'Uncovers potential issues: mold, pests, electrical, plumbing',
    narrowsField: 'issues',
  },
  {
    id: 'title_search',
    name: 'Title Search',
    cost: 350,
    timeWeeks: 0.5,
    description: 'Search for liens, encumbrances, and ownership issues',
    reveals: 'Reveals any legal or financial claims on the property',
    narrowsField: 'title',
  },
];

export interface EffectiveRanges {
  rent: { min: number; max: number; known: boolean };
  arv: { min: number; max: number; known: boolean };
  rehab: { min: number; max: number; known: boolean };
  timeline: { min: number; max: number; known: boolean };
}

export function getEffectiveRanges(
  property: { rentMin: number; rentMax: number; arvMin: number; arvMax: number; rehabMin: number; rehabMax: number; timelineMin: number; timelineMax: number; price: number },
  completedDiligence: string[]
): EffectiveRanges {
  const hasMarketStudy = completedDiligence.includes('market_study');
  const hasAppraisal = completedDiligence.includes('appraisal');
  const hasContractorWalkthrough = completedDiligence.includes('contractor_walkthrough');

  const rentMid = (property.rentMin + property.rentMax) / 2;
  const arvMid = (property.arvMin + property.arvMax) / 2;
  const rehabMid = (property.rehabMin + property.rehabMax) / 2;
  const timelineMid = (property.timelineMin + property.timelineMax) / 2;

  return {
    rent: hasMarketStudy 
      ? { min: property.rentMin, max: property.rentMax, known: true }
      : { min: Math.round(rentMid * 0.6), max: Math.round(rentMid * 1.4), known: false },
    arv: hasAppraisal
      ? { min: property.arvMin, max: property.arvMax, known: true }
      : { min: Math.round(arvMid * 0.75), max: Math.round(arvMid * 1.25), known: false },
    rehab: hasContractorWalkthrough
      ? { min: property.rehabMin, max: property.rehabMax, known: true }
      : { min: Math.round(rehabMid * 0.5), max: Math.round(rehabMid * 2), known: false },
    timeline: hasContractorWalkthrough
      ? { min: property.timelineMin, max: property.timelineMax, known: true }
      : { min: Math.max(2, property.timelineMin - 4), max: property.timelineMax + 6, known: false },
  };
}

export const PROPERTY_ISSUES: Record<string, PropertyIssue[]> = {
  'Oakwood Cottage': [
    {
      id: 'roof_wear',
      name: 'Roof Wear',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 6000,
      timelineImpactWeeks: 1,
      description: 'Shingles showing age, may need replacement within 2-3 years',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'outdated_hvac',
      name: 'Outdated HVAC',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 8000,
      timelineImpactWeeks: 2,
      description: 'HVAC system is 15+ years old, efficiency issues',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Riverside Ranch': [
    {
      id: 'foundation_settling',
      name: 'Foundation Settling',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 15000,
      timelineImpactWeeks: 3,
      description: 'Minor cracks indicate foundation movement',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'drainage_issues',
      name: 'Drainage Issues',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Poor grading causing water pooling near foundation',
      discoveredBy: ['inspection'],
    },
  ],
  'Maplewood Colonial': [
    {
      id: 'mold_remediation',
      name: 'Mold in Basement',
      severity: 'severe',
      costRangeMin: 8000,
      costRangeMax: 20000,
      timelineImpactWeeks: 4,
      description: 'Active mold growth requiring professional remediation',
      discoveredBy: ['inspection'],
    },
    {
      id: 'electrical_outdated',
      name: 'Outdated Electrical',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Aluminum wiring and insufficient panel capacity',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'roof_replacement',
      name: 'Roof Replacement Needed',
      severity: 'severe',
      costRangeMin: 12000,
      costRangeMax: 25000,
      timelineImpactWeeks: 3,
      description: 'Multiple leaks, shingles beyond repair',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Downtown Loft': [
    {
      id: 'hvac_commercial',
      name: 'HVAC System Age',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 7000,
      timelineImpactWeeks: 1,
      description: 'Commercial HVAC showing signs of wear',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'hoa_assessment',
      name: 'Pending HOA Assessment',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 15000,
      timelineImpactWeeks: 0,
      description: 'Building-wide assessment for facade repairs announced',
      discoveredBy: ['title_search'],
    },
  ],
  'Elmwood Bungalow': [
    {
      id: 'termite_damage',
      name: 'Termite Damage',
      severity: 'severe',
      costRangeMin: 10000,
      costRangeMax: 30000,
      timelineImpactWeeks: 6,
      description: 'Active infestation with structural damage',
      discoveredBy: ['inspection'],
    },
    {
      id: 'plumbing_galvanized',
      name: 'Galvanized Plumbing',
      severity: 'severe',
      costRangeMin: 8000,
      costRangeMax: 18000,
      timelineImpactWeeks: 3,
      description: 'Original galvanized pipes corroding, full replacement needed',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'asbestos_tiles',
      name: 'Asbestos Floor Tiles',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Original floor tiles contain asbestos, require abatement',
      discoveredBy: ['inspection'],
    },
  ],
  'Hillside Retreat': [
    {
      id: 'septic_issues',
      name: 'Septic System Concerns',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 20000,
      timelineImpactWeeks: 3,
      description: 'Septic system age unknown, may need pumping or replacement',
      discoveredBy: ['inspection'],
    },
    {
      id: 'well_water',
      name: 'Well Water Quality',
      severity: 'mild',
      costRangeMin: 1500,
      costRangeMax: 4000,
      timelineImpactWeeks: 1,
      description: 'Water testing needed, filtration may be required',
      discoveredBy: ['inspection'],
    },
  ],
  'Westside Manor': [
    {
      id: 'cosmetic_updates',
      name: 'Cosmetic Updates',
      severity: 'mild',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Dated finishes need updating for market rate rents',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'pool_equipment',
      name: 'Pool Equipment Age',
      severity: 'moderate',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 1,
      description: 'Pool pump and heater nearing end of life',
      discoveredBy: ['inspection'],
    },
  ],
};

export const getPropertyIssues = (propertyName: string): PropertyIssue[] => {
  return PROPERTY_ISSUES[propertyName] || [];
};

export const getRevealedIssues = (
  propertyName: string,
  completedDiligence: string[]
): PropertyIssue[] => {
  const allIssues = getPropertyIssues(propertyName);
  return allIssues.filter(issue =>
    issue.discoveredBy.some(method => completedDiligence.includes(method))
  );
};

export const getTotalIssuesCostRange = (issues: PropertyIssue[]): { min: number; max: number } => {
  return issues.reduce(
    (acc, issue) => ({
      min: acc.min + issue.costRangeMin,
      max: acc.max + issue.costRangeMax,
    }),
    { min: 0, max: 0 }
  );
};

export const getTotalTimelineImpact = (issues: PropertyIssue[]): number => {
  return issues.reduce((acc, issue) => acc + issue.timelineImpactWeeks, 0);
};

export const getContractorCosts = (issues: PropertyIssue[], type: 'cheap' | 'fast'): { min: number; max: number; weeks: number } => {
  const baseCost = getTotalIssuesCostRange(issues);
  const baseTimeline = getTotalTimelineImpact(issues);
  
  if (type === 'cheap') {
    return {
      min: Math.round(baseCost.min * 0.85),
      max: Math.round(baseCost.max * 0.95),
      weeks: Math.ceil(baseTimeline * 1.5),
    };
  } else {
    return {
      min: Math.round(baseCost.min * 1.25),
      max: Math.round(baseCost.max * 1.4),
      weeks: Math.ceil(baseTimeline * 0.7),
    };
  }
};