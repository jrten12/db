import { useState } from 'react';
import { X, Check, Home, Wrench, Clock, DollarSign, Zap, Lock, AlertTriangle, Shield, Search, FileText, HardHat } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import { getPropertyImage } from '@/lib/propertyImages';
import { DILIGENCE_OPTIONS, getPropertyIssues, getRevealedIssues, getTotalIssuesCostRange, getTotalTimelineImpact, type DiligenceOption, type PropertyIssue } from '@/lib/propertyIssues';
import type { Property } from '@shared/schema';

interface PropertyDetailProps {
  property: Property;
  onClose: () => void;
  onOpenProForma: (strategy: 'rent' | 'flip', financing: 'bank' | 'hard-money', contractor: 'cheap' | 'fast') => void;
  onPass: () => void;
  isProFormaComplete?: boolean;
}

export function PropertyDetail({ property, onClose, onOpenProForma, onPass, isProFormaComplete = false }: PropertyDetailProps) {
  const [strategy, setStrategy] = useState<'rent' | 'flip'>('rent');
  const [financing, setFinancing] = useState<'bank' | 'hard-money'>('bank');
  const [contractor, setContractor] = useState<'cheap' | 'fast'>('cheap');
  const [completedDiligence, setCompletedDiligence] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const propertyImage = getPropertyImage(property.name);
  const allIssues = getPropertyIssues(property.name);
  const revealedIssues = getRevealedIssues(property.name, completedDiligence);
  const hasUnrevealedIssues = allIssues.length > revealedIssues.length;

  const handleDiligence = (option: DiligenceOption) => {
    if (!completedDiligence.includes(option.id)) {
      setCompletedDiligence([...completedDiligence, option.id]);
    }
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
                {[0, 1, 2].map((i) => (
                  <button key={i} onClick={() => setSelectedImageIndex(i)}
                    className={`h-14 rounded-lg overflow-hidden transition-all ${selectedImageIndex === i ? 'ring-2 ring-emerald-400' : 'opacity-70 hover:opacity-100'}`}>
                    <img src={propertyImage} alt={`View ${i + 1}`} className={`w-full h-full object-cover ${i === 1 ? 'grayscale-[30%]' : ''} ${i === 2 ? 'sepia-[20%]' : ''}`} />
                  </button>
                ))}
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-emerald-400 text-lg font-bold">{property.sizeSqft.toLocaleString()} sqft</div>
                  <div className="text-gray-400 text-xs">Square Feet</div>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                  <div className="text-amber-400 text-base font-bold">{formatCurrency(property.rentMin)}-{formatCurrency(property.rentMax)}</div>
                  <div className="text-gray-400 text-xs">Rent Potential</div>
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
              </div>

              {/* Due Diligence Section */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" /> Due Diligence Options
                </h3>
                <div className="space-y-2">
                  {DILIGENCE_OPTIONS.map((option) => {
                    const isCompleted = completedDiligence.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleDiligence(option)}
                        disabled={isCompleted}
                        className={`w-full text-left p-3 rounded-xl transition-all border ${
                          isCompleted
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
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
                  <div className="space-y-2">
                    {revealedIssues.map((issue) => (
                      <div key={issue.id} className="bg-slate-900/50 rounded-lg p-3">
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
                    ))}
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
    </div>
  );
}