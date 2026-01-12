import { useState } from 'react';
import { X, Check, Home, Wrench, Clock, DollarSign, Zap, Lock, AlertTriangle, Shield, Search, FileText, HardHat, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage, getPropertyInteriorImages, getIssueImage } from '@/lib/propertyImages';
import { DILIGENCE_OPTIONS, getPropertyIssues, getRevealedIssues, getTotalIssuesCostRange, getTotalTimelineImpact, getEffectiveRanges, type DiligenceOption, type PropertyIssue } from '@/lib/propertyIssues';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Property } from '@shared/schema';

const FINANCIAL_COLORS = {
  rent: {
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    bgHover: 'hover:bg-amber-500/20',
    border: 'border-amber-500/30',
    borderHover: 'hover:border-amber-500/50',
    glow: 'shadow-amber-500/20',
  },
  arv: {
    text: 'text-violet-400',
    bg: 'bg-violet-500/10',
    bgHover: 'hover:bg-violet-500/20',
    border: 'border-violet-500/30',
    borderHover: 'hover:border-violet-500/50',
    glow: 'shadow-violet-500/20',
  },
  rehab: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    bgHover: 'hover:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    borderHover: 'hover:border-emerald-500/50',
    glow: 'shadow-emerald-500/20',
  },
  timeline: {
    text: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    bgHover: 'hover:bg-cyan-500/20',
    border: 'border-cyan-500/30',
    borderHover: 'hover:border-cyan-500/50',
    glow: 'shadow-cyan-500/20',
  },
  issues: {
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    bgHover: 'hover:bg-orange-500/20',
    border: 'border-orange-500/30',
    borderHover: 'hover:border-orange-500/50',
    glow: 'shadow-orange-500/20',
  },
  title: {
    text: 'text-rose-400',
    bg: 'bg-rose-500/10',
    bgHover: 'hover:bg-rose-500/20',
    border: 'border-rose-500/30',
    borderHover: 'hover:border-rose-500/50',
    glow: 'shadow-rose-500/20',
  },
};

const DILIGENCE_COLOR_MAP: Record<string, { primary: keyof typeof FINANCIAL_COLORS; secondary?: keyof typeof FINANCIAL_COLORS }> = {
  market_study: { primary: 'rent' },
  appraisal: { primary: 'arv' },
  contractor_walkthrough: { primary: 'rehab', secondary: 'timeline' },
  inspection: { primary: 'issues' },
  title_search: { primary: 'title' },
};

const FINANCIAL_TERM_TOOLTIPS: Record<string, { title: string; definition: string; whyItMatters: string; unknownAction?: string }> = {
  rent: {
    title: "Monthly Rent",
    definition: "The amount a tenant pays each month to live in the property. This is your primary income source for rental investments.",
    whyItMatters: "Higher rent = more cash flow. But set it too high and you'll have vacancies. Set it too low and you leave money on the table.",
    unknownAction: "Complete a Market Rent Study to see what similar properties rent for.",
  },
  arv: {
    title: "After Repair Value (ARV)", 
    definition: "What the property will be worth AFTER you finish all renovations. This is your target sale price for flips.",
    whyItMatters: "ARV determines your profit margin. If you overestimate ARV, you'll lose money when you sell. Critical for the 70% rule.",
    unknownAction: "Complete a Comp Analysis to see recent sales of similar renovated homes.",
  },
  rehab: {
    title: "Rehab Cost",
    definition: "The total cost to renovate the property - materials, labor, permits, and unexpected repairs.",
    whyItMatters: "Renovation costs eat directly into your profit. A $10K underestimate means $10K less profit (or a loss).",
    unknownAction: "Complete a Contractor Walkthrough for accurate repair estimates.",
  },
  timeline: {
    title: "Renovation Timeline",
    definition: "How many weeks it takes to complete all renovations before you can rent or sell the property.",
    whyItMatters: "Every week costs money - loan interest, taxes, insurance, utilities. A 4-week delay could cost $2,000-$4,000+.",
    unknownAction: "Complete a Contractor Walkthrough for a realistic timeline.",
  },
};

