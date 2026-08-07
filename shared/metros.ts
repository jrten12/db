/**
 * Metro / city markets for Dealbreak.
 * Each game run plays one metro board; property catalogs are filtered by metroId.
 */

export type MetroId = 'philadelphia' | 'atlanta';

export interface MetroDefinition {
  id: MetroId;
  name: string;
  shortName: string;
  region: string;
  tagline: string;
  teachingAngle: string;
  /** Neighborhoods treated as urban for locationType backfill */
  urbanNeighborhoods: string[];
  /** Starting market bias for new runs in this metro */
  defaultMarketCondition: 'terrible' | 'poor' | 'neutral' | 'good' | 'excellent';
}

export const METROS: Record<MetroId, MetroDefinition> = {
  philadelphia: {
    id: 'philadelphia',
    name: 'Philadelphia Metro',
    shortName: 'Philly',
    region: 'Mid-Atlantic',
    tagline: 'Rowhomes, Main Line, and mixed urban/suburban stock',
    teachingAngle: 'Classic Mid-Atlantic: brick twins, water/heat variety, steady rents',
    urbanNeighborhoods: [
      'Downtown',
      'Northern Liberties',
      'Fishtown',
      'South Street',
      'Kensington',
      'Port Richmond',
      'Old City',
      'Center City',
      'Rittenhouse Square',
      'Society Hill',
      'Queen Village',
      'Graduate Hospital',
      'Fairmount',
      'Penns Landing',
    ],
    defaultMarketCondition: 'good',
  },
  atlanta: {
    id: 'atlanta',
    name: 'Atlanta Metro',
    shortName: 'Atlanta',
    region: 'Sun Belt',
    tagline: 'Growth market — intown bungalows, Buckhead condos, suburban sprawl',
    teachingAngle: 'Sun Belt growth: newer HOA stock, insurance pressure, stronger appreciation bias',
    urbanNeighborhoods: [
      'Midtown',
      'Old Fourth Ward',
      'Cabbagetown',
      'Grant Park',
      'Inman Park',
      'Edgewood',
      'West End',
      'Downtown Atlanta',
      'Buckhead',
      'Virginia-Highland',
      'East Atlanta',
    ],
    defaultMarketCondition: 'excellent',
  },
};

export const METRO_LIST: MetroDefinition[] = [METROS.philadelphia, METROS.atlanta];

export function isMetroId(value: string | null | undefined): value is MetroId {
  return value === 'philadelphia' || value === 'atlanta';
}

export function normalizeMetroId(value: string | null | undefined): MetroId {
  return isMetroId(value) ? value : 'philadelphia';
}
