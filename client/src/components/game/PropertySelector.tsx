import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import { MapPin, Ruler, TrendingUp, Sparkles } from 'lucide-react';
import type { Property } from '@shared/schema';

interface PropertySelectorProps {
  properties: Property[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function PropertySelector({ properties, selectedId, onSelect }: PropertySelectorProps) {
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return { bg: 'from-emerald-500 to-emerald-600', text: 'text-emerald-400', glow: 'shadow-emerald-500/30' };
      case 'Good': return { bg: 'from-blue-500 to-blue-600', text: 'text-blue-400', glow: 'shadow-blue-500/30' };
      case 'Fair': return { bg: 'from-amber-500 to-amber-600', text: 'text-amber-400', glow: 'shadow-amber-500/30' };
      case 'Fixer-Upper': return { bg: 'from-red-500 to-red-600', text: 'text-red-400', glow: 'shadow-red-500/30' };
      default: return { bg: 'from-gray-500 to-gray-600', text: 'text-gray-400', glow: 'shadow-gray-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-wide">
            Property Market
          </h2>
          <p className="text-gray-400 text-sm mt-1">Select a property to analyze</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur rounded-full border border-white/10">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-sm text-gray-300">{properties.length} Available</span>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {properties.map((property, index) => {
          const propertyImage = getPropertyImage(property.name);
          const condition = getConditionColor(property.conditionTag);
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
              style={{
                animationDelay: `${index * 50}ms`,
              }}
              data-testid={`property-card-${property.id}`}
            >
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/90 to-slate-900/95 backdrop-blur" />
              
              {/* Property Image */}
              <div className="relative h-36 md:h-40 overflow-hidden">
                <img 
                  src={propertyImage} 
                  alt={property.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/50 via-transparent to-transparent" />
                
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

                {/* Rent Potential - Bottom Right */}
                <div className="absolute bottom-3 right-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 backdrop-blur-md rounded-lg border border-emerald-500/30">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">
                      {formatCurrency(property.rentMin)}-{formatCurrency(property.rentMax)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Property Info */}
              <div className="relative p-4">
                <h3 className="font-semibold text-lg text-white group-hover:text-gold transition-colors">
                  {property.name}
                </h3>
                
                <div className="flex items-center gap-1.5 mt-1.5 text-gray-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-sm">{property.neighborhood}</span>
                </div>
                
                {/* Condition Tag */}
                <div className="mt-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${condition.bg} text-white shadow-lg ${condition.glow}`}>
                    {property.conditionTag}
                  </span>
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
    </div>
  );
}