function FinancialTermInfo({ type, isKnown }: { type: keyof typeof FINANCIAL_TERM_TOOLTIPS; isKnown: boolean }) {
  const tooltip = FINANCIAL_TERM_TOOLTIPS[type];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button" 
          className="p-1 -m-1 rounded-full hover:bg-white/10 transition-colors touch-manipulation active:opacity-70"
          aria-label={`Learn about ${tooltip.title}`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-xs bg-slate-800 border-slate-600 text-gray-200 text-sm p-4 z-[100]">
        <div className="space-y-2">
          <p className="font-semibold text-white">{tooltip.title}</p>
          <p className="text-gray-300 text-xs">{tooltip.definition}</p>
          <p className="text-amber-400 text-xs"><strong>Why it matters:</strong> {tooltip.whyItMatters}</p>
          {!isKnown && tooltip.unknownAction && (
            <p className="text-emerald-400 text-xs mt-2">→ {tooltip.unknownAction}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

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

const DILIGENCE_EDUCATION_TOOLTIPS: Record<string, { realWorldSource: string; tools: string; howTo: string }> = {
  market_study: {
    realWorldSource: "Real-world investors research rental comps themselves or hire property managers",
    tools: "Zillow, Rentometer, Apartments.com, Craigslist, or call local property managers for area insights",
    howTo: "Search for similar properties (same beds/baths/neighborhood) currently listed for rent and average the prices",
  },
  appraisal: {
    realWorldSource: "Real-world investors get CMAs from real estate agents or use MLS databases",
    tools: "Redfin, Zillow (sold listings), MLS access through an agent, or hire a licensed appraiser ($300-500)",
    howTo: "Look for recently sold homes (last 3-6 months) with similar size, condition, and location. Adjust for differences.",
  },
  contractor_walkthrough: {
    realWorldSource: "Real-world investors bring contractors to walk properties before making offers",
    tools: "Network with contractors, ask for references from other investors, or join local REI meetups",
    howTo: "Bring 2-3 contractors to estimate repair costs. Most will do free walkthroughs hoping to win the job.",
  },
  inspection: {
    realWorldSource: "Real-world investors hire licensed home inspectors to find hidden issues",
    tools: "Search for certified inspectors (ASHI, InterNACHI), expect to pay $300-500 for a detailed report",
    howTo: "Schedule inspection during due diligence period (7-14 days). Inspector checks structure, systems, and major components.",
  },
  title_search: {
    realWorldSource: "Real-world investors order preliminary title reports or use title companies",
    tools: "Title companies, real estate attorneys, or county recorder's office for DIY research",
    howTo: "Title company searches public records for liens, easements, ownership disputes. Usually required by lender anyway.",
  },
};

function DiligenceEducationTooltip({ diligenceId }: { diligenceId: string }) {
  const education = DILIGENCE_EDUCATION_TOOLTIPS[diligenceId];
  if (!education) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1 -m-1 rounded-full hover:bg-white/10 transition-colors touch-manipulation active:opacity-70"
          onClick={(e) => e.stopPropagation()}
          aria-label="Learn about real-world data sources"
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-400 hover:text-blue-300" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="right" className="max-w-sm bg-slate-800 border-blue-500/50 text-gray-200 text-sm p-4 z-[100]">
        <div className="space-y-2">
          <p className="font-semibold text-blue-400">📚 How Real Investors Get This Data</p>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Common Sources:</p>
            <p className="text-gray-300 text-xs">{education.tools}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Typical Process:</p>
            <p className="text-gray-300 text-xs">{education.howTo}</p>
          </div>
          <p className="text-emerald-400 text-xs mt-2 italic">💡 {education.realWorldSource}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function UnknownValueBadge({ type, isKnown, children }: { type: keyof typeof UNKNOWN_VALUE_TOOLTIPS; isKnown: boolean; children: React.ReactNode }) {
  const tooltip = UNKNOWN_VALUE_TOOLTIPS[type];
  
  if (isKnown) {
    return <>{children}</>;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div role="button" tabIndex={0} className="cursor-help touch-manipulation active:opacity-70">{children}</div>
      </PopoverTrigger>
      <PopoverContent side="top" className="max-w-sm bg-slate-800 border-amber-500/50 text-gray-200 text-sm p-4 z-[100]">
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
  const [pendingDiligence, setPendingDiligence] = useState<DiligenceOption | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const propertyImage = getPropertyImage(property.name);
  const interiorImages = getPropertyInteriorImages(property.name);

  // Build complete image gallery: exterior + working interior images
  const allImages = [
    { type: 'exterior', label: 'Exterior', url: propertyImage },
    ...interiorImages.filter(img => !imageLoadErrors.has(img.url))
  ];

  const safeIndex = Math.min(currentImageIndex, Math.max(0, allImages.length - 1));
  const currentImage = allImages[safeIndex] || allImages[0];

  const handleImageError = (url: string) => {
    setImageLoadErrors(prev => {
      const newSet = new Set(prev);
      newSet.add(url);
      return newSet;
    });
    if (currentImageIndex >= allImages.length - 1) {
      setCurrentImageIndex(0);
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

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
      'Graduate Hospital': 'Urban, Young Professionals',
      'Queen Village': 'Urban, Historic District',
      'Rittenhouse Square': 'Urban, Luxury',
      'Fairmount': 'Urban, Family-Friendly',
      'Society Hill': 'Urban, Prestigious',
      'Old City': 'Urban, Historic',
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
              {/* Main Image Gallery */}
              <div className="relative rounded-xl overflow-hidden aspect-video shadow-lg bg-slate-900">
                <img
                  src={currentImage.url}
                  alt={`${property.name} - ${currentImage.label}`}
                  className="w-full h-full object-cover"
                  data-testid="property-main-image"
                  onError={() => handleImageError(currentImage.url)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Price Badge */}
                <div className="absolute bottom-4 left-4">
                  <span className="text-3xl font-bold text-white drop-shadow-lg">{formatCurrency(property.price)}</span>
                </div>

                {/* Image Type Label */}
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-700">
                  <span className="text-white text-sm font-semibold">{currentImage.label}</span>
                </div>

                {/* Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        prevImage();
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm p-3 rounded-full border border-slate-700 transition-all z-10"
                      aria-label="Previous image"
                      type="button"
                      data-testid="button-prev-image"
                    >
                      <ChevronLeft className="w-5 h-5 text-white pointer-events-none" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        nextImage();
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm p-3 rounded-full border border-slate-700 transition-all z-10"
                      aria-label="Next image"
                      type="button"
                      data-testid="button-next-image"
                    >
                      <ChevronRight className="w-5 h-5 text-white pointer-events-none" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-lg border border-slate-700">
                    <span className="text-white text-sm font-mono">
                      {currentImageIndex + 1} / {allImages.length}
                    </span>
                  </div>
                )}

                {/* Hidden images for preloading and error handling */}
                <div className="hidden">
                  {interiorImages.map((img) => (
                    <img
                      key={img.url}
                      src={img.url}
                      alt={img.label}
                      onError={() => handleImageError(img.url)}
                    />
                  ))}
                </div>
              </div>

              {/* Thumbnail Gallery */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {allImages.map((img, index) => (
                    <button
                      key={img.url}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                        index === currentImageIndex
                          ? 'border-emerald-500 scale-105'
                          : 'border-slate-700 hover:border-slate-600 opacity-70 hover:opacity-100'
                      }`}
                      type="button"
                      data-testid={`thumbnail-${index}`}
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="text-[8px] text-white truncate block text-center">
                          {img.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

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
                      <button type="button" className="cursor-help touch-manipulation p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
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
                    <div className={`rounded-lg p-3 border ${effectiveRanges.rent.known ? `${FINANCIAL_COLORS.rent.bg} ${FINANCIAL_COLORS.rent.border}` : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.rent.known ? FINANCIAL_COLORS.rent.text : 'text-gray-400'}`}>
                        {effectiveRanges.rent.known ? formatUnknownCurrency(effectiveRanges.rent) : '???'}<span className="text-xs font-normal">/mo</span>
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        Rent {!effectiveRanges.rent.known && <Lock className="w-3 h-3" />}
                        <FinancialTermInfo type="rent" isKnown={effectiveRanges.rent.known} />
                      </div>
                    </div>
                  </UnknownValueBadge>
                  <UnknownValueBadge type="arv" isKnown={effectiveRanges.arv.known}>
                    <div className={`rounded-lg p-3 border ${effectiveRanges.arv.known ? `${FINANCIAL_COLORS.arv.bg} ${FINANCIAL_COLORS.arv.border}` : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.arv.known ? FINANCIAL_COLORS.arv.text : 'text-gray-400'}`}>
                        {effectiveRanges.arv.known ? formatUnknownCurrency(effectiveRanges.arv) : '???'}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        ARV {!effectiveRanges.arv.known && <Lock className="w-3 h-3" />}
                        <FinancialTermInfo type="arv" isKnown={effectiveRanges.arv.known} />
                      </div>
                    </div>
                  </UnknownValueBadge>
                  <UnknownValueBadge type="rehab" isKnown={effectiveRanges.rehab.known}>
                    <div className={`rounded-lg p-3 border ${effectiveRanges.rehab.known ? `${FINANCIAL_COLORS.rehab.bg} ${FINANCIAL_COLORS.rehab.border}` : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.rehab.known ? FINANCIAL_COLORS.rehab.text : 'text-gray-400'}`}>
                        {effectiveRanges.rehab.known ? formatUnknownCurrency(effectiveRanges.rehab) : '???'}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        Rehab Cost {!effectiveRanges.rehab.known && <Lock className="w-3 h-3" />}
                        <FinancialTermInfo type="rehab" isKnown={effectiveRanges.rehab.known} />
                      </div>
                    </div>
                  </UnknownValueBadge>
                  <UnknownValueBadge type="timeline" isKnown={effectiveRanges.timeline.known}>
                    <div className={`rounded-lg p-3 border ${effectiveRanges.timeline.known ? `${FINANCIAL_COLORS.timeline.bg} ${FINANCIAL_COLORS.timeline.border}` : 'bg-gray-500/10 border-gray-500/30'}`}>
                      <div className={`text-base font-bold font-mono ${effectiveRanges.timeline.known ? FINANCIAL_COLORS.timeline.text : 'text-gray-400'}`}>
                        {effectiveRanges.timeline.known ? `${effectiveRanges.timeline.min}-${effectiveRanges.timeline.max} wks` : '???'}
                      </div>
                      <div className="text-gray-400 text-xs flex items-center gap-1">
                        Timeline {!effectiveRanges.timeline.known && <Lock className="w-3 h-3" />}
                        <FinancialTermInfo type="timeline" isKnown={effectiveRanges.timeline.known} />
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
                    const colorMapping = DILIGENCE_COLOR_MAP[option.id];
                    const primaryColor = FINANCIAL_COLORS[colorMapping.primary];
                    const secondaryColor = colorMapping.secondary ? FINANCIAL_COLORS[colorMapping.secondary] : null;
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleDiligenceClick(option)}
                        disabled={isDisabled}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                          isCompleted
                            ? `${primaryColor.bg} ${primaryColor.border} ${primaryColor.text}`
                            : !canAfford
                            ? 'bg-slate-700/20 border-slate-700 text-gray-500 cursor-not-allowed'
                            : `bg-slate-700/30 ${primaryColor.border} ${primaryColor.borderHover} text-gray-300`
                        }`}
                        data-testid={`button-diligence-${option.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {option.id === 'contractor_walkthrough' && <HardHat className={`w-4 h-4 ${isCompleted ? primaryColor.text : 'text-gray-400'}`} />}
                            {option.id === 'inspection' && <Search className={`w-4 h-4 ${isCompleted ? primaryColor.text : 'text-gray-400'}`} />}
                            {option.id === 'title_search' && <FileText className={`w-4 h-4 ${isCompleted ? primaryColor.text : 'text-gray-400'}`} />}
                            <span className={`font-semibold text-sm ${isCompleted ? primaryColor.text : ''}`}>{option.name}</span>
                            <DiligenceEducationTooltip diligenceId={option.id} />
                            {secondaryColor && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${secondaryColor.bg} ${secondaryColor.text} ${secondaryColor.border} border`}>
                                +Timeline
                              </span>
                            )}
                          </div>
                          {isCompleted ? (
                            <Check className={`w-4 h-4 ${primaryColor.text}`} />
                          ) : (
                            <span className="text-xs text-gray-400">{formatCurrency(option.cost)} + {option.timeWeeks}w</span>
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

              {/* Contractor Choice - Select before making offer */}
              <div className="bg-slate-800/50 backdrop-blur rounded-xl p-4 border border-slate-700">
                <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <HardHat className="w-4 h-4" /> Contractor Choice
                  <span className="text-xs font-normal text-amber-400">(Required before offer)</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setContractor('cheap')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      contractor === 'cheap'
                        ? 'bg-blue-500/20 border-2 border-blue-400 shadow-lg shadow-blue-500/20'
                        : 'bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50'
                    }`}
                    type="button"
                  >
                    <Clock className={`w-6 h-6 ${contractor === 'cheap' ? 'text-blue-400' : 'text-gray-500'}`} />
                    <div className="text-center">
                      <div className={`font-semibold text-sm ${contractor === 'cheap' ? 'text-blue-300' : 'text-gray-400'}`}>Cheap & Slow</div>
                      <div className="text-xs text-amber-400">-2 weeks penalty</div>
                      <div className="text-xs text-emerald-400">Standard rehab cost</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setContractor('fast')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                      contractor === 'fast'
                        ? 'bg-purple-500/20 border-2 border-purple-400 shadow-lg shadow-purple-500/20'
                        : 'bg-slate-700/30 border border-slate-600 hover:bg-slate-700/50'
                    }`}
                    type="button"
                  >
                    <Zap className={`w-6 h-6 ${contractor === 'fast' ? 'text-purple-400' : 'text-gray-500'}`} />
                    <div className="text-center">
                      <div className={`font-semibold text-sm ${contractor === 'fast' ? 'text-purple-300' : 'text-gray-400'}`}>Fast & Expensive</div>
                      <div className="text-xs text-emerald-400">No time penalty</div>
                      <div className="text-xs text-red-400">+50% rehab cost</div>
                    </div>
                  </button>
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
          </AlertDialogHeader>
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
                    -{pendingDiligence.timeWeeks} week{pendingDiligence.timeWeeks !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <p className="text-sm text-amber-400/80 italic">
                This will be deducted from your cash and time immediately.
              </p>
            </div>
          )}
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