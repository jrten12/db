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
    name: 'Investigate Market Rents',
    cost: 0,
    timeWeeks: 1,
    description: 'Explore real estate sites like Zillow, Rentometer, and Redfin to determine what similar units rent for in the area. This is something you can do yourself for free!',
    reveals: 'Shows you what tenants actually pay for similar properties nearby',
    narrowsField: 'rent',
  },
  {
    id: 'appraisal',
    name: 'Investigate Market Sales Prices',
    cost: 0,
    timeWeeks: 1,
    description: 'Look at comparable renovated homes (comps) in the area via real estate sites or your agent. This tells you what the house might be worth after you fix it up — known as After Repair Value (ARV).',
    reveals: 'Shows what similar fixed-up homes have actually sold for nearby',
    narrowsField: 'arv',
  },
  {
    id: 'contractor_walkthrough',
    name: 'Contractor Walkthrough',
    cost: 150,
    timeWeeks: 1,
    description: 'Hire a contractor to walk through the property with you, look for condition issues, determine your scope of work, and estimate your repair budget.',
    reveals: 'Gives you a realistic repair budget and timeline from a professional',
    narrowsField: 'rehab',
  },
  {
    id: 'inspection',
    name: 'Property Inspection',
    cost: 500,
    timeWeeks: 1,
    description: 'Hire a licensed property inspector to thoroughly evaluate all property systems and look for hidden repair issues that aren\'t visible during a walkthrough.',
    reveals: 'Uncovers hidden problems like mold, pests, electrical, and plumbing issues',
    narrowsField: 'issues',
  },
  {
    id: 'title_search',
    name: 'Title Report',
    cost: 250,
    timeWeeks: 3,
    description: 'Required before purchasing. A title company researches the property\'s ownership history to make sure there are no liens, disputes, or legal issues that could affect your purchase.',
    reveals: 'Confirms the seller actually owns the property and there are no hidden claims against it',
    narrowsField: 'title',
  },
];

export interface EffectiveRanges {
  rent: { min: number; max: number; known: boolean };
  postRehabRent: { min: number; max: number; known: boolean };
  arv: { min: number; max: number; known: boolean };
  rehab: { min: number; max: number; known: boolean };
  timeline: { min: number; max: number; known: boolean };
}

