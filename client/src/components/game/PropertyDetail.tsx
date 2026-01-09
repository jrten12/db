import { useState } from 'react';
import { X, Check, Home, Wrench, Clock, DollarSign, Zap, Lock, AlertTriangle, Shield, Search, FileText, HardHat, HelpCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import { getPropertyImageSet, getIssueImage } from '@/lib/propertyImages';
import { DILIGENCE_OPTIONS, getPropertyIssues, getRevealedIssues, getTotalIssuesCostRange, getTotalTimelineImpact, getEffectiveRanges, type DiligenceOption, type PropertyIssue } from '@/lib/propertyIssues';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Property } from '@shared/schema';

const UNKNOWN_VALUE_TOOLTIPS: Record<string, { title: string; explanation: string; action: string }> = {
  rent: {
    title: "Rent Unknown",
    explanation: "You don't know what tenants will pay. Without research, any rent number is just a guess - and guessing wrong can ruin your deal.",
    action: "Complete a Market Rent Study to unlock rent estimates based on what similar properties are renting for.",
  },
  arv: {
    title: "After Repair Value Unknown", 
    explanation: "ARV = what the property will be worth after you fix it up. This is critical for flips - you need to know your exit price!",
    action: "Complete a Comp Analysis to see recent sales of similar renovated homes in the area.",
  },
  rehab: {
    title: "Rehab Cost Unknown",
    explanation: "Renovation costs can vary wildly. Without a professional estimate, you could be off by $10,000-$50,000 or more.",
    action: "Complete a Contractor Walkthrough to get accurate repair estimates from a licensed professional.",
  },
  timeline: {
    title: "Timeline Unknown",
    explanation: "Every week you hold a property costs money (loan interest, taxes, insurance). Underestimating timeline destroys profits.",
    action: "Complete a Contractor Walkthrough to get a realistic renovation timeline.",
  },
};

