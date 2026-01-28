import { Link } from 'wouter';
import { ArrowRight, TrendingUp, Clock, Target, DollarSign, Search, BarChart3, Shield, Play } from 'lucide-react';
import heroImage from '@assets/image_1767847036185.png';
import Footer from '@/components/Footer';
import { useSplash } from '@/App';

export default function Landing() {
  const { showSplashScreen } = useSplash();
  
  return (
    <div
      className="min-h-screen min-h-[100dvh] bg-[#0a0a0b] overflow-x-hidden"
      data-testid="landing-page"
    >
      {/* Animated background gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15),transparent)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.08),transparent)]" />

      {/* Subtle grid pattern */}
      <div
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col">
        {/* Header - iOS style minimal */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0b]/80 border-b border-white/[0.06]">
          <div className="flex items-center justify-between px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold text-lg tracking-tight">Dealbreak</span>
            </div>
            <Link href="/game">
              <button
                className="px-5 py-2.5 bg-white/[0.08] hover:bg-white/[0.12] active:bg-white/[0.16] text-white rounded-full font-medium text-sm border border-white/[0.08] transition-all active:scale-[0.97] backdrop-blur-sm"
                data-testid="button-play-free-header"
              >
                Play Now
              </button>
            </Link>
          </div>
        </header>

        {/* Main content with scroll snap sections */}
        <main className="flex-1 flex flex-col">

          {/* Hero Section */}
          <section className="flex-1 flex flex-col items-center justify-center px-5 py-12 lg:py-16">
            <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">

              {/* Hero Image - iOS style card */}
              <div className="relative w-full max-w-[300px] sm:max-w-[340px] lg:max-w-[400px] xl:max-w-[440px] mx-auto lg:mx-0 lg:flex-shrink-0">
                <div className="absolute -inset-12 bg-emerald-500/10 blur-[80px] rounded-full" />
                <div className="relative">
                  {/* Glass card container */}
                  <div className="rounded-[28px] border border-white/[0.1] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-3 backdrop-blur-xl shadow-2xl shadow-black/40">
                    <img
                      src={heroImage}
                      alt="Dealbreak - Real Estate Simulator"
                      className="w-full h-auto rounded-[20px]"
                      data-testid="hero-image"
                    />
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-emerald-500/30">
                    FREE TO PLAY
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-1 text-center lg:text-left mt-12 lg:mt-0">
                {/* Stats row - iOS style pills */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span className="text-white/90 text-sm font-medium">$75K Start</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-white/90 text-sm font-medium">12 Months</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08]">
                    <Target className="w-4 h-4 text-blue-400" />
                    <span className="text-white/90 text-sm font-medium">3 Deals</span>
                  </div>
                </div>

                {/* Main headline */}
                <h1 className="text-[2rem] sm:text-[2.5rem] lg:text-5xl xl:text-[3.25rem] leading-[1.1] font-bold text-white tracking-tight mb-5">
                  Master Real Estate<br />
                  <span className="bg-gradient-to-r from-emerald-400 to-emerald-500 bg-clip-text text-transparent">Before You Invest</span>
                </h1>

                <p className="text-gray-400 text-lg sm:text-xl leading-relaxed max-w-[480px] mx-auto lg:mx-0 mb-8">
                  The numbers don't lie, but they don't tell you everything. Learn to spot the deals that work—and walk away from those that don't.
                </p>

                {/* CTA Buttons - iOS style */}
                <div className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                  <Link href="/game">
                    <button
                      className="group w-full sm:w-auto min-w-[200px] py-4 px-8 rounded-2xl font-semibold text-[17px] text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                      style={{
                        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 2px 0 #047857, 0 8px 32px rgba(16,185,129,0.4)',
                      }}
                      data-testid="button-play-simulator"
                    >
                      Start Playing
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </Link>
                  <button
                    className="w-full sm:w-auto min-w-[200px] py-4 px-8 rounded-2xl font-semibold text-[17px] text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all active:scale-[0.98]"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Learn More
                  </button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center lg:justify-start gap-6 mt-8 text-sm text-gray-500">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    No signup required
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Play instantly
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section - iOS style cards */}
          <section id="features" className="px-5 py-16 lg:py-24 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                  Learn by Doing
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Every decision teaches you something. Miss a detail and it costs you.
                </p>
              </div>

              {/* Feature cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FeatureCard
                  icon={<Search className="w-6 h-6" />}
                  iconColor="text-blue-400"
                  iconBg="bg-blue-500/15"
                  title="Due Diligence"
                  description="Order inspections, check comps, and uncover hidden issues before you buy."
                />
                <FeatureCard
                  icon={<BarChart3 className="w-6 h-6" />}
                  iconColor="text-emerald-400"
                  iconBg="bg-emerald-500/15"
                  title="Pro Forma Analysis"
                  description="Build real financial models with NOI, cap rates, and cash-on-cash returns."
                />
                <FeatureCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  iconColor="text-purple-400"
                  iconBg="bg-purple-500/15"
                  title="Multiple Strategies"
                  description="Buy and hold for cash flow, or flip for quick profits. Each has trade-offs."
                />
                <FeatureCard
                  icon={<Clock className="w-6 h-6" />}
                  iconColor="text-amber-400"
                  iconBg="bg-amber-500/15"
                  title="Time Pressure"
                  description="12 months to prove yourself. Every month counts toward your deadline."
                />
                <FeatureCard
                  icon={<Shield className="w-6 h-6" />}
                  iconColor="text-red-400"
                  iconBg="bg-red-500/15"
                  title="Risk Management"
                  description="Balance leverage, renovation budgets, and contractor reliability."
                />
                <FeatureCard
                  icon={<Target className="w-6 h-6" />}
                  iconColor="text-cyan-400"
                  iconBg="bg-cyan-500/15"
                  title="Win Condition"
                  description="Complete 3 profitable deals to win. Most properties will fail—choose wisely."
                />
              </div>
            </div>
          </section>

          {/* How it Works Section */}
          <section className="px-5 py-16 lg:py-24">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                  How It Works
                </h2>
              </div>

              <div className="space-y-4">
                <StepCard
                  number="1"
                  title="Browse the Market"
                  description="Review properties with incomplete information. Price, size, and neighborhood—but what's hidden?"
                />
                <StepCard
                  number="2"
                  title="Do Your Research"
                  description="Spend time and money on inspections, comps, and title searches. Skip at your own risk."
                />
                <StepCard
                  number="3"
                  title="Run the Numbers"
                  description="Build a pro forma with your assumptions. The spreadsheet doesn't lie—but your inputs might be wrong."
                />
                <StepCard
                  number="4"
                  title="Execute Your Strategy"
                  description="Buy, renovate, rent or flip. Watch time pass and see if your analysis was right."
                />
              </div>

              {/* Final CTA */}
              <div className="text-center mt-12">
                <Link href="/game">
                  <button
                    className="group py-4 px-10 rounded-2xl font-semibold text-lg text-white transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 2px 0 #047857, 0 8px 32px rgba(16,185,129,0.4)',
                    }}
                  >
                    See Your First Deal
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </Link>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <div className="px-5 py-8 text-center">
            <p className="text-gray-600 text-sm">
              A real estate decision simulator. Not financial advice.
            </p>
            <div className="mt-2 flex items-center justify-center gap-3">
              <p className="text-gray-700 text-xs font-mono">
                v1.65
              </p>
              <button
                onClick={showSplashScreen}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.1] text-gray-500 hover:text-gray-400 text-xs transition-all"
                data-testid="button-replay-intro"
              >
                <Play className="w-3 h-3" />
                Intro
              </button>
            </div>
          </div>
        </main>

        <Footer />
        <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  iconColor,
  iconBg,
  title,
  description
}: {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4 ${iconColor}`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
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
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
        <span className="text-emerald-400 font-bold">{number}</span>
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
