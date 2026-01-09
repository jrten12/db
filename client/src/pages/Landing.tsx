import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import heroImage from '@assets/image_1767847036185.png';
import Footer from '@/components/Footer';

export default function Landing() {
  return (
    <div 
      className="min-h-screen bg-[#09090b]"
      data-testid="landing-page"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-4 flex items-center justify-end safe-area-top">
          <Link href="/game">
            <button className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium text-sm border border-white/10 transition-all" data-testid="button-play-free-header">
              Enter
            </button>
          </Link>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-full max-w-5xl grid gap-12 lg:grid-cols-2 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.1] tracking-tight">
                You have $50,000 and 52 weeks.
              </h1>
              
              <p className="text-gray-400 text-lg md:text-xl mt-6 leading-relaxed">
                Every deal has unknowns. Your job is to decide what you're willing to bet on — and what you're not. Run the numbers, weigh the risk, and commit.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/game">
                  <button 
                    className="group px-7 py-3.5 rounded-lg font-semibold text-base text-white transition-all hover:brightness-110 active:scale-[0.98] flex items-center gap-2"
                    style={{
                      background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                      boxShadow: '0 2px 0 #047857, 0 4px 16px rgba(16,185,129,0.25)',
                    }}
                    data-testid="button-play-simulator"
                  >
                    See the first deal
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </Link>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5">
                <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-gray-500">
                  <span>Miss the rehab estimate → lose months.</span>
                  <span>Overpay → kill the return.</span>
                  <span>Get it right → close profitable.</span>
                </div>
              </div>
            </div>

            <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
              <div className="relative">
                <div className="absolute -inset-6 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="relative rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent p-3">
                  <img 
                    src={heroImage} 
                    alt="Dealbreak"
                    className="w-full h-auto rounded-xl"
                    style={{
                      boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    }}
                    data-testid="hero-image"
                  />
                </div>
              </div>

              <p className="mt-6 text-center text-gray-600 text-xs">
                A real estate decision simulator. Not financial advice.
              </p>
            </div>
          </div>
        </main>

        <Footer />
        <div className="safe-area-bottom" />
      </div>
    </div>
  );
}
