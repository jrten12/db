/**
 * Enhanced Maintenance Mechanics System (Server-Side)
 *
 * Determines realistic maintenance issue frequency based on:
 * - Property quality (purchase price tier)
 * - Property type (HOA, condo, house, etc.)
 * - Unfixed rehab issues that resurface
 * - Location type
 */

import type { Property, Deal } from '@shared/schema';

export type PropertyQualityTier = 'budget' | 'mid-range' | 'high-end' | 'luxury';
export type MaintenanceCategory =
  | 'appliance' | 'hvac' | 'plumbing' | 'electrical' | 'structural'
  | 'hoa' | 'landscaping' | 'septic' | 'well' | 'pest';

/**
 * Determine property quality tier based on purchase price
 */
export function getPropertyQualityTier(purchasePrice: number): PropertyQualityTier {
  if (purchasePrice < 150000) return 'budget';
  if (purchasePrice < 300000) return 'mid-range';
  if (purchasePrice < 500000) return 'high-end';
  return 'luxury';
}

/**
 * Base probability multipliers by quality tier
 * Budget properties have 2.5x higher maintenance frequency than luxury
 */
const QUALITY_TIER_MULTIPLIERS: Record<PropertyQualityTier, number> = {
  'budget': 2.5,      // $100k-$150k: Higher risk, older systems
  'mid-range': 1.5,   // $150k-$300k: Moderate maintenance
  'high-end': 0.8,    // $300k-$500k: Newer systems, better condition
  'luxury': 0.5,      // $500k+: Premium construction, less frequent issues
};

/**
 * Get unfixed issues that should resurface as maintenance problems
 */
export function getUnfixedIssues(deal: Deal): string[] {
  const proFormaInputs = deal.proFormaInputs as any;
  const discovered = proFormaInputs?.discoveredIssueIds || [];
  const fixed = proFormaInputs?.fixedIssueIds || [];
  return discovered.filter((id: string) => !fixed.includes(id));
}

/**
 * Enhanced maintenance event with dynamic probability
 */
export interface EnhancedMaintenanceEvent {
  id: string;
  name: string;
  category: MaintenanceCategory;
  baseProbability: number;  // Base weekly probability (percentage)
  costMin: number;
  costMax: number;
  tenantIssue: boolean;
  description: string;
  emoji: string;

  // Property type restrictions
  requiresHOA?: boolean;
  excludesHOA?: boolean;
  requiresSeptic?: boolean;
  requiresWell?: boolean;

  // Related rehab issues that increase probability
  relatedIssueIds?: string[];
}

/**
 * Enhanced maintenance events with realistic frequencies
 * Base probabilities are WEEKLY, much lower than current system
 */
