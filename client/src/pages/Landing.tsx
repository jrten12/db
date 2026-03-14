import { Link } from 'wouter';
import { ArrowRight, Volume2, VolumeX, FileText, BarChart3, Zap, Shield, Building2 } from 'lucide-react';
import heroHouseImage from '@assets/Gemini_hero.webp';
import dbLogoImage from '@assets/db_logo_64.webp';
import heroBgPattern from '@/assets/images/hero-bg-pattern.webp';
import iconAnalyzeMarket from '@assets/Gemini_hero.webp';
import iconBuildWealth from '@assets/Gemini_feature1.webp';
import iconMasterGame from '@assets/Gemini_feature3.webp';
import Footer from '@/components/Footer';
import { useMusic } from '@/hooks/useMusicPlayer';

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
          <div className="flex items-center gap-4">
            <Link href="/learn">
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'rgba(212,175,55,0.7)' }} data-testid="link-learn-landing-nav">
                Learn
              </span>
            </Link>
            <Link href="/tools">
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'rgba(212,175,55,0.7)' }} data-testid="link-tools-landing-nav">
                Tools
              </span>
            </Link>
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
              <h1
                className="text-[2.2rem] sm:text-[2.8rem] lg:text-5xl xl:text-[3.5rem] leading-[1.08] font-bold tracking-tight mb-2"
                style={{
                  color: '#f5f0e0',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                }}
              >
                DealBreak Simulator
              </h1>

              <p
                className="text-lg sm:text-xl lg:text-2xl font-medium leading-snug max-w-[480px] mx-auto lg:mx-0 mb-3"
                style={{
                  color: 'rgba(225,220,205,0.7)',
                  textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                }}
              >
                A Real Estate Investing Simulator Game
              </p>

              <p
                className="text-[15px] sm:text-base leading-relaxed max-w-[520px] mx-auto lg:mx-0 mb-6"
                style={{
                  color: 'rgba(225,220,205,0.55)',
                  textShadow: '0 1px 8px rgba(0,0,0,0.3)',
                }}
              >
                DealBreak Simulator is a realistic real estate investing simulator game where you analyze properties, run pro formas, estimate renovation costs, and decide whether an investment deal succeeds or fails.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link href="/game">
                  <button
                    className="group w-full sm:w-auto min-w-[220px] py-3.5 px-10 rounded-lg font-bold text-[17px] tracking-wide transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      color: '#4ade80',
                      boxShadow: '0 0 20px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.05)',
                      border: '2px solid rgba(16,185,129,0.5)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    Start Playing
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </Link>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-5 mt-4 text-sm" style={{ color: 'rgba(225,220,205,0.45)' }}>
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

      {/* === STRATEGY INTEL PROMO === */}
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
                      Know the Game Before You Play It
                    </h2>
                    <p className="text-sm leading-relaxed mb-4 max-w-lg" style={{ color: 'rgba(225,220,205,0.65)' }}>
                      The deals that break look exactly like the ones that don't. These field guides teach you how to tell the difference.
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

      {/* === EVERY DEAL HAS A STORY === */}
      <section
        className="relative py-3 lg:py-16"
        style={{
          background: 'linear-gradient(180deg, #151518 0%, #131316 100%)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)',
          }}
        />
        <div className="max-w-5xl mx-auto px-5">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 lg:mb-12"
            style={{
              color: '#f0e6d0',
              fontStyle: 'italic',
            }}
          >
            Every Deal Has a Story
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 lg:gap-12">
            <FeatureColumn
              imageSrc={iconAnalyzeMarket}
              title="Analyze the Market"
              description="Use the real estate deal analyzer to study properties, compare locations, and spot the deals others miss. Every market has hidden opportunities and traps."
            />
            <FeatureColumn
              imageSrc={iconBuildWealth}
              title="Build Your Wealth"
              description="Flip houses for quick cash or hold rentals for steady income. This property investment simulator lets you balance risk and reward to grow your portfolio."
            />
            <FeatureColumn
              imageSrc={iconMasterGame}
              title="Master the Game"
              description="Learn real underwriting skills in this real estate simulator game. Manage contractors and tenants, and navigate shifting market conditions."
            />
          </div>
        </div>
      </section>

      {/* === YOUR PATH TO VICTORY === */}
      <section className="px-5 py-3 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 lg:mb-8"
            style={{ color: '#f0e6d0' }}
          >
            Your Path to Victory
          </h2>

          <div className="space-y-3">
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

          <div className="text-center mt-4 lg:mt-8">
            <Link href="/game">
              <button
                className="group py-3.5 px-8 rounded-lg font-bold text-lg transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
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

      {/* === WHAT YOU'LL LEARN === */}
      <section
        className="relative py-3 lg:py-14"
        style={{
          background: 'linear-gradient(180deg, #131316 0%, #151518 100%)',
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
          }}
        />
        <div className="max-w-4xl mx-auto px-5">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-3"
            style={{ color: '#f0e6d0' }}
          >
            Real Skills, Real Knowledge
          </h2>
          <p className="text-center text-sm sm:text-base max-w-2xl mx-auto mb-6 lg:mb-8" style={{ color: 'rgba(225,220,205,0.65)' }}>
            This real estate investing simulator teaches the same financial analysis skills used by professional investors. Every concept in the game mirrors how real deals are evaluated.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <SkillCard
              title="Pro Forma Analysis"
              description="Build financial models that project income, expenses, and returns — the foundation of every investment decision."
            />
            <SkillCard
              title="Cap Rates & Cash-on-Cash"
              description="Understand the key metrics investors use to compare properties and evaluate whether a deal meets their return targets."
            />
            <SkillCard
              title="Leverage & Financing"
              description="Learn how loan-to-value ratios, interest rates, and down payments affect your risk and return profile."
            />
            <SkillCard
              title="Due Diligence"
              description="Discover why inspections, title searches, and market studies are worth every dollar and week they cost."
            />
            <SkillCard
              title="Market Timing"
              description="Experience how shifting market conditions affect property values, sale prices, and investment strategy."
            />
            <SkillCard
              title="Risk Management"
              description="Learn to balance cash reserves, leverage, and deal selection to survive unexpected setbacks."
            />
          </div>
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
              answer="Dealbreak teaches the analytical framework that professional investors use — pro forma modeling, cap rate analysis, due diligence, and risk assessment. While it's a simulation and not financial advice, the skills transfer directly to evaluating real deals."
            />
            <FaqItem
              question="How long does a game take?"
              answer="A typical game takes 20-40 minutes. You manage a 12-month timeline, evaluating properties, running numbers, and executing deals. Each playthrough is different thanks to randomized properties, market conditions, and events."
            />
            <FaqItem
              question="What strategies can I use?"
              answer="You can flip properties (buy, renovate, sell for profit) or rent them out (buy, hold, collect monthly income). Each strategy has different risk-reward profiles, and the best players learn to mix both depending on market conditions and their financial position."
            />
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="px-5 py-2 text-center">
        <p className="text-sm" style={{ color: 'rgba(200,195,180,0.35)' }}>
          A real estate strategy game. Not financial advice.{' '}
          <Link href="/methodology" className="underline hover:no-underline" style={{ color: 'rgba(200,195,180,0.45)' }}>
            Read our methodology
          </Link>.
        </p>
        <div className="mt-2 flex items-center justify-center">
          <p className="text-xs font-mono" style={{ color: 'rgba(200,195,180,0.2)' }}>
            v3.4
          </p>
        </div>
      </div>

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
      <div className="w-20 h-20 sm:w-20 sm:h-20 lg:w-28 lg:h-28 mb-2 flex-shrink-0 rounded-2xl overflow-hidden"
        style={{
          background: 'radial-gradient(circle at center, rgba(34,34,40,0.8), rgba(20,20,24,0.9))',
          padding: '10px',
        }}
      >
        <img
          src={imageSrc}
          alt={title}
          className="w-full h-full object-contain"
          loading="lazy"
          width={112}
          height={112}
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.4))',
          }}
        />
      </div>
      <h3
        className="text-base lg:text-lg font-bold mb-1.5"
        style={{
          color: '#f0e6d0',
          fontStyle: 'italic',
        }}
      >
        {title}
      </h3>
      <p
        className="text-[14px] leading-relaxed max-w-[280px]"
        style={{ color: 'rgba(225,220,205,0.7)' }}
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
      className="flex items-start gap-3.5 p-4 rounded-xl border"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(180,155,80,0.12)',
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(212,175,55,0.1)',
          border: '1px solid rgba(212,175,55,0.2)',
        }}
      >
        <span className="font-bold text-sm" style={{ color: '#d4af37' }}>{number}</span>
      </div>
      <div>
        <h3 className="font-semibold text-base mb-0.5" style={{ color: '#f0e6d0' }}>{title}</h3>
        <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(225,220,205,0.65)' }}>{description}</p>
      </div>
    </div>
  );
}

function SkillCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(180,155,80,0.1)',
      }}
    >
      <h3 className="font-semibold text-sm mb-1" style={{ color: '#e8dfc8' }}>{title}</h3>
      <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(225,220,205,0.6)' }}>{description}</p>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <details
      className="group rounded-xl border overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        borderColor: 'rgba(180,155,80,0.08)',
      }}
    >
      <summary
        className="px-4 py-3.5 cursor-pointer select-none flex items-center justify-between"
        style={{ color: '#e8dfc8' }}
      >
        <span className="font-semibold text-[15px] pr-4">{question}</span>
        <span
          className="text-sm font-bold transition-transform group-open:rotate-45 flex-shrink-0"
          style={{ color: '#d4af37' }}
        >
          +
        </span>
      </summary>
      <div className="px-4 pb-4">
        <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(225,220,205,0.6)' }}>
          {answer}
        </p>
      </div>
    </details>
  );
}
