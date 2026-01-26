import { X, Home, DollarSign, Wrench, Shield, Building2, Zap, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Deal, Property } from '@shared/schema';
import { useMemo } from 'react';

interface OperatingExpensesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  property: Property;
}

// Map issue IDs to human-readable names
const ISSUE_NAMES: Record<string, string> = {
  'hvac_aging': 'HVAC System',
  'hvac_failing': 'HVAC System',
  'plumbing_galvanized': 'Plumbing',
  'plumbing_leak': 'Plumbing',
  'electrical_outdated': 'Electrical',
  'electrical_panel': 'Electrical Panel',
  'roof_aging': 'Roof',
  'roof_damage': 'Roof Damage',
  'foundation_cracks': 'Foundation',
  'foundation_settling': 'Foundation',
  'water_heater': 'Water Heater',
  'termite_damage': 'Termite Damage',
  'mold_issues': 'Mold',
  'sewer_line': 'Sewer Line',
  'windows_draft': 'Windows',
};

interface ExpenseLineItem {
  label: string;
  icon: React.ReactNode;
  monthlyAmount: number;
  weeklyAmount: number;
  annualAmount?: number;
  note?: string;
}

export function OperatingExpensesPopup({
  isOpen,
  onClose,
  deal,
  property,
}: OperatingExpensesPopupProps) {
  const inputs = deal.proFormaInputs as any;
  const outputs = deal.proFormaOutputs as any;
  
  const monthlyRent = outputs?.monthlyGrossRent || inputs?.expectedRent || 0;
  
  // Calculate unfixed issues and repair risk
  const repairAnalysis = useMemo(() => {
    const discoveredIssues: string[] = inputs?.discoveredIssueIds || [];
    const fixedIssues: string[] = inputs?.fixedIssueIds || [];
    const unfixedIssues = discoveredIssues.filter((id: string) => !fixedIssues.includes(id));
    
    // Did they do diligence?
    const didInspection = discoveredIssues.length > 0; // If they discovered issues, they did some diligence
    const didRehab = fixedIssues.length > 0;
    const allFixed = unfixedIssues.length === 0 && discoveredIssues.length > 0;
    
    // Calculate estimated extra repair cost from unfixed issues
    // Each unfixed issue adds ~$50-150/month in expected repairs
    const estimatedExtraMonthly = unfixedIssues.length * 75;
    
    // Get human-readable names for unfixed issues
    const unfixedNames = unfixedIssues.map((id: string) => 
      ISSUE_NAMES[id] || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
    
    // Unique category names (use Array.filter for dedup instead of Set spread)
    const uniqueUnfixed = unfixedNames.filter((name, index) => unfixedNames.indexOf(name) === index);
    
    return {
      discoveredIssues,
      fixedIssues,
      unfixedIssues,
      didInspection,
      didRehab,
      allFixed,
      estimatedExtraMonthly,
      uniqueUnfixed,
      hasRisk: unfixedIssues.length > 0,
    };
  }, [inputs]);
  
  const taxesAnnual = inputs?.taxesAnnual || 0;
  const insuranceAnnual = inputs?.insuranceAnnual || 0;
  const hasPropertyMgmt = inputs?.propertyManagement || false;
  const propertyMgmtPct = inputs?.propertyManagementPct || 10;
  const landlordPaysUtilities = inputs?.utilities || false;
  const utilitiesMonthly = inputs?.utilitiesMonthly || 150;
  
  const monthlyTaxes = taxesAnnual / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const monthlyMgmt = hasPropertyMgmt ? monthlyRent * (propertyMgmtPct / 100) : 0;
  const monthlyUtilities = landlordPaysUtilities ? utilitiesMonthly : 0;
  
  // Total operating expenses (simplified display - excludes maintenance/capEx reserves for clarity)
  const totalMonthlyOpex = monthlyTaxes + monthlyInsurance + monthlyMgmt + monthlyUtilities;
  
  const weeksPerMonth = 4.33;
  
  const expenseItems: ExpenseLineItem[] = [
    {
      label: 'Property Taxes',
      icon: <Building2 className="w-4 h-4" />,
      monthlyAmount: monthlyTaxes,
      weeklyAmount: monthlyTaxes / weeksPerMonth,
      annualAmount: taxesAnnual,
      note: 'Based on assessed value',
    },
    {
      label: 'Insurance',
      icon: <Shield className="w-4 h-4" />,
      monthlyAmount: monthlyInsurance,
      weeklyAmount: monthlyInsurance / weeksPerMonth,
      annualAmount: insuranceAnnual,
      note: 'Landlord policy',
    },
  ];
  
  if (hasPropertyMgmt) {
    expenseItems.push({
      label: 'Property Management',
      icon: <User className="w-4 h-4" />,
      monthlyAmount: monthlyMgmt,
      weeklyAmount: monthlyMgmt / weeksPerMonth,
      note: `${propertyMgmtPct}% of rent`,
    });
  }
  
  if (landlordPaysUtilities) {
    expenseItems.push({
      label: 'Utilities',
      icon: <Zap className="w-4 h-4" />,
      monthlyAmount: monthlyUtilities,
      weeklyAmount: monthlyUtilities / weeksPerMonth,
      note: 'Landlord pays',
    });
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount));
  };
  
  const conditionColor = {
    'fixer-upper': 'text-red-400',
    'needs-work': 'text-orange-400',
    'dated': 'text-yellow-400',
    'fair': 'text-yellow-300',
    'cosmetic': 'text-blue-400',
    'good': 'text-green-400',
    'turnkey': 'text-emerald-400',
    'excellent': 'text-emerald-300',
  }[property.conditionTag?.toLowerCase() || 'good'] || 'text-gray-400';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[90]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-md"
            data-testid="operating-expenses-popup"
          >
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-slate-600/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Operating Expenses
                  </h3>
                  <p className="text-blue-100 text-sm mt-0.5">{property.name}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  data-testid="close-opex-popup"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-3 flex items-center justify-between text-sm">
                  <span className="text-slate-300">Property Condition</span>
                  <span className={`font-medium capitalize ${conditionColor}`}>
                    {property.conditionTag || 'Good'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {expenseItems.map((item, i) => (
                    <div
                      key={i}
                      className="bg-slate-700/30 rounded-lg p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-200">
                          {item.icon}
                          <span className="font-medium">{item.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-semibold">
                            {formatCurrency(item.monthlyAmount)}/mo
                          </div>
                          <div className="text-xs text-slate-400">
                            {formatCurrency(item.weeklyAmount)}/wk
                          </div>
                        </div>
                      </div>
                      {item.note && (
                        <p className="text-xs text-slate-400 pl-6">{item.note}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-slate-600 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-200 font-semibold">Total Operating Expenses</span>
                    <div className="text-right">
                      <div className="text-xl font-bold text-white">
                        {formatCurrency(totalMonthlyOpex)}/mo
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatCurrency(totalMonthlyOpex / weeksPerMonth)}/wk
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Dynamic Pro Tip based on rehab/diligence status */}
                {repairAnalysis.allFixed ? (
                  // Player did diligence AND fixed all issues
                  <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-200 font-medium">Great job! You rehabbed this property.</p>
                        <p className="text-green-300/70 text-xs mt-1">
                          Your {repairAnalysis.fixedIssues.length} repair{repairAnalysis.fixedIssues.length > 1 ? 's' : ''} reduced 
                          your maintenance risk. Expect fewer surprise repairs than a non-rehabbed unit.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : repairAnalysis.hasRisk ? (
                  // Player has unfixed issues - show warnings
                  <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3 text-sm space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-200 font-medium">
                          Unfixed issues = higher repair costs
                        </p>
                        <p className="text-amber-300/70 text-xs mt-1">
                          You skipped repairs on {repairAnalysis.unfixedIssues.length} item{repairAnalysis.unfixedIssues.length > 1 ? 's' : ''}.
                          These will cause more frequent breakdowns.
                        </p>
                      </div>
                    </div>
                    
                    {/* Show specific unfixed items */}
                    <div className="bg-amber-950/50 rounded p-2 space-y-1">
                      <p className="text-xs text-amber-400 font-medium">Increased repair risk:</p>
                      {repairAnalysis.uniqueUnfixed.map((name, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-amber-300">• {name}</span>
                          <span className="text-red-400">+2-3x frequency</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs border-t border-amber-500/30 pt-2">
                      <span className="text-amber-400">Est. extra repairs:</span>
                      <span className="text-red-400 font-medium">
                        ~${repairAnalysis.estimatedExtraMonthly}/mo additional risk
                      </span>
                    </div>
                  </div>
                ) : !repairAnalysis.didInspection ? (
                  // Player didn't do inspection - unknown issues
                  <div className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3 text-sm">
                    <p className="text-slate-300">
                      <span className="font-medium">⚠️ Unknown condition:</span> You skipped the inspection, 
                      so hidden issues may cause surprise repairs. A{' '}
                      <span className={conditionColor}>{property.conditionTag || 'good'}</span> property 
                      {property.conditionTag === 'turnkey' || property.conditionTag === 'excellent' || property.conditionTag === 'good'
                        ? ' should have fewer issues.'
                        : ' likely has problems that will surface over time.'}
                    </p>
                  </div>
                ) : (
                  // Default - good condition, no issues discovered
                  <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-sm">
                    <p className="text-blue-200">
                      <span className="font-medium">💡 Pro tip:</span> This{' '}
                      <span className={conditionColor}>{property.conditionTag || 'good'}</span> property 
                      has no major issues requiring repair. Expect normal maintenance costs typical for any rental unit.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
