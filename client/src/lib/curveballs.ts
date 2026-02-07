/**
 * Curveball Events System
 *
 * Property-aware random events that occur during ownership.
 * Events are dynamically selected and scaled based on:
 * - Property type (house, condo, apartment, townhouse, duplex)
 * - Property condition (fixer-upper, needs-work, good, turnkey)
 * - Property price (scales repair costs proportionally)
 * - Location type (urban vs suburban)
 */

export type CurveballType = 'positive' | 'negative' | 'neutral';
export type CurveballTrigger =
  | 'rental_monthly'      // Can happen during any month of rental
  | 'flip_during_rehab'   // Happens during flip renovation
  | 'flip_at_sale'        // Happens when listing flip property
  | 'purchase'            // Happens right after purchase
  | 'lease_up';           // Happens when finding first tenant

export type PropertyType = 'house' | 'apartment' | 'condo' | 'townhouse' | 'duplex';
export type ConditionTag = 'fixer-upper' | 'needs-work' | 'good' | 'turnkey' | 'cosmetic' | 'dated' | 'fair' | 'excellent';
export type LocationType = 'urban' | 'suburban';

export interface PropertyContext {
  propertyType: PropertyType;
  conditionTag: ConditionTag;
  locationType: LocationType;
  price: number;  // Property purchase price for scaling costs
}

export interface Curveball {
  id: string;
  name: string;
  type: CurveballType;
  trigger: CurveballTrigger;
  probability: number;        // Base probability 0-100 (modified by condition)
  tenantIssue?: boolean;      // Indicates tenant-facing rental issues for popups

  // Financial impact (can be scaled by property value)
  cashImpact?: number;        // Fixed amount: Positive = gain, Negative = cost
  cashImpactMin?: number;     // For variable amounts
  cashImpactMax?: number;
  scaleWithPrice?: boolean;   // If true, costs scale with property value

  // Time impact (in weeks)
  timeImpact?: number;

  // Income impact (for rentals)
  rentMultiplier?: number;    // 1.0 = normal, 0 = no rent this period

  // Description shown to player
  description: string;
  emoji?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue';

  // Property restrictions
  propertyTypes?: PropertyType[];    // Only applies to these types (empty = all)
  locationTypes?: LocationType[];    // Only applies to these locations
  conditionTags?: ConditionTag[];    // More likely for these conditions
  
  // Tenant text message templates (for expense-linked messages)
  // Each personality type can have different messages for the same issue
  tenantMessages?: {
    corporate_brain?: string[];
    retired_micromanager?: string[];
    anxious_professional?: string[];
    new_money?: string[];
    law_curious?: string[];
    lonely_caller?: string[];
    control_seeker?: string[];
    passive_aggressive?: string[];
    chaos_magnet?: string[];
    generic?: string[];  // Fallback for any personality
  };
}

// Condition probability multipliers (worse condition = more issues)
// Keys are lowercase - normalize input values before lookup
const CONDITION_MULTIPLIERS: Record<string, number> = {
  'fixer-upper': 1.8,    // 80% more likely to have issues
  'needs-work': 1.5,     // 50% more likely
  'dated': 1.3,          // 30% more likely
  'cosmetic': 1.1,       // 10% more likely
  'fair': 1.2,           // 20% more likely (common DB value)
  'good': 0.8,           // 20% less likely
  'excellent': 0.5,      // 50% less likely - premium properties
  'turnkey': 0.5,        // 50% less likely - premium properties have fewer issues
};

// Valid condition tags for validation
const VALID_CONDITION_TAGS: ConditionTag[] = [
  'fixer-upper', 'needs-work', 'good', 'turnkey', 'cosmetic', 'dated', 'fair', 'excellent'
];

// Valid property types for validation
const VALID_PROPERTY_TYPES: PropertyType[] = ['house', 'apartment', 'condo', 'townhouse', 'duplex'];

// Valid location types for validation
const VALID_LOCATION_TYPES: LocationType[] = ['urban', 'suburban'];

/**
 * Normalize a condition tag to lowercase for consistent lookup
 * Returns 'good' as default for invalid/missing values
 */
export function normalizeConditionTag(tag: string | null | undefined): ConditionTag {
  if (!tag || typeof tag !== 'string') {
    return 'good'; // Safe default
  }
  
  const normalized = tag.toLowerCase().trim().replace(/\s+/g, '-');
  
  // Validate against known values
  if (VALID_CONDITION_TAGS.includes(normalized as ConditionTag)) {
    return normalized as ConditionTag;
  }
  
  // Map common variants
  if (normalized === 'needs work' || normalized === 'needswork') return 'needs-work';
  if (normalized === 'fixer upper' || normalized === 'fixerupper') return 'fixer-upper';
  
  // Default to 'good' for unknown values
  return 'good';
}

/**
 * Normalize property type to lowercase
 * Returns 'house' as default for invalid/missing values
 */
