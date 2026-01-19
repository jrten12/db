/**
 * Enhanced Maintenance Mechanics System
 *
 * Determines realistic maintenance issue frequency based on:
 * - Property quality (purchase price tier)
 * - Property type (HOA, condo, house, etc.)
 * - Unfixed rehab issues that resurface
 * - Location type
 */

import type { Property } from '@shared/schema';
import type { ProFormaInputs } from './gameData';
import type { Curveball } from './curveballs';

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
export function getUnfixedIssues(proFormaInputs: ProFormaInputs): string[] {
  const discovered = proFormaInputs.discoveredIssueIds || [];
  const fixed = proFormaInputs.fixedIssueIds || [];
  return discovered.filter(id => !fixed.includes(id));
}

/**
 * Map rehab issue IDs to maintenance categories
 */
export function mapIssueToMaintenanceCategory(issueId: string): MaintenanceCategory | null {
  // HVAC-related issues
  if (issueId.includes('hvac') || issueId.includes('heating') || issueId.includes('cooling')) {
    return 'hvac';
  }

  // Plumbing issues
  if (issueId.includes('plumbing') || issueId.includes('leak') || issueId.includes('drain') ||
      issueId.includes('water') || issueId.includes('septic')) {
    return issueId.includes('septic') ? 'septic' : 'plumbing';
  }

  // Electrical issues
  if (issueId.includes('electrical') || issueId.includes('wiring') || issueId.includes('panel')) {
    return 'electrical';
  }

  // Structural issues
  if (issueId.includes('foundation') || issueId.includes('structural') || issueId.includes('roof') ||
      issueId.includes('settling') || issueId.includes('chimney')) {
    return 'structural';
  }

  // HOA-related
  if (issueId.includes('hoa')) {
    return 'hoa';
  }

  // Pest issues
  if (issueId.includes('termite') || issueId.includes('pest') || issueId.includes('mold')) {
    return 'pest';
  }

  // Well issues
  if (issueId.includes('well')) {
    return 'well';
  }

  // Appliances
  if (issueId.includes('appliance')) {
    return 'appliance';
  }

  return null;
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
  requiresHOA?: boolean;      // Only for HOA properties
  excludesHOA?: boolean;      // Never for HOA properties
  requiresSeptic?: boolean;   // Only for septic systems
  requiresWell?: boolean;     // Only for well water
  propertyTypes?: string[];   // Specific property types only

  // Related rehab issues that increase probability
  relatedIssueIds?: string[];
}

/**
 * Enhanced maintenance events with realistic frequencies
 * Base probabilities are WEEKLY, much lower than current system
 */
