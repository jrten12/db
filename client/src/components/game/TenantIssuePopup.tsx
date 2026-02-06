import { AlertTriangle, Clock, DollarSign, MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface TenantIssueEvent {
  id: string;
  title: string;
  description: string;
  cashImpact?: number;
  rentMultiplier?: number;
  timeImpact?: number;
  emoji?: string;
  tenantName: string;
  tenantTrait: string;
  tenantNote: string;
}

interface TenantIssuePopupProps {
  issue: TenantIssueEvent | null;
  onClose: () => void;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));

export function TenantIssuePopup({ issue, onClose }: TenantIssuePopupProps) {
  const hasCashLoss = (issue?.cashImpact ?? 0) < 0;
  const hasWeekLoss = (issue?.rentMultiplier ?? 1) === 0;
  const hasTimeLoss = (issue?.timeImpact ?? 0) > 0;

  return (
    <AnimatePresence>
      {issue && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-950/95 text-white shadow-2xl"
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-2xl">
                  {issue.emoji ?? '⚠️'}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-red-200">Tenant issue</p>
                  <h3 className="text-xl font-semibold">{issue.title}</h3>
                  <p className="text-sm text-white/70">
                    {issue.tenantName} • {issue.tenantTrait}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/70 transition hover:text-white"
                aria-label="Close tenant issue"
                data-sound="swoosh"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <MessageCircle className="h-4 w-4" />
                  <span>{issue.tenantNote}</span>
                </div>
                <p className="mt-2 text-sm text-white/90">{issue.description}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/60">
                  Impact
                </h4>
                <ul className="space-y-2 text-sm">
                  {hasCashLoss && (
                    <li className="flex items-center gap-2 text-red-200">
                      <DollarSign className="h-4 w-4" />
                      Cost: {formatCurrency(issue.cashImpact ?? 0)}
                    </li>
                  )}
                  {hasWeekLoss && (
                    <li className="flex items-center gap-2 text-amber-200">
                      <Clock className="h-4 w-4" />
                      Rent missed this week
                    </li>
                  )}
                  {hasTimeLoss && (
                    <li className="flex items-center gap-2 text-amber-200">
                      <AlertTriangle className="h-4 w-4" />
                      Time hit: {issue.timeImpact} week{issue.timeImpact === 1 ? '' : 's'}
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex justify-end border-t border-white/10 px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
                data-sound="swoosh"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
