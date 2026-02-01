import { useState } from 'react';
import { formatCurrency } from '@/lib/gameData';
import type { LedgerEntry, Deal, Property } from '@shared/schema';
import { ArrowUpCircle, ArrowDownCircle, X, Wallet, Building2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LedgerPanelProps {
  entries: LedgerEntry[];
  startingCash: number;
  deals: Deal[];
  properties: Property[];
  onClose: () => void;
  onOpexClick?: (dealId: number) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  starting_balance: 'Starting Balance',
  due_diligence: 'Due Diligence',
  down_payment: 'Down Payment',
  closing_cost: 'Closing Costs',
  loan_fee: 'Loan Fees',
  holding_cost: 'Holding Costs',
  rehab: 'Rehab Costs',
  income: 'Income',
  expense: 'Expense',
  sale_proceeds: 'Sale Proceeds',
  rent_income: 'Rent Income',
  debt_service: 'Mortgage Payment',
  refinance_proceeds: 'Refinance Cash Out',
  refinance_fees: 'Refinance Fees',
};

const CATEGORY_COLORS: Record<string, string> = {
  starting_balance: 'text-blue-400',
  due_diligence: 'text-amber-400',
  down_payment: 'text-purple-400',
  closing_cost: 'text-orange-400',
  loan_fee: 'text-pink-400',
  holding_cost: 'text-red-400',
  rehab: 'text-yellow-400',
  income: 'text-emerald-400',
  expense: 'text-red-400',
  sale_proceeds: 'text-green-400',
  rent_income: 'text-emerald-400',
  debt_service: 'text-orange-400',
  refinance_proceeds: 'text-cyan-400',
  refinance_fees: 'text-pink-400',
};

interface UnitPnL {
  dealId: number;
  propertyId: number;
  propertyName: string;
  neighborhood: string;
  strategy: string;
  status: string;
  totalIncome: number;
  totalExpenses: number;
  netPnL: number;
  entries: LedgerEntry[];
}

function UnitPnLCard({ unit, isExpanded, onToggle }: { unit: UnitPnL; isExpanded: boolean; onToggle: () => void }) {
  const isProfitable = unit.netPnL >= 0;
  const strategyLabel = unit.strategy === 'flip' ? 'Flip' : 'Rental';
  const isSold = unit.status === 'sold_rental' || unit.status === 'completed';
  const statusLabel = getStatusLabel(unit.status);
  
  return (
    <div className={`rounded-xl border overflow-hidden ${
      isSold 
        ? 'bg-slate-800/30 border-slate-700/50 opacity-75' 
        : 'bg-slate-800/50 border-slate-700'
    }`}>
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-slate-700/30 transition-colors"
        data-testid={`unit-pnl-card-${unit.dealId}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${isSold ? 'bg-slate-700/50' : 'bg-slate-700'}`}>
              <Building2 className={`w-5 h-5 ${isSold ? 'text-gray-500' : 'text-blue-400'}`} />
            </div>
            <div className="min-w-0">
              <div className={`font-semibold truncate ${isSold ? 'text-gray-400' : 'text-white'}`}>
                {unit.propertyName}
              </div>
              <div className="text-sm text-gray-400">{unit.neighborhood}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  unit.strategy === 'flip' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {strategyLabel}
                </span>
                {isSold ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-600/50 text-gray-400 border border-gray-500/30">
                    SOLD
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    {statusLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-lg font-bold font-mono ${isProfitable ? 'text-emerald-400' : 'text-red-400'}`}>
              {isProfitable ? '+' : ''}{formatCurrency(unit.netPnL)}
            </div>
            <div className="text-xs text-gray-500">Net P&L</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-emerald-500/10 rounded-lg p-2 text-center border border-emerald-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">Income</span>
            </div>
            <div className="text-emerald-400 font-mono font-semibold">
              +{formatCurrency(unit.totalIncome)}
            </div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-400">Expenses</span>
            </div>
            <div className="text-red-400 font-mono font-semibold">
              -{formatCurrency(unit.totalExpenses)}
            </div>
          </div>
        </div>
      </button>
      
      {isExpanded && unit.entries.length > 0 && (
        <div className="border-t border-slate-700 p-3 bg-slate-900/50 max-h-48 overflow-y-auto">
          <div className="text-xs text-gray-400 mb-2 font-medium">Transaction History</div>
          <div className="space-y-1.5">
            {[...unit.entries].sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ).map((entry) => (
              <div 
                key={entry.id}
                className="flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {entry.direction === 'debit' ? (
                    <ArrowDownCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  ) : (
                    <ArrowUpCircle className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  )}
                  <span className={`${CATEGORY_COLORS[entry.category] || 'text-gray-400'} flex-shrink-0`}>
                    {CATEGORY_LABELS[entry.category] || entry.category}
                  </span>
                  <span className="text-gray-500">Wk {entry.gameWeek}</span>
                </div>
                <span className={`font-mono ${entry.direction === 'debit' ? 'text-red-400' : 'text-emerald-400'}`}>
                  {entry.direction === 'debit' ? '-' : '+'}{formatCurrency(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planned: 'Planned',
    in_rehab: 'In Rehab',
    ready_to_list: 'Ready to List',
    leasing: 'Finding Tenants',
    active_rental: 'Active Rental',
    listing: 'Listed for Sale',
    completed: 'Completed',
    sold_rental: 'Sold',
  };
  return labels[status] || status;
}

export function LedgerPanel({ entries, startingCash, deals, properties, onClose, onOpexClick }: LedgerPanelProps) {
  const [expandedUnit, setExpandedUnit] = useState<number | null>(null);
  
  const sortedEntriesAsc = [...entries].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const firstEntry = sortedEntriesAsc[0];
  const lastEntry = sortedEntriesAsc[sortedEntriesAsc.length - 1];
  
  const computedStartingBalance = firstEntry 
    ? firstEntry.balanceAfter + (firstEntry.direction === 'debit' ? firstEntry.amount : -firstEntry.amount)
    : startingCash;

  const currentBalance = lastEntry ? lastEntry.balanceAfter : computedStartingBalance;

  const totalDebits = entries
    .filter(e => e.direction === 'debit')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCredits = entries
    .filter(e => e.direction === 'credit')
    .reduce((sum, e) => sum + e.amount, 0);

  const unitPnLs: UnitPnL[] = deals
    .filter(deal => deal.status !== 'planned')
    .map(deal => {
      const property = properties.find(p => p.id === deal.propertyId);
      const dealEntries = entries.filter(e => e.dealId === deal.id);
      
      const totalIncome = dealEntries
        .filter(e => e.direction === 'credit')
        .reduce((sum, e) => sum + e.amount, 0);
      
      const totalExpenses = dealEntries
        .filter(e => e.direction === 'debit')
        .reduce((sum, e) => sum + e.amount, 0);
      
      return {
        dealId: deal.id,
        propertyId: deal.propertyId,
        propertyName: property?.name || `Property #${deal.propertyId}`,
        neighborhood: property?.neighborhood || 'Unknown',
        strategy: deal.strategy,
        status: deal.status,
        totalIncome,
        totalExpenses,
        netPnL: totalIncome - totalExpenses,
        entries: dealEntries,
      };
    })
    .sort((a, b) => {
      // Active properties first, sold properties last
      const aIsSold = a.status === 'sold_rental' || a.status === 'completed';
      const bIsSold = b.status === 'sold_rental' || b.status === 'completed';
      
      if (aIsSold !== bIsSold) {
        return aIsSold ? 1 : -1; // Active properties come first
      }
      
      // Within same category, sort by deal ID descending (newest first)
      return b.dealId - a.dealId;
    });

  const unassignedEntries = entries.filter(e => !e.dealId);
  const hasUnassigned = unassignedEntries.length > 0;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center z-[60] p-4 pt-[calc(env(safe-area-inset-top,0px)+60px)] md:pt-8" 
      data-testid="ledger-panel"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900/95 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[calc(100vh-80px)] md:max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Financial Ledger</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-colors touch-target"
            data-testid="button-close-ledger"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-slate-700">
          <div className="bg-slate-800/50 rounded-xl p-3 text-center">
            <div className="text-gray-400 text-xs mb-1">Starting</div>
            <div className="text-white font-bold font-mono">{formatCurrency(computedStartingBalance)}</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-3 text-center border border-red-500/30">
            <div className="text-red-400 text-xs mb-1">Total Spent</div>
            <div className="text-red-400 font-bold font-mono">-{formatCurrency(totalDebits)}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-3 text-center border border-emerald-500/30">
            <div className="text-emerald-400 text-xs mb-1">Total Income</div>
            <div className="text-emerald-400 font-bold font-mono">+{formatCurrency(totalCredits)}</div>
          </div>
          <div className={`rounded-xl p-3 text-center border ${currentBalance >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
            <div className={`text-xs mb-1 ${currentBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Current Balance</div>
            <div className={`font-bold font-mono ${currentBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(currentBalance)}</div>
          </div>
        </div>

        <Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-4 mt-3 bg-slate-800/50 border border-slate-700">
            <TabsTrigger 
              value="all" 
              className="flex-1 data-[state=active]:bg-slate-700"
              data-testid="tab-all-transactions"
            >
              All Transactions
            </TabsTrigger>
            <TabsTrigger 
              value="by-unit" 
              className="flex-1 data-[state=active]:bg-slate-700"
              data-testid="tab-by-unit"
            >
              By Unit ({unitPnLs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="flex-1 overflow-y-auto p-4 mt-0">
            {sortedEntries.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No transactions yet. Start by selecting a property!
              </div>
            ) : (
              <div className="space-y-2">
                {sortedEntries.map((entry) => {
                  const isOpex = entry.description?.includes('Operating costs');
                  const isClickable = isOpex && onOpexClick && entry.dealId;
                  
                  return (
                    <div 
                      key={entry.id}
                      className={`flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700 ${
                        isClickable ? 'cursor-pointer hover:bg-slate-700/50 hover:border-blue-500/50 transition-colors' : ''
                      }`}
                      data-testid={`ledger-entry-${entry.id}`}
                      onClick={isClickable ? () => onOpexClick(entry.dealId!) : undefined}
                    >
                      <div className="flex-shrink-0">
                        {entry.direction === 'debit' ? (
                          <ArrowDownCircle className="w-5 h-5 text-red-400" />
                        ) : (
                          <ArrowUpCircle className="w-5 h-5 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold ${CATEGORY_COLORS[entry.category] || 'text-gray-400'}`}>
                            {CATEGORY_LABELS[entry.category] || entry.category}
                          </span>
                          <span className="text-xs text-gray-500">Month {entry.gameWeek ?? '?'}</span>
                          {isClickable && (
                            <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                              Tap for breakdown
                            </span>
                          )}
                        </div>
                        <div className="text-white text-sm truncate">{entry.description}</div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className={`font-bold font-mono ${entry.direction === 'debit' ? 'text-red-400' : 'text-emerald-400'}`}>
                          {entry.direction === 'debit' ? '-' : '+'}{formatCurrency(entry.amount)}
                        </div>
                        <div className="text-gray-500 text-xs font-mono">
                          {formatCurrency(entry.balanceAfter)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="by-unit" className="flex-1 overflow-y-auto p-4 mt-0">
            {unitPnLs.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No properties purchased yet.</p>
                <p className="text-sm mt-1">Commit to a deal to see unit-level P&L!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs text-gray-400 mb-2">
                  Tap a property to see transaction details
                </div>
                {unitPnLs.map((unit) => (
                  <UnitPnLCard
                    key={unit.dealId}
                    unit={unit}
                    isExpanded={expandedUnit === unit.dealId}
                    onToggle={() => setExpandedUnit(
                      expandedUnit === unit.dealId ? null : unit.dealId
                    )}
                  />
                ))}
                
                {hasUnassigned && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Minus className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-400">General Transactions</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {unassignedEntries.length} transaction(s) not tied to a specific property
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