function UnknownValueBadge({ type, isKnown, children }: { type: keyof typeof UNKNOWN_VALUE_TOOLTIPS; isKnown: boolean; children: React.ReactNode }) {
  const tooltip = UNKNOWN_VALUE_TOOLTIPS[type];
  
  if (isKnown) {
    return <>{children}</>;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="cursor-help touch-manipulation">{children}</button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-sm bg-slate-800 border-amber-500/50 text-gray-200 text-sm p-4">
        <div className="space-y-2">
          <p className="font-semibold text-amber-400">{tooltip.title}</p>
          <p className="text-gray-300">{tooltip.explanation}</p>
          <p className="text-emerald-400 text-xs mt-2">→ {tooltip.action}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onOpenProForma: (strategy: 'rent' | 'flip', financing: 'bank' | 'hard-money', contractor: 'cheap' | 'fast') => void;
  onPass: () => void;
  isProFormaComplete?: boolean;
  completedDiligence?: string[];
  onDiligencePurchase?: (propertyId: number, diligenceType: string, cost: number, weeks: number) => void;
  cash?: number;
}

export function PropertyDetail({ 
  property, 
  onClose, 
  onOpenProForma, 
  onPass, 
  isProFormaComplete = false,
  completedDiligence = [],
  onDiligencePurchase,
  cash = 30000,
}: PropertyDetailProps) {
  const [strategy, setStrategy] = useState<'rent' | 'flip'>('rent');
  const [financing, setFinancing] = useState<'bank' | 'hard-money'>('bank');
  const [contractor, setContractor] = useState<'cheap' | 'fast'>('cheap');
  const [selectedImageKey, setSelectedImageKey] = useState<'front' | 'side' | 'back'>('front');
  const [pendingDiligence, setPendingDiligence] = useState<DiligenceOption | null>(null);

  const imageSet = getPropertyImageSet(property.name);
  const galleryImages = [
    { key: 'front' as const, label: 'Front View', src: imageSet.gallery.front },
    { key: 'side' as const, label: 'Side View', src: imageSet.gallery.side },
    { key: 'back' as const, label: 'Back View', src: imageSet.gallery.back },
  ];
  const propertyImage = imageSet.gallery[selectedImageKey] || imageSet.main;
  const allIssues = getPropertyIssues(property.name);
  const revealedIssues = getRevealedIssues(property.name, completedDiligence);
  const hasUnrevealedIssues = allIssues.length > revealedIssues.length;

  const handleDiligenceClick = (option: DiligenceOption) => {
    if (!completedDiligence.includes(option.id)) {
      setPendingDiligence(option);
    }
  };

  const handleConfirmDiligence = () => {
    if (pendingDiligence && onDiligencePurchase) {
      onDiligencePurchase(property.id, pendingDiligence.id, pendingDiligence.cost, pendingDiligence.timeWeeks);
    }
    setPendingDiligence(null);
  };

  const handleCancelDiligence = () => {
    setPendingDiligence(null);
  };

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
      'South Street': 'Urban, Emerging',
      'Fishtown': 'Urban, High Growth',
      'Port Richmond': 'Urban, Working Class',
      'Kensington': 'Urban, Value Area',
      'Northern Liberties': 'Urban, Hot Market',
    };
    return traits[neighborhood] || 'Residential';
  };

  const getTimelineRiskExplanation = () => {
    const timelineSpread = property.timelineMax - property.timelineMin;
    const revealedTimelineImpact = getTotalTimelineImpact(revealedIssues);
    
    if (timelineSpread > 6 || property.conditionTag === 'Fixer-Upper') {
      return {
        level: 'Elevated',
        color: 'text-red-400',
        explanation: `Delays could add ${revealedTimelineImpact > 0 ? `${revealedTimelineImpact}+` : '4-10'} weeks of holding costs. Each week adds ~$${Math.round((property.price * 0.05) / 52 + 200)} in interest, taxes, and insurance.`,
      };
    } else if (timelineSpread > 3 || property.conditionTag === 'Fair') {
      return {
        level: 'Moderate',
        color: 'text-amber-400',
        explanation: `Timeline variance of ${property.timelineMin}-${property.timelineMax} weeks. Budget for ${Math.ceil(timelineSpread / 2)} extra weeks of carrying costs (~$${Math.round(((property.price * 0.05) / 52 + 200) * Math.ceil(timelineSpread / 2))}).`,
      };
    }
    return {
      level: 'Standard',
      color: 'text-gray-400',
      explanation: 'Timeline relatively predictable. Standard carrying cost assumptions apply.',
    };
  };

  const timelineRisk = getTimelineRiskExplanation();
  const revealedCostRange = getTotalIssuesCostRange(revealedIssues);
  const effectiveRanges = getEffectiveRanges(property, completedDiligence);

  const formatUnknownCurrency = (range: { min: number; max: number; known: boolean }) => {
    if (!range.known) {
      return '???';
    }
    return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/80 backdrop-blur-sm" data-testid="property-detail-modal">
      <div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-2xl shadow-2xl" style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
      }}>
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-4 bg-gradient-to-b from-slate-900/95 to-transparent backdrop-blur-sm">
          <h2 className="font-display text-white text-xl md:text-2xl font-bold tracking-wide">
            {property.name}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
            data-testid="button-close-detail"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 md:px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
            {/* Left Column - Property Info (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Main Image */}
              <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg">
                <img src={propertyImage} alt={property.name} className="w-full h-full object-cover" data-testid="property-main-image" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-3xl font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</span>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-3 gap-2">
                {galleryImages.map((img) => (
                  <button key={img.key} onClick={() => setSelectedImageKey(img.key)}
                    className={`h-14 rounded-lg overflow-hidden transition-all ${selectedImageKey === img.key ? 'ring-2 ring-emerald-400' : 'opacity-70 hover:opacity-100'}`}>
                    <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              {/* Property Stats - Fixed Facts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-emerald-400 text-lg font-bold">{property.sizeSqft.toLocaleString()} sqft</div>
                  <div className="text-gray-400 text-xs">Square Feet</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-blue-400 text-sm font-bold">{getNeighborhoodTraits(property.neighborhood)}</div>
                  <div className="text-gray-400 text-xs">Neighborhood</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className={`text-sm font-bold ${property.conditionTag === 'Excellent' ? 'text-emerald-400' : property.conditionTag === 'Good' ? 'text-blue-400' : property.conditionTag === 'Fair' ? 'text-amber-400' : 'text-red-400'}`}>
                    {getConditionDescription(property.conditionTag)}
                  </div>
                  <div className="text-gray-400 text-xs">Condition</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-gray-300 text-sm font-bold">${Math.round(property.price / property.sizeSqft)}/sqft</div>
                  <div className="text-gray-400 text-xs">Price Per Sqft</div>
                </div>
              </div>

              {/* Unknown Financials Section */}
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600/50">
                <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="cursor-help touch-manipulation">
                        <HelpCircle className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="right" className="max-w-sm bg-slate-800 border-amber-500/50 text-gray-200 text-sm p-4">
                      <div className="space-y-2">
                        <p className="font-semibold text-amber-400">Why These Are Estimates</p>
                        <p className="text-gray-300">These financial numbers are uncertain until you do your homework. In real estate, guessing wrong on rent, repair costs, or timeline can turn a "great deal" into a money pit.</p>
                        <p className="text-emerald-400 text-xs mt-2">→ Complete due diligence investigations below to narrow down these ranges and reduce your risk.</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                  Financial Estimates
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <UnknownValueBadge type="rent" isKnown={effectiveRanges.rent.known}>
                    <div className={`rounded-lg p-3 border ${effectiveRanges.rent.known ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.rent.known ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {effectiveRanges.rent.known ? formatUnknownCurrency(effectiveRanges.rent) : '???'}<span className="text-xs font-normal">/mo</span>
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        Rent {!effectiveRanges.rent.known && <Lock className="w-3 h-3" />}
                      </div>
                    </div>
                  </UnknownValueBadge>
                  <UnknownValueBadge type="arv" isKnown={effectiveRanges.arv.known}>
                    <div className={`rounded-lg p-3 border ${effectiveRanges.arv.known ? 'bg-blue-500/10 border-blue-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.arv.known ? 'text-blue-400' : 'text-gray-400'}`}>
                        {effectiveRanges.arv.known ? formatUnknownCurrency(effectiveRanges.arv) : '???'}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        ARV {!effectiveRanges.arv.known && <Lock className="w-3 h-3" />}
                      </div>
                    </div>
                  </UnknownValueBadge>
                  <UnknownValueBadge type="rehab" isKnown={effectiveRanges.rehab.known}>
                    <div className={`rounded-lg p-3 border ${effectiveRanges.rehab.known ? 'bg-amber-500/10 border-amber-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.rehab.known ? 'text-amber-400' : 'text-gray-400'}`}>
                        {effectiveRanges.rehab.known ? formatUnknownCurrency(effectiveRanges.rehab) : '???'}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        Rehab Cost {!effectiveRanges.rehab.known && <Lock className="w-3 h-3" />}
                      </div>
                    </div>
                  </UnknownValueBadge>
                  <UnknownValueBadge type="timeline" isKnown={effectiveRanges.timeline.known}>
                    <div className={`rounded-lg p-3 border ${effectiveRanges.timeline.known ? 'bg-purple-500/10 border-purple-500/30' : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.timeline.known ? 'text-purple-400' : 'text-gray-400'}`}>
                        {effectiveRanges.timeline.known ? `${effectiveRanges.timeline.min}-${effectiveRanges.timeline.max} wks` : '???'}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        Timeline {!effectiveRanges.timeline.known && <Lock className="w-3 h-3" />}
                      </div>
                    </div>
                  </UnknownValueBadge>
                </div>
                {(!effectiveRanges.rent.known || !effectiveRanges.arv.known || !effectiveRanges.rehab.known) && (
                  <p className="mt-3 text-xs text-amber-400/80 italic">
                    Complete due diligence to narrow these estimates before building your pro forma.
                  </p>
                )}
              </div>

              {/* Due Diligence Section */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" /> Due Diligence Options
                </h3>
                <div className="space-y-2">
                  {DILIGENCE_OPTIONS.map((option) => {
                    const isCompleted = completedDiligence.includes(option.id);
                    const canAfford = cash >= option.cost;
                    const isDisabled = isCompleted || !canAfford;
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleDiligenceClick(option)}
                        disabled={isDisabled}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                          isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : !canAfford
                            ? 'bg-slate-700/20 border-slate-700 text-gray-500 cursor-not-allowed'
                            : 'bg-slate-700/30 border-slate-600 hover:border-emerald-500/50 text-gray-300'
                        }`}
                        data-testid={`button-diligence-${option.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {option.id === 'contractor_walkthrough' && <HardHat className="w-4 h-4" />}
                            {option.id === 'inspection' && <Search className="w-4 h-4" />}
                            {option.id === 'title_search' && <FileText className="w-4 h-4" />}
                            <span className="font-semibold text-sm">{option.name}</span>
                          </div>
                          {isCompleted ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <span className="text-xs text-gray-400">{formatCurrency(option.cost)} + {option.timeWeeks < 1 ? `${option.timeWeeks * 7}d` : `${option.timeWeeks}w`}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{option.reveals}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Revealed Issues */}
              {revealedIssues.length > 0 && (
                <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                  <h3 className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Issues Discovered
                  </h3>
                  <div className="space-y-3">
                    {revealedIssues.map((issue) => {
                      const issueImg = getIssueImage(issue.id);
                      return (
                        <div key={issue.id} className="bg-slate-900/50 rounded-lg p-3">
                          <div className="flex gap-3">
                            {issueImg && (
                              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-red-500/30">
                                <img src={issueImg} alt={issue.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className={`font-semibold text-sm ${issue.severity === 'severe' ? 'text-red-400' : issue.severity === 'moderate' ? 'text-amber-400' : 'text-yellow-400'}`}>
                                  {issue.name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded ${issue.severity === 'severe' ? 'bg-red-500/20 text-red-400' : issue.severity === 'moderate' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                  {issue.severity}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{issue.description}</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Estimated repair:</span>
                                <span className="text-red-400 font-mono">{formatCurrency(issue.costRangeMin)} - {formatCurrency(issue.costRangeMax)}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-gray-500">Timeline impact:</span>
                                <span className="text-amber-400">+{issue.timelineImpactWeeks} weeks</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {hasUnrevealedIssues && (
                    <p className="text-xs text-gray-500 mt-3 italic">
                      Additional issues may exist. Complete more diligence to uncover them.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Strategy & Financing (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strategy */}
                <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">Choose Your Strategy</h3>
                  <div className="space-y-2">
                    <button onClick={() => setStrategy('rent')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${strategy === 'rent' ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-slate-700/30 border-2 border-transparent hover:border-slate-600'}`}
                      data-testid="button-strategy-rent">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${strategy === 'rent' ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                        {strategy === 'rent' && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-white">Rental</div>
                        <div className="text-xs text-gray-400">Calculate your cash flow</div>
                      </div>
                      <Home className={`w-5 h-5 ${strategy === 'rent' ? 'text-emerald-400' : 'text-gray-500'}`} />
                    </button>
                    <button onClick={() => setStrategy('flip')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${strategy === 'flip' ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-slate-700/30 border-2 border-transparent hover:border-slate-600'}`}
                      data-testid="button-strategy-flip">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${strategy === 'flip' ? 'bg-emerald-500' : 'bg-slate-600'}`}>
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

                {/* Financing */}
                <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">Financing Options</h3>
                  <div className="space-y-2">
                    <button onClick={() => setFinancing('hard-money')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${financing === 'hard-money' ? 'bg-amber-500/20 border-2 border-amber-500' : 'bg-slate-700/30 border-2 border-transparent hover:border-slate-600'}`}
                      data-testid="button-financing-hard-money">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${financing === 'hard-money' ? 'bg-amber-500' : 'bg-slate-600'}`}>
                        {financing === 'hard-money' && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-white">Hard Money Loan</div>
                        <div className="text-xs text-gray-400">10% Down, 12% Interest</div>
                      </div>
                      <Zap className={`w-5 h-5 ${financing === 'hard-money' ? 'text-amber-400' : 'text-gray-500'}`} />
                    </button>
                    <button onClick={() => setFinancing('bank')}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${financing === 'bank' ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-slate-700/30 border-2 border-transparent hover:border-slate-600'}`}
                      data-testid="button-financing-bank">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${financing === 'bank' ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                        {financing === 'bank' && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-white">Bank Loan</div>
                        <div className="text-xs text-gray-400">25% Down, 5% Interest</div>
                      </div>
                      <Shield className={`w-5 h-5 ${financing === 'bank' ? 'text-emerald-400' : 'text-gray-500'}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Timeline Risk Explanation */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Timeline Risk Analysis
                  </h3>
                  <span className={`text-sm font-semibold ${timelineRisk.color}`}>{timelineRisk.level}</span>
                </div>
                <p className="text-sm text-gray-400">{timelineRisk.explanation}</p>
                {revealedIssues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Known repair timeline:</span>
                      <span className="text-amber-400 font-semibold">+{getTotalTimelineImpact(revealedIssues)} weeks</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-500">Known repair costs:</span>
                      <span className="text-red-400 font-mono">{formatCurrency(revealedCostRange.min)} - {formatCurrency(revealedCostRange.max)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Contractor Choice - Locked until after offer */}
              <div className="bg-slate-800/30 backdrop-blur rounded-xl p-4 border border-slate-600 opacity-60">
                <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" /> Contractor Choice
                  <span className="text-xs font-normal text-gray-500">(Available after offer accepted)</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-700/20 border border-slate-700">
                    <Clock className="w-6 h-6 text-gray-500" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-400 text-sm">Cheap & Slow</div>
                      <div className="text-xs text-gray-500">15% savings, +50% time</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-700/20 border border-slate-700">
                    <Zap className="w-6 h-6 text-gray-500" />
                    <div className="text-center">
                      <div className="font-semibold text-gray-400 text-sm">Fast & Expensive</div>
                      <div className="text-xs text-gray-500">30% premium, 30% faster</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deal Outcome Unknown */}
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur rounded-xl p-4 border border-slate-600">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Deal Outcome Unknown</h3>
                    <p className="text-gray-400 text-xs">Build a pro forma to determine viability</p>
                  </div>
                </div>
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Diligence completed:</span>
                    <span className="text-emerald-400 font-medium">{completedDiligence.length}/3</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Issues discovered:</span>
                    <span className={revealedIssues.length > 0 ? 'text-amber-400' : 'text-gray-500'}>{revealedIssues.length} known{hasUnrevealedIssues && ' (more possible)'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons - PRO FORMA REQUIRED BEFORE OFFER */}
              <div className="space-y-3">
                {/* PRIMARY: View Pro Forma */}
                <button 
                  onClick={() => onOpenProForma(strategy, financing, contractor)}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-emerald-500/30"
                  data-testid="button-pro-forma"
                >
                  Build Pro Forma
                </button>
                
                {/* Make Offer - LOCKED until pro forma complete */}
                <button 
                  disabled={!isProFormaComplete}
                  className={`w-full px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isProFormaComplete
                      ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30'
                      : 'bg-slate-700/30 text-gray-500 border border-slate-600 cursor-not-allowed'
                  }`}
                  data-testid="button-make-offer"
                >
                  {!isProFormaComplete && <Lock className="w-4 h-4" />}
                  {isProFormaComplete ? 'Make Offer' : 'Complete Pro Forma to Make Offer'}
                </button>

                <button 
                  onClick={onPass}
                  className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm transition-all"
                  data-testid="button-pass"
                >
                  Pass on Property
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Due Diligence Purchase */}
      <AlertDialog open={!!pendingDiligence} onOpenChange={(open) => !open && handleCancelDiligence()}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg">
              Confirm Investigation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {pendingDiligence && (
                <div className="space-y-4 mt-2">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="font-semibold text-gray-200 mb-2">{pendingDiligence.name}</div>
                    <p className="text-sm text-gray-400 mb-3">{pendingDiligence.reveals}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Cost:</span>
                      <span className="text-red-400 font-mono font-bold">-{formatCurrency(pendingDiligence.cost)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-amber-400 font-mono">
                        -{pendingDiligence.timeWeeks < 1 
                          ? `${Math.round(pendingDiligence.timeWeeks * 7)} days` 
                          : `${pendingDiligence.timeWeeks} week${pendingDiligence.timeWeeks !== 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-amber-400/80 italic">
                    This will be deducted from your cash and time immediately.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel 
              onClick={handleCancelDiligence}
              className="bg-slate-700 hover:bg-slate-600 text-gray-200 border-slate-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDiligence}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}