import type { Property } from '@shared/schema';

export type UncertaintyLevel = 'low' | 'medium' | 'high';

export interface PropertyUncertainty {
  rentVariability: UncertaintyLevel;
  conditionClarity: UncertaintyLevel;
  timelineRisk: UncertaintyLevel;
}

const LEVEL_LABEL: Record<UncertaintyLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export function getPropertyUncertainty(property: Property): PropertyUncertainty {
  const rentSpread =
    property.rentMin > 0 ? (property.rentMax - property.rentMin) / property.rentMin : 0;
  const rentVariability: UncertaintyLevel =
    rentSpread > 0.22 ? 'high' : rentSpread > 0.12 ? 'medium' : 'low';

  const tag = property.conditionTag.toLowerCase();
  let conditionClarity: UncertaintyLevel = 'medium';
  if (tag.includes('fixer') || tag.includes('repair') || tag.includes('rough')) {
    conditionClarity = 'low';
  } else if (tag.includes('excellent') || tag.includes('turnkey')) {
    conditionClarity = 'high';
  }

  const timelineBase = Math.max(property.timelineMin, 1);
  const timelineSpread = (property.timelineMax - property.timelineMin) / timelineBase;
  const timelineRisk: UncertaintyLevel =
    timelineSpread > 0.45 ? 'high' : timelineSpread > 0.2 ? 'medium' : 'low';

  return { rentVariability, conditionClarity, timelineRisk };
}

export function uncertaintyBadgeLabel(
  kind: keyof PropertyUncertainty,
  level: UncertaintyLevel,
): string {
  switch (kind) {
    case 'rentVariability':
      return level === 'high'
        ? 'Rent variability: High'
        : level === 'medium'
          ? 'Rent variability: Medium'
          : 'Rent variability: Low';
    case 'conditionClarity':
      return level === 'low'
        ? 'Condition clarity: Low'
        : level === 'medium'
          ? 'Condition clarity: Medium'
          : 'Condition clarity: High';
    case 'timelineRisk':
      return level === 'high'
        ? 'Timeline risk: High'
        : level === 'medium'
          ? 'Timeline risk: Medium'
          : 'Timeline risk: Low';
    default:
      return `${kind}: ${LEVEL_LABEL[level]}`;
  }
}