export function normalizePropertyType(type: string | null | undefined): PropertyType {
  if (!type || typeof type !== 'string') {
    return 'house'; // Safe default
  }
  
  const normalized = type.toLowerCase().trim();
  
  // Validate against known values
  if (VALID_PROPERTY_TYPES.includes(normalized as PropertyType)) {
    return normalized as PropertyType;
  }
  
  // Default to 'house' for unknown values
  return 'house';
}

/**
 * Normalize location type to lowercase
 * Returns 'suburban' as default for invalid/missing values
 */
export function normalizeLocationType(type: string | null | undefined): LocationType {
  if (!type || typeof type !== 'string') {
    return 'suburban'; // Safe default
  }
  
  const normalized = type.toLowerCase().trim();
  
  // Validate against known values
  if (VALID_LOCATION_TYPES.includes(normalized as LocationType)) {
    return normalized as LocationType;
  }
  
  // Default to 'suburban' for unknown values
  return 'suburban';
}

// Price scaling for repair costs (base is $225k property - scaled for realistic prices)
const BASE_PRICE = 225000;

/**
 * POSITIVE CURVEBALLS - Dopamine Hits!
 */
export const POSITIVE_CURVEBALLS: Curveball[] = [
  {
    id: 'tenant_prepay_6mo',
    name: 'Tenant Prepaid 6 Months!',
    type: 'positive',
    trigger: 'lease_up',
    probability: 6,
    rentMultiplier: 6,
    description: 'Your new tenant needed housing ASAP and paid 6 months rent upfront!',
    emoji: '💰',
    color: 'green',
  },
  {
    id: 'neighborhood_boom',
    name: 'Neighborhood Development Announced',
    type: 'positive',
    trigger: 'flip_at_sale',
    probability: 10,
    cashImpactMin: 22000,
    cashImpactMax: 52000,
    scaleWithPrice: true,
    description: 'A major retail development was announced nearby! Buyers are offering over asking.',
    emoji: '🏗️',
    color: 'green',
  },
  {
    id: 'contractor_under_budget',
    name: 'Contractor Beat Estimate',
    type: 'positive',
    trigger: 'flip_during_rehab',
    probability: 14,
    cashImpactMin: 3000,
    cashImpactMax: 12000,
    scaleWithPrice: true,
    description: 'Your contractor found creative solutions and came in under budget!',
    emoji: '🔨',
    color: 'green',
  },
  {
    id: 'material_discount',
    name: 'Material Sale Score',
    type: 'positive',
    trigger: 'flip_during_rehab',
    probability: 12,
    cashImpactMin: 2250,
    cashImpactMax: 7500,
    description: 'Your contractor snagged premium materials at a liquidation sale!',
    emoji: '🎯',
    color: 'green',
  },
  {
    id: 'tax_appeal_win',
    name: 'Tax Assessment Reduced',
    type: 'positive',
    trigger: 'purchase',
    probability: 7,
    cashImpactMin: 1200,
    cashImpactMax: 3600,
    scaleWithPrice: true,
    description: 'Your property tax appeal was successful! Annual taxes reduced.',
    emoji: '📉',
    color: 'green',
  },
  {
    id: 'perfect_tenant',
    name: 'Dream Tenant',
    type: 'positive',
    trigger: 'lease_up',
    probability: 15,
    cashImpactMin: 750,
    cashImpactMax: 2250,
    description: 'Tenant is so excited they paid for minor upgrades themselves!',
    emoji: '🌟',
    color: 'green',
  },
  {
    id: 'insurance_refund',
    name: 'Insurance Credit',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 4,
    cashImpactMin: 600,
    cashImpactMax: 1800,
    description: 'Insurance company issued a credit due to favorable claims history!',
    emoji: '🛡️',
    color: 'green',
  },
  {
    id: 'quick_flip_sale',
    name: 'Instant Buyer',
    type: 'positive',
    trigger: 'flip_at_sale',
    probability: 12,
    timeImpact: -3,
    description: 'A buyer toured and made a full-price offer the same day!',
    emoji: '⚡',
    color: 'green',
  },
  {
    id: 'rent_increase_accepted',
    name: 'Rent Increase Accepted',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 8,
    cashImpactMin: 150,
    cashImpactMax: 450,
    description: 'Tenant agreed to a rent increase due to market conditions!',
    emoji: '📈',
    color: 'green',
  },
  {
    id: 'early_lease_renewal',
    name: 'Early Renewal',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 7,
    cashImpact: 1500,
    description: 'Tenant loves the place and signed a 2-year lease renewal early!',
    emoji: '🤝',
    color: 'green',
  },
  // NEW: Momentum curveballs - success breeds success
  {
    id: 'investor_referral',
    name: 'Investor Network Referral',
    type: 'positive',
    trigger: 'flip_at_sale',
    probability: 8,
    cashImpactMin: 5000,
    cashImpactMax: 15000,
    description: 'Impressed by your work, another investor referred you to an off-market deal with finder\'s fee!',
    emoji: '🤝',
    color: 'green',
  },
  {
    id: 'contractor_loyalty_bonus',
    name: 'Contractor Loyalty Discount',
    type: 'positive',
    trigger: 'flip_during_rehab',
    probability: 6,
    cashImpactMin: 4000,
    cashImpactMax: 10000,
    scaleWithPrice: true,
    description: 'Your contractor appreciated the repeat business and gave you a loyalty discount!',
    emoji: '💪',
    color: 'green',
  },
  {
    id: 'bidding_war',
    name: 'Bidding War',
    type: 'positive',
    trigger: 'flip_at_sale',
    probability: 7,
    cashImpactMin: 12000,
    cashImpactMax: 35000,
    scaleWithPrice: true,
    description: 'Multiple buyers competing for your property drove the price above asking!',
    emoji: '🔥',
    color: 'green',
  },
  {
    id: 'tenant_referral',
    name: 'Tenant Referral Bonus',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 5,
    cashImpactMin: 500,
    cashImpactMax: 1500,
    description: 'Your happy tenant referred a friend who became a tenant at another property!',
    emoji: '👥',
    color: 'green',
  },
];

