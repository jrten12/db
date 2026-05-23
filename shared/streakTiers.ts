// Streak tier system — shared between client HUD and server logic.
// Tier names lean understated/operator-flavored, not arcade-cheesy.

export type StreakTier = {
  threshold: number;
  title: string;
  // Tailwind text color class for the tier badge
  colorClass: string;
  // Short flavor line shown on tier-up flash
  blurb: string;
};

export const STREAK_TIERS: StreakTier[] = [
  { threshold: 0, title: '', colorClass: 'text-white/30', blurb: '' },
  { threshold: 2, title: 'On Pace', colorClass: 'text-white/70', blurb: 'Two in a row. Building rhythm.' },
  { threshold: 3, title: 'Closer', colorClass: 'text-amber-300', blurb: "You're finding deals, not chasing them." },
  { threshold: 5, title: 'Operator', colorClass: 'text-amber-400', blurb: 'Five clean closes. This is a system now.' },
  { threshold: 7, title: 'Sharpshooter', colorClass: 'text-emerald-300', blurb: 'Seven straight. Pros notice players like you.' },
  { threshold: 10, title: 'Heavyweight', colorClass: 'text-emerald-400', blurb: 'Double digits. Most never get here.' },
  { threshold: 15, title: 'Whale', colorClass: 'text-cyan-300', blurb: 'Fifteen straight. Untouchable run.' },
  { threshold: 25, title: 'Legend', colorClass: 'text-fuchsia-300', blurb: 'Twenty-five and counting. Books get written about this.' },
];

export function getStreakTier(streak: number): StreakTier {
  // Walk descending so we return the highest tier the streak qualifies for.
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (streak >= STREAK_TIERS[i].threshold) return STREAK_TIERS[i];
  }
  return STREAK_TIERS[0];
}

// Returns the NEXT tier if any, used to render the "X away" hint in the HUD.
export function getNextStreakTier(streak: number): StreakTier | null {
  for (const tier of STREAK_TIERS) {
    if (streak < tier.threshold) return tier;
  }
  return null;
}

// XP awarded for a deal close. Profitable deals always award a base + ROI bonus.
// Returns 0 for losses (no negative XP — losses already sting via cash).
export function calculateDealXp(profit: number, basis: number): number {
  if (profit <= 0) return 0;
  const roi = basis > 0 ? profit / basis : 0;
  const base = 100;
  // ROI tiers: 5% → +50, 10% → +150, 20% → +300, 30%+ → +500
  let bonus = 0;
  if (roi >= 0.3) bonus = 500;
  else if (roi >= 0.2) bonus = 300;
  else if (roi >= 0.1) bonus = 150;
  else if (roi >= 0.05) bonus = 50;
  return base + bonus;
}

// Career XP levels. Used for the small "level up" flash.
// Thresholds are intentionally spaced so players hit one every few profitable closes early,
// then stretches out so it never feels grindy.
export const XP_LEVELS: { level: number; xp: number; title: string }[] = [
  { level: 1, xp: 0, title: 'Rookie Investor' },
  { level: 2, xp: 300, title: 'Junior Analyst' },
  { level: 3, xp: 800, title: 'Acquisitions' },
  { level: 4, xp: 1800, title: 'Principal' },
  { level: 5, xp: 3500, title: 'Portfolio Manager' },
  { level: 6, xp: 6000, title: 'Fund Director' },
  { level: 7, xp: 10000, title: 'Managing Partner' },
  { level: 8, xp: 16000, title: 'Empire Builder' },
];

export function getXpLevel(xp: number): { level: number; title: string; xpInLevel: number; xpToNext: number | null } {
  let current = XP_LEVELS[0];
  let next: typeof XP_LEVELS[number] | null = null;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].xp) current = XP_LEVELS[i];
    if (xp < XP_LEVELS[i].xp) {
      next = XP_LEVELS[i];
      break;
    }
  }
  return {
    level: current.level,
    title: current.title,
    xpInLevel: xp - current.xp,
    xpToNext: next ? next.xp - xp : null,
  };
}
