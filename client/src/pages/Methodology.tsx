import { Link } from "wouter";
import Footer from "@/components/Footer";

export default function Methodology() {
  return (
    <div
      className="min-h-screen min-h-[100dvh]"
      style={{ background: '#0c0c0e' }}
    >
      {/* Navigation */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #141416 0%, rgba(14,14,16,0.97) 100%)',
          borderBottom: '1px solid rgba(180,155,80,0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] max-w-6xl mx-auto">
          <Link href="/">
            <span
              className="font-bold text-lg tracking-wide cursor-pointer"
              style={{ color: '#d4af37' }}
            >
              Dealbreak
            </span>
          </Link>
          <Link
            href="/game"
            className="px-5 py-2 rounded-md font-semibold text-sm transition-all active:scale-[0.97] inline-block"
            style={{
              background: 'linear-gradient(180deg, #d4af37 0%, #b8962e 100%)',
              color: '#0c0c0e',
              boxShadow: '0 2px 8px rgba(212,175,55,0.3)',
              border: '1px solid rgba(212,175,55,0.5)',
            }}
          >
            Play Now
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-5 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ color: '#10b981' }}
          >
            &larr; Back to Home
          </Link>
        </div>

        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3"
          style={{ color: '#f0e6d0' }}
        >
          Methodology
        </h1>
        <p className="text-lg mb-12" style={{ color: 'rgba(220,215,200,0.5)' }}>
          How the Deal Break Simulator models real estate investment risk
        </p>

        <div className="space-y-12">
          {/* Section 1 */}
          <Section number="1" title="Core Logic & the Simulation Engine">
            <p>
              The Deal Break Simulator operates on a deterministic financial engine
              designed to model the volatility of real estate investment. Unlike
              static calculators, our engine uses a multi-variable risk-assessment
              framework to determine the probability of a "Deal Break" event —
              the moment a seemingly profitable deal turns into a loss.
            </p>
            <p>
              Players start with $100,000 in capital and 52 months to complete two
              profitable deals. Every decision — from property selection and due
              diligence to financing structure and exit strategy — feeds into the
              simulation engine, which stress-tests the deal against shifting market
              conditions, hidden property defects, and unpredictable real-world events.
            </p>
          </Section>

          {/* Section 2 */}
          <Section number="2" title="Key Input Variables">
            <p>
              The simulation aggregates several critical financial metrics to
              project outcomes:
            </p>

            <SubSection title="Capital Stack Composition">
              <p>
                Analysis of debt-to-equity ratios and their impact on cash-flow
                sensitivity. Players choose a Loan-to-Value (LTV) ratio between
                50% and 100%, which maps to a non-linear interest rate curve:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>50% LTV (conservative): ~4% interest rate, 1% origination fees</li>
                <li>75% LTV (moderate): ~6.5% interest rate, 2% origination fees</li>
                <li>90–100% LTV (aggressive): 6.5–12% interest rate, escalating fees</li>
              </ul>
              <p className="mt-2">
                This "leverage trap zone" above 90% LTV models the real-world
                penalty for overleveraging, where thin margins are consumed by
                debt-service costs.
              </p>
            </SubSection>

            <SubSection title="Operational Volatility">
              <p>
                The engine factors in "hidden" costs that erode returns over time:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Vacancy slippage (configurable, typically 5–7% of gross rent)</li>
                <li>Maintenance reserves (8% of monthly rent)</li>
                <li>Unexpected capital expenditures / CapEx (5% of monthly rent)</li>
                <li>Property management fees (5% of rent when delegated)</li>
                <li>Property taxes (~1.5% of purchase price) and insurance (~0.5%)</li>
              </ul>
            </SubSection>

            <SubSection title="Time-Value Risk">
              <p>
                Duration directly impacts the Internal Rate of Return (IRR) and the
                break-even point for both flip and rental strategies. Holding costs —
                monthly mortgage payments, taxes, insurance — accumulate weekly. A
                flip delayed by contractor issues or market softening can cross from
                profitable to deal-breaking purely through carrying-cost erosion.
              </p>
            </SubSection>

            <SubSection title="Due Diligence Investment">
              <p>
                Players can purchase investigation reports to reduce uncertainty in
                key variables:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>Market Study</strong> — narrows rent estimate ranges</li>
                <li><strong>Appraisal / Comp Analysis</strong> — narrows After Repair Value (ARV) estimates</li>
                <li><strong>Contractor Walkthrough</strong> ($150) — reveals true rehabilitation scope and budget</li>
                <li><strong>Property Inspection</strong> ($750) — uncovers hidden physical defects (mold, electrical, HVAC)</li>
                <li><strong>Title Report</strong> ($250) — identifies liens, easements, and legal encumbrances</li>
              </ul>
              <p className="mt-2">
                Skipping diligence reduces upfront costs but introduces hidden risk;
                undiscovered defects materialize later at 2–3x the cost that early
                detection would have allowed.
              </p>
            </SubSection>
          </Section>

          {/* Section 3 */}
          <Section number="3" title='The "Deal Break" Probability Model'>
            <p>
              Our simulation utilizes a stress-test methodology. We don't just
              calculate the "best-case scenario" — we simulate adverse events
              and local market downturns. The engine evaluates:
            </p>

            <SubSection title="Interest Rate Sensitivity">
              <p>
                The model applies a non-linear interest curve that penalizes
                aggressive leverage. The Debt Service Coverage Ratio (DSCR) is
                implicitly tested: as LTV rises and interest rates climb, monthly
                cash flow compresses. Deals that appear profitable at 75% LTV can
                turn negative at 95% LTV once origination fees and rate premiums
                are included.
              </p>
            </SubSection>

            <SubSection title="Market Condition Dynamics">
              <p>
                The simulator models a five-state market cycle — terrible, poor,
                neutral, good, and excellent — with weighted probabilistic
                transitions every in-game month. Key behaviors include:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>"Excellent" markets carry a 15% crash probability per cycle</li>
                <li>"Good" markets carry a 10% crash probability per cycle</li>
                <li>Market state directly scales flip sale prices (–15% to +15% of ARV)</li>
              </ul>
              <p className="mt-2">
                This models the real-world risk of "timing the market" — entering
                during peak conditions and facing a correction before the exit.
              </p>
            </SubSection>

            <SubSection title="Exit Strategy Integrity">
              <p>
                The engine tests the viability of a property sale under compressed
                conditions. Each property receives a sale multiplier based on market conditions (terrible: 0.78–0.95, poor: 0.85–1.02, neutral: 0.90–1.10, good: 0.95–1.18, excellent: 1.00–1.28), along with property condition, diligence depth, and rehab quality. A deal underwritten at a
                $200,000 ARV may realize only $156,000 in a "terrible" market — after
                deducting 6% agent commission, 2% seller closing costs, and full
                loan payoff with accrued interest.
              </p>
            </SubSection>

            <SubSection title="Curveball Event System">
              <p>
                The simulator injects randomized events calibrated to property
                condition and type. Over 60 distinct events model real-world
                disruptions:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Contractor delays, material shortages, permit issues</li>
                <li>Tenant emergencies, pipe bursts, HVAC failures</li>
                <li>Market surges, unexpected appreciation</li>
                <li>Foundation issues, mold discovery, code violations</li>
              </ul>
              <p className="mt-2">
                Event probability scales with property condition: fixer-uppers
                experience 80% more negative events than turnkey properties,
                modeling the risk premium of distressed assets.
              </p>
            </SubSection>
          </Section>

          {/* Section 4 */}
          <Section number="4" title="Pro Forma Financial Modeling">
            <p>
              The simulation requires players to build a layered financial model
              (pro forma) before committing to any deal:
            </p>

            <SubSection title="Rental Pro Forma">
              <p>
                For rental (buy-and-hold) strategies, the engine calculates:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>Net Operating Income (NOI)</strong> = Gross Rent &minus; Vacancy &minus; Operating Expenses</li>
                <li><strong>Cash Flow</strong> = NOI &minus; Debt Service (monthly mortgage payment)</li>
                <li><strong>Cap Rate</strong> = NOI &divide; Total Cash Invested</li>
                <li><strong>Cash-on-Cash Return</strong> = Annual Cash Flow &divide; Total Cash Invested</li>
              </ul>
            </SubSection>

            <SubSection title="Flip Pro Forma">
              <p>
                For fix-and-flip strategies, the engine calculates:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>Total Investment</strong> = Down Payment + Closing Costs + Loan Fees + Rehab Budget + Contingency</li>
                <li><strong>Net Sale Proceeds</strong> = Sale Price &minus; Commission &minus; Closing Costs &minus; Loan Payoff</li>
                <li><strong>Flip Profit</strong> = Net Sale Proceeds &minus; Total Investment</li>
                <li><strong>Flip ROI</strong> = Profit &divide; Total Cash Invested</li>
              </ul>
            </SubSection>
          </Section>

          {/* Section 5 */}
          <Section number="5" title="Purpose & Educational Intent">
            <p>
              The methodology is built to provide users with a visual
              risk-engineering environment. By isolating variables — leverage
              ratio, diligence spend, market timing, exit strategy — investors
              can identify exactly where a deal is most vulnerable to "breaking."
            </p>
            <p>
              The simulator teaches core real estate investment principles
              through consequence-driven learning:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-2">
              <li>
                <strong>Leverage management</strong> — understanding how debt
                amplifies both gains and losses
              </li>
              <li>
                <strong>Due diligence value</strong> — quantifying the cost of
                skipping inspections versus discovering problems early
              </li>
              <li>
                <strong>Market cycle awareness</strong> — recognizing that entry
                timing and exit conditions are often outside investor control
              </li>
              <li>
                <strong>Cash flow analysis</strong> — distinguishing between
                paper returns and actual spendable income
              </li>
              <li>
                <strong>Risk tolerance calibration</strong> — learning personal
                thresholds for acceptable deal structures through repeated
                simulation
              </li>
            </ul>
            <p className="mt-4">
              Every deal outcome includes a detailed postmortem analysis
              connecting the player's decisions to the financial result,
              reinforcing the educational feedback loop.
            </p>
          </Section>

          {/* Disclaimer */}
          <div
            className="rounded-xl border p-6 mt-16"
            style={{
              background: 'rgba(255,255,255,0.02)',
              borderColor: 'rgba(180,155,80,0.15)',
            }}
          >
            <p className="text-sm" style={{ color: 'rgba(200,195,180,0.4)' }}>
              <strong style={{ color: 'rgba(200,195,180,0.55)' }}>Disclaimer:</strong>{' '}
              Dealbreak is a real estate strategy simulation game designed for
              educational purposes. It does not constitute financial, investment,
              or legal advice. All scenarios, property values, and market
              conditions are simulated and do not represent actual investment
              opportunities. Past simulated performance does not predict future
              real-world results.
            </p>
          </div>
        </div>
      </div>

      <Footer />
      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: 'rgba(212,175,55,0.1)',
            border: '1px solid rgba(212,175,55,0.2)',
          }}
        >
          <span className="font-bold text-sm" style={{ color: '#d4af37' }}>
            {number}
          </span>
        </div>
        <h2
          className="text-xl sm:text-2xl font-bold"
          style={{ color: '#f0e6d0' }}
        >
          {title}
        </h2>
      </div>
      <div
        className="space-y-3 text-[15px] leading-relaxed ml-11"
        style={{ color: 'rgba(220,215,200,0.65)' }}
      >
        {children}
      </div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <h3
        className="text-base font-semibold mb-2"
        style={{ color: 'rgba(240,230,208,0.85)' }}
      >
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
