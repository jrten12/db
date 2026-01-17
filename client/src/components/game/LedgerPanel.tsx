import { formatCurrency } from '@/lib/gameData';
import type { LedgerEntry } from '@shared/schema';
import { ArrowUpCircle, ArrowDownCircle, X, Wallet } from 'lucide-react';

interface LedgerPanelProps {
  entries: LedgerEntry[];
  startingCash: number;
  onClose: () => void;
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
};

export function LedgerPanel({ entries, startingCash, onClose }: LedgerPanelProps) {
  // Ascending order for balance calculations
  const sortedEntriesAsc = [...entries].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  // Descending order for display (most recent first)
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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="ledger-panel">
      <div className="bg-slate-900/95 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Financial Ledger</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            data-testid="button-close-ledger"
          >
            <X className="w-5 h-5 text-gray-400" />
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

        <div className="flex-1 overflow-y-auto p-4">
          {sortedEntries.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No transactions yet. Start by selecting a property!
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700"
                  data-testid={`ledger-entry-${entry.id}`}
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
                      <span className="text-xs text-gray-500">Week {entry.gameWeek ?? '?'}</span>
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
