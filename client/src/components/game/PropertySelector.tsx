import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import { MapPin, Ruler, HelpCircle, Eye, AlertTriangle } from 'lucide-react';
import type { Property } from '@shared/schema';

interface PropertySelectorProps {
  properties: Property[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const getUncertaintyBadges = (property: Property) => {
  const badges = [];
  
  const rentSpread = property.rentMax - property.rentMin;
  if (rentSpread > 400) {
    badges.push({ label: 'Rent Variability', level: 'High', color: 'text-red-400 bg-red-500/20 border-red-500/30' });
  } else if (rentSpread > 200) {
    badges.push({ label: 'Rent Variability', level: 'Medium', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' });
  } else {
    badges.push({ label: 'Rent Variability', level: 'Low', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' });
  }
  
  if (property.conditionTag === 'Fixer-Upper') {
    badges.push({ label: 'Condition Clarity', level: 'Low', color: 'text-red-400 bg-red-500/20 border-red-500/30' });
  } else if (property.conditionTag === 'Fair') {
    badges.push({ label: 'Condition Clarity', level: 'Partial', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' });
  } else {
    badges.push({ label: 'Condition Clarity', level: 'Clear', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' });
  }

  const timelineRisk = property.timelineMax - property.timelineMin;
  if (timelineRisk > 6 || property.conditionTag === 'Fixer-Upper') {
    badges.push({ label: 'Timeline Risk', level: 'Unknown', color: 'text-gray-400 bg-gray-500/20 border-gray-500/30' });
  }

  return badges;
};

export function PropertySelector({ properties, selectedId, onSelect }: PropertySelectorProps) {
  return (
    <div className="space-y-6">
      {/* Header - Provocative framing */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">
            Property Market
          </h2>
          <p className="text-gray-400 text-sm mt-1 max-w-md">
            Most of these will fail. Which would you bet your assumptions on?
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur rounded-full border border-white/10">
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-300">{properties.length} to investigate</span>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {properties.map((property, index) => {
          const propertyImage = getPropertyImage(property.name);
          const uncertaintyBadges = getUncertaintyBadges(property);
          const isSelected = selectedId === property.id;
          
          return (
            <button
              key={property.id}
              onClick={() => onSelect(property.id)}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-300 text-left ${
                isSelected
                  ? 'ring-2 ring-gold scale-[1.02] shadow-xl shadow-gold/20'
                  : 'hover:scale-[1.02] hover:shadow-xl hover:shadow-black/40'
              }`}
              data-testid={`property-card-${property.id}`}
            >
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/90 to-slate-900/95 backdrop-blur" />
              
              {/* Property Image */}
              <div className="relative h-32 md:h-36 overflow-hidden">
                <img 
                  src={propertyImage} 
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                
                {/* Price Badge */}
                <div className="absolute top-3 left-3">
                  <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                    <span className="text-xl md:text-2xl font-bold text-white font-mono">
                      {formatCurrency(property.price)}
                    </span>
                  </div>
                </div>
                
                {/* Size Badge */}
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                    <Ruler className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-200">{property.sizeSqft.toLocaleString()}</span>
                  </div>
                </div>

                {/* Question mark overlay - invites investigation */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                    <HelpCircle className="w-4 h-4 text-white" />
                    <span className="text-xs text-white">Investigate</span>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="relative p-4">
                <h3 className="font-semibold text-lg text-white group-hover:text-gold transition-colors">
                  {property.name}
                </h3>
                
                <div className="flex items-center gap-1.5 mt-1 text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-sm">{property.neighborhood}</span>
                </div>
                
                {/* Uncertainty Badges - The teaching element */}
                <div className="mt-3 space-y-1.5">
                  {uncertaintyBadges.slice(0, 2).map((badge, i) => (
                    <div 
                      key={i}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border mr-1.5 ${badge.color}`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      <span>{badge.label}: {badge.level}</span>
                    </div>
                  ))}
                </div>

                {/* Hover Indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-amber-400 to-gold transition-opacity duration-300 ${
                  isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`} />
              </div>

              {/* Selection Glow Effect */}
              {isSelected && (
                <div className="absolute inset-0 pointer-events-none border-2 border-gold rounded-2xl" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom teaching note */}
      <div className="text-center py-4">
        <p className="text-gray-500 text-sm italic">
          Before you build a pro forma, all deals look plausible.
        </p>
      </div>
    </div>
  );
}