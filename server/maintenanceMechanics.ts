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
import { getRandomizedPropertyIssues } from '@shared/propertyIssues';

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
  'budget': 1.5,      // $100k-$150k: Higher risk, older systems (BAL-006: reduced from 1.8)
  'mid-range': 1.0,   // $150k-$300k: Moderate maintenance (BAL-006: reduced from 1.2)
  'high-end': 0.7,    // $300k-$500k: Newer systems, better condition (BAL-006: reduced from 0.8)
  'luxury': 0.4,      // $500k+: Premium construction, less frequent issues (BAL-006: reduced from 0.5)
};

/**
 * Get ALL unfixed issues that should resurface as maintenance problems
 * Includes both undiscovered issues AND discovered-but-not-fixed issues
 * This reflects reality: unfixed problems cause related maintenance regardless of whether the owner knows about them
 */
export function getUnfixedIssues(deal: Deal, property?: Property | null): string[] {
  const proFormaInputs = deal.proFormaInputs as any;
  const fixed = proFormaInputs?.fixedIssueIds || [];
  
  if (property) {
    const gameRunId = deal.gameRunId;
    const allIssues = getRandomizedPropertyIssues(
      gameRunId, deal.propertyId,
      property.propertyType || 'house',
      property.conditionTag || 'Fair',
      (property as any).waterSource || 'public'
    );
    return allIssues.map(i => i.id).filter((id: string) => !fixed.includes(id));
  }

  const discovered = proFormaInputs?.discoveredIssueIds || [];
  return discovered.filter((id: string) => !fixed.includes(id));
}

/**
 * Tenant message templates by personality type
 * Messages vary by personality and property class (budget=casual, luxury=refined)
 */
export interface TenantMessageTemplates {
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
  
  // Location type restrictions
  requiresUrban?: boolean;
  requiresSuburban?: boolean;

  // Related rehab issues that increase probability
  relatedIssueIds?: string[];
  
  // Tenant text message templates (for expense-linked messages)
  tenantMessages?: TenantMessageTemplates;
}