/**
 * NEGATIVE CURVEBALLS - Property-Specific Realistic Challenges
 */
export const NEGATIVE_CURVEBALLS: Curveball[] = [
  // === UNIVERSAL ISSUES (all property types) ===
  {
    id: 'late_rent',
    name: 'Rent Payment Delayed',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 6,
    timeImpact: 1,
    description: 'Tenant had a payroll issue - rent will be 1 week late.',
    emoji: '😬',
    color: 'yellow',
    tenantMessages: {
      corporate_brain: ["hey quick flag - payroll delayed this cycle. rent will hit next week. sorry for any cashflow disruption"],
      anxious_professional: ["im SO sorry my paycheck got delayed. ill have rent next week i promise please dont hate me"],
      passive_aggressive: ["rent will be a little late. im sure u understand, these things happen. like maintenance requests sometimes"],
      chaos_magnet: ["ok so my company switched payroll systems and somehow i dont exist anymore?? working on it. rent next week"],
      generic: ["hey paycheck got delayed - rent will be about a week late. sorry!"],
    },
  },
  {
    id: 'appliance_breakdown',
    name: 'Appliance Failure',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 5,
    cashImpactMin: -600,
    cashImpactMax: -1800,
    scaleWithPrice: true,
    description: 'The dishwasher died and needs replacement.',
    emoji: '🔧',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["dishwasher is EOL. made a grinding noise now nothing. can we prioritize replacement"],
      retired_micromanager: ["Dishwasher stopped at 2:47 PM. 3 loud clicks then smoke. I have video."],
      anxious_professional: ["dishwasher died and im stressed?? is this an emergency should i worry about water damage"],
      new_money: ["dishwasher broke. can we get a stainless steel replacement that matches the fridge"],
      chaos_magnet: ["dishwasher DIED. mid cycle. theres water everywhere. this always happens to me"],
      passive_aggressive: ["dishwashers gone. been hand washing for days now. very character building"],
      generic: ["hey dishwasher stopped working. wont turn on. can someone look at it?"],
    },
  },
  {
    id: 'appliance_minor',
    name: 'Appliance Repair',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -225,
    cashImpactMax: -600,
    description: 'The garbage disposal jammed and needs a repair visit.',
    emoji: '🔧',
    color: 'yellow',
    tenantMessages: {
      corporate_brain: ["garbage disposal making weird noises. can we sync on getting this fixed"],
      retired_micromanager: ["Garbage disposal jammed at 6:15 PM. Tried reset button 4 times. Hex key didnt work. Documenting."],
      anxious_professional: ["garbage disposal made a horrible noise and stopped. did i break it?? im so sorry"],
      chaos_magnet: ["garbage disposal just made a noise like a blender eating rocks. i didnt put rocks in it. i think"],
      generic: ["hey garbage disposal jammed. tried resetting it but not working"],
    },
  },
  {
    id: 'hvac_repair',
    name: 'HVAC Needs Service',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 4,
    cashImpactMin: -450,
    cashImpactMax: -1350,
    scaleWithPrice: true,
    description: 'AC unit needs freon recharge and minor repairs.',
    emoji: '🌡️',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work', 'dated', 'cosmetic'],
    tenantMessages: {
      corporate_brain: ["ac outputting warm air. home office at 84 degrees. productivity impacted"],
      retired_micromanager: ["AC cycling every 3 min instead of 12. Temps up 8 degrees. I have hourly readings."],
      anxious_professional: ["ac isnt working and its getting really hot. is this a freon thing?? are leaks dangerous"],
      new_money: ["ac situation untenable. 82 degrees in here. can we fast track an hvac tech"],
      chaos_magnet: ["ac blowing HOT AIR. in the summer. im melting. this place hates me"],
      passive_aggressive: ["ac seems to be on vacation! been using a hand fan. very retro. no rush"],
      generic: ["hey ac stopped cooling. running but blowing warm air. can someone look at it"],
    },
  },
  {
    id: 'water_heater',
    name: 'Water Heater Replacement',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: -1200,
    cashImpactMax: -2700,
    scaleWithPrice: true,
    description: 'Water heater gave out and needs emergency replacement.',
    emoji: '💧',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["no hot water. water heater failed. habitability blocker. eta on resolution?"],
      retired_micromanager: ["No hot water. Waited 47 min. Pilot light out wont relight. Tank cold."],
      anxious_professional: ["theres no hot water and im freaking out. is the water heater supposed to hiss?? should i worry about explosion"],
      new_money: ["no hot water is a nonstarter. need this fixed today. cold showers not gonna work"],
      chaos_magnet: ["water heater died. of course. was mid shower when it went ice cold. INSTANT"],
      law_curious: ["documenting we have no hot water. believe there are habitability standards. whats the timeline"],
      generic: ["hey no hot water. think water heater broke. kinda urgent - can someone come today?"],
    },
  },
  {
    id: 'small_plumbing_leak',
    name: 'Plumbing Leak',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 4,
    cashImpactMin: -375,
    cashImpactMax: -1200,
    description: 'Small leak under kitchen sink needs repair.',
    emoji: '🚰',
    color: 'yellow',
    tenantMessages: {
      corporate_brain: ["leak under kitchen sink. bucket in place. lmk when u have bandwidth"],
      retired_micromanager: ["Leak under sink found at 3:22 PM. Dripping every 4 sec. ~2 cups per hour. Photos ready."],
      anxious_professional: ["theres water under the kitchen sink!! is this mold level serious or just annoying level serious"],
      chaos_magnet: ["mysterious puddle under the sink. somethings leaking. not dramatic yet but give it time"],
      passive_aggressive: ["been emptying a bucket every few hours for the leak. kinda meditative actually. whenever ur free"],
      generic: ["hey theres a leak under the kitchen sink. not major but pooling. plumber?"],
    },
  },
  {
    id: 'electrical_issue',
    name: 'Electrical Problem',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: -300,
    cashImpactMax: -900,
    description: 'Outlet stopped working - electrician needed.',
    emoji: '⚡',
    color: 'yellow',
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["outlet in bedroom offline. laptop charger works elsewhere so its def this one. electrician?"],
      anxious_professional: ["is the outlet supposed to buzz?? also it stopped working. prob nothing right"],
      chaos_magnet: ["plugged in my phone and there was a SPARK. outlet doesnt work now. didnt do anything weird i swear"],
      retired_micromanager: ["Outlet stopped at 10:15 AM. Tested 3 devices. Breaker fine. Documenting."],
      generic: ["hey outlet stopped working. checked breaker looks fine. electrician needed?"],
    },
  },
  {
    id: 'early_lease_break',
    name: 'Tenant Breaking Lease',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 1,
    cashImpactMin: -1500,
    cashImpactMax: -3750,
    description: 'Tenant got transferred for work - breaking lease early.',
    emoji: '😔',
    color: 'red',
  },

  // === HOUSE-SPECIFIC ISSUES ===
  {
    id: 'roof_leak',
    name: 'Roof Leak',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -750,
    cashImpactMax: -3000,
    scaleWithPrice: true,
    description: 'Storm revealed a roof leak - patching needed.',
    emoji: '🏠',
    color: 'red',
    propertyTypes: ['house', 'townhouse'],
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["high priority - ceiling leaking after storm. bucket in place but need roof assessment asap"],
      anxious_professional: ["theres a water stain on ceiling... should i worry? its getting bigger. oh no its dripping now help"],
      chaos_magnet: ["ceiling is dripping. waters coming from ABOVE the ceiling. how is that possible"],
      law_curious: ["documenting roof leak in bedroom. water actively coming thru ceiling. affects habitability. timeline?"],
      generic: ["water coming thru ceiling after the storm. looks like roof leak. can someone come out?"],
    },
  },
  {
    id: 'foundation_crack',
    name: 'Foundation Concern',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 1,
    cashImpactMin: -1200,
    cashImpactMax: -4500,
    scaleWithPrice: true,
    description: 'Small foundation crack appeared - needs sealing and monitoring.',
    emoji: '🧱',
    color: 'red',
    propertyTypes: ['house'],
    conditionTags: ['fixer-upper', 'needs-work'],
  },
  {
    id: 'yard_maintenance',
    name: 'Landscaping Issue',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 5,
    cashImpactMin: -300,
    cashImpactMax: -900,
    description: 'Tree limb fell and damaged fence - cleanup and repair needed.',
    emoji: '🌳',
    color: 'yellow',
    propertyTypes: ['house', 'townhouse'],
  },
  {
    id: 'pest_mice',
    name: 'Mouse Problem',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 4,
    cashImpactMin: -225,
    cashImpactMax: -600,
    tenantIssue: true,
    description: 'Tenant spotted mice - exterminator visit needed.',
    emoji: '🐭',
    color: 'yellow',
    propertyTypes: ['house'],
    locationTypes: ['suburban'],
    tenantMessages: {
      anxious_professional: ["heard scratching in the wall last night. probably just settling right?? RIGHT?? ok i saw a mouse pls help"],
      chaos_magnet: ["somethings living in my walls. heard it sneeze. DO MICE SNEEZE. saw one run across kitchen at 2am"],
      retired_micromanager: ["Spotted mouse 3 times. Kitchen once, pantry twice. Set 4 traps. Theyre avoiding them. Exterminator needed."],
      passive_aggressive: ["noticed some new roommates! small with tails. leaving little presents in the pantry. im sure theyll leave eventually"],
      generic: ["hey saw a mouse in the kitchen. actually a few times now. exterminator?"],
    },
  },
  {
    id: 'pest_termites',
    name: 'Termite Inspection',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: -600,
    cashImpactMax: -1800,
    description: 'Routine inspection found termite activity - treatment required.',
    emoji: '🐜',
    color: 'red',
    propertyTypes: ['house'],
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
  },
  {
    id: 'septic_issue',
    name: 'Septic System Issue',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: -750,
    cashImpactMax: -2250,
    description: 'Septic tank needs pumping - backing up.',
    emoji: '🚽',
    color: 'red',
    propertyTypes: ['house'],
    locationTypes: ['suburban'],
  },
  {
    id: 'garage_door',
    name: 'Garage Door Repair',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -300,
    cashImpactMax: -750,
    description: 'Garage door motor failed - needs replacement.',
    emoji: '🚗',
    color: 'yellow',
    propertyTypes: ['house', 'townhouse'],
  },

  // === CONDO/APARTMENT-SPECIFIC ISSUES ===
  {
    id: 'hoa_special_assessment',
    name: 'HOA Special Assessment',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -2250,
    cashImpactMax: -6000,
    scaleWithPrice: true,
    description: 'HOA passed a special assessment for building roof repairs.',
    emoji: '🏘️',
    color: 'red',
    propertyTypes: ['condo', 'apartment', 'townhouse'],
  },
  {
    id: 'hoa_fee_increase',
    name: 'HOA Dues Increased',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -300,
    cashImpactMax: -750,
    description: 'Monthly HOA fees increased due to rising insurance costs.',
    emoji: '📊',
    color: 'yellow',
    propertyTypes: ['condo', 'apartment', 'townhouse'],
  },
  {
    id: 'elevator_assessment',
    name: 'Elevator Modernization',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 1,
    cashImpactMin: -1500,
    cashImpactMax: -4500,
    scaleWithPrice: true,
    description: 'Building elevator needs modernization - owner assessment.',
    emoji: '🛗',
    color: 'red',
    propertyTypes: ['condo', 'apartment'],
  },
  {
    id: 'parking_issue',
    name: 'Parking Dispute',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: -150,
    cashImpactMax: -450,
    tenantIssue: true,
    description: 'Parking situation changed - had to rent additional spot.',
    emoji: '🅿️',
    color: 'yellow',
    propertyTypes: ['condo', 'apartment'],
    locationTypes: ['urban'],
  },
  {
    id: 'noise_complaint',
    name: 'Noise Complaint',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    timeImpact: 1,
    tenantIssue: true,
    description: 'Neighbor complained about noise - tenant relations strained.',
    emoji: '🔊',
    color: 'yellow',
    propertyTypes: ['condo', 'apartment', 'townhouse', 'duplex'],
    locationTypes: ['urban'],
  },

  // === DUPLEX-SPECIFIC ISSUES ===
  {
    id: 'shared_utility_dispute',
    name: 'Utility Billing Issue',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -225,
    cashImpactMax: -600,
    tenantIssue: true,
    description: 'Shared utility meter caused billing confusion - had to credit tenant.',
    emoji: '💡',
    color: 'yellow',
    propertyTypes: ['duplex'],
  },
  {
    id: 'neighbor_conflict',
    name: 'Tenant Conflict',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    timeImpact: 1,
    tenantIssue: true,
    description: 'Tenants in both units not getting along - mediation needed.',
    emoji: '😤',
    color: 'yellow',
    propertyTypes: ['duplex'],
  },

  // === FLIP-SPECIFIC ISSUES ===
  {
    id: 'permit_delay',
    name: 'Permit Delays',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 10,
    timeImpact: 2,
    description: 'City permitting is backed up - 2 week delay on inspections.',
    emoji: '📋',
    color: 'yellow',
  },
  {
    id: 'material_price_spike',
    name: 'Material Cost Increase',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 7,
    cashImpactMin: -2250,
    cashImpactMax: -6750,
    scaleWithPrice: true,
    description: 'Material prices spiked. Budget needs adjustment.',
    emoji: '📊',
    color: 'red',
  },
  {
    id: 'contractor_scheduling',
    name: 'Contractor Delay',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 10,
    timeImpact: 1,
    description: 'Your contractor had another job run long - 1 week delay.',
    emoji: '⏰',
    color: 'yellow',
  },
  {
    id: 'hidden_damage',
    name: 'Hidden Damage Found',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 6,
    cashImpactMin: -3000,
    cashImpactMax: -9000,
    scaleWithPrice: true,
    description: 'Demo revealed hidden water damage behind walls.',
    emoji: '😱',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work'],
  },
  {
    id: 'failed_inspection',
    name: 'Failed Inspection',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 5,
    timeImpact: 1,
    cashImpactMin: -750,
    cashImpactMax: -2250,
    description: 'Electrical inspection failed - rewiring needed.',
    emoji: '❌',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
  },
  {
    id: 'failed_showing',
    name: 'Buyer Inspection Issues',
    type: 'negative',
    trigger: 'flip_at_sale',
    probability: 6,
    timeImpact: 2,
    cashImpactMin: -1500,
    cashImpactMax: -4500,
    description: "Buyer's inspector found minor issues - needs fixes and re-listing.",
    emoji: '🔍',
    color: 'red',
  },

  // === TENANT MINOR ISSUES ===
  {
    id: 'tenant_key_replacement',
    name: 'Lock Rekey',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    tenantIssue: true,
    cashImpactMin: -135,
    cashImpactMax: -330,
    description: 'Tenant lost keys - lock rekey for safety.',
    emoji: '🗝️',
    color: 'yellow',
  },
  {
    id: 'tenant_drain_issue',
    name: 'Slow Drain Fix',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    tenantIssue: true,
    cashImpactMin: -210,
    cashImpactMax: -540,
    description: 'Tenant reported a slow drain that needs plumber.',
    emoji: '🧰',
    color: 'yellow',
  },
];