export const ENHANCED_MAINTENANCE_EVENTS: EnhancedMaintenanceEvent[] = [
  // APPLIANCE ISSUES
  {
    id: 'appliance_breakdown',
    name: 'Appliance Failure',
    category: 'appliance',
    baseProbability: 1.5,
    costMin: 400,
    costMax: 1200,
    tenantIssue: true,
    description: 'The dishwasher stopped working and needs replacement.',
    emoji: '🔧',
  },

  // HVAC ISSUES
  {
    id: 'hvac_repair',
    name: 'HVAC Needs Service',
    category: 'hvac',
    baseProbability: 1.2,
    costMin: 300,
    costMax: 900,
    tenantIssue: true,
    description: 'The AC unit needs freon recharge and minor repairs.',
    emoji: '🌡️',
    relatedIssueIds: ['outdated_hvac', 'hvac_commercial', 'hvac_high_rise', 'hvac_replacement', 'dual_hvac'],
  },
  {
    id: 'hvac_major_repair',
    name: 'HVAC System Failure',
    category: 'hvac',
    baseProbability: 0.4,
    costMin: 1500,
    costMax: 4000,
    tenantIssue: true,
    description: 'The HVAC system has a major component failure requiring significant repair.',
    emoji: '❄️',
    relatedIssueIds: ['outdated_hvac', 'hvac_commercial', 'hvac_high_rise', 'hvac_replacement'],
  },

  // PLUMBING ISSUES
  {
    id: 'plumbing_leak_minor',
    name: 'Minor Plumbing Leak',
    category: 'plumbing',
    baseProbability: 1.5,
    costMin: 250,
    costMax: 800,
    tenantIssue: true,
    description: 'There\'s a small leak under the kitchen sink that needs repair.',
    emoji: '🚰',
    relatedIssueIds: ['plumbing_galvanized', 'plumbing_stack', 'plumbing_replacement'],
  },
  {
    id: 'drain_clog',
    name: 'Drain Clog',
    category: 'plumbing',
    baseProbability: 0.8,
    costMin: 140,
    costMax: 360,
    tenantIssue: true,
    description: 'The bathroom drain is running really slow and needs attention.',
    emoji: '🧰',
  },
  {
    id: 'water_heater_failure',
    name: 'Water Heater Replacement',
    category: 'plumbing',
    baseProbability: 0.6,
    costMin: 800,
    costMax: 1800,
    tenantIssue: true,
    description: 'The water heater gave out and needs emergency replacement.',
    emoji: '💧',
  },
  {
    id: 'plumbing_major',
    name: 'Major Plumbing Issue',
    category: 'plumbing',
    baseProbability: 0.3,
    costMin: 2000,
    costMax: 5000,
    tenantIssue: true,
    description: 'Significant plumbing issue requiring extensive repair work.',
    emoji: '🚿',
    relatedIssueIds: ['plumbing_galvanized', 'plumbing_stack', 'plumbing_replacement'],
  },

  // ELECTRICAL ISSUES
  {
    id: 'electrical_minor',
    name: 'Electrical Issue',
    category: 'electrical',
    baseProbability: 0.5,
    costMin: 200,
    costMax: 600,
    tenantIssue: true,
    description: 'An electrical outlet or circuit issue needs repair.',
    emoji: '⚡',
    relatedIssueIds: ['electrical_outdated', 'electrical_upgrade', 'knob_tube'],
  },
  {
    id: 'electrical_panel',
    name: 'Electrical Panel Issue',
    category: 'electrical',
    baseProbability: 0.2,
    costMin: 1000,
    costMax: 3000,
    tenantIssue: false,
    description: 'The electrical panel is showing problems and needs professional service.',
    emoji: '🔌',
    relatedIssueIds: ['electrical_outdated', 'electrical_upgrade'],
  },

  // STRUCTURAL ISSUES
  {
    id: 'roof_leak',
    name: 'Roof Leak',
    category: 'structural',
    baseProbability: 0.5,
    costMin: 500,
    costMax: 2000,
    tenantIssue: true,
    description: 'There\'s a roof leak after the heavy rain that needs immediate repair.',
    emoji: '☔',
    relatedIssueIds: ['roof_wear', 'roof_replacement', 'roof_shared', 'roof_historic'],
  },
  {
    id: 'foundation_concern',
    name: 'Foundation Issue',
    category: 'structural',
    baseProbability: 0.1,
    costMin: 1500,
    costMax: 5000,
    tenantIssue: false,
    description: 'Signs of foundation movement requiring inspection and potential repair.',
    emoji: '🏚️',
    relatedIssueIds: ['foundation_settling', 'foundation_major', 'structural_settling'],
  },

  // HOA-SPECIFIC ISSUES
  {
    id: 'hoa_special_assessment',
    name: 'HOA Special Assessment',
    category: 'hoa',
    baseProbability: 0.4,
    costMin: 1000,
    costMax: 3000,
    tenantIssue: false,
    description: 'The HOA passed a special assessment for building improvements.',
    emoji: '🏘️',
    requiresHOA: true,
    relatedIssueIds: ['hoa_assessment', 'hoa_reserve_low', 'hoa_assessment_pending', 'high_hoa_fees', 'elevator_issues'],
  },
  {
    id: 'hoa_fee_increase',
    name: 'HOA Fee Increase',
    category: 'hoa',
    baseProbability: 0.3,
    costMin: 500,
    costMax: 1500,
    tenantIssue: false,
    description: 'HOA monthly fees increased due to rising maintenance costs.',
    emoji: '📈',
    requiresHOA: true,
    relatedIssueIds: ['hoa_reserve_low', 'high_hoa_fees'],
  },

  // SEPTIC SYSTEM
  {
    id: 'septic_pumping',
    name: 'Septic Tank Pumping',
    category: 'septic',
    baseProbability: 0.8,
    costMin: 300,
    costMax: 600,
    tenantIssue: false,
    description: 'The septic tank needs routine pumping and inspection.',
    emoji: '🚽',
    requiresSeptic: true,
    relatedIssueIds: ['septic_issues'],
  },
  {
    id: 'septic_major',
    name: 'Septic System Repair',
    category: 'septic',
    baseProbability: 0.3,
    costMin: 2000,
    costMax: 6000,
    tenantIssue: true,
    description: 'The septic system is experiencing issues requiring significant repairs.',
    emoji: '⚠️',
    requiresSeptic: true,
    relatedIssueIds: ['septic_issues'],
  },

  // WELL WATER
  {
    id: 'well_pump_issue',
    name: 'Well Pump Repair',
    category: 'well',
    baseProbability: 0.5,
    costMin: 500,
    costMax: 1500,
    tenantIssue: true,
    description: 'The well pump is showing signs of wear and needs repair or adjustment.',
    emoji: '💦',
    requiresWell: true,
    relatedIssueIds: ['well_water', 'well_pump'],
  },

  // LANDSCAPING/EXTERIOR
  {
    id: 'landscaping_damage',
    name: 'Storm Damage Repair',
    category: 'landscaping',
    baseProbability: 0.7,
    costMin: 500,
    costMax: 1500,
    tenantIssue: false,
    description: 'Storm damage to the fence/landscaping needs repair.',
    emoji: '🌪️',
    excludesHOA: true,
  },
  {
    id: 'tree_maintenance',
    name: 'Tree/Yard Maintenance',
    category: 'landscaping',
    baseProbability: 0.5,
    costMin: 300,
    costMax: 900,
    tenantIssue: false,
    description: 'Tree trimming or removal needed for safety.',
    emoji: '🌳',
    excludesHOA: true,
  },

  // PEST ISSUES
  {
    id: 'pest_treatment',
    name: 'Pest Control',
    category: 'pest',
    baseProbability: 0.6,
    costMin: 150,
    costMax: 400,
    tenantIssue: true,
    description: 'There\'s a pest issue that needs professional treatment.',
    emoji: '🐜',
    relatedIssueIds: ['termite_damage'],
  },
  {
    id: 'termite_activity',
    name: 'Termite Activity',
    category: 'pest',
    baseProbability: 0.2,
    costMin: 1000,
    costMax: 3000,
    tenantIssue: false,
    description: 'Signs of termite activity requiring treatment and inspection.',
    emoji: '🪲',
    relatedIssueIds: ['termite_damage'],
  },

  // MISCELLANEOUS
  {
    id: 'key_replacement',
    name: 'Key Replacement',
    category: 'appliance',
    baseProbability: 0.3,
    costMin: 90,
    costMax: 220,
    tenantIssue: true,
    description: 'The tenant misplaced their keys and needs a lock rekey for safety.',
    emoji: '🗝️',
  },
  {
    id: 'routine_maintenance',
    name: 'Routine Maintenance',
    category: 'appliance',
    baseProbability: 2.0,
    costMin: 100,
    costMax: 300,
    tenantIssue: true,
    description: 'Routine maintenance needed - filter changes, caulking, minor touch-ups.',
    emoji: '✅',
  },
];