/**
 * Enhanced maintenance events with realistic frequencies
 * Base probabilities are WEEKLY, much lower than current system
 * Includes personality-appropriate tenant messages for each issue
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
    relatedIssueIds: ['cosmetic_updates'],
    tenantMessages: {
      corporate_brain: ["dishwasher is EOL. wont power on. can we expedite replacement"],
      retired_micromanager: ["Dishwasher stopped 2:47 PM. Made 3 clicking sounds then smoke smell. Video recorded."],
      anxious_professional: ["dishwasher died!! is this an emergency? should i be worried about water damage??"],
      new_money: ["dishwasher is done. any chance we can get a stainless upgrade that matches the fridge"],
      chaos_magnet: ["dishwasher EXPLODED. ok not exploded but died mid-cycle. theres water everywhere. classic"],
      passive_aggressive: ["dishwashers gone. been hand washing for 3 days now. its fine. builds character"],
      lonely_caller: ["hey! dishwasher stopped working. not urgent! just wanted to let u know. how r u doing?"],
      generic: ["hey dishwasher stopped working completely. wont turn on. need someone to look at it"],
    },
  },
  {
    id: 'refrigerator_issue',
    name: 'Refrigerator Problem',
    category: 'appliance',
    baseProbability: 0.8,
    costMin: 300,
    costMax: 900,
    tenantIssue: true,
    description: 'The refrigerator is making strange noises and not cooling properly.',
    emoji: '🧊',
    relatedIssueIds: ['cosmetic_updates'],
    tenantMessages: {
      corporate_brain: ["fridge temp unstable. reading 48 degrees when set to 37. food safety concern"],
      chaos_magnet: ["fridge is making a sound like a dying whale. also my milk is warm. great"],
      anxious_professional: ["is the fridge supposed to be this warm inside?? my yogurts feel weird"],
      new_money: ["fridge situation not ideal. had to throw out some expensive groceries"],
      passive_aggressive: ["fridge seems to be on vacation. eating out more. its fine. love takeout"],
      generic: ["hey fridge isnt cooling right. making weird noises. foods getting warm"],
    },
  },
  {
    id: 'stove_oven_repair',
    name: 'Stove/Oven Repair',
    category: 'appliance',
    baseProbability: 0.6,
    costMin: 200,
    costMax: 600,
    tenantIssue: true,
    description: 'One of the stove burners or the oven element stopped working.',
    emoji: '🍳',
    tenantMessages: {
      retired_micromanager: ["Back burner stopped at 5:32 PM. Front left still works. Others fine. Documenting."],
      chaos_magnet: ["stove burner just died. while i was cooking. of course. thankfully nothing caught fire"],
      lonely_caller: ["hey! back burner isnt working. no rush! just cooking more in the front now haha. hi!"],
      generic: ["hey one of the stove burners stopped working. can someone come look at it"],
    },
  },
  {
    id: 'washer_dryer_issue',
    name: 'Washer/Dryer Problem',
    category: 'appliance',
    baseProbability: 0.7,
    costMin: 250,
    costMax: 700,
    tenantIssue: true,
    description: 'The washer or dryer is malfunctioning.',
    emoji: '👕',
    tenantMessages: {
      corporate_brain: ["dryer taking 3 cycles to dry. inefficiency concern. also lint trap is clear"],
      chaos_magnet: ["washer is possessed. makes horrible banging noise. clothes came out MORE dirty??"],
      passive_aggressive: ["dryers been taking 2 hours per load. getting lots of reading done waiting. its fine"],
      new_money: ["washer situation untenable. been going to laundromat. not ideal for my schedule"],
      generic: ["hey washer is acting up. not spinning right and clothes still soaking wet"],
    },
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
    tenantMessages: {
      corporate_brain: ["ac outputting warm air. home office at 84 degrees. productivity significantly impacted"],
      retired_micromanager: ["AC cycling every 3 min instead of 12. Temp up 8 degrees since Tuesday. Hourly readings attached."],
      anxious_professional: ["ac isnt working and its getting really hot?? is this a freon leak? are those dangerous??"],
      new_money: ["ac situation is untenable. 82 degrees in here. can we fast track an hvac tech today"],
      chaos_magnet: ["ac blowing HOT AIR. in the SUMMER. im literally melting. this place hates me"],
      passive_aggressive: ["ac seems to be on vacation! been using a hand fan. very retro. no rush"],
      law_curious: ["documenting ac failure. affects habitability. whats the typical response timeline here"],
      generic: ["hey ac stopped cooling. running but blowing warm air. can someone come look at it"],
    },
  },
  {
    id: 'hvac_major_repair',
    name: 'HVAC System Failure',
    category: 'hvac',
    baseProbability: 0.2,
    costMin: 1500,
    costMax: 4000,
    tenantIssue: true,
    description: 'The HVAC system has a major component failure requiring significant repair.',
    emoji: '❄️',
    relatedIssueIds: ['outdated_hvac', 'hvac_commercial', 'hvac_high_rise', 'hvac_replacement'],
    tenantMessages: {
      corporate_brain: ["hvac completely down. major component failure. this is a p0 - habitability at stake"],
      new_money: ["hvac is dead. staying at a hotel tonight. need this resolved asap"],
      law_curious: ["documenting complete hvac failure. tenant rights re habitability are clear. timeline"],
      generic: ["hey hvac system completely dead. no heat/cooling at all. need emergency service"],
    },
  },
  {
    id: 'furnace_issue',
    name: 'Furnace Problem',
    category: 'hvac',
    baseProbability: 0.5,
    costMin: 400,
    costMax: 1200,
    tenantIssue: true,
    description: 'The furnace is not heating properly or making concerning noises.',
    emoji: '🔥',
    relatedIssueIds: ['outdated_hvac', 'hvac_replacement'],
    tenantMessages: {
      anxious_professional: ["furnace is making a weird clicking sound?? is that normal or should i be worried about like. explosions"],
      retired_micromanager: ["Furnace cycling on/off every 4 minutes. Recorded 23 cycles today. Filter changed 2 weeks ago."],
      chaos_magnet: ["furnace making scary sounds. like mechanical screaming. also its cold in here now"],
      generic: ["hey furnace isnt heating right. making weird noises. getting cold in here"],
    },
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
    tenantMessages: {
      corporate_brain: ["leak under kitchen sink. bucket deployed. lmk when u have bandwidth to address"],
      retired_micromanager: ["Leak under sink found 3:22 PM. Dripping every 4 sec. ~2 cups per hour. Photos ready."],
      anxious_professional: ["theres water under the kitchen sink!! is this mold level serious or just annoying level serious??"],
      chaos_magnet: ["mysterious puddle under the sink. somethings leaking. not dramatic YET but give it time"],
      passive_aggressive: ["been emptying a bucket every few hours for the leak. kinda meditative actually. whenever ur free"],
      lonely_caller: ["hey! found a small leak under the sink. not urgent! just wanted to check in. how r u?"],
      generic: ["hey theres a leak under the kitchen sink. not major but pooling. plumber needed?"],
    },
  },
  {
    id: 'drain_clog',
    name: 'Drain Clog',
    category: 'plumbing',
    baseProbability: 0.8,
    costMin: 140,
    costMax: 360,
    tenantIssue: true,
    relatedIssueIds: ['plumbing_galvanized', 'plumbing_stack', 'drainage_issues'],
    description: 'The bathroom drain is running really slow and needs attention.',
    emoji: '🧰',
    tenantMessages: {
      retired_micromanager: ["Bathroom drain timing: 4 min 23 sec to empty vs normal 45 sec. Tried plunger 6 times."],
      chaos_magnet: ["shower turned into a foot bath. drain so slow im standing in 4 inches of water by the end"],
      passive_aggressive: ["drains running slow. been taking faster showers. good for the environment i guess"],
      generic: ["hey bathroom drain is running really slow. tried plunger but no luck. plumber"],
    },
  },
  {
    id: 'toilet_issue',
    name: 'Toilet Problem',
    category: 'plumbing',
    baseProbability: 0.9,
    costMin: 150,
    costMax: 400,
    tenantIssue: true,
    description: 'The toilet is running constantly or having flushing issues.',
    emoji: '🚽',
    tenantMessages: {
      retired_micromanager: ["Toilet running continuously since 6:15 AM. Tried jiggling handle. Water bill concern."],
      anxious_professional: ["toilet wont stop running?? is this using a lot of water?? is my bill gonna be insane??"],
      chaos_magnet: ["toilet situation. its running. constantly. like its training for a marathon. help"],
      passive_aggressive: ["toilets been running for days. very relaxing white noise actually. whenever u have time"],
      generic: ["hey toilet keeps running after flushing. wasting water. can someone look at it"],
    },
  },
  {
    id: 'water_heater_failure',
    name: 'Water Heater Replacement',
    category: 'plumbing',
    baseProbability: 0.35,
    costMin: 800,
    costMax: 1800,
    tenantIssue: true,
    description: 'The water heater gave out and needs emergency replacement.',
    emoji: '💧',
    tenantMessages: {
      corporate_brain: ["no hot water. water heater failure. habitability blocker. eta on resolution"],
      retired_micromanager: ["No hot water. Waited 47 min. Pilot light out wont relight. Tank cold to touch."],
      anxious_professional: ["theres no hot water and im freaking out. is the water heater supposed to hiss?? explosion risk??"],
      new_money: ["no hot water is a nonstarter. need this fixed today. cold showers literally not happening"],
      chaos_magnet: ["water heater died. of course it did. was mid shower when it went ice cold. INSTANT"],
      law_curious: ["documenting we have no hot water. habitability standards apply. whats the timeline here"],
      generic: ["hey no hot water at all. think water heater broke. kinda urgent - can someone come today?"],
    },
  },
  {
    id: 'plumbing_major',
    name: 'Major Plumbing Issue',
    category: 'plumbing',
    baseProbability: 0.15,
    costMin: 2000,
    costMax: 5000,
    tenantIssue: true,
    description: 'Significant plumbing issue requiring extensive repair work.',
    emoji: '🚿',
    relatedIssueIds: ['plumbing_galvanized', 'plumbing_stack', 'plumbing_replacement'],
    tenantMessages: {
      corporate_brain: ["major plumbing situation. water pressure near zero, pipes groaning. need a licensed plumber asap"],
      retired_micromanager: ["Water shut off at 8:15 AM due to pipe failure. Damage spreading to subfloor. Photos and video documented."],
      anxious_professional: ["theres water EVERYWHERE. like actually flooding. is this going to damage the foundation?? should i leave??"],
      chaos_magnet: ["pipes decided today was the day to give up on life. kitchen looks like a swimming pool now"],
      passive_aggressive: ["so the pipes burst. been mopping for a while. getting really good at it actually. no worries"],
      law_curious: ["documenting extensive water damage from plumbing failure. will need to discuss remediation timeline and liability"],
      generic: ["hey major plumbing problem. water everywhere. had to shut off the main. need emergency plumber"],
    },
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
    tenantMessages: {
      corporate_brain: ["outlet in home office dead. tripping breaker when reset. need electrician before i lose a workday"],
      retired_micromanager: ["Outlet in bedroom sparked at 7:02 PM. Breaker tripped twice. Circuit 14 on panel. Fire risk concern."],
      anxious_professional: ["outlet sparked!! is that dangerous?? like fire dangerous?? should i turn off the breaker??"],
      chaos_magnet: ["half the outlets in the kitchen stopped working. microwave and fridge on the same one now. fun"],
      passive_aggressive: ["few outlets stopped working. been running extension cords everywhere. very cozy industrial look"],
      generic: ["hey couple outlets stopped working. tried resetting breaker but they keep tripping. need electrician"],
    },
  },
  {
    id: 'electrical_panel',
    name: 'Electrical Panel Issue',
    category: 'electrical',
    baseProbability: 0.1,
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
    baseProbability: 0.3,
    costMin: 500,
    costMax: 2000,
    tenantIssue: true,
    description: 'There\'s a roof leak after the heavy rain that needs immediate repair.',
    emoji: '☔',
    relatedIssueIds: ['roof_wear', 'roof_replacement', 'roof_shared', 'roof_historic'],
    tenantMessages: {
      corporate_brain: ["ceiling leak in bedroom. water stain expanding. placing bucket. need roofer scheduled urgently"],
      retired_micromanager: ["Leak started 11:30 PM during rain. Drip rate: every 2 seconds. Bucket filling every 6 hours. Ceiling paint bubbling."],
      anxious_professional: ["theres water dripping from the CEILING. is the roof going to collapse?? this feels really bad??"],
      chaos_magnet: ["woke up to rain. inside the house. ceiling is crying. this is fine"],
      passive_aggressive: ["lovely indoor waterfall in the bedroom now. very zen. bucket is getting full tho. whenever ur free"],
      new_money: ["ceiling leak is unacceptable. water damaged my nightstand. need immediate repair and damage assessment"],
      generic: ["hey roof is leaking. water coming through the bedroom ceiling. needs repair before it gets worse"],
    },
  },
  {
    id: 'foundation_concern',
    name: 'Foundation Issue',
    category: 'structural',
    baseProbability: 0.05,
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
    baseProbability: 0.15,
    costMin: 2000,
    costMax: 6000,
    tenantIssue: true,
    description: 'The septic system is experiencing issues requiring significant repairs.',
    emoji: '⚠️',
    requiresSeptic: true,
    relatedIssueIds: ['septic_issues'],
    tenantMessages: {
      corporate_brain: ["septic situation escalating. drains backing up across the unit. need emergency service today"],
      retired_micromanager: ["Septic backup started 9:45 AM. Shower, sinks, and toilets all draining slow. Smell noticeable in yard."],
      anxious_professional: ["something is seriously wrong with the septic?? theres a smell and the drains are backing up. is this hazardous??"],
      chaos_magnet: ["so the yard smells like a swamp and the toilets arent flushing. septic tank said no more. love it"],
      passive_aggressive: ["interesting aroma from the yard lately. drains backing up too. sure its nothing. whenever u have a sec"],
      generic: ["hey septic system is backing up. drains not working and bad smell outside. need someone out here asap"],
    },
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
    tenantMessages: {
      corporate_brain: ["water pressure dropped to zero. well pump cycling on/off. cant work from home without running water"],
      retired_micromanager: ["Well pump cutting out every 15 minutes. Pressure drops from 40 to 12 PSI. Started yesterday 3 PM. Log attached."],
      anxious_professional: ["no water pressure?? the pump keeps making clicking sounds. is it going to burn out?? should i turn it off??"],
      chaos_magnet: ["well pump is doing its dying whale impression again. water comes out in sad little spurts. vibes are off"],
      passive_aggressive: ["water pressure is... artistic. sometimes strong, sometimes a trickle. keeps things exciting. whenever"],
      generic: ["hey well pump isnt working right. water pressure really low and pump keeps cycling. need someone to check it"],
    },
  },

  // LANDSCAPING/EXTERIOR
  {
    id: 'landscaping_damage',
    name: 'Storm Damage Repair',
    category: 'landscaping',
    baseProbability: 0.35,
    costMin: 500,
    costMax: 1500,
    tenantIssue: false,
    description: 'Storm damage to the fence/landscaping needs repair.',
    emoji: '🌪️',
    excludesHOA: true,
    relatedIssueIds: ['siding_damage', 'roof_wear'],
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
    tenantMessages: {
      anxious_professional: ["saw some bugs in the kitchen?? are they dangerous?? should i be worried??"],
      chaos_magnet: ["theres an ant army in my kitchen. theyre organized. theyre coming for my snacks"],
      passive_aggressive: ["noticed some new roommates. tiny. many legs. very social. whenever u have time"],
      generic: ["hey seeing some bugs around the kitchen. can we get pest control out here"],
    },
  },
  {
    id: 'mouse_problem',
    name: 'Mouse Infestation',
    category: 'pest',
    baseProbability: 0.4,
    costMin: 250,
    costMax: 600,
    tenantIssue: true,
    description: 'There are signs of mice in the property.',
    emoji: '🐭',
    requiresSuburban: true,
    relatedIssueIds: ['termite_damage'],
    tenantMessages: {
      anxious_professional: ["heard scratching in the wall last night. probably just settling right?? RIGHT?? ok i saw a mouse"],
      chaos_magnet: ["somethings living in my walls. heard it sneeze. DO MICE SNEEZE. saw one run across kitchen at 2am"],
      retired_micromanager: ["Spotted mouse 3 times. Kitchen once, pantry twice. Set 4 traps. Theyre avoiding them. Exterminator needed."],
      passive_aggressive: ["noticed some new roommates! small with tails. leaving little presents in the pantry"],
      generic: ["hey saw a mouse in the kitchen. actually a few times now. exterminator"],
    },
  },
  {
    id: 'cockroach_issue',
    name: 'Cockroach Problem',
    category: 'pest',
    baseProbability: 0.5,
    costMin: 200,
    costMax: 500,
    tenantIssue: true,
    description: 'Cockroaches have been spotted in the unit.',
    emoji: '🪳',
    requiresUrban: true,
    relatedIssueIds: ['termite_damage'],
    tenantMessages: {
      new_money: ["saw a roach. this is unacceptable. need pest control immediately"],
      chaos_magnet: ["ROACH. saw a roach. it was HUGE. it looked at me. we made eye contact. help"],
      law_curious: ["documenting cockroach sighting. this is a habitability issue. whats the timeline for treatment"],
      passive_aggressive: ["saw our little friend again last night. hes getting comfortable. whenever u have time"],
      generic: ["hey saw some roaches. can we get pest control scheduled"],
    },
  },
  {
    id: 'termite_activity',
    name: 'Termite Activity',
    category: 'pest',
    baseProbability: 0.1,
    costMin: 1000,
    costMax: 3000,
    tenantIssue: false,
    description: 'Signs of termite activity requiring treatment and inspection.',
    emoji: '🪲',
    relatedIssueIds: ['termite_damage'],
  },

  // MOISTURE/MOLD ISSUES (from unfixed property problems)
  {
    id: 'mold_discovery',
    name: 'Mold Growth Found',
    category: 'plumbing',
    baseProbability: 0.15,
    costMin: 800,
    costMax: 3000,
    tenantIssue: true,
    description: 'Mold growth was discovered in a damp area, requiring professional remediation.',
    emoji: '🦠',
    relatedIssueIds: ['mold_remediation', 'drainage_issues', 'basement_moisture'],
    tenantMessages: {
      anxious_professional: ["found mold in the bathroom?? is it black mold?? should i leave?? this seems really bad??"],
      law_curious: ["documenting mold in bathroom and closet. this is a health hazard. what is the remediation timeline"],
      corporate_brain: ["mold identified in bathroom ceiling and bedroom closet wall. health concern. need remediation asap"],
      chaos_magnet: ["found mold. in the walls. my walls have mold. the walls are alive. with mold. great"],
      passive_aggressive: ["noticed some interesting wall art forming in the bathroom. fuzzy. green. probably fine. whenever"],
      generic: ["hey found mold growing in the bathroom. spreading to the closet wall. need someone to look at it"],
    },
  },
  {
    id: 'window_draft_leak',
    name: 'Window Leak/Draft',
    category: 'structural',
    baseProbability: 0.4,
    costMin: 300,
    costMax: 1200,
    tenantIssue: true,
    description: 'Windows are drafty or leaking during rain, causing discomfort and potential water damage.',
    emoji: '🪟',
    relatedIssueIds: ['window_seals', 'historic_windows', 'cosmetic_updates'],
    tenantMessages: {
      retired_micromanager: ["Window leak during rain. Water on sill measured 2 inches. Draft from bedroom window reads 15 degrees below room temp."],
      anxious_professional: ["windows are leaking when it rains?? water is getting on the floor. is this going to damage the walls??"],
      chaos_magnet: ["wind is literally coming through the closed windows. and rain. rain is also coming through. closed windows"],
      new_money: ["drafts through the windows are unacceptable. heating bill doubled. need proper sealing or replacement"],
      generic: ["hey windows are leaking when it rains and theres a bad draft. need them sealed or fixed"],
    },
  },
  {
    id: 'porch_deck_damage',
    name: 'Porch/Deck Repair',
    category: 'structural',
    baseProbability: 0.3,
    costMin: 400,
    costMax: 1500,
    tenantIssue: true,
    description: 'The porch or deck has rotting boards that are becoming a safety hazard.',
    emoji: '🪵',
    excludesHOA: true,
    relatedIssueIds: ['porch_rot', 'siding_damage'],
    tenantMessages: {
      retired_micromanager: ["Porch board broke through. 3rd board from left, front porch. Nearly fell through. Safety hazard. Photos attached."],
      law_curious: ["porch board broke. this is a safety/liability issue. documenting the condition. need repair timeline"],
      anxious_professional: ["porch board broke when i stepped on it!! is the whole porch going to collapse??"],
      chaos_magnet: ["put my foot through the porch. literally. my foot. through the porch. classic"],
      generic: ["hey porch has rotting boards. one broke through when i walked on it. safety issue"],
    },
  },

  // URBAN-SPECIFIC ISSUES
  {
    id: 'parking_issue',
    name: 'Parking Problem',
    category: 'hoa',
    baseProbability: 0.5,
    costMin: 150,
    costMax: 400,
    tenantIssue: true,
    description: 'Parking situation changed requiring additional payment.',
    emoji: '🅿️',
    requiresUrban: true,
    tenantMessages: {
      control_seeker: ["parking situation changed. my spot was reassigned. need this resolved"],
      new_money: ["parking is becoming impossible. had to pay for street parking twice this week"],
      law_curious: ["parking was included in my lease. changes need to be documented"],
      generic: ["hey parking situation changed. had to pay extra this week"],
    },
  },
  {
    id: 'noise_complaint_received',
    name: 'Noise Complaint',
    category: 'hoa',
    baseProbability: 0.3,
    costMin: 100,
    costMax: 300,
    tenantIssue: true,
    description: 'Received a noise complaint from neighbors.',
    emoji: '🔊',
    requiresUrban: true,
    tenantMessages: {
      passive_aggressive: ["got a noise complaint. was playing music at 7pm on a saturday. sorry i guess"],
      chaos_magnet: ["neighbor complained about noise. i was watching tv. at normal volume. at 8pm. this building"],
      control_seeker: ["received noise complaint. it was unfounded. i have documentation of my activities that evening"],
      generic: ["hey got a noise complaint from downstairs. trying to be quieter"],
    },
  },
  {
    id: 'package_theft',
    name: 'Package Security Issue',
    category: 'hoa',
    baseProbability: 0.4,
    costMin: 100,
    costMax: 250,
    tenantIssue: true,
    description: 'Tenant\'s package was stolen from the building entrance.',
    emoji: '📦',
    requiresUrban: true,
    tenantMessages: {
      new_money: ["my package was stolen from the lobby. this building needs better security"],
      law_curious: ["package stolen. building security is a landlord responsibility. documenting for records"],
      chaos_magnet: ["package stolen. of course. it was my birthday present. to myself. from me. gone"],
      generic: ["hey my package got stolen from out front. any way to improve security"],
    },
  },
  {
    id: 'building_entry_issue',
    name: 'Building Access Problem',
    category: 'hoa',
    baseProbability: 0.3,
    costMin: 150,
    costMax: 400,
    tenantIssue: true,
    description: 'Building entry system or intercom not working properly.',
    emoji: '🚪',
    requiresUrban: true,
    requiresHOA: true,
    tenantMessages: {
      control_seeker: ["building entry system is malfunctioning. security concern. need immediate fix"],
      anxious_professional: ["buzzer not working?? i cant let people in. is this a security risk??"],
      generic: ["hey the building intercom isnt working. cant buzz anyone in"],
    },
  },

  // SUBURBAN-SPECIFIC ISSUES
  {
    id: 'driveway_repair',
    name: 'Driveway Repair',
    category: 'landscaping',
    baseProbability: 0.3,
    costMin: 400,
    costMax: 1200,
    tenantIssue: false,
    description: 'Driveway has cracks or damage that needs repair.',
    emoji: '🛣️',
    requiresSuburban: true,
    excludesHOA: true,
  },
  {
    id: 'fence_repair',
    name: 'Fence Repair',
    category: 'landscaping',
    baseProbability: 0.4,
    costMin: 300,
    costMax: 800,
    tenantIssue: false,
    description: 'Section of fence is damaged or leaning.',
    emoji: '🏗️',
    requiresSuburban: true,
    excludesHOA: true,
    tenantMessages: {
      retired_micromanager: ["Fence panel leaning 15 degrees since Tuesday. Neighbor dog keeps visiting. Photos attached."],
      lonely_caller: ["hey! fence fell over a bit. not urgent! kinda like the neighbor dog visits now haha"],
      generic: ["hey part of the fence is falling over. needs repair"],
    },
  },
  {
    id: 'gutter_cleaning',
    name: 'Gutter Maintenance',
    category: 'landscaping',
    baseProbability: 0.5,
    costMin: 150,
    costMax: 350,
    tenantIssue: false,
    description: 'Gutters are clogged and overflowing.',
    emoji: '🍂',
    requiresSuburban: true,
    excludesHOA: true,
    relatedIssueIds: ['drainage_issues', 'roof_wear'],
  },
  {
    id: 'lawn_care_dispute',
    name: 'Lawn Care Issue',
    category: 'landscaping',
    baseProbability: 0.4,
    costMin: 150,
    costMax: 400,
    tenantIssue: true,
    description: 'HOA or neighbor complaint about lawn condition.',
    emoji: '🌱',
    requiresSuburban: true,
    excludesHOA: true,
    tenantMessages: {
      passive_aggressive: ["got a note from the neighbor about the lawn. very polite. very pointed. fun times"],
      chaos_magnet: ["neighbor complained about the lawn. its been one week since i couldnt mow bc of rain. ONE WEEK"],
      generic: ["hey got a complaint about the lawn. when can someone come do yard work"],
    },
  },
  {
    id: 'wildlife_issue',
    name: 'Wildlife Encounter',
    category: 'pest',
    baseProbability: 0.3,
    costMin: 200,
    costMax: 500,
    tenantIssue: true,
    description: 'Wildlife (raccoons, possums, etc.) causing problems.',
    emoji: '🦝',
    requiresSuburban: true,
    tenantMessages: {
      chaos_magnet: ["theres a raccoon family living under the porch. they have a whole society. i think theyre organized"],
      anxious_professional: ["is that raccoon dangerous?? its just staring at me when i leave for work"],
      lonely_caller: ["hey! theres a possum visiting every night. hes kinda cute actually. but maybe not ideal?"],
      generic: ["hey wildlife issue - animals getting into the garbage and under the porch"],
    },
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
    tenantMessages: {
      anxious_professional: ["im so sorry i lost my keys. i never do this. im usually so organized. im so sorry"],
      chaos_magnet: ["lost my keys. again. i know. i dont understand it either. they just vanish"],
      passive_aggressive: ["keys gone. not sure where. probably somewhere obvious. could we rekey just in case"],
      generic: ["hey lost my keys somewhere. can we get the locks rekeyed for safety"],
    },
  },
  {
    id: 'smoke_detector',
    name: 'Smoke Detector Issue',
    category: 'electrical',
    baseProbability: 0.4,
    costMin: 50,
    costMax: 150,
    tenantIssue: true,
    description: 'Smoke detector is chirping or not working.',
    emoji: '🔔',
    tenantMessages: {
      retired_micromanager: ["Smoke detector chirping since 3:15 AM. Replaced battery twice. Still chirping every 47 seconds."],
      chaos_magnet: ["smoke detector has been chirping for 3 days. replaced the battery. its still chirping. at 3am. every night"],
      anxious_professional: ["smoke detector keeps beeping?? is something wrong?? is there a fire i dont know about??"],
      passive_aggressive: ["smoke detectors been chirping. nice alarm clock replacement. very consistent. 3am every night"],
      generic: ["hey smoke detector keeps chirping even after new batteries. can someone look at it"],
    },
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
    tenantMessages: {
      corporate_brain: ["few minor items to flag: caulking in bathroom, filter needs change, weatherstrip on door"],
      retired_micromanager: ["Maintenance list: 1. HVAC filter (90 days old). 2. Bathroom caulk peeling. 3. Door weatherstrip gap."],
      lonely_caller: ["hey! just some small stuff. filter, caulking. nothing urgent! just wanted to say hi really haha"],
      generic: ["hey few maintenance items - filter change, some caulking, minor stuff. nothing urgent"],
    },
  },
];

/**
 * Calculate progressive escalation multiplier for unfixed issues
 * The longer an issue goes unfixed, the worse (and more expensive) it gets
 * E.g., unfixed roof → water damage → mold → insurance hike
 * 
 * @param monthsActive - How many months the rental has been active
 * @returns A multiplier that increases maintenance probability and cost over time
 */
