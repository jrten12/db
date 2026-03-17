/**
 * Time Progression Panel - Compact Version
 *
 * Shows time status, active properties and allows player to advance game week
 * Click on a property to see detailed financials
 */

import { useState } from 'react';
import { playPurchaseConfirmSound } from '@/hooks/useClickSound';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Clock, Home, Play, Loader2, DollarSign, TrendingUp, Info, Landmark, AlertTriangle, RotateCcw, Smile, Meh, Frown, Paintbrush } from 'lucide-react';
import type { Deal, GameRun, Property, Tenant } from '@shared/schema';

function getTenantMood(satisfaction: number): { label: string; color: string; Icon: typeof Smile } {
  if (satisfaction >= 65) return { label: 'Happy', color: 'text-green-400', Icon: Smile };
  if (satisfaction >= 40) return { label: 'Concerned', color: 'text-yellow-400', Icon: Meh };
  return { label: 'Unhappy', color: 'text-red-400', Icon: Frown };
}

interface TimeProgressionPanelProps {
  gameRun: GameRun;
  deals: Deal[];
  properties: Property[];
  tenants?: Tenant[];
  onAdvanceWeek: () => Promise<void>;
  onSellRental?: (dealId: number) => Promise<void>;
  onSellFlip?: (dealId: number) => Promise<void>;
  onSellProperty?: (dealId: number, strategy: 'rent' | 'flip') => void;
  onRefinanceRental?: (dealId: number) => Promise<void>;
  onCosmeticUpgrade?: (dealId: number) => Promise<void>;
}

function getRenovationEstimates(property: any, market: string) {
  const condition = property?.conditionTag || 'Fair';
  const priceTier = property?.price || 200000;
  const conditionCost: Record<string, number> = { 'Fixer-Upper': 1.6, 'Fair': 1.2, 'Good': 1.0, 'Excellent': 0.8 };
  const marketCost: Record<string, number> = { terrible: 0.75, poor: 0.85, neutral: 1.0, good: 1.15, excellent: 1.35 };
  const conditionMult = conditionCost[condition] || 1.0;
  const marketMult = marketCost[market] || 1.0;
  let costMin: number, costMax: number;
  if (priceTier < 200000) { costMin = 2500; costMax = 6000; }
  else if (priceTier < 350000) { costMin = 4000; costMax = 10000; }
  else if (priceTier < 500000) { costMin = 6000; costMax = 15000; }
  else if (priceTier < 750000) { costMin = 8000; costMax = 22000; }
  else { costMin = 12000; costMax = 35000; }
  costMin = Math.round(costMin * conditionMult * marketMult);
  costMax = Math.round(costMax * conditionMult * marketMult);
  const marketSuccess: Record<string, number> = { terrible: 40, poor: 52, neutral: 65, good: 78, excellent: 88 };
  let successRate = marketSuccess[market] || 65;
  if (condition === 'Fixer-Upper' || condition === 'Fair') successRate = Math.min(95, successRate + 8);
  else if (condition === 'Excellent') successRate = Math.max(25, successRate - 12);
  const conditionBoost: Record<string, string> = { 'Fixer-Upper': 'High', 'Fair': 'Medium-High', 'Good': 'Medium', 'Excellent': 'Low' };
  const potential = conditionBoost[condition] || 'Medium';
  return { costMin, costMax, successRate: Math.round(successRate), potential, condition };
}

