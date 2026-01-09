import { Link } from 'wouter';
import { Play, Sparkles, ShieldCheck, Calculator, FileText, BarChart3, Search, TrendingUp } from 'lucide-react';
import heroImage from '@assets/image_1767847036185.png';

export default function Landing() {
  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-[#201726] via-[#1a1222] to-[#100c18]"
      data-testid="landing-page"
    >
      {/* Subtle texture overlay */}
      <div 
        className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center justify-end safe-area-top">
          <Link href="/game">
            <button className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm border border-white/20 transition-all" data-testid="button-play-free-header">
              Play Free
            </button>
          </Link>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-6xl grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            {/* Copy + Features */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-emerald-200/90 mb-5">
                <Sparkles className="w-4 h-4" />
                New Dealbreak Season
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
                Navigate every deal with a sharp, modern pro toolkit.
              </h1>
              <p className="text-gray-300 text-lg md:text-xl mt-5 mb-8">
                Build a clean pro forma, scan the market, and make confident calls with sleek, high-signal rounds that keep you in the zone.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
                {[
                  { icon: Calculator, label: 'Pro forma builder' },
                  { icon: Search, label: 'Comp scan insights' },
                  { icon: ShieldCheck, label: 'Risk vs reward signals' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-4 py-2 text-sm text-white/90">
                    <Icon className="w-4 h-4 text-emerald-300" />
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/game">
                  <button 
                    className="px-10 py-4 rounded-lg font-bold text-lg text-white transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)',
                      boxShadow: '0 4px 0 #15803d, 0 8px 20px rgba(0,0,0,0.3)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    Play the Simulator
                  </button>
                </Link>

                <button className="flex items-center gap-2 text-gray-200 hover:text-white transition-colors text-sm" data-testid="button-watch-video">
                  <Play className="w-4 h-4" />
                  Watch how it works (60 sec)
                </button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="relative">
                <div className="absolute -inset-6 bg-emerald-500/10 blur-3xl rounded-full" />
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-4">
                  <img 
                    src={heroImage} 
                    alt="Dealbreak game icon"
                    className="w-full h-auto rounded-xl shadow-2xl"
                    style={{
                      boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                    }}
                    data-testid="hero-image"
                  />
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { icon: FileText, title: 'Pro forma', detail: 'Build clean deal sheets' },
                  { icon: BarChart3, title: 'Scenario mix', detail: 'Compare upside paths' },
                  { icon: TrendingUp, title: 'Cashflow', detail: 'Track the momentum' },
                  { icon: Search, title: 'Market scan', detail: 'Validate the comps' },
                ].map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-200">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-white">{title}</div>
                      <div className="text-xs text-gray-400">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-gray-300">
                {[
                  { value: '3 min', label: 'Quick rounds' },
                  { value: '20+', label: 'Unique deals' },
                  { value: '∞', label: 'Replay paths' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/5 border border-white/10 px-3 py-4">
                    <div className="text-lg font-semibold text-white">{stat.value}</div>
                    <div className="mt-1 text-gray-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="safe-area-bottom pb-6" />
      </div>
    </div>
  );
}
