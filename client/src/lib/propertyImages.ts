import oakwoodFront from '@assets/generated_images/properties/oakwood_cottage/front.png';
import riversideFront from '@assets/generated_images/properties/riverside_ranch/front.png';
import maplewoodFront from '@assets/generated_images/properties/maplewood_colonial/front.png';
import downtownFront from '@assets/generated_images/properties/downtown_loft/front.png';
import elmwoodFront from '@assets/generated_images/properties/elmwood_bungalow/front.png';
import hillsideFront from '@assets/generated_images/properties/hillside_retreat/front.png';
import westsideFront from '@assets/generated_images/properties/westside_manor/front.png';

import graduateHospitalStudio from '@assets/generated_images/graduate_hospital_studio_apartment.png';
import queenVillageTownhouse from '@assets/generated_images/queen_village_townhouse.png';
import rittenhouseCondo from '@assets/generated_images/rittenhouse_square_condo.png';
import fairmountDuplex from '@assets/generated_images/fairmount_duplex_building.png';
import societyHillApartment from '@assets/generated_images/society_hill_apartment.png';
import oldCityBrownstone from '@assets/generated_images/old_city_brownstone.png';

import southStreetTwin from '@assets/generated_images/south_street_twin_house.png';
import fishtownRowHouse from '@assets/generated_images/fishtown_row_house.png';
import portRichmondDuplex from '@assets/generated_images/port_richmond_duplex.png';
import kensingtonRow from '@assets/generated_images/kensington_row_house.png';
import northernLibertiesLoft from '@assets/generated_images/northern_liberties_loft_building.png';

import issueMold from '@assets/generated_images/properties/issues/mold.png';
import issueFoundation from '@assets/generated_images/properties/issues/foundation_crack.png';
import issueRoof from '@assets/generated_images/properties/issues/roof_damage.png';
import issuePlumbing from '@assets/generated_images/properties/issues/plumbing.png';
import issueTermite from '@assets/generated_images/properties/issues/termite.png';
import issueHvac from '@assets/generated_images/properties/issues/hvac.png';
import issueWaterDamage from '@assets/generated_images/properties/issues/water_damage.png';
import issueElectrical from '@assets/generated_images/properties/issues/electrical.png';

const propertyImages: Record<string, string> = {
  'Oakwood Cottage': oakwoodFront,
  'Riverside Ranch': riversideFront,
  'Maplewood Colonial': maplewoodFront,
  'Downtown Loft': downtownFront,
  'Elmwood Bungalow': elmwoodFront,
  'Hillside Retreat': hillsideFront,
  'Westside Manor': westsideFront,
  'South Street Twin': southStreetTwin,
  'Fishtown Row House': fishtownRowHouse,
  'Port Richmond Duplex': portRichmondDuplex,
  'Kensington Row': kensingtonRow,
  'Northern Liberties Loft': northernLibertiesLoft,
  'Graduate Hospital Studio': graduateHospitalStudio,
  'Queen Village Townhouse': queenVillageTownhouse,
  'Rittenhouse Square Condo': rittenhouseCondo,
  'Fairmount Duplex': fairmountDuplex,
  'Society Hill Apartment': societyHillApartment,
  'Old City Brownstone': oldCityBrownstone,
};

export const issueImages: Record<string, string> = {
  'mold_remediation': issueMold,
  'foundation_settling': issueFoundation,
  'roof_wear': issueRoof,
  'roof_replacement': issueRoof,
  'plumbing_galvanized': issuePlumbing,
  'termite_damage': issueTermite,
  'outdated_hvac': issueHvac,
  'hvac_commercial': issueHvac,
  'electrical_outdated': issueElectrical,
  'water_damage': issueWaterDamage,
  'drainage_issues': issueWaterDamage,
  'septic_issues': issuePlumbing,
  'well_water': issuePlumbing,
  'asbestos_tiles': issueWaterDamage,
  'hoa_assessment': issueFoundation,
  'cosmetic_updates': issueWaterDamage,
  'pool_equipment': issuePlumbing,
  'elevator_issues': issueHvac,
  'building_systems': issueHvac,
  'parking_issues': issueFoundation,
  'security_system': issueElectrical,
  'roof_shared': issueRoof,
  'historic_requirements': issueFoundation,
  'brick_repointing': issueFoundation,
  'narrow_lot_access': issueFoundation,
  'high_hoa_fees': issueFoundation,
  'hvac_high_rise': issueHvac,
  'dual_system_updates': issueHvac,
  'utility_separation': issueElectrical,
  'basement_moisture': issueWaterDamage,
  'historic_windows': issueWaterDamage,
  'hoa_reserve_low': issueFoundation,
  'structural_settling': issueFoundation,
  'plumbing_replacement': issuePlumbing,
  'electrical_upgrade': issueElectrical,
  'roof_historic': issueRoof,
  'hoa_assessment_pending': issueFoundation,
  'industrial_conversion': issueHvac,
};

// Interior images - using glob imports for dynamic loading
// This will be populated once images are generated
const interiorImagesMap: Record<string, Record<string, string>> = {};

// Helper to build interior images map from property name
function getInteriorImagesForProperty(propertyName: string) {
  const dirName = propertyName.toLowerCase().replace(/ /g, '_');
  const images: Record<string, string> = {};

  // For now, return empty object. Images will be added once generated.
  // When images are generated, they should be imported like the exterior images above.

  return images;
}

export const getPropertyImage = (propertyName: string): string => {
  return propertyImages[propertyName] || oakwoodFront;
};

export const getPropertyInteriorImages = (propertyName: string): Array<{ type: string; label: string; url: string }> => {
  return [];
};

export const hasInteriorImages = (propertyName: string): boolean => {
  // For now, assume interior images might exist for all properties
  // The UI will handle displaying only loaded images
  return true;
};

export const getIssueImage = (issueId: string): string | null => {
  return issueImages[issueId] || null;
};
