import { Link } from 'wouter';
import { ArrowRight, DollarSign, TrendingUp, Home, BarChart3, CheckCircle2, AlertTriangle, Target } from 'lucide-react';

const showcasePropertyImage = '/images/properties/craftsman_bungalow_home_exterior.jpg';

function PropertyBrowseCard() {
  return (
    <div className="showcase-card group" data-testid="showcase-property-browse">
      <div className="relative h-28 sm:h-32 overflow-hidden rounded-t-xl">
        <img
          src={showcasePropertyImage}
          alt="Craftsman bungalow property listing"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-bold text-sm leading-tight">Elmwood Bungalow</p>
          <p className="text-emerald-400 font-mono text-xs font-semibold">$185,000</p>
        </div>
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
          style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
          Fair Condition
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px]">
          <span style={{ color: 'rgba(148,163,184,0.8)' }}>Est. Rent</span>
          <span className="font-mono text-cyan-400">$1,400 - $1,800/mo</span>
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span style={{ color: 'rgba(148,163,184,0.8)' }}>Type</span>
          <span style={{ color: '#e2e8f0' }}>Single Family</span>
        </div>
        <div className="flex gap-1 mt-1">
          {['Inspection', 'Market Study', 'Appraisal'].map((item) => (
            <span key={item} className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(34,211,238,0.08)', color: 'rgba(34,211,238,0.7)', border: '1px solid rgba(34,211,238,0.15)' }}>
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProFormaCard() {
  return (
    <div className="showcase-card" data-testid="showcase-pro-forma">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-cyan-300 text-xs font-semibold tracking-wide">Pro Forma Analysis</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: 'rgba(148,163,184,0.7)' }}>Monthly Rent</span>
            <span className="font-mono text-xs text-white font-semibold">$1,650</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30,41,59,0.8)' }}>
            <div className="h-full rounded-full" style={{ width: '72%', background: 'linear-gradient(90deg, #06b6d4, #22d3ee)' }} />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="rounded-lg p-2" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <p className="text-[9px] text-emerald-400/70 mb-0.5">Cash Flow</p>
              <p className="font-mono text-sm font-bold text-emerald-400">+$312/mo</p>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.15)' }}>
              <p className="text-[9px] text-cyan-400/70 mb-0.5">Cash-on-Cash</p>
              <p className="font-mono text-sm font-bold text-cyan-300">8.4%</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <AlertTriangle className="w-3 h-3 text-amber-400/70" />
            <span className="text-[9px] text-amber-400/70">Vacancy rate under 5% is optimistic</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DealResultsCard() {
  return (
    <div className="showcase-card" data-testid="showcase-deal-results">
      <div className="p-3">
        <div className="text-center mb-2">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full mb-1.5"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 0 16px rgba(16,185,129,0.3)' }}>
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <p className="text-white font-black text-sm">PROPERTY SOLD!</p>
          <p className="text-emerald-400 font-mono text-lg font-bold">+$24,300</p>
          <p className="text-emerald-300/60 text-[10px]">+12.8% ROI</p>
        </div>

        <div className="rounded-lg p-2 mt-2" style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-cyan-400" />
              <span className="text-[10px] text-cyan-300 font-semibold">Prediction vs Reality</span>
            </div>
            <span className="text-emerald-400 font-black text-xs">A</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[9px]">
            <span style={{ color: 'rgba(148,163,184,0.6)' }}></span>
            <span className="text-center" style={{ color: 'rgba(148,163,184,0.6)' }}>Projected</span>
            <span className="text-center" style={{ color: 'rgba(34,211,238,0.7)' }}>Actual</span>
            <span style={{ color: 'rgba(148,163,184,0.7)' }}>Profit</span>
            <span className="text-center font-mono text-gray-400">$22k</span>
            <span className="text-center font-mono text-white font-semibold">$24.3k</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PortfolioCard() {
  return (
    <div className="showcase-card" data-testid="showcase-portfolio">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Home className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-300 text-xs font-semibold">Your Portfolio</span>
        </div>

        <div className="space-y-1.5">
          {[
            { name: 'Elmwood Bungalow', type: 'Rental', flow: '+$312/mo', color: '#10b981' },
            { name: 'Downtown Loft', type: 'Flipped', flow: '+$18,200', color: '#d4af37' },
            { name: 'Colonial Estate', type: 'Rental', flow: '+$480/mo', color: '#10b981' },
          ].map((deal) => (
            <div key={deal.name} className="flex items-center gap-2 py-1 px-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: deal.color, boxShadow: `0 0 6px ${deal.color}60` }} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white font-medium truncate">{deal.name}</p>
                <p className="text-[9px]" style={{ color: 'rgba(148,163,184,0.6)' }}>{deal.type}</p>
              </div>
              <span className="font-mono text-[10px] font-semibold flex-shrink-0" style={{ color: deal.color }}>{deal.flow}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">3/3 Profitable</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-mono text-amber-300 font-semibold">$142,800</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const phases = [
  { step: '01', label: 'Scout Properties', accent: '#d4af37' },
  { step: '02', label: 'Run the Numbers', accent: '#06b6d4' },
  { step: '03', label: 'Close the Deal', accent: '#10b981' },
  { step: '04', label: 'Build a Portfolio', accent: '#f59e0b' },
];

export function GameShowcase() {
  return (
    <section
      className="relative py-6 lg:py-16"
      style={{ background: 'linear-gradient(180deg, #151518 0%, #131316 100%)' }}
      data-testid="section-game-showcase"
    >
      <div
        className="absolute inset-x-0 top-0 h-[1px]"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.2), transparent)' }}
      />

      <div className="max-w-5xl mx-auto px-5">
        <h2
          className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 lg:mb-4"
          style={{ color: '#f0e6d0', fontStyle: 'italic' }}
        >
          Every Deal Has a Story
        </h2>
        <p
          className="text-center text-sm sm:text-base max-w-xl mx-auto mb-6 lg:mb-10"
          style={{ color: 'rgba(225,220,205,0.5)' }}
        >
          From scouting to settlement — experience every step of a real estate deal.
        </p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {[PropertyBrowseCard, ProFormaCard, DealResultsCard, PortfolioCard].map((Card, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-[10px] font-bold font-mono"
                  style={{ color: phases[i].accent, opacity: 0.6 }}
                >
                  {phases[i].step}
                </span>
                <span
                  className="text-[11px] font-semibold tracking-wide"
                  style={{ color: phases[i].accent }}
                >
                  {phases[i].label}
                </span>
              </div>
              <Card />
            </div>
          ))}
        </div>

        <div className="text-center mt-6 lg:mt-10">
          <Link
            href="/game"
            className="group py-3 px-7 rounded-lg font-bold text-base transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
            style={{
              background: 'rgba(16,185,129,0.12)',
              color: '#4ade80',
              boxShadow: '0 0 20px rgba(16,185,129,0.15), inset 0 0 20px rgba(16,185,129,0.05)',
              border: '2px solid rgba(16,185,129,0.5)',
            }}
            data-testid="button-try-it-yourself"
          >
            Try It Yourself
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
