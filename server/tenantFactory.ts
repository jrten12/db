import type { Deal, GameRun, Property, Tenant, InsertTenant } from '@shared/schema';
import { storage } from './storage';
import { getUnfixedIssues } from './maintenanceMechanics';
import {
  generateTenantName,
  getRandomPersonalityType,
  getSpeechPatterns,
  getRandomPaymentEthic,
} from '../client/src/lib/tenantGenerator';

export type TenantCreationKind = 'initial' | 'replacement';

/**
 * Create a tenant row for an active rental when none exists yet.
 * Initial tenants lock rent at activation; replacements trigger move-in negotiation next tick.
 */
export async function createTenantForDeal(
  deal: Deal,
  gameRun: GameRun,
  property: Property | null | undefined,
  kind: TenantCreationKind
): Promise<Tenant | null> {
  const existing = await storage.getTenantByDeal(deal.id);
  if (existing) return existing;

  const outputs = deal.proFormaOutputs as Record<string, unknown> | null;
  const monthlyRent = (outputs?.monthlyGrossRent as number) || 0;
  const personalityType = getRandomPersonalityType(monthlyRent || undefined);
  const unfixedCount = property ? getUnfixedIssues(deal, property).length : 0;
  const conditionPenalty = Math.min(unfixedCount * 3, 15);
  const initialSatisfaction = (70 + Math.floor(Math.random() * 16)) - conditionPenalty;

  const leaseStartWeek = kind === 'replacement'
    ? gameRun.currentWeek + 1
    : gameRun.currentWeek;

  const tenantPayload: InsertTenant = {
    dealId: deal.id,
    name: generateTenantName(),
    personalityType,
    speechPatterns: getSpeechPatterns(personalityType),
    lastContactWeek: null,
    satisfaction: Math.max(40, initialSatisfaction),
    weeksUnhappy: 0,
    paymentEthic: getRandomPaymentEthic(),
    leaseStartWeek,
    leaseRentAmount: monthlyRent > 0 ? monthlyRent : null,
  };

  const tenant = await storage.createTenant(tenantPayload);

  if (kind === 'replacement') {
    await storage.updateDeal(deal.id, {
      proFormaOutputs: {
        ...(outputs || {}),
        awaitingReplacementTenantSinceWeek: leaseStartWeek,
      },
    });
  }

  return tenant;
}