/**
 * NEUTRAL CURVEBALLS - Educational moments
 */
export const NEUTRAL_CURVEBALLS: Curveball[] = [
  {
    id: 'market_insight',
    name: 'Market Trend Update',
    type: 'neutral',
    trigger: 'rental_monthly',
    probability: 6,
    description: 'Local real estate report: Your neighborhood rental rates are trending up 3% YoY.',
    emoji: '📰',
    color: 'blue',
  },
  {
    id: 'tenant_maintenance_request',
    name: 'Routine Maintenance',
    type: 'neutral',
    trigger: 'rental_monthly',
    probability: 10,
    cashImpactMin: -110,
    cashImpactMax: -300,
    description: 'Tenant requested routine maintenance - filter changes, caulking, minor touch-ups.',
    emoji: '✅',
    color: 'blue',
  },
  {
    id: 'insurance_renewal',
    name: 'Insurance Renewal',
    type: 'neutral',
    trigger: 'rental_monthly',
    probability: 3,
    description: 'Annual insurance policy renewed - rates held steady this year.',
    emoji: '📄',
    color: 'blue',
  },
];

/**
 * Filter curveballs applicable to a specific property context
 */
function filterCurveballsForProperty(
  curveballs: Curveball[],
  context: PropertyContext
): Curveball[] {
  // Normalize context values for comparison
  const normalizedPropertyType = normalizePropertyType(context.propertyType);
  const normalizedLocationType = normalizeLocationType(context.locationType);
  
  return curveballs.filter(cb => {
    // Check property type restriction
    if (cb.propertyTypes && cb.propertyTypes.length > 0) {
      if (!cb.propertyTypes.includes(normalizedPropertyType)) {
        return false;
      }
    }

    // Check location type restriction
    if (cb.locationTypes && cb.locationTypes.length > 0) {
      if (!cb.locationTypes.includes(normalizedLocationType)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Get probability multiplier based on property condition and curveball type
 */
function getProbabilityMultiplier(
  curveball: Curveball,
  context: PropertyContext
): number {
  // Normalize the condition tag for lookup
  const normalizedCondition = normalizeConditionTag(context.conditionTag);
  
  // Positive curveballs are slightly more likely for excellent/turnkey properties
  if (curveball.type === 'positive') {
    return (normalizedCondition === 'turnkey' || normalizedCondition === 'excellent') ? 1.2 : 1.0;
  }

  // Neutral curveballs stay the same
  if (curveball.type === 'neutral') {
    return 1.0;
  }

  // Negative curveballs use condition multiplier (using normalized lookup)
  let multiplier = CONDITION_MULTIPLIERS[normalizedCondition] ?? 1.0;

  // If this curveball has preferred conditions and we match, boost probability
  if (curveball.conditionTags && curveball.conditionTags.length > 0) {
    if (curveball.conditionTags.includes(normalizedCondition)) {
      multiplier *= 1.3; // 30% more likely if condition matches
    } else {
      multiplier *= 0.5; // 50% less likely if condition doesn't match
    }
  }

  return multiplier;
}

/**
 * Scale cash impact based on property price
 */
function scaleCashImpact(
  baseAmount: number,
  context: PropertyContext,
  shouldScale: boolean
): number {
  if (!shouldScale) return baseAmount;

  const priceRatio = context.price / BASE_PRICE;
  // Cap scaling between 0.6x and 2.0x
  const clampedRatio = Math.max(0.6, Math.min(2.0, priceRatio));

  return Math.round(baseAmount * clampedRatio);
}

/**
 * Get all curveballs for a specific trigger type and property context
 */
export function getCurveballsForTrigger(
  trigger: CurveballTrigger,
  context?: PropertyContext
): Curveball[] {
  const all = [...POSITIVE_CURVEBALLS, ...NEGATIVE_CURVEBALLS, ...NEUTRAL_CURVEBALLS];
  let filtered = all.filter(cb => cb.trigger === trigger);

  if (context) {
    filtered = filterCurveballsForProperty(filtered, context);
  }

  return filtered;
}

/**
 * Roll for a random curveball event with property context
 * Returns null if no event occurs
 */
export function rollForCurveball(
  trigger: CurveballTrigger,
  context?: PropertyContext,
  excludeIds?: string[]
): Curveball | null {
  let possibleEvents = getCurveballsForTrigger(trigger, context);
  
  // Filter out recently-used curveballs to avoid unrealistic repetition
  // (same issue shouldn't happen twice in a row on same property)
  if (excludeIds && excludeIds.length > 0) {
    possibleEvents = possibleEvents.filter(e => !excludeIds.includes(e.id));
  }

  // Shuffle events to eliminate ordering bias (Fisher-Yates)
  for (let i = possibleEvents.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possibleEvents[i], possibleEvents[j]] = [possibleEvents[j], possibleEvents[i]];
  }

  // Each event rolls independently (now in random order)
  for (const event of possibleEvents) {
    const probabilityMultiplier = context
      ? getProbabilityMultiplier(event, context)
      : 1.0;

    const adjustedProbability = event.probability * probabilityMultiplier;
    const roll = Math.random() * 100;

    if (roll < adjustedProbability) {
      // Event triggered! Calculate variable amounts if needed
      const resolvedEvent = { ...event };

      if (event.cashImpactMin !== undefined && event.cashImpactMax !== undefined) {
        const range = event.cashImpactMax - event.cashImpactMin;
        let amount = Math.floor(event.cashImpactMin + Math.random() * range);

        // Scale with property price if applicable
        if (context && event.scaleWithPrice) {
          amount = scaleCashImpact(amount, context, true);
        }

        resolvedEvent.cashImpact = amount;
      } else if (event.cashImpact !== undefined && context && event.scaleWithPrice) {
        resolvedEvent.cashImpact = scaleCashImpact(event.cashImpact, context, true);
      }

      return resolvedEvent;
    }
  }

  return null; // No event this time
}

/**
 * Roll for multiple curveballs (used for longer time periods)
 * Limits to max 1 event per check to avoid overwhelming player
 */
export function rollForCurveballs(
  trigger: CurveballTrigger,
  numRolls: number = 1,
  context?: PropertyContext
): Curveball | null {
  for (let i = 0; i < numRolls; i++) {
    const result = rollForCurveball(trigger, context);
    if (result) {
      return result; // Return first event that triggers
    }
  }
  return null;
}

/**
 * Get a tenant message for a curveball event based on personality type
 * Returns the expense-linked message if available, null otherwise
 */
export function getTenantMessageForCurveball(
  curveball: Curveball,
  personalityType: string
): string | null {
  if (!curveball.tenantMessages) {
    return null; // This curveball doesn't have tenant messages
  }
  
  // Try to get message for specific personality
  const personalityMessages = curveball.tenantMessages[personalityType as keyof typeof curveball.tenantMessages];
  if (personalityMessages && personalityMessages.length > 0) {
    return personalityMessages[Math.floor(Math.random() * personalityMessages.length)];
  }
  
  // Fall back to generic messages
  const genericMessages = curveball.tenantMessages.generic;
  if (genericMessages && genericMessages.length > 0) {
    return genericMessages[Math.floor(Math.random() * genericMessages.length)];
  }
  
  return null;
}

/**
 * Check if a curveball has tenant messages (for deciding whether to show text popup)
 */
export function curveballHasTenantMessage(curveball: Curveball): boolean {
  return curveball.tenantMessages !== undefined && 
         Object.keys(curveball.tenantMessages).length > 0;
}

/**
 * Look up a curveball definition by ID
 * Used when backend returns minimal curveball info and we need the full definition
 */
export function getCurveballById(id: string): Curveball | undefined {
  const all = [...POSITIVE_CURVEBALLS, ...NEGATIVE_CURVEBALLS, ...NEUTRAL_CURVEBALLS];
  return all.find(cb => cb.id === id);
}

/**
 * Map property issues to related curveball IDs
 * When a property has undiscovered issues, these can manifest as specific repairs
 */
const ISSUE_TO_CURVEBALL_MAP: Record<string, string[]> = {
  // Structural/Foundation issues
  'foundation_settling': ['foundation_crack'],
  'foundation_issues': ['foundation_crack'],
  
  // Roof issues
  'roof_wear': ['roof_leak'],
  'roof_damage': ['roof_leak'],
  
  // HVAC issues
  'outdated_hvac': ['hvac_repair', 'hvac_emergency'],
  'hvac_issues': ['hvac_repair', 'hvac_emergency'],
  
  // Plumbing issues
  'plumbing_galvanized': ['small_plumbing_leak', 'water_heater'],
  'plumbing_issues': ['small_plumbing_leak', 'water_heater'],
  
  // Electrical issues
  'electrical_outdated': ['electrical_issue'],
  'electrical_issues': ['electrical_issue'],
  
  // Mold/moisture issues
  'mold_remediation': ['mold_issue', 'small_plumbing_leak'],
  'moisture_issues': ['mold_issue', 'small_plumbing_leak'],
  'drainage_issues': ['foundation_crack', 'mold_issue'],
  
  // Pest issues
  'pest_issues': ['pest_mice', 'pest_termites'],
  
  // Appliance issues (dated properties)
  'dated_appliances': ['appliance_breakdown', 'appliance_minor'],
};

/**
 * Result structure that includes tenant message for curveballss
 */
export interface CurveballResult {
  curveball: Curveball;
  tenantMessage?: string | null;
  fromIssue?: boolean;  // Whether this repair was caused by undiscovered issue
  issueId?: string;     // The issue ID that caused it
}

/**
 * Roll for a curveball with enhanced probability for undiscovered property issues
 * @param trigger - The trigger type (rental_monthly, flip_during_rehab, etc.)
 * @param context - Property context (type, condition, location, price)
 * @param undiscoveredIssues - Array of issue IDs that weren't discovered during due diligence
 * @param tenantPersonality - The tenant's personality type for message generation
 * @param excludeIds - Curveball IDs to exclude (prevent repetition)
 */
export function rollForCurveballWithIssues(
  trigger: CurveballTrigger,
  context?: PropertyContext,
  undiscoveredIssues?: string[],
  tenantPersonality?: string,
  excludeIds?: string[]
): CurveballResult | null {
  // First, check if we should trigger an issue-based repair
  // 20% chance per undiscovered issue to cause a related repair
  if (undiscoveredIssues && undiscoveredIssues.length > 0 && trigger === 'rental_monthly') {
    for (const issueId of undiscoveredIssues) {
      const relatedCurveballIds = ISSUE_TO_CURVEBALL_MAP[issueId];
      if (relatedCurveballIds && relatedCurveballIds.length > 0) {
        // 15% chance per issue per check
        const issueRoll = Math.random() * 100;
        if (issueRoll < 15) {
          // Pick a related curveball
          const curveballId = relatedCurveballIds[Math.floor(Math.random() * relatedCurveballIds.length)];
          const curveball = getCurveballById(curveballId);
          
          if (curveball && (!excludeIds || !excludeIds.includes(curveballId))) {
            // Resolve variable amounts
            const resolvedCurveball = { ...curveball };
            if (curveball.cashImpactMin !== undefined && curveball.cashImpactMax !== undefined) {
              const range = curveball.cashImpactMax - curveball.cashImpactMin;
              let amount = Math.floor(curveball.cashImpactMin + Math.random() * range);
              if (context && curveball.scaleWithPrice) {
                amount = Math.round(amount * Math.max(0.6, Math.min(2.0, (context.price / BASE_PRICE))));
              }
              resolvedCurveball.cashImpact = amount;
            }
            
            // Get tenant message if available
            let tenantMessage: string | null = null;
            if (tenantPersonality) {
              tenantMessage = getTenantMessageForCurveball(resolvedCurveball, tenantPersonality);
            }
            
            return {
              curveball: resolvedCurveball,
              tenantMessage,
              fromIssue: true,
              issueId,
            };
          }
        }
      }
    }
  }
  
  // Fall back to normal curveball roll
  const curveball = rollForCurveball(trigger, context, excludeIds);
  if (curveball) {
    let tenantMessage: string | null = null;
    if (tenantPersonality) {
      tenantMessage = getTenantMessageForCurveball(curveball, tenantPersonality);
    }
    return {
      curveball,
      tenantMessage,
      fromIssue: false,
    };
  }
  
  return null;
}

/**
 * Format cash impact for display
 */
export function formatCurveballImpact(curveball: Curveball): string {
  if (curveball.cashImpact === undefined) return '';

  const abs = Math.abs(curveball.cashImpact);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);

  return curveball.cashImpact >= 0 ? `+${formatted}` : `-${formatted}`;
}