export function getProgressiveEscalationMultiplier(
  monthsActive: number,
  unfixedCount: number
): { probabilityMult: number; costMult: number } {
  if (unfixedCount === 0) return { probabilityMult: 1, costMult: 1 };
  
  // Escalation tiers based on months with unfixed issues:
  // Months 1-3: Normal (1x) - issues are latent
  // Months 4-6: Building (1.3x prob, 1.15x cost) - problems starting to compound
  // Months 7-9: Serious (1.6x prob, 1.35x cost) - secondary damage developing
  // Months 10-12: Critical (2.0x prob, 1.6x cost) - cascading failures
  // Months 13+: Severe (2.5x prob, 2.0x cost) - everything falling apart
  const escalationPerIssue = Math.min(unfixedCount, 4); // Cap at 4 issues for scaling
  const issueSeverityFactor = 1 + (escalationPerIssue - 1) * 0.15; // 1.0, 1.15, 1.30, 1.45
  
  let probabilityMult: number;
  let costMult: number;
  
  if (monthsActive <= 3) {
    probabilityMult = 1.0;
    costMult = 1.0;
  } else if (monthsActive <= 6) {
    probabilityMult = 1.3;
    costMult = 1.15;
  } else if (monthsActive <= 9) {
    probabilityMult = 1.6;
    costMult = 1.35;
  } else if (monthsActive <= 12) {
    probabilityMult = 2.0;
    costMult = 1.6;
  } else {
    probabilityMult = 2.5;
    costMult = 2.0;
  }
  
  return {
    probabilityMult: probabilityMult * issueSeverityFactor,
    costMult: costMult * issueSeverityFactor,
  };
}

