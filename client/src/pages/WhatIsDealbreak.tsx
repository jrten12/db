import { Link } from 'wouter';
import { ArrowRight, Target, TrendingUp, Calculator, Shield, BarChart3, Building2 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function WhatIsDealbreak() {
  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-x-hidden"
      style={{ background: '#131316' }}
      data-testid="what-is-dealbreak-page"
    >
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #171719 0%, rgba(17,17,19,0.97) 100%)',
          borderBottom: '1px solid rgba(180,155,80,0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-5 h-12 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg tracking-tight" style={{ color: '#d4af37' }} data-testid="link-home">
            DealBreak
          </Link>
          <div className="flex items-center gap-4 text-sm" style={{ color: 'rgba(225,220,205,0.6)' }}>
            <Link href="/learn" className="hover:text-white transition-colors" data-testid="link-learn">Learn</Link>
            <Link href="/tools" className="hidden sm:inline hover:text-white transition-colors" data-testid="link-tools">Tools</Link>
            <Link href="/game">
              <button
                className="py-1.5 px-4 rounded-md font-semibold text-sm transition-all hover:brightness-110"
                style={{
                  background: 'rgba(16,185,129,0.15)',
                  color: '#4ade80',
                  border: '1px solid rgba(16,185,129,0.4)',
                }}
                data-testid="button-play-now"
              >
                Play Now
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-5 py-10 lg:py-16">
        <nav className="text-sm mb-6" style={{ color: 'rgba(225,220,205,0.4)' }} data-testid="breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span style={{ color: 'rgba(225,220,205,0.7)' }}>What is DealBreak Simulator?</span>
        </nav>

        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4"
          style={{ color: '#f5f0e0' }}
          data-testid="heading-what-is"
        >
          What is DealBreak Simulator?
        </h1>

        <p
          className="text-lg sm:text-xl leading-relaxed mb-8"
          style={{ color: 'rgba(225,220,205,0.75)' }}
          data-testid="text-intro"
        >
          DealBreak Simulator is a realistic real estate investing simulator game where you analyze properties, run pro formas, estimate renovation costs, and decide whether an investment deal succeeds or fails. It's free to play, requires no signup, and teaches the same analytical skills used by professional real estate investors.
        </p>


        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#f0e6d0' }} data-testid="heading-how-it-works">
            How the Real Estate Simulator Game Works
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(225,220,205,0.65)' }}>
            You start with $100,000 in cash and 52 months on the clock. Properties appear on the market with varying prices, conditions, and neighborhoods. Your job is to evaluate each deal like a real investor would — running the numbers, investigating potential problems, and deciding whether to commit your capital.
          </p>
          <p className="leading-relaxed" style={{ color: 'rgba(225,220,205,0.65)' }}>
            Every decision has consequences. Skip due diligence and you might miss a termite infestation. Over-leverage with a high LTV loan and one bad month could wipe you out. The property investment simulator rewards careful analysis and punishes reckless speculation — just like real markets do.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-5" style={{ color: '#f0e6d0' }} data-testid="heading-what-you-do">
            What You'll Do
          </h2>
          <div className="space-y-4">
            <FeatureItem
              icon={<Target className="w-5 h-5" style={{ color: '#d4af37' }} />}
              title="Analyze Properties"
              description="Browse listings, compare neighborhoods, and identify which deals are worth investigating. Use the built-in real estate deal analyzer to evaluate cap rates, cash-on-cash returns, and potential profit margins."
            />
            <FeatureItem
              icon={<Calculator className="w-5 h-5" style={{ color: '#10b981' }} />}
              title="Build Pro Formas"
              description="Create detailed financial models for every deal. Set your purchase price, financing terms, rehab budget, and income projections. The pro forma is your decision-making tool."
            />
            <FeatureItem
              icon={<Shield className="w-5 h-5" style={{ color: '#60a5fa' }} />}
              title="Conduct Due Diligence"
              description="Pay for inspections, contractor walkthroughs, market studies, and title searches. Each reveals critical information — but costs you time and money."
            />
            <FeatureItem
              icon={<TrendingUp className="w-5 h-5" style={{ color: '#f59e0b' }} />}
              title="Choose Your Strategy"
              description="Flip properties for quick profit or hold them as rentals for monthly cash flow. Each strategy has different risk-reward profiles and requires different skills."
            />
            <FeatureItem
              icon={<BarChart3 className="w-5 h-5" style={{ color: '#a78bfa' }} />}
              title="Manage Your Portfolio"
              description="Handle tenant issues, navigate market shifts, refinance loans, and sell properties at the right time. Managing what you own is as important as choosing what to buy."
            />
            <FeatureItem
              icon={<Building2 className="w-5 h-5" style={{ color: '#f472b6' }} />}
              title="Learn From Every Deal"
              description="Win or lose, every deal teaches you something. End-of-game postmortems show exactly where your assumptions matched reality — and where they didn't."
            />
          </div>
        </section>


        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#f0e6d0' }} data-testid="heading-who-is-it-for">
            Who Is It For?
          </h2>
          <p className="leading-relaxed mb-4" style={{ color: 'rgba(225,220,205,0.65)' }}>
            DealBreak Simulator is built for anyone curious about real estate investing — whether you're a complete beginner who wants to understand how property deals work, a student studying real estate finance, or an experienced investor who wants to sharpen their deal analysis skills in a risk-free environment.
          </p>
          <p className="leading-relaxed" style={{ color: 'rgba(225,220,205,0.65)' }}>
            Unlike simplified real estate games that are purely entertainment, this real estate investing simulator uses realistic financial models, market dynamics, and property economics. The skills you practice here — pro forma analysis, cap rate evaluation, leverage decisions, due diligence prioritization — are the same skills used to evaluate real investment properties.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4" style={{ color: '#f0e6d0' }} data-testid="heading-skills">
            Real Skills You'll Practice
          </h2>
          <ul className="space-y-2" style={{ color: 'rgba(225,220,205,0.65)' }}>
            {[
              "Pro forma financial modeling — projecting income, expenses, and returns",
              "Cap rate and cash-on-cash return analysis for comparing deals",
              "Loan-to-value (LTV) leverage decisions and their impact on risk",
              "Due diligence prioritization — what to inspect and when to skip",
              "Flip vs. rent strategy selection based on market conditions",
              "Renovation budgeting and contractor management",
              "Market timing — reading conditions to know when to buy and sell",
              "Portfolio management — balancing cash, debt, and diversification",
            ].map((skill, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ background: '#10b981' }} />
                <span>{skill}</span>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="rounded-xl p-6 sm:p-8 mb-10"
          style={{
            background: 'linear-gradient(145deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.03) 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
          data-testid="cta-section"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: '#f0e6d0' }}>
            Ready to Test Your Deal Instincts?
          </h2>
          <p className="leading-relaxed mb-5" style={{ color: 'rgba(225,220,205,0.65)' }}>
            DealBreak Simulator is completely free to play. No signup, no downloads, no credit card. Just open your browser and start analyzing deals.
          </p>
          <Link href="/game">
            <button
              className="group py-3 px-8 rounded-lg font-bold text-base transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(16,185,129,0.35), 0 2px 0 #047857',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
              data-testid="button-start-playing"
            >
              Start Playing Now
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4" style={{ color: '#f0e6d0' }} data-testid="heading-learn-more">
            Learn More
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <LearnLink href="/learn/what-is-a-pro-forma" title="What Is a Pro Forma?" />
            <LearnLink href="/learn/cap-rates-cash-on-cash" title="Cap Rates & Cash-on-Cash Returns" />
            <LearnLink href="/learn/flip-vs-rent" title="Flip vs. Rent Strategy" />
            <LearnLink href="/learn/due-diligence" title="Due Diligence Guide" />
            <LearnLink href="/learn/ltv-financing" title="LTV & Financing" />
            <LearnLink href="/learn/market-conditions" title="Reading Market Conditions" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureItem({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-base mb-1" style={{ color: '#f0e6d0' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(225,220,205,0.6)' }}>{description}</p>
      </div>
    </div>
  );
}

function LearnLink({ href, title }: { href: string; title: string }) {
  return (
    <Link href={href}>
      <div
        className="px-4 py-3 rounded-lg transition-all hover:brightness-110 cursor-pointer flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span className="text-sm font-medium" style={{ color: 'rgba(225,220,205,0.7)' }}>{title}</span>
        <ArrowRight className="w-4 h-4" style={{ color: 'rgba(225,220,205,0.3)' }} />
      </div>
    </Link>
  );
}
