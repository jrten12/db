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
      name: 'Outdated Electrical Panel',
      severity: 'moderate',
      costRangeMin: 3000,
      costRangeMax: 7000,
      timelineImpactWeeks: 2,
      description: 'Panel needs upgrade for modern appliances and safety',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Downtown Loft': [
    {
      id: 'plumbing_galvanized',
      name: 'Galvanized Plumbing',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Old galvanized pipes corroding, should be replaced',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'hoa_assessment',
      name: 'Pending HOA Assessment',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 0,
      description: 'Building has upcoming special assessment for lobby renovation',
      discoveredBy: ['title_search'],
    },
  ],
  'Sunset Duplex': [
    {
      id: 'termite_damage',
      name: 'Termite Damage',
      severity: 'severe',
      costRangeMin: 6000,
      costRangeMax: 15000,
      timelineImpactWeeks: 3,
      description: 'Active termite infestation with structural damage',
      discoveredBy: ['inspection'],
    },
    {
      id: 'septic_issues',
      name: 'Septic System Issues',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Septic tank needs pumping and drain field repair',
      discoveredBy: ['inspection'],
    },
  ],
  'Hillcrest Townhome': [
    {
      id: 'siding_damage',
      name: 'Damaged Siding',
      severity: 'mild',
      costRangeMin: 2500,
      costRangeMax: 6000,
      timelineImpactWeeks: 1,
      description: 'Several sections of siding damaged by weather',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'window_seals',
      name: 'Failed Window Seals',
      severity: 'mild',
      costRangeMin: 1500,
      costRangeMax: 4000,
      timelineImpactWeeks: 1,
      description: 'Condensation between panes indicates seal failure',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Lakeside Retreat': [
    {
      id: 'dock_repair',
      name: 'Dock Needs Repair',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Dock structure rotting, needs major repair or replacement',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'radon_mitigation',
      name: 'Radon Levels High',
      severity: 'moderate',
      costRangeMin: 1500,
      costRangeMax: 3500,
      timelineImpactWeeks: 1,
      description: 'Radon test shows elevated levels, mitigation system needed',
      discoveredBy: ['inspection'],
    },
  ],
  'Garden District Gem': [
    {
      id: 'tree_root_damage',
      name: 'Tree Root Damage',
      severity: 'moderate',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 2,
      description: 'Large tree roots damaging foundation and driveway',
      discoveredBy: ['inspection'],
    },
    {
      id: 'lead_paint',
      name: 'Lead Paint Present',
      severity: 'moderate',
      costRangeMin: 2000,
      costRangeMax: 6000,
      timelineImpactWeeks: 1,
      description: 'Pre-1978 home with lead paint requiring disclosure and potential remediation',
      discoveredBy: ['inspection'],
    },
  ],
  'Metro View Condo': [
    {
      id: 'hvac_replacement',
      name: 'HVAC End of Life',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 9000,
      timelineImpactWeeks: 1,
      description: 'HVAC system is 18 years old and inefficient',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Suburban Split-Level': [
    {
      id: 'asbestos_tiles',
      name: 'Asbestos Floor Tiles',
      severity: 'moderate',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 2,
      description: 'Basement floor tiles contain asbestos, need encapsulation or removal',
      discoveredBy: ['inspection'],
    },
    {
      id: 'sump_pump',
      name: 'Sump Pump Failure',
      severity: 'mild',
      costRangeMin: 800,
      costRangeMax: 2000,
      timelineImpactWeeks: 0.5,
      description: 'Sump pump not functioning, basement flooding risk',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Craftsman Bungalow': [
    {
      id: 'porch_rot',
      name: 'Porch Wood Rot',
      severity: 'moderate',
      costRangeMin: 3500,
      costRangeMax: 9000,
      timelineImpactWeeks: 2,
      description: 'Original craftsman porch has extensive wood rot',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'knob_tube',
      name: 'Knob and Tube Wiring',
      severity: 'severe',
      costRangeMin: 8000,
      costRangeMax: 18000,
      timelineImpactWeeks: 4,
      description: 'Original knob and tube wiring throughout, insurance issue',
      discoveredBy: ['inspection'],
    },
  ],
  'Warehouse Conversion': [
    {
      id: 'fire_suppression',
      name: 'Fire Suppression Upgrade',
      severity: 'severe',
      costRangeMin: 10000,
      costRangeMax: 25000,
      timelineImpactWeeks: 4,
      description: 'Fire suppression system needs modernization for residential code',
      discoveredBy: ['inspection'],
    },
    {
      id: 'loading_dock',
      name: 'Loading Dock Conversion',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Old loading dock needs conversion to proper entrance',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Victorian Fixer': [
    {
      id: 'foundation_major',
      name: 'Major Foundation Work',
      severity: 'severe',
      costRangeMin: 15000,
      costRangeMax: 40000,
      timelineImpactWeeks: 6,
      description: 'Significant foundation settling requiring pier installation',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'chimney_rebuild',
      name: 'Chimney Rebuild',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Chimney masonry crumbling, needs partial rebuild',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Beachfront Bungalow': [
    {
      id: 'salt_corrosion',
      name: 'Salt Air Corrosion',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Metal fixtures and pipes corroded from salt air exposure',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'hurricane_straps',
      name: 'Missing Hurricane Straps',
      severity: 'moderate',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Roof not properly secured for hurricane zone',
      discoveredBy: ['inspection'],
    },
  ],
  'Mountain Cabin': [
    {
      id: 'well_pump',
      name: 'Well Pump Issues',
      severity: 'moderate',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 1,
      description: 'Well pump aging, pressure inconsistent',
      discoveredBy: ['inspection'],
    },
    {
      id: 'wood_stove',
      name: 'Wood Stove Non-Compliant',
      severity: 'mild',
      costRangeMin: 1500,
      costRangeMax: 4000,
      timelineImpactWeeks: 1,
      description: 'Wood stove installation not up to current code',
      discoveredBy: ['inspection'],
    },
  ],
  'Golf Course Villa': [
    {
      id: 'irrigation_repair',
      name: 'Irrigation System Repair',
      severity: 'mild',
      costRangeMin: 1500,
      costRangeMax: 4000,
      timelineImpactWeeks: 0.5,
      description: 'Lawn irrigation system has multiple leaks and broken heads',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'pool_resurface',
      name: 'Pool Needs Resurfacing',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 15000,
      timelineImpactWeeks: 2,
      description: 'Pool plaster is worn and staining, needs resurfacing',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Urban Brownstone': [
    {
      id: 'plumbing_stack',
      name: 'Main Plumbing Stack',
      severity: 'severe',
      costRangeMin: 12000,
      costRangeMax: 28000,
      timelineImpactWeeks: 4,
      description: 'Original cast iron and galvanized pipes need complete replacement',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'electrical_upgrade',
      name: 'Electrical Service Upgrade',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 14000,
      timelineImpactWeeks: 2,
      description: 'Electrical panel insufficient for modern needs, requires service upgrade',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'roof_historic',
      name: 'Historic Roof Materials',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 18000,
      timelineImpactWeeks: 3,
      description: 'Historic district requires period-appropriate roofing materials',
      discoveredBy: ['inspection'],
    },
  ],
};

export const getPropertyIssues = (propertyName: string): PropertyIssue[] => {
  return PROPERTY_ISSUES[propertyName] || [];
};

export const getUndiscoveredIssues = (
  propertyName: string,
  completedDiligence: string[]
): PropertyIssue[] => {
  const allIssues = getPropertyIssues(propertyName);
  return allIssues.filter(issue =>
    !issue.discoveredBy.some(method => completedDiligence.includes(method))
  );
};

export const calculateSurpriseCosts = (issues: PropertyIssue[]): number => {
  return issues.reduce((total, issue) => {
    const avgCost = (issue.costRangeMin + issue.costRangeMax) / 2;
    const variance = (Math.random() - 0.5) * (issue.costRangeMax - issue.costRangeMin);
    return total + Math.round(avgCost + variance);
  }, 0);
};
