import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import heroImage from '@assets/image_1767847036185.png';
import Footer from '@/components/Footer';

export default function Landing() {
  return (
    <div 
      className="min-h-screen min-h-[100dvh] bg-[#09090b] overflow-x-hidden"
      data-testid="landing-page"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-950/30 via-transparent to-transparent" />

      <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col">
        <header className="p-4 pt-[max(1rem,env(safe-area-inset-top))] flex items-center justify-end">
          <Link href="/game">
            <button 
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 active:bg-white/15 text-gray-300 hover:text-white rounded-full font-medium text-sm border border-white/10 transition-all active:scale-[0.97]" 
              data-testid="button-play-free-header"
            >
              Enter
            </button>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center px-5 pb-4">
          <div className="w-full max-w-md mx-auto flex flex-col items-center">
            <div className="relative w-full max-w-[280px] mx-auto mt-2">
              <div className="absolute -inset-8 bg-emerald-500/10 blur-3xl rounded-full" />
              <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent p-2.5 backdrop-blur-sm">
                <img 
                  src={heroImage} 
                  alt="Dealbreak"
                  className="w-full h-auto rounded-xl"
                  style={{
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  }}
                  data-testid="hero-image"
                />
              </div>
            </div>

            <div className="text-center mt-8 space-y-5">
              <h1 className="text-[1.75rem] leading-[1.15] font-bold text-white tracking-tight">
                $50,000. 52 weeks.<br />
                <span className="text-gray-300">Three profitable deals or you're out.</span>
              </h1>
              
              <p className="text-gray-400 text-base leading-relaxed max-w-[320px] mx-auto">
                The numbers don't lie, but they don't tell you everything. You decide what's missing, what's a risk, and when to walk away.
              </p>

              <div className="pt-3">
                <Link href="/game">
                  <button 
                    className="group w-full max-w-[280px] py-4 rounded-2xl font-semibold text-[17px] text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
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

              <div className="pt-6 flex flex-col items-center gap-2 text-[13px] text-gray-500">
                <span>Overpay and the return dies.</span>
                <span>Miss a defect and it costs you months.</span>
                <span>Run out of time and you lose.</span>
              </div>
            </div>

            <div className="mt-auto pt-8 text-center">
              <p className="text-gray-600 text-xs">
                A real estate decision simulator. Not financial advice.
              </p>
              <p className="mt-1.5 text-gray-700 text-[11px] font-mono">
                v1.65
              </p>
            </div>
          </div>
        </main>

        <Footer />
        <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
      </div>
    </div>
  );
}