/**
 * Calculate adjusted probability for a maintenance event
 */
export function getAdjustedProbability(
  event: EnhancedMaintenanceEvent,
  property: Property,
  deal: Deal
): number {
  let probability = event.baseProbability;

  // 1. Apply quality tier multiplier
  const qualityTier = getPropertyQualityTier(property.price);
  probability *= QUALITY_TIER_MULTIPLIERS[qualityTier];

  // 2. Check property type restrictions
  const isHOA = property.propertyType === 'condo' || property.propertyType === 'apartment';

  if (event.requiresHOA && !isHOA) return 0;
  if (event.excludesHOA && isHOA) return 0;

  // Check for septic/well (suburban lower-priced properties)
  const hasSeptic = property.locationType === 'suburban' && property.price < 250000;
  const hasWell = property.locationType === 'suburban' && property.price < 200000;

  if (event.requiresSeptic && !hasSeptic) return 0;
  if (event.requiresWell && !hasWell) return 0;

  // 3. Check for unfixed rehab issues
  const unfixedIssues = getUnfixedIssues(deal);

  if (event.relatedIssueIds && event.relatedIssueIds.length > 0) {
    const hasRelatedUnfixedIssue = unfixedIssues.some(issueId =>
      event.relatedIssueIds!.includes(issueId)
    );

    if (hasRelatedUnfixedIssue) {
      // Significantly increase probability (3x-5x) if related issue was ignored
      probability *= (3 + Math.random() * 2);
    }
  }

  return probability;
}

/**
 * Roll for a maintenance event using enhanced mechanics
 */
export function rollForEnhancedMaintenance(
  property: Property,
  deal: Deal
): any | null {
  const applicableEvents = ENHANCED_MAINTENANCE_EVENTS
    .map(event => ({
      ...event,
      adjustedProbability: getAdjustedProbability(event, property, deal),
    }))
    .filter(event => event.adjustedProbability > 0);

  // Roll for each event independently
  for (const event of applicableEvents) {
    const roll = Math.random() * 100;
    if (roll < event.adjustedProbability) {
      // Event triggered!
      const range = event.costMax - event.costMin;
      const cashImpact = -Math.floor(event.costMin + Math.random() * range);

      return {
        id: event.id,
        name: event.name,
        type: 'negative',
        trigger: 'rental_monthly',
        probability: event.adjustedProbability,
        tenantIssue: event.tenantIssue,
        cashImpact,
        description: event.description,
        emoji: event.emoji,
        color: 'red',
      };
    }
  }

  return null;
}