/**
 * Calculate adjusted probability for a maintenance event
 * Now includes progressive escalation based on how long issues go unfixed
 */
export function getAdjustedProbability(
  event: EnhancedMaintenanceEvent,
  property: Property,
  deal: Deal,
  monthsActive?: number
): number {
  let probability = event.baseProbability;

  // 1. Apply quality tier multiplier
  const qualityTier = getPropertyQualityTier(property.price);
  probability *= QUALITY_TIER_MULTIPLIERS[qualityTier];

  // 2. Check property type restrictions
  const isHOA = property.propertyType === 'condo' || property.propertyType === 'apartment';

  if (event.requiresHOA && !isHOA) return 0;
  if (event.excludesHOA && isHOA) return 0;
  
  // 3. Check location type restrictions (urban vs suburban specific issues)
  const isUrban = property.locationType === 'urban';
  const isSuburban = property.locationType === 'suburban';
  
  if (event.requiresUrban && !isUrban) return 0;
  if (event.requiresSuburban && !isSuburban) return 0;

  // Check for septic/well (suburban lower-priced properties)
  const hasSeptic = isSuburban && property.price < 250000;
  const hasWell = isSuburban && property.price < 200000;

  if (event.requiresSeptic && !hasSeptic) return 0;
  if (event.requiresWell && !hasWell) return 0;

  // 4. Check for ALL unfixed issues (undiscovered + discovered-but-not-fixed)
  const unfixedIssues = getUnfixedIssues(deal, property);

  if (event.relatedIssueIds && event.relatedIssueIds.length > 0) {
    const hasRelatedUnfixedIssue = unfixedIssues.some(issueId =>
      event.relatedIssueIds!.includes(issueId)
    );

    if (hasRelatedUnfixedIssue) {
      probability *= (3 + Math.random() * 2);
    }
  }
  
  // 5. Progressive escalation: unfixed issues get worse over time
  if (unfixedIssues.length > 0 && monthsActive !== undefined) {
    const escalation = getProgressiveEscalationMultiplier(monthsActive, unfixedIssues.length);
    probability *= escalation.probabilityMult;
  }

  return probability;
}

