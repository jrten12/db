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
  'Northern Liberties Loft': [
    {
      id: 'industrial_conversion',
      name: 'Industrial Conversion Issues',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 14000,
      timelineImpactWeeks: 3,
      description: 'Former warehouse needs updated fire suppression and egress windows',
      discoveredBy: ['inspection'],
    },
    {
      id: 'hvac_commercial',
      name: 'Commercial HVAC System',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 7000,
      timelineImpactWeeks: 1,
      description: 'Oversized commercial HVAC inefficient for residential use',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Graduate Hospital Brownstone': [
    {
      id: 'electrical_upgrade',
      name: 'Electrical Service Upgrade',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 9000,
      timelineImpactWeeks: 2,
      description: 'Panel needs upgrade for modern appliances',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'cosmetic_updates',
      name: 'Cosmetic Updates Needed',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Dated finishes need refreshing for market-rate rents',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Rittenhouse Square Condo': [
    {
      id: 'hvac_high_rise',
      name: 'High-Rise HVAC Issues',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 11000,
      timelineImpactWeeks: 2,
      description: 'Building HVAC aging, unit components need replacement',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'hoa_reserve_low',
      name: 'Low HOA Reserves',
      severity: 'mild',
      costRangeMin: 0,
      costRangeMax: 3000,
      timelineImpactWeeks: 0,
      description: 'Building reserves underfunded, special assessment possible',
      discoveredBy: ['title_search'],
    },
  ],
  'Society Hill Colonial': [
    {
      id: 'historic_windows',
      name: 'Historic Window Requirements',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 15000,
      timelineImpactWeeks: 3,
      description: 'Windows need restoration to meet historic district standards',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'plumbing_replacement',
      name: 'Plumbing Stack Replacement',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Building plumbing is original and showing corrosion',
      discoveredBy: ['inspection'],
    },
  ],
  'Fishtown Row House': [
    {
      id: 'structural_settling',
      name: 'Structural Settling',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Minor settling causing cracked plaster and sticky doors',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'basement_moisture',
      name: 'Basement Moisture',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 6000,
      timelineImpactWeeks: 1,
      description: 'Evidence of water intrusion during heavy rains',
      discoveredBy: ['inspection'],
    },
  ],
  'Hillside Retreat': [
    {
      id: 'septic_issues',
      name: 'Septic System Issues',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Septic tank needs pumping and drain field shows wear',
      discoveredBy: ['inspection'],
    },
    {
      id: 'well_water',
      name: 'Well Water Quality',
      severity: 'mild',
      costRangeMin: 1500,
      costRangeMax: 4000,
      timelineImpactWeeks: 1,
      description: 'Well water tests show elevated iron, treatment system needed',
      discoveredBy: ['inspection'],
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
      timelineImpactWeeks: 1,
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
      timelineImpactWeeks: 1,
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
  'Elmwood Bungalow': [
    {
      id: 'plumbing_galvanized',
      name: 'Galvanized Plumbing',
      severity: 'severe',
      costRangeMin: 8000,
      costRangeMax: 18000,
      timelineImpactWeeks: 3,
      description: 'Old galvanized pipes throughout, significant corrosion visible in kitchen',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'foundation_settling',
      name: 'Foundation Settling',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 15000,
      timelineImpactWeeks: 3,
      description: 'Basement shows signs of settling, cracks in foundation walls',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Westside Manor': [
    {
      id: 'cosmetic_updates',
      name: 'Cosmetic Updates Needed',
      severity: 'mild',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Dated finishes throughout, needs paint and fixture updates',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'roof_wear',
      name: 'Roof Approaching End of Life',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 15000,
      timelineImpactWeeks: 2,
      description: 'Roof shingles showing significant wear, replacement within 2-3 years',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'South Street Twin': [
    {
      id: 'brick_repointing',
      name: 'Shared Wall Issues',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Party wall shows moisture intrusion, brick repointing needed',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'outdated_hvac',
      name: 'Outdated HVAC',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 7000,
      timelineImpactWeeks: 1,
      description: 'HVAC system is 12+ years old, efficiency issues',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Port Richmond Duplex': [
    {
      id: 'hvac_replacement',
      name: 'Dual HVAC Systems Aging',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 16000,
      timelineImpactWeeks: 2,
      description: 'Both units have aging HVAC systems needing replacement',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'utility_separation',
      name: 'Utility Separation Issues',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Utility meters not fully separated between units',
      discoveredBy: ['inspection'],
    },
  ],
  'Kensington Row': [
    {
      id: 'cosmetic_updates',
      name: 'Deferred Maintenance',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 14000,
      timelineImpactWeeks: 3,
      description: 'Years of deferred maintenance, needs comprehensive updates',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'electrical_outdated',
      name: 'Outdated Electrical',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 9000,
      timelineImpactWeeks: 2,
      description: 'Electrical panel outdated, some knob and tube in walls',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Hudson Valley Farmhouse': [
    {
      id: 'septic_maintenance',
      name: 'Septic System Maintenance',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Septic needs pumping, drain field inspection recommended',
      discoveredBy: ['inspection'],
    },
    {
      id: 'barn_roof',
      name: 'Outbuilding Roof',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 1,
      description: 'Barn roof showing wear, minor repairs needed',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Skyline Penthouse': [
    {
      id: 'hoa_assessment_pending',
      name: 'Special Assessment Pending',
      severity: 'moderate',
      costRangeMin: 10000,
      costRangeMax: 25000,
      timelineImpactWeeks: 0,
      description: 'Building has major capital improvement assessment coming',
      discoveredBy: ['title_search'],
    },
    {
      id: 'hvac_high_rise',
      name: 'Penthouse HVAC Load',
      severity: 'mild',
      costRangeMin: 4000,
      costRangeMax: 9000,
      timelineImpactWeeks: 1,
      description: 'Top floor unit requires HVAC upgrades for thermal load',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Chestnut Hill Victorian': [
    {
      id: 'historic_requirements',
      name: 'Historic District Requirements',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 20000,
      timelineImpactWeeks: 4,
      description: 'Historic district approval needed for any exterior changes',
      discoveredBy: ['title_search', 'inspection'],
    },
    {
      id: 'lead_paint_abatement',
      name: 'Lead Paint Present',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Pre-1978 home with lead paint requiring remediation',
      discoveredBy: ['inspection'],
    },
  ],
  'Lakefront Estate': [
    {
      id: 'dock_permit',
      name: 'Dock Permit Issues',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 6000,
      timelineImpactWeeks: 1,
      description: 'Dock permits need renewal, minor repairs required',
      discoveredBy: ['title_search'],
    },
    {
      id: 'seawall_maintenance',
      name: 'Seawall Maintenance',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 15000,
      timelineImpactWeeks: 2,
      description: 'Lakefront seawall showing erosion, reinforcement needed',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Queen Village Rowhouse': [
    {
      id: 'brick_repointing',
      name: 'Brick Facade Repairs',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 14000,
      timelineImpactWeeks: 2,
      description: 'Exterior brick needs extensive repointing, mortar deteriorating',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'basement_moisture',
      name: 'Basement Moisture',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 7000,
      timelineImpactWeeks: 1,
      description: 'Evidence of water intrusion in basement',
      discoveredBy: ['inspection'],
    },
  ],
  'Fairmount Rowhome': [
    {
      id: 'dual_system_updates',
      name: 'Dual System Updates',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 14000,
      timelineImpactWeeks: 3,
      description: 'Both HVAC and plumbing systems need updates',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'electrical_outdated',
      name: 'Electrical Panel Upgrade',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 8000,
      timelineImpactWeeks: 2,
      description: 'Electrical service insufficient for modern use',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
  ],
  'Old City Loft': [
    {
      id: 'structural_settling',
      name: 'Building Settling',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Historic building shows settling, cracked plaster throughout',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'basement_moisture',
      name: 'Basement Conditions',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 1,
      description: 'Old building basement has moisture and storage limitations',
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

// Issue pools by property type for randomization
// Each pool contains issues appropriate for that property type
const ISSUE_POOLS: Record<string, PropertyIssue[]> = {
  // House-specific issues (single-family homes with yards, foundations, roofs)
  house: [
    { id: 'roof_wear', name: 'Roof Wear', severity: 'mild', costRangeMin: 3000, costRangeMax: 6000, timelineImpactWeeks: 1, description: 'Shingles showing age, may need replacement within 2-3 years', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'roof_replacement', name: 'Roof Replacement Needed', severity: 'severe', costRangeMin: 12000, costRangeMax: 25000, timelineImpactWeeks: 3, description: 'Multiple leaks, shingles beyond repair', discoveredBy: ['contractor_walkthrough'] },
    { id: 'foundation_settling', name: 'Foundation Settling', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 3, description: 'Minor cracks indicate foundation movement', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'foundation_major', name: 'Major Foundation Issues', severity: 'severe', costRangeMin: 15000, costRangeMax: 40000, timelineImpactWeeks: 6, description: 'Significant structural damage requiring professional repair', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'drainage_issues', name: 'Drainage Issues', severity: 'mild', costRangeMin: 2000, costRangeMax: 5000, timelineImpactWeeks: 1, description: 'Poor grading causing water pooling near foundation', discoveredBy: ['inspection'] },
    { id: 'termite_damage', name: 'Termite Damage', severity: 'severe', costRangeMin: 10000, costRangeMax: 30000, timelineImpactWeeks: 6, description: 'Active infestation with structural damage', discoveredBy: ['inspection'] },
    { id: 'outdated_hvac', name: 'Outdated HVAC', severity: 'moderate', costRangeMin: 4000, costRangeMax: 8000, timelineImpactWeeks: 2, description: 'HVAC system is 15+ years old, efficiency issues', discoveredBy: ['contractor_walkthrough'] },
    { id: 'electrical_outdated', name: 'Outdated Electrical', severity: 'moderate', costRangeMin: 3000, costRangeMax: 7000, timelineImpactWeeks: 2, description: 'Panel needs upgrade for modern appliances and safety', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'plumbing_galvanized', name: 'Galvanized Plumbing', severity: 'severe', costRangeMin: 8000, costRangeMax: 18000, timelineImpactWeeks: 3, description: 'Original galvanized pipes corroding, full replacement needed', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'mold_remediation', name: 'Mold in Basement', severity: 'severe', costRangeMin: 8000, costRangeMax: 20000, timelineImpactWeeks: 4, description: 'Active mold growth requiring professional remediation', discoveredBy: ['inspection'] },
    { id: 'asbestos_tiles', name: 'Asbestos Floor Tiles', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Original floor tiles contain asbestos, require abatement', discoveredBy: ['inspection'] },
    { id: 'lead_paint', name: 'Lead Paint', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Lead paint present, abatement required for sale or rental', discoveredBy: ['inspection'] },
    { id: 'septic_issues', name: 'Septic System Concerns', severity: 'moderate', costRangeMin: 5000, costRangeMax: 20000, timelineImpactWeeks: 3, description: 'Septic system age unknown, may need pumping or replacement', discoveredBy: ['inspection'] },
    { id: 'well_water', name: 'Well System Age', severity: 'mild', costRangeMin: 2000, costRangeMax: 5000, timelineImpactWeeks: 1, description: 'Well pump showing age, water testing recommended', discoveredBy: ['inspection'] },
    { id: 'chimney_rebuild', name: 'Chimney Rebuild', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Chimney masonry deteriorating, needs rebuild above roofline', discoveredBy: ['contractor_walkthrough'] },
    { id: 'siding_damage', name: 'Siding Damage', severity: 'mild', costRangeMin: 3000, costRangeMax: 8000, timelineImpactWeeks: 1, description: 'Sections of siding damaged by weather or impact', discoveredBy: ['contractor_walkthrough'] },
    { id: 'porch_rot', name: 'Porch Wood Rot', severity: 'mild', costRangeMin: 2000, costRangeMax: 6000, timelineImpactWeeks: 1, description: 'Porch columns and flooring show signs of rot', discoveredBy: ['contractor_walkthrough'] },
    { id: 'tree_root_damage', name: 'Tree Root Damage', severity: 'moderate', costRangeMin: 4000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Tree roots damaging foundation or sewer lines', discoveredBy: ['inspection'] },
    { id: 'radon_mitigation', name: 'Radon Mitigation', severity: 'mild', costRangeMin: 1500, costRangeMax: 4000, timelineImpactWeeks: 1, description: 'Elevated radon levels require mitigation system', discoveredBy: ['inspection'] },
    { id: 'sump_pump', name: 'Sump Pump Replacement', severity: 'mild', costRangeMin: 1500, costRangeMax: 3500, timelineImpactWeeks: 1, description: 'Sump pump failing, needs replacement before next heavy rain', discoveredBy: ['inspection'] },
  ],
  
  // Condo/apartment issues (no foundation, roof, or yard issues - HOA handles exterior)
  condo: [
    { id: 'hoa_assessment', name: 'Pending HOA Assessment', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 0, description: 'Building-wide assessment for major repairs announced', discoveredBy: ['title_search'] },
    { id: 'hoa_reserve_low', name: 'Low HOA Reserves', severity: 'mild', costRangeMin: 0, costRangeMax: 0, timelineImpactWeeks: 0, description: 'HOA reserves below recommended levels - future assessments likely', discoveredBy: ['title_search'] },
    { id: 'hvac_commercial', name: 'HVAC System Age', severity: 'mild', costRangeMin: 3000, costRangeMax: 7000, timelineImpactWeeks: 1, description: 'Unit HVAC showing signs of wear', discoveredBy: ['contractor_walkthrough'] },
    { id: 'plumbing_stack', name: 'Plumbing Stack Issues', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Building plumbing stack aging, HOA may assess for replacement', discoveredBy: ['inspection'] },
    { id: 'electrical_upgrade', name: 'Electrical Upgrade', severity: 'mild', costRangeMin: 2000, costRangeMax: 5000, timelineImpactWeeks: 1, description: 'Panel needs upgrade for modern appliances', discoveredBy: ['contractor_walkthrough'] },
    { id: 'cosmetic_updates', name: 'Cosmetic Updates Needed', severity: 'mild', costRangeMin: 3000, costRangeMax: 8000, timelineImpactWeeks: 1, description: 'Unit needs paint, flooring, and fixture updates', discoveredBy: ['contractor_walkthrough'] },
    { id: 'window_seals', name: 'Window Seal Failure', severity: 'mild', costRangeMin: 2000, costRangeMax: 5000, timelineImpactWeeks: 1, description: 'Window seals failing, causing condensation and drafts', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'appliance_age', name: 'Aging Appliances', severity: 'mild', costRangeMin: 2000, costRangeMax: 6000, timelineImpactWeeks: 1, description: 'Kitchen appliances at end of life, need replacement', discoveredBy: ['contractor_walkthrough'] },
    { id: 'bathroom_outdated', name: 'Outdated Bathroom', severity: 'mild', costRangeMin: 4000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Bathroom fixtures and finishes are dated', discoveredBy: ['contractor_walkthrough'] },
    { id: 'special_assessment_pending', name: 'Special Assessment Pending', severity: 'severe', costRangeMin: 8000, costRangeMax: 25000, timelineImpactWeeks: 0, description: 'Major building repair assessment pending approval', discoveredBy: ['title_search'] },
    { id: 'parking_issues', name: 'Parking Situation', severity: 'mild', costRangeMin: 0, costRangeMax: 0, timelineImpactWeeks: 0, description: 'Limited parking, may affect resale or rental', discoveredBy: ['contractor_walkthrough'] },
    { id: 'building_systems', name: 'Building Systems Age', severity: 'mild', costRangeMin: 0, costRangeMax: 0, timelineImpactWeeks: 0, description: 'Elevator and common area systems showing age', discoveredBy: ['inspection'] },
  ],
  
  // Townhouse/rowhouse issues (attached walls, shared concerns, but own roof usually)
  townhouse: [
    { id: 'roof_shared', name: 'Shared Roof Concerns', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Roof shared with neighbors, coordination needed for repairs', discoveredBy: ['contractor_walkthrough'] },
    { id: 'party_wall', name: 'Party Wall Issues', severity: 'mild', costRangeMin: 2000, costRangeMax: 6000, timelineImpactWeeks: 1, description: 'Shared wall shows settling cracks, coordination with neighbor needed', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'brick_repointing', name: 'Brick Repointing Needed', severity: 'mild', costRangeMin: 3000, costRangeMax: 8000, timelineImpactWeeks: 1, description: 'Mortar between bricks deteriorating', discoveredBy: ['contractor_walkthrough'] },
    { id: 'historic_requirements', name: 'Historic District Requirements', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 4, description: 'Located in historic district with renovation restrictions', discoveredBy: ['title_search'] },
    { id: 'basement_moisture', name: 'Basement Moisture', severity: 'mild', costRangeMin: 3000, costRangeMax: 7000, timelineImpactWeeks: 1, description: 'Evidence of water intrusion in basement', discoveredBy: ['inspection'] },
    { id: 'outdated_hvac', name: 'Outdated HVAC', severity: 'moderate', costRangeMin: 4000, costRangeMax: 9000, timelineImpactWeeks: 2, description: 'HVAC system needs update', discoveredBy: ['contractor_walkthrough'] },
    { id: 'electrical_outdated', name: 'Electrical Upgrade Needed', severity: 'moderate', costRangeMin: 3000, costRangeMax: 7000, timelineImpactWeeks: 2, description: 'Panel insufficient for modern usage', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'plumbing_galvanized', name: 'Old Plumbing', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Galvanized pipes showing corrosion', discoveredBy: ['contractor_walkthrough'] },
    { id: 'narrow_lot_access', name: 'Limited Access', severity: 'mild', costRangeMin: 0, costRangeMax: 0, timelineImpactWeeks: 0, description: 'Narrow lot limits renovation access, may increase costs', discoveredBy: ['contractor_walkthrough'] },
    { id: 'structural_settling', name: 'Settling Issues', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Building shows settling, cracked plaster throughout', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'knob_tube_wiring', name: 'Knob & Tube Wiring', severity: 'severe', costRangeMin: 8000, costRangeMax: 18000, timelineImpactWeeks: 3, description: 'Old wiring present, full rewire recommended', discoveredBy: ['inspection'] },
    { id: 'lead_paint', name: 'Lead Paint Present', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Lead paint in older home requires abatement', discoveredBy: ['inspection'] },
  ],
  
  // Duplex/multi-family issues (dual systems, tenant concerns)
  duplex: [
    { id: 'dual_system_updates', name: 'Dual System Updates', severity: 'moderate', costRangeMin: 6000, costRangeMax: 14000, timelineImpactWeeks: 3, description: 'Both units need HVAC and plumbing updates', discoveredBy: ['contractor_walkthrough'] },
    { id: 'utility_separation', name: 'Utility Separation', severity: 'mild', costRangeMin: 2000, costRangeMax: 5000, timelineImpactWeeks: 1, description: 'Utilities not fully separated between units', discoveredBy: ['inspection'] },
    { id: 'roof_wear', name: 'Roof Wear', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Larger roof showing wear, repair needed soon', discoveredBy: ['contractor_walkthrough'] },
    { id: 'electrical_outdated', name: 'Electrical for Both Units', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Both units need electrical panel upgrades', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'plumbing_shared', name: 'Shared Plumbing Issues', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Shared plumbing stack aging, affects both units', discoveredBy: ['contractor_walkthrough'] },
    { id: 'foundation_settling', name: 'Foundation Settling', severity: 'moderate', costRangeMin: 6000, costRangeMax: 18000, timelineImpactWeeks: 3, description: 'Foundation cracks visible, needs professional assessment', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'fire_separation', name: 'Fire Separation Issues', severity: 'moderate', costRangeMin: 3000, costRangeMax: 8000, timelineImpactWeeks: 2, description: 'Fire separation between units not up to code', discoveredBy: ['inspection'] },
    { id: 'cosmetic_both_units', name: 'Cosmetic Updates Both Units', severity: 'mild', costRangeMin: 6000, costRangeMax: 15000, timelineImpactWeeks: 2, description: 'Both units need paint, flooring, and fixture updates', discoveredBy: ['contractor_walkthrough'] },
    { id: 'drainage_issues', name: 'Drainage Concerns', severity: 'mild', costRangeMin: 3000, costRangeMax: 7000, timelineImpactWeeks: 1, description: 'Poor grading causing water issues around foundation', discoveredBy: ['inspection'] },
    { id: 'lead_paint', name: 'Lead Paint (Both Units)', severity: 'moderate', costRangeMin: 8000, costRangeMax: 20000, timelineImpactWeeks: 3, description: 'Lead paint present in both units, abatement needed', discoveredBy: ['inspection'] },
    { id: 'separate_meters', name: 'Meter Separation Needed', severity: 'mild', costRangeMin: 1500, costRangeMax: 4000, timelineImpactWeeks: 1, description: 'Electric/gas meters not separate, complicates tenant billing', discoveredBy: ['inspection'] },
  ],
  
  // Loft/converted space issues
  loft: [
    { id: 'industrial_conversion', name: 'Industrial Conversion Issues', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 3, description: 'Former industrial space has non-residential quirks', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'hvac_commercial', name: 'Commercial HVAC', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Commercial-grade HVAC expensive to repair', discoveredBy: ['contractor_walkthrough'] },
    { id: 'plumbing_galvanized', name: 'Old Plumbing', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Original building plumbing aging', discoveredBy: ['contractor_walkthrough'] },
    { id: 'hoa_assessment', name: 'Building Assessment', severity: 'moderate', costRangeMin: 4000, costRangeMax: 12000, timelineImpactWeeks: 0, description: 'Building assessment for facade or systems repair', discoveredBy: ['title_search'] },
    { id: 'window_replacement', name: 'Industrial Windows', severity: 'moderate', costRangeMin: 6000, costRangeMax: 15000, timelineImpactWeeks: 2, description: 'Large industrial windows inefficient, need updating', discoveredBy: ['contractor_walkthrough'] },
    { id: 'fire_suppression', name: 'Fire Suppression System', severity: 'mild', costRangeMin: 2000, costRangeMax: 5000, timelineImpactWeeks: 1, description: 'Fire suppression system needs inspection and updates', discoveredBy: ['inspection'] },
    { id: 'loading_dock', name: 'Loading Dock Area', severity: 'mild', costRangeMin: 0, costRangeMax: 0, timelineImpactWeeks: 0, description: 'Building access through former loading area, limited appeal', discoveredBy: ['contractor_walkthrough'] },
    { id: 'elevator_issues', name: 'Freight Elevator Age', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 0, description: 'Building elevator is old freight system, expensive to maintain', discoveredBy: ['inspection'] },
  ],
};

// Seeded random number generator for consistent results per game run
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Conflict groups: when a "major" issue is present, "minor" related issues are excluded
// The first item in each group is the major issue, rest are excluded if major is present
const CONFLICT_GROUPS: string[][] = [
  ['roof_replacement', 'roof_wear', 'roof_shared', 'roof_historic', 'barn_roof'],
  ['plumbing_stack', 'plumbing_galvanized', 'plumbing_shared', 'plumbing_replacement'],
  ['foundation_major', 'foundation_settling', 'foundation_stone', 'structural_settling'],
  ['hvac_replacement', 'hvac_commercial', 'hvac_high_rise', 'outdated_hvac', 'dual_hvac'],
  ['knob_tube_wiring', 'knob_tube', 'electrical_outdated', 'electrical_upgrade'],
  ['utility_separation', 'separate_meters', 'separate_utilities'],
  ['septic_issues', 'septic_maintenance', 'well_water', 'well_system'],
  ['hoa_assessment', 'hoa_assessment_pending', 'hoa_reserve_low', 'special_assessment_pending'],
  ['deferred_maintenance', 'cosmetic_updates', 'cosmetic_both_units'],
  ['drainage_issues', 'tree_root_damage'],
  ['party_wall', 'shared_wall_issues'],
  ['siding_damage', 'brick_repointing'],
];

const WELL_ONLY_ISSUE_IDS = new Set([
  'septic_issues', 'septic_maintenance', 'well_water', 'well_system',
]);

function filterPoolByWaterSource(pool: PropertyIssue[], waterSource: string): PropertyIssue[] {
  if (waterSource === 'well') return pool;
  return pool.filter(issue => !WELL_ONLY_ISSUE_IDS.has(issue.id));
}

// Filter out issues that conflict with already-selected issues
function filterConflictingIssues(selectedIds: Set<string>, pool: PropertyIssue[]): PropertyIssue[] {
  const excludedIds = new Set<string>();
  
  for (const group of CONFLICT_GROUPS) {
    const majorIssueId = group[0];
    // If a major issue is selected, exclude all minor related issues
    if (selectedIds.has(majorIssueId)) {
      for (let i = 1; i < group.length; i++) {
        excludedIds.add(group[i]);
      }
    }
    // Also check if any issue in group is selected, exclude duplicates within same system
    const selectedInGroup = group.filter(id => selectedIds.has(id));
    if (selectedInGroup.length > 0) {
      // Exclude other issues in same group to prevent duplicates
      for (const id of group) {
        if (!selectedIds.has(id)) {
          excludedIds.add(id);
        }
      }
    }
  }
  
  return pool.filter(issue => !excludedIds.has(issue.id));
}

// Map property types to issue pool keys
function getIssuePoolKey(propertyType: string): string {
  const mapping: Record<string, string> = {
    'house': 'house',
    'condo': 'condo',
    'apartment': 'condo',  // apartments use condo pool
    'townhouse': 'townhouse',
    'rowhouse': 'townhouse',
    'duplex': 'duplex',
    'loft': 'loft',
  };
  return mapping[propertyType.toLowerCase()] || 'house';
}

// Get randomized issues for a property based on game run and property
export function getRandomizedPropertyIssues(
  gameRunId: number,
  propertyId: number,
  propertyType: string,
  conditionTag: string,
  waterSource: string = 'public'
): PropertyIssue[] {
  // Create a seed based on game run and property for consistent results
  const seed = gameRunId * 1000 + propertyId;
  const random = seededRandom(seed);
  
  // Get appropriate issue pool, filtered by water source compatibility
  const poolKey = getIssuePoolKey(propertyType);
  const rawPool = ISSUE_POOLS[poolKey] || ISSUE_POOLS['house'];
  const pool = filterPoolByWaterSource(rawPool, waterSource);
  
  // Determine how many issues based on condition
  const conditionIssueCount: Record<string, { min: number; max: number }> = {
    'Fixer-Upper': { min: 3, max: 5 },
    'Needs Repairs': { min: 3, max: 4 },
    'Needs-work': { min: 2, max: 4 },
    'Dated': { min: 2, max: 3 },
    'Fair': { min: 1, max: 3 },
    'Cosmetic': { min: 1, max: 2 },
    'Good': { min: 0, max: 2 },
    'Turnkey': { min: 0, max: 1 },
    'Excellent': { min: 0, max: 1 },
  };
  
  const issueRange = conditionIssueCount[conditionTag] || { min: 1, max: 2 };
  const issueCount = Math.floor(random() * (issueRange.max - issueRange.min + 1)) + issueRange.min;
  
  // Shuffle pool using seeded random
  const shuffled = [...pool].sort(() => random() - 0.5);
  
  // Pick issues ensuring at least one of each severity for worse conditions
  const selected: PropertyIssue[] = [];
  const usedIds = new Set<string>();
  
  // For fixer-uppers, ensure at least one severe issue
  if ((conditionTag === 'Fixer-Upper' || conditionTag === 'Needs Repairs' || conditionTag === 'Needs-work') && issueCount >= 2) {
    const severeIssues = shuffled.filter(i => i.severity === 'severe' && !usedIds.has(i.id));
    if (severeIssues.length > 0) {
      const severe = severeIssues[Math.floor(random() * severeIssues.length)];
      selected.push(severe);
      usedIds.add(severe.id);
    }
  }
  
  // Fill remaining slots, filtering out conflicting issues
  let availablePool = filterConflictingIssues(usedIds, shuffled);
  
  for (const issue of availablePool) {
    if (selected.length >= issueCount) break;
    if (!usedIds.has(issue.id)) {
      selected.push(issue);
      usedIds.add(issue.id);
      // Re-filter pool after each selection to remove new conflicts
      availablePool = filterConflictingIssues(usedIds, availablePool);
    }
  }
  
  return selected;
}

// Check if we should use randomized issues (new game runs) or legacy static issues
export function shouldUseRandomizedIssues(gameRunId?: number): boolean {
  // Use randomized issues for all new game runs
  return gameRunId !== undefined && gameRunId > 0;
}
