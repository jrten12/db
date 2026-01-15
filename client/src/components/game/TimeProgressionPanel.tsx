/**
 * Time Progression Panel
 *
 * Shows active properties and allows player to advance game week
 * Displays weekly income streams and flip progress
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, TrendingUp, Home, Play, Loader2, DollarSign } from 'lucide-react';
import type { Deal, GameRun, Property } from '@shared/schema';

interface TimeProgressionPanelProps {
  gameRun: GameRun;
  deals: Deal[];
  properties: Property[];
  onAdvanceWeek: () => Promise<void>;
  onSellRental?: (dealId: number) => Promise<void>;
  onSellFlip?: (dealId: number) => Promise<void>;
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
    if (!propertyId) return 'Unknown Property';
    const property = properties.find(p => p.id === propertyId);
    return property?.name || `Property #${propertyId}`;
  };

  const hasActiveProperties = activeRentals.length > 0 || flipsInRehab.length > 0 || flipsReadyToList.length > 0;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50" data-testid="time-progression-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Time & Income
            </CardTitle>
            <CardDescription>
              Week {gameRun.currentWeek} • {gameRun.weeksRemaining} weeks remaining
            </CardDescription>
          </div>
          <Button
            onClick={handleAdvanceWeek}
            disabled={isAdvancing || gameRun.weeksRemaining <= 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAdvancing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Advancing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Advance Week
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Weekly Income Summary */}
        {totalWeeklyIncome > 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Weekly Income</p>
                  <p className="text-xs text-green-700">Paid every week</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-green-700">
                +${totalWeeklyIncome.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Active Rentals */}
        {activeRentals.length > 0 && (
          <div data-testid="active-deals-section">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Active Rentals ({activeRentals.length})
            </h4>
            <div className="space-y-2">
              {activeRentals.map((deal) => {
                const purchasePrice = deal.purchasePrice || 0;
                const estimatedSaleMin = Math.round(purchasePrice * 0.90);
                const estimatedSaleMax = Math.round(purchasePrice * 1.15);
                const canSell = gameRun.weeksRemaining >= 2 && onSellRental;
                
                return (
                  <div
                    key={deal.id}
                    className="bg-white border rounded-lg p-3"
                    data-testid={`rental-deal-${deal.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{getPropertyName(deal.propertyId)}</p>
                        <p className="text-xs text-gray-600">
                          Last payment: Week {deal.lastIncomePaymentWeek || 0}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          +${(deal.weeklyIncome || 0).toLocaleString()}/wk
                        </p>
                        <p className="text-xs text-gray-500">
                          ~${Math.floor((deal.weeklyIncome || 0) * 4.33).toLocaleString()}/mo
                        </p>
                      </div>
                    </div>
                    {purchasePrice > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <p>Sale estimate: ${estimatedSaleMin.toLocaleString()} - ${estimatedSaleMax.toLocaleString()}</p>
                          <p className="text-amber-600">Selling costs 2 weeks</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          disabled={!canSell || sellingDealId === deal.id}
                          onClick={() => handleSellRental(deal.id)}
                          data-testid={`button-sell-rental-${deal.id}`}
                        >
                          {sellingDealId === deal.id ? (
                            <Loader2 className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <DollarSign className="w-3 h-3 mr-1" />
                          )}
                          Sell Property
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Flips in Progress */}
        {flipsInRehab.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Flips in Rehab ({flipsInRehab.length})
            </h4>
            <div className="space-y-2">
              {flipsInRehab.map((deal) => {
                const weeksLeft = deal.weeksUntilCompletion || 0;
                const totalWeeks = (deal.proFormaInputs as any)?.rehabWeeks || weeksLeft;
                const progress = totalWeeks > 0 ? ((totalWeeks - weeksLeft) / totalWeeks) * 100 : 0;

                return (
                  <div key={deal.id} className="relative bg-white border-2 border-amber-300 rounded-lg p-3 overflow-hidden">
                    {/* Owner overlay */}
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-2 py-0.5 rounded-bl font-bold uppercase">
                      You Own This
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">{getPropertyName(deal.propertyId)}</p>
                      <Badge variant={weeksLeft <= 2 ? 'default' : 'secondary'}>
                        {weeksLeft} {weeksLeft === 1 ? 'week' : 'weeks'} left
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-gray-600 mt-1">
                      Projected profit: ${((deal.proFormaOutputs as any)?.profit || 0).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Flips Ready to Sell */}
        {flipsReadyToList.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Ready to Sell ({flipsReadyToList.length})
            </h4>
            <div className="space-y-2">
              {flipsReadyToList.map((deal) => {
                const purchasePrice = deal.purchasePrice || 0;
                const estimatedSaleMin = Math.round(purchasePrice * 0.90);
                const estimatedSaleMax = Math.round(purchasePrice * 1.15);
                const canSell = gameRun.weeksRemaining >= 2 && onSellFlip;
                
                return (
                  <div
                    key={deal.id}
                    className="relative bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-400 rounded-lg p-3 overflow-hidden shadow-lg"
                    data-testid={`flip-deal-${deal.id}`}
                  >
                    {/* Owner overlay */}
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-bl font-bold uppercase">
                      You Own This
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{getPropertyName(deal.propertyId)}</p>
                        <p className="text-xs text-emerald-700 font-semibold">
                          Rehab Complete! Ready to flip
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                        READY
                      </Badge>
                    </div>
                    <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                      <div className="text-xs text-gray-600">
                        <p className="font-semibold text-emerald-800">
                          Sale estimate: ${estimatedSaleMin.toLocaleString()} - ${estimatedSaleMax.toLocaleString()}
                        </p>
                        <p className="text-amber-600">Selling costs 2 weeks</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                        disabled={!canSell || sellingDealId === deal.id}
                        onClick={() => handleSellFlip(deal.id)}
                        data-testid={`button-sell-flip-${deal.id}`}
                      >
                        {sellingDealId === deal.id ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                          <DollarSign className="w-3 h-3 mr-1" />
                        )}
                        Sell Now!
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasActiveProperties && (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">No active properties yet</p>
            <p className="text-xs mt-1">Purchase a property to start earning income!</p>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
          <p className="font-semibold mb-1">💡 How it works:</p>
          <ul className="space-y-1 pl-4">
            <li>• Active rentals pay income <strong>every week</strong></li>
            <li>• Flips complete after rehab period, returning proceeds to your balance</li>
            <li>• Click "Advance Week" to progress time and collect income</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