/**
 * Roll for a maintenance event using enhanced mechanics
 * Excludes recently-triggered events to prevent repetition
 * Now supports progressive escalation based on rental duration
 */
export function rollForEnhancedMaintenance(
  property: Property,
  deal: Deal,
  excludeIds?: string[],
  monthsActive?: number
): any | null {
  const unfixedIssues = getUnfixedIssues(deal, property);
  const escalation = (monthsActive !== undefined && unfixedIssues.length > 0)
    ? getProgressiveEscalationMultiplier(monthsActive, unfixedIssues.length)
    : { probabilityMult: 1, costMult: 1 };

  // Filter out recently-triggered events to prevent repetition
  let applicableEvents = ENHANCED_MAINTENANCE_EVENTS
    .map(event => ({
      ...event,
      adjustedProbability: getAdjustedProbability(event, property, deal, monthsActive),
    }))
    .filter(event => event.adjustedProbability > 0);
  
  // Exclude recent curveballs to prevent repetition (e.g., same dishwasher breaking every week)
  if (excludeIds && excludeIds.length > 0) {
    applicableEvents = applicableEvents.filter(event => !excludeIds.includes(event.id));
  }

  // Roll for each event independently
  for (const event of applicableEvents) {
    const roll = Math.random() * 100;
    if (roll < event.adjustedProbability) {
      // Event triggered! Apply cost escalation for unfixed issues
      const range = event.costMax - event.costMin;
      const baseCost = Math.floor(event.costMin + Math.random() * range);
      const escalatedCost = Math.round(baseCost * escalation.costMult);
      const cashImpact = -escalatedCost;

      // Add escalation note to description if costs were increased
      const escalationNote = escalation.costMult > 1.1
        ? ` (worsened by deferred maintenance)`
        : '';

      return {
        id: event.id,
        name: event.name,
        type: 'negative',
        trigger: 'rental_monthly',
        probability: event.adjustedProbability,
        tenantIssue: event.tenantIssue,
        cashImpact,
        description: event.description + escalationNote,
        emoji: event.emoji,
        color: 'red',
        escalated: escalation.costMult > 1.1,
      };
    }
  }

  return null;
}

/**
 * Update a deal's recent curveball history (keeps last 4 IDs)
 */
export function updateRecentCurveballIds(
  currentIds: string[] | null | undefined,
  newId: string
): string[] {
  const ids = currentIds || [];
  const updated = [...ids, newId];
  // Keep only the last 4 curveballs to prevent repeats while allowing variety
  return updated.slice(-4);
}
