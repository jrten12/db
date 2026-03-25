import { lazy, Suspense } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Volume2, VolumeX, FileText, BarChart3, Zap, Shield, Building2, TrendingUp, Users, Wrench, LineChart, Dice6, Scale, EyeOff, Skull, Clock, Crosshair, Layers, SlidersHorizontal, Activity, Microscope, GitBranch, DollarSign, Target } from 'lucide-react';
import heroHouseImage from '@assets/Gemini_hero.webp';
import dbLogoImage from '@assets/db_logo_64.webp';
const heroBgPattern = '/hero-bg-pattern.webp';
import { useMusic } from '@/hooks/useMusicPlayer';

const GameShowcase = lazy(() => import('@/components/GameShowcase').then(m => ({ default: m.GameShowcase })));
const Footer = lazy(() => import('@/components/Footer'));

function MechanicCard({ Icon, accent, title, detail }: { Icon: any; accent: string; title: string; detail: string }) {
  return (
    <div
      className="group rounded-xl p-4 lg:p-5 transition-all"
      style={{
        background: `linear-gradient(160deg, ${accent}06, rgba(19,19,22,0.9))`,
        border: `1px solid ${accent}15`,
      }}
      data-testid={`mechanic-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}
        >
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="font-bold text-sm" style={{ color: '#f0e6d0' }}>{title}</h3>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(225,220,205,0.55)' }}>{detail}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details
      className="group rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(180,155,80,0.1)' }}
      data-testid={`faq-${question.slice(0, 20).toLowerCase().replace(/\s+/g, '-')}`}
    >
      <summary
        className="cursor-pointer p-4 text-sm font-semibold list-none flex items-center justify-between"
        style={{ color: '#e8dfc8' }}
      >
        {question}
        <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90 flex-shrink-0 ml-2" style={{ color: 'rgba(212,175,55,0.5)' }} />
      </summary>
      <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: 'rgba(225,220,205,0.55)' }}>
        {answer}
      </div>
    </details>
  );
}

function StatCallout({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-3">
      <div className="font-mono font-black text-lg sm:text-xl" style={{ color: '#d4af37' }}>{value}</div>
      <div className="text-[10px] sm:text-[11px] leading-tight mt-0.5" style={{ color: 'rgba(225,220,205,0.45)' }}>{label}</div>
    </div>
  );
}

export default function Landing() {
  const { isPlaying: isMusicPlaying, toggleMusic } = useMusic();

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-x-hidden"
      style={{ background: '#131316' }}
      data-testid="landing-page"
    >
      {/* === NAVIGATION BAR === */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #171719 0%, rgba(17,17,19,0.97) 100%)',
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
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMusic}
              className="p-2 rounded-full transition-all active:scale-[0.97]"
              style={{ color: '#d4af37' }}
              data-testid="button-toggle-music-landing"
            >
              {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* === TESTING PHASE BANNER (TEMPORARY) === */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, rgba(212,175,55,0.06) 0%, rgba(19,19,22,0.98) 50%, rgba(16,185,129,0.06) 100%)',
          borderBottom: '1px solid rgba(212,175,55,0.1)',
        }}
        data-testid="banner-testing-phase"
      >
        <div className="max-w-4xl mx-auto px-5 py-2 flex items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#d4af37' }} />
            <span className="text-[11px] sm:text-xs font-semibold tracking-wide" style={{ color: 'rgba(212,175,55,0.85)' }}>
              Final Testing Phase
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px]" style={{ color: 'rgba(225,220,205,0.4)' }}>
            We're actively refining mechanics, squashing bugs, and polishing every detail. Thanks for your patience as we get this right.
          </span>
        </div>
      </div>

      {/* === HERO SECTION === */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBgPattern}
            alt=""
            role="presentation"
            className="w-full h-full object-cover"
            style={{ opacity: 0.6 }}
            fetchPriority="high"
            width={1408}
            height={768}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, rgba(19,19,22,0.3) 0%, rgba(19,19,22,0.5) 30%, rgba(19,19,22,0.7) 70%, rgba(19,19,22,0.95) 100%),
                radial-gradient(ellipse 80% 60% at 50% 50%, transparent, rgba(19,19,22,0.4))
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

        <div className="relative z-10 max-w-6xl mx-auto px-5 py-5 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-16">
            <div className="flex-1 text-center lg:text-left mb-6 lg:mb-0">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(16,185,129,0.7)' }}>Real Estate Simulator</span>
              </div>

              <h1
                className="text-[2.2rem] sm:text-[2.8rem] lg:text-5xl xl:text-[3.5rem] leading-[1.08] font-bold tracking-tight mb-3"
                style={{
                  color: '#f5f0e0',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                }}
              >
                You've got $100K saved and a<br className="hidden sm:inline" /> real estate dream. See what you can do.
              </h1>

              <div className="space-y-1 mb-5 max-w-[520px] mx-auto lg:mx-0">
                <p
                  className="text-base sm:text-lg lg:text-xl font-medium leading-snug"
                  style={{
                    color: 'rgba(225,220,205,0.8)',
                    textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  You bought the deal. Now live with it.
                </p>
                <p
                  className="text-base sm:text-lg lg:text-xl font-medium leading-snug"
                  style={{
                    color: 'rgba(225,220,205,0.65)',
                    textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  Rent it. Sell it. Hold it together.
                </p>
                <p
                  className="text-base sm:text-lg lg:text-xl font-medium leading-snug"
                  style={{
                    color: 'rgba(225,220,205,0.5)',
                    textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  See if the numbers play out how you thought.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link href="/game">
                  <button
                    className="group w-full sm:w-auto min-w-[220px] py-4 px-10 rounded-xl font-bold text-[17px] tracking-wide transition-all active:scale-[0.97] flex items-center justify-center gap-2.5"
                    style={{
                      background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      boxShadow: '0 4px 24px rgba(16,185,129,0.35), 0 2px 0 #047857, 0 0 60px rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.4)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    Play Now
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
              </div>

              <div className="mt-5 flex items-center gap-4 justify-center lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)' }}>
                    <DollarSign className="w-3 h-3" style={{ color: '#10b981' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'rgba(225,220,205,0.4)' }}>$100K start</span>
                </div>
                <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <Clock className="w-3 h-3" style={{ color: '#3b82f6' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'rgba(225,220,205,0.4)' }}>52 months</span>
                </div>
                <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.15)' }}>
                    <Target className="w-3 h-3" style={{ color: '#fbbf24' }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'rgba(225,220,205,0.4)' }}>Free to play</span>
                </div>
              </div>
            </div>

            <div className="relative w-full max-w-[240px] sm:max-w-[300px] lg:max-w-[380px] xl:max-w-[420px] mx-auto lg:mx-0 lg:flex-shrink-0">
              <div
                className="absolute -inset-12 rounded-full blur-[80px]"
                style={{ background: 'rgba(212,175,55,0.1)' }}
              />
              <img
                src={heroHouseImage}
                alt="Dealbreak real estate investment simulator - analyze properties and close deals"
                className="relative w-full h-auto"
                width={420}
                height={420}
                fetchPriority="high"
                style={{
                  filter: 'drop-shadow(0 16px 48px rgba(0,0,0,0.5)) drop-shadow(0 4px 16px rgba(212,175,55,0.1))',
                }}
                data-testid="hero-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* === WHAT HAPPENS WHEN YOU PLAY (DOPAMINE LAYER) === */}
      <section className="py-6 lg:py-14 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 lg:mb-10">
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold mb-2 tracking-tight leading-tight"
              style={{ color: '#f0e6d0' }}
            >
              What Happens When You Play
            </h2>
            <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: 'rgba(225,220,205,0.5)' }}>
              Three decisions. One outcome you can't take back.
            </p>
          </div>

          {/* Visual story: Property vs Hidden Risk */}
          <div
            className="rounded-2xl overflow-hidden mb-6"
            style={{ border: '1px solid rgba(180,155,80,0.15)' }}
            data-testid="dopamine-visual-story"
          >
            <div className="grid grid-cols-2">
              <div className="relative">
                <img
                  src="/images/properties/hillside_retreat_front.jpg"
                  alt="Hillside Retreat - looks like a great deal"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  style={{ minHeight: '140px', maxHeight: '200px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                  <p className="text-white font-bold text-xs sm:text-sm">Hillside Retreat</p>
                  <p className="text-emerald-400 font-mono text-[11px] sm:text-xs font-bold">$248,000</p>
                </div>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold" style={{ background: 'rgba(16,185,129,0.25)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.4)' }}>
                  What you see
                </div>
              </div>
              <div className="relative">
                <img
                  src="/images/properties/issues_foundation_crack.jpg"
                  alt="Foundation crack discovered during inspection"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  style={{ minHeight: '140px', maxHeight: '200px' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 right-2 sm:right-3">
                  <p className="text-red-400 font-bold text-[11px] sm:text-xs">Foundation Crack</p>
                  <p className="text-red-300/70 font-mono text-[10px] sm:text-[11px]">−$18,000 repair</p>
                </div>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold" style={{ background: 'rgba(248,113,113,0.25)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}>
                  What you missed
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 text-center" style={{ background: 'rgba(19,19,22,0.95)' }}>
              <p className="text-[11px] sm:text-xs" style={{ color: 'rgba(225,220,205,0.5)' }}>
                Skip the inspection and you won't know until it's too late. <span style={{ color: '#f87171' }}>This is how deals break.</span>
              </p>
            </div>
          </div>

          {/* Three steps — horizontal on desktop, compact on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-5">
            <div className="rounded-xl p-4" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)' }} data-testid="dopamine-step-evaluate">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>01</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#22d3ee' }}>You Evaluate</span>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#f0e6d0' }}>
                "Looks like 8% cash-on-cash."
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(225,220,205,0.5)' }}>
                Rent estimate, comps, condition — it all checks out. But the listing never tells the whole story.
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }} data-testid="dopamine-step-commit">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.25)' }}>02</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>You Commit</span>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#f0e6d0' }}>
                "Going in at 80% LTV."
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(225,220,205,0.5)' }}>
                Down payment locked. Strategy chosen. Deal signed. The market doesn't care about your spreadsheet.
              </p>
            </div>

            <div className="rounded-xl p-4" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }} data-testid="dopamine-step-outcome">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>03</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>The Verdict</span>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: '#f0e6d0' }}>
                "+$24,300. Grade: A."
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(225,220,205,0.5)' }}>
                Or −$12,000. The postmortem shows what you got right, what you missed, and why.
              </p>
            </div>
          </div>

          {/* Micro-dopamine stat bar */}
          <div
            className="mt-5 lg:mt-8 rounded-xl py-3.5 px-3 flex items-center justify-around"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.04), rgba(19,19,22,0.95), rgba(16,185,129,0.04))',
              border: '1px solid rgba(180,155,80,0.1)',
            }}
            data-testid="stat-bar"
          >
            <StatCallout value="67%" label="of deals are traps" />
            <div className="w-px h-8" style={{ background: 'rgba(180,155,80,0.15)' }} />
            <StatCallout value="#1" label="mistake: ignoring holding costs" />
            <div className="w-px h-8 hidden sm:block" style={{ background: 'rgba(180,155,80,0.15)' }} />
            <div className="hidden sm:block">
              <StatCallout value="3.2x" label="avg. overestimate on first flip" />
            </div>
          </div>
        </div>
      </section>

      {/* === GAME SHOWCASE (GAMEPLAY FIRST) === */}
      <Suspense fallback={<div className="py-16" />}>
        <GameShowcase />
      </Suspense>

      {/* === THIS IS NOT A CALCULATOR === */}
      <section
        className="relative py-6 lg:py-16 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #131316 0%, #15151a 50%, #131316 100%)' }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }}
        />
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(212,175,55,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#f87171' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(248,113,113,0.8)' }}>Not a Calculator</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold mb-3 tracking-tight leading-tight"
              style={{ color: '#f0e6d0' }}
            >
              This Is a Simulation. Things Go Wrong.
            </h2>
            <p
              className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'rgba(225,220,205,0.55)' }}
            >
              You're not filling in a spreadsheet. You're making decisions with incomplete information, shifting conditions, and real consequences. Closer to poker than Excel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            <MechanicCard
              Icon={EyeOff}
              accent="#f87171"
              title="Hidden Variables"
              detail="Every property has problems you can't see from the listing. Pay for inspections or gamble. Skip due diligence and a termite infestation turns your flip into a teardown."
            />
            <MechanicCard
              Icon={LineChart}
              accent="#06b6d4"
              title="Markets That Move"
              detail="Hot, balanced, or crashing — market conditions shift during your game. Renovation costs spike. Rent demand drops. The same deal plays differently every time."
            />
            <MechanicCard
              Icon={Users}
              accent="#10b981"
              title="Tenants With Opinions"
              detail="Your tenants track satisfaction over time. Ignore a leak long enough and they leave — costing you turnover, vacancy, and months of lost income."
            />
            <MechanicCard
              Icon={Skull}
              accent="#f59e0b"
              title="Deferred Consequences"
              detail="That small issue you skipped in month two? By month eight it's a structural problem costing 2.5x to fix. Problems don't wait for you to notice them."
            />
            <MechanicCard
              Icon={Scale}
              accent="#a78bfa"
              title="Two Paths, Two Ways to Fail"
              detail="Flip for fast profit or rent for cash flow. Each strategy has its own financial model, timeline, and set of things that can quietly go wrong."
            />
            <MechanicCard
              Icon={Dice6}
              accent="#22d3ee"
              title="No Two Games Alike"
              detail="Property issues, market events, tenant behavior, and renovation outcomes are all procedurally generated. Your strategy has to adapt, not memorize."
            />
          </div>
        </div>
      </section>

      {/* === BUILT WITH PRECISION (DEPTH SHOWCASE) === */}
      <section className="py-6 lg:py-14 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 lg:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Microscope className="w-3 h-3" style={{ color: 'rgba(16,185,129,0.7)' }} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(16,185,129,0.8)' }}>Under the Hood</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.5rem] font-bold mb-3 tracking-tight leading-tight"
              style={{ color: '#f0e6d0' }}
            >
              Every Number Earns Its Place
            </h2>
            <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(225,220,205,0.55)' }}>
              This isn't surface-level. Every mechanic models a real variable that shapes real deals. The deeper you look, the more you find.
            </p>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(19,19,22,0.95) 0%, rgba(16,20,18,0.95) 100%)',
              border: '1px solid rgba(16,185,129,0.12)',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px" style={{ background: 'rgba(16,185,129,0.06)' }}>
              <div className="p-5 lg:p-6" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <SlidersHorizontal className="w-4 h-4" style={{ color: '#10b981' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#f0e6d0' }}>Multi-Variable Underwriting</h3>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.5)' }}>
                  Interest rates aren't random. A 6-factor model weighs your LTV, debt-to-income, cash reserves, net worth, market conditions, and track record — the same inputs a real lender evaluates.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['LTV Premium', 'DTI Gradient', 'Cash Reserves', 'Net Worth', 'Market Shift', 'Track Record'].map(f => (
                    <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: 'rgba(16,185,129,0.7)' }}>{f}</span>
                  ))}
                </div>
              </div>

              <div className="p-5 lg:p-6" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Activity className="w-4 h-4" style={{ color: '#d4af37' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#f0e6d0' }}>Living Properties</h3>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.5)' }}>
                  Properties aren't static assets. Unfixed issues escalate over time — mild in month two, critical by month ten. Tenant satisfaction tracks monthly, driving turnover risk. Market shifts adjust your rent in real time.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Expense Escalation', 'Tenant Mood', 'Market Rent Adj.', 'Turnover Cost'].map(f => (
                    <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)', color: 'rgba(212,175,55,0.7)' }}>{f}</span>
                  ))}
                </div>
              </div>

              <div className="p-5 lg:p-6" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                    <Crosshair className="w-4 h-4" style={{ color: '#06b6d4' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#f0e6d0' }}>Precision Postmortems</h3>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.5)' }}>
                  After every deal, a detailed breakdown compares your pro forma projections to actual outcomes line by line. Rent, vacancy, expenses, cash flow — each graded with an explanation of exactly where your assumptions held or broke down.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Pro Forma vs Reality', 'Letter Grade', 'Line-by-Line', 'Gap Analysis'].map(f => (
                    <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)', color: 'rgba(6,182,212,0.7)' }}>{f}</span>
                  ))}
                </div>
              </div>

              <div className="p-5 lg:p-6" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <GitBranch className="w-4 h-4" style={{ color: '#a855f7' }} />
                  </div>
                  <h3 className="font-bold text-sm" style={{ color: '#f0e6d0' }}>Branching Outcome Paths</h3>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.5)' }}>
                  Your diligence choices, contractor picks, repair selections, and financing structure all feed into outcome calculations. Renovation yields account for location, property type, market demand, and price tier — not just cost.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Renovation Resonance', 'Contractor Loyalty', 'Diligence Depth', 'Strategy Fork'].map(f => (
                    <span key={f} className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(168,85,247,0.7)' }}>{f}</span>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="px-5 py-3.5 text-center"
              style={{
                background: 'linear-gradient(90deg, rgba(16,185,129,0.04), rgba(19,19,22,0.98), rgba(212,175,55,0.04))',
                borderTop: '1px solid rgba(16,185,129,0.08)',
              }}
            >
              <p className="text-[11px] sm:text-xs leading-relaxed" style={{ color: 'rgba(225,220,205,0.45)' }}>
                Dozens of interconnected variables. Every deal calculated from first principles.
                <span className="ml-1 font-medium" style={{ color: 'rgba(16,185,129,0.7)' }}>The depth is the game.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === REAL SKILLS STRIP (EDUCATION REPOSITIONED) === */}
      <section className="py-4 lg:py-10 px-5">
        <div className="max-w-5xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(19,19,22,0.95) 40%, rgba(212,175,55,0.03) 100%)',
              border: '1px solid rgba(180,155,80,0.1)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), rgba(212,175,55,0.3), transparent)' }} />
            <div className="p-5 sm:p-7 lg:p-9">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(16,185,129,0.6)' }}>
                    You learn because you lost money — not before
                  </p>
                  <h2
                    className="text-xl sm:text-2xl font-bold mb-2 tracking-tight"
                    style={{ color: '#f0e6d0' }}
                  >
                    Every concept mirrors how real deals work.
                  </h2>
                  <p className="text-sm leading-relaxed max-w-lg" style={{ color: 'rgba(225,220,205,0.55)' }}>
                    Pro forma modeling, cap rate analysis, LTV-based financing, due diligence trade-offs, market timing — the same framework professional investors use, taught through the deals you play.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:gap-2.5 lg:max-w-[320px] flex-shrink-0">
                  {[
                    'Pro Forma Analysis',
                    'Cap Rates',
                    'Cash-on-Cash ROI',
                    'LTV & Leverage',
                    'Due Diligence',
                    'Market Timing',
                    'Risk Assessment',
                    'Portfolio Strategy',
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'rgba(225,220,205,0.6)',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === STRATEGY INTEL (EDUCATION BELOW GAMEPLAY) === */}
      <section className="py-2 lg:py-10 px-5">
        <div className="max-w-5xl mx-auto">
          <Link href="/learn">
            <div
              className="group relative overflow-hidden rounded-2xl cursor-pointer transition-all"
              style={{
                background: 'linear-gradient(145deg, rgba(24,22,19,0.95) 0%, rgba(32,28,22,0.9) 40%, rgba(22,26,22,0.9) 100%)',
                border: '1px solid rgba(180,155,80,0.18)',
                boxShadow: '0 0 40px rgba(212,175,55,0.04), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
              data-testid="section-learning-center-promo"
            >
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(212,175,55,0.3) 40px, rgba(212,175,55,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(212,175,55,0.3) 40px, rgba(212,175,55,0.3) 41px)' }} />
              <div className="absolute top-0 right-0 w-80 h-80 opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(circle at 80% 20%, rgba(212,175,55,1) 0%, transparent 60%)' }} />
              <div className="absolute bottom-0 left-0 w-60 h-60 opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(circle at 20% 80%, rgba(16,185,129,1) 0%, transparent 60%)' }} />

              <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(212,175,55,0.4) 30%, rgba(212,175,55,0.6) 50%, rgba(212,175,55,0.4) 70%, transparent 90%)' }} />

              <div className="relative p-5 sm:p-7 lg:p-9">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                        <FileText className="w-3.5 h-3.5" style={{ color: '#d4af37' }} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1" style={{ color: 'rgba(212,175,55,0.7)', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                        Strategy Intel
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight group-hover:text-amber-300 transition-colors" style={{ color: '#f0e6d0' }}>
                      Lost Money? Now Read Why.
                    </h2>
                    <p className="text-sm leading-relaxed mb-4 max-w-lg" style={{ color: 'rgba(225,220,205,0.65)' }}>
                      The deals that break look exactly like the ones that don't. These field guides teach you how to tell the difference — after you've felt it firsthand.
                    </p>

                    <div className="flex flex-wrap gap-2 mb-5">
                      {[
                        { label: 'Pro Forma', color: '#4ade80' },
                        { label: 'Market Analysis', color: '#60a5fa' },
                        { label: 'Risk Management', color: '#f87171' },
                        { label: 'Deal Strategy', color: '#fbbf24' },
                      ].map((topic) => (
                        <span
                          key={topic.label}
                          className="text-[10px] font-semibold px-2.5 py-1 rounded-md"
                          style={{ background: `${topic.color}08`, border: `1px solid ${topic.color}20`, color: topic.color }}
                        >
                          {topic.label}
                        </span>
                      ))}
                    </div>

                    <div
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold text-sm transition-all group-hover:brightness-110 group-hover:gap-3"
                      style={{
                        background: 'rgba(212,175,55,0.1)',
                        color: '#d4af37',
                        border: '1px solid rgba(212,175,55,0.3)',
                      }}
                    >
                      Open Briefing Room
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <div className="flex-shrink-0 lg:w-[280px]">
                    <div className="text-[10px] font-bold uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2" style={{ color: 'rgba(212,175,55,0.4)' }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.5)' }} />
                      Featured Intel
                    </div>
                    <div className="space-y-1">
                      {[
                        { Icon: BarChart3, title: 'Break Down a Pro Forma', xp: '+200 XP', color: '#4ade80' },
                        { Icon: Zap, title: 'The 1% Rule Shortcut', xp: '+150 XP', color: '#fbbf24' },
                        { Icon: Shield, title: 'Surviving a Crash', xp: '+300 XP', color: '#f87171' },
                        { Icon: Building2, title: 'Portfolio Playbook', xp: '+250 XP', color: '#60a5fa' },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all group-hover:bg-white/[0.02]"
                          style={{ borderLeft: `2px solid ${item.color}30` }}
                        >
                          <item.Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: item.color, opacity: 0.7 }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium leading-tight" style={{ color: '#ddd5c0' }}>{item.title}</div>
                          </div>
                          <span className="text-[9px] font-bold tracking-wide flex-shrink-0" style={{ color: `${item.color}90` }}>
                            {item.xp}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-1.5 text-center" style={{ borderTop: '1px solid rgba(180,155,80,0.08)' }}>
                      <span className="text-[11px] font-medium" style={{ color: 'rgba(212,175,55,0.35)' }}>
                        + more field guides inside
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="py-6 lg:py-14 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 tracking-tight"
            style={{ color: '#f0e6d0' }}
          >
            Think you can spot a bad deal?
          </h2>
          <p className="text-sm sm:text-base mb-2 max-w-xl mx-auto" style={{ color: 'rgba(225,220,205,0.5)' }}>
            $100,000 starting cash. 52 months on the clock. Dozens of properties, each hiding something. One wrong assumption and the whole deal breaks.
          </p>
          <p className="text-xs mb-2 max-w-lg mx-auto" style={{ color: 'rgba(225,220,205,0.35)' }}>
            Your pro forma won't match reality on day one — but each deal teaches you to refine your assumptions. Better diligence, sharper analysis, stronger results.
          </p>
          <p className="text-xs mb-6" style={{ color: 'rgba(248,113,113,0.5)' }}>
            Most players overestimate their first deal by 40%.
          </p>
          <Link href="/game">
            <button
              className="group py-3.5 px-10 rounded-lg font-bold text-lg transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
              style={{
                background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(16,185,129,0.35), 0 2px 0 #047857',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
              data-testid="button-start-first-deal"
            >
              Run Your First Deal
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="py-3 lg:py-14 px-5">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-center text-2xl sm:text-3xl font-bold mb-5 lg:mb-6"
            style={{ color: '#f0e6d0' }}
          >
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            <FaqItem
              question="Is Dealbreak free to play?"
              answer="Yes. The full game is free to play with no signup required. Optional premium boosts are available for players who want extra cash or time, but they're never required to win."
            />
            <FaqItem
              question="Will this teach me real estate investing?"
              answer="Yes — by making you do it. You'll learn pro forma analysis, cap rate calculations, LTV-based financing, and risk evaluation by experiencing the consequences of your own decisions. Your first pro forma probably won't match reality — but that's the point. Each deal sharpens your assumptions. Add more diligence, run better comps, and your projections get closer to what actually happens. The concepts mirror how real deals are evaluated by professional investors."
            />
            <FaqItem
              question="Is it really a game, or is it just a calculator?"
              answer="It's a full simulation. Markets shift mid-game. Tenants have satisfaction scores and can leave. Properties have hidden issues. Contractors give different prices. Your deals play out over months with events you can't predict. The financial models are real — the outcomes are earned."
            />
            <FaqItem
              question="How long does a game take?"
              answer="A single game runs 12 in-game months. Most players complete a game in 15-30 minutes, but you can save and come back anytime. Each deal within the game takes a few minutes to evaluate and commit to."
            />
            <FaqItem
              question="Can I play on my phone?"
              answer="Yes. Dealbreak is designed for mobile play. There's also a native iOS app available. The interface is optimized for touch with large tap targets and mobile-friendly controls."
            />
            <FaqItem
              question="What's the goal?"
              answer="Make money. You start with $100,000 in cash and 52 months. Buy properties, rent them for cash flow or flip them for profit, and try to end with more money than you started. The Hall of Fame tracks the best performers."
            />
          </div>
        </div>
      </section>

      {/* === DISCLAIMER === */}
      <div className="px-5 pb-2 pt-4 max-w-3xl mx-auto text-center">
        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(225,220,205,0.25)' }}>
          DealBreak Simulator is a game for educational purposes only. It does not constitute financial, investment, or legal advice. All scenarios, market conditions, and outcomes are simulated. Real estate investing involves substantial risk. Consult a qualified professional before making real investment decisions.
        </p>
        <p className="text-[10px] mt-2" style={{ color: 'rgba(225,220,205,0.15)' }}>v2.0</p>
      </div>

      {/* === FOOTER === */}
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