function RenovationSection({ deal, property, market, onRenovate, isUpgrading }: {
  deal: Deal; property: any; market: string;
  onRenovate?: (dealId: number) => Promise<void>;
  isUpgrading: boolean;
}) {
  const outputs = deal.proFormaOutputs as any;
  if (!onRenovate) return null;

  if (outputs?.cosmeticUpgradeApplied) {
    const rentBoost = outputs.cosmeticUpgradeRentBoost;
    const saleBoost = outputs.cosmeticUpgradeSaleBoost;
    const upgradeCost = outputs.cosmeticUpgradeCost || 0;
    const hasBoost = (rentBoost && rentBoost > 0) || (saleBoost && saleBoost > 0);
    return (
      <div className={`border-t border-white/10 pt-2.5 mt-2`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Paintbrush className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-violet-300">Renovation Complete</span>
        </div>
        <div className="text-xs text-gray-400 space-y-0.5">
          <div className="flex justify-between">
            <span>Cost</span>
            <span className="text-gray-300">${upgradeCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Result</span>
            <span className={hasBoost ? 'text-green-400' : 'text-gray-500'}>
              {rentBoost > 0 ? `+${rentBoost}% rent` : saleBoost > 0 ? `+${saleBoost}% sale value` : 'No measurable impact'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const est = getRenovationEstimates(property, market);
  const isRental = deal.status === 'active_rental';
  const monthlyRent = outputs?.monthlyGrossRent || 0;
  const purchasePrice = deal.purchasePrice || property?.price || 0;
  const avgCost = Math.round((est.costMin + est.costMax) / 2);
  let roiHint = '';
  if (isRental && monthlyRent > 0) {
    const midBoostPct = est.potential === 'High' ? 6 : est.potential === 'Medium-High' ? 4.5 : est.potential === 'Medium' ? 3 : 1.5;
    const extraRent = Math.round(monthlyRent * midBoostPct / 100);
    const paybackMonths = avgCost > 0 && extraRent > 0 ? Math.round(avgCost / extraRent) : 0;
    roiHint = paybackMonths > 0 ? `~$${extraRent}/mo extra rent, ~${paybackMonths}mo payback` : '';
  } else if (purchasePrice > 0) {
    const midBoostPct = est.potential === 'High' ? 5 : est.potential === 'Medium-High' ? 3.5 : est.potential === 'Medium' ? 2.5 : 1;
    const extraValue = Math.round(purchasePrice * midBoostPct / 100);
    roiHint = extraValue > 0 ? `~$${extraValue.toLocaleString()} potential value add` : '';
  }

  return (
    <div className="border-t border-white/10 pt-2.5 mt-2">
      <div className="flex items-center gap-1.5 mb-2">
        <Paintbrush className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-medium text-violet-300">Renovation Upgrade</span>
      </div>
      <div className="text-xs space-y-1 mb-2.5">
        <div className="flex justify-between text-gray-400">
          <span>Est. Cost</span>
          <span className="text-gray-300">${est.costMin.toLocaleString()} – ${est.costMax.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Success Rate</span>
          <span className={est.successRate >= 70 ? 'text-green-400' : est.successRate >= 50 ? 'text-amber-400' : 'text-red-400'}>
            {est.successRate}%
          </span>
        </div>
        <div className="flex justify-between text-gray-400">
          <span>Upside Potential</span>
          <span className={est.potential === 'High' ? 'text-green-400' : est.potential === 'Low' ? 'text-gray-500' : 'text-amber-300'}>
            {est.potential}
          </span>
        </div>
        {roiHint && (
          <div className="text-gray-500 italic pt-0.5">{roiHint}</div>
        )}
        <div className="text-gray-600 text-[10px] pt-0.5">
          {est.condition === 'Fixer-Upper' || est.condition === 'Fair'
            ? 'Property condition has room for improvement — renovations pay off more here.'
            : est.condition === 'Excellent'
            ? 'Property is already in great shape — limited room for improvement.'
            : 'Moderate improvement potential based on current condition.'}
        </div>
      </div>
      <Button
        size="sm"
        className="w-full bg-violet-600 hover:bg-violet-700 text-white text-xs h-7 gap-1.5"
        disabled={isUpgrading}
        onClick={(e) => {
          e.stopPropagation();
          onRenovate(deal.id);
        }}
        data-testid={`button-renovate-${deal.id}`}
        data-no-click-sound
      >
        {isUpgrading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <Paintbrush className="w-3 h-3" />
            Renovate — ~${avgCost.toLocaleString()}
          </>
        )}
      </Button>
    </div>
  );
}

function RentalFinancialDetails({ deal, propertyName, property, market, onRenovate, isUpgrading }: {
  deal: Deal; propertyName: string; property?: any;
  market?: string; onRenovate?: (dealId: number) => Promise<void>; isUpgrading?: boolean;
}) {
  const outputs = deal.proFormaOutputs as any;
  const inputs = deal.proFormaInputs as any;
  
  const fmt = (n: number) => Math.round(n).toLocaleString();
  
  const weeklyIncome = deal.weeklyIncome || 0;
  
  const monthlyRent = outputs?.monthlyGrossRent || 0;
  const monthlyVacancy = outputs?.monthlyVacancyLoss || 0;
  const monthlyOpEx = outputs?.monthlyOperatingExpenses || 0;
  const monthlyDebt = outputs?.debtServiceMonthly || outputs?.monthlyDebtService || 0;
  
  const monthlyCashFlow = monthlyRent - monthlyVacancy - monthlyOpEx - monthlyDebt;
  
  const displayVacancyRate = outputs?.effectiveVacancyRate?.toFixed(1) || inputs?.vacancyRate || '?';
  const ltv = inputs?.ltv || 0;
  const purchasePrice = deal.purchasePrice || 0;
  
  const hasNoRent = monthlyRent === 0 && monthlyDebt > 0 && weeklyIncome <= 0;
  
  const realityCheck = outputs?.realityCheck;
  const projectedRent = inputs?.expectedRent || 0;
  const projectedVacancy = inputs?.vacancyRate || 0;
  const hasProjectionDifference = realityCheck && (realityCheck.rentDelta !== 0 || realityCheck.vacancyDelta !== 0);
  
  return (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-white border-b border-white/20 pb-2">
        {propertyName}
      </div>
      
      {hasNoRent && (
        <div className="bg-red-900/40 border border-red-500/50 rounded px-2 py-1.5 text-xs text-red-300">
          No rent income! You're only paying mortgage costs.
        </div>
      )}

      {hasProjectionDifference && (
        <div className={`rounded-lg p-2.5 border text-xs ${
          realityCheck.wasOptimistic 
            ? 'bg-red-900/30 border-red-500/30' 
            : 'bg-emerald-900/30 border-emerald-500/30'
        }`} data-testid="reality-check-comparison">
          <div className="font-semibold mb-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className={realityCheck.wasOptimistic ? 'text-red-300' : 'text-emerald-300'}>
              Projection vs. Reality
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs mb-1.5">
            <span className="text-gray-500"></span>
            <span className="text-gray-400 text-center">You Said</span>
            <span className="text-gray-400 text-center">Actual</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <span className="text-gray-400">Rent</span>
            <span className="text-center text-gray-300">${fmt(projectedRent)}</span>
            <span className={`text-center font-medium ${monthlyRent > projectedRent ? 'text-emerald-400' : monthlyRent < projectedRent ? 'text-red-400' : 'text-gray-300'}`}>
              ${fmt(monthlyRent)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs mt-1">
            <span className="text-gray-400">Vacancy</span>
            <span className="text-center text-gray-300">{projectedVacancy}%</span>
            <span className={`text-center font-medium ${Number(displayVacancyRate) < projectedVacancy ? 'text-emerald-400' : Number(displayVacancyRate) > projectedVacancy ? 'text-red-400' : 'text-gray-300'}`}>
              {displayVacancyRate}%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs mt-1 border-t border-white/10 pt-1.5">
            <span className="text-gray-400">Cash Flow</span>
            <span className="text-center text-gray-300">${fmt(realityCheck.projectedCashFlow)}</span>
            <span className={`text-center font-bold ${realityCheck.actualCashFlow >= realityCheck.projectedCashFlow ? 'text-emerald-400' : 'text-red-400'}`}>
              ${fmt(realityCheck.actualCashFlow)}
            </span>
          </div>
          {realityCheck.explanation && (
            <p className={`mt-2 text-xs leading-tight ${realityCheck.wasOptimistic ? 'text-red-400/70' : 'text-emerald-400/70'}`}>
              {realityCheck.explanation}
            </p>
          )}
        </div>
      )}
      
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-400">Monthly Rent</span>
          <span className={monthlyRent > 0 ? 'text-green-400 font-medium' : 'text-gray-500'}>
            ${fmt(monthlyRent)}
          </span>
        </div>
        {monthlyVacancy > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Vacancy ({displayVacancyRate}%)</span>
            <span className="text-red-400">-${fmt(Math.abs(monthlyVacancy))}</span>
          </div>
        )}
        {monthlyOpEx > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Operating Expenses</span>
            <span className="text-red-400">-${fmt(Math.abs(monthlyOpEx))}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Mortgage Payment</span>
          <span className="text-red-400">-${fmt(Math.abs(monthlyDebt))}</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
          <span className="text-white font-medium">Monthly Cash Flow</span>
          <span className={`font-bold ${Math.round(monthlyCashFlow) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {Math.round(monthlyCashFlow) >= 0 ? '+' : ''}{fmt(monthlyCashFlow)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white font-medium">Monthly Income</span>
          <span className={`font-bold ${weeklyIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {weeklyIncome >= 0 ? '+' : ''}{fmt(weeklyIncome)}
          </span>
        </div>
      </div>
      
      {purchasePrice > 0 && (
        <div className="text-xs text-gray-500 border-t border-white/10 pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Purchase Price</span>
            <span>${fmt(purchasePrice)}</span>
          </div>
          <div className="flex justify-between">
            <span>LTV</span>
            <span>{ltv}%</span>
          </div>
        </div>
      )}

      <RenovationSection
        deal={deal}
        property={property}
        market={market || 'neutral'}
        onRenovate={onRenovate}
        isUpgrading={isUpgrading || false}
      />
    </div>
  );
}

function FlipFinancialDetails({ deal, propertyName, property, market, onRenovate, isUpgrading }: {
  deal: Deal; propertyName: string; property?: any;
  market?: string; onRenovate?: (dealId: number) => Promise<void>; isUpgrading?: boolean;
}) {
  const outputs = deal.proFormaOutputs as any;
  const inputs = deal.proFormaInputs as any;
  
  const rehabBudget = inputs?.rehabBudget || 0;
  const rehabWeeks = inputs?.rehabWeeks || 0;
  const contractorType = inputs?.contractorType || 'standard';
  const projectedProfit = outputs?.profit || 0;
  const purchasePrice = deal.purchasePrice || 0;
  const weeksLeft = deal.weeksUntilCompletion || 0;
  
  return (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-white border-b border-white/20 pb-2">
        {propertyName}
      </div>
      
      <div className="space-y-1.5">
        {purchasePrice > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Purchase Price</span>
            <span className="text-white">${purchasePrice.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">Rehab Budget</span>
          <span className="text-white">${rehabBudget.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Contractor</span>
          <span className="text-white capitalize">{contractorType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Timeline</span>
          <span className="text-white">{rehabWeeks} months total</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-400 font-medium">Time Remaining</span>
          <span className="text-amber-400 font-bold">{weeksLeft} months</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
          <span className="text-white font-medium">Projected Profit</span>
          <span className={`font-bold ${projectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {projectedProfit >= 0 ? '+' : ''}${projectedProfit.toLocaleString()}
          </span>
        </div>
      </div>

      <RenovationSection
        deal={deal}
        property={property}
        market={market || 'neutral'}
        onRenovate={onRenovate}
        isUpgrading={isUpgrading || false}
      />
    </div>
  );
}

export function TimeProgressionPanel({
  gameRun,
  deals,
  properties,
  tenants = [],
  onAdvanceWeek,
  onSellRental,
  onSellFlip,
  onSellProperty,
  onRefinanceRental,
  onCosmeticUpgrade,
}: TimeProgressionPanelProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [sellingDealId, setSellingDealId] = useState<number | null>(null);
  const [refinancingDealId, setRefinancingDealId] = useState<number | null>(null);
  const [upgradingDealId, setUpgradingDealId] = useState<number | null>(null);

  const SEASONING_WEEKS = 8; // Must match server

  const handleRefinanceRental = async (dealId: number) => {
    if (!onRefinanceRental) return;
    setRefinancingDealId(dealId);
    try {
      await onRefinanceRental(dealId);
    } finally {
      setRefinancingDealId(null);
    }
  };

  const handleSellRental = async (dealId: number) => {
    if (onSellProperty) {
      onSellProperty(dealId, 'rent');
      return;
    }
    if (!onSellRental) return;
    playPurchaseConfirmSound();
    setSellingDealId(dealId);
    try {
      await onSellRental(dealId);
    } finally {
      setSellingDealId(null);
    }
  };

  const handleSellFlip = async (dealId: number) => {
    if (onSellProperty) {
      onSellProperty(dealId, 'flip');
      return;
    }
    if (!onSellFlip) return;
    playPurchaseConfirmSound();
    setSellingDealId(dealId);
    try {
      await onSellFlip(dealId);
    } finally {
      setSellingDealId(null);
    }
  };

  // Filter active deals
  const activeRentals = deals.filter(d => d.status === 'active_rental');
  const flipsInRehab = deals.filter(d => d.status === 'in_rehab');
  const flipsReadyToList = deals.filter(d => d.status === 'ready_to_list');

  // Calculate total monthly income (stored in weeklyIncome field for historical reasons)
  const totalMonthlyIncome = activeRentals.reduce((sum, deal) => sum + (deal.weeklyIncome || 0), 0);

  const handleAdvanceWeek = async () => {
    setIsAdvancing(true);
    try {
      await onAdvanceWeek();
    } finally {
      setIsAdvancing(false);
    }
  };

  const getPropertyName = (propertyId: number | null) => {
    if (!propertyId) return 'Unknown';
    const property = properties.find(p => p.id === propertyId);
    return property?.name || `#${propertyId}`;
  };
  
  const getProperty = (propertyId: number | null) => {
    if (!propertyId) return undefined;
    return properties.find(p => p.id === propertyId);
  };

  const hasActiveProperties = activeRentals.length > 0 || flipsInRehab.length > 0 || flipsReadyToList.length > 0;

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-lg border border-white/10 p-3" data-testid="time-progression-panel">
      {/* Header Row - Time & Advance Button */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Month {gameRun.currentWeek}</span>
          <span className="text-xs text-gray-400">• {gameRun.weeksRemaining} months left</span>
        </div>
        <Button
          onClick={handleAdvanceWeek}
          disabled={isAdvancing || gameRun.weeksRemaining <= 0}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 h-8"
          data-no-click-sound
        >
          {isAdvancing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Next Month
            </>
          )}
        </Button>
      </div>

      {/* Monthly Income Summary - Compact */}
      {totalMonthlyIncome !== 0 && (
        <div className={`flex items-center justify-between rounded px-3 py-2 mb-3 ${
          totalMonthlyIncome >= 0 
            ? 'bg-green-900/30 border border-green-500/30' 
            : 'bg-red-900/30 border border-red-500/30'
        }`}>
          <span className={`text-xs ${totalMonthlyIncome >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            Monthly {totalMonthlyIncome >= 0 ? 'Income' : 'Loss'}
          </span>
          <span className={`text-sm font-bold ${totalMonthlyIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalMonthlyIncome >= 0 ? '+' : ''}${totalMonthlyIncome.toLocaleString()}/mo
          </span>
        </div>
      )}

      {/* Portfolio Cycle Indicator - Shows investment progression */}
      {hasActiveProperties && (
        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-2 px-2">
          <span className="text-emerald-400">Deal</span>
          <span>→</span>
          <span className={totalMonthlyIncome > 0 ? 'text-green-400' : 'text-gray-400'}>Cash Flow</span>
          <span>→</span>
          <span className={activeRentals.some(d => {
            const weeksHeld = gameRun.currentWeek - ((d as any).purchaseWeek ?? 0);
            return weeksHeld >= SEASONING_WEEKS;
          }) ? 'text-blue-400' : 'text-gray-400'}>Refinance</span>
          <span>→</span>
          <span className="text-amber-400">Scale</span>
        </div>
      )}

      {/* Active Properties - Compact List */}
      {hasActiveProperties && (
        <div className="space-y-2">
          {/* Active Rentals */}
          {activeRentals.map((deal) => {
            const purchasePrice = deal.purchasePrice || 0;
            const estimatedSaleMin = Math.round(purchasePrice * 0.85);
            const estimatedSaleMax = Math.round(purchasePrice * 1.10);
            const canSell = !!onSellRental;
            const propertyName = getPropertyName(deal.propertyId);
            
            // Refinancing check - use gameRun.currentWeek for consistency with server
            const currentWeek = gameRun.currentWeek;
            const purchaseWeek = (deal as any).purchaseWeek ?? 0;
            const lastRefinanceWeek = (deal as any).lastRefinanceWeek;
            const weeksHeld = currentWeek - purchaseWeek;
            const REFINANCE_COOLDOWN = 4; // Must wait 4 weeks between refinances
            
            // Check seasoning for first refi, or cooldown for subsequent refis
            const weeksSinceLastRefi = lastRefinanceWeek != null ? currentWeek - lastRefinanceWeek : Infinity;
            const canRefinance = weeksHeld >= SEASONING_WEEKS && 
                                 onRefinanceRental && 
                                 weeksSinceLastRefi >= REFINANCE_COOLDOWN;
            const weeksUntilRefinance = lastRefinanceWeek != null 
              ? Math.max(0, REFINANCE_COOLDOWN - weeksSinceLastRefi)
              : Math.max(0, SEASONING_WEEKS - weeksHeld);
            
            return (
              <div
                key={deal.id}
                className="flex items-center justify-between bg-white/5 rounded px-2 py-1.5 border border-white/10"
                data-testid={`rental-deal-${deal.id}`}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 min-w-0 hover:bg-white/10 rounded px-1 py-0.5 transition-colors cursor-pointer">
                      <Home className={`w-3 h-3 flex-shrink-0 ${(deal.weeklyIncome || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                      <span className="text-xs text-white truncate">{propertyName}</span>
                      {(() => {
                        const tenant = tenants.find(t => t.dealId === deal.id);
                        if (tenant && tenant.satisfaction != null) {
                          const mood = getTenantMood(tenant.satisfaction);
                          const tip = tenant.satisfaction < 40
                            ? `${mood.label} (${tenant.satisfaction}%) — At risk of leaving!`
                            : tenant.satisfaction < 65
                            ? `${mood.label} (${tenant.satisfaction}%) — Getting frustrated`
                            : `${mood.label} (${tenant.satisfaction}%)`;
                          return (
                            <span className={`flex items-center ${mood.color}`} title={tip} data-testid={`tenant-mood-${deal.id}`}>
                              <mood.Icon className="w-3 h-3" />
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <span className={`text-xs font-medium ${(deal.weeklyIncome || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(deal.weeklyIncome || 0) >= 0 ? '+' : ''}${(deal.weeklyIncome || 0).toLocaleString()}/mo
                      </span>
                      <Info className="w-3 h-3 text-gray-500" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-white" align="start">
                    <RentalFinancialDetails
                      deal={deal}
                      propertyName={propertyName}
                      property={getProperty(deal.propertyId)}
                      market={(gameRun as any).marketCondition || 'neutral'}
                      onRenovate={onCosmeticUpgrade ? async (id) => {
                        setUpgradingDealId(id);
                        try { await onCosmeticUpgrade(id); } finally { setUpgradingDealId(null); }
                      } : undefined}
                      isUpgrading={upgradingDealId === deal.id}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {onRefinanceRental && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          variant={canRefinance ? "default" : "ghost"}
                          className={canRefinance ? "gap-1.5" : "text-gray-500 gap-1.5"}
                          disabled={!canRefinance || refinancingDealId === deal.id}
                          onClick={(e) => {
                            if (canRefinance) {
                              e.preventDefault();
                              handleRefinanceRental(deal.id);
                            }
                          }}
                          data-testid={`button-refinance-rental-${deal.id}`}
                          data-no-click-sound
                        >
                          {refinancingDealId === deal.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Landmark className="w-4 h-4" />
                              <span>Refi</span>
                            </>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 bg-slate-900 border-slate-700 text-white text-sm p-3">
                        {canRefinance ? (
                          <div className="space-y-2">
                            <p className="text-blue-300 font-medium">Cash-Out Refinance Available</p>
                            <p className="text-gray-300 text-xs">Tap to access your equity. Get cash back while keeping the property.</p>
                          </div>
                        ) : weeksUntilRefinance > 0 ? (
                          <div className="space-y-1">
                            <p className="text-amber-400 font-medium">Seasoning Required</p>
                            <p className="text-gray-300 text-xs">{weeksUntilRefinance} more months until you can refinance</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Refinancing not available</span>
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    ${estimatedSaleMin.toLocaleString()}-${estimatedSaleMax.toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white h-6 px-2 text-xs"
                    disabled={!canSell || sellingDealId === deal.id}
                    onClick={() => handleSellRental(deal.id)}
                    data-testid={`button-sell-rental-${deal.id}`}
                    data-no-click-sound
                  >
                    {sellingDealId === deal.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Sell'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Flips in Rehab */}
          {flipsInRehab.map((deal) => {
            const weeksLeft = deal.weeksUntilCompletion || 0;
            const totalWeeks = (deal.proFormaInputs as any)?.rehabWeeks || weeksLeft;
            const progress = totalWeeks > 0 ? ((totalWeeks - weeksLeft) / totalWeeks) * 100 : 0;
            const propertyName = getPropertyName(deal.propertyId);

            return (
              <Popover key={deal.id}>
                <PopoverTrigger asChild>
                  <div
                    className="bg-amber-900/20 border border-amber-500/30 rounded px-2 py-1.5 cursor-pointer hover:bg-amber-900/30 transition-colors"
                    data-testid={`flip-deal-${deal.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 text-amber-400" />
                        <span className="text-xs text-white">{propertyName}</span>
                        <Info className="w-3 h-3 text-gray-500" />
                      </div>
                      <Badge variant="secondary" className="h-5 text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                        {weeksLeft}mo left
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-white" align="start">
                  <FlipFinancialDetails
                    deal={deal}
                    propertyName={propertyName}
                    property={getProperty(deal.propertyId)}
                    market={(gameRun as any).marketCondition || 'neutral'}
                    onRenovate={onCosmeticUpgrade ? async (id) => {
                      setUpgradingDealId(id);
                      try { await onCosmeticUpgrade(id); } finally { setUpgradingDealId(null); }
                    } : undefined}
                    isUpgrading={upgradingDealId === deal.id}
                  />
                </PopoverContent>
              </Popover>
            );
          })}

          {/* Flips Ready to Sell */}
          {flipsReadyToList.map((deal) => {
            const purchasePrice = deal.purchasePrice || 0;
            const estimatedSaleMin = Math.round(purchasePrice * 0.90);
            const estimatedSaleMax = Math.round(purchasePrice * 1.15);
            const canSell = !!onSellFlip;
            
            return (
              <div
                key={deal.id}
                className="flex items-center justify-between bg-emerald-900/30 border border-emerald-500/40 rounded px-2 py-1.5"
                data-testid={`flip-deal-${deal.id}`}
              >
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-2 min-w-0 hover:bg-white/10 rounded px-1 py-0.5 transition-colors cursor-pointer">
                      <DollarSign className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-white truncate">{getPropertyName(deal.propertyId)}</span>
                      <Badge className="h-5 text-xs bg-emerald-500 text-white">READY</Badge>
                      <Info className="w-3 h-3 text-gray-500" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-slate-900 border-slate-700 text-white" align="start">
                    <FlipFinancialDetails
                      deal={deal}
                      propertyName={getPropertyName(deal.propertyId)}
                      property={getProperty(deal.propertyId)}
                      market={(gameRun as any).marketCondition || 'neutral'}
                      onRenovate={onCosmeticUpgrade ? async (id) => {
                        setUpgradingDealId(id);
                        try { await onCosmeticUpgrade(id); } finally { setUpgradingDealId(null); }
                      } : undefined}
                      isUpgrading={upgradingDealId === deal.id}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    ${estimatedSaleMin.toLocaleString()}-${estimatedSaleMax.toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 px-2 text-xs font-semibold"
                    disabled={!canSell || sellingDealId === deal.id}
                    onClick={() => handleSellFlip(deal.id)}
                    data-testid={`button-sell-flip-${deal.id}`}
                  >
                    {sellingDealId === deal.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      'Sell!'
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!hasActiveProperties && (
        <p className="text-xs text-gray-500 text-center py-2">No active properties yet</p>
      )}

      {gameRun.cash < 5000 && gameRun.weeksRemaining > 0 && !hasActiveProperties && (
        <div className="mt-2 p-2.5 bg-amber-900/30 border border-amber-500/30 rounded-lg" data-testid="low-cash-hint">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-amber-300 font-medium">Low on cash?</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                You can still advance time — look for cheaper properties, or tap the menu to start a new game.
              </p>
            </div>
          </div>
        </div>
      )}

      {gameRun.cash < 5000 && hasActiveProperties && flipsReadyToList.length > 0 && (
        <div className="mt-2 p-2.5 bg-emerald-900/30 border border-emerald-500/30 rounded-lg" data-testid="sell-flip-hint">
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-300/80">
              You have flips ready to sell! Tap the "Sell!" button above to cash out.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
