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

// Price scaling for repair costs (base is $150k property)
const BASE_PRICE = 150000;

/**
 * POSITIVE CURVEBALLS - Dopamine Hits!
 */
export const POSITIVE_CURVEBALLS: Curveball[] = [
  {
    id: 'tenant_prepay_6mo',
    name: 'Tenant Prepaid 6 Months!',
    type: 'positive',
    trigger: 'lease_up',
    probability: 4,
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
    probability: 6,
    cashImpactMin: 15000,
    cashImpactMax: 35000,
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
    probability: 10,
    cashImpactMin: 2000,
    cashImpactMax: 8000,
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
    probability: 8,
    cashImpactMin: 1500,
    cashImpactMax: 5000,
    description: 'Your contractor snagged premium materials at a liquidation sale!',
    emoji: '🎯',
    color: 'green',
  },
  {
    id: 'tax_appeal_win',
    name: 'Tax Assessment Reduced',
    type: 'positive',
    trigger: 'purchase',
    probability: 5,
    cashImpactMin: 800,
    cashImpactMax: 2400,
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
    probability: 12,
    cashImpactMin: 500,
    cashImpactMax: 1500,
    description: 'Tenant is so excited they paid for minor upgrades themselves!',
    emoji: '🌟',
    color: 'green',
  },
  {
    id: 'insurance_refund',
    name: 'Insurance Credit',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: 400,
    cashImpactMax: 1200,
    description: 'Insurance company issued a credit due to favorable claims history!',
    emoji: '🛡️',
    color: 'green',
  },
  {
    id: 'quick_flip_sale',
    name: 'Instant Buyer',
    type: 'positive',
    trigger: 'flip_at_sale',
    probability: 8,
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
    probability: 5,
    cashImpactMin: 100,
    cashImpactMax: 300,
    description: 'Tenant agreed to a rent increase due to market conditions!',
    emoji: '📈',
    color: 'green',
  },
  {
    id: 'early_lease_renewal',
    name: 'Early Renewal',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 4,
    cashImpact: 1000,
    description: 'Tenant loves the place and signed a 2-year lease renewal early!',
    emoji: '🤝',
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
    probability: 8,
    timeImpact: 1,
    description: 'Tenant had a payroll issue - rent will be 1 week late.',
    emoji: '😬',
    color: 'yellow',
    tenantMessages: {
      corporate_brain: ["Hey! Quick flag - my payroll got delayed this cycle. Rent will hit your account next week. Apologies for any cash flow disruption on your end!"],
      anxious_professional: ["Hi, I'm SO sorry to tell you this but my paycheck got delayed. I'll have the rent to you next week, I promise. Please don't hate me."],
      passive_aggressive: ["Just wanted to let you know rent will be a little late. I'm sure you understand these things happen, like how maintenance requests sometimes take a while too."],
      chaos_magnet: ["You're not going to believe this but my company switched payroll systems and somehow I don't exist anymore?? Working on it. Rent next week for sure."],
      generic: ["Hey, my paycheck got delayed - rent will be about a week late. Sorry for the inconvenience!"],
    },
  },
  {
    id: 'appliance_breakdown',
    name: 'Appliance Failure',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 6,
    cashImpactMin: -400,
    cashImpactMax: -1200,
    scaleWithPrice: true,
    description: 'The dishwasher died and needs replacement.',
    emoji: '🔧',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["Circling back on an urgent matter - the dishwasher has officially EOL'd. It made a grinding noise and now displays nothing. Can we prioritize a replacement?"],
      retired_micromanager: ["The dishwasher stopped working at 2:47 PM today. I documented the failure - it made 3 loud clicks, then smoke came out. I have video if needed."],
      anxious_professional: ["The dishwasher died and I'm a little stressed because I have a lot of dishes?? Is this an emergency? Should I be worried about water damage? I'm probably overthinking this."],
      new_money: ["The dishwasher broke. I'd appreciate an expedited replacement - ideally something stainless steel that matches the fridge. Happy to discuss upgrade options."],
      chaos_magnet: ["The dishwasher straight up DIED. Mid-cycle. There's water everywhere. Well, not everywhere, but enough. This always happens to me."],
      passive_aggressive: ["The dishwasher finally gave up. I've been hand-washing dishes for a few days now. It's very character-building! Let me know when you can address it."],
      generic: ["Hey, the dishwasher stopped working. It won't turn on at all. Can you send someone to take a look?"],
    },
  },
  {
    id: 'appliance_minor',
    name: 'Appliance Repair',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 4,
    cashImpactMin: -150,
    cashImpactMax: -400,
    description: 'The garbage disposal jammed and needs a repair visit.',
    emoji: '🔧',
    color: 'yellow',
    tenantMessages: {
      corporate_brain: ["Quick sync - the garbage disposal is making a sound that's definitely not in the user manual. Can we align on getting this fixed?"],
      retired_micromanager: ["The garbage disposal jammed at 6:15 PM. I tried the reset button (pushed it 4 times) and used the hex key. No luck. Documenting for your records."],
      anxious_professional: ["The garbage disposal made a horrible noise and stopped. I may have put too much down it? I'm so sorry if I broke it. Can someone take a look?"],
      chaos_magnet: ["Add this to my file: the garbage disposal just made a noise like a blender eating rocks. I didn't put rocks in it. I think."],
      generic: ["Hey, the garbage disposal is jammed. I tried resetting it but it's not working. Can you send someone?"],
    },
  },
  {
    id: 'hvac_repair',
    name: 'HVAC Needs Service',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 5,
    cashImpactMin: -300,
    cashImpactMax: -900,
    scaleWithPrice: true,
    description: 'AC unit needs freon recharge and minor repairs.',
    emoji: '🌡️',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work', 'dated', 'cosmetic'],
    tenantMessages: {
      corporate_brain: ["Flagging a climate control issue - the AC is outputting warm air. My home office is currently 84 degrees. This is impacting my productivity significantly."],
      retired_micromanager: ["The AC has been cycling every 3 minutes instead of the usual 12. The temperature has gone up 8 degrees since yesterday. I have hourly readings if you need them."],
      anxious_professional: ["The AC isn't working and it's getting really hot. Is this a freon thing? I googled it and now I'm worried about refrigerant leaks. Are those dangerous??"],
      new_money: ["The AC situation is becoming untenable. It's 82 degrees in here. Is there a way to fast-track an HVAC tech? I'm happy to pay extra for priority service."],
      chaos_magnet: ["The AC is blowing hot air now. HOT. AIR. In the summer. I'm melting. This unit has it out for me, I swear."],
      passive_aggressive: ["The AC seems to be on vacation! It's been blowing warm air for a few days. I've been using a hand fan - very retro! No rush, I'm sure you're busy."],
      generic: ["Hey, the AC stopped cooling. It's running but just blowing warm air. Can we get someone out to look at it?"],
    },
  },
  {
    id: 'water_heater',
    name: 'Water Heater Replacement',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -800,
    cashImpactMax: -1800,
    scaleWithPrice: true,
    description: 'Water heater gave out and needs emergency replacement.',
    emoji: '💧',
    color: 'red',
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["Critical infrastructure alert - we have no hot water. The water heater appears to have failed. This is a habitability blocker. Please advise on ETA for resolution."],
      retired_micromanager: ["No hot water this morning. I waited 47 minutes for it to warm up (I timed it). Checked the pilot light - it's out and won't relight. Tank feels cold."],
      anxious_professional: ["There's no hot water and I'm kind of freaking out. Is the water heater supposed to make a hissing sound? Should I be worried about it exploding?? Please help."],
      new_money: ["No hot water is a non-starter for me. I need this addressed urgently. I have calls all day and cold showers aren't going to work."],
      chaos_magnet: ["The water heater died. Of course it did. I was in the shower when it went from hot to ice cold. INSTANT. Like the universe was waiting."],
      law_curious: ["I wanted to document that we have no hot water. I believe there are habitability standards around this. What's the timeline for getting this fixed?"],
      generic: ["Hey, we have no hot water. I think the water heater broke. This is kind of urgent - can you send someone today?"],
    },
  },
  {
    id: 'small_plumbing_leak',
    name: 'Plumbing Leak',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 5,
    cashImpactMin: -250,
    cashImpactMax: -800,
    description: 'Small leak under kitchen sink needs repair.',
    emoji: '🚰',
    color: 'yellow',
    tenantMessages: {
      corporate_brain: ["Wanted to loop you in - I've discovered a leak under the kitchen sink. I've placed a bucket as a temporary containment measure. Let me know when you have bandwidth to address."],
      retired_micromanager: ["Found a leak under the sink at 3:22 PM. It's dripping about once every 4 seconds. I've measured - approximately 2 cups of water per hour. Photos attached if needed."],
      anxious_professional: ["There's water under the kitchen sink! Is this mold-level serious or just annoying-level serious? I put a towel down but I'm worried about the cabinets."],
      chaos_magnet: ["There's a mysterious puddle under the sink. Tracked it down - something's leaking. It's not dramatic yet but knowing my luck it will be soon."],
      passive_aggressive: ["No worries about the leak under the sink - I've been emptying a bucket every few hours. It's kind of meditative actually! Whenever you get a chance."],
      generic: ["Hey, I noticed there's a leak under the kitchen sink. It's not major but there's water pooling. Can you send a plumber?"],
    },
  },
  {
    id: 'electrical_issue',
    name: 'Electrical Problem',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -200,
    cashImpactMax: -600,
    description: 'Outlet stopped working - electrician needed.',
    emoji: '⚡',
    color: 'yellow',
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["Just flagging: the outlet in the bedroom is offline. My laptop charger works in other outlets so it's definitely this one. Can we get an electrician aligned?"],
      anxious_professional: ["Hi! Sorry to bother you - is the outlet in the bedroom supposed to make a tiny buzzing noise? It's probably nothing but I can't stop thinking about it. Also it stopped working."],
      chaos_magnet: ["So I plugged in my phone and there was a spark. Like a VISIBLE spark. The outlet doesn't work now. I didn't do anything weird I swear."],
      retired_micromanager: ["The outlet in the guest room stopped working at approximately 10:15 AM. I've tested it with three different devices. Breaker looks fine. Documenting for your records."],
      generic: ["Hey, one of the outlets stopped working. I checked the breaker and it looks fine. Can you send an electrician?"],
    },
  },
  {
    id: 'early_lease_break',
    name: 'Tenant Breaking Lease',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: -1000,
    cashImpactMax: -2500,
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
    probability: 4,
    cashImpactMin: -500,
    cashImpactMax: -2000,
    scaleWithPrice: true,
    description: 'Storm revealed a roof leak - patching needed.',
    emoji: '🏠',
    color: 'red',
    propertyTypes: ['house', 'townhouse'],
    conditionTags: ['fixer-upper', 'needs-work', 'dated'],
    tenantMessages: {
      corporate_brain: ["High-priority issue: the ceiling in the bedroom is leaking after last night's storm. I've placed a bucket as containment but we need a roof assessment ASAP."],
      anxious_professional: ["Quick question, no rush, but there's a water stain on the ceiling. Should I be worried? It's getting bigger. Oh no it's dripping now. Please help."],
      chaos_magnet: ["So... funny story. The ceiling is dripping. Not from my apartment - I checked. The water is coming from ABOVE the ceiling. How??"],
      law_curious: ["Documenting that there's a roof leak in the bedroom. Water is actively coming through the ceiling. I believe this affects habitability. What's the timeline?"],
      generic: ["There's water coming through the ceiling after the storm. Looks like a roof leak. Can you send someone out?"],
    },
  },
  {
    id: 'foundation_crack',
    name: 'Foundation Concern',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: -800,
    cashImpactMax: -3000,
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
    probability: 6,
    cashImpactMin: -200,
    cashImpactMax: -600,
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
    probability: 5,
    cashImpactMin: -150,
    cashImpactMax: -400,
    tenantIssue: true,
    description: 'Tenant spotted mice - exterminator visit needed.',
    emoji: '🐭',
    color: 'yellow',
    propertyTypes: ['house'],
    locationTypes: ['suburban'],
    tenantMessages: {
      anxious_professional: ["This is embarrassing but I think I heard scratching in the wall last night. It was probably just the building settling, right? RIGHT? Actually I saw a mouse. Please help."],
      chaos_magnet: ["Something is living in my walls. I don't know what. But I heard it sneeze. SNEEZE. Do mice sneeze?? Saw one run across the kitchen at 2 AM."],
      retired_micromanager: ["I've spotted a mouse 3 times now: once in the kitchen, twice near the pantry. I've set 4 traps myself but they're avoiding them. Exterminator needed."],
      passive_aggressive: ["I've noticed some new roommates! They're small and have tails. Been leaving little presents in the pantry. I'm sure they'll move out on their own eventually!"],
      generic: ["Hey, I saw a mouse in the kitchen. Actually a few times now. Can we get an exterminator out?"],
    },
  },
  {
    id: 'pest_termites',
    name: 'Termite Inspection',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 2,
    cashImpactMin: -400,
    cashImpactMax: -1200,
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
    cashImpactMin: -500,
    cashImpactMax: -1500,
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
    cashImpactMin: -200,
    cashImpactMax: -500,
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
    probability: 4,
    cashImpactMin: -1500,
    cashImpactMax: -4000,
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
    cashImpactMin: -200,
    cashImpactMax: -500,
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
    probability: 2,
    cashImpactMin: -1000,
    cashImpactMax: -3000,
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
    probability: 3,
    cashImpactMin: -100,
    cashImpactMax: -300,
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
    probability: 4,
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
    probability: 4,
    cashImpactMin: -150,
    cashImpactMax: -400,
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
    probability: 12,
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
    probability: 10,
    cashImpactMin: -1500,
    cashImpactMax: -4500,
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
    probability: 12,
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
    probability: 8,
    cashImpactMin: -2000,
    cashImpactMax: -6000,
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
    probability: 6,
    timeImpact: 1,
    cashImpactMin: -500,
    cashImpactMax: -1500,
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
    probability: 8,
    timeImpact: 2,
    cashImpactMin: -1000,
    cashImpactMax: -3000,
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
    cashImpactMin: -90,
    cashImpactMax: -220,
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
    cashImpactMin: -140,
    cashImpactMax: -360,
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
    cashImpactMin: -75,
    cashImpactMax: -200,
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
  context?: PropertyContext
): Curveball | null {
  const possibleEvents = getCurveballsForTrigger(trigger, context);

  // Each event rolls independently
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