export function getEffectiveRanges(
  property: { 
    rentMin: number; 
    rentMax: number; 
    postRehabRentMin?: number | null; 
    postRehabRentMax?: number | null;
    arvMin: number; 
    arvMax: number; 
    rehabMin: number; 
    rehabMax: number; 
    timelineMin: number; 
    timelineMax: number; 
    price: number 
  },
  completedDiligence: string[]
): EffectiveRanges {
  const hasMarketStudy = completedDiligence.includes('market_study');
  const hasAppraisal = completedDiligence.includes('appraisal');
  const hasContractorWalkthrough = completedDiligence.includes('contractor_walkthrough');
  const hasInspection = completedDiligence.includes('inspection');
  const hasContractorOrInspection = hasContractorWalkthrough || hasInspection;

  const rentMid = (property.rentMin + property.rentMax) / 2;
  const arvMid = (property.arvMin + property.arvMax) / 2;
  const rehabMid = (property.rehabMin + property.rehabMax) / 2;
  const timelineMid = (property.timelineMin + property.timelineMax) / 2;

  const postRehabRentMin = property.postRehabRentMin ?? Math.round(property.rentMin * 1.12);
  const postRehabRentMax = property.postRehabRentMax ?? Math.round(property.rentMax * 1.18);
  const postRehabMid = (postRehabRentMin + postRehabRentMax) / 2;

  return {
    rent: hasMarketStudy 
      ? { min: property.rentMin, max: property.rentMax, known: true }
      : { min: Math.round(rentMid * 0.6), max: Math.round(rentMid * 1.4), known: false },
    postRehabRent: hasContractorOrInspection
      ? { min: postRehabRentMin, max: postRehabRentMax, known: true }
      : { min: Math.round(postRehabMid * 0.7), max: Math.round(postRehabMid * 1.3), known: false },
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
  'South Street Twin': [
    {
      id: 'shared_wall_issues',
      name: 'Shared Wall Concerns',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Shared wall needs soundproofing improvements and minor repairs',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'city_violations',
      name: 'City Code Violations',
      severity: 'moderate',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 2,
      description: 'Outstanding permits and minor violations need resolution',
      discoveredBy: ['inspection'],
    },
  ],
  'Fishtown Row House': [
    {
      id: 'roof_shared',
      name: 'Shared Roof Repairs',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Row house roof repairs - coordination with neighbors required',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'narrow_lot_access',
      name: 'Access Limitations',
      severity: 'mild',
      costRangeMin: 1500,
      costRangeMax: 3000,
      timelineImpactWeeks: 1,
      description: 'Narrow lot complicates material delivery and increases labor costs',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Port Richmond Duplex': [
    {
      id: 'dual_hvac',
      name: 'Dual HVAC Systems',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 14000,
      timelineImpactWeeks: 2,
      description: 'Both units need HVAC updates - double the equipment',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'separate_utilities',
      name: 'Utility Separation Needed',
      severity: 'severe',
      costRangeMin: 8000,
      costRangeMax: 15000,
      timelineImpactWeeks: 3,
      description: 'Electric and gas need proper metering for separate units',
      discoveredBy: ['inspection'],
    },
  ],
  'Kensington Row': [
    {
      id: 'deferred_maintenance',
      name: 'Deferred Maintenance',
      severity: 'severe',
      costRangeMin: 12000,
      costRangeMax: 25000,
      timelineImpactWeeks: 4,
      description: 'Years of neglect - multiple systems need replacement',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'zoning_issues',
      name: 'Zoning Concerns',
      severity: 'moderate',
      costRangeMin: 2000,
      costRangeMax: 6000,
      timelineImpactWeeks: 2,
      description: 'Current use may not match zoning - variance or permits needed',
      discoveredBy: ['inspection'],
    },
  ],
  'Northern Liberties Loft': [
    {
      id: 'industrial_conversion',
      name: 'Industrial Legacy Issues',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 7000,
      timelineImpactWeeks: 1,
      description: 'Former industrial space - some commercial systems need residential updates',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'hoa_assessment_pending',
      name: 'HOA Special Assessment',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 12000,
      timelineImpactWeeks: 0,
      description: 'Building-wide assessment for common area upgrades being discussed',
      discoveredBy: ['inspection'],
    },
  ],
  'Graduate Hospital Brownstone': [
    {
      id: 'building_systems',
      name: 'Building Common Systems',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Building-wide HVAC and plumbing systems showing age, may require special assessment',
      discoveredBy: ['inspection'],
    },
    {
      id: 'parking_issues',
      name: 'Parking Challenges',
      severity: 'mild',
      costRangeMin: 1500,
      costRangeMax: 3500,
      timelineImpactWeeks: 0,
      description: 'Limited parking in urban area may affect rental demand',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Queen Village Rowhouse': [
    {
      id: 'historic_requirements',
      name: 'Historic District Requirements',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 15000,
      timelineImpactWeeks: 3,
      description: 'Historic preservation requirements add cost and time to renovations',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'brick_repointing',
      name: 'Brick Repointing Needed',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 10000,
      timelineImpactWeeks: 2,
      description: 'Mortar between bricks deteriorating, needs repointing for weatherproofing',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'narrow_lot_access',
      name: 'Narrow Lot Access',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 4000,
      timelineImpactWeeks: 1,
      description: 'Tight urban lot complicates material delivery and increases labor costs',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Rittenhouse Square Condo': [
    {
      id: 'high_hoa_fees',
      name: 'Premium HOA Fees',
      severity: 'mild',
      costRangeMin: 0,
      costRangeMax: 0,
      timelineImpactWeeks: 0,
      description: 'Luxury building has high monthly HOA fees affecting cash flow - factor into rental analysis',
      discoveredBy: ['inspection'],
    },
    {
      id: 'elevator_issues',
      name: 'Elevator Renovation Assessment',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 18000,
      timelineImpactWeeks: 0,
      description: 'Building elevator modernization project announced - special assessment coming',
      discoveredBy: ['title_search'],
    },
    {
      id: 'hvac_high_rise',
      name: 'HVAC Unit Replacement',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 12000,
      timelineImpactWeeks: 1,
      description: 'Individual HVAC unit aging, may need replacement within 2 years',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Fairmount Rowhome': [
    {
      id: 'dual_system_updates',
      name: 'Dual System Updates',
      severity: 'moderate',
      costRangeMin: 10000,
      costRangeMax: 20000,
      timelineImpactWeeks: 3,
      description: 'Both units need separate HVAC and water heater updates',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'utility_separation',
      name: 'Utility Meter Separation',
      severity: 'severe',
      costRangeMin: 8000,
      costRangeMax: 16000,
      timelineImpactWeeks: 4,
      description: 'Utilities need proper separation for individual unit billing',
      discoveredBy: ['inspection'],
    },
    {
      id: 'basement_moisture',
      name: 'Basement Moisture',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Signs of water intrusion in basement, may need waterproofing',
      discoveredBy: ['inspection'],
    },
  ],
  'Society Hill Colonial': [
    {
      id: 'historic_windows',
      name: 'Historic Window Requirements',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 20000,
      timelineImpactWeeks: 3,
      description: 'Historic district requires period-appropriate window replacements',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'security_system',
      name: 'Security System Upgrade',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 6000,
      timelineImpactWeeks: 1,
      description: 'Building security system outdated, upgrade costs passed to owners',
      discoveredBy: ['inspection'],
    },
    {
      id: 'hoa_reserve_low',
      name: 'Low HOA Reserves',
      severity: 'moderate',
      costRangeMin: 5000,
      costRangeMax: 15000,
      timelineImpactWeeks: 0,
      description: 'Building reserve fund below recommended levels - special assessments likely',
      discoveredBy: ['title_search'],
    },
  ],
  'Old City Loft': [
    {
      id: 'structural_settling',
      name: 'Foundation Settling',
      severity: 'severe',
      costRangeMin: 15000,
      costRangeMax: 35000,
      timelineImpactWeeks: 6,
      description: 'Historic brownstone showing foundation movement, needs stabilization',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'plumbing_replacement',
      name: 'Full Plumbing Replacement',
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
  'Hudson Valley Farmhouse': [
    {
      id: 'well_system',
      name: 'Well Water System',
      severity: 'mild',
      costRangeMin: 2000,
      costRangeMax: 5000,
      timelineImpactWeeks: 1,
      description: 'Well pump aging, water filtration system needs update',
      discoveredBy: ['inspection'],
    },
    {
      id: 'septic_maintenance',
      name: 'Septic System Service',
      severity: 'moderate',
      costRangeMin: 4000,
      costRangeMax: 8000,
      timelineImpactWeeks: 2,
      description: 'Septic tank needs pumping and drain field inspection',
      discoveredBy: ['inspection'],
    },
    {
      id: 'barn_roof',
      name: 'Barn Roof Repair',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 7000,
      timelineImpactWeeks: 2,
      description: 'Outbuilding roof has minor leaks, needs patching',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Skyline Penthouse': [
    {
      id: 'special_assessment_structural',
      name: 'HOA Special Assessment - Structural',
      severity: 'severe',
      costRangeMin: 45000,
      costRangeMax: 85000,
      timelineImpactWeeks: 0,
      description: 'Building has major structural defects in parking garage. HOA has passed $65K+ special assessment per unit for emergency repairs. Payment due within 12 months of purchase.',
      discoveredBy: ['title_search'],
    },
    {
      id: 'ongoing_litigation',
      name: 'Building Litigation Pending',
      severity: 'severe',
      costRangeMin: 15000,
      costRangeMax: 35000,
      timelineImpactWeeks: 0,
      description: 'Building is party to lawsuit with original developer over construction defects. Additional assessments likely. Insurance premiums elevated.',
      discoveredBy: ['title_search'],
    },
    {
      id: 'hoa_reserves_depleted',
      name: 'HOA Reserve Fund Depleted',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 15000,
      timelineImpactWeeks: 0,
      description: 'Building reserve fund severely underfunded. Monthly HOA fees expected to increase 40-60% to rebuild reserves.',
      discoveredBy: ['title_search'],
    },
    {
      id: 'hvac_commercial',
      name: 'Commercial HVAC Issues',
      severity: 'moderate',
      costRangeMin: 6000,
      costRangeMax: 12000,
      timelineImpactWeeks: 2,
      description: 'Building central HVAC aging, individual unit may need supplemental system',
      discoveredBy: ['inspection'],
    },
  ],
  'Chestnut Hill Victorian': [
    {
      id: 'lead_paint_abatement',
      name: 'Lead Paint Abatement',
      severity: 'severe',
      costRangeMin: 12000,
      costRangeMax: 28000,
      timelineImpactWeeks: 4,
      description: 'Pre-1978 home with peeling lead paint requiring professional abatement',
      discoveredBy: ['inspection'],
    },
    {
      id: 'plumbing_galvanized',
      name: 'Galvanized Pipe Replacement',
      severity: 'severe',
      costRangeMin: 18000,
      costRangeMax: 35000,
      timelineImpactWeeks: 5,
      description: 'Original 1890s galvanized pipes corroded, full house re-pipe needed',
      discoveredBy: ['contractor_walkthrough', 'inspection'],
    },
    {
      id: 'foundation_stone',
      name: 'Stone Foundation Repointing',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 18000,
      timelineImpactWeeks: 3,
      description: 'Historic stone foundation needs mortar repointing and waterproofing',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'knob_tube_wiring',
      name: 'Knob and Tube Wiring',
      severity: 'severe',
      costRangeMin: 15000,
      costRangeMax: 30000,
      timelineImpactWeeks: 4,
      description: 'Original knob and tube wiring still present, full rewire required for insurance',
      discoveredBy: ['inspection'],
    },
    {
      id: 'historic_windows',
      name: 'Historic Window Restoration',
      severity: 'moderate',
      costRangeMin: 10000,
      costRangeMax: 22000,
      timelineImpactWeeks: 4,
      description: 'Original windows drafty, historic district requires restoration not replacement',
      discoveredBy: ['contractor_walkthrough'],
    },
  ],
  'Lakefront Estate': [
    {
      id: 'dock_permit',
      name: 'Dock Permit & Repairs',
      severity: 'mild',
      costRangeMin: 3000,
      costRangeMax: 8000,
      timelineImpactWeeks: 2,
      description: 'Private dock needs repairs and permit renewal with lake authority',
      discoveredBy: ['title_search'],
    },
    {
      id: 'seawall_maintenance',
      name: 'Seawall Maintenance',
      severity: 'moderate',
      costRangeMin: 8000,
      costRangeMax: 18000,
      timelineImpactWeeks: 3,
      description: 'Lakefront seawall showing erosion, needs reinforcement',
      discoveredBy: ['contractor_walkthrough'],
    },
    {
      id: 'pool_equipment',
      name: 'Pool Equipment Update',
      severity: 'mild',
      costRangeMin: 4000,
      costRangeMax: 9000,
      timelineImpactWeeks: 1,
      description: 'Pool pump and heater nearing end of life, filters need replacement',
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

// Issue pools by property type for randomization
const ISSUE_POOLS: Record<string, PropertyIssue[]> = {
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
    { id: 'chimney_rebuild', name: 'Chimney Rebuild', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Chimney masonry deteriorating, needs rebuild above roofline', discoveredBy: ['contractor_walkthrough'] },
    { id: 'siding_damage', name: 'Siding Damage', severity: 'mild', costRangeMin: 3000, costRangeMax: 8000, timelineImpactWeeks: 1, description: 'Sections of siding damaged by weather or impact', discoveredBy: ['contractor_walkthrough'] },
    { id: 'porch_rot', name: 'Porch Wood Rot', severity: 'mild', costRangeMin: 2000, costRangeMax: 6000, timelineImpactWeeks: 1, description: 'Porch columns and flooring show signs of rot', discoveredBy: ['contractor_walkthrough'] },
    { id: 'tree_root_damage', name: 'Tree Root Damage', severity: 'moderate', costRangeMin: 4000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Tree roots damaging foundation or sewer lines', discoveredBy: ['inspection'] },
    { id: 'radon_mitigation', name: 'Radon Mitigation', severity: 'mild', costRangeMin: 1500, costRangeMax: 4000, timelineImpactWeeks: 1, description: 'Elevated radon levels require mitigation system', discoveredBy: ['inspection'] },
    { id: 'sump_pump', name: 'Sump Pump Replacement', severity: 'mild', costRangeMin: 1500, costRangeMax: 3500, timelineImpactWeeks: 1, description: 'Sump pump failing, needs replacement before next heavy rain', discoveredBy: ['inspection'] },
  ],
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
  ],
  townhouse: [
    { id: 'roof_shared', name: 'Shared Roof Concerns', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Roof shared with neighbors, coordination needed for repairs', discoveredBy: ['contractor_walkthrough'] },
    { id: 'party_wall', name: 'Party Wall Issues', severity: 'mild', costRangeMin: 2000, costRangeMax: 6000, timelineImpactWeeks: 1, description: 'Shared wall shows settling cracks, coordination with neighbor needed', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'brick_repointing', name: 'Brick Repointing Needed', severity: 'mild', costRangeMin: 3000, costRangeMax: 8000, timelineImpactWeeks: 1, description: 'Mortar between bricks deteriorating', discoveredBy: ['contractor_walkthrough'] },
    { id: 'historic_requirements', name: 'Historic District Requirements', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 4, description: 'Located in historic district with renovation restrictions', discoveredBy: ['title_search'] },
    { id: 'basement_moisture', name: 'Basement Moisture', severity: 'mild', costRangeMin: 3000, costRangeMax: 7000, timelineImpactWeeks: 1, description: 'Evidence of water intrusion in basement', discoveredBy: ['inspection'] },
    { id: 'outdated_hvac', name: 'Outdated HVAC', severity: 'moderate', costRangeMin: 4000, costRangeMax: 9000, timelineImpactWeeks: 2, description: 'HVAC system needs update', discoveredBy: ['contractor_walkthrough'] },
    { id: 'electrical_outdated', name: 'Electrical Upgrade Needed', severity: 'moderate', costRangeMin: 3000, costRangeMax: 7000, timelineImpactWeeks: 2, description: 'Panel insufficient for modern usage', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'plumbing_galvanized', name: 'Old Plumbing', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Galvanized pipes showing corrosion', discoveredBy: ['contractor_walkthrough'] },
    { id: 'structural_settling', name: 'Settling Issues', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Building shows settling, cracked plaster throughout', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'knob_tube_wiring', name: 'Knob & Tube Wiring', severity: 'severe', costRangeMin: 8000, costRangeMax: 18000, timelineImpactWeeks: 3, description: 'Old wiring present, full rewire recommended', discoveredBy: ['inspection'] },
    { id: 'lead_paint', name: 'Lead Paint Present', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Lead paint in older home requires abatement', discoveredBy: ['inspection'] },
  ],
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
  ],
  loft: [
    { id: 'industrial_conversion', name: 'Industrial Conversion Issues', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 3, description: 'Former industrial space has non-residential quirks', discoveredBy: ['contractor_walkthrough', 'inspection'] },
    { id: 'hvac_commercial', name: 'Commercial HVAC', severity: 'moderate', costRangeMin: 4000, costRangeMax: 10000, timelineImpactWeeks: 2, description: 'Commercial-grade HVAC expensive to repair', discoveredBy: ['contractor_walkthrough'] },
    { id: 'plumbing_galvanized', name: 'Old Plumbing', severity: 'moderate', costRangeMin: 5000, costRangeMax: 12000, timelineImpactWeeks: 2, description: 'Original building plumbing aging', discoveredBy: ['contractor_walkthrough'] },
    { id: 'hoa_assessment', name: 'Building Assessment', severity: 'moderate', costRangeMin: 4000, costRangeMax: 12000, timelineImpactWeeks: 0, description: 'Building assessment for facade or systems repair', discoveredBy: ['title_search'] },
    { id: 'window_replacement', name: 'Industrial Windows', severity: 'moderate', costRangeMin: 6000, costRangeMax: 15000, timelineImpactWeeks: 2, description: 'Large industrial windows inefficient, need updating', discoveredBy: ['contractor_walkthrough'] },
    { id: 'fire_suppression', name: 'Fire Suppression System', severity: 'mild', costRangeMin: 2000, costRangeMax: 5000, timelineImpactWeeks: 1, description: 'Fire suppression system needs inspection and updates', discoveredBy: ['inspection'] },
    { id: 'elevator_issues', name: 'Freight Elevator Age', severity: 'moderate', costRangeMin: 5000, costRangeMax: 15000, timelineImpactWeeks: 0, description: 'Building elevator is old freight system, expensive to maintain', discoveredBy: ['inspection'] },
  ],
};

// Seeded random for consistent results per game
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// Map property types to pool keys
function getIssuePoolKey(propertyType: string): string {
  const mapping: Record<string, string> = {
    'house': 'house',
    'condo': 'condo',
    'apartment': 'condo',
    'townhouse': 'townhouse',
    'rowhouse': 'townhouse',
    'duplex': 'duplex',
    'loft': 'loft',
  };
  return mapping[propertyType.toLowerCase()] || 'house';
}

// Get randomized issues based on game run and property
export function getRandomizedPropertyIssues(
  gameRunId: number,
  propertyId: number,
  propertyType: string,
  conditionTag: string
): PropertyIssue[] {
  const seed = gameRunId * 1000 + propertyId;
  const random = seededRandom(seed);
  
  const poolKey = getIssuePoolKey(propertyType);
  const pool = ISSUE_POOLS[poolKey] || ISSUE_POOLS['house'];
  
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
  
  const shuffled = [...pool].sort(() => random() - 0.5);
  
  const selected: PropertyIssue[] = [];
  const usedIds = new Set<string>();
  
  // Ensure at least one severe issue for fixer-uppers
  if ((conditionTag === 'Fixer-Upper' || conditionTag === 'Needs Repairs' || conditionTag === 'Needs-work') && issueCount >= 2) {
    const severeIssues = shuffled.filter(i => i.severity === 'severe' && !usedIds.has(i.id));
    if (severeIssues.length > 0) {
      const severe = severeIssues[Math.floor(random() * severeIssues.length)];
      selected.push(severe);
      usedIds.add(severe.id);
    }
  }
  
  for (const issue of shuffled) {
    if (selected.length >= issueCount) break;
    if (!usedIds.has(issue.id)) {
      selected.push(issue);
      usedIds.add(issue.id);
    }
  }
  
  return selected;
}

// Get revealed issues from randomized pool
export function getRevealedRandomizedIssues(
  gameRunId: number,
  propertyId: number,
  propertyType: string,
  conditionTag: string,
  completedDiligence: string[]
): PropertyIssue[] {
  const allIssues = getRandomizedPropertyIssues(gameRunId, propertyId, propertyType, conditionTag);
  return allIssues.filter(issue =>
    issue.discoveredBy.some(method => completedDiligence.includes(method))
  );
}