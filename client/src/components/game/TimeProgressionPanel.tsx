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
import { Clock, TrendingUp, Home, Play, Loader2 } from 'lucide-react';
import type { Deal, GameRun, Property } from '@shared/schema';

interface TimeProgressionPanelProps {
  gameRun: GameRun;
  deals: Deal[];
  properties: Property[];
  onAdvanceWeek: () => Promise<void>;
}

export function TimeProgressionPanel({
  gameRun,
  deals,
  properties,
  onAdvanceWeek,
}: TimeProgressionPanelProps) {
  const [isAdvancing, setIsAdvancing] = useState(false);

  // Filter active deals
  const activeRentals = deals.filter(d => d.status === 'active_rental');
  const flipsInRehab = deals.filter(d => d.status === 'in_rehab');

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

  const hasActiveProperties = activeRentals.length > 0 || flipsInRehab.length > 0;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
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
          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Active Rentals ({activeRentals.length})
            </h4>
            <div className="space-y-2">
              {activeRentals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-white border rounded-lg p-3 flex items-center justify-between"
                >
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
              ))}
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
                  <div key={deal.id} className="bg-white border rounded-lg p-3">
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
