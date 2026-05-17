import { useState } from 'react';
import { X, Check, Home, Wrench, Clock, DollarSign, Zap, Lock, AlertTriangle, Shield, Search, FileText, HardHat, HelpCircle, ChevronLeft, ChevronRight, TrendingUp, Ruler, BedDouble, Bath, Building2, Thermometer, Droplets, MapPin, Maximize } from 'lucide-react';
import { formatCurrency, MARKET_DEFAULTS, getPropertyBasedDefaults } from '@/lib/gameData';
import { getPropertyImage, getConditionAdjustedInteriors, getIssueImage } from '@/lib/propertyImages';
import { DILIGENCE_OPTIONS, getPropertyIssues, getRevealedIssues, getRandomizedPropertyIssues, getRevealedRandomizedIssues, getTotalIssuesCostRange, getTotalTimelineImpact, getEffectiveRanges, type DiligenceOption, type PropertyIssue } from '@/lib/propertyIssues';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { playProformaChime, playDealCommitChunk } from '@/hooks/useClickSound';
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

// Format property characteristics from DB fields into display labels
function getPropertyCharacteristics(property: Property) {
  const { bedrooms, bathrooms, waterSource, heatType, propertyType } = property;

  const waterLabel = waterSource === 'public' ? 'City Water & Sewer' : 'Well & Septic';

  const heatLabelMap: Record<string, string> = {
    gas: 'Gas Heat',
    electric: 'Electric Heat',
    oil: 'Oil Heat',
    heat_pump: 'Heat Pump',
  };
  const heatLabel = heatLabelMap[heatType] || 'Unknown Heat';

  const typeLabels: Record<string, string> = {
    house: 'Single Family',
    townhouse: 'Townhouse / Row',
    condo: 'Condo',
    apartment: 'Apartment',
    duplex: 'Duplex',
  };
  const typeLabel = typeLabels[propertyType] || 'Single Family';

  return { bedrooms, bathrooms, waterSource, waterLabel, heatType, heatLabel, typeLabel };
}

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
    definition: "How many months it takes to complete all renovations before you can rent or sell the property.",
    whyItMatters: "Every month costs money - loan interest, taxes, insurance, utilities. A 4-month delay could cost $2,000-$4,000+.",
    unknownAction: "Complete a Contractor Walkthrough for a realistic timeline.",
  },
};

