import { useState } from 'react';
import { X, Check, Home, DollarSign, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import type { Property } from '@shared/schema';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onOpenProForma: (strategy: 'rent' | 'flip', financing: 'bank' | 'hard-money') => void;
  onPass: () => void;
}

export function PropertyDetail({ property, onClose, onOpenProForma, onPass }: PropertyDetailProps) {
  const [strategy, setStrategy] = useState<'rent' | 'flip'>('rent');
  const [financing, setFinancing] = useState<'bank' | 'hard-money'>('bank');
  const [showWalkthrough, setShowWalkthrough] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70" data-testid="property-detail-modal">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-wood-dark rounded-lg shadow-2xl">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
          data-testid="button-close-detail"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Left Column - Property Info */}
            <div className="lg:col-span-2">
              <div className="bg-paper paper-texture rounded-lg card-frame p-4 md:p-6">
                {/* Property Title */}
                <h2 className="font-display text-stone-800 text-xl md:text-2xl font-bold mb-4">
                  {property.name}
                </h2>

                {/* Property Info & Images */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 space-y-2 text-stone-700">
                    <p><span className="font-semibold">Price:</span> {formatCurrency(property.price)}</p>
                    <p><span className="font-semibold">Size:</span> {property.sizeSqft.toLocaleString()} sq ft</p>
                    <p><span className="font-semibold">Neighborhood:</span> {getNeighborhoodTraits(property.neighborhood)}</p>
                    <p><span className="font-semibold">Rent Potential:</span> {formatCurrency(property.rentMin)} - {formatCurrency(property.rentMax)}/mo</p>
                    <p><span className="font-semibold">Condition:</span> {getConditionDescription(property.conditionTag)}</p>
                  </div>
                  
                  {/* Property Image */}
                  <div className="w-full md:w-48 h-32 md:h-36 rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={propertyImage} 
                      alt={property.name}
                      className="w-full h-full object-cover"
                      data-testid="property-main-image"
                    />
                  </div>
                </div>

                {/* Additional Property Images */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="h-20 rounded overflow-hidden bg-stone-300">
                    <img src={propertyImage} alt="Interior 1" className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="h-20 rounded overflow-hidden bg-stone-300">
                    <img src={propertyImage} alt="Interior 2" className="w-full h-full object-cover opacity-70 grayscale-[30%]" />
                  </div>
                  <div className="h-20 rounded overflow-hidden bg-stone-300">
                    <img src={propertyImage} alt="Interior 3" className="w-full h-full object-cover opacity-75 sepia-[20%]" />
                  </div>
                </div>

                {/* Walkthrough Options */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={() => setShowWalkthrough(true)}
                    className="flex-1 px-4 py-3 bg-[#4a7c59] hover:bg-[#3d6a4a] text-white rounded font-semibold text-sm transition-colors shadow-md"
                    data-testid="button-contractor-walkthrough"
                  >
                    <div className="font-bold">Contractor Walkthrough</div>
                    <div className="text-xs opacity-80">Cost: $1,200, 1 Week</div>
                  </button>
                  <button 
                    className="flex-1 px-4 py-3 bg-stone-500 hover:bg-stone-600 text-white rounded font-semibold text-sm transition-colors shadow-md"
                    data-testid="button-skip-walkthrough"
                  >
                    Skip Walkthrough
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Strategy & Financing */}
            <div className="space-y-4">
              {/* Choose Strategy */}
              <div className="bg-card rounded-lg card-frame p-4">
                <h3 className="font-display text-foreground text-lg font-semibold mb-4">
                  Choose Your Strategy
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setStrategy('rent')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      strategy === 'rent' 
                        ? 'border-success bg-success/10' 
                        : 'border-border bg-muted hover:border-success/50'
                    }`}
                    data-testid="button-strategy-rent"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      strategy === 'rent' ? 'bg-success' : 'bg-muted-foreground/30'
                    }`}>
                      {strategy === 'rent' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Rental</div>
                      <div className="text-xs text-muted-foreground">Calculate your cash flow</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setStrategy('flip')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      strategy === 'flip' 
                        ? 'border-success bg-success/10' 
                        : 'border-border bg-muted hover:border-success/50'
                    }`}
                    data-testid="button-strategy-flip"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      strategy === 'flip' ? 'bg-success' : 'bg-muted-foreground/30'
                    }`}>
                      {strategy === 'flip' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Flip</div>
                      <div className="text-xs text-muted-foreground">Calculate your profit</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Financing Options */}
              <div className="bg-card rounded-lg card-frame p-4">
                <h3 className="font-display text-foreground text-lg font-semibold mb-4">
                  Financing Options
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setFinancing('hard-money')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      financing === 'hard-money' 
                        ? 'border-danger bg-danger/10' 
                        : 'border-border bg-muted hover:border-danger/50'
                    }`}
                    data-testid="button-financing-hard-money"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      financing === 'hard-money' ? 'bg-danger' : 'bg-muted-foreground/30'
                    }`}>
                      {financing === 'hard-money' ? <X className="w-4 h-4 text-white" /> : null}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Hard Money Loan</div>
                      <div className="text-xs text-muted-foreground">10% Down, 12% Interest</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setFinancing('bank')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      financing === 'bank' 
                        ? 'border-success bg-success/10' 
                        : 'border-border bg-muted hover:border-success/50'
                    }`}
                    data-testid="button-financing-bank"
                  >
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${
                      financing === 'bank' ? 'bg-success' : 'bg-muted-foreground/30'
                    }`}>
                      {financing === 'bank' && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-foreground">Bank Loan</div>
                      <div className="text-xs text-muted-foreground">25% Down, 5% Interest</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Info Cards */}
            <div className="flex gap-3 flex-wrap flex-1">
              <div className="bg-paper/80 rounded px-3 py-2 border border-stone-400">
                <div className="text-xs text-stone-600 font-semibold">Contractor Choice</div>
                <div className="text-sm text-stone-800">
                  <span className="text-amber-600">Cheap & Slow</span> / <span className="text-blue-600">Fast & Expensive</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={() => onOpenProForma(strategy, financing)}
                className="px-6 py-3 bg-success hover:bg-success/90 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                data-testid="button-make-offer"
              >
                Make Offer
              </button>
              <button 
                onClick={onPass}
                className="px-6 py-3 bg-danger hover:bg-danger/90 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                data-testid="button-pass"
              >
                Pass on Property
              </button>
              <button 
                onClick={() => onOpenProForma(strategy, financing)}
                className="px-4 py-3 bg-stone-600 hover:bg-stone-700 text-white rounded-lg font-bold text-sm transition-colors shadow-lg"
                data-testid="button-pro-forma"
              >
                Pro Forma
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}