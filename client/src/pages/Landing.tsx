import { Link } from 'wouter';
import { ArrowRight, TrendingUp, Clock, Target, DollarSign } from 'lucide-react';
import heroImage from '@assets/image_1767847036185.png';
import Footer from '@/components/Footer';

export default function Landing() {
  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-[#09090b] overflow-x-hidden"
      data-testid="landing-page"
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

      <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col">
        {/* Header */}
        <header className="p-4 pt-[max(1rem,env(safe-area-inset-top))] px-[max(1rem,env(safe-area-inset-left))] flex items-center justify-between">
          <span className="text-emerald-500/80 font-semibold text-sm tracking-wide uppercase">Dealbreak</span>
          <Link href="/game">
            <button
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-gray-300 hover:text-white rounded-full font-medium text-sm border border-white/10 transition-all active:scale-[0.97]"
              data-testid="button-play-free-header"
            >
              Enter
            </button>
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 lg:px-12 pb-4">
          {/* Desktop: Two column layout, Mobile: Single column */}
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">

            {/* Hero Image Section */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px] xl:max-w-[420px] mx-auto lg:mx-0 lg:flex-shrink-0 mt-2 lg:mt-0">
              <div className="absolute -inset-8 sm:-inset-12 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="relative rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-2.5 sm:p-3 backdrop-blur-sm">
                <img
                  src={heroImage}
                  alt="Dealbreak - Real Estate Simulator"
                  className="w-full h-auto rounded-xl sm:rounded-2xl"
                  style={{
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 8px 24px rgba(16,185,129,0.15)',
                  }}
                  data-testid="hero-image"
                />
              </div>
              {/* Decorative badge */}
              <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-emerald-600 text-white text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                FREE TO PLAY
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 text-center lg:text-left mt-10 lg:mt-0 space-y-6 lg:space-y-8">
              {/* Main headline */}
              <div className="space-y-4">
                <h1 className="text-[1.75rem] sm:text-3xl lg:text-4xl xl:text-[2.75rem] leading-[1.15] font-bold text-white tracking-tight">
                  $50,000. 52 weeks.<br />
                  <span className="text-white/80">Three profitable deals or you're out.</span>
                </h1>

                <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-[380px] mx-auto lg:mx-0">
                  The numbers don't lie, but they don't tell you everything. You decide what's missing, what's a risk, and when to walk away.
                </p>
              </div>

              {/* CTA Button */}
              <div className="pt-1 lg:pt-2">
                <Link href="/game">
                  <button
                    className="group w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[300px] py-4 sm:py-4.5 rounded-2xl font-semibold text-[17px] sm:text-lg text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 mx-auto lg:mx-0"
                    style={{
                      background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 2px 0 #047857, 0 6px 24px rgba(16,185,129,0.35)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    See the first deal
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </Link>
              </div>

              {/* Risk statements - visible on mobile */}
              <div className="flex flex-col items-center lg:items-start gap-2 text-[13px] sm:text-sm text-gray-500 pt-2 lg:hidden">
                <span>Overpay and the return dies.</span>
                <span>Miss a defect and it costs you months.</span>
                <span>Run out of time and you lose.</span>
              </div>

              {/* Feature highlights - better on desktop */}
              <div className="hidden lg:grid grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Analyze Real Deals</p>
                    <p className="text-gray-400 text-xs">Pro forma analysis with real numbers</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Race Against Time</p>
                    <p className="text-gray-400 text-xs">52 weeks to prove yourself</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Find Hidden Defects</p>
                    <p className="text-gray-400 text-xs">Inspection reveals the truth</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">Build Your Portfolio</p>
                    <p className="text-gray-400 text-xs">Close deals to grow wealth</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile feature pills */}
          <div className="lg:hidden flex flex-wrap justify-center gap-2 mt-8 max-w-[380px]">
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
              Pro Forma Analysis
            </span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
              Property Inspection
            </span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
              Time Pressure
            </span>
            <span className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400">
              Real Numbers
            </span>
          </div>

          {/* Disclaimer */}
          <div className="mt-auto pt-10 lg:pt-12 text-center">
            <p className="text-gray-600 text-xs sm:text-sm">
              A real estate decision simulator. Not financial advice.
            </p>
            <p className="mt-1.5 text-gray-700 text-[11px] font-mono">
              v1.65
            </p>
          </div>
        </main>

        <Footer />
        <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
      </div>
    </div>
  );
}
