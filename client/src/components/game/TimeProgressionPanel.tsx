/**
 * Time Progression Panel - Compact Version
 *
 * Shows time status, active properties and allows player to advance game week
 * Click on a property to see detailed financials
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Clock, Home, Play, Loader2, DollarSign, TrendingUp, Info } from 'lucide-react';
import type { Deal, GameRun, Property } from '@shared/schema';

interface TimeProgressionPanelProps {
  gameRun: GameRun;
  deals: Deal[];
  properties: Property[];
  onAdvanceWeek: () => Promise<void>;
  onSellRental?: (dealId: number) => Promise<void>;
  onSellFlip?: (dealId: number) => Promise<void>;
}

function RentalFinancialDetails({ deal, propertyName }: { deal: Deal; propertyName: string }) {
  const outputs = deal.proFormaOutputs as any;
  const inputs = deal.proFormaInputs as any;
  
  // Helper to format currency (whole dollars)
  const fmt = (n: number) => Math.round(n).toLocaleString();
  
  const monthlyRent = outputs?.monthlyGrossRent || inputs?.expectedRent || 0;
  const monthlyVacancy = outputs?.monthlyVacancyLoss || 0;
  const monthlyOpEx = outputs?.monthlyOperatingExpenses || 0;
  const monthlyDebt = outputs?.monthlyDebtService || outputs?.debtServiceMonthly || 0;
  const monthlyCashFlow = outputs?.cashFlowMonthly || 0;
  const weeklyIncome = deal.weeklyIncome || 0;
  
  const vacancyRate = outputs?.effectiveVacancyRate?.toFixed(1) || inputs?.vacancyRate || '?';
  const ltv = inputs?.ltv || 0;
  const purchasePrice = deal.purchasePrice || 0;
  
  // Check if this is a problem deal (no rent but has mortgage)
  const hasNoRent = monthlyRent === 0 && monthlyDebt > 0;
  
  return (
    <div className="space-y-3 text-sm">
      <div className="font-semibold text-white border-b border-white/20 pb-2">
        {propertyName}
      </div>
      
      {hasNoRent && (
        <div className="bg-red-900/40 border border-red-500/50 rounded px-2 py-1.5 text-xs text-red-300">
          ⚠️ No rent income! You're only paying mortgage costs.
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
            <span className="text-gray-400">Vacancy ({vacancyRate}%)</span>
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
          <span className="text-white font-medium">Weekly Cost</span>
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
    </div>
  );
}

function FlipFinancialDetails({ deal, propertyName }: { deal: Deal; propertyName: string }) {
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
          <span className="text-white">{rehabWeeks} weeks total</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-400 font-medium">Time Remaining</span>
          <span className="text-amber-400 font-bold">{weeksLeft} weeks</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-1.5 mt-1.5">
          <span className="text-white font-medium">Projected Profit</span>
          <span className={`font-bold ${projectedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {projectedProfit >= 0 ? '+' : ''}${projectedProfit.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TimeProgressionPanel({
  gameRun,
  deals,
  properties,
  onAdvanceWeek,
  onSellRental,
  onSellFlip,
}: TimeProgressionPanelProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [sellingDealId, setSellingDealId] = useState<number | null>(null);

  const handleSellRental = async (dealId: number) => {
    if (!onSellRental) return;
    setSellingDealId(dealId);
    try {
      await onSellRental(dealId);
    } finally {
      setSellingDealId(null);
    }
  };

  const handleSellFlip = async (dealId: number) => {
    if (!onSellFlip) return;
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

  // Calculate total weekly income
  const totalWeeklyIncome = activeRentals.reduce((sum, deal) => sum + (deal.weeklyIncome || 0), 0);

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

  const hasActiveProperties = activeRentals.length > 0 || flipsInRehab.length > 0 || flipsReadyToList.length > 0;

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-lg border border-white/10 p-3" data-testid="time-progression-panel">
      {/* Header Row - Time & Advance Button */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white">Week {gameRun.currentWeek}</span>
          <span className="text-xs text-gray-400">• {gameRun.weeksRemaining} left</span>
        </div>
        <Button
          onClick={handleAdvanceWeek}
          disabled={isAdvancing || gameRun.weeksRemaining <= 0}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 h-8"
        >
          {isAdvancing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Next Week
            </>
          )}
        </Button>
      </div>

      {/* Weekly Income Summary - Compact */}
      {totalWeeklyIncome !== 0 && (
        <div className={`flex items-center justify-between rounded px-3 py-2 mb-3 ${
          totalWeeklyIncome >= 0 
            ? 'bg-green-900/30 border border-green-500/30' 
            : 'bg-red-900/30 border border-red-500/30'
        }`}>
          <span className={`text-xs ${totalWeeklyIncome >= 0 ? 'text-green-300' : 'text-red-300'}`}>
            Weekly {totalWeeklyIncome >= 0 ? 'Income' : 'Loss'}
          </span>
          <span className={`text-sm font-bold ${totalWeeklyIncome >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalWeeklyIncome >= 0 ? '+' : ''}${totalWeeklyIncome.toLocaleString()}/wk
          </span>
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
            const canSell = gameRun.weeksRemaining >= 2 && onSellRental;
            const propertyName = getPropertyName(deal.propertyId);
            
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
                      <span className={`text-xs font-medium ${(deal.weeklyIncome || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {(deal.weeklyIncome || 0) >= 0 ? '+' : ''}${(deal.weeklyIncome || 0).toLocaleString()}/wk
                      </span>
                      <Info className="w-3 h-3 text-gray-500" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 bg-slate-900 border-slate-700 text-white" align="start">
                    <RentalFinancialDetails deal={deal} propertyName={propertyName} />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-500 hidden sm:inline">
                    ${estimatedSaleMin.toLocaleString()}-${estimatedSaleMax.toLocaleString()}
                  </span>
                  <Button
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white h-6 px-2 text-xs"
                    disabled={!canSell || sellingDealId === deal.id}
                    onClick={() => handleSellRental(deal.id)}
                    data-testid={`button-sell-rental-${deal.id}`}
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
                      <Badge variant="secondary" className="h-5 text-[10px] bg-amber-500/20 text-amber-300 border-amber-500/30">
                        {weeksLeft}w left
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-slate-900 border-slate-700 text-white" align="start">
                  <FlipFinancialDetails deal={deal} propertyName={propertyName} />
                </PopoverContent>
              </Popover>
            );
          })}

          {/* Flips Ready to Sell */}
          {flipsReadyToList.map((deal) => {
            const purchasePrice = deal.purchasePrice || 0;
            const estimatedSaleMin = Math.round(purchasePrice * 0.90);
            const estimatedSaleMax = Math.round(purchasePrice * 1.15);
            const canSell = gameRun.weeksRemaining >= 2 && onSellFlip;
            
            return (
              <div
                key={deal.id}
                className="flex items-center justify-between bg-emerald-900/30 border border-emerald-500/40 rounded px-2 py-1.5"
                data-testid={`flip-deal-${deal.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <DollarSign className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span className="text-xs text-white truncate">{getPropertyName(deal.propertyId)}</span>
                  <Badge className="h-5 text-[10px] bg-emerald-500 text-white">READY</Badge>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-400 hidden sm:inline">
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
    </div>
  );
}
