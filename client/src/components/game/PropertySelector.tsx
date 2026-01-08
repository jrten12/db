import { Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import type { Property } from '@shared/schema';

interface PropertySelectorProps {
  properties: Property[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function PropertySelector({ properties, selectedId, onSelect }: PropertySelectorProps) {
  return (
    <div className="bg-card rounded-lg border-2 border-border p-4 shadow-lg">
      <h2 className="font-display text-foreground text-lg font-semibold mb-3">
        Select Property
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {properties.map((property) => (
          <button
            key={property.id}
            onClick={() => onSelect(property.id)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              selectedId === property.id
                ? 'border-gold bg-gold/10'
                : 'border-border bg-muted hover:border-gold/50'
            }`}
            data-testid={`property-card-${property.id}`}
          >
            <div className="flex items-start gap-2">
              <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                selectedId === property.id ? 'bg-gold/20' : 'bg-background'
              }`}>
                <Building2 className={`w-4 h-4 ${
                  selectedId === property.id ? 'text-gold' : 'text-muted-foreground'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {property.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {property.neighborhood}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-gold">
                    {formatCurrency(property.price)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {property.sizeSqft} sqft
                  </span>
                </div>
                <div className="mt-1">
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
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}