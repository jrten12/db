import suburbanCottage from '@assets/generated_images/suburban_cottage_home_exterior.png';
import rusticRanch from '@assets/generated_images/rustic_ranch_home_exterior.png';
import colonialHome from '@assets/generated_images/colonial_home_front_view.png';
import downtownLoftNew from '@assets/generated_images/downtown_loft_building_exterior.png';
import craftsmanBungalow from '@assets/generated_images/craftsman_bungalow_home_exterior.png';
import hillsideRetreatNew from '@assets/generated_images/hillside_retreat_home_exterior.png';
import tudorManor from '@assets/generated_images/tudor_manor_home_exterior.png';

export interface PropertyImageSet {
  main: string;
  gallery: string[];
}

const propertyImageSets: Record<string, PropertyImageSet> = {
  'Oakwood Cottage': {
    main: suburbanCottage,
    gallery: [suburbanCottage, craftsmanBungalow, rusticRanch],
  },
  'Riverside Ranch': {
    main: rusticRanch,
    gallery: [rusticRanch, suburbanCottage, hillsideRetreatNew],
  },
  'Maplewood Colonial': {
    main: colonialHome,
    gallery: [colonialHome, tudorManor, rusticRanch],
  },
  'Downtown Loft': {
    main: downtownLoftNew,
    gallery: [downtownLoftNew, colonialHome, craftsmanBungalow],
  },
  'Elmwood Bungalow': {
    main: craftsmanBungalow,
    gallery: [craftsmanBungalow, suburbanCottage, rusticRanch],
  },
  'Hillside Retreat': {
    main: hillsideRetreatNew,
    gallery: [hillsideRetreatNew, tudorManor, colonialHome],
  },
  'Westside Manor': {
    main: tudorManor,
    gallery: [tudorManor, colonialHome, hillsideRetreatNew],
  },
};

export const getPropertyImage = (propertyName: string): string => {
  return propertyImageSets[propertyName]?.main || suburbanCottage;
};

export const getPropertyImageSet = (propertyName: string): PropertyImageSet => {
  return propertyImageSets[propertyName] || { 
    main: suburbanCottage, 
    gallery: [suburbanCottage, craftsmanBungalow, rusticRanch] 
  };
};
