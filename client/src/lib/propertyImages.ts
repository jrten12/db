import oakwoodCottage from '@assets/generated_images/oakwood_cottage_house.png';
import riversideRanch from '@assets/generated_images/riverside_ranch_house.png';
import maplewoodColonial from '@assets/generated_images/maplewood_fixer-upper_house.png';
import downtownLoft from '@assets/generated_images/downtown_loft_building.png';
import elmwoodBungalow from '@assets/generated_images/elmwood_bungalow_house.png';
import hillsideRetreat from '@assets/generated_images/hillside_retreat_house.png';
import westsideManor from '@assets/generated_images/westside_manor_house.png';

export const propertyImages: Record<string, string> = {
  'Oakwood Cottage': oakwoodCottage,
  'Riverside Ranch': riversideRanch,
  'Maplewood Colonial': maplewoodColonial,
  'Downtown Loft': downtownLoft,
  'Elmwood Bungalow': elmwoodBungalow,
  'Hillside Retreat': hillsideRetreat,
  'Westside Manor': westsideManor,
};

export const getPropertyImage = (propertyName: string): string => {
  return propertyImages[propertyName] || oakwoodCottage;
};