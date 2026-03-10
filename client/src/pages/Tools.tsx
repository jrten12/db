import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, ArrowLeft, Calculator, BarChart3, Scale, Award } from 'lucide-react';
import Footer from '@/components/Footer';
import { AdBanner } from '@/components/game/AdBanner';
import dbLogoImage from '@assets/new_icon_db_1772940176909.webp';

const TOOLS = [
  {
    slug: 'flip-or-rent',
    title: 'Flip or Rent? Strategy Analyzer',
    subtitle: 'Compare both strategies side-by-side with real numbers',
    description: 'Enter a property\'s details and instantly see whether flipping or renting produces better returns. Compares ROI, cash flow, break-even timeline, and total wealth across 1, 3, and 5-year horizons.',
    icon: Scale,
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.25)',
    tags: ['ROI', 'Cash Flow', 'Strategy'],
  },
  {
    slug: 'deal-scorecard',
    title: 'Deal Scorecard',
    subtitle: 'Grade any investment property in 30 seconds',
    description: 'Test a property against 7 real estate rules of thumb simultaneously — the 1% Rule, 2% Rule, 50% Rule, 70% Rule, Cap Rate, GRM, and Cash-on-Cash Return. Get an instant letter grade from A to F.',
    icon: Award,
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.08)',
    borderColor: 'rgba(245,158,11,0.25)',
    tags: ['1% Rule', 'Cap Rate', 'Grading'],
  },
];

export default function Tools() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen min-h-[100dvh]" style={{ background: '#0f0f12' }} data-testid="tools-hub-page">
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #13131a 0%, rgba(15,15,18,0.97) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-2.5" data-testid="link-tools-home">
            <img src={dbLogoImage} alt="Dealbreak" className="w-7 h-7 rounded-lg" />
            <span className="font-bold text-base tracking-wide text-white/90">Dealbreak</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/learn" className="text-sm text-white/50 hover:text-white/80 transition-colors" data-testid="link-tools-learn">
              Learn
            </Link>
            <Link href="/game">
              <button
                className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)' }}
                data-testid="button-tools-play"
              >
                Play
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-8" data-testid="link-tools-back">
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-emerald-400/70" />
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-400/60">Free Tools</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" data-testid="text-tools-heading">
            Real Estate Investment Calculators
          </h1>
          <p className="text-base md:text-lg text-white/50 max-w-2xl mx-auto">
            Free interactive tools to analyze investment properties, compare strategies, and make smarter real estate decisions.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-16">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group block rounded-2xl p-6 md:p-8 transition-all duration-200 hover:scale-[1.01]"
                style={{
                  background: tool.bgColor,
                  border: `1.5px solid ${tool.borderColor}`,
                }}
                data-testid={`card-tool-${tool.slug}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${tool.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: tool.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors" data-testid={`text-tool-title-${tool.slug}`}>
                      {tool.title}
                    </h2>
                    <p className="text-sm font-medium" style={{ color: tool.color }}>
                      {tool.subtitle}
                    </p>
                  </div>
                </div>

                <p className="text-white/50 text-sm leading-relaxed mb-5">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                        style={{ background: `${tool.color}15`, color: `${tool.color}cc`, border: `1px solid ${tool.color}25` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.2)' }}
        >
          <h2 className="text-xl font-bold text-white mb-2">Want to practice with real scenarios?</h2>
          <p className="text-white/50 text-sm mb-5 max-w-lg mx-auto">
            Our free simulator lets you analyze properties, build pro formas, manage rehabs, and close deals — all with realistic market conditions and consequences.
          </p>
          <Link href="/game">
            <button
              className="px-8 py-3 rounded-xl font-bold text-base transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', border: '1.5px solid rgba(16,185,129,0.4)' }}
              data-testid="button-tools-cta-play"
            >
              Play the Simulator — Free
            </button>
          </Link>
        </div>

        <AdBanner slot="tools-hub-bottom" className="mt-10" />
      </div>

      <Footer />
    </div>
  );
}