export const ENHANCED_MAINTENANCE_EVENTS: EnhancedMaintenanceEvent[] = [
  // APPLIANCE ISSUES (common to all properties)
  {
    id: 'appliance_breakdown',
    name: 'Appliance Failure',
    category: 'appliance',
    baseProbability: 1.5,  // ~1.5% per week = ~60% per year for budget properties
    costMin: 400,
    costMax: 1200,
    tenantIssue: true,
    description: 'Dishwasher stopped working and needs replacement.',
    emoji: '🔧',
  },

  // HVAC ISSUES
  {
    id: 'hvac_repair',
    name: 'HVAC Needs Service',
    category: 'hvac',
    baseProbability: 1.2,  // ~1.2% per week
    costMin: 300,
    costMax: 900,
    tenantIssue: true,
    description: 'AC unit needs freon recharge and minor repairs.',
    emoji: '🌡️',
    relatedIssueIds: ['outdated_hvac', 'hvac_commercial', 'hvac_high_rise', 'hvac_replacement', 'dual_hvac'],
  },
  {
    id: 'hvac_major_repair',
    name: 'HVAC System Failure',
    category: 'hvac',
    baseProbability: 0.4,  // Rare but expensive
    costMin: 1500,
    costMax: 4000,
    tenantIssue: true,
    description: 'HVAC system has major component failure requiring significant repair.',
    emoji: '❄️',
    relatedIssueIds: ['outdated_hvac', 'hvac_commercial', 'hvac_high_rise', 'hvac_replacement'],
  },

  // PLUMBING ISSUES
  {
    id: 'plumbing_leak_minor',
    name: 'Minor Plumbing Leak',
    category: 'plumbing',
    baseProbability: 1.5,  // ~1.5% per week
    costMin: 250,
    costMax: 800,
    tenantIssue: true,
    description: 'Small leak under kitchen sink needs repair.',
    emoji: '🚰',
    relatedIssueIds: ['plumbing_galvanized', 'plumbing_stack', 'plumbing_replacement'],
  },
  {
    id: 'drain_clog',
    name: 'Drain Clog',
    category: 'plumbing',
    baseProbability: 0.8,  // Less common
    costMin: 140,
    costMax: 360,
    tenantIssue: true,
    description: 'Tenant reported a slow drain that needs a plumber visit.',
    emoji: '🧰',
  },
  {
    id: 'water_heater_failure',
    name: 'Water Heater Replacement',
    category: 'plumbing',
    baseProbability: 0.6,  // ~0.6% per week
    costMin: 800,
    costMax: 1800,
    tenantIssue: true,
    description: 'Water heater gave out and needs emergency replacement.',
    emoji: '💧',
  },
  {
    id: 'plumbing_major',
    name: 'Major Plumbing Issue',
    category: 'plumbing',
    baseProbability: 0.3,  // Rare but shows up if issue unfixed
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
    description: 'Electrical outlet or circuit issue needs repair.',
    emoji: '⚡',
    relatedIssueIds: ['electrical_outdated', 'electrical_upgrade', 'knob_tube'],
  },
  {
    id: 'electrical_panel',
    name: 'Electrical Panel Issue',
    category: 'electrical',
    baseProbability: 0.2,  // Very rare unless unfixed issue
    costMin: 1000,
    costMax: 3000,
    tenantIssue: false,
    description: 'Electrical panel showing problems, needs professional service.',
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
    description: 'Roof leak after heavy rain needs immediate repair.',
    emoji: '☔',
    relatedIssueIds: ['roof_wear', 'roof_replacement', 'roof_shared', 'roof_historic'],
  },
  {
    id: 'foundation_concern',
    name: 'Foundation Issue',
    category: 'structural',
    baseProbability: 0.1,  // Very rare
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
    baseProbability: 0.4,  // ~0.4% per week for HOA properties
    costMin: 1000,
    costMax: 3000,
    tenantIssue: false,
    description: 'HOA passed a special assessment for building improvements.',
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

  // SEPTIC SYSTEM (only for properties with septic)
  {
    id: 'septic_pumping',
    name: 'Septic Tank Pumping',
    category: 'septic',
    baseProbability: 0.8,  // More common for septic systems
    costMin: 300,
    costMax: 600,
    tenantIssue: false,
    description: 'Septic tank needs routine pumping and inspection.',
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
    description: 'Septic system experiencing issues requiring significant repairs.',
    emoji: '⚠️',
    requiresSeptic: true,
    relatedIssueIds: ['septic_issues'],
  },

  // WELL WATER (only for properties with well)
  {
    id: 'well_pump_issue',
    name: 'Well Pump Repair',
    category: 'well',
    baseProbability: 0.5,
    costMin: 500,
    costMax: 1500,
    tenantIssue: true,
    description: 'Well pump showing signs of wear, needs repair or adjustment.',
    emoji: '💦',
    requiresWell: true,
    relatedIssueIds: ['well_water', 'well_pump'],
  },

  // LANDSCAPING/EXTERIOR (excludes HOA properties usually)
  {
    id: 'landscaping_damage',
    name: 'Storm Damage Repair',
    category: 'landscaping',
    baseProbability: 0.7,
    costMin: 500,
    costMax: 1500,
    tenantIssue: false,
    description: 'Storm damage to fence/landscaping needs repair.',
    emoji: '🌪️',
    excludesHOA: true,  // HOA usually handles this
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
    description: 'Tenant reported pest issue requiring professional treatment.',
    emoji: '🐜',
    relatedIssueIds: ['termite_damage'],
  },
  {
    id: 'termite_activity',
    name: 'Termite Activity',
    category: 'pest',
    baseProbability: 0.2,  // Rare but serious if unfixed
    costMin: 1000,
    costMax: 3000,
    tenantIssue: false,
    description: 'Signs of termite activity requiring treatment and inspection.',
    emoji: '🪲',
    relatedIssueIds: ['termite_damage'],
  },

  // MISCELLANEOUS TENANT ISSUES
  {
    id: 'key_replacement',
    name: 'Key Replacement',
    category: 'appliance',  // Using appliance as catch-all
    baseProbability: 0.3,
    costMin: 90,
    costMax: 220,
    tenantIssue: true,
    description: 'Tenant misplaced their keys and needs a lock rekey for safety.',
    emoji: '🗝️',
  },
  {
    id: 'routine_maintenance',
    name: 'Routine Maintenance',
    category: 'appliance',
    baseProbability: 2.0,  // Most common, minor cost
    costMin: 100,
    costMax: 300,
    tenantIssue: true,
    description: 'Tenant requested routine maintenance - filter changes, caulking, minor touch-ups.',
    emoji: '✅',
  },
];

/**
 * Calculate adjusted probability for a maintenance event based on property characteristics
 */
export function getAdjustedProbability(
  event: EnhancedMaintenanceEvent,
  property: Property,
  proFormaInputs: ProFormaInputs
): number {
  let probability = event.baseProbability;

  // 1. Apply quality tier multiplier
  const qualityTier = getPropertyQualityTier(property.price);
  probability *= QUALITY_TIER_MULTIPLIERS[qualityTier];

  // 2. Check property type restrictions
  const isHOA = property.propertyType === 'condo' || property.propertyType === 'apartment';

  // Skip if event requires HOA but property doesn't have it
  if (event.requiresHOA && !isHOA) {
    return 0;
  }

  // Skip if event excludes HOA and property has it
  if (event.excludesHOA && isHOA) {
    return 0;
  }

  // Check for septic/well requirements (would need additional property metadata)
  // For now, we'll assume certain property types or locations might have these
  const hasSeptic = property.locationType === 'suburban' && property.price < 250000;
  const hasWell = property.locationType === 'suburban' && property.price < 200000;

  if (event.requiresSeptic && !hasSeptic) {
    return 0;
  }

  if (event.requiresWell && !hasWell) {
    return 0;
  }

  // 3. Check for unfixed rehab issues that relate to this maintenance category
  const unfixedIssues = getUnfixedIssues(proFormaInputs);

  if (event.relatedIssueIds && event.relatedIssueIds.length > 0) {
    const hasRelatedUnfixedIssue = unfixedIssues.some(issueId =>
      event.relatedIssueIds!.includes(issueId)
    );

    if (hasRelatedUnfixedIssue) {
      // Significantly increase probability (3x-5x) if related issue was ignored
      probability *= (3 + Math.random() * 2);  // 3x to 5x multiplier
    }
  }

  return probability;
}

/**
 * Get all applicable maintenance events for a property with adjusted probabilities
 */
export function getApplicableMaintenanceEvents(
  property: Property,
  proFormaInputs: ProFormaInputs
): Array<EnhancedMaintenanceEvent & { adjustedProbability: number }> {
  return ENHANCED_MAINTENANCE_EVENTS
    .map(event => ({
      ...event,
      adjustedProbability: getAdjustedProbability(event, property, proFormaInputs),
    }))
    .filter(event => event.adjustedProbability > 0);
}

/**
 * Roll for a maintenance event using enhanced mechanics
 * Returns null if no event occurs
 */
export function rollForEnhancedMaintenance(
  property: Property,
  proFormaInputs: ProFormaInputs
): Curveball | null {
  const applicableEvents = getApplicableMaintenanceEvents(property, proFormaInputs);

  // Roll for each event independently
  for (const event of applicableEvents) {
    const roll = Math.random() * 100;
    if (roll < event.adjustedProbability) {
      // Event triggered! Calculate variable cost
      const range = event.costMax - event.costMin;
      const cashImpact = -Math.floor(event.costMin + Math.random() * range);

      // Convert to Curveball format
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

/**
 * Get unfixed issue description for player feedback
 */
export function getUnfixedIssueWarnings(
  property: Property,
  proFormaInputs: ProFormaInputs
): string[] {
  const unfixedIssues = getUnfixedIssues(proFormaInputs);

  if (unfixedIssues.length === 0) {
    return [];
  }

  const warnings: string[] = [];
  const categoryCounts: Partial<Record<MaintenanceCategory, number>> = {};

  unfixedIssues.forEach(issueId => {
    const category = mapIssueToMaintenanceCategory(issueId);
    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  Object.entries(categoryCounts).forEach(([category, count]) => {
    warnings.push(
      `⚠️ ${count} unfixed ${category} issue${count > 1 ? 's' : ''} - expect higher maintenance costs`
    );
  });

  return warnings;
}
