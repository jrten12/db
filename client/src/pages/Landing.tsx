import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Volume2, VolumeX, FileText, BarChart3, Zap, Shield, Building2, TrendingUp, Users, Wrench, LineChart, Dice6, Scale, EyeOff, Skull, Clock, Crosshair, Layers, SlidersHorizontal, Activity, Microscope, GitBranch, Trophy, Star, Target, ChevronRight, Gauge, Award, DollarSign, Flame, AlertTriangle, Eye, Radio } from 'lucide-react';
import { useMusic } from '@/hooks/useMusicPlayer';

function AnimatedCounter({ target, prefix = '', suffix = '', duration = 2000 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

function DealbreakMark() {
  return (
    <span className="dealbreak-mark" aria-hidden="true">
      <svg viewBox="0 0 40 40" role="img" focusable="false">
        <path d="M8 8h24M10 8l2 24h16l2-24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M13 26h14" stroke="currentColor" strokeWidth="1.3" opacity=".55" />
        <path d="M14 22h12l-2.2-5.3L20 19l-3.2-6-2.8 9Z" fill="currentColor" opacity=".9" />
        <path d="M14 22h12M16 17l2 2 2-3 2.2 2.7 1.8-1.5" fill="none" stroke="#0b1014" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 31h28" stroke="currentColor" strokeWidth="1.4" opacity=".5" />
        <path d="M9 34h22" stroke="currentColor" strokeWidth="1" opacity=".3" />
      </svg>
    </span>
  );
}

const GameShowcase = lazy(() => import('@/components/GameShowcase').then(m => ({ default: m.GameShowcase })));
const Footer = lazy(() => import('@/components/Footer'));

function MechanicCard({ Icon, accent, title, detail }: { Icon: any; accent: string; title: string; detail: string }) {
  return (
    <div
      className="group rounded-xl p-5 lg:p-6 transition-all"
      style={{
        background: `linear-gradient(160deg, ${accent}06, rgba(19,19,22,0.9))`,
        border: `1px solid ${accent}15`,
      }}
      data-testid={`mechanic-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}
        >
          <Icon className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: accent }} />
        </div>
        <h3 className="font-semibold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>{title}</h3>
      </div>
      <p className="text-sm lg:text-[15px] leading-relaxed" style={{ color: 'rgba(225,220,205,0.65)' }}>{detail}</p>
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
        className="cursor-pointer p-4 lg:p-5 text-sm lg:text-base font-semibold list-none flex items-center justify-between"
        style={{ color: '#e8dfc8' }}
      >
        {question}
        <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90 flex-shrink-0 ml-2" style={{ color: 'rgba(212,175,55,0.5)' }} />
      </summary>
      <div className="px-4 pb-4 lg:px-5 lg:pb-5 text-sm lg:text-[15px] leading-relaxed" style={{ color: 'rgba(225,220,205,0.65)' }}>
        {answer}
      </div>
    </details>
  );
}

function StatCallout({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center px-3 lg:px-5">
      <div className="font-mono font-black text-xl lg:text-2xl landing-stat-pulse" style={{ color: '#d4af37' }}>{value}</div>
      <div className="text-[11px] lg:text-xs leading-tight mt-1" style={{ color: 'rgba(225,220,205,0.6)' }}>{label}</div>
    </div>
  );
}

// Looping ticker of mock deal closes — gives the page a "live tape" beat
// without the AI-style floating-particle clutter. Pure CSS marquee, GPU-friendly.
function DealTapeTicker() {
  // Only uses neighborhoods that actually appear in the in-game property pool
  // (Philadelphia + outlying PA markets — see server/storage.ts seed data).
  const items: { place: string; amount: number; label: string; tone: 'win' | 'loss' | 'flat' }[] = [
    { place: 'Riverside Duplex', amount: 18420, label: 'Flip', tone: 'win' },
    { place: 'Fishtown Rowhome', amount: -3200, label: 'Sold short', tone: 'loss' },
    { place: 'Northern Liberties Triplex', amount: 41100, label: 'Rental sale', tone: 'win' },
    { place: 'Bryn Mawr Condo', amount: 6750, label: 'Flip', tone: 'win' },
    { place: 'Kensington SFR', amount: -8900, label: 'Bad reno', tone: 'loss' },
    { place: 'Old City Loft', amount: 23800, label: 'Flip', tone: 'win' },
    { place: 'Port Richmond Duplex', amount: 0, label: 'Walked away', tone: 'flat' },
    { place: 'Graduate Hospital SFR', amount: 12300, label: 'Rental sale', tone: 'win' },
    { place: 'Rittenhouse Square Condo', amount: 31600, label: 'Flip', tone: 'win' },
    { place: 'Queen Village Townhome', amount: -1450, label: 'Selling costs', tone: 'loss' },
    { place: 'Society Hill Brownstone', amount: 27900, label: 'Flip', tone: 'win' },
    { place: 'Fairmount Twin', amount: 9200, label: 'Rental sale', tone: 'win' },
    { place: 'Chestnut Hill Cottage', amount: -2100, label: 'Tenant turnover', tone: 'loss' },
    { place: 'Center City Studio', amount: 4800, label: 'Rental sale', tone: 'win' },
    { place: 'South Street Duplex', amount: 16700, label: 'Flip', tone: 'win' },
  ];
  const reel = [...items, ...items];
  return (
    <section
      className="relative overflow-hidden border-y"
      style={{ borderColor: 'rgba(212,175,55,0.12)', background: 'rgba(8,8,11,0.92)' }}
      data-testid="section-deal-tape"
      aria-label="Recent deal tape"
    >
      <div className="flex items-center gap-3 px-5 lg:px-8 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#d4af37' }} />
        <span className="font-mono text-[10px] lg:text-[11px] tracking-[0.22em] uppercase" style={{ color: 'rgba(225,220,205,0.5)' }}>
          Deal Tape · Last 24h of player closes
        </span>
      </div>
      <div className="relative py-3" aria-hidden="true">
        <div className="deal-tape-marquee flex gap-8 whitespace-nowrap will-change-transform">
          {reel.map((it, i) => {
            const tone =
              it.tone === 'win' ? 'rgba(74,222,128,0.95)' :
              it.tone === 'loss' ? 'rgba(248,113,113,0.9)' :
              'rgba(225,220,205,0.6)';
            const sign = it.amount > 0 ? '+' : it.amount < 0 ? '−' : '·';
            const value = it.amount === 0 ? '—' : `$${Math.abs(it.amount).toLocaleString()}`;
            return (
              <div key={`${it.place}-${i}`} className="flex items-center gap-3 px-1">
                <span className="font-mono text-[11px] lg:text-xs tracking-wider" style={{ color: 'rgba(225,220,205,0.5)' }}>
                  {it.place}
                </span>
                <span className="text-[10px] lg:text-[11px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(225,220,205,0.45)' }}>
                  {it.label}
                </span>
                <span className="font-mono text-sm lg:text-base font-bold tabular-nums" style={{ color: tone }}>
                  {sign}{value}
                </span>
                <span className="text-white/15">·</span>
              </div>
            );
          })}
        </div>
        {/* Edge fades */}
        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none" style={{ background: 'linear-gradient(90deg, rgba(8,8,11,1), transparent)' }} />
        <div className="absolute inset-y-0 right-0 w-16 pointer-events-none" style={{ background: 'linear-gradient(270deg, rgba(8,8,11,1), transparent)' }} />
      </div>
    </section>
  );
}

function PerformanceStatsShowcase() {
  return (
    <section
      className="relative py-10 lg:py-16 px-5 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1a1a1f 0%, #141418 50%, #1a1a1f 100%)' }}
      data-testid="section-performance-stats"
    >
      {/* AI-tell orbs removed — kept the seam line for separation only */}
      <div className="absolute inset-x-0 top-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.3), rgba(212,175,55,0.3), transparent)' }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-8 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <Gauge className="w-3.5 h-3.5" style={{ color: 'rgba(168,85,247,0.7)' }} />
            <span className="text-[11px] lg:text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(168,85,247,0.8)' }}>Track Your Growth</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[3rem] mb-3 tracking-[-0.015em] leading-[1.1]" style={{ color: '#f0e6d0', fontFamily: 'var(--font-premium)', fontWeight: 400 }}>
            Every Deal Shapes Your <span className="landing-gold-shimmer">Investor Profile</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(225,220,205,0.65)' }}>
            Real-time coaching, detailed scorecards, and benchmarks against other players. Track the metrics that matter — not just money, but the decisions behind it.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
          <div className="perf-stats-card p-5 lg:p-6 landing-float" data-testid="perf-card-profile">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(168,85,247,0.05))', border: '1px solid rgba(168,85,247,0.25)' }}>
                <Star className="w-5 h-5" style={{ color: '#a855f7' }} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>Investor Profile</h3>
                <p className="text-[11px] lg:text-xs" style={{ color: 'rgba(225,220,205,0.58)' }}>Updates with every decision</p>
              </div>
            </div>
            <div className="rounded-lg p-3 mb-3" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)' }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                </div>
                <span className="font-bold text-sm lg:text-[15px]" style={{ color: '#4ade80' }}>Savvy Investor</span>
              </div>
              <p className="text-[11px] lg:text-xs leading-relaxed" style={{ color: 'rgba(225,220,205,0.62)' }}>
                "Sharp underwriter who knows when to walk away."
              </p>
            </div>
            <div className="space-y-1.5">
              {['Diligence-first approach', 'Accurate pro forma models', 'Strong risk awareness'].map((trait) => (
                <div key={trait} className="flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 flex-shrink-0" style={{ color: 'rgba(168,85,247,0.5)' }} />
                  <span className="text-[11px] lg:text-[13px]" style={{ color: 'rgba(225,220,205,0.65)' }}>{trait}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="perf-stats-card p-5 lg:p-6 landing-float-delayed" data-testid="perf-card-scorecard">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Target className="w-5 h-5" style={{ color: '#10b981' }} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>Deal Scorecard</h3>
                <p className="text-[11px] lg:text-xs" style={{ color: 'rgba(225,220,205,0.58)' }}>Graded on what matters</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Underwriting Accuracy', value: 87, color: '#10b981' },
                { label: 'Risk Management', value: 72, color: '#06b6d4' },
                { label: 'Market Timing', value: 64, color: '#f59e0b' },
                { label: 'Portfolio Balance', value: 91, color: '#a855f7' },
              ].map((metric) => (
                <div key={metric.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] lg:text-xs font-medium" style={{ color: 'rgba(225,220,205,0.62)' }}>{metric.label}</span>
                    <span className="font-mono text-[11px] lg:text-[13px] font-bold" style={{ color: metric.color }}>{metric.value}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${metric.value}%`, background: `linear-gradient(90deg, ${metric.color}80, ${metric.color})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="perf-stats-card p-5 lg:p-6 landing-float" style={{ animationDelay: '0.5s' }} data-testid="perf-card-benchmarks">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.25)' }}>
                <Award className="w-5 h-5" style={{ color: '#d4af37' }} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>Benchmarks</h3>
                <p className="text-[11px] lg:text-xs" style={{ color: 'rgba(225,220,205,0.58)' }}>Compare against all players</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Cash-on-Cash Return', you: '8.4%', avg: '5.2%', better: true },
                { label: 'Diligence Depth', you: '4/4', avg: '2.1/4', better: true },
                { label: 'Avg Hold Period', you: '14 mo', avg: '18 mo', better: true },
                { label: 'Pro Forma Accuracy', you: 'B+', avg: 'C', better: true },
              ].map((bench) => (
                <div key={bench.label} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="text-[11px] lg:text-xs" style={{ color: 'rgba(225,220,205,0.6)' }}>{bench.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] lg:text-xs font-bold" style={{ color: bench.better ? '#4ade80' : '#f87171' }}>{bench.you}</span>
                    <div className="w-px h-3" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <span className="font-mono text-[11px] lg:text-xs" style={{ color: 'rgba(225,220,205,0.3)' }}>{bench.avg}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span className="text-[10px] font-medium" style={{ color: 'rgba(212,175,55,0.5)' }}>You vs. Average Player</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-5 lg:p-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.04), rgba(19,19,22,0.95), rgba(16,185,129,0.04))', border: '1px solid rgba(168,85,247,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <Trophy className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#fbbf24' }} />
            </div>
            <div>
              <p className="text-sm lg:text-base font-semibold" style={{ color: '#f0e6d0' }}>Personalized coaching after every deal</p>
              <p className="text-[11px] lg:text-xs" style={{ color: 'rgba(225,220,205,0.6)' }}>Suggestions adapt to your play style and weak spots</p>
            </div>
          </div>
          <Link href="/game">
            <button className="group flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-[0.97]" style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.3)' }} data-testid="button-see-your-stats">
              See Your Stats
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProfitPotentialStrip() {
  return (
    <section className="relative py-6 lg:py-10 px-5 lg:px-8 overflow-hidden" data-testid="profit-potential-strip">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* AI-tell glow orbs removed */}
      </div>
      <div className="relative z-10 max-w-6xl mx-auto">
        <div
          className="rounded-2xl py-6 lg:py-8 px-4 sm:px-8 lg:px-10 landing-border-glow"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.03) 0%, rgba(12,12,16,0.98) 50%, rgba(212,175,55,0.03) 100%)',
            border: '1px solid rgba(16,185,129,0.15)',
          }}
        >
          <div className="text-center mb-4">
            <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: 'rgba(16,185,129,0.6)' }}>Top Player Results</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
            <div className="text-center">
              <div className="font-mono font-black text-2xl sm:text-3xl lg:text-4xl landing-stat-pulse" style={{ color: '#10b981' }}>
                <AnimatedCounter target={142} prefix="+$" suffix="K" />
              </div>
              <div className="text-[10px] lg:text-xs mt-1" style={{ color: 'rgba(225,220,205,0.58)' }}>Best Portfolio Return</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-2xl sm:text-3xl lg:text-4xl landing-stat-pulse" style={{ color: '#d4af37', animationDelay: '0.5s' }}>
                <AnimatedCounter target={24} suffix="%" />
              </div>
              <div className="text-[10px] lg:text-xs mt-1" style={{ color: 'rgba(225,220,205,0.58)' }}>Cash-on-Cash ROI</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-2xl sm:text-3xl lg:text-4xl landing-stat-pulse" style={{ color: '#06b6d4', animationDelay: '1s' }}>
                <AnimatedCounter target={38} prefix="$" suffix="K" />
              </div>
              <div className="text-[10px] lg:text-xs mt-1" style={{ color: 'rgba(225,220,205,0.58)' }}>Single Flip Profit</div>
            </div>
            <div className="text-center">
              <div className="font-mono font-black text-2xl sm:text-3xl lg:text-4xl landing-stat-pulse" style={{ color: '#a855f7', animationDelay: '1.5s' }}>
                A+
              </div>
              <div className="text-[10px] lg:text-xs mt-1" style={{ color: 'rgba(225,220,205,0.58)' }}>Highest Accuracy Grade</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Landing() {
  const { isPlaying: isMusicPlaying, toggleMusic } = useMusic();

  return (
    <div
      className="min-h-screen min-h-[100dvh] overflow-x-hidden safe-area-x"
      style={{ background: '#1a1a1f' }}
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
        <div className="flex items-center justify-between px-5 lg:px-8 py-3 lg:py-4 pt-[max(0.75rem,env(safe-area-inset-top))] max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5 lg:gap-3">
            <DealbreakMark />
            <span
              className="font-bold text-lg lg:text-xl tracking-wide"
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
      {/* === HERO SECTION === */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="landing-architecture" aria-hidden="true">
            <svg viewBox="0 0 1600 760" preserveAspectRatio="none" focusable="false">
              <defs>
                <linearGradient id="skylineFade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#102b3a" stopOpacity=".16" />
                  <stop offset="1" stopColor="#071116" stopOpacity=".92" />
                </linearGradient>
              </defs>
              <rect width="1600" height="760" fill="url(#skylineFade)" />
              <g className="landing-architecture-lines" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M0 606h1600M0 668h1600M0 720h1600" />
                <path d="M0 606V474h72l34-38 34 38h72v132M178 606V402h108l38-43 40 43h100v204M464 606V326h170l74-78 74 78h208v280M990 606V416h76v-92h90v92h68v-145h126v145h76v190M1452 606V390h86l31-36 31 36v216" />
                <path d="M0 755h1600M48 742h240M390 742h380M920 742h280M1370 742h180" strokeDasharray="3 10" />
              </g>
              <g className="landing-architecture-windows" fill="currentColor">
                <path d="M30 510h12v26H30zM58 510h12v26H58zM214 442h14v22h-14zM246 442h14v22h-14zM500 370h16v27h-16zM540 370h16v27h-16zM600 370h16v27h-16zM730 296h14v28h-14zM770 296h14v28h-14zM814 370h16v27h-16zM1030 455h13v23h-13zM1110 455h13v23h-13zM1220 332h15v26h-15zM1260 332h15v26h-15zM1500 442h13v24h-13z" />
              </g>
              <g className="landing-architecture-plan" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M110 112h230v132H110zM110 178h100v66M210 112v66h130M275 178v66" />
                <path d="M1260 102h228v138h-228zM1260 170h82v70M1342 102v68h146M1416 170v70" />
                <circle cx="110" cy="112" r="8" /><circle cx="1488" cy="102" r="8" />
              </g>
            </svg>
          </div>
          <div
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(180deg, rgba(19,19,22,0.5) 0%, rgba(19,19,22,0.6) 30%, rgba(19,19,22,0.8) 70%, rgba(19,19,22,0.98) 100%),
                radial-gradient(ellipse 80% 60% at 50% 50%, transparent, rgba(19,19,22,0.5))
              `,
            }}
          />
        </div>

        {/* Editorial calm above-fold — no floating profit particles, no green accent */}
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.35), rgba(180,140,60,0.25), rgba(212,175,55,0.35), transparent)' }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 py-8 sm:py-8 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12 xl:gap-16">

            {/* LEFT: Scenario entry — modern fintech, no detective theme */}
            <div className="relative flex-1 mb-8 lg:mb-0 lg:pt-2">
              {/* Soft conic accent behind headline — modern depth, not a stamp */}
              <div
                aria-hidden="true"
                className="absolute pointer-events-none -top-12 -left-10 w-[420px] h-[420px] opacity-[0.12]"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, rgba(212,175,55,0.5), transparent 55%), radial-gradient(circle at 70% 60%, rgba(96,165,250,0.35), transparent 60%)',
                  filter: 'blur(40px)',
                }}
              />

              <div className="relative z-10">
                {/* Eyebrow tag — ultra-modern HUD chip */}
                <div className="inline-flex items-center gap-2 mb-5 px-2.5 py-1 rounded-md landing-now-playing"
                  style={{
                    background: 'rgba(212,175,55,0.08)',
                    border: '1px solid rgba(212,175,55,0.22)',
                  }}
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: '#d4af37' }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#d4af37' }} />
                  </span>
                  <span className="font-mono text-[10px] lg:text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: '#d4af37' }}>Now Playing</span>
                  <span className="w-px h-3" style={{ background: 'rgba(212,175,55,0.3)' }} />
                  <span className="font-mono text-[10px] lg:text-[11px] tabular-nums tracking-wider" style={{ color: 'rgba(212,175,55,0.7)' }}>Month 03 / 52</span>
                </div>

                {/* Headline — sharper, smaller, less AI-looking */}
                <h1
                  className="mb-3 text-[2rem] sm:text-[2.4rem] lg:text-[2.9rem] xl:text-[3.3rem] leading-[1.05] tracking-[-0.03em]"
                  style={{ color: '#f5f0e0', fontFamily: 'var(--font-sans)', fontWeight: 700 }}
                >
                  You closed on a{' '}
                  <span
                    style={{
                      background: 'linear-gradient(180deg, #fef3c7 0%, #d4af37 60%, #b08e1f 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    duplex
                  </span>.<br />
                  <span style={{ color: '#7dd3fc', fontWeight: 600 }}>One tenant is already late.</span>
                </h1>

                {/* Hook — what the game actually is, no duration framing */}
                <p className="text-[14px] lg:text-[15px] mb-6 max-w-[540px] leading-relaxed" style={{ color: 'rgba(225,220,205,0.72)' }}>
                  Buy real properties, run the pro forma, manage tenants and repairs, and see how big a portfolio you can build before your decisions catch up to you. <span className="font-semibold" style={{ color: '#f5f0e0' }}>$100K to start. Every choice compounds.</span>
                </p>

                {/* CTAs */}
                <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                  <Link href="/game" className="w-full sm:w-auto">
                    <button
                      className="group relative w-full sm:w-auto min-w-[210px] py-3.5 lg:py-4 px-6 lg:px-7 font-semibold text-[15px] lg:text-base tracking-tight transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[52px] sm:min-h-0"
                      style={{
                        background: 'linear-gradient(180deg, #f0c84a 0%, #d4af37 100%)',
                        color: '#0a0a0d',
                        borderRadius: '10px',
                        boxShadow: '0 1px 0 rgba(255,255,255,0.35) inset, 0 8px 24px -4px rgba(212,175,55,0.45), 0 2px 6px rgba(0,0,0,0.2)',
                      }}
                      data-testid="button-play-simulator"
                    >
                      <span>Start New Game</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
                    </button>
                  </Link>
                  <Link href="/methodology" className="w-full sm:w-auto">
                    <button
                      className="w-full sm:w-auto py-3.5 lg:py-4 px-5 lg:px-6 font-semibold text-[15px] lg:text-base tracking-tight transition-all duration-200 hover:bg-white/5 flex items-center justify-center gap-2"
                      style={{
                        color: 'rgba(225,220,205,0.8)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      data-testid="button-how-it-works"
                    >
                      How it works
                    </button>
                  </Link>
                </div>

                {/* In-game event stream — live simulation telemetry */}
                <div
                  className="max-w-[560px] overflow-hidden rounded-xl landing-event-feed"
                  style={{
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center gap-2">
                      <Radio className="w-3 h-3 landing-data-flicker" style={{ color: '#4ade80' }} />
                      <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#72c7e6' }}>Simulation feed</span>
                    </div>
                    <span className="landing-feed-live"><span /> LIVE / Wk 12</span>
                  </div>
                  <div className="relative h-[132px] overflow-hidden">
                    <div className="landing-event-scroll absolute inset-x-0 top-0 space-y-0">
                      {[
                        { Icon: AlertTriangle, color: '#f87171', kind: 'RISK', label: 'Unit A overdue by 12 days', meta: '−$875' },
                        { Icon: Wrench, color: '#fbbf24', kind: 'REPAIR', label: 'Water heater risk rising', meta: '$2,800' },
                        { Icon: TrendingUp, color: '#4ade80', kind: 'CASH', label: 'Cash flow +$284 this month', meta: '+$284' },
                        { Icon: Activity, color: '#f59e0b', kind: 'MARKET', label: 'Rates trending upward', meta: '+0.25%' },
                        { Icon: Users, color: '#60a5fa', kind: 'CHOICE', label: 'Decision: contact tenant or wait', meta: 'PENDING' },
                        { Icon: Clock, color: '#a78bfa', kind: 'CLOCK', label: '49 months remaining in run', meta: 'WEEK 12' },
                        { Icon: AlertTriangle, color: '#f87171', kind: 'RISK', label: 'Unit A overdue by 12 days', meta: '−$875' },
                        { Icon: Wrench, color: '#fbbf24', kind: 'REPAIR', label: 'Water heater risk rising', meta: '$2,800' },
                      ].map((evt, i) => (
                        <div key={i} className="flex items-center gap-2.5 px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <div className="landing-feed-icon"><evt.Icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: evt.color }} /></div>
                          <span className="landing-feed-kind" style={{ color: evt.color }}>{evt.kind}</span>
                          <span className="text-[11px] flex-1 truncate" style={{ color: 'rgba(225,220,205,0.85)' }}>{evt.label}</span>
                          <span className="font-mono text-[10px] tabular-nums flex-shrink-0" style={{ color: 'rgba(225,220,205,0.55)' }}>{evt.meta}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-6 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Modern glass dashboard panel */}
            <div className="w-full lg:w-[420px] xl:w-[480px] flex-shrink-0 landing-float">
              <div
                className="relative overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, rgba(20,20,26,0.92) 0%, rgba(10,10,14,0.96) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset, 0 60px 120px -20px rgba(212,175,55,0.08)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(20px)',
                }}
                data-testid="hero-dashboard-panel"
              >
                {/* Gradient hairline accent */}
                <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)' }} />

                {/* Panel header — modern app header */}
                <div className="landing-preview-head flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(212,175,55,0.18), rgba(212,175,55,0.04))', border: '1px solid rgba(212,175,55,0.22)' }}>
                      <Building2 className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: '#d4af37' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold tracking-tight" style={{ color: '#f5f0e0' }}>Riverside Duplex</span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-[0.1em] uppercase"
                          style={{ color: '#60a5fa', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.2)' }}
                        >
                          Rental
                        </span>
                      </div>
                      <div className="text-[10.5px] mt-0.5" style={{ color: 'rgba(225,220,205,0.45)' }}>Riverside · Philadelphia, PA</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
                    <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#4ade80' }}>Active</span>
                  </div>
                </div>

                {/* Progress timeline — slim, modern */}
                <div className="landing-preview-progress px-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(225,220,205,0.4)' }}>Month progress</span>
                    <span className="font-mono text-[11px] tabular-nums" style={{ color: 'rgba(225,220,205,0.55)' }}>3 / 52</span>
                  </div>
                  <div className="landing-progress-track h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-full rounded-full" style={{ width: '5.8%', background: 'linear-gradient(90deg, #d4af37, #fbbf24)', boxShadow: '0 0 8px rgba(212,175,55,0.5)' }} />
                  </div>
                </div>

                {/* Financial grid — modern stat cards */}
                <div className="landing-preview-financials px-5 pb-5">
                  <div className="landing-stat-grid grid grid-cols-2 gap-2">
                    <div className="landing-stat-cell landing-stat-purchase p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="text-[9.5px] uppercase tracking-[0.12em] mb-1 font-bold" style={{ color: 'rgba(225,220,205,0.4)' }}>Purchase</div>
                      <div className="text-[17px] font-bold tabular-nums tracking-tight" style={{ color: '#f5f0e0', fontFamily: 'var(--font-sans)' }}>$293,000</div>
                    </div>
                    <div className="landing-stat-cell landing-stat-cash p-3 rounded-xl" style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.12)' }}>
                      <div className="text-[9.5px] uppercase tracking-[0.12em] mb-1 font-bold" style={{ color: 'rgba(251,191,36,0.65)' }}>Cash Left</div>
                      <div className="text-[17px] font-bold tabular-nums tracking-tight" style={{ color: '#fbbf24', fontFamily: 'var(--font-sans)' }}>$41,200</div>
                    </div>
                    <div className="landing-stat-cell landing-stat-flow p-3 rounded-xl" style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.15)' }}>
                      <div className="text-[9.5px] uppercase tracking-[0.12em] mb-1 font-bold flex items-center gap-1" style={{ color: 'rgba(74,222,128,0.65)' }}>
                        <TrendingUp className="w-2.5 h-2.5" strokeWidth={2} /> Cash Flow
                      </div>
                      <div className="text-[17px] font-bold tabular-nums tracking-tight" style={{ color: '#4ade80', fontFamily: 'var(--font-sans)' }}>
                        +$284<span className="text-[11px] ml-0.5" style={{ color: 'rgba(74,222,128,0.55)' }}>/mo</span>
                      </div>
                    </div>
                    <div className="landing-stat-cell landing-stat-coc p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="text-[9.5px] uppercase tracking-[0.12em] mb-1 font-bold" style={{ color: 'rgba(225,220,205,0.4)' }}>Cash-on-Cash</div>
                      <div className="text-[17px] font-bold tabular-nums tracking-tight" style={{ color: '#f5f0e0', fontFamily: 'var(--font-sans)' }}>
                        4.7<span className="text-[11px] ml-0.5" style={{ color: 'rgba(225,220,205,0.4)' }}>%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active issues — modern alert rows */}
                <div className="landing-preview-issues px-5 pb-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(225,220,205,0.4)' }}>Active issues</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)' }}>2</span>
                  </div>
                  <div
                    className="landing-issue-row landing-issue-danger flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                    style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.12)' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f87171', boxShadow: '0 0 8px rgba(248,113,113,0.6)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold" style={{ color: '#fca5a5' }}>Tenant late on rent</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(225,220,205,0.4)' }}>Unit A · 12 days overdue</div>
                    </div>
                    <span className="font-mono text-[12px] font-bold tabular-nums" style={{ color: '#f87171' }}>−$875</span>
                  </div>
                  <div
                    className="landing-issue-row landing-issue-warning flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-white/[0.02]"
                    style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.5)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-semibold" style={{ color: '#fbbf24' }}>Water heater failing</div>
                      <div className="text-[10px] mt-0.5" style={{ color: 'rgba(225,220,205,0.4)' }}>Repair estimate · $2,800</div>
                    </div>
                    <Wrench className="w-3.5 h-3.5" strokeWidth={1.75} style={{ color: 'rgba(245,158,11,0.6)' }} />
                  </div>
                </div>

                {/* Decision queue — pending player actions */}
                <div className="landing-preview-queue px-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(225,220,205,0.4)' }}>Decision queue</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md" style={{ color: '#d4af37', background: 'rgba(212,175,55,0.1)' }}>3</span>
                  </div>
                  <div className="landing-queue-list rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {[
                      { label: 'Choose tenant response', meta: 'Late rent · Unit A' },
                      { label: 'Approve repair timing', meta: 'Water heater' },
                      { label: 'Review reserve impact', meta: 'Cash $41.2K' },
                    ].map((d, i, arr) => (
                      <div
                        key={d.label}
                        className="landing-queue-row flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-white/[0.03]"
                        style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.04)' } : undefined}
                      >
                        <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.18)' }}>
                          <span className="font-mono text-[10px] font-bold" style={{ color: '#d4af37' }}>{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-semibold truncate" style={{ color: '#f5f0e0' }}>{d.label}</div>
                          <div className="text-[10px] truncate" style={{ color: 'rgba(225,220,205,0.4)' }}>{d.meta}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} style={{ color: 'rgba(225,220,205,0.35)' }} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer status bar */}
                <div className="landing-preview-footer px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" strokeWidth={1.75} style={{ color: 'rgba(96,165,250,0.7)' }} />
                      <span className="text-[10.5px] font-semibold" style={{ color: 'rgba(225,220,205,0.65)' }}>49 mo left</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" strokeWidth={1.75} style={{ color: '#f59e0b' }} />
                      <span className="text-[10.5px] font-semibold" style={{ color: 'rgba(225,220,205,0.65)' }}>Rates rising</span>
                    </div>
                  </div>
                  <span className="text-[10.5px] font-semibold" style={{ color: 'rgba(225,220,205,0.4)' }}>Game preview</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live deal-tape ticker — below the fold, sets the "real game in motion" tone */}
      <DealTapeTicker />

      {/* === WHAT HAPPENS WHEN YOU PLAY (DOPAMINE LAYER) === */}
      <section className="py-10 lg:py-16 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 lg:mb-10">
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.75rem] font-serif mb-2 tracking-[-0.01em] leading-tight"
              style={{ color: '#f0e6d0' }}
            >
              What Happens When You Play
            </h2>
            <p className="text-sm sm:text-base lg:text-lg max-w-xl mx-auto" style={{ color: 'rgba(225,220,205,0.62)' }}>
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
                  <p className="text-white font-bold text-sm lg:text-base">Hillside Retreat</p>
                  <p className="text-emerald-400 font-mono text-xs lg:text-sm font-bold">$248,000</p>
                </div>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 rounded text-[10px] lg:text-[11px] font-bold" style={{ background: 'rgba(16,185,129,0.25)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.4)' }}>
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
                  <p className="text-red-400 font-bold text-xs lg:text-sm">Foundation Crack</p>
                  <p className="text-red-300/70 font-mono text-[11px] lg:text-xs">−$18,000 repair</p>
                </div>
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-0.5 rounded text-[10px] lg:text-[11px] font-bold" style={{ background: 'rgba(248,113,113,0.25)', color: '#f87171', border: '1px solid rgba(248,113,113,0.4)' }}>
                  What you missed
                </div>
              </div>
            </div>
            <div className="px-4 lg:px-5 py-3 text-center" style={{ background: 'rgba(19,19,22,0.95)' }}>
              <p className="text-xs lg:text-sm" style={{ color: 'rgba(225,220,205,0.62)' }}>
                Skip the inspection and you won't know until it's too late. <span style={{ color: '#f87171' }}>This is how deals break.</span>
              </p>
            </div>
          </div>

          {/* Three steps — horizontal on desktop, compact on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-5">
            <div className="rounded-xl p-5 lg:p-6" style={{ background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.12)' }} data-testid="dopamine-step-evaluate">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] lg:text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.12)', color: '#22d3ee', border: '1px solid rgba(6,182,212,0.25)' }}>01</span>
                <span className="text-xs lg:text-sm font-bold uppercase tracking-wider" style={{ color: '#22d3ee' }}>You Evaluate</span>
              </div>
              <p className="text-sm lg:text-base font-semibold mb-1" style={{ color: '#f0e6d0' }}>
                "Looks like 8% cash-on-cash."
              </p>
              <p className="text-xs lg:text-sm leading-relaxed" style={{ color: 'rgba(225,220,205,0.62)' }}>
                Rent estimate, comps, condition — it all checks out. But the listing never tells the whole story.
              </p>
            </div>

            <div className="rounded-xl p-5 lg:p-6" style={{ background: 'rgba(212,175,55,0.04)', border: '1px solid rgba(212,175,55,0.12)' }} data-testid="dopamine-step-commit">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] lg:text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.12)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.25)' }}>02</span>
                <span className="text-xs lg:text-sm font-bold uppercase tracking-wider" style={{ color: '#d4af37' }}>You Commit</span>
              </div>
              <p className="text-sm lg:text-base font-semibold mb-1" style={{ color: '#f0e6d0' }}>
                "Going in at 80% LTV."
              </p>
              <p className="text-xs lg:text-sm leading-relaxed" style={{ color: 'rgba(225,220,205,0.62)' }}>
                Down payment locked. Strategy chosen. Deal signed. The market doesn't care about your spreadsheet.
              </p>
            </div>

            <div className="rounded-xl p-5 lg:p-6" style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }} data-testid="dopamine-step-outcome">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] lg:text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>03</span>
                <span className="text-xs lg:text-sm font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>The Verdict</span>
              </div>
              <p className="text-sm lg:text-base font-semibold mb-1" style={{ color: '#f0e6d0' }}>
                "+$24,300. Grade: A."
              </p>
              <p className="text-xs lg:text-sm leading-relaxed" style={{ color: 'rgba(225,220,205,0.62)' }}>
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
      {/* === PROFIT POTENTIAL STRIP === */}
      <ProfitPotentialStrip />
      {/* === GAME SHOWCASE (GAMEPLAY FIRST) === */}
      <Suspense fallback={<div className="py-16" />}>
        <GameShowcase />
      </Suspense>
      {/* === PERFORMANCE STATS SHOWCASE === */}
      <PerformanceStatsShowcase />
      {/* === THIS IS NOT A CALCULATOR === */}
      <section
        className="relative py-10 lg:py-16 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a1a1f 0%, #15151a 50%, #1a1a1f 100%)' }}
      >
        <div
          className="absolute inset-x-0 top-0 h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }}
        />
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(212,175,55,0.4) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="text-center mb-8 lg:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#f87171' }} />
              <span className="text-[11px] lg:text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(248,113,113,0.8)' }}>Not a Calculator</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.75rem] font-serif mb-3 tracking-[-0.01em] leading-tight"
              style={{ color: '#f0e6d0' }}
            >
              This Is a Simulation. Things Go Wrong.
            </h2>
            <p
              className="text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'rgba(225,220,205,0.65)' }}
            >
              You're not filling in a spreadsheet. You're making decisions with incomplete information, shifting conditions, and real consequences. Closer to poker than Excel.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
      <section className="py-10 lg:py-16 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 lg:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Microscope className="w-3.5 h-3.5" style={{ color: 'rgba(16,185,129,0.7)' }} />
              <span className="text-[11px] lg:text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(16,185,129,0.8)' }}>Under the Hood</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-[2.75rem] font-serif mb-3 tracking-[-0.01em] leading-tight"
              style={{ color: '#f0e6d0' }}
            >
              Every Number Earns Its Place
            </h2>
            <p className="text-sm sm:text-base lg:text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'rgba(225,220,205,0.65)' }}>
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
              <div className="p-5 lg:p-7" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <SlidersHorizontal className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#10b981' }} />
                  </div>
                  <h3 className="font-bold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>Multi-Variable Underwriting</h3>
                </div>
                <p className="text-sm lg:text-[15px] leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.62)' }}>
                  Interest rates aren't random. A 6-factor model weighs your LTV, debt-to-income, cash reserves, net worth, market conditions, and track record — the same inputs a real lender evaluates.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['LTV Premium', 'DTI Gradient', 'Cash Reserves', 'Net Worth', 'Market Shift', 'Track Record'].map(f => (
                    <span key={f} className="text-[10px] lg:text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', color: 'rgba(16,185,129,0.7)' }}>{f}</span>
                  ))}
                </div>
              </div>

              <div className="p-5 lg:p-7" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}>
                    <Activity className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#d4af37' }} />
                  </div>
                  <h3 className="font-bold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>Living Properties</h3>
                </div>
                <p className="text-sm lg:text-[15px] leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.62)' }}>
                  Properties aren't static assets. Unfixed issues escalate over time — mild in month two, critical by month ten. Tenant satisfaction tracks monthly, driving turnover risk. Market shifts adjust your rent in real time.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Expense Escalation', 'Tenant Mood', 'Market Rent Adj.', 'Turnover Cost'].map(f => (
                    <span key={f} className="text-[10px] lg:text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)', color: 'rgba(212,175,55,0.7)' }}>{f}</span>
                  ))}
                </div>
              </div>

              <div className="p-5 lg:p-7" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                    <Crosshair className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#06b6d4' }} />
                  </div>
                  <h3 className="font-bold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>Precision Postmortems</h3>
                </div>
                <p className="text-sm lg:text-[15px] leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.62)' }}>
                  After every deal, a detailed breakdown compares your pro forma projections to actual outcomes line by line. Rent, vacancy, expenses, cash flow — each graded with an explanation of exactly where your assumptions held or broke down.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Pro Forma vs Reality', 'Letter Grade', 'Line-by-Line', 'Gap Analysis'].map(f => (
                    <span key={f} className="text-[10px] lg:text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.12)', color: 'rgba(6,182,212,0.7)' }}>{f}</span>
                  ))}
                </div>
              </div>

              <div className="p-5 lg:p-7" style={{ background: 'rgba(19,19,22,0.98)' }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <GitBranch className="w-4 h-4 lg:w-5 lg:h-5" style={{ color: '#a855f7' }} />
                  </div>
                  <h3 className="font-bold text-[15px] lg:text-base" style={{ color: '#f0e6d0' }}>Branching Outcome Paths</h3>
                </div>
                <p className="text-sm lg:text-[15px] leading-relaxed mb-3" style={{ color: 'rgba(225,220,205,0.62)' }}>
                  Your diligence choices, contractor picks, repair selections, and financing structure all feed into outcome calculations. Renovation yields account for location, property type, market demand, and price tier — not just cost.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['Renovation Resonance', 'Contractor Loyalty', 'Diligence Depth', 'Strategy Fork'].map(f => (
                    <span key={f} className="text-[10px] lg:text-[11px] font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)', color: 'rgba(168,85,247,0.7)' }}>{f}</span>
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
              <p className="text-xs lg:text-sm leading-relaxed" style={{ color: 'rgba(225,220,205,0.6)' }}>
                Dozens of interconnected variables. Every deal calculated from first principles.
                <span className="ml-1 font-medium" style={{ color: 'rgba(16,185,129,0.7)' }}>The depth is the game.</span>
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* === REAL SKILLS STRIP (EDUCATION REPOSITIONED) === */}
      <section className="py-8 lg:py-12 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.04) 0%, rgba(19,19,22,0.95) 40%, rgba(212,175,55,0.03) 100%)',
              border: '1px solid rgba(180,155,80,0.1)',
            }}
          >
            <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), rgba(212,175,55,0.3), transparent)' }} />
            <div className="p-5 sm:p-7 lg:p-10">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-14">
                <div className="flex-1">
                  <p className="text-xs lg:text-sm font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(16,185,129,0.6)' }}>
                    You learn because you lost money — not before
                  </p>
                  <h2
                    className="text-xl sm:text-2xl lg:text-3xl font-serif mb-2 tracking-[-0.01em]"
                    style={{ color: '#f0e6d0' }}
                  >
                    Every concept mirrors how real deals work.
                  </h2>
                  <p className="text-sm lg:text-base leading-relaxed max-w-lg" style={{ color: 'rgba(225,220,205,0.65)' }}>
                    Pro forma modeling, cap rate analysis, LTV-based financing, due diligence trade-offs, market timing — the same framework professional investors use, taught through the deals you play.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:gap-2.5 lg:max-w-[360px] flex-shrink-0">
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
                      className="text-xs lg:text-[13px] font-medium px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg"
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
      <section className="py-8 lg:py-12 px-5 lg:px-8">
        <div className="max-w-6xl mx-auto">
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

              <div className="relative p-5 sm:p-7 lg:p-10">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-12">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.25)' }}>
                        <FileText className="w-3.5 h-3.5" style={{ color: '#d4af37' }} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2.5 py-1" style={{ color: 'rgba(212,175,55,0.7)', borderBottom: '1px solid rgba(212,175,55,0.2)' }}>
                        Strategy Intel
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif mb-2 tracking-[-0.01em] group-hover:text-amber-300 transition-colors" style={{ color: '#f0e6d0' }}>
                      Lost Money? Now Read Why.
                    </h2>
                    <p className="text-sm lg:text-base leading-relaxed mb-4 max-w-lg" style={{ color: 'rgba(225,220,205,0.65)' }}>
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
                          className="text-[11px] lg:text-xs font-semibold px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-md"
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

                  <div className="flex-shrink-0 lg:w-[300px]">
                    <div className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2" style={{ color: 'rgba(212,175,55,0.4)' }}>
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
                            <div className="text-[13px] lg:text-sm font-medium leading-tight" style={{ color: '#ddd5c0' }}>{item.title}</div>
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
      <section className="py-10 lg:py-16 px-5 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-2xl sm:text-3xl lg:text-[2.75rem] font-serif mb-3 tracking-[-0.01em]"
            style={{ color: '#f0e6d0' }}
          >
            Think you can spot a bad deal?
          </h2>
          <p className="text-sm sm:text-base lg:text-lg mb-2 max-w-xl mx-auto" style={{ color: 'rgba(225,220,205,0.62)' }}>
            $100,000 starting cash. 52 months on the clock. Dozens of properties, each hiding something. One wrong assumption and the whole deal breaks.
          </p>
          <p className="text-xs lg:text-sm mb-2 max-w-lg mx-auto" style={{ color: 'rgba(225,220,205,0.35)' }}>
            Your pro forma won't match reality on day one — but each deal teaches you to refine your assumptions. Better diligence, sharper analysis, stronger results.
          </p>
          <p className="text-xs lg:text-sm mb-6" style={{ color: 'rgba(248,113,113,0.5)' }}>
            Most players overestimate their first deal by 40%.
          </p>
          <Link href="/game" className="block sm:inline-block w-full sm:w-auto">
            <button
              className="group w-full sm:w-auto py-4 sm:py-3.5 lg:py-4 px-10 lg:px-12 rounded-lg font-bold text-lg lg:text-xl transition-all hover:brightness-110 active:scale-[0.98] flex sm:inline-flex items-center justify-center gap-2 min-h-[52px] sm:min-h-0"
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
      <section className="py-8 lg:py-16 px-5 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center text-2xl sm:text-3xl lg:text-[2.5rem] font-serif mb-5 lg:mb-8 tracking-[-0.01em]"
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
      <div className="px-5 pt-6 max-w-3xl mx-auto text-center" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
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
