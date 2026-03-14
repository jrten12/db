import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Scale, TrendingUp, Home, DollarSign, Clock, ChevronDown, ChevronUp, Copy, Check, Info, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import dbLogoImage from '@assets/new_icon_db_1772940176909.webp';

interface Inputs {
  purchasePrice: string;
  arv: string;
  monthlyRent: string;
  rehabBudget: string;
  downPaymentPct: string;
  interestRate: string;
  holdingMonths: string;
  closingCostsPct: string;
  taxesAnnual: string;
  insuranceAnnual: string;
  sellingCostsPct: string;
  vacancyPct: string;
  maintenancePct: string;
  managementPct: string;
}

const DEFAULT_INPUTS: Inputs = {
  purchasePrice: '',
  arv: '',
  monthlyRent: '',
  rehabBudget: '',
  downPaymentPct: '20',
  interestRate: '7.5',
  holdingMonths: '6',
  closingCostsPct: '2.5',
  taxesAnnual: '',
  insuranceAnnual: '',
  sellingCostsPct: '6',
  vacancyPct: '8',
  maintenancePct: '5',
  managementPct: '10',
};

function num(val: string): number {
  const n = parseFloat(val);
  return isNaN(n) ? 0 : n;
}

function fmt(val: number): string {
  if (Math.abs(val) >= 1_000_000) return '$' + (val / 1_000_000).toFixed(2) + 'M';
  return '$' + val.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function pct(val: number): string {
  return val.toFixed(1) + '%';
}

function formatWithCommas(val: string): string {
  const parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function InputField({ label, value, onChange, prefix, suffix, placeholder, tooltip }: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; placeholder?: string; tooltip?: string;
}) {
  const [showTip, setShowTip] = useState(false);
  const displayValue = value ? formatWithCommas(value) : '';
  const isDollar = prefix === '$';

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs text-white/50 font-medium uppercase tracking-wider">{label}</label>
        {tooltip && (
          <button
            onClick={() => setShowTip(!showTip)}
            className="text-white/25 hover:text-white/50 transition-colors"
            data-testid={`tip-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Info className="w-3 h-3" />
          </button>
        )}
      </div>
      {showTip && tooltip && (
        <p className="text-xs text-white/40 mb-1.5 leading-relaxed">{tooltip}</p>
      )}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono pointer-events-none">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            onChange(raw);
          }}
          placeholder={placeholder}
          className={`w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/15 focus:outline-none focus:border-emerald-500/40 focus:bg-white/[0.05] transition-all font-mono ${isDollar ? 'text-emerald-300/90' : ''}`}
          style={{ paddingLeft: prefix ? '1.75rem' : undefined, paddingRight: suffix ? '2.5rem' : undefined }}
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm font-mono pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function ResultCard({ label, value, subtext, color = '#fff', large }: {
  label: string; value: string; subtext?: string; color?: string; large?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-white/40 uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-mono font-bold ${large ? 'text-2xl md:text-3xl' : 'text-lg md:text-xl'}`} style={{ color }} data-testid={`result-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {value}
      </div>
      {subtext && <div className="text-xs text-white/30 mt-0.5">{subtext}</div>}
    </div>
  );
}

function HorizonBar({ label, flipVal, rentVal, max }: { label: string; flipVal: number; rentVal: number; max: number }) {
  const flipW = max > 0 ? Math.max(2, Math.min(100, (Math.abs(flipVal) / max) * 100)) : 2;
  const rentW = max > 0 ? Math.max(2, Math.min(100, (Math.abs(rentVal) / max) * 100)) : 2;
  return (
    <div className="space-y-1.5">
      <div className="text-xs text-white/50 font-medium">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-emerald-400/70 w-8 flex-shrink-0">Flip</span>
          <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: flipW + '%',
                background: flipVal >= 0 ? 'linear-gradient(90deg, rgba(16,185,129,0.4), rgba(16,185,129,0.7))' : 'linear-gradient(90deg, rgba(239,68,68,0.4), rgba(239,68,68,0.7))',
              }}
            />
          </div>
          <span className="text-xs font-mono text-white/70 w-20 text-right">{fmt(flipVal)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-blue-400/70 w-8 flex-shrink-0">Rent</span>
          <div className="flex-1 h-5 bg-white/[0.03] rounded overflow-hidden">
            <div
              className="h-full rounded transition-all duration-500"
              style={{
                width: rentW + '%',
                background: rentVal >= 0 ? 'linear-gradient(90deg, rgba(59,130,246,0.4), rgba(59,130,246,0.7))' : 'linear-gradient(90deg, rgba(239,68,68,0.4), rgba(239,68,68,0.7))',
              }}
            />
          </div>
          <span className="text-xs font-mono text-white/70 w-20 text-right">{fmt(rentVal)}</span>
        </div>
      </div>
    </div>
  );
}

export default function FlipOrRentTool() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const set = (key: keyof Inputs) => (val: string) => setInputs(prev => ({ ...prev, [key]: val }));

  const results = useMemo(() => {
    const price = num(inputs.purchasePrice);
    const arv = num(inputs.arv);
    const rent = num(inputs.monthlyRent);
    const rehab = num(inputs.rehabBudget);
    const dpPct = num(inputs.downPaymentPct) / 100;
    const rate = num(inputs.interestRate) / 100;
    const holdMo = num(inputs.holdingMonths);
    const closingPct = num(inputs.closingCostsPct) / 100;
    const taxAnn = num(inputs.taxesAnnual);
    const insAnn = num(inputs.insuranceAnnual);
    const sellPct = num(inputs.sellingCostsPct) / 100;
    const vacPct = num(inputs.vacancyPct) / 100;
    const maintPct = num(inputs.maintenancePct) / 100;
    const mgmtPct = num(inputs.managementPct) / 100;

    if (price <= 0) return null;

    const downPayment = price * dpPct;
    const loanAmount = price - downPayment;
    const closingCosts = price * closingPct;
    const monthlyRate = rate / 12;
    const monthlyPI = monthlyRate > 0 && loanAmount > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 360)) / (Math.pow(1 + monthlyRate, 360) - 1)
      : 0;

    const flipCashIn = downPayment + closingCosts + rehab;
    const monthlyInterestOnly = loanAmount * monthlyRate;
    const flipHoldingCosts = (monthlyInterestOnly + taxAnn / 12 + insAnn / 12) * holdMo;
    const sellingCosts = (arv || price) * sellPct;
    const flipSalePrice = arv || price;
    const flipNetProceeds = flipSalePrice - loanAmount - sellingCosts;
    const flipProfit = flipNetProceeds - flipCashIn - flipHoldingCosts;
    const flipROI = flipCashIn > 0 ? (flipProfit / flipCashIn) * 100 : 0;
    const flipAnnualizedROI = holdMo > 0 ? flipROI * (12 / holdMo) : 0;

    const rentalCashIn = downPayment + closingCosts;
    const effectiveRent = rent * (1 - vacPct);
    const monthlyMaintenance = rent * maintPct;
    const monthlyMgmt = rent * mgmtPct;
    const monthlyExpenses = monthlyPI + taxAnn / 12 + insAnn / 12 + monthlyMaintenance + monthlyMgmt;
    const monthlyCashFlow = effectiveRent - monthlyExpenses;
    const annualCashFlow = monthlyCashFlow * 12;
    const cashOnCash = rentalCashIn > 0 ? (annualCashFlow / rentalCashIn) * 100 : 0;
    const noi = (effectiveRent * 12) - (taxAnn + insAnn + monthlyMaintenance * 12 + monthlyMgmt * 12);
    const capRate = price > 0 ? (noi / price) * 100 : 0;

    const appreciationRate = 0.03;
    const horizons = [1, 3, 5].map(years => {
      const appreciatedValue = price * Math.pow(1 + appreciationRate, years);
      const equityGain = appreciatedValue - price;
      const totalRentalReturn = annualCashFlow * years + equityGain;

      const flipReturn = flipProfit;

      return { years, flipReturn, rentalReturn: totalRentalReturn };
    });

    const maxHorizonVal = Math.max(...horizons.map(h => Math.max(Math.abs(h.flipReturn), Math.abs(h.rentalReturn))), 1);

    const winner1yr = flipProfit > horizons[0].rentalReturn ? 'flip' : 'rent';
    const winner3yr = flipProfit > horizons[1].rentalReturn ? 'flip' : 'rent';
    const winner5yr = flipProfit > horizons[2].rentalReturn ? 'flip' : 'rent';

    return {
      flipCashIn, flipProfit, flipROI, flipAnnualizedROI, flipSalePrice, flipHoldingCosts, sellingCosts,
      rentalCashIn, monthlyCashFlow, annualCashFlow, cashOnCash, capRate, noi,
      horizons, maxHorizonVal,
      winner1yr, winner3yr, winner5yr,
    };
  }, [inputs]);

  const handleCopy = () => {
    if (!results) return;
    const text = [
      `Flip or Rent Analysis — ${new Date().toLocaleDateString()}`,
      `Purchase Price: ${fmt(num(inputs.purchasePrice))}`,
      `ARV: ${fmt(num(inputs.arv))}  |  Monthly Rent: ${fmt(num(inputs.monthlyRent))}`,
      ``,
      `FLIP: Profit ${fmt(results.flipProfit)} (${pct(results.flipROI)} ROI, ${pct(results.flipAnnualizedROI)} annualized)`,
      `RENT: ${fmt(results.monthlyCashFlow)}/mo cash flow, ${pct(results.cashOnCash)} CoC, ${pct(results.capRate)} Cap Rate`,
      ``,
      `Powered by dealbreaksimulator.com/tools/flip-or-rent`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isReady = num(inputs.purchasePrice) > 0 && (num(inputs.arv) > 0 || num(inputs.monthlyRent) > 0);

  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ background: '#0f0f12' }} data-testid="flip-or-rent-page">
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #13131a 0%, rgba(15,15,18,0.97) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] max-w-5xl mx-auto">
          <Link href="/tools" className="flex items-center gap-2.5" data-testid="link-for-tools">
            <img src={dbLogoImage} alt="Dealbreak" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-base tracking-wide text-white/90">Tools</span>
          </Link>
          <Link href="/game">
            <button
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
              data-testid="button-for-play"
            >
              Practice in Simulator
            </button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-6" data-testid="link-for-back">
          <ArrowLeft className="w-4 h-4" />
          All Tools
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <Scale className="w-6 h-6 text-emerald-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-for-heading">
              Flip or Rent? Strategy Analyzer
            </h1>
          </div>
          <p className="text-white/50 text-sm md:text-base max-w-2xl">
            Enter a property's details to compare flipping vs. renting side-by-side. See which strategy produces better returns at different time horizons.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr,1.2fr] gap-8">
          <div className="space-y-6">
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">Property Details</h2>
              <InputField label="Purchase Price" value={inputs.purchasePrice} onChange={set('purchasePrice')} prefix="$" placeholder="250,000" tooltip="What you're buying the property for." />
              <InputField label="After-Repair Value (ARV)" value={inputs.arv} onChange={set('arv')} prefix="$" placeholder="350,000" tooltip="Estimated market value after renovations. Used for flip profit calculation." />
              <InputField label="Monthly Rent Estimate" value={inputs.monthlyRent} onChange={set('monthlyRent')} prefix="$" placeholder="2,000" tooltip="Expected monthly rent if you keep it as a rental." />
              <InputField label="Rehab Budget" value={inputs.rehabBudget} onChange={set('rehabBudget')} prefix="$" placeholder="40,000" tooltip="Total renovation costs for flipping or improving the property." />
            </div>

            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">Financing</h2>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Down Payment" value={inputs.downPaymentPct} onChange={set('downPaymentPct')} suffix="%" placeholder="20" />
                <InputField label="Interest Rate" value={inputs.interestRate} onChange={set('interestRate')} suffix="%" placeholder="7.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Flip Hold (months)" value={inputs.holdingMonths} onChange={set('holdingMonths')} placeholder="6" tooltip="How many months you expect to own before selling (flip)." />
                <InputField label="Closing Costs" value={inputs.closingCostsPct} onChange={set('closingCostsPct')} suffix="%" placeholder="2.5" />
              </div>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
              data-testid="button-toggle-advanced"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Advanced Assumptions
            </button>

            {showAdvanced && (
              <div
                className="rounded-xl p-5 space-y-4"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Annual Taxes" value={inputs.taxesAnnual} onChange={set('taxesAnnual')} prefix="$" placeholder="3,750" />
                  <InputField label="Annual Insurance" value={inputs.insuranceAnnual} onChange={set('insuranceAnnual')} prefix="$" placeholder="1,500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Selling Costs" value={inputs.sellingCostsPct} onChange={set('sellingCostsPct')} suffix="%" placeholder="6" tooltip="Agent commissions and selling fees." />
                  <InputField label="Vacancy Rate" value={inputs.vacancyPct} onChange={set('vacancyPct')} suffix="%" placeholder="8" tooltip="Percentage of time the rental sits empty between tenants." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <InputField label="Maintenance" value={inputs.maintenancePct} onChange={set('maintenancePct')} suffix="%" placeholder="5" tooltip="Percentage of rent set aside for ongoing repairs." />
                  <InputField label="Management Fee" value={inputs.managementPct} onChange={set('managementPct')} suffix="%" placeholder="10" tooltip="Property management fee as percentage of rent." />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {isReady && results ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className="rounded-xl p-5"
                    style={{
                      background: results.flipProfit >= 0 ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1.5px solid ${results.flipProfit >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Flip</h3>
                    </div>
                    <div className="space-y-4">
                      <ResultCard label="Net Profit" value={fmt(results.flipProfit)} color={results.flipProfit >= 0 ? '#6ee7b7' : '#fca5a5'} large />
                      <ResultCard label="ROI" value={pct(results.flipROI)} color="#fff" />
                      <ResultCard label="Annualized" value={pct(results.flipAnnualizedROI)} subtext={`over ${inputs.holdingMonths}mo`} color="#fff" />
                      <ResultCard label="Cash Needed" value={fmt(results.flipCashIn)} color="#94a3b8" />
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-5"
                    style={{
                      background: results.monthlyCashFlow >= 0 ? 'rgba(59,130,246,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1.5px solid ${results.monthlyCashFlow >= 0 ? 'rgba(59,130,246,0.25)' : 'rgba(239,68,68,0.25)'}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Home className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Rent</h3>
                    </div>
                    <div className="space-y-4">
                      <ResultCard label="Monthly Cash Flow" value={fmt(results.monthlyCashFlow)} color={results.monthlyCashFlow >= 0 ? '#93c5fd' : '#fca5a5'} large />
                      <ResultCard label="Cash-on-Cash" value={pct(results.cashOnCash)} color="#fff" />
                      <ResultCard label="Cap Rate" value={pct(results.capRate)} color="#fff" />
                      <ResultCard label="Cash Needed" value={fmt(results.rentalCashIn)} color="#94a3b8" />
                    </div>
                  </div>
                </div>

                <div
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">Total Return by Time Horizon</h3>
                  <p className="text-xs text-white/30 mb-4">Rental returns include cash flow + estimated 3% annual appreciation. Flip return is a one-time event.</p>
                  <div className="space-y-4">
                    {results.horizons.map(h => (
                      <HorizonBar key={h.years} label={`${h.years}-Year Total`} flipVal={h.flipReturn} rentVal={h.rentalReturn} max={results.maxHorizonVal} />
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-3 text-center">
                    {[
                      { label: '1-Year Winner', winner: results.winner1yr },
                      { label: '3-Year Winner', winner: results.winner3yr },
                      { label: '5-Year Winner', winner: results.winner5yr },
                    ].map(w => (
                      <div key={w.label}>
                        <div className="text-[10px] text-white/30 uppercase mb-1">{w.label}</div>
                        <span
                          className="text-xs font-bold px-3 py-1 rounded-full inline-block"
                          style={{
                            background: w.winner === 'flip' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                            color: w.winner === 'flip' ? '#6ee7b7' : '#93c5fd',
                            border: `1px solid ${w.winner === 'flip' ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.3)'}`,
                          }}
                          data-testid={`badge-winner-${w.label.replace(/\s+/g, '-').toLowerCase()}`}
                        >
                          {w.winner === 'flip' ? 'Flip' : 'Rent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mx-auto"
                  data-testid="button-copy-results"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy results to clipboard'}
                </button>
              </>
            ) : (
              <div
                className="rounded-xl p-8 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Scale className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <h3 className="text-white/40 font-medium mb-1">Enter property details</h3>
                <p className="text-white/25 text-sm">Results will appear here as you type.</p>
              </div>
            )}

            <div
              className="rounded-xl p-5"
              style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <h3 className="text-sm font-bold text-emerald-400/80 mb-2">Want to practice analyzing real deals?</h3>
              <p className="text-xs text-white/40 mb-3">
                Our free simulator gives you realistic properties to evaluate, complete with due diligence, market conditions, and financial consequences.
              </p>
              <Link href="/game" className="inline-flex items-center gap-1.5 text-sm text-emerald-400 font-medium hover:text-emerald-300 transition-colors" data-testid="link-for-simulator-cta">
                Try the Simulator <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 space-y-8">
          <h2 className="text-xl font-bold text-white">How to Decide: Flip or Rent?</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
              <h3 className="text-base font-bold text-emerald-400 mb-3">When Flipping Makes Sense</h3>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> High ARV relative to purchase price (70% rule or better)</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Hot seller's market with rising prices</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> You have renovation experience or reliable contractors</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> You want a lump sum payout, not recurring income</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span> Property needs cosmetic work, not structural repairs</li>
              </ul>
            </div>
            <div className="rounded-xl p-6" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
              <h3 className="text-base font-bold text-blue-400 mb-3">When Renting Makes Sense</h3>
              <ul className="space-y-2 text-sm text-white/50">
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Strong rental demand with low vacancy rates</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> You want passive, recurring monthly income</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Long-term wealth building through equity and appreciation</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Tax benefits from depreciation and mortgage interest</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 mt-0.5">•</span> Property cash flows positive from day one</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-white/80">Frequently Asked Questions</h3>
            <details className="group rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <summary className="cursor-pointer p-4 text-sm text-white/70 font-medium list-none flex items-center justify-between">
                What is the 70% Rule for flipping?
                <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-sm text-white/40 leading-relaxed">
                The 70% Rule states you should pay no more than 70% of a property's After-Repair Value (ARV) minus repair costs. For example, if a home's ARV is $300,000 and needs $40,000 in repairs, the maximum purchase price should be $300,000 × 70% − $40,000 = $170,000. This rule helps ensure a profit margin that accounts for holding costs, selling costs, and unexpected expenses.
              </div>
            </details>
            <details className="group rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <summary className="cursor-pointer p-4 text-sm text-white/70 font-medium list-none flex items-center justify-between">
                What's a good cash-on-cash return for a rental property?
                <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-sm text-white/40 leading-relaxed">
                Most investors target 8-12% cash-on-cash return, though this varies by market. In high-appreciation markets (like coastal cities), investors may accept 4-6% CoC because property values are growing. In cash-flow markets (like the Midwest), 10-15% CoC is common. Below 4% is generally considered poor unless the appreciation potential is exceptional.
              </div>
            </details>
            <details className="group rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <summary className="cursor-pointer p-4 text-sm text-white/70 font-medium list-none flex items-center justify-between">
                How does this calculator account for appreciation?
                <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-sm text-white/40 leading-relaxed">
                The time horizon comparison uses a conservative 3% annual appreciation rate for rental properties. This is close to the long-term national average. Flip returns are shown as a one-time event since you sell immediately. In reality, appreciation varies dramatically by market — some areas appreciate 8-10% annually while others stagnate.
              </div>
            </details>
          </div>

          <div className="text-sm text-white/25 leading-relaxed">
            <p>
              <strong className="text-white/40">Disclaimer:</strong> This calculator provides estimates based on the inputs you provide.
              Actual investment returns depend on many factors not captured here, including market conditions, property condition, tenant quality,
              local regulations, and economic changes. Always consult with qualified professionals before making investment decisions.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/learn/flip-vs-rent" className="text-emerald-400/70 hover:text-emerald-400 transition-colors" data-testid="link-learn-flip-vs-rent">
            Learn: Flip vs. Rent Strategy →
          </Link>
          <Link href="/learn/cap-rates-cash-on-cash" className="text-emerald-400/70 hover:text-emerald-400 transition-colors" data-testid="link-learn-cap-rates">
            Learn: Cap Rates & Returns →
          </Link>
        </div>

      </div>

      <Footer />
    </div>
  );
}
