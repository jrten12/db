import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import { MapPin, HelpCircle, Eye, AlertTriangle, Lock, Building2, TreePine, Wrench, Home, DollarSign } from 'lucide-react';
import type { Property } from '@shared/schema';

export type LocationFilter = 'all' | 'urban' | 'suburban';

export interface PropertyDealInfo {
  dealId: number;
  propertyId: number;
  strategy: 'rent' | 'flip';
  status: string;
  purchasePrice?: number;
}

interface PropertySelectorProps {
  properties: Property[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  locationFilter: LocationFilter;
  onLocationFilterChange: (filter: LocationFilter) => void;
  propertiesWithInvestigations?: Set<number>;
  propertyDeals?: PropertyDealInfo[];
  onSellProperty?: (dealId: number, strategy: 'rent' | 'flip') => void;
}

const getConditionBadge = (conditionTag: string) => {
  switch (conditionTag) {
    case 'Excellent':
      return { label: 'Move-In Ready', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };
    case 'Good':
      return { label: 'Minor Updates', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' };
    case 'Fair':
      return { label: 'Needs Work', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' };
    case 'Fixer-Upper':
      return { label: 'Major Rehab', color: 'text-red-400 bg-red-500/20 border-red-500/30' };
    default:
      return { label: conditionTag, color: 'text-gray-400 bg-gray-500/20 border-gray-500/30' };
  }
};

export function PropertySelector({ properties, selectedId, onSelect, locationFilter, onLocationFilterChange, propertiesWithInvestigations = new Set(), propertyDeals = [], onSellProperty }: PropertySelectorProps) {
  const urbanCount = properties.filter(p => p.locationType === 'urban').length;
  const suburbanCount = properties.filter(p => p.locationType === 'suburban').length;
  
  const filteredProperties = properties
    .filter(p => {
      if (locationFilter === 'all') return true;
      return p.locationType === locationFilter;
    })
    .sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-6" data-testid="property-list">
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
          <span className="text-sm text-gray-300">{filteredProperties.length} to investigate</span>
        </div>
      </div>

      {/* Location Filter Tabs - iOS style with proper touch targets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-smooth-ios">
        <button
          onClick={() => onLocationFilterChange('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ios-spring touch-target-sm tap-scale flex-shrink-0 ${
            locationFilter === 'all'
              ? 'bg-gold text-slate-900'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 active:bg-white/15 border border-white/10'
          }`}
          data-testid="button-filter-all"
        >
          All
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${locationFilter === 'all' ? 'bg-slate-900/20' : 'bg-white/10'}`}>
            {properties.length}
          </span>
        </button>
        <button
          onClick={() => onLocationFilterChange('urban')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ios-spring touch-target-sm tap-scale flex-shrink-0 ${
            locationFilter === 'urban'
              ? 'bg-blue-500 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 active:bg-white/15 border border-white/10'
          }`}
          data-testid="button-filter-urban"
        >
          <Building2 className="w-4 h-4" />
          Urban
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${locationFilter === 'urban' ? 'bg-white/20' : 'bg-white/10'}`}>
            {urbanCount}
          </span>
        </button>
        <button
          onClick={() => onLocationFilterChange('suburban')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ios-spring touch-target-sm tap-scale flex-shrink-0 ${
            locationFilter === 'suburban'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10 active:bg-white/15 border border-white/10'
          }`}
          data-testid="button-filter-suburban"
        >
          <TreePine className="w-4 h-4" />
          Suburban
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${locationFilter === 'suburban' ? 'bg-white/20' : 'bg-white/10'}`}>
            {suburbanCount}
          </span>
        </button>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {filteredProperties.map((property, index) => {
          const propertyImage = getPropertyImage(property.name);
          const conditionBadge = getConditionBadge(property.conditionTag);
          const isSelected = selectedId === property.id;
          const hasInvestigations = propertiesWithInvestigations.has(property.id);
          const dealInfo = propertyDeals.find(d => d.propertyId === property.id);
          const isUnavailable = !!dealInfo && dealInfo.status !== 'planned';
          
          const getStatusBadge = () => {
            if (!dealInfo || dealInfo.status === 'planned') return null;
            
            if (dealInfo.strategy === 'rent' && dealInfo.status === 'active_rental') {
              // Player owns this property and is collecting rent
              return { label: 'YOUR RENTAL', color: 'bg-blue-600 border-blue-400', icon: Home };
            } else if (dealInfo.strategy === 'flip' && dealInfo.status === 'in_rehab') {
              // Player owns this, renovation in progress
              return { label: 'YOUR FLIP • RENOVATING', color: 'bg-orange-600 border-orange-400', icon: Wrench };
            } else if (dealInfo.strategy === 'flip' && dealInfo.status === 'ready_to_list') {
              // Flip renovation complete, ready to list for sale
              return { label: 'YOUR FLIP • READY', color: 'bg-emerald-600 border-emerald-400', icon: Home };
            } else if (dealInfo.status === 'sold_rental') {
              // Player sold their rental - off market permanently
              return { label: 'YOU SOLD THIS', color: 'bg-gray-600 border-gray-400', icon: Lock };
            } else if (dealInfo.status === 'completed') {
              // Flip sale completed - off market permanently
              return { label: 'FLIP SOLD ✓', color: 'bg-gray-600 border-gray-400', icon: Lock };
            }
            return { label: 'OFF MARKET', color: 'bg-gray-600 border-gray-400', icon: Lock };
          };
          
          const isInRehab = dealInfo?.status === 'in_rehab';
          
          const statusBadge = getStatusBadge();
          
          const canSell = onSellProperty && dealInfo && 
            (dealInfo.status === 'active_rental' || dealInfo.status === 'ready_to_list');
          
          return (
            <div
              key={property.id}
              onClick={() => !isUnavailable && !canSell && onSelect(property.id)}
              role={isUnavailable ? undefined : "button"}
              tabIndex={isUnavailable ? undefined : 0}
              className={`group relative rounded-2xl overflow-hidden text-left transition-transform duration-200 ios-spring ${
                isUnavailable
                  ? 'opacity-85 cursor-default'
                  : canSell
                    ? 'opacity-100'
                    : isSelected
                      ? 'ring-2 ring-gold scale-[1.01] shadow-xl shadow-gold/20 cursor-pointer'
                      : 'hover:scale-[1.015] active:scale-[0.98] hover:shadow-xl hover:shadow-black/40 cursor-pointer'
              }`}
              data-testid={`property-card-${property.id}`}
            >
              {/* Card Background */}
              <div className="absolute inset-0 bg-gradient-to-b from-slate-800/90 to-slate-900/95 backdrop-blur" />
              
              {/* Corner Ribbon for Rehab In Progress */}
              {isInRehab && (
                <div className="absolute top-0 right-0 z-20 overflow-hidden w-24 h-24">
                  <div className="absolute top-3 -right-8 w-32 bg-orange-500 text-white text-[10px] font-bold py-1 text-center transform rotate-45 shadow-lg">
                    RENOVATING
                  </div>
                </div>
              )}
              
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
                
                {/* Size Badge - Clear sqft label */}
                <div className="absolute top-3 right-3">
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
                    <span className="text-sm font-bold text-white">{property.sizeSqft.toLocaleString()}</span>
                    <span className="text-xs text-gray-400">sqft</span>
                  </div>
                </div>

                {/* Status Badge */}
                {statusBadge && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10 gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 ${statusBadge.color} rounded-lg border-2 shadow-lg transform -rotate-12`}>
                      <statusBadge.icon className="w-5 h-5 text-white" />
                      <span className="text-lg font-bold text-white uppercase tracking-wider">{statusBadge.label}</span>
                    </div>
                    {/* Sell Button for owned properties */}
                    {onSellProperty && dealInfo && (
                      (dealInfo.status === 'active_rental' || dealInfo.status === 'ready_to_list')
                    ) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          onSellProperty(dealInfo.dealId, dealInfo.strategy);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-500/40 hover:shadow-emerald-400/60 transition-all duration-200 hover:scale-105 border-2 border-emerald-300"
                        data-testid={`button-sell-${property.id}`}
                      >
                        <DollarSign className="w-6 h-6" />
                        <span>SELL NOW</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Work in Progress Badge */}
                {hasInvestigations && !isUnavailable && (
                  <div className="absolute bottom-3 left-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/90 backdrop-blur-md rounded-lg border border-amber-400/50 animate-pulse">
                      <Wrench className="w-4 h-4 text-white" />
                      <span className="text-xs font-semibold text-white">In Progress</span>
                    </div>
                  </div>
                )}

                {/* Question mark overlay - invites investigation */}
                {!isUnavailable && (
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-lg border border-white/20 cursor-help" title="Click to investigate this property and reveal hidden financial information">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-white">Investigate</span>
                    </div>
                  </div>
                )}
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
                
                {/* Location Badge + Condition Badge + Unknown Financials Warning */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {/* Location Type Badge */}
                  {property.locationType === 'urban' ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border text-blue-400 bg-blue-500/20 border-blue-500/30">
                      <Building2 className="w-3 h-3" />
                      <span>Urban</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border text-emerald-400 bg-emerald-500/20 border-emerald-500/30">
                      <TreePine className="w-3 h-3" />
                      <span>Suburban</span>
                    </div>
                  )}
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border text-gray-400 bg-gray-500/20 border-gray-500/30">
                    <Lock className="w-3 h-3" />
                    <span>Financials Unknown</span>
                  </div>
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
            </div>
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