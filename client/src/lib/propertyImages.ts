import oakwoodFront from '@assets/generated_images/properties/oakwood_cottage/front.png';
import oakwoodSide from '@assets/generated_images/properties/oakwood_cottage/side.png';
import oakwoodBack from '@assets/generated_images/properties/oakwood_cottage/back.png';

import riversideFront from '@assets/generated_images/properties/riverside_ranch/front.png';
import riversideSide from '@assets/generated_images/properties/riverside_ranch/side.png';
import riversideBack from '@assets/generated_images/properties/riverside_ranch/back.png';

import maplewoodFront from '@assets/generated_images/properties/maplewood_colonial/front.png';
import maplewoodSide from '@assets/generated_images/properties/maplewood_colonial/side.png';
import maplewoodBack from '@assets/generated_images/properties/maplewood_colonial/back.png';

import downtownFront from '@assets/generated_images/properties/downtown_loft/front.png';
import downtownSide from '@assets/generated_images/properties/downtown_loft/side.png';
import downtownBack from '@assets/generated_images/properties/downtown_loft/back.png';

import elmwoodFront from '@assets/generated_images/properties/elmwood_bungalow/front.png';
import elmwoodSide from '@assets/generated_images/properties/elmwood_bungalow/side.png';
import elmwoodBack from '@assets/generated_images/properties/elmwood_bungalow/back.png';

import hillsideFront from '@assets/generated_images/properties/hillside_retreat/front.png';
import hillsideSide from '@assets/generated_images/properties/hillside_retreat/side.png';
import hillsideBack from '@assets/generated_images/properties/hillside_retreat/back.png';

import westsideFront from '@assets/generated_images/properties/westside_manor/front.png';
import westsideSide from '@assets/generated_images/properties/westside_manor/side.png';
import westsideBack from '@assets/generated_images/properties/westside_manor/back.png';

import issueMold from '@assets/generated_images/properties/issues/mold.png';
import issueFoundation from '@assets/generated_images/properties/issues/foundation_crack.png';
import issueRoof from '@assets/generated_images/properties/issues/roof_damage.png';
import issuePlumbing from '@assets/generated_images/properties/issues/plumbing.png';
import issueTermite from '@assets/generated_images/properties/issues/termite.png';
import issueHvac from '@assets/generated_images/properties/issues/hvac.png';
import issueWaterDamage from '@assets/generated_images/properties/issues/water_damage.png';
import issueElectrical from '@assets/generated_images/properties/issues/electrical.png';

export interface PropertyImageSet {
  main: string;
  gallery: {
    front: string;
    side: string;
    back: string;
  };
}

const propertyImageSets: Record<string, PropertyImageSet> = {
  'Oakwood Cottage': {
    main: oakwoodFront,
    gallery: {
      front: oakwoodFront,
      side: oakwoodSide,
      back: oakwoodBack,
    },
  },
  'Riverside Ranch': {
    main: riversideFront,
    gallery: {
      front: riversideFront,
      side: riversideSide,
      back: riversideBack,
    },
  },
  'Maplewood Colonial': {
    main: maplewoodFront,
    gallery: {
      front: maplewoodFront,
      side: maplewoodSide,
      back: maplewoodBack,
    },
  },
  'Downtown Loft': {
    main: downtownFront,
    gallery: {
      front: downtownFront,
      side: downtownSide,
      back: downtownBack,
    },
  },
  'Elmwood Bungalow': {
    main: elmwoodFront,
    gallery: {
      front: elmwoodFront,
      side: elmwoodSide,
      back: elmwoodBack,
    },
  },
  'Hillside Retreat': {
    main: hillsideFront,
    gallery: {
      front: hillsideFront,
      side: hillsideSide,
      back: hillsideBack,
    },
  },
  'Westside Manor': {
    main: westsideFront,
    gallery: {
      front: westsideFront,
      side: westsideSide,
      back: westsideBack,
    },
  },
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
};

export const getPropertyImage = (propertyName: string): string => {
  return propertyImageSets[propertyName]?.main || oakwoodFront;
};

export const getPropertyImageSet = (propertyName: string): PropertyImageSet => {
  return propertyImageSets[propertyName] || propertyImageSets['Oakwood Cottage'];
};

export const getIssueImage = (issueId: string): string | null => {
  return issueImages[issueId] || null;
};
