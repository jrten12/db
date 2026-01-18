/**
 * Debt Panel - Shows loan amortization details for all active properties
 * 
 * Displays:
 * - Total debt across all properties
 * - Individual loan details with principal/interest breakdown
 * - Equity buildup visualization
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Landmark, TrendingDown, Wallet, PiggyBank, CreditCard } from 'lucide-react';
import type { Deal, Property } from '@shared/schema';

interface DebtPanelProps {
  deals: Deal[];
  properties: Property[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LoanDetails {
  deal: Deal;
  propertyName: string;
  originalLoan: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  equityPercent: number;
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount).toLocaleString()}`;
}

function LoanCard({ loan }: { loan: LoanDetails }) {
  const paidPercent = loan.originalLoan > 0 
    ? Math.min(100, (loan.principalPaid / loan.originalLoan) * 100)
    : 0;
  
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{loan.propertyName}</h3>
          <p className="text-xs text-gray-400">
            {loan.interestRate.toFixed(2)}% APR • 30-year fixed
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-red-400">
            {formatCurrency(loan.currentBalance)}
          </p>
          <p className="text-xs text-gray-400">remaining</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Principal Paid</span>
          <span className="text-green-400 font-medium">{formatCurrency(loan.principalPaid)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Interest Paid</span>
          <span className="text-amber-400 font-medium">{formatCurrency(loan.interestPaid)}</span>
        </div>
        
        <div className="pt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Loan paydown progress</span>
            <span>{paidPercent.toFixed(1)}%</span>
          </div>
          <Progress value={paidPercent} className="h-2" />
        </div>
        
        <div className="flex justify-between text-sm pt-1">
          <span className="text-gray-400">Equity Built</span>
          <span className="text-blue-400 font-medium">{loan.equityPercent.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

export function DebtPanel({ deals, properties, isOpen, onOpenChange }: DebtPanelProps) {
  const getPropertyName = (propertyId: number | null) => {
    if (!propertyId) return 'Unknown Property';
    const property = properties.find(p => p.id === propertyId);
    return property?.name || `Property #${propertyId}`;
  };
  
  // Get all deals with active loans
  const activeLoans: LoanDetails[] = deals
    .filter(d => d.status === 'active_rental' && (d.currentLoanBalance ?? 0) > 0)
    .map(deal => {
      const outputs = deal.proFormaOutputs as any;
      const inputs = deal.proFormaInputs as any;
      
      const originalLoan = deal.originalLoanAmount || outputs?.loanAmount || 0;
      const currentBalance = deal.currentLoanBalance ?? originalLoan;
      const interestRate = deal.loanInterestRate ?? inputs?.interestRate ?? 6.5;
      const principalPaid = deal.totalPrincipalPaid ?? 0;
      const interestPaid = deal.totalInterestPaid ?? 0;
      const purchasePrice = deal.purchasePrice || 0;
      
      // Calculate monthly payment using standard amortization formula
      const termMonths = deal.loanTermMonths || 360;
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = originalLoan > 0 && monthlyRate > 0
        ? originalLoan * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
          (Math.pow(1 + monthlyRate, termMonths) - 1)
        : 0;
      
      // Calculate equity percent (downpayment + principal paid)
      const downPayment = purchasePrice - originalLoan;
      const totalEquity = downPayment + principalPaid;
      const equityPercent = purchasePrice > 0 ? (totalEquity / purchasePrice) * 100 : 0;
      
      return {
        deal,
        propertyName: getPropertyName(deal.propertyId),
        originalLoan,
        currentBalance,
        interestRate,
        monthlyPayment,
        principalPaid,
        interestPaid,
        equityPercent,
      };
    });
  
  // Calculate totals
  const totalDebt = activeLoans.reduce((sum, loan) => sum + loan.currentBalance, 0);
  const totalOriginalDebt = activeLoans.reduce((sum, loan) => sum + loan.originalLoan, 0);
  const totalPrincipalPaid = activeLoans.reduce((sum, loan) => sum + loan.principalPaid, 0);
  const totalInterestPaid = activeLoans.reduce((sum, loan) => sum + loan.interestPaid, 0);
  const totalMonthlyPayments = activeLoans.reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  
  // Overall paydown progress
  const overallPaydownPercent = totalOriginalDebt > 0 
    ? (totalPrincipalPaid / totalOriginalDebt) * 100 
    : 0;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Landmark className="w-5 h-5 text-blue-400" />
            Your Debt Portfolio
          </DialogTitle>
        </DialogHeader>
        
        {activeLoans.length === 0 ? (
          <div className="text-center py-8">
            <PiggyBank className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-300 font-medium">No active loans!</p>
            <p className="text-sm text-gray-500 mt-1">
              You'll see loan details here when you purchase rental properties with financing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-300">Total Debt</span>
                </div>
                <p className="text-xl font-bold text-red-400">{formatCurrency(totalDebt)}</p>
              </div>
              
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-green-300">Principal Paid</span>
                </div>
                <p className="text-xl font-bold text-green-400">{formatCurrency(totalPrincipalPaid)}</p>
              </div>
              
              <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-amber-300">Interest Paid</span>
                </div>
                <p className="text-xl font-bold text-amber-400">{formatCurrency(totalInterestPaid)}</p>
              </div>
              
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-blue-300">Monthly Payments</span>
                </div>
                <p className="text-xl font-bold text-blue-400">{formatCurrency(totalMonthlyPayments)}</p>
              </div>
            </div>
            
            {/* Overall Progress */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Overall Loan Paydown</span>
                <span className="text-white font-medium">{overallPaydownPercent.toFixed(1)}%</span>
              </div>
              <Progress value={overallPaydownPercent} className="h-3" />
              <p className="text-xs text-gray-500 mt-2">
                {formatCurrency(totalPrincipalPaid)} of {formatCurrency(totalOriginalDebt)} paid off
              </p>
            </div>
            
            {/* Individual Loans */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Active Loans ({activeLoans.length})</h3>
              <div className="space-y-3">
                {activeLoans.map((loan) => (
                  <LoanCard key={loan.deal.id} loan={loan} />
                ))}
              </div>
            </div>
            
            {/* Educational Note */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 text-sm">
              <p className="text-blue-300 font-medium mb-1">How Amortization Works</p>
              <p className="text-gray-400 text-xs mb-2">
                Early in a mortgage, most of your payment goes to interest. Over time, more goes to principal, 
                building your equity.
              </p>
              <p className="text-blue-200 text-xs">
                <strong>Game Note:</strong> Your monthly payments are realistic, but we've accelerated the loan 
                paydown (simulating ~5 years of payments during the game) so you can see equity building in action!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DebtPanelTrigger({ 
  deals, 
  onClick 
}: { 
  deals: Deal[]; 
  onClick: () => void;
}) {
  const activeLoans = deals.filter(d => d.status === 'active_rental' && (d.currentLoanBalance ?? 0) > 0);
  const totalDebt = activeLoans.reduce((sum, d) => sum + (d.currentLoanBalance ?? 0), 0);
  
  if (activeLoans.length === 0) return null;
  
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded-lg border border-slate-600 transition-colors"
      data-testid="button-open-debt-panel"
    >
      <Landmark className="w-4 h-4 text-blue-400" />
      <div className="text-left">
        <p className="text-xs text-gray-400">Total Debt</p>
        <p className="text-sm font-bold text-red-400">${Math.round(totalDebt).toLocaleString()}</p>
      </div>
    </button>
  );
}
