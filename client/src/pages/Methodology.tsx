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

            <SubSection title="Capital Stack &amp; Dynamic Underwriting">
              <p>
                Players choose a Loan-to-Value (LTV) ratio between 50% and 100%.
                Interest rates are determined by a multi-factor underwriting model
                that mirrors how real lenders evaluate borrowers. Six independent
                variables influence the rate a player receives:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li><strong>LTV risk premium</strong> — higher leverage increases the base rate on a non-linear curve, with steep escalation above 90%</li>
                <li><strong>Debt-to-income ratio</strong> — existing monthly obligations relative to rental income shift the rate on a smooth gradient</li>
                <li><strong>Cash reserves</strong> — lenders reward borrowers who maintain healthy liquidity cushions</li>
                <li><strong>Net worth / asset coverage</strong> — total asset value relative to total debt obligations factors into creditworthiness</li>
                <li><strong>Prevailing market conditions</strong> — the in-game market cycle influences the rate environment, similar to how the Federal Reserve's monetary policy affects real-world mortgage rates</li>
                <li><strong>Deal track record</strong> — a history of profitable deals earns better terms, while losses increase borrowing costs</li>
              </ul>
              <p className="mt-2">
                Each factor applies a smooth adjustment rather than a binary
                threshold, creating a realistic spectrum where small improvements
                in financial position translate to incrementally better terms. The
                full breakdown is visible to players in real-time during deal
                analysis.
              </p>
            </SubSection>

            <SubSection title="Operational Volatility &amp; Tenant Dynamics">
              <p>
                The engine factors in ongoing costs that erode returns over time,
                with several layers of realism:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Vacancy slippage (configurable, typically 5–7% of gross rent)</li>
                <li>Maintenance reserves and capital expenditure reserves</li>
                <li>Property management fees when delegated</li>
                <li>Property taxes and insurance scaled to purchase price</li>
              </ul>
              <p className="mt-2">
                <strong>Progressive expense escalation:</strong> Unfixed property
                issues don't stay static — they worsen over time. A minor leak
                ignored for several months becomes a major water damage event.
                Both the probability and cost of maintenance events escalate the
                longer issues go unaddressed, modeling the real-world consequences
                of deferred maintenance.
              </p>
              <p className="mt-2">
                <strong>Tenant satisfaction:</strong> Rental tenants have a
                satisfaction score influenced by property conditions and
                responsiveness to repairs. Persistent neglect leads to tenant
                departures, vacancy periods, and turnover costs. Conversely,
                well-maintained properties retain tenants and generate stable
                income. Tenant mood is visible during gameplay, giving players
                early warning signals before the financial impact materializes.
              </p>
              <p className="mt-2">
                <strong>Market-driven rent adjustments:</strong> When in-game
                market conditions shift, active rental income adjusts accordingly.
                Hot markets push rents up; downturns compress them. This models
                the real-world correlation between macroeconomic conditions and
                rental demand.
              </p>
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
                The multi-factor underwriting model means the same LTV can
                produce meaningfully different rates depending on the borrower's
                overall financial health and market timing. A player with strong
                cash reserves entering a soft market may secure rates well below
                what a thinly capitalized investor would face in a hot market —
                even at identical leverage levels.
              </p>
              <p className="mt-2">
                The Debt Service Coverage Ratio (DSCR) is implicitly tested: as
                rates climb, monthly cash flow compresses. Deals that appear
                profitable under favorable underwriting conditions can turn
                negative when multiple risk factors compound — overleveraged,
                under-reserved, in a tightening rate environment.
              </p>
            </SubSection>

            <SubSection title="Market Condition Dynamics">
              <p>
                The simulator models a living five-state market cycle — terrible, poor,
                neutral, good, and excellent — with gradual transitions about once a month
                (±1 week jitter). The economy is dynamic without boom/bust chaos:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                <li>Ask prices, rents, and ARV soft-drift with current conditions (~±1–2% per state)</li>
                <li>Owned rental leases stay locked mid-term; market moves feed the next renewal or new-tenant negotiation</li>
                <li>Softer markets raise vacancy; stronger markets tighten it</li>
                <li>Refinance appraisals and flip/rental exits share the same market weather</li>
                <li>Crash odds from excellent/good are uncommon, not routine</li>
              </ul>
              <p className="mt-2">
                This models timing risk without making every month a coin flip — underwriting
                still matters more than luck.
              </p>
            </SubSection>

            <SubSection title="Exit Strategy Integrity">
              <p>
                The engine tests the viability of a property sale under compressed
                conditions. Each property's sale price is influenced by market
                conditions, property condition, diligence depth, rehab quality,
                and location resonance. A deal underwritten at a $200,000 ARV may
                realize significantly less in a downturn — after deducting agent
                commissions, seller closing costs, and full loan payoff with
                accrued interest.
              </p>
              <p className="mt-2">
                Flip sale pricing accounts for the quality and relevance of
                renovations: a kitchen remodel resonates differently in an urban
                condo versus a suburban single-family, and the market environment
                influences both renovation costs and the return on that
                investment. Players who align their rehab strategy with the
                property's location, type, and market conditions achieve better
                outcomes.
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
                amplifies both gains and losses, and how lender underwriting
                responds to your overall financial position
              </li>
              <li>
                <strong>Due diligence value</strong> — quantifying the cost of
                skipping inspections versus discovering problems early, including
                the compounding consequences of deferred maintenance
              </li>
              <li>
                <strong>Market cycle awareness</strong> — recognizing that entry
                timing and exit conditions are often outside investor control,
                and that markets affect financing costs, rental income, and
                renovation economics simultaneously
              </li>
              <li>
                <strong>Cash flow analysis</strong> — distinguishing between
                paper returns and actual spendable income, with real-time P&amp;L
                tracking per property
              </li>
              <li>
                <strong>Tenant management</strong> — understanding that property
                condition directly affects tenant satisfaction, retention, and
                ultimately your bottom line
              </li>
              <li>
                <strong>Risk tolerance calibration</strong> — learning personal
                thresholds for acceptable deal structures through repeated
                simulation
              </li>
            </ul>
            <p className="mt-4">
              Every deal outcome includes a detailed postmortem analysis
              comparing the player's projections against actual results — with
              accuracy grades, side-by-side metric comparisons, and explanatory
              context for any gaps between expectations and reality.
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
