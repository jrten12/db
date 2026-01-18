import { X, Home, DollarSign, Wrench, Shield, Building2, Zap, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Deal, Property } from '@shared/schema';

interface OperatingExpensesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal;
  property: Property;
}

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
  
  const taxesAnnual = inputs?.taxesAnnual || 0;
  const insuranceAnnual = inputs?.insuranceAnnual || 0;
  const maintenancePct = inputs?.maintenancePct || 5;
  const capexPct = inputs?.capExPct || inputs?.capexPct || 5;
  const hasPropertyMgmt = inputs?.propertyManagement || false;
  const propertyMgmtPct = inputs?.propertyManagementPct || 10;
  const landlordPaysUtilities = inputs?.utilities || false;
  const utilitiesMonthly = inputs?.utilitiesMonthly || 150;
  
  const monthlyTaxes = taxesAnnual / 12;
  const monthlyInsurance = insuranceAnnual / 12;
  const monthlyMaintenance = monthlyRent * (maintenancePct / 100);
  const monthlyCapex = monthlyRent * (capexPct / 100);
  const monthlyMgmt = hasPropertyMgmt ? monthlyRent * (propertyMgmtPct / 100) : 0;
  const monthlyUtilities = landlordPaysUtilities ? utilitiesMonthly : 0;
  
  const totalMonthlyOpex = monthlyTaxes + monthlyInsurance + monthlyMaintenance + 
    monthlyCapex + monthlyMgmt + monthlyUtilities;
  
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
    {
      label: 'Maintenance Reserve',
      icon: <Wrench className="w-4 h-4" />,
      monthlyAmount: monthlyMaintenance,
      weeklyAmount: monthlyMaintenance / weeksPerMonth,
      note: `${maintenancePct}% of rent - routine repairs`,
    },
    {
      label: 'Capital Expenditures',
      icon: <Home className="w-4 h-4" />,
      monthlyAmount: monthlyCapex,
      weeklyAmount: monthlyCapex / weeksPerMonth,
      note: `${capexPct}% of rent - major replacements`,
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
                
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-sm">
                  <p className="text-blue-200">
                    <span className="font-medium">💡 Pro tip:</span> Property condition affects repair frequency. 
                    A <span className={conditionColor}>{property.conditionTag || 'good'}</span> property 
                    will have {property.conditionTag === 'turnkey' || property.conditionTag === 'excellent' || property.conditionTag === 'good'
                      ? 'fewer unexpected repairs.'
                      : 'more frequent repairs - budget accordingly!'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
