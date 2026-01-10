/**
 * Curveball Events System
 *
 * Random events that can occur during property ownership to add realism and excitement.
 * Events are categorized by type and have varying probabilities and impacts.
 */

export type CurveballType = 'positive' | 'negative' | 'neutral';
export type CurveballTrigger =
  | 'rental_monthly'      // Can happen during any month of rental
  | 'flip_during_rehab'   // Happens during flip renovation
  | 'flip_at_sale'        // Happens when listing flip property
  | 'purchase'            // Happens right after purchase
  | 'lease_up';           // Happens when finding first tenant

export interface Curveball {
  id: string;
  name: string;
  type: CurveballType;
  trigger: CurveballTrigger;
  probability: number;        // 0-100 (percentage chance per check)

  // Financial impact
  cashImpact?: number;        // Positive = gain, Negative = cost
  cashImpactMin?: number;     // For variable amounts
  cashImpactMax?: number;

  // Time impact (in weeks)
  timeImpact?: number;        // Can delay flips or affect rental timeline

  // Income impact (for rentals)
  rentMultiplier?: number;    // 1.0 = normal, 0 = no rent this period, 2.0 = double rent

  // Description shown to player
  description: string;

  // Animation/visual cues
  emoji?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue';
}

/**
 * POSITIVE CURVEBALLS - Dopamine Hits! 🎉
 */
export const POSITIVE_CURVEBALLS: Curveball[] = [
  {
    id: 'tenant_prepay_6mo',
    name: 'Tenant Prepaid 6 Months!',
    type: 'positive',
    trigger: 'lease_up',
    probability: 5,
    rentMultiplier: 6,
    description: 'Your new tenant needed housing ASAP and paid 6 months rent upfront! 💰',
    emoji: '💰',
    color: 'green',
  },
  {
    id: 'neighborhood_boom',
    name: 'Neighborhood Development Announced',
    type: 'positive',
    trigger: 'flip_at_sale',
    probability: 8,
    cashImpactMin: 15000,
    cashImpactMax: 35000,
    description: 'A major retail development was announced nearby! Buyers are offering over asking price. 🏗️',
    emoji: '🏗️',
    color: 'green',
  },
  {
    id: 'contractor_under_budget',
    name: 'Contractor Beat Estimate',
    type: 'positive',
    trigger: 'flip_during_rehab',
    probability: 12,
    cashImpactMin: 2000,
    cashImpactMax: 8000,
    description: 'Your contractor found creative solutions and came in under budget! 🔨',
    emoji: '🔨',
    color: 'green',
  },
  {
    id: 'material_discount',
    name: 'Material Sale Score',
    type: 'positive',
    trigger: 'flip_during_rehab',
    probability: 10,
    cashImpactMin: 1500,
    cashImpactMax: 5000,
    description: 'Your contractor snagged premium materials at a liquidation sale! 🎯',
    emoji: '🎯',
    color: 'green',
  },
  {
    id: 'tax_appeal_win',
    name: 'Tax Assessment Reduced',
    type: 'positive',
    trigger: 'purchase',
    probability: 7,
    cashImpactMin: 800,
    cashImpactMax: 2400,
    description: 'Your property tax appeal was successful! Annual taxes reduced by 15%. 📉',
    emoji: '📉',
    color: 'green',
  },
  {
    id: 'perfect_tenant',
    name: 'Dream Tenant',
    type: 'positive',
    trigger: 'lease_up',
    probability: 15,
    cashImpactMin: 500,
    cashImpactMax: 1500,
    description: 'Tenant is so excited they paid for minor upgrades themselves (new fixtures, paint). 🌟',
    emoji: '🌟',
    color: 'green',
  },
  {
    id: 'insurance_refund',
    name: 'Insurance Credit',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 3,
    cashImpactMin: 400,
    cashImpactMax: 1200,
    description: 'Insurance company issued a credit due to favorable claims history! 🛡️',
    emoji: '🛡️',
    color: 'green',
  },
  {
    id: 'quick_flip_sale',
    name: 'Instant Buyer',
    type: 'positive',
    trigger: 'flip_at_sale',
    probability: 10,
    timeImpact: -3,  // Saves 3 weeks
    description: 'A buyer toured and made a full-price offer the same day! Saved weeks of carrying costs. ⚡',
    emoji: '⚡',
    color: 'green',
  },
  {
    id: 'rent_increase_accepted',
    name: 'Rent Increase Accepted',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 8,
    cashImpactMin: 100,
    cashImpactMax: 300,
    description: 'Tenant agreed to a rent increase due to market conditions! 📈',
    emoji: '📈',
    color: 'green',
  },
  {
    id: 'early_lease_renewal',
    name: 'Early Renewal',
    type: 'positive',
    trigger: 'rental_monthly',
    probability: 6,
    cashImpact: 1000,
    description: 'Tenant loves the place and signed a 2-year lease renewal early! Bonus for stability. 🤝',
    emoji: '🤝',
    color: 'green',
  },
];

/**
 * NEGATIVE CURVEBALLS - Realistic Challenges
 */
