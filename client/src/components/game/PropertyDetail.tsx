import { useState } from 'react';
import { X, Check, Home, Wrench, Clock, DollarSign, Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import type { Property } from '@shared/schema';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onOpenProForma: (strategy: 'rent' | 'flip', financing: 'bank' | 'hard-money', contractor: 'cheap' | 'fast') => void;
  onPass: () => void;
}

export function PropertyDetail({ property, onClose, onOpenProForma, onPass }: PropertyDetailProps) {
  const [strategy, setStrategy] = useState<'rent' | 'flip'>('rent');
  const [financing, setFinancing] = useState<'bank' | 'hard-money'>('bank');
  const [contractor, setContractor] = useState<'cheap' | 'fast'>('cheap');
  const [walkthroughDone, setWalkthroughDone] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const propertyImage = getPropertyImage(property.name);

  const getConditionDescription = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'Move-in Ready';
      case 'Good': return 'Minor Updates Needed';
      case 'Fair': return 'Needs Updates';
      case 'Fixer-Upper': return 'Needs Repairs';
      default: return condition;
    }
  };

  const getNeighborhoodTraits = (neighborhood: string) => {
    const traits: Record<string, string> = {
      'Oakwood': 'Suburban, Good Schools',
      'Riverside': 'Waterfront, Growing Area',
      'Maplewood': 'Suburban, Good Schools',
      'Downtown': 'Urban, High Demand',
      'Elmwood': 'Established, Mixed Use',
      'Hillside': 'Scenic, Quiet',
      'Westside': 'Upscale, Premium',
    };
    return traits[neighborhood] || 'Residential';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm" data-testid="property-detail-modal">
      <div className="w-full max-w-5xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl" style={{
        background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
      }}>
        {/* Header with close */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-b from-black/50 to-transparent">
          <h2 className="font-display text-white text-xl md:text-2xl font-bold tracking-wide">
            {property.name}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:rotate-90 duration-300"
            data-testid="button-close-detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-6">
            {/* Left Column - Property Info (3 cols) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Main Image */}
              <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg">
                <img 
                  src={propertyImage} 
                  alt={property.name}
                  className="w-full h-full object-cover"
                  data-testid="property-main-image"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                    {formatCurrency(property.price)}
                  </span>
                </div>
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <button 
                    key={i}
                    onClick={() => setSelectedImageIndex(i)}
                    className={`relative h-16 md:h-20 rounded-lg overflow-hidden transition-all ${
                      selectedImageIndex === i ? 'ring-2 ring-emerald-400 scale-[1.02]' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={propertyImage} 
                      alt={`View ${i + 1}`} 
                      className={`w-full h-full object-cover ${i === 1 ? 'grayscale-[30%]' : ''} ${i === 2 ? 'sepia-[20%]' : ''}`}
                    />
                  </button>
                ))}
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className="text-emerald-400 text-lg md:text-xl font-bold">{property.sizeSqft.toLocaleString()}</div>
                  <div className="text-gray-400 text-xs">Square Feet</div>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className="text-amber-400 text-lg md:text-xl font-bold">{formatCurrency(property.rentMin)}-{formatCurrency(property.rentMax)}</div>
                  <div className="text-gray-400 text-xs">Rent Potential</div>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className="text-blue-400 text-sm md:text-base font-bold">{getNeighborhoodTraits(property.neighborhood)}</div>
                  <div className="text-gray-400 text-xs">Neighborhood</div>
                </div>
                <div className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10">
                  <div className={`text-sm md:text-base font-bold ${
                    property.conditionTag === 'Excellent' ? 'text-emerald-400' :
                    property.conditionTag === 'Good' ? 'text-blue-400' :
                    property.conditionTag === 'Fair' ? 'text-amber-400' : 'text-red-400'
                  }`}>{getConditionDescription(property.conditionTag)}</div>
                  <div className="text-gray-400 text-xs">Condition</div>
                </div>
              </div>

              {/* Walkthrough Options */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setWalkthroughDone(true)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border ${
                    walkthroughDone 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                  data-testid="button-contractor-walkthrough"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Wrench className="w-4 h-4" />
                    <span>Contractor Walkthrough</span>
                  </div>
                  <div className="text-xs opacity-70 mt-1">$1,200 + 1 Week</div>
                </button>
                <button 
                  onClick={() => setWalkthroughDone(false)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border ${
                    !walkthroughDone 
                      ? 'bg-gray-500/20 border-gray-500/50 text-gray-300'
                      : 'bg-gray-500/10 border-gray-500/30 text-gray-400 hover:bg-gray-500/20'
                  }`}
                  data-testid="button-skip-walkthrough"
                >
                  Skip Walkthrough
                </button>
              </div>
            </div>

            {/* Right Column - Strategy, Financing, Contractor (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Choose Strategy */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">
                  Choose Your Strategy
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setStrategy('rent')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      strategy === 'rent' 
                        ? 'bg-emerald-500/20 border-2 border-emerald-500' 
                        : 'bg-white/5 border-2 border-transparent hover:border-emerald-500/30'
                    }`}
                    data-testid="button-strategy-rent"
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      strategy === 'rent' ? 'bg-emerald-500' : 'bg-white/10'
                    }`}>
                      {strategy === 'rent' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white">Rental</div>
                      <div className="text-xs text-gray-400">Calculate your cash flow</div>
                    </div>
                    <Home className={`w-5 h-5 ${strategy === 'rent' ? 'text-emerald-400' : 'text-gray-500'}`} />
                  </button>

                  <button
                    onClick={() => setStrategy('flip')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      strategy === 'flip' 
                        ? 'bg-emerald-500/20 border-2 border-emerald-500' 
                        : 'bg-white/5 border-2 border-transparent hover:border-emerald-500/30'
                    }`}
                    data-testid="button-strategy-flip"
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      strategy === 'flip' ? 'bg-emerald-500' : 'bg-white/10'
                    }`}>
                      {strategy === 'flip' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white">Flip</div>
                      <div className="text-xs text-gray-400">Calculate your profit</div>
                    </div>
                    <DollarSign className={`w-5 h-5 ${strategy === 'flip' ? 'text-emerald-400' : 'text-gray-500'}`} />
                  </button>
                </div>
              </div>

              {/* Financing Options */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">
                  Financing Options
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setFinancing('hard-money')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      financing === 'hard-money' 
                        ? 'bg-amber-500/20 border-2 border-amber-500' 
                        : 'bg-white/5 border-2 border-transparent hover:border-amber-500/30'
                    }`}
                    data-testid="button-financing-hard-money"
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      financing === 'hard-money' ? 'bg-amber-500' : 'bg-white/10'
                    }`}>
                      {financing === 'hard-money' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white">Hard Money Loan</div>
                      <div className="text-xs text-gray-400">10% Down, 12% Interest</div>
                    </div>
                    <Zap className={`w-5 h-5 ${financing === 'hard-money' ? 'text-amber-400' : 'text-gray-500'}`} />
                  </button>

                  <button
                    onClick={() => setFinancing('bank')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      financing === 'bank' 
                        ? 'bg-emerald-500/20 border-2 border-emerald-500' 
                        : 'bg-white/5 border-2 border-transparent hover:border-emerald-500/30'
                    }`}
                    data-testid="button-financing-bank"
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      financing === 'bank' ? 'bg-emerald-500' : 'bg-white/10'
                    }`}>
                      {financing === 'bank' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white">Bank Loan</div>
                      <div className="text-xs text-gray-400">25% Down, 5% Interest</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Contractor Choice */}
              <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
                <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">
                  Contractor Choice
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setContractor('cheap')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      contractor === 'cheap' 
                        ? 'bg-amber-500/20 border-2 border-amber-500' 
                        : 'bg-white/5 border-2 border-transparent hover:border-amber-500/30'
                    }`}
                    data-testid="button-contractor-cheap"
                  >
                    <Clock className={`w-6 h-6 ${contractor === 'cheap' ? 'text-amber-400' : 'text-gray-500'}`} />
                    <div className="text-center">
                      <div className="font-semibold text-white text-sm">Cheap & Slow</div>
                      <div className="text-xs text-amber-400">Save $$, More Time</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setContractor('fast')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      contractor === 'fast' 
                        ? 'bg-blue-500/20 border-2 border-blue-500' 
                        : 'bg-white/5 border-2 border-transparent hover:border-blue-500/30'
                    }`}
                    data-testid="button-contractor-fast"
                  >
                    <Zap className={`w-6 h-6 ${contractor === 'fast' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className="text-center">
                      <div className="font-semibold text-white text-sm">Fast & Expensive</div>
                      <div className="text-xs text-blue-400">Quick Turnaround</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button 
                  onClick={() => onOpenProForma(strategy, financing, contractor)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50"
                  data-testid="button-make-offer"
                >
                  Make Offer
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={onPass}
                    className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm transition-all"
                    data-testid="button-pass"
                  >
                    Pass on Property
                  </button>
                  <button 
                    onClick={() => onOpenProForma(strategy, financing, contractor)}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm transition-all"
                    data-testid="button-pro-forma"
                  >
                    View Pro Forma
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}