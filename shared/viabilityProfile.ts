/** Trap listing profiles seeded on properties — affect realized rent, sale, surprises, high-LTV stress */
export type ViabilityProfile = 'viable' | 'rent-mirage' | 'rehab-sinkhole' | 'time-bomb' | 'leverage-trap';

export interface ViabilityModifiers {
  rentMult: number;
  vacancyAdd: number;
  saleMult: number;
  surpriseMult: number;
  highLtvSurprise: number;
}

export function getViabilityModifiers(
  profile: string | null | undefined,
  context: { weeksHeld?: number; ltv?: number } = {}
): ViabilityModifiers {
  const weeksHeld = context.weeksHeld ?? 0;
  const ltv = context.ltv ?? 0;
  const highLtv = ltv >= 80;

  switch (profile) {
    case 'rent-mirage':
      return { rentMult: 0.82, vacancyAdd: 4, saleMult: 0.95, surpriseMult: 1.0, highLtvSurprise: 0 };
    case 'rehab-sinkhole':
      return { rentMult: 0.95, vacancyAdd: 0, saleMult: 0.92, surpriseMult: 1.75, highLtvSurprise: 0 };
    case 'time-bomb': {
      const late = weeksHeld >= 12;
      return {
        rentMult: late ? 0.88 : 1,
        vacancyAdd: late ? 3 : 0,
        saleMult: late ? 0.85 : 0.97,
        surpriseMult: late ? 1.5 : 1.1,
        highLtvSurprise: 0,
      };
    }
    case 'leverage-trap':
      return {
        rentMult: 1,
        vacancyAdd: 0,
        saleMult: highLtv ? 0.90 : 0.98,
        surpriseMult: highLtv ? 1.4 : 1.0,
        highLtvSurprise: highLtv ? 2500 : 0,
      };
    default:
      return { rentMult: 1, vacancyAdd: 0, saleMult: 1, surpriseMult: 1, highLtvSurprise: 0 };
  }
}
