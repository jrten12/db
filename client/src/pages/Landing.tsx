import { Link } from 'wouter';
import { ArrowRight, Play, Volume2, VolumeX, TrendingUp, Hammer, Building2, DollarSign, BarChart3, Shield, Zap, Target, Crown, ChevronRight } from 'lucide-react';
import heroHouseImage from '@assets/image_1767847036185.png';
import dbLogoImage from '@assets/dealbreak_icon_sim_1767848951783.png';
import heroBgPattern from '@/assets/images/hero-bg-pattern.png';
import iconAnalyzeMarket from '@/assets/images/icon-analyze-market.png';
import iconBuildWealth from '@/assets/images/icon-build-wealth.png';
import iconMasterGame from '@/assets/images/icon-master-game.png';
import Footer from '@/components/Footer';
import { AdBanner } from '@/components/game/AdBanner';
import { useSplash } from '@/App';
import { useMusic } from '@/hooks/useMusicPlayer';

export default function Landing() {
  const { showSplashScreen } = useSplash();
  const { isPlaying: isMusicPlaying, toggleMusic } = useMusic();

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-x-hidden"
      style={{ background: '#0c0c0e' }}
      data-testid="landing-page"
    >
      {/* === NAVIGATION BAR === */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #141416 0%, rgba(14,14,16,0.97) 100%)',
          borderBottom: '1px solid rgba(180,155,80,0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] max-w-6xl mx-auto">
          <div className="flex items-center gap-2.5">
            <img
              src={dbLogoImage}
              alt="Dealbreak"
              className="w-8 h-8 rounded-lg"
            />
            <span
              className="font-bold text-lg tracking-wide"
              style={{ color: '#d4af37' }}
            >
              Dealbreak
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleMusic}
              className="p-2 rounded-full transition-all active:scale-[0.97]"
              style={{ color: '#d4af37' }}
              data-testid="button-toggle-music-landing"
            >
              {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <Link href="/game">
              <button
                className="px-5 py-2 rounded-md font-semibold text-sm transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(180deg, #d4af37 0%, #b8962e 100%)',
                  color: '#0c0c0e',
                  boxShadow: '0 2px 8px rgba(212,175,55,0.3)',
                  border: '1px solid rgba(212,175,55,0.5)',
                }}
                data-testid="button-play-free-header"
              >
                Play Now
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* === HERO SECTION === */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBgPattern}
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.6 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, rgba(12,12,14,0.2) 0%, rgba(12,12,14,0.4) 30%, rgba(12,12,14,0.7) 70%, rgba(12,12,14,0.95) 100%),
                radial-gradient(ellipse 80% 60% at 50% 50%, transparent, rgba(12,12,14,0.4))
              `,
            }}
          />
        </div>

        <div
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), rgba(16,185,129,0.3), rgba(212,175,55,0.5), transparent)',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-5 py-14 lg:py-20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-16">
            {/* Left side: headline + CTA */}
            <div className="flex-1 text-center lg:text-left mb-10 lg:mb-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)', color: '#d4af37' }}>
                <Crown className="w-3.5 h-3.5" />
                THE REAL ESTATE STRATEGY SIMULATOR
              </div>

              <h1
                className="text-[2.2rem] sm:text-[2.8rem] lg:text-5xl xl:text-[3.5rem] leading-[1.08] font-bold tracking-tight mb-5"
                style={{
                  color: '#f5f0e0',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                }}
              >
                Flip Houses.
                <br />
                Build a Portfolio.
                <br />
                <span style={{ color: '#d4af37' }}>Break the Market.</span>
              </h1>

              <p
                className="text-lg sm:text-xl leading-relaxed max-w-[520px] mx-auto lg:mx-0 mb-4"
                style={{
                  color: 'rgba(220,215,200,0.8)',
                  textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                }}
              >
                Start with $75K. You have 12 months. Scout deals, run pro formas, manage rehabs, dodge bad tenants, and stack properties until your portfolio prints money.
              </p>

              <p
                className="text-sm leading-relaxed max-w-[480px] mx-auto lg:mx-0 mb-8"
                style={{
                  color: 'rgba(220,215,200,0.5)',
                }}
              >
                Every decision teaches you real underwriting. Every deal could be the one that breaks.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link href="/game">
                  <button
                    className="group w-full sm:w-auto min-w-[220px] py-4 px-8 rounded-lg font-bold text-[17px] transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 24px rgba(16,185,129,0.35), 0 2px 0 #047857',
                      border: '1px solid rgba(16,185,129,0.4)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    Start Your Empire
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-5 mt-6 text-sm" style={{ color: 'rgba(220,215,200,0.4)' }}>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                  No signup required
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                  Play instantly
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }} />
                  Learn real skills
                </span>
              </div>
            </div>

            {/* Right side: Hero house image */}
            <div className="relative w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px] xl:max-w-[420px] mx-auto lg:mx-0 lg:flex-shrink-0">
              <div
                className="absolute -inset-12 rounded-full blur-[80px]"
                style={{ background: 'rgba(212,175,55,0.12)' }}
              />
              <img
                src={heroHouseImage}
                alt="Dealbreak - Real Estate Investment Simulator"
                className="relative w-full h-auto"
                style={{
                  filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.5)) drop-shadow(0 4px 16px rgba(212,175,55,0.1))',
                }}
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* === STAT TICKER === */}
      <section className="relative py-8 overflow-hidden" style={{ background: 'rgba(212,175,55,0.03)', borderTop: '1px solid rgba(212,175,55,0.08)', borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-4 text-center">
            <StatItem value="$75K" label="Starting Cash" icon={<DollarSign className="w-4 h-4" />} />
            <StatItem value="12" label="Months to Win" icon={<Target className="w-4 h-4" />} />
            <StatItem value="3" label="Deals to Close" icon={<BarChart3 className="w-4 h-4" />} />
            <StatItem value="\u221E" label="Strategies to Try" icon={<TrendingUp className="w-4 h-4" />} />
          </div>
        </div>
      </section>

      {/* === TWO PATHS TO PROFIT === */}
      <section className="relative py-16 lg:py-24" style={{ background: '#0c0c0e' }}>
        <div className="max-w-5xl mx-auto px-5">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: '#f0e6d0' }}
          >
            Two Paths to Profit
          </h2>
          <p className="text-center text-sm sm:text-base mb-14 max-w-xl mx-auto" style={{ color: 'rgba(200,195,180,0.5)' }}>
            Every property is a decision. Flip it fast for a payday, or hold it and let the rent stack up. Mix both to dominate.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            {/* Flip Card */}
            <div className="relative p-6 sm:p-8 rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.06) 0%, rgba(255,255,255,0.02) 100%)', borderColor: 'rgba(234,88,12,0.2)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px]" style={{ background: 'rgba(234,88,12,0.08)' }} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(234,88,12,0.15)', border: '1px solid rgba(234,88,12,0.25)' }}>
                    <Zap className="w-5 h-5" style={{ color: '#f97316' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#f97316' }}>Flip It</h3>
                    <span className="text-xs" style={{ color: 'rgba(200,195,180,0.45)' }}>High risk, high reward</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(200,195,180,0.6)' }}>
                  Buy low, rehab smart, sell high. Choose your contractor, pick builder grade or luxury finishes, manage your rehab timeline, and pray the market doesn't tank before you close.
                </p>
                <div className="flex flex-wrap gap-2">
                  <MiniTag label="Quick profit" />
                  <MiniTag label="Rehab management" />
                  <MiniTag label="ARV estimation" />
                  <MiniTag label="Market timing" />
                </div>
              </div>
            </div>

            {/* Rent Card */}
            <div className="relative p-6 sm:p-8 rounded-2xl border overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(255,255,255,0.02) 100%)', borderColor: 'rgba(16,185,129,0.2)' }}>
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px]" style={{ background: 'rgba(16,185,129,0.08)' }} />
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                    <Building2 className="w-5 h-5" style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#10b981' }}>Rent It</h3>
                    <span className="text-xs" style={{ color: 'rgba(200,195,180,0.45)' }}>Steady cash flow</span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(200,195,180,0.6)' }}>
                  Hold the property, find tenants, collect monthly income. Handle vacancy, maintenance calls, property management decisions, and utility setups. Build wealth that compounds.
                </p>
                <div className="flex flex-wrap gap-2">
                  <MiniTag label="Monthly income" />
                  <MiniTag label="Tenant management" />
                  <MiniTag label="Cash flow analysis" />
                  <MiniTag label="Portfolio growth" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === EVERY DEAL HAS A STORY === */}
      <section
        className="relative py-16 lg:py-24"
        style={{ background: 'linear-gradient(180deg, #0c0c0e 0%, #0e0e10 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-5">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{
              color: '#f0e6d0',
              fontStyle: 'italic',
            }}
          >
            Every Deal Has a Story
          </h2>
          <p className="text-center text-sm sm:text-base mb-14 max-w-lg mx-auto" style={{ color: 'rgba(200,195,180,0.45)' }}>
            Some deals print money. Others bleed you dry. Learn to tell the difference.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10">
            <FeatureColumn
              imageSrc={iconAnalyzeMarket}
              title="Analyze the Market"
              description="Scout properties across neighborhoods. Compare comps, check zoning, study price trends. The best deals hide in plain sight — and the worst ones look too good to be true."
            />
            <FeatureColumn
              imageSrc={iconBuildWealth}
              title="Build Your Portfolio"
              description="Stack properties strategically. One flip funds your next rental. One rental's cash flow covers your next mortgage. Chain deals together to snowball your net worth."
            />
            <FeatureColumn
              imageSrc={iconMasterGame}
              title="Master the Numbers"
              description="Build real pro formas. Set your LTV, estimate rehab costs, choose your finish level, project NOI, and calculate cap rates. If the numbers don't work, the deal doesn't work."
            />
          </div>
        </div>
      </section>

      {/* === DEEP GAMEPLAY SECTION === */}
      <section className="relative py-16 lg:py-24" style={{ background: '#0c0c0e' }}>
        <div className="max-w-5xl mx-auto px-5">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: '#f0e6d0' }}
          >
            Not Just a Game. A Training Ground.
          </h2>
          <p className="text-center text-sm sm:text-base mb-14 max-w-2xl mx-auto" style={{ color: 'rgba(200,195,180,0.45)' }}>
            Every mechanic mirrors real investing. You'll walk away understanding how real estate deals actually work.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <GameplayCard
              icon={<BarChart3 className="w-5 h-5" />}
              title="Pro Forma Modeling"
              description="Build financial projections with real variables — vacancy rates, cap ex reserves, insurance, taxes, property management fees. Your assumptions drive your outcomes."
              color="#d4af37"
            />
            <GameplayCard
              icon={<Shield className="w-5 h-5" />}
              title="Due Diligence"
              description="Pay for inspections to uncover hidden problems — foundation cracks, bad roofs, outdated electrical. Skip diligence to save cash, but one surprise could wreck your budget."
              color="#10b981"
            />
            <GameplayCard
              icon={<Hammer className="w-5 h-5" />}
              title="Rehab Management"
              description="Hire cheap contractors or pay for speed. Choose builder grade or luxury finishes. Every choice affects your timeline, your budget, and your final property value."
              color="#f97316"
            />
            <GameplayCard
              icon={<DollarSign className="w-5 h-5" />}
              title="Financing Strategy"
              description="Dial your loan-to-value from 50% to 100%. Higher leverage means more buying power but steeper rates. Go too aggressive and the interest eats your profit alive."
              color="#8b5cf6"
            />
            <GameplayCard
              icon={<Building2 className="w-5 h-5" />}
              title="Tenant & Property Ops"
              description="Self-manage to save on fees, or hire a property manager. Handle maintenance calls, deal with vacancies, set up utility agreements. Passive income isn't passive."
              color="#06b6d4"
            />
            <GameplayCard
              icon={<TrendingUp className="w-5 h-5" />}
              title="Market Dynamics"
              description="Interest rates shift. Property values fluctuate. Market conditions change mid-deal. The deal you underwrote last month might not pencil today. Adapt or lose."
              color="#ec4899"
            />
          </div>
        </div>
      </section>

      {/* === YOUR PATH TO VICTORY === */}
      <section className="px-5 py-16 lg:py-24" style={{ background: 'linear-gradient(180deg, #0c0c0e 0%, #0e0e12 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: '#f0e6d0' }}
          >
            Your Path to Victory
          </h2>
          <p className="text-center text-sm sm:text-base mb-12 max-w-lg mx-auto" style={{ color: 'rgba(200,195,180,0.45)' }}>
            Three profitable deals in twelve months. Sounds easy. It's not.
          </p>

          <div className="space-y-4">
            <StepCard
              number="1"
              title="Scout the Deals"
              description="Browse properties across different markets. Compare asking prices to neighborhood comps. Some look like steals — until you dig deeper. Every property has a story."
              accent="#d4af37"
            />
            <StepCard
              number="2"
              title="Investigate (or Gamble)"
              description="Pay for inspections and market studies to uncover the truth — foundation issues, roof damage, electrical problems. Or trust your gut, save your cash, and roll the dice."
              accent="#10b981"
            />
            <StepCard
              number="3"
              title="Run Your Pro Forma"
              description="Set your financing, estimate rehab costs, choose your contractor and finish level, project rents or ARV. This is where deals are made or broken — before you spend a dime."
              accent="#f97316"
            />
            <StepCard
              number="4"
              title="Execute & Adapt"
              description="Time moves forward. Contractors run late. Markets shift. Tenants call at 2 AM. Maintenance surprises drain your reserves. Your projections meet reality — did your numbers hold up?"
              accent="#8b5cf6"
            />
          </div>

          <div className="text-center mt-14">
            <Link href="/game">
              <button
                className="group py-4 px-10 rounded-lg font-bold text-lg transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
                style={{
                  background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 24px rgba(16,185,129,0.35), 0 2px 0 #047857',
                  border: '1px solid rgba(16,185,129,0.4)',
                }}
                data-testid="button-start-first-deal"
              >
                Start Your First Deal
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </Link>
            <p className="mt-4 text-xs" style={{ color: 'rgba(200,195,180,0.3)' }}>
              No account needed. Jump straight into the action.
            </p>
          </div>
        </div>
      </section>

      {/* === WHAT YOU'LL LEARN === */}
      <section className="px-5 py-16 lg:py-20" style={{ background: '#0c0c0e', borderTop: '1px solid rgba(212,175,55,0.08)' }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: '#f0e6d0' }}
          >
            Walk Away Sharper
          </h2>
          <p className="text-center text-sm sm:text-base mb-12 max-w-lg mx-auto" style={{ color: 'rgba(200,195,180,0.45)' }}>
            Dealbreak isn't a tutorial — it's a simulator. You learn by doing, failing, and doing it better.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SkillItem label="How to analyze a deal before putting money down" />
            <SkillItem label="Why vacancy rate assumptions make or break rentals" />
            <SkillItem label="How LTV and interest rates affect your cash-on-cash return" />
            <SkillItem label="When to flip vs. when to hold for cash flow" />
            <SkillItem label="How rehab scope and contractor choice affect ROI" />
            <SkillItem label="Why due diligence saves more than it costs" />
            <SkillItem label="How to build a pro forma that reflects reality" />
            <SkillItem label="How to chain deals to compound your portfolio" />
          </div>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="px-5 py-16 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4"
            style={{ color: '#f0e6d0' }}
          >
            $75,000. 12 Months. 3 Deals.
          </h2>
          <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto" style={{ color: 'rgba(200,195,180,0.55)' }}>
            Think you can spot the good deals, dodge the bad ones, and build a profitable portfolio before time runs out?
          </p>
          <Link href="/game">
            <button
              className="group py-4 px-12 rounded-lg font-bold text-lg transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(180deg, #d4af37 0%, #b8962e 100%)',
                color: '#0c0c0e',
                boxShadow: '0 4px 24px rgba(212,175,55,0.35), 0 2px 0 #9a7b1f',
                border: '1px solid rgba(212,175,55,0.5)',
              }}
            >
              Prove It
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="px-5 py-8 text-center">
        <p className="text-sm" style={{ color: 'rgba(200,195,180,0.3)' }}>
          A real estate strategy game. Not financial advice.{' '}
          <Link href="/methodology" className="underline hover:no-underline" style={{ color: 'rgba(200,195,180,0.45)' }}>
            Read our methodology
          </Link>.
        </p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <p className="text-xs font-mono" style={{ color: 'rgba(200,195,180,0.2)' }}>
            v1.89
          </p>
          <button
            onClick={showSplashScreen}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(180,155,80,0.1)',
              color: 'rgba(200,195,180,0.35)',
            }}
            data-testid="button-replay-intro"
          >
            <Play className="w-2.5 h-2.5" />
            Intro
          </button>
        </div>
      </div>

      <AdBanner className="px-5 pb-4" />
      <Footer />
      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}

/* === SUB-COMPONENTS === */

function StatItem({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <span style={{ color: '#d4af37' }}>{icon}</span>
        <span className="text-2xl sm:text-3xl font-bold" style={{ color: '#f5f0e0' }}>{value}</span>
      </div>
      <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(200,195,180,0.4)' }}>{label}</span>
    </div>
  );
}

function FeatureColumn({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-24 h-24 sm:w-20 sm:h-20 lg:w-28 lg:h-28 mb-5 flex-shrink-0">
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>
      <h3
        className="text-lg font-bold mb-2"
        style={{
          color: '#f0e6d0',
          fontStyle: 'italic',
        }}
      >
        {title}
      </h3>
      <p
        className="text-sm leading-relaxed max-w-[280px]"
        style={{ color: 'rgba(200,195,180,0.55)' }}
      >
        {description}
      </p>
    </div>
  );
}

function GameplayCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      className="p-5 rounded-xl border transition-all"
      style={{
        background: `linear-gradient(135deg, ${color}08 0%, rgba(255,255,255,0.02) 100%)`,
        borderColor: `${color}20`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18`, border: `1px solid ${color}30` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
        <h3 className="font-semibold" style={{ color: '#f0e6d0' }}>{title}</h3>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,195,180,0.5)' }}>
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  accent = '#d4af37',
}: {
  number: string;
  title: string;
  description: string;
  accent?: string;
}) {
  return (
    <div
      className="flex items-start gap-4 p-5 rounded-xl border"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: `${accent}18`,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: `${accent}15`,
          border: `1px solid ${accent}30`,
        }}
      >
        <span className="font-bold" style={{ color: accent }}>{number}</span>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1" style={{ color: '#f0e6d0' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,195,180,0.5)' }}>{description}</p>
      </div>
    </div>
  );
}

function MiniTag({ label }: { label: string }) {
  return (
    <span className="px-2.5 py-1 rounded-md text-[11px] font-medium" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(200,195,180,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
      {label}
    </span>
  );
}

function SkillItem({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
      <span className="text-sm" style={{ color: 'rgba(200,195,180,0.6)' }}>{label}</span>
    </div>
  );
}
