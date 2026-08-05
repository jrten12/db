import type { Deal, Achievement } from '@shared/schema';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type AchievementCategory = 'profit' | 'strategy' | 'milestone';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  category: AchievementCategory;
  secret?: boolean;
}

export const ACHIEVEMENT_DEFINITIONS: Record<string, AchievementDefinition> = {
  first_25k: {
    id: 'first_25k',
    name: 'Getting Started',
    description: 'Earn your first $25,000 in profit',
    icon: 'banknote',
    tier: 'bronze',
    category: 'profit',
  },
  first_100k: {
    id: 'first_100k',
    name: 'Six Figures',
    description: 'Earn $100,000 in total profit',
    icon: 'trending-up',
    tier: 'silver',
    category: 'profit',
  },
  first_1m: {
    id: 'first_1m',
    name: 'Millionaire Mogul',
    description: 'Earn $1,000,000 in total profit',
    icon: 'crown',
    tier: 'diamond',
    category: 'profit',
  },
  double_capital: {
    id: 'double_capital',
    name: 'Double or Nothing',
    description: 'Double your starting capital',
    icon: 'coins',
    tier: 'gold',
    category: 'profit',
  },
  roi_king: {
    id: 'roi_king',
    name: 'ROI King',
    description: 'Achieve 100%+ ROI on a single deal',
    icon: 'rocket',
    tier: 'gold',
    category: 'profit',
  },
  roi_legend: {
    id: 'roi_legend',
    name: 'Return Legend',
    description: 'Achieve 200%+ ROI on a single deal',
    icon: 'flame',
    tier: 'platinum',
    category: 'profit',
  },
  the_landlord: {
    id: 'the_landlord',
    name: 'The Landlord',
    description: 'Hold 3 rental properties simultaneously',
    icon: 'building-2',
    tier: 'silver',
    category: 'strategy',
  },
  the_flipper: {
    id: 'the_flipper',
    name: 'The Flipper',
    description: 'Complete 3 profitable flips in a row',
    icon: 'hammer',
    tier: 'silver',
    category: 'strategy',
  },
  brrrr_boss: {
    id: 'brrrr_boss',
    name: 'BRRRR Boss',
    description: 'Refinance and pull out 75%+ of invested capital',
    icon: 'refresh-cw',
    tier: 'gold',
    category: 'strategy',
  },
  conservative_operator: {
    id: 'conservative_operator',
    name: 'Conservative Operator',
    description: 'Complete 3 deals with no major repairs needed',
    icon: 'shield-check',
    tier: 'silver',
    category: 'strategy',
  },
  first_deal: {
    id: 'first_deal',
    name: 'First Steps',
    description: 'Complete your first deal',
    icon: 'home',
    tier: 'bronze',
    category: 'milestone',
  },
  first_rental: {
    id: 'first_rental',
    name: 'Passive Income',
    description: 'Acquire your first rental property',
    icon: 'key',
    tier: 'bronze',
    category: 'milestone',
  },
  first_flip: {
    id: 'first_flip',
    name: 'Flip It Good',
    description: 'Complete your first profitable flip',
    icon: 'rotate-ccw',
    tier: 'bronze',
    category: 'milestone',
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Win the game in under 26 months',
    icon: 'zap',
    tier: 'platinum',
    category: 'milestone',
  },
  diversified: {
    id: 'diversified',
    name: 'Diversified Portfolio',
    description: 'Have both active rentals and completed flips',
    icon: 'layers',
    tier: 'bronze',
    category: 'strategy',
  },
  no_diligence: {
    id: 'no_diligence',
    name: 'Gut Feeling',
    description: 'Complete a profitable deal with zero due diligence',
    icon: 'dice-5',
    tier: 'silver',
    category: 'strategy',
    secret: true,
  },
};

export const TIER_COLORS: Record<AchievementTier, { bg: string; border: string; text: string; glow: string }> = {
  bronze: {
    bg: 'bg-amber-900/30',
    border: 'border-amber-600/50',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/30',
  },
  silver: {
    bg: 'bg-slate-400/20',
    border: 'border-slate-400/50',
    text: 'text-slate-300',
    glow: 'shadow-slate-400/30',
  },
  gold: {
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-500/40',
  },
  platinum: {
    bg: 'bg-cyan-500/20',
    border: 'border-cyan-400/50',
    text: 'text-cyan-300',
    glow: 'shadow-cyan-400/50',
  },
  diamond: {
    bg: 'bg-purple-500/20',
    border: 'border-purple-400/50',
    text: 'text-purple-300',
    glow: 'shadow-purple-500/60',
  },
};

