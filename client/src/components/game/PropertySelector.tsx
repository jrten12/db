import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import { getPropertyUncertainty, uncertaintyBadgeLabel } from '@/lib/propertyUncertainty';
import { MapPin, Eye, Lock, Building2, TreePine, Wrench, Home, DollarSign, Landmark, Castle, Building, Warehouse, HardHat } from 'lucide-react';
import type { Property } from '@shared/schema';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { METROS, normalizeMetroId } from '@shared/metros';
// Property type icon mapping
const PROPERTY_TYPE_CONFIG: Record<string, { icon: typeof Home; className: string; label: string }> = {
  house: { icon: Home, className: 'property-type-house', label: 'House' },
  condo: { icon: Building, className: 'property-type-condo', label: 'Condo' },
  duplex: { icon: Building2, className: 'property-type-duplex', label: 'Duplex' },
  townhouse: { icon: Castle, className: 'property-type-townhouse', label: 'Townhouse' },
  apartment: { icon: Warehouse, className: 'property-type-apartment', label: 'Apartment' },
};

function getPropertyType(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('duplex')) return 'duplex';
  if (lowerName.includes('condo')) return 'condo';
  if (lowerName.includes('townhouse') || lowerName.includes('town home')) return 'townhouse';
  if (lowerName.includes('apartment') || lowerName.includes('unit')) return 'apartment';
  return 'house';
}

export type LocationFilter = 'all' | 'urban' | 'suburban';

export interface PropertyDealInfo {
  dealId: number;
  propertyId: number;
  strategy: 'rent' | 'flip';
  status: string;
  purchasePrice?: number;
  weeksOwned?: number;
  canRefinance?: boolean;
  contractorWalkthroughCompleted?: boolean;
  rentalRehabActive?: boolean;
  rentalRehabWeeksRemaining?: number;
  weeksUntilCompletion?: number;
  hasRemainingRepairs?: boolean;
  completedRepairIds?: string[];
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
  onRefinanceProperty?: (dealId: number) => void;
  onContractorWalkthrough?: (dealId: number) => void;
  metroId?: string | null;
}


