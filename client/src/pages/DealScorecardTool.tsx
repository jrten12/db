import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Award, CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, Copy, Check, ArrowRight } from 'lucide-react';
import Footer from '@/components/Footer';
import { AdBanner } from '@/components/game/AdBanner';
import dbLogoImage from '@assets/new_icon_db_1772940176909.webp';

interface Inputs {
  purchasePrice: string;
  monthlyRent: string;
  monthlyExpenses: string;
  rehabBudget: string;
  arv: string;
  downPaymentPct: string;
  interestRate: string;
}

const DEFAULT_INPUTS: Inputs = {
  purchasePrice: '',
  monthlyRent: '',
  monthlyExpenses: '',
  rehabBudget: '',
  arv: '',
  downPaymentPct: '20',
  interestRate: '7.5',
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

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
type RuleResult = 'pass' | 'marginal' | 'fail';

interface RuleEval {
  name: string;
  slug: string;
  value: number | null;
  display: string;
  benchmark: string;
  result: RuleResult;
  explanation: string;
  tooltip: string;
  applicable: boolean;
}

const GRADE_CONFIG: Record<Grade, { color: string; bg: string; border: string; label: string }> = {
  A: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.3)', label: 'Excellent Deal' },
  B: { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.3)', label: 'Good Deal' },
  C: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', label: 'Average Deal' },
  D: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)', label: 'Below Average' },
  F: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', label: 'Poor Deal' },
};

const RESULT_CONFIG: Record<RuleResult, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  pass: { icon: CheckCircle, color: '#4ade80', bg: 'rgba(74,222,128,0.1)', label: 'Pass' },
  marginal: { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', label: 'Marginal' },
  fail: { icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Fail' },
};

function InputField({ label, value, onChange, prefix, suffix, placeholder, tooltip, optional }: {
  label: string; value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; placeholder?: string; tooltip?: string; optional?: boolean;
}) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-sm text-white/60 font-medium">{label}</label>
        {optional && <span className="text-[10px] text-white/25">(optional)</span>}
        {tooltip && (
          <button
            onClick={() => setShowTip(!showTip)}
            className="text-white/30 hover:text-white/60 transition-colors"
            data-testid={`tip-${label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {showTip && tooltip && (
        <p className="text-xs text-white/40 mb-1.5 leading-relaxed">{tooltip}</p>
      )}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            onChange(raw);
          }}
          placeholder={placeholder}
          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all font-mono"
          style={{ paddingLeft: prefix ? '1.75rem' : undefined, paddingRight: suffix ? '2.5rem' : undefined }}
          data-testid={`input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: RuleEval }) {
  const config = RESULT_CONFIG[rule.result];
  const Icon = config.icon;

  if (!rule.applicable) {
    return (
      <div className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-white/30">{rule.name}</span>
          <span className="text-[10px] text-white/20 px-2 py-0.5 rounded-full border border-white/5">N/A</span>
        </div>
        <p className="text-xs text-white/20">{rule.explanation}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{ background: config.bg, border: `1px solid ${config.color}25` }}
      data-testid={`rule-${rule.slug}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" style={{ color: config.color }} />
          <span className="text-sm font-bold text-white/80">{rule.name}</span>
        </div>
        <span
          className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
          style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}30` }}
        >
          {config.label}
        </span>
      </div>
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-lg font-mono font-bold" style={{ color: config.color }} data-testid={`value-${rule.slug}`}>
          {rule.display}
        </span>
        <span className="text-xs text-white/30">vs {rule.benchmark}</span>
      </div>
      <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: rule.value !== null ? Math.min(100, Math.max(5, rule.result === 'pass' ? 85 : rule.result === 'marginal' ? 55 : 25)) + '%' : '0%',
            background: `linear-gradient(90deg, ${config.color}60, ${config.color})`,
          }}
        />
      </div>
      <p className="text-xs text-white/40 leading-relaxed">{rule.explanation}</p>
    </div>
  );
}