export interface AchievementCheckContext {
  deals: Deal[];
  totalProfit: number;
  startingCash: number;
  currentCash: number;
  consecutiveFlipProfits: number;
  activeRentals: number;
  completedFlips: number;
  weeksUsed: number;
  unlockedAchievements: string[];
  investigations?: { propertyId: number; investigationType: string }[];
  properties?: { id: number; rehabMin: number; conditionTag: string }[];
  profitableDeals?: number;
  goalDeals?: number;
  weeksRemaining?: number;
}

export function checkAchievements(context: AchievementCheckContext): string[] {
  const newAchievements: string[] = [];
  const { unlockedAchievements } = context;

  const hasAchievement = (id: string) => unlockedAchievements.includes(id);
  const unlock = (id: string) => {
    if (!hasAchievement(id) && !newAchievements.includes(id)) {
      newAchievements.push(id);
    }
  };

  if (context.totalProfit >= 25000) unlock('first_25k');
  if (context.totalProfit >= 100000) unlock('first_100k');
  if (context.totalProfit >= 1000000) unlock('first_1m');
  
  if (context.currentCash >= context.startingCash * 2) unlock('double_capital');

  const completedDeals = context.deals.filter(d => 
    d.status === 'completed' || d.status === 'sold_rental' || d.status === 'active_rental'
  );
  
  if (completedDeals.length >= 1) unlock('first_deal');
  
  const rentals = context.deals.filter(d =>
    (d.strategy === 'rent' || d.strategy === 'rental') &&
    (d.status === 'active_rental' || d.status === 'sold_rental')
  );
  if (rentals.length >= 1) unlock('first_rental');
  
  const profitableFlips = context.deals.filter(d => 
    d.strategy === 'flip' && d.status === 'completed' && (d.actualProfit || 0) > 0
  );
  if (profitableFlips.length >= 1) unlock('first_flip');
  
  if (context.activeRentals >= 3) unlock('the_landlord');
  
  if (context.consecutiveFlipProfits >= 3) unlock('the_flipper');
  
  const activeRentals = context.deals.filter(d => d.status === 'active_rental');
  if (activeRentals.length > 0 && profitableFlips.length > 0) unlock('diversified');
  
  profitableFlips.forEach(deal => {
    const outputs = deal.proFormaOutputs as any;
    if (outputs?.flipROI >= 100) unlock('roi_king');
    if (outputs?.flipROI >= 200) unlock('roi_legend');
  });

  // BRRRR Boss — refinance and pull out 75%+ of invested capital
  for (const deal of context.deals) {
    if ((deal.refinanceCount ?? 0) > 0) {
      const outputs = deal.proFormaOutputs as any;
      const invested = outputs?.totalCashInvested || 0;
      const cashOut = outputs?.totalCashOut || outputs?.lastCashOut || 0;
      if (invested > 0 && cashOut / invested >= 0.75) {
        unlock('brrrr_boss');
      }
    }
  }

  // Conservative Operator — complete 3 deals on properties needing no major repairs
  if (context.properties?.length) {
    const lightRehabDeals = completedDeals.filter(d => {
      const prop = context.properties!.find(p => p.id === d.propertyId);
      if (!prop) return false;
      const tag = (prop.conditionTag || '').toLowerCase();
      return prop.rehabMin <= 5000 || tag === 'excellent' || tag === 'good';
    });
    if (lightRehabDeals.length >= 3) unlock('conservative_operator');
  }

  // Gut Feeling — profitable deal with zero due diligence on that property
  if (context.investigations) {
    const diligenceByProperty = new Map<number, number>();
    for (const inv of context.investigations) {
      diligenceByProperty.set(inv.propertyId, (diligenceByProperty.get(inv.propertyId) || 0) + 1);
    }
    const gutDeal = context.deals.find(d => {
      const profitable =
        ((d.actualProfit || 0) > 0) ||
        d.status === 'active_rental' ||
        d.status === 'sold_rental';
      if (!profitable) return false;
      if (!(d.status === 'completed' || d.status === 'active_rental' || d.status === 'sold_rental')) {
        return false;
      }
      return (diligenceByProperty.get(d.propertyId) || 0) === 0;
    });
    if (gutDeal) unlock('no_diligence');
  }

  // Speed Demon — win the game in under 26 months
  const goal = context.goalDeals ?? 3;
  const scored = context.profitableDeals ?? 0;
  if (scored >= goal && context.weeksUsed < 26) {
    unlock('speed_demon');
  }

  return newAchievements;
}

export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS[id];
}
