import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import type { Property } from '@shared/schema';

interface PropertySelectorProps {
  properties: Property[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function PropertySelector({ properties, selectedId, onSelect }: PropertySelectorProps) {
  return (
    <div className="bg-card rounded-lg border-2 border-border p-4 shadow-lg">
      <h2 className="font-display text-foreground text-xl font-semibold mb-4 tracking-wide">
        SELECT PROPERTY
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {properties.map((property) => {
          const propertyImage = getPropertyImage(property.name);
          return (
            <button
              key={property.id}
              onClick={() => onSelect(property.id)}
              className={`group relative overflow-hidden rounded-lg border-2 transition-all text-left ${
                selectedId === property.id
                  ? 'border-gold ring-2 ring-gold/50'
                  : 'border-border hover:border-gold/50'
              }`}
              data-testid={`property-card-${property.id}`}
            >
              {/* Property Image */}
              <div className="relative h-28 overflow-hidden">
                <img 
                  src={propertyImage} 
                  alt={property.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Price Overlay */}
                <div className="absolute bottom-2 left-2">
                  <span className="text-gold font-mono font-bold text-lg drop-shadow-lg">
                    {formatCurrency(property.price)}
                  </span>
                </div>
                
                {/* Size Overlay */}
                <div className="absolute bottom-2 right-2">
                  <span className="text-white/80 text-xs drop-shadow-lg">
                    {property.sizeSqft.toLocaleString()} sqft
                  </span>
                </div>
              </div>

              {/* Property Info */}
              <div className="p-3 bg-card">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {property.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {property.neighborhood}
                </p>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    property.conditionTag === 'Excellent' ? 'bg-success/20 text-success' :
                    property.conditionTag === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                    property.conditionTag === 'Fair' ? 'bg-warning/20 text-warning' :
                    'bg-danger/20 text-danger'
                  }`}>
                    {property.conditionTag}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}