export default function DealScorecardTool() {
  const [inputs, setInputs] = useState<Inputs>(DEFAULT_INPUTS);
  const [copied, setCopied] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const set = (key: keyof Inputs) => (val: string) => setInputs(prev => ({ ...prev, [key]: val }));

  const results = useMemo(() => {
    const price = num(inputs.purchasePrice);
    const rent = num(inputs.monthlyRent);
    const expenses = num(inputs.monthlyExpenses);
    const rehab = num(inputs.rehabBudget);
    const arv = num(inputs.arv);
    const dpPct = num(inputs.downPaymentPct) / 100;
    const rate = num(inputs.interestRate) / 100;

    if (price <= 0 || rent <= 0) return null;

    const annualRent = rent * 12;
    const downPayment = price * dpPct;
    const loanAmount = price - downPayment;
    const closingCosts = price * 0.025;
    const cashInvested = downPayment + closingCosts + rehab;
    const monthlyRate = rate / 12;
    const monthlyPI = monthlyRate > 0 && loanAmount > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, 360)) / (Math.pow(1 + monthlyRate, 360) - 1)
      : 0;

    const effectiveExpenses = expenses > 0 ? expenses : rent * 0.5;
    const monthlyNOI = rent - effectiveExpenses;
    const annualNOI = monthlyNOI * 12;
    const monthlyCashFlow = rent - effectiveExpenses - monthlyPI;
    const annualCashFlow = monthlyCashFlow * 12;

    const onePercentRatio = (rent / price) * 100;
    const rule1: RuleEval = {
      name: '1% Rule',
      slug: 'one-percent',
      value: onePercentRatio,
      display: pct(onePercentRatio),
      benchmark: '≥ 1.0%',
      result: onePercentRatio >= 1.0 ? 'pass' : onePercentRatio >= 0.8 ? 'marginal' : 'fail',
      explanation: onePercentRatio >= 1.0
        ? `Monthly rent is ${pct(onePercentRatio)} of purchase price — strong rental ratio.`
        : `Monthly rent is only ${pct(onePercentRatio)} of purchase price — below the 1% benchmark.`,
      tooltip: 'Monthly rent should be at least 1% of the purchase price for positive cash flow.',
      applicable: true,
    };

    const twoPercentRatio = (rent / price) * 100;
    const rule2: RuleEval = {
      name: '2% Rule',
      slug: 'two-percent',
      value: twoPercentRatio,
      display: pct(twoPercentRatio),
      benchmark: '≥ 2.0%',
      result: twoPercentRatio >= 2.0 ? 'pass' : twoPercentRatio >= 1.5 ? 'marginal' : 'fail',
      explanation: twoPercentRatio >= 2.0
        ? `Exceptional rental ratio — indicates a high cash flow property.`
        : `Below 2% is normal in most markets. This is an aspirational benchmark.`,
      tooltip: 'The 2% rule is an aggressive benchmark. Very few properties in good areas meet this.',
      applicable: true,
    };

    const expenseRatio = expenses > 0 ? (expenses / rent) * 100 : null;
    const rule50: RuleEval = {
      name: '50% Rule',
      slug: 'fifty-percent',
      value: expenseRatio,
      display: expenseRatio !== null ? pct(expenseRatio) : 'N/A',
      benchmark: '≈ 50%',
      result: expenseRatio !== null
        ? (expenseRatio >= 40 && expenseRatio <= 60 ? 'pass' : expenseRatio >= 30 && expenseRatio <= 70 ? 'marginal' : 'fail')
        : 'fail',
      explanation: expenseRatio !== null
        ? (expenseRatio >= 40 && expenseRatio <= 60
          ? `Expenses are ${pct(expenseRatio)} of rent — within the expected range.`
          : expenseRatio < 40
            ? `Expenses seem low at ${pct(expenseRatio)} — you may be underestimating costs.`
            : `Expenses are high at ${pct(expenseRatio)} of rent — eating into cash flow.`)
        : 'Enter monthly expenses to evaluate this rule.',
      tooltip: 'Operating expenses (excluding mortgage) typically run about 50% of gross rent.',
      applicable: expenses > 0,
    };

    const hasFlipData = arv > 0;
    const seventyPctMax = hasFlipData ? arv * 0.7 - rehab : 0;
    const seventyPctRatio = hasFlipData ? ((price + rehab) / arv) * 100 : 0;
    const rule70: RuleEval = {
      name: '70% Rule (Flips)',
      slug: 'seventy-percent',
      value: hasFlipData ? seventyPctRatio : null,
      display: hasFlipData ? pct(seventyPctRatio) : 'N/A',
      benchmark: '≤ 70%',
      result: hasFlipData
        ? (seventyPctRatio <= 70 ? 'pass' : seventyPctRatio <= 80 ? 'marginal' : 'fail')
        : 'fail',
      explanation: hasFlipData
        ? (seventyPctRatio <= 70
          ? `Total cost is ${pct(seventyPctRatio)} of ARV — good flip margin. Max purchase: ${fmt(seventyPctMax)}.`
          : `Total cost is ${pct(seventyPctRatio)} of ARV — thin margins. Max purchase should be ${fmt(seventyPctMax)}.`)
        : 'Enter ARV and rehab budget to evaluate flip potential.',
      tooltip: 'For flips: Purchase + Rehab should not exceed 70% of After-Repair Value.',
      applicable: hasFlipData,
    };

    const capRate = price > 0 ? (annualNOI / price) * 100 : 0;
    const ruleCap: RuleEval = {
      name: 'Cap Rate',
      slug: 'cap-rate',
      value: capRate,
      display: pct(capRate),
      benchmark: '5-10%',
      result: capRate >= 7 ? 'pass' : capRate >= 5 ? 'marginal' : 'fail',
      explanation: capRate >= 7
        ? `Strong cap rate at ${pct(capRate)} — solid income relative to price.`
        : capRate >= 5
          ? `Cap rate of ${pct(capRate)} is moderate — typical in stable markets.`
          : `Cap rate of ${pct(capRate)} is low — you're paying a premium for this property.`,
      tooltip: 'Net Operating Income / Purchase Price. Higher is better for cash flow investors.',
      applicable: true,
    };

    const grm = annualRent > 0 ? price / annualRent : 0;
    const ruleGRM: RuleEval = {
      name: 'Gross Rent Multiplier',
      slug: 'grm',
      value: grm,
      display: grm > 0 ? grm.toFixed(1) + 'x' : 'N/A',
      benchmark: '8-15x',
      result: grm > 0 && grm <= 12 ? 'pass' : grm > 0 && grm <= 18 ? 'marginal' : 'fail',
      explanation: grm <= 12
        ? `GRM of ${grm.toFixed(1)}x indicates strong rent-to-price ratio.`
        : grm <= 18
          ? `GRM of ${grm.toFixed(1)}x is moderate — property may be in a higher-value area.`
          : `GRM of ${grm.toFixed(1)}x is high — rent is low relative to price.`,
      tooltip: 'Purchase Price / Annual Rent. Lower GRM means rent is high relative to price.',
      applicable: true,
    };

    const cocReturn = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;
    const ruleCoC: RuleEval = {
      name: 'Cash-on-Cash Return',
      slug: 'coc-return',
      value: cocReturn,
      display: pct(cocReturn),
      benchmark: '8-12%',
      result: cocReturn >= 8 ? 'pass' : cocReturn >= 4 ? 'marginal' : 'fail',
      explanation: cocReturn >= 8
        ? `Strong cash-on-cash at ${pct(cocReturn)} — your invested dollars are working hard.`
        : cocReturn >= 4
          ? `Cash-on-cash of ${pct(cocReturn)} is below target but may be acceptable in appreciation markets.`
          : `Cash-on-cash of ${pct(cocReturn)} is weak — consider negotiating a lower price or higher rent.`,
      tooltip: 'Annual cash flow (after mortgage) / total cash invested. Measures return on YOUR money.',
      applicable: true,
    };

    const rules = [rule1, rule2, rule50, rule70, ruleCap, ruleGRM, ruleCoC];
    const applicableRules = rules.filter(r => r.applicable);
    const passCount = applicableRules.filter(r => r.result === 'pass').length;
    const marginalCount = applicableRules.filter(r => r.result === 'marginal').length;
    const score = passCount + marginalCount * 0.5;
    const maxScore = applicableRules.length;
    const pctScore = maxScore > 0 ? (score / maxScore) * 100 : 0;

    let grade: Grade;
    if (pctScore >= 80) grade = 'A';
    else if (pctScore >= 65) grade = 'B';
    else if (pctScore >= 50) grade = 'C';
    else if (pctScore >= 35) grade = 'D';
    else grade = 'F';

    return { rules, grade, passCount, marginalCount, failCount: applicableRules.length - passCount - marginalCount, totalApplicable: applicableRules.length, monthlyCashFlow, cocReturn, capRate };
  }, [inputs]);

  const handleCopy = () => {
    if (!results) return;
    const text = [
      `Deal Scorecard — Grade: ${results.grade} (${GRADE_CONFIG[results.grade].label})`,
      `Purchase: ${fmt(num(inputs.purchasePrice))}  |  Rent: ${fmt(num(inputs.monthlyRent))}/mo`,
      ``,
      ...results.rules.filter(r => r.applicable).map(r =>
        `${r.result === 'pass' ? '✓' : r.result === 'marginal' ? '~' : '✗'} ${r.name}: ${r.display} (${r.benchmark})`
      ),
      ``,
      `Monthly Cash Flow: ${fmt(results.monthlyCashFlow)}`,
      `Cap Rate: ${pct(results.capRate)}  |  CoC: ${pct(results.cocReturn)}`,
      ``,
      `Powered by dealbreaksimulator.com/tools/deal-scorecard`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isReady = num(inputs.purchasePrice) > 0 && num(inputs.monthlyRent) > 0;

  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ background: '#0f0f12' }} data-testid="deal-scorecard-page">
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #13131a 0%, rgba(15,15,18,0.97) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] max-w-5xl mx-auto">
          <Link href="/tools" className="flex items-center gap-2.5" data-testid="link-ds-tools">
            <img src={dbLogoImage} alt="Dealbreak" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-base tracking-wide text-white/90">Tools</span>
          </Link>
          <Link href="/game">
            <button
              className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}
              data-testid="button-ds-play"
            >
              Practice in Simulator
            </button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        <Link href="/tools" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-6" data-testid="link-ds-back">
          <ArrowLeft className="w-4 h-4" />
          All Tools
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <Award className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-white" data-testid="text-ds-heading">
              Deal Scorecard
            </h1>
          </div>
          <p className="text-white/50 text-sm md:text-base max-w-2xl">
            Test any investment property against 7 real estate rules of thumb simultaneously. Get an instant letter grade and see exactly where the deal is strong or weak.
          </p>
        </div>

        <div className="grid md:grid-cols-[1fr,1.4fr] gap-8">
          <div className="space-y-6">
            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">Property Details</h2>
              <InputField label="Purchase Price" value={inputs.purchasePrice} onChange={set('purchasePrice')} prefix="$" placeholder="250,000" tooltip="What you're buying the property for." />
              <InputField label="Monthly Rent" value={inputs.monthlyRent} onChange={set('monthlyRent')} prefix="$" placeholder="2,000" tooltip="Expected gross monthly rental income." />
              <InputField label="Monthly Expenses" value={inputs.monthlyExpenses} onChange={set('monthlyExpenses')} prefix="$" placeholder="1,000" tooltip="Monthly operating expenses excluding mortgage: taxes, insurance, maintenance, management, vacancy reserves." optional />
            </div>

            <div
              className="rounded-xl p-5 space-y-4"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="text-sm font-bold text-white/70 uppercase tracking-wider">Flip Analysis (Optional)</h2>
              <InputField label="After-Repair Value" value={inputs.arv} onChange={set('arv')} prefix="$" placeholder="350,000" tooltip="Estimated market value after renovations." optional />
              <InputField label="Rehab Budget" value={inputs.rehabBudget} onChange={set('rehabBudget')} prefix="$" placeholder="40,000" tooltip="Total renovation costs." optional />
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
            </div>
          </div>

          <div className="space-y-6">
            {isReady && results ? (
              <>
                <div
                  className="rounded-2xl p-6 text-center"
                  style={{ background: GRADE_CONFIG[results.grade].bg, border: `2px solid ${GRADE_CONFIG[results.grade].border}` }}
                  data-testid="scorecard-grade-card"
                >
                  <div className="text-white/30 text-xs uppercase tracking-widest mb-2">Overall Grade</div>
                  <div
                    className="text-7xl md:text-8xl font-black font-mono mb-1"
                    style={{ color: GRADE_CONFIG[results.grade].color }}
                    data-testid="text-grade"
                  >
                    {results.grade}
                  </div>
                  <div className="text-base font-medium mb-4" style={{ color: GRADE_CONFIG[results.grade].color }}>
                    {GRADE_CONFIG[results.grade].label}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-white/50">{results.passCount} Pass</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-white/50">{results.marginalCount} Marginal</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                      <span className="text-white/50">{results.failCount} Fail</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {results.rules.map(rule => (
                    <RuleCard key={rule.slug} rule={rule} />
                  ))}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors mx-auto"
                  data-testid="button-copy-scorecard"
                >
                  {copied ? <Check className="w-4 h-4 text-amber-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy scorecard to clipboard'}
                </button>
              </>
            ) : (
              <div
                className="rounded-xl p-8 text-center"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Award className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <h3 className="text-white/40 font-medium mb-1">Enter property details</h3>
                <p className="text-white/25 text-sm">At minimum, enter the purchase price and monthly rent to see your scorecard.</p>
              </div>
            )}

            <div
              className="rounded-xl p-5"
              style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)' }}
            >
              <h3 className="text-sm font-bold text-amber-400/80 mb-2">Practice analyzing deals risk-free</h3>
              <p className="text-xs text-white/40 mb-3">
                Run these rules against real scenarios in our simulator. Build pro formas, conduct due diligence, and see how your analysis holds up against market reality.
              </p>
              <Link href="/game" className="inline-flex items-center gap-1.5 text-sm text-amber-400 font-medium hover:text-amber-300 transition-colors" data-testid="link-ds-simulator-cta">
                Try the Simulator <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 space-y-8">
          <h2 className="text-xl font-bold text-white">Understanding the Rules of Thumb</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-base font-bold text-white/80 mb-3">Rental Rules</h3>
              <div className="space-y-3 text-sm text-white/50">
                <p><strong className="text-white/70">1% Rule:</strong> Monthly rent should be at least 1% of purchase price. A $200,000 property should rent for $2,000+/month. Quick filter for cash flow potential.</p>
                <p><strong className="text-white/70">50% Rule:</strong> Operating expenses (excluding mortgage) typically run about 50% of gross rent. Useful for quick income estimates before you know exact expenses.</p>
                <p><strong className="text-white/70">Cap Rate:</strong> NOI divided by purchase price. Ranges from 3-4% in premium areas to 10%+ in riskier areas. Higher cap rate = more income per dollar invested.</p>
                <p><strong className="text-white/70">GRM:</strong> Purchase price divided by annual rent. Lower is better. Under 12x is good; over 18x means you're paying a lot for the rent you'll collect.</p>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 className="text-base font-bold text-white/80 mb-3">Flip & Return Rules</h3>
              <div className="space-y-3 text-sm text-white/50">
                <p><strong className="text-white/70">70% Rule:</strong> For flips: purchase + rehab should not exceed 70% of ARV. This leaves a 30% margin for holding costs, selling costs, and profit.</p>
                <p><strong className="text-white/70">Cash-on-Cash:</strong> Annual cash flow divided by total cash invested. Unlike cap rate, this accounts for financing. Target 8-12% for rentals; lower may be acceptable in appreciation markets.</p>
                <p><strong className="text-white/70">2% Rule:</strong> An aspirational benchmark — very few properties in decent areas achieve 2% rent-to-price ratio. More common in lower-cost markets with higher-risk tenant profiles.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-bold text-white/80">Frequently Asked Questions</h3>
            <details className="group rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <summary className="cursor-pointer p-4 text-sm text-white/70 font-medium list-none flex items-center justify-between">
                Can a property fail these rules and still be a good investment?
                <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-sm text-white/40 leading-relaxed">
                Absolutely. These are rules of thumb, not absolute laws. A property in a rapidly appreciating market might have a low cap rate and still generate excellent total returns through value growth. Similarly, a property with a low 1% ratio in a premium area might be a safer long-term investment than a high-ratio property in a declining neighborhood. Context matters.
              </div>
            </details>
            <details className="group rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <summary className="cursor-pointer p-4 text-sm text-white/70 font-medium list-none flex items-center justify-between">
                What grade should I look for?
                <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-sm text-white/40 leading-relaxed">
                A grade of B or above suggests the deal has strong fundamentals across multiple metrics. Grade C is average — the deal might work but may not have a comfortable margin for error. Grades D and F suggest the numbers don't support the investment at the current price. That said, experienced investors sometimes make C-grade deals work through superior execution.
              </div>
            </details>
            <details className="group rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <summary className="cursor-pointer p-4 text-sm text-white/70 font-medium list-none flex items-center justify-between">
                Why does my property fail the 2% Rule?
                <ChevronDown className="w-4 h-4 text-white/30 group-open:rotate-180 transition-transform" />
              </summary>
              <div className="px-4 pb-4 text-sm text-white/40 leading-relaxed">
                Almost every property in a desirable area fails the 2% Rule. It's an aspirational metric that's mainly achievable in very low-cost markets, mobile home parks, or multi-family properties in C/D neighborhoods. Don't worry about failing this one — it's included for context, not as a dealbreaker. Focus on the 1% Rule, Cap Rate, and Cash-on-Cash instead.
              </div>
            </details>
          </div>

          <div className="text-sm text-white/25 leading-relaxed">
            <p>
              <strong className="text-white/40">Disclaimer:</strong> This scorecard provides quick analysis based on common real estate investing rules of thumb.
              These rules are guidelines, not guarantees. Every market, property, and investor's situation is different.
              Always perform thorough due diligence and consult with qualified professionals before making investment decisions.
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-sm flex-wrap">
          <Link href="/learn/cap-rates-cash-on-cash" className="text-amber-400/70 hover:text-amber-400 transition-colors" data-testid="link-learn-cap-rates">
            Learn: Cap Rates & Returns →
          </Link>
          <Link href="/learn/what-is-a-pro-forma" className="text-amber-400/70 hover:text-amber-400 transition-colors" data-testid="link-learn-pro-forma">
            Learn: What Is a Pro Forma? →
          </Link>
          <Link href="/tools/flip-or-rent" className="text-amber-400/70 hover:text-amber-400 transition-colors" data-testid="link-flip-or-rent">
            Try: Flip or Rent Analyzer →
          </Link>
        </div>

        <AdBanner slot="deal-scorecard-bottom" className="mt-10" />
      </div>

      <Footer />
    </div>
  );
}
