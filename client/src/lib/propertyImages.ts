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

import interiorKitchenExtreme from '@assets/generated_images/fixer-upper_kitchen_needs_work.png';
import interiorBathroomExtreme from '@assets/generated_images/bathroom_needs_renovation.png';
import interiorLivingRoomExtreme from '@assets/generated_images/living_room_needs_updates.png';
import interiorBasementExtreme from '@assets/generated_images/basement_with_potential_issues.png';

import interiorKitchenDated from '@assets/generated_images/dated_kitchen_needs_updating.png';
import interiorBathroomDated from '@assets/generated_images/dated_bathroom_cosmetic_updates.png';
import interiorLivingRoomDated from '@assets/generated_images/dated_living_room_light_updates.png';
import interiorBasementClean from '@assets/generated_images/clean_unfinished_basement_potential.png';

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

// Property condition categories for appropriate interior images
const FIXER_UPPER_EXTREME = [
  'Elmwood Bungalow',      // Fixer-Upper - major work needed
  'Kensington Row',        // Fixer-Upper - extensive rehab
  'Old City Brownstone',   // Fixer-Upper - historic restoration
];

const FIXER_UPPER_DATED = [
  'Maplewood Colonial',    // Fixer-Upper - but a nice colonial, just dated
  'Hillside Retreat',      // Fair - needs updates
  'Riverside Ranch',       // Fair - cosmetic work
  'South Street Twin',     // Fair - needs updating
  'Port Richmond Duplex',  // Fair - dated interiors
  'Queen Village Townhouse', // Fair - needs cosmetic updates
  'Fairmount Duplex',      // Fair - dated but functional
  'Oakwood Cottage',       // Good - minor updates
  'Westside Manor',        // Good - light updates
];

export const getPropertyInteriorImages = (propertyName: string): Array<{ type: string; label: string; url: string }> => {
  // Extreme fixer-uppers - show major issues
  if (FIXER_UPPER_EXTREME.includes(propertyName)) {
    return [
      { type: 'kitchen', label: 'Kitchen', url: interiorKitchenExtreme },
      { type: 'bathroom', label: 'Bathroom', url: interiorBathroomExtreme },
      { type: 'living', label: 'Living Room', url: interiorLivingRoomExtreme },
      { type: 'basement', label: 'Basement', url: interiorBasementExtreme },
    ];
  }
  
  // Dated properties - show outdated but not destroyed interiors
  if (FIXER_UPPER_DATED.includes(propertyName)) {
    return [
      { type: 'kitchen', label: 'Kitchen', url: interiorKitchenDated },
      { type: 'bathroom', label: 'Bathroom', url: interiorBathroomDated },
      { type: 'living', label: 'Living Room', url: interiorLivingRoomDated },
      { type: 'basement', label: 'Basement', url: interiorBasementClean },
    ];
  }
  
  // For newer/better condition properties (Excellent/Good condos, etc.), no interior photos
  return [];
};

export const hasInteriorImages = (propertyName: string): boolean => {
  return FIXER_UPPER_EXTREME.includes(propertyName) || FIXER_UPPER_DATED.includes(propertyName);
};

export const getIssueImage = (issueId: string): string | null => {
  return issueImages[issueId] || null;
};
