import { Link } from 'wouter';
import { ArrowRight, Play, Volume2, VolumeX } from 'lucide-react';
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

      {/* === HERO SECTION with geometric background === */}
      <section className="relative overflow-hidden">
        {/* Geometric gold/green background pattern */}
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
                linear-gradient(180deg, rgba(12,12,14,0.3) 0%, rgba(12,12,14,0.5) 30%, rgba(12,12,14,0.7) 70%, rgba(12,12,14,0.95) 100%),
                radial-gradient(ellipse 80% 60% at 50% 50%, transparent, rgba(12,12,14,0.4))
              `,
            }}
          />
        </div>

        {/* Gold accent lines */}
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
              <h1
                className="text-[2.2rem] sm:text-[2.8rem] lg:text-5xl xl:text-[3.5rem] leading-[1.08] font-bold tracking-tight mb-5"
                style={{
                  color: '#f5f0e0',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                }}
              >
                Can You Spot the
                <br />
                Deal That Breaks?
              </h1>

              <p
                className="text-lg sm:text-xl leading-relaxed max-w-[480px] mx-auto lg:mx-0 mb-8"
                style={{
                  color: 'rgba(220,215,200,0.75)',
                  textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                }}
              >
                Analyze risk, maximize reward, and build your empire.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link href="/game">
                  <button
                    className="group w-full sm:w-auto min-w-[200px] py-4 px-8 rounded-lg font-bold text-[17px] transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 24px rgba(16,185,129,0.35), 0 2px 0 #047857',
                      border: '1px solid rgba(16,185,129,0.4)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    Start Playing
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
              </div>
            </div>

            {/* Right side: Hero house image */}
            <div className="relative w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[380px] xl:max-w-[420px] mx-auto lg:mx-0 lg:flex-shrink-0">
              <div
                className="absolute -inset-12 rounded-full blur-[80px]"
                style={{ background: 'rgba(212,175,55,0.1)' }}
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

      {/* === EVERY DEAL HAS A STORY === */}
      <section
        className="relative py-16 lg:py-24"
        style={{ background: '#0c0c0e' }}
      >
        <div className="max-w-5xl mx-auto px-5">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-14"
            style={{
              color: '#f0e6d0',
              fontStyle: 'italic',
            }}
          >
            Every Deal Has a Story
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 lg:gap-10">
            <FeatureColumn
              imageSrc={iconAnalyzeMarket}
              title="Analyze the Market"
              description="Study properties, compare locations, and spot the deals others miss. Every market has hidden opportunities and traps."
            />
            <FeatureColumn
              imageSrc={iconBuildWealth}
              title="Build Your Wealth"
              description="Flip houses for quick cash or hold rentals for steady income. Balance risk and reward to grow your portfolio."
            />
            <FeatureColumn
              imageSrc={iconMasterGame}
              title="Master the Game"
              description="Learn real underwriting skills, manage contractors and tenants, and navigate shifting market conditions."
            />
          </div>
        </div>
      </section>

      {/* === YOUR PATH TO VICTORY === */}
      <section className="px-5 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-12"
            style={{ color: '#f0e6d0' }}
          >
            Your Path to Victory
          </h2>

          <div className="space-y-4">
            <StepCard
              number="1"
              title="Scout the Deals"
              description="Browse properties across different markets. Some look great on the surface but hide costly problems underneath."
            />
            <StepCard
              number="2"
              title="Investigate (or Gamble)"
              description="Pay for inspections and market studies to uncover the truth, or trust your gut and save your cash."
            />
            <StepCard
              number="3"
              title="Run the Numbers"
              description="Build your pro forma, set your financing, and decide: flip it fast or rent it out for monthly cash flow."
            />
            <StepCard
              number="4"
              title="Watch It Play Out"
              description="Time moves forward. Markets shift. Tenants call. Contractors surprise you. Did you spot the deal that breaks?"
            />
          </div>

          <div className="text-center mt-12">
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
          </div>
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
        className="text-sm leading-relaxed max-w-[260px]"
        style={{ color: 'rgba(200,195,180,0.55)' }}
      >
        {description}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex items-start gap-4 p-5 rounded-xl border"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(180,155,80,0.1)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        <span className="font-bold" style={{ color: '#d4af37' }}>{number}</span>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1" style={{ color: '#f0e6d0' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,195,180,0.5)' }}>{description}</p>
      </div>
    </div>
  );
}