export const NEGATIVE_CURVEBALLS: Curveball[] = [
  {
    id: 'late_rent',
    name: 'Rent Payment Delayed',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 15,
    timeImpact: 1,  // Delayed by 1 week
    description: 'Tenant had a payroll issue - rent will be 1 week late. 😬',
    emoji: '😬',
    color: 'yellow',
  },
  {
    id: 'appliance_breakdown',
    name: 'Appliance Failure',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 12,
    cashImpactMin: -400,
    cashImpactMax: -1200,
    description: 'The dishwasher died and needs replacement. 🔧',
    emoji: '🔧',
    color: 'red',
  },
  {
    id: 'hvac_repair',
    name: 'HVAC Needs Service',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 10,
    cashImpactMin: -300,
    cashImpactMax: -900,
    description: 'AC unit needs freon recharge and minor repairs. 🌡️',
    emoji: '🌡️',
    color: 'red',
  },
  {
    id: 'water_heater',
    name: 'Water Heater Replacement',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 8,
    cashImpactMin: -800,
    cashImpactMax: -1800,
    description: 'Water heater gave out and needs emergency replacement. 💧',
    emoji: '💧',
    color: 'red',
  },
  {
    id: 'hoa_special_assessment',
    name: 'HOA Special Assessment',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 5,
    cashImpactMin: -1000,
    cashImpactMax: -3000,
    description: 'HOA passed a special assessment for roof repairs. 🏘️',
    emoji: '🏘️',
    color: 'red',
  },
  {
    id: 'permit_delay',
    name: 'Permit Delays',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 18,
    timeImpact: 2,
    description: 'City permitting is backed up - 2 week delay on inspections. 📋',
    emoji: '📋',
    color: 'yellow',
  },
  {
    id: 'material_price_spike',
    name: 'Material Cost Increase',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 14,
    cashImpactMin: -1500,
    cashImpactMax: -4500,
    description: 'Lumber prices spiked. Budget needs adjustment. 📊',
    emoji: '📊',
    color: 'red',
  },
  {
    id: 'contractor_scheduling',
    name: 'Contractor Scheduling Conflict',
    type: 'negative',
    trigger: 'flip_during_rehab',
    probability: 16,
    timeImpact: 1,
    description: 'Your contractor had another job run long - 1 week delay. ⏰',
    emoji: '⏰',
    color: 'yellow',
  },
  {
    id: 'early_lease_break',
    name: 'Tenant Breaking Lease',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 6,
    cashImpactMin: -1000,
    cashImpactMax: -2500,
    description: 'Tenant got transferred for work - breaking lease early. Costs to find new tenant. 😔',
    emoji: '😔',
    color: 'red',
  },
  {
    id: 'small_plumbing_leak',
    name: 'Plumbing Leak',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 11,
    cashImpactMin: -250,
    cashImpactMax: -800,
    description: 'Small leak under kitchen sink needs repair. 🚰',
    emoji: '🚰',
    color: 'yellow',
  },
  {
    id: 'property_damage',
    name: 'Minor Property Damage',
    type: 'negative',
    trigger: 'rental_monthly',
    probability: 9,
    cashImpactMin: -500,
    cashImpactMax: -1500,
    description: 'Storm damage to fence/landscaping needs repair. 🌪️',
    emoji: '🌪️',
    color: 'red',
  },
  {
    id: 'failed_showing',
    name: 'Buyer Inspection Issues',
    type: 'negative',
    trigger: 'flip_at_sale',
    probability: 12,
    timeImpact: 2,
    cashImpactMin: -1000,
    cashImpactMax: -3000,
    description: 'Buyer\'s inspector found minor issues - needs fixes and re-listing time. 🔍',
    emoji: '🔍',
    color: 'red',
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
    probability: 10,
    description: 'Local real estate report: Your neighborhood rental rates are trending up 3% YoY. 📰',
    emoji: '📰',
    color: 'blue',
  },
  {
    id: 'tenant_maintenance_request',
    name: 'Routine Maintenance',
    type: 'neutral',
    trigger: 'rental_monthly',
    probability: 20,
    cashImpactMin: -100,
    cashImpactMax: -300,
    description: 'Tenant requested routine maintenance - filter changes, caulking, minor touch-ups. ✅',
    emoji: '✅',
    color: 'blue',
  },
];

/**
 * Get all curveballs for a specific trigger type
 */
export function getCurveballsForTrigger(trigger: CurveballTrigger): Curveball[] {
  const all = [...POSITIVE_CURVEBALLS, ...NEGATIVE_CURVEBALLS, ...NEUTRAL_CURVEBALLS];
  return all.filter(cb => cb.trigger === trigger);
}

/**
 * Roll for a random curveball event
 * Returns null if no event occurs
 */
export function rollForCurveball(trigger: CurveballTrigger): Curveball | null {
  const possibleEvents = getCurveballsForTrigger(trigger);

  // Each event rolls independently
  for (const event of possibleEvents) {
    const roll = Math.random() * 100;
    if (roll < event.probability) {
      // Event triggered! Calculate variable amounts if needed
      const resolvedEvent = { ...event };

      if (event.cashImpactMin !== undefined && event.cashImpactMax !== undefined) {
        const range = event.cashImpactMax - event.cashImpactMin;
        resolvedEvent.cashImpact = Math.floor(event.cashImpactMin + Math.random() * range);
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
export function rollForCurveballs(trigger: CurveballTrigger, numRolls: number = 1): Curveball | null {
  for (let i = 0; i < numRolls; i++) {
    const result = rollForCurveball(trigger);
    if (result) {
      return result; // Return first event that triggers
    }
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
