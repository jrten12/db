import { Link } from 'wouter';
import { Calculator, FileText, BarChart3, Search, TrendingUp, Target } from 'lucide-react';
import heroImage from '@assets/image_1767847036185.png';
import Footer from '@/components/Footer';

export default function Landing() {
  return (
    <div 
      className="min-h-screen bg-[#0a0a0f]"
      data-testid="landing-page"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-transparent to-slate-950/50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-4 flex items-center justify-end safe-area-top">
          <Link href="/game">
            <button className="px-5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg font-medium text-sm border border-emerald-500/30 transition-all hover:border-emerald-500/50" data-testid="button-play-free-header">
              Play Free
            </button>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-6xl grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="text-center lg:text-left">
              <p className="text-emerald-400/80 text-sm font-medium tracking-wide uppercase mb-4">
                Real Estate Decision Simulator
              </p>
              
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-[1.15] tracking-tight">
                Practice underwriting deals before real money is on the line.
              </h1>
              
              <p className="text-gray-400 text-lg md:text-xl mt-6 mb-4 leading-relaxed">
                Evaluate properties, build pro formas, and make investment decisions. See how your assumptions affect returns before committing capital.
              </p>

              <p className="text-gray-500 text-sm mb-8">
                For new investors learning the process or operators who want quick reps.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
                {[
                  { icon: Calculator, label: 'Pro forma analysis' },
                  { icon: Target, label: 'Return thresholds' },
                  { icon: Search, label: 'Due diligence' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-gray-300">
                    <Icon className="w-4 h-4 text-emerald-500" />
                    {label}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/game">
                  <button 
                    className="px-8 py-3.5 rounded-lg font-semibold text-base text-white transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 2px 0 #047857, 0 4px 12px rgba(16,185,129,0.3)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    Play a Deal
                  </button>
                </Link>
                <span className="text-gray-500 text-sm">Free. No account required.</span>
              </div>
            </div>

            <div className="w-full max-w-md mx-auto lg:mx-0">
              <div className="relative">
                <div className="absolute -inset-8 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4">
                  <img 
                    src={heroImage} 
                    alt="Dealbreak simulator"
                    className="w-full h-auto rounded-xl"
                    style={{
                      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    }}
                    data-testid="hero-image"
                  />
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { icon: FileText, title: 'Pro forma', detail: 'Build deal models' },
                  { icon: BarChart3, title: 'Scenarios', detail: 'Compare outcomes' },
                  { icon: TrendingUp, title: 'Returns', detail: 'Track metrics' },
                  { icon: Search, title: 'Diligence', detail: 'Uncover issues' },
                ].map(({ icon: Icon, title, detail }) => (
                  <div key={title} className="flex items-center gap-3 rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">{title}</div>
                      <div className="text-xs text-gray-500">{detail}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-5 border-t border-white/5">
                <p className="text-center text-gray-500 text-xs">
                  Educational tool. Not financial advice.
                </p>
              </div>
            </div>
          </div>
        </main>

        <Footer />
        <div className="safe-area-bottom" />
      </div>
    </div>
  );
}