function FinancialTermInfo({ type, isKnown }: { type: keyof typeof FINANCIAL_TERM_TOOLTIPS; isKnown: boolean }) {
  const tooltip = FINANCIAL_TERM_TOOLTIPS[type];
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button 
        type="button" 
        className="p-1.5 -m-1 rounded-full hover:bg-white/10 transition-colors touch-manipulation active:opacity-70 min-w-[28px] min-h-[28px] flex items-center justify-center relative z-10"
        aria-label={`Learn about ${tooltip.title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        data-testid={`help-${type}`}
      >
        <HelpCircle className="w-5 h-5 text-gray-400 hover:text-gray-200" />
      </button>
      {open && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div 
            className="max-w-sm w-full bg-[hsl(220,14%,10%)] border border-white/8 text-white/70 text-sm p-5 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <p className="font-semibold text-white text-base">{tooltip.title}</p>
              <p className="text-gray-300 text-sm">{tooltip.definition}</p>
              <p className="text-amber-400 text-sm"><strong>Why it matters:</strong> {tooltip.whyItMatters}</p>
              {!isKnown && tooltip.unknownAction && (
                <p className="text-emerald-400 text-sm mt-2">{tooltip.unknownAction}</p>
              )}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="mt-4 w-full py-2.5 bg-white/8 hover:bg-white/12 rounded-lg text-white/70 font-medium text-sm transition-colors duration-150 touch-target"
              data-testid={`help-${type}-close`}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
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
    explanation: "Every month you hold a property costs money (loan interest, taxes, insurance). Underestimating timeline destroys profits.",
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
  const [open, setOpen] = useState(false);
  if (!education) return null;

  return (
    <>
      <button
        type="button"
        className="p-1.5 -m-1 rounded-full hover:bg-white/10 transition-colors touch-manipulation active:opacity-70 cursor-help inline-flex items-center justify-center min-w-[28px] min-h-[28px]"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Learn about real-world data sources"
        data-testid={`help-diligence-${diligenceId}`}
      >
        <HelpCircle className="w-5 h-5 text-blue-400 hover:text-blue-300" />
      </button>
      {open && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div 
            className="max-w-sm w-full bg-[hsl(220,14%,10%)] border border-white/8 text-white/70 text-sm p-5 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-3">
              <p className="font-semibold text-blue-400 text-base">How Real Investors Get This Data</p>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Common Sources:</p>
                <p className="text-gray-300 text-sm">{education.tools}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Typical Process:</p>
                <p className="text-gray-300 text-sm">{education.howTo}</p>
              </div>
              <p className="text-emerald-400 text-sm italic">{education.realWorldSource}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="mt-4 w-full py-2.5 bg-white/8 hover:bg-white/12 rounded-lg text-white/70 font-medium text-sm transition-colors duration-150 touch-target"
              data-testid={`help-diligence-${diligenceId}-close`}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FinancialEstimatesHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="cursor-help touch-manipulation p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        onPointerDown={(e) => e.stopPropagation()}
        aria-label="Why these are estimates"
        data-testid="help-financial-estimates"
      >
        <HelpCircle className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="max-w-sm w-full bg-[hsl(220,14%,10%)] border border-white/8 text-white/70 text-sm p-5 rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              <p className="font-semibold text-amber-400 text-base">Why These Are Estimates</p>
              <p className="text-gray-300">These financial numbers are uncertain until you do your homework. In real estate, guessing wrong on rent, repair costs, or timeline can turn a "great deal" into a money pit.</p>
              <p className="text-emerald-400 text-sm">Complete due diligence investigations below to narrow down these ranges and reduce your risk.</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="mt-4 w-full py-2.5 bg-white/8 hover:bg-white/12 rounded-lg text-white/70 font-medium text-sm transition-colors duration-150 touch-target"
              data-testid="help-financial-estimates-close"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function UnknownValueBadge({ type, isKnown, children }: { type: keyof typeof UNKNOWN_VALUE_TOOLTIPS; isKnown: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const tooltip = UNKNOWN_VALUE_TOOLTIPS[type];
  
  if (isKnown) {
    return <>{children}</>;
  }
  
  return (
    <>
      <div 
        className="cursor-help touch-manipulation active:opacity-70 block"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('[data-testid^="help-"]')) return;
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </div>
      {open && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div 
            className="max-w-sm w-full bg-[hsl(220,14%,10%)] border border-white/8 text-white/70 text-sm p-5 rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-2">
              <p className="font-semibold text-amber-400 text-base">{tooltip.title}</p>
              <p className="text-gray-300 text-sm">{tooltip.explanation}</p>
              <p className="text-emerald-400 text-sm mt-2">{tooltip.action}</p>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setOpen(false); }}
              className="mt-4 w-full py-2.5 bg-white/8 hover:bg-white/12 rounded-lg text-white/70 font-medium text-sm transition-colors duration-150 touch-target"
              data-testid={`unknown-${type}-close`}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onOpenProForma: (strategy: 'rent' | 'flip', contractor: 'cheap' | 'fast') => void;
  onPass: () => void;
  onGoHome?: () => void;
  isProFormaComplete?: boolean;
  completedDiligence?: string[];
  onDiligencePurchase?: (propertyId: number, diligenceType: string, cost: number, weeks: number) => void;
  cash?: number;
  proFormaInputs?: any;
  onProFormaInputsChange?: (inputs: any) => void;
  touchedFields?: Set<any>;
  onFieldTouch?: (field: any) => void;
  gameRunId?: number;
}

export function PropertyDetail({
  property,
  onClose,
  onOpenProForma,
  onPass,
  onGoHome,
  isProFormaComplete = false,
  completedDiligence = [],
  onDiligencePurchase,
  cash = 100000,
  proFormaInputs,
  onProFormaInputsChange,
  touchedFields,
  onFieldTouch,
  gameRunId,
}: PropertyDetailProps) {
  const [strategy, setStrategy] = useState<'rent' | 'flip'>('rent');
  const [contractor, setContractor] = useState<'cheap' | 'fast'>('cheap');
  const [pendingDiligence, setPendingDiligence] = useState<DiligenceOption | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  // Use randomized issues if we have a gameRunId, otherwise fall back to static issues
  const allIssues = gameRunId 
    ? getRandomizedPropertyIssues(gameRunId, property.id, property.propertyType, property.conditionTag, property.waterSource || 'public')
    : getPropertyIssues(property.name);
  const revealedIssues = gameRunId
    ? getRevealedRandomizedIssues(gameRunId, property.id, property.propertyType, property.conditionTag, completedDiligence, property.waterSource || 'public')
    : getRevealedIssues(property.name, completedDiligence);
  const hasUnrevealedIssues = allIssues.length > revealedIssues.length;

  const propertyImage = getPropertyImage(property.name);
  const interiorImages = getConditionAdjustedInteriors(property.name, property.conditionTag, property.price);

  const revealedIssueGalleryImages = revealedIssues
    .map(issue => {
      const img = getIssueImage(issue.id);
      if (img && !imageLoadErrors.has(img)) {
        return { type: 'issue', label: issue.name, url: img };
      }
      return null;
    })
    .filter((img): img is { type: string; label: string; url: string } => img !== null);

  const allImages = [
    { type: 'exterior', label: 'Exterior', url: propertyImage },
    ...interiorImages.filter(img => !imageLoadErrors.has(img.url)),
    ...revealedIssueGalleryImages,
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

  const propChars = getPropertyCharacteristics(property);

  const handleDiligenceClick = (option: DiligenceOption) => {
    if (!completedDiligence.includes(option.id)) {
      setPendingDiligence(option);
    }
  };

  const handleConfirmDiligence = () => {
    if (pendingDiligence && onDiligencePurchase) {
      playDealCommitChunk();
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
        explanation: `Delays could add ${revealedTimelineImpact > 0 ? `${revealedTimelineImpact}+` : '4-10'} months of holding costs. Each month adds ~$${Math.round((property.price * 0.05) / 12 + 200)} in interest, taxes, and insurance.`,
      };
    } else if (timelineSpread > 3 || property.conditionTag === 'Fair') {
      return {
        level: 'Moderate',
        color: 'text-amber-400',
        explanation: `Timeline variance of ${property.timelineMin}-${property.timelineMax} months. Budget for ${Math.ceil(timelineSpread / 2)} extra months of carrying costs (~$${Math.round(((property.price * 0.05) / 12 + 200) * Math.ceil(timelineSpread / 2))}).`,
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
    <div className="fixed inset-0 z-[60] flex flex-col items-center bg-[hsl(220,14%,6%)]" data-testid="property-detail-modal">
      {/* Fixed header bar - always visible at top */}
      <div className="w-full max-w-6xl flex items-center justify-between gap-3 px-4 md:px-6 py-3 pt-[calc(env(safe-area-inset-top,0px)+12px)] bg-[hsl(220,14%,8%)] md:rounded-t-2xl border-b border-white/6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose}
            className="touch-target flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl text-white transition-all duration-150 ios-spring tap-scale"
            data-testid="button-back-to-market"
            data-sound="close"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Market</span>
          </button>
          {onGoHome && (
            <button 
              onClick={onGoHome}
              className="touch-target flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 active:bg-emerald-600/40 border border-emerald-500/30 rounded-xl text-emerald-300 transition-all duration-150 ios-spring tap-scale"
              data-testid="button-go-home"
              data-sound="swoosh"
            >
              <Home className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Home</span>
            </button>
          )}
        </div>
        <h2 className="font-display text-white text-lg md:text-2xl font-bold tracking-wide truncate flex-1 text-center">
          {property.name}
        </h2>
        <button 
          onClick={onClose}
          className="touch-target p-2.5 bg-white/8 hover:bg-white/12 rounded-full text-white/60 transition-colors duration-150"
          data-testid="button-close-detail"
          data-sound="close"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      {/* Scrollable content */}
      <div 
        className="w-full max-w-6xl flex-1 overflow-y-auto md:rounded-b-2xl overscroll-contain touch-pan-y bg-[hsl(220,14%,8%)]" 
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="px-4 md:px-6 py-4 pb-6">
          <div className="space-y-4 md:space-y-5 max-w-5xl mx-auto">

            {/* SECTION 1: Image + Property Stats side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Left: Image Gallery */}
              <div className="space-y-3">
              {/* Main Image Gallery */}
              <div className="relative rounded-xl overflow-hidden aspect-video bg-[hsl(220,14%,6%)]">
                <img
                  src={currentImage.url}
                  alt={`${property.name} - ${currentImage.label}`}
                  loading="lazy"
                  decoding="async"
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
                <div className={`absolute top-4 left-4 backdrop-blur-sm px-3 py-1 rounded-lg border ${currentImage.type === 'issue' ? 'bg-red-900/60 border-red-500/30' : 'bg-black/60 border-white/10'}`}>
                  <span className={`text-sm font-semibold ${currentImage.type === 'issue' ? 'text-red-300' : 'text-white'}`}>
                    {currentImage.type === 'issue' && <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}
                    {currentImage.label}
                  </span>
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2.5 rounded-full border border-white/10 transition-colors duration-150 z-10"
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 backdrop-blur-sm p-2.5 rounded-full border border-white/10 transition-colors duration-150 z-10"
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
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/10">
                    <span className="text-white text-sm font-mono">
                      {currentImageIndex + 1} / {allImages.length}
                    </span>
                  </div>
                )}

                {/* Hidden images for preloading and error handling */}
                <div className="hidden">
                  {[...interiorImages, ...revealedIssueGalleryImages].map((img) => (
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
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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
                          ? (img.type === 'issue' ? 'border-red-500 scale-105' : 'border-emerald-500 scale-105')
                          : (img.type === 'issue' ? 'border-red-800/50 hover:border-red-600 opacity-70 hover:opacity-100' : 'border-white/10 hover:border-white/20 opacity-70 hover:opacity-100')
                      }`}
                      type="button"
                      data-testid={`thumbnail-${index}`}
                      data-no-click-sound
                    >
                      <img
                        src={img.url}
                        alt={img.label}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <div className={`absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t ${img.type === 'issue' ? 'from-red-900/90' : 'from-black/80'} to-transparent`}>
                        <span className={`text-[8px] truncate block text-center ${img.type === 'issue' ? 'text-red-300' : 'text-white'}`}>
                          {img.type === 'issue' ? `⚠ ${img.label}` : img.label}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              </div>

              {/* Right: Property Stats + Unknown Financials */}
              <div className="space-y-3">
                {/* Hero Stats Row - Size, Beds, Baths */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg p-3 bg-white/[0.03] border border-white/6">
                    <div className="text-white text-xl font-bold font-mono tracking-[-0.03em]">{property.sizeSqft.toLocaleString()}</div>
                    <div className="text-white/30 text-[10px] uppercase tracking-widest font-medium flex items-center gap-1">
                      <Ruler className="w-3 h-3" /> Sq Ft
                    </div>
                  </div>
                  <div className="rounded-lg p-3 bg-white/[0.03] border border-white/6">
                    <div className="text-white text-xl font-bold font-mono">{propChars.bedrooms}</div>
                    <div className="text-white/30 text-[10px] uppercase tracking-widest font-medium flex items-center gap-1">
                      <BedDouble className="w-3 h-3" /> Beds
                    </div>
                  </div>
                  <div className="rounded-lg p-3 bg-white/[0.03] border border-white/6">
                    <div className="text-white text-xl font-bold font-mono">{propChars.bathrooms}</div>
                    <div className="text-white/30 text-[10px] uppercase tracking-widest font-medium flex items-center gap-1">
                      <Bath className="w-3 h-3" /> Baths
                    </div>
                  </div>
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-2 rounded-lg p-2 bg-white/[0.03] border border-white/6">
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-blue-400 text-xs font-semibold leading-tight">{propChars.typeLabel}</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">Type</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg p-2 bg-white/[0.03] border border-white/6">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${property.conditionTag === 'Excellent' ? 'bg-emerald-500/15 border border-emerald-500/25' : property.conditionTag === 'Good' ? 'bg-blue-500/15 border border-blue-500/25' : property.conditionTag === 'Fair' ? 'bg-amber-500/15 border border-amber-500/25' : 'bg-red-500/15 border border-red-500/25'}`}>
                      <Wrench className={`w-3.5 h-3.5 ${property.conditionTag === 'Excellent' ? 'text-emerald-400' : property.conditionTag === 'Good' ? 'text-blue-400' : property.conditionTag === 'Fair' ? 'text-amber-400' : 'text-red-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-semibold leading-tight ${property.conditionTag === 'Excellent' ? 'text-emerald-400' : property.conditionTag === 'Good' ? 'text-blue-400' : property.conditionTag === 'Fair' ? 'text-amber-400' : 'text-red-400'}`}>
                        {getConditionDescription(property.conditionTag)}
                      </div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">Condition</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg p-2 bg-white/[0.03] border border-white/6">
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-200 text-xs font-semibold leading-tight">{propChars.waterLabel}</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">Water</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg p-2 bg-white/[0.03] border border-white/6">
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                      <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-gray-200 text-xs font-semibold leading-tight">{propChars.heatLabel}</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">Heating</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg p-2 bg-white/[0.03] border border-white/6">
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-teal-500/15 border border-teal-500/25 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-teal-400 text-xs font-semibold leading-tight">{getNeighborhoodTraits(property.neighborhood)}</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">Area</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg p-2 bg-white/[0.03] border border-white/6">
                    <div className="flex-shrink-0 w-7 h-7 rounded-md bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-amber-400 text-xs font-bold font-mono">${Math.round(property.price / property.sizeSqft)}/sqft</div>
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider">Price/Sqft</div>
                    </div>
                  </div>
                </div>

              {/* Unknown Financials Section */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6">
                <h4 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FinancialEstimatesHelp />
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
              </div>
            </div>

            {/* SECTION 2: Due Diligence - FULL WIDTH */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6" data-testid="due-diligence-section">
                <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-white/8 flex items-center justify-center">
                    <Search className="w-3.5 h-3.5 text-white/40" />
                  </div>
                  Due Diligence
                </h3>
                <div className="space-y-3">
                  {DILIGENCE_OPTIONS.map((option) => {
                    const isCompleted = completedDiligence.includes(option.id);
                    const canAfford = cash >= option.cost;
                    const isDisabled = isCompleted || !canAfford;
                    const colorMapping = DILIGENCE_COLOR_MAP[option.id];
                    const primaryColor = FINANCIAL_COLORS[colorMapping.primary];
                    
                    const getGradientClasses = () => {
                      if (isCompleted) {
                        return 'bg-white/[0.06] border-white/10';
                      }
                      if (!canAfford) {
                        return 'bg-white/[0.02] border-white/4 opacity-40 cursor-not-allowed';
                      }
                      return 'bg-white/[0.03] border-white/6 hover:bg-white/[0.06] hover:border-white/10';
                    };
                    
                    const getIconColor = () => {
                      if (isCompleted) return 'text-white/60';
                      if (!canAfford) return 'text-white/20';
                      return 'text-white/40';
                    };
                    
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleDiligenceClick(option)}
                        disabled={isDisabled}
                        className={`w-full text-left p-4 rounded-xl transition-colors duration-150 border-2 ${getGradientClasses()}`}
                        data-testid={`button-diligence-${option.id}`}
                        data-no-click-sound
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              isCompleted ? 'bg-white/10' : 'bg-white/[0.05]'
                            }`}>
                              {option.id === 'market_study' && <TrendingUp className={`w-5 h-5 ${getIconColor()}`} />}
                              {option.id === 'appraisal' && <DollarSign className={`w-5 h-5 ${getIconColor()}`} />}
                              {option.id === 'contractor_walkthrough' && <HardHat className={`w-5 h-5 ${getIconColor()}`} />}
                              {option.id === 'inspection' && <Search className={`w-5 h-5 ${getIconColor()}`} />}
                              {option.id === 'title_search' && <FileText className={`w-5 h-5 ${getIconColor()}`} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-sm ${isCompleted ? 'text-white/60' : 'text-white'}`}>{option.name}</span>
                                <DiligenceEducationTooltip diligenceId={option.id} />
                              </div>
                              <p className="text-sm text-gray-400 mt-0.5">{option.reveals}</p>
                            </div>
                          </div>
                          {isCompleted ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/8 rounded-full">
                              <Check className="w-3.5 h-3.5 text-white/50" />
                              <span className="text-[10px] text-white/40 font-medium uppercase tracking-wide">Done</span>
                            </div>
                          ) : (
                            <div className="text-right flex-shrink-0">
                              {option.cost === 0 ? (
                                <div className="text-sm text-emerald-400 font-semibold">
                                  Cost: {option.timeWeeks} month
                                  <div className="text-emerald-500/80">(Free — do it yourself!)</div>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-300">
                                  <span className="font-semibold text-white">Cost: {option.timeWeeks} month{option.timeWeeks > 1 ? 's' : ''} & {formatCurrency(option.cost)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Financial Estimates Summary Panel */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6" data-testid="financial-estimates-panel">
                <h3 className="text-gray-200 text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Financial Estimates
                </h3>
                <p className="text-xs text-gray-500 mb-3">These fill in as you complete your research above</p>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between rounded-lg p-2.5 border ${effectiveRanges.rent.known ? `${FINANCIAL_COLORS.rent.bg} ${FINANCIAL_COLORS.rent.border}` : 'bg-white/[0.03] border-white/6'}`}>
                    <span className={`text-xs font-semibold ${effectiveRanges.rent.known ? FINANCIAL_COLORS.rent.text : 'text-gray-400'}`}>Rent</span>
                    {effectiveRanges.rent.known ? (
                      <span className={`text-sm font-mono font-bold ${FINANCIAL_COLORS.rent.text}`}>{formatCurrency(effectiveRanges.rent.min)} - {formatCurrency(effectiveRanges.rent.max)}/mo</span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Not yet investigated</span>
                    )}
                  </div>
                  <div className={`flex items-center justify-between rounded-lg p-2.5 border ${effectiveRanges.arv.known ? `${FINANCIAL_COLORS.arv.bg} ${FINANCIAL_COLORS.arv.border}` : 'bg-white/[0.03] border-white/6'}`}>
                    <span className={`text-xs font-semibold ${effectiveRanges.arv.known ? FINANCIAL_COLORS.arv.text : 'text-gray-400'}`}>After Repair Value</span>
                    {effectiveRanges.arv.known ? (
                      <span className={`text-sm font-mono font-bold ${FINANCIAL_COLORS.arv.text}`}>{formatCurrency(effectiveRanges.arv.min)} - {formatCurrency(effectiveRanges.arv.max)}</span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Not yet investigated</span>
                    )}
                  </div>
                  <div className={`flex items-center justify-between rounded-lg p-2.5 border ${effectiveRanges.rehab.known ? `${FINANCIAL_COLORS.rehab.bg} ${FINANCIAL_COLORS.rehab.border}` : 'bg-white/[0.03] border-white/6'}`}>
                    <span className={`text-xs font-semibold ${effectiveRanges.rehab.known ? FINANCIAL_COLORS.rehab.text : 'text-gray-400'}`}>Rehab Costs</span>
                    {effectiveRanges.rehab.known ? (
                      <span className={`text-sm font-mono font-bold ${FINANCIAL_COLORS.rehab.text}`}>{formatCurrency(effectiveRanges.rehab.min)} - {formatCurrency(effectiveRanges.rehab.max)}</span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Not yet investigated</span>
                    )}
                  </div>
                  <div className={`flex items-center justify-between rounded-lg p-2.5 border ${effectiveRanges.timeline.known ? `${FINANCIAL_COLORS.timeline.bg} ${FINANCIAL_COLORS.timeline.border}` : 'bg-white/[0.03] border-white/6'}`}>
                    <span className={`text-xs font-semibold ${effectiveRanges.timeline.known ? FINANCIAL_COLORS.timeline.text : 'text-gray-400'}`}>Timeline</span>
                    {effectiveRanges.timeline.known ? (
                      <span className={`text-sm font-mono font-bold ${FINANCIAL_COLORS.timeline.text}`}>{effectiveRanges.timeline.min} - {effectiveRanges.timeline.max} months</span>
                    ) : (
                      <span className="text-xs text-gray-500 italic">Not yet investigated</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Revealed Issues */}
              {revealedIssues.length > 0 && (
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6">
                  <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400/60" /> Issues Discovered
                  </h3>
                  <div className="space-y-3">
                    {revealedIssues.map((issue) => {
                      const issueImg = getIssueImage(issue.id);
                      return (
                        <div key={issue.id} className="bg-white/[0.03] rounded-lg p-3">
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
                                <span className="text-amber-400">+{issue.timelineImpactWeeks} months</span>
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

            {/* SECTION 5: Strategy + Contractor side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Strategy */}
                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6">
                  <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3">Choose Your Strategy</h3>
                  <div className="space-y-2">
                    <button onClick={() => setStrategy('rent')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors duration-150 ${strategy === 'rent' ? 'bg-white/10 border border-white/15' : 'border border-white/6 hover:bg-white/[0.04]'}`}
                      data-testid="button-strategy-rent">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${strategy === 'rent' ? 'bg-[hsl(152,44%,42%)]' : 'bg-white/8'}`}>
                        {strategy === 'rent' && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-white text-sm">Rental</div>
                        <div className="text-xs text-white/30">Calculate your cash flow</div>
                      </div>
                      <Home className={`w-5 h-5 ${strategy === 'rent' ? 'text-white/60' : 'text-white/20'}`} />
                    </button>
                    <button onClick={() => setStrategy('flip')}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors duration-150 ${strategy === 'flip' ? 'bg-white/10 border border-white/15' : 'border border-white/6 hover:bg-white/[0.04]'}`}
                      data-testid="button-strategy-flip">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${strategy === 'flip' ? 'bg-[hsl(152,44%,42%)]' : 'bg-white/8'}`}>
                        {strategy === 'flip' && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-white text-sm">Flip</div>
                        <div className="text-xs text-white/30">Calculate your profit</div>
                      </div>
                      <DollarSign className={`w-5 h-5 ${strategy === 'flip' ? 'text-white/60' : 'text-white/20'}`} />
                    </button>
                  </div>
                </div>

              {/* Contractor Choice - Select before making offer */}
              <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6">
                <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <HardHat className="w-3.5 h-3.5" /> Contractor Choice
                  <span className="text-[10px] font-normal text-amber-400/60">(Required)</span>
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setContractor('cheap')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-150 ${
                      contractor === 'cheap'
                        ? 'bg-white/10 border border-white/15'
                        : 'border border-white/6 hover:bg-white/[0.04]'
                    }`}
                    type="button"
                  >
                    <Clock className={`w-5 h-5 ${contractor === 'cheap' ? 'text-white/60' : 'text-white/20'}`} />
                    <div className="text-center">
                      <div className={`font-medium text-sm ${contractor === 'cheap' ? 'text-white' : 'text-white/40'}`}>Sole Operator</div>
                      <div className="text-xs text-white/30">One-man crew, does it all</div>
                      <div className="text-xs text-amber-400/60">+2 months longer</div>
                      <div className="text-xs text-white/40">Lower cost</div>
                    </div>
                  </button>
                  <button
                    onClick={() => setContractor('fast')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-colors duration-150 ${
                      contractor === 'fast'
                        ? 'bg-white/10 border border-white/15'
                        : 'border border-white/6 hover:bg-white/[0.04]'
                    }`}
                    type="button"
                  >
                    <Zap className={`w-5 h-5 ${contractor === 'fast' ? 'text-white/60' : 'text-white/20'}`} />
                    <div className="text-center">
                      <div className={`font-medium text-sm ${contractor === 'fast' ? 'text-white' : 'text-white/40'}`}>Established Crew</div>
                      <div className="text-xs text-white/30">Full team, licensed & insured</div>
                      <div className="text-xs text-white/40">On schedule</div>
                      <div className="text-xs text-red-400/60">+25-40% rehab cost</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Risk Analysis - full width */}
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/50 text-[10px] font-semibold uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Timeline Risk Analysis
                </h3>
                <span className={`text-sm font-semibold ${timelineRisk.color}`}>{timelineRisk.level}</span>
              </div>
              <p className="text-sm text-white/40">{timelineRisk.explanation}</p>
              {revealedIssues.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Known repair timeline:</span>
                    <span className="text-amber-400 font-semibold">+{getTotalTimelineImpact(revealedIssues)} months</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Known repair costs:</span>
                    <span className="text-red-400 font-mono">{formatCurrency(revealedCostRange.min)} - {formatCurrency(revealedCostRange.max)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 6: Deal Outcome + Action Buttons - FULL WIDTH */}
            <div className="bg-white/[0.02] rounded-xl p-4 border border-white/6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Deal Outcome Unknown</h3>
                  <p className="text-gray-400 text-xs">Build a pro forma to determine viability</p>
                </div>
              </div>
              <div className="space-y-2 mt-3 pt-3 border-t border-white/6">
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
              <button 
                onClick={() => {
                  playProformaChime();
                  onOpenProForma(strategy, contractor);
                }}
                className="w-full px-6 py-3.5 bg-[hsl(152,44%,42%)] hover:bg-[hsl(152,44%,48%)] text-white rounded-lg font-medium text-sm transition-colors duration-150"
                data-testid="button-pro-forma"
              >
                Build Pro Forma
              </button>
              
              <button 
                disabled={!isProFormaComplete}
                className={`w-full px-6 py-3 rounded-lg font-medium text-sm transition-colors duration-150 flex items-center justify-center gap-2 ${
                  isProFormaComplete
                    ? 'bg-white/8 hover:bg-white/12 text-white/70 border border-white/10'
                    : 'bg-white/[0.02] text-white/20 border border-white/4 cursor-not-allowed'
                }`}
                data-testid="button-make-offer"
              >
                {!isProFormaComplete && <Lock className="w-4 h-4" />}
                {isProFormaComplete ? 'Make Offer' : 'Complete Pro Forma to Make Offer'}
              </button>

              <button 
                onClick={onPass}
                className="w-full px-4 py-3 bg-white/[0.04] hover:bg-white/8 text-red-400/70 border border-white/6 rounded-lg font-medium text-sm transition-colors duration-150"
                data-testid="button-pass"
              >
                Pass on Property
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Due Diligence Purchase */}
      <AlertDialog open={!!pendingDiligence} onOpenChange={(open) => !open && handleCancelDiligence()}>
        <AlertDialogContent className="bg-[hsl(220,14%,10%)] border-white/8 max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-lg">
              Confirm Investigation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Review the cost and time for this investigation before confirming.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingDiligence && (
            <div className="space-y-4 mt-2">
              <div className="bg-white/[0.04] rounded-lg p-4 border border-white/6">
                <div className="font-semibold text-gray-200 mb-2">{pendingDiligence.name}</div>
                <p className="text-sm text-gray-400 mb-3">{pendingDiligence.reveals}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Cost:</span>
                  <span className="text-red-400 font-mono font-bold">-{formatCurrency(pendingDiligence.cost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">Time:</span>
                  <span className="text-amber-400 font-mono">
                    -{pendingDiligence.timeWeeks} month{pendingDiligence.timeWeeks !== 1 ? 's' : ''}
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
              className="bg-white/8 hover:bg-white/12 text-white/60 border-white/6"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDiligence}
              className="bg-[hsl(152,44%,42%)] hover:bg-[hsl(152,44%,48%)] text-white"
            >
              Confirm Purchase
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}