export function PropertySelector({ properties, selectedId, onSelect, locationFilter, onLocationFilterChange, propertiesWithInvestigations = new Set(), propertyDeals = [], onSellProperty, onRefinanceProperty, onContractorWalkthrough, metroId }: PropertySelectorProps) {
  const urbanCount = properties.filter(p => p.locationType === 'urban').length;
  const suburbanCount = properties.filter(p => p.locationType === 'suburban').length;
  const metro = METROS[normalizeMetroId(metroId)];
  
  const filteredProperties = properties
    .filter(p => {
      if (locationFilter === 'all') return true;
      return p.locationType === locationFilter;
    })
    .sort((a, b) => a.price - b.price);

  return (
    <div className="space-y-6" data-testid="property-list">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-xl md:text-2xl font-semibold text-[hsl(var(--workstation-paper))] tracking-tight">
            Which deal will you bet your assumptions on?
          </h2>
          <p className="text-sm text-[hsl(var(--workstation-muted))] mt-1 max-w-xl">
            Most listings look plausible before diligence. Click to investigate — numbers stay hidden until you earn them.
          </p>
          <p className="text-xs text-[hsl(var(--workstation-muted)/0.7)] mt-2 flex items-center gap-1.5" data-testid="metro-label">
            <MapPin className="w-3 h-3" />
            {metro.name} · {metro.region}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/6">
          <Eye className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs text-white/40">{filteredProperties.length} to investigate</span>
        </div>
      </div>

      {/* Location Filter Tabs - iOS style with proper touch targets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <button
          onClick={() => onLocationFilterChange('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors duration-150 flex-shrink-0 ${
            locationFilter === 'all'
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
          data-testid="button-filter-all"
        >
          All
          <span className="text-xs text-white/30">{properties.length}</span>
        </button>
        <button
          onClick={() => onLocationFilterChange('urban')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors duration-150 flex-shrink-0 ${
            locationFilter === 'urban'
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
          data-testid="button-filter-urban"
        >
          <Building2 className="w-3.5 h-3.5" />
          Urban
          <span className="text-xs text-white/30">{urbanCount}</span>
        </button>
        <button
          onClick={() => onLocationFilterChange('suburban')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors duration-150 flex-shrink-0 ${
            locationFilter === 'suburban'
              ? 'bg-white/10 text-white'
              : 'text-white/40 hover:text-white/60 hover:bg-white/5'
          }`}
          data-testid="button-filter-suburban"
        >
          <TreePine className="w-3.5 h-3.5" />
          Suburban
          <span className="text-xs text-white/30">{suburbanCount}</span>
        </button>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {filteredProperties.map((property, index) => {
          const propertyImage = getPropertyImage(property.name);
          const isSelected = selectedId === property.id;
          const hasInvestigations = propertiesWithInvestigations.has(property.id);
          const dealInfo = propertyDeals.find(d => d.propertyId === property.id);
          const isUnavailable = !!dealInfo && dealInfo.status !== 'planned';
          
          const getStatusBadge = () => {
            if (!dealInfo || dealInfo.status === 'planned') return null;
            
            // Check if rental is under renovation
            if (dealInfo.strategy === 'rent' && dealInfo.status === 'active_rental' && dealInfo.rentalRehabActive) {
              // Rental property under renovation - tenant displaced
              const weeksLeft = dealInfo.rentalRehabWeeksRemaining || 0;
              return { 
                label: `RENOVATING • ${weeksLeft}mo`, 
                color: 'bg-orange-600 border-orange-400', 
                icon: HardHat,
                isRehab: true
              };
            } else if (dealInfo.strategy === 'rent' && dealInfo.status === 'active_rental') {
              // Player owns this property and is collecting rent
              return { label: 'YOUR RENTAL', color: 'bg-blue-600 border-blue-400', icon: Home };
            } else if (dealInfo.strategy === 'flip' && dealInfo.status === 'in_rehab') {
              // Player owns this, renovation in progress
              const weeksLeft = dealInfo.weeksUntilCompletion || 0;
              return { 
                label: weeksLeft > 0 ? `RENOVATING • ${weeksLeft}mo` : 'RENOVATING', 
                color: 'bg-orange-600 border-orange-400', 
                icon: HardHat,
                isRehab: true 
              };
            } else if (dealInfo.strategy === 'flip' && dealInfo.status === 'ready_to_list') {
              // Flip renovation complete, ready to list for sale
              return { label: 'YOUR FLIP • READY', color: 'bg-emerald-600 border-emerald-400', icon: Home };
            } else if (dealInfo.status === 'sold_rental') {
              // Player sold their rental - off market permanently
              return { label: 'YOU SOLD THIS', color: 'bg-gray-600 border-gray-400', icon: Lock };
            } else if (dealInfo.status === 'completed') {
              // Flip sale completed - off market permanently
              return { label: 'FLIP SOLD', color: 'bg-gray-600 border-gray-400', icon: Lock };
            }
            return { label: 'OFF MARKET', color: 'bg-gray-600 border-gray-400', icon: Lock };
          };
          
          const isInRehab = dealInfo?.status === 'in_rehab' || (dealInfo?.rentalRehabActive && dealInfo?.status === 'active_rental');
          
          const statusBadge = getStatusBadge();
          
          const canSell = onSellProperty && dealInfo && 
            (dealInfo.status === 'active_rental' || dealInfo.status === 'ready_to_list');
          
          const isOwned = dealInfo && (dealInfo.status === 'active_rental' || dealInfo.status === 'in_rehab' || dealInfo.status === 'ready_to_list');
          const isSold = dealInfo && (dealInfo.status === 'sold_rental' || dealInfo.status === 'completed');
          
          const propertyType = getPropertyType(property.name);
          const typeConfig = PROPERTY_TYPE_CONFIG[propertyType] || PROPERTY_TYPE_CONFIG.house;
          const TypeIcon = typeConfig.icon;
          const uncertainty = getPropertyUncertainty(property);

          return (
            <div
              key={property.id}
              onClick={() => !isUnavailable && !canSell && onSelect(property.id)}
              role={isUnavailable ? undefined : "button"}
              tabIndex={isUnavailable ? undefined : 0}
              className={`group relative rounded-xl overflow-hidden text-left transition-all duration-200 ${
                isSold
                  ? 'opacity-50 cursor-default'
                  : isOwned
                    ? 'cursor-default'
                    : isSelected
                      ? 'ring-1 ring-white/20 cursor-pointer'
                      : 'hover:bg-white/[0.03] cursor-pointer'
              }`}
              data-testid={`property-card-${property.id}`}
            >
              <div className={`absolute inset-0 rounded-xl ${
                isOwned && dealInfo?.status === 'active_rental' && !dealInfo?.rentalRehabActive
                  ? 'bg-blue-500/[0.04] border border-blue-400/20'
                  : isOwned && dealInfo?.status === 'ready_to_list'
                    ? 'bg-emerald-500/[0.04] border border-emerald-400/20'
                  : isOwned && isInRehab
                    ? 'bg-amber-500/[0.04] border border-amber-400/15'
                  : 'bg-white/[0.02] border border-white/6'
              }`} />
              
              {isInRehab && !isOwned && (
                <div className="absolute top-2 right-2 z-20">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-amber-400/80 bg-black/50 px-2 py-0.5 rounded">
                    Renovating
                  </span>
                </div>
              )}
              
              {/* Property Image */}
              <div className="relative h-32 md:h-36 overflow-hidden">
                <img 
                  src={propertyImage} 
                  alt={property.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-[hsl(220,14%,6%)] via-[hsl(220,14%,6%)]/30 to-transparent" />
                
                {hasInvestigations && !isUnavailable && (
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-white/70 bg-black/50 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  </div>
                )}

                {!isUnavailable && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <span className="text-[10px] text-white/50 bg-black/50 px-2 py-0.5 rounded">
                      Investigate
                    </span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between gap-2">
                  <span className="text-base font-semibold text-white font-mono bg-black/60 px-2 py-0.5 rounded" style={{ letterSpacing: '-0.03em' }}>
                    {formatCurrency(property.price)}
                  </span>
                  <span className="text-xs text-white/60 bg-black/60 px-1.5 py-0.5 rounded font-mono" style={{ letterSpacing: '-0.02em' }}>
                    {property.sizeSqft.toLocaleString()} sqft
                  </span>
                </div>
              </div>

              {/* Status Badge - owned properties get a top badge + bottom action bar, sold get full overlay */}
              {statusBadge && isOwned && (
                <>
                  <div className="absolute top-2 left-2 z-20">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-white shadow-lg ${statusBadge.color}`}>
                      <statusBadge.icon className="w-3.5 h-3.5" />
                      {statusBadge.label}
                    </div>
                  </div>
                  {dealInfo && (dealInfo.status === 'active_rental' || dealInfo.status === 'ready_to_list') && (
                    <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-center gap-1.5 px-2 py-2 bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-b-xl">
                      {(dealInfo.status === 'active_rental' || dealInfo.status === 'ready_to_list') && onContractorWalkthrough && !dealInfo.rentalRehabActive && (
                        !dealInfo.contractorWalkthroughCompleted ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onContractorWalkthrough(dealInfo.dealId);
                            }}
                            className="bg-amber-600/90 hover:bg-amber-600 text-white font-medium text-xs border-0 px-2.5 h-7"
                            data-testid={`button-walkthrough-${property.id}`}
                          >
                            <HardHat className="w-3.5 h-3.5 mr-1" />
                            Inspect
                          </Button>
                        ) : dealInfo.hasRemainingRepairs ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onContractorWalkthrough(dealInfo.dealId);
                            }}
                            className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs border-0 px-2.5 h-7"
                            data-testid={`button-renovate-${property.id}`}
                          >
                            <Wrench className="w-3.5 h-3.5 mr-1" />
                            Renovate
                          </Button>
                        ) : null
                      )}
                      {dealInfo.status === 'active_rental' && onRefinanceProperty && dealInfo.canRefinance && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onRefinanceProperty(dealInfo.dealId);
                          }}
                          className="bg-white/15 hover:bg-white/25 text-white font-medium text-xs border-0 px-2.5 h-7"
                          data-testid={`button-refi-${property.id}`}
                        >
                          <Landmark className="w-3.5 h-3.5 mr-1" />
                          Refi
                        </Button>
                      )}
                      {onSellProperty && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onSellProperty(dealInfo.dealId, dealInfo.strategy);
                          }}
                          className="bg-[hsl(152,44%,42%)] hover:bg-[hsl(152,44%,48%)] text-white font-medium text-xs border-0 px-2.5 h-7"
                          data-testid={`button-sell-${property.id}`}
                        >
                          <DollarSign className="w-3.5 h-3.5 mr-1" />
                          Sell
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
              {statusBadge && !isOwned && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10 rounded-xl">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                    <statusBadge.icon className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-medium text-white/80 uppercase tracking-wider">{statusBadge.label}</span>
                  </div>
                </div>
              )}

              <div className="relative p-3">
                <h3 className="font-medium text-sm text-white/90 group-hover:text-white transition-colors duration-150">
                  {property.name}
                </h3>
                
                <div className="flex items-center gap-1.5 mt-1 text-white/30">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{property.neighborhood}</span>
                </div>
                
                <div className="mt-2.5 flex flex-wrap gap-1">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[hsl(var(--workstation-muted))] bg-white/[0.04] border border-[hsl(var(--workstation-rule))]">
                    <TypeIcon className="w-2.5 h-2.5" />
                    {typeConfig.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-[hsl(var(--workstation-muted))] bg-white/[0.04] border border-[hsl(var(--workstation-rule))]">
                    {property.locationType === 'urban' ? <Building2 className="w-2.5 h-2.5" /> : <TreePine className="w-2.5 h-2.5" />}
                    {property.locationType === 'urban' ? 'Urban' : 'Suburban'}
                  </span>
                  {(['rentVariability', 'conditionClarity', 'timelineRisk'] as const).map((key) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-[hsl(var(--workstation-muted)/0.85)] bg-white/[0.02] border border-[hsl(var(--workstation-rule)/0.8)]"
                    >
                      {uncertaintyBadgeLabel(key, uncertainty[key])}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center py-4 border-t border-[hsl(var(--workstation-rule))] mt-2">
        <p className="text-[hsl(var(--workstation-muted))] text-xs">
          Before you build a pro forma, all deals look plausible.
        </p>
      </div>
    </div>
  );
}