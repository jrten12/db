import { Link } from 'wouter';
import { Play, FileText, Clock, AlertTriangle, HelpCircle, Lightbulb, X, TrendingDown } from 'lucide-react';
import woodTexture from '@assets/generated_images/dark_mahogany_wood_texture.png';

export default function Landing() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${woodTexture})` }}
      data-testid="landing-page"
    >
      <div className="min-h-screen bg-black/40">
        {/* Top Status Bar */}
        <div className="status-bar px-4 py-3 safe-area-top">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-sm">Cash:</span>
                <span className="text-gold font-bold font-mono">$30,000</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-sm">Time:</span>
                <span className="text-white font-bold">10 Weeks</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-400 text-sm">Goal:</span>
                <span className="text-white font-bold">3 Profitable Deals <span className="text-stone-400 font-normal">(0/3)</span></span>
              </div>
            </div>
            <Link href="/game">
              <button className="px-4 py-1.5 bg-white text-stone-900 rounded-full font-semibold text-sm hover:bg-stone-100 transition-colors" data-testid="button-play-free">
                Play Free
              </button>
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl gold-text tracking-wider font-bold">
              DEALBREAK
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="h-px w-8 bg-gold/50" />
              <p className="text-gold/80 text-sm md:text-base tracking-[0.3em] font-medium">
                REAL ESTATE SIMULATOR
              </p>
              <div className="h-px w-8 bg-gold/50" />
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-8">
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-white leading-tight mb-4">
              Most real estate deals fail.<br />
              <span className="text-white">Learn why—before they cost you.</span>
            </h2>
            <p className="text-stone-300 text-base md:text-lg max-w-2xl mx-auto">
              Dealbreak is a pro-forma-driven real estate simulator where you <em className="text-white">underwrite</em> deals, manage risk, and learn why "almost good" deals fail.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 mb-10">
            <Link href="/game">
              <button className="game-button text-lg px-10 py-3" data-testid="button-play-simulator">
                Play the Simulator
              </button>
            </Link>
            <button className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-sm" data-testid="button-watch-video">
              <Play className="w-4 h-4" />
              Watch how it works (60 sec)
            </button>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-card/80 rounded-lg border border-border">
              <FileText className="w-5 h-5 text-gold" />
              <span className="text-white font-medium text-sm">Pro-Forma Driven</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card/80 rounded-lg border border-border">
              <Clock className="w-5 h-5 text-gold" />
              <span className="text-white font-medium text-sm">Time & Risk Matter</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-card/80 rounded-lg border border-border">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-white font-medium text-sm">Real Consequences</span>
            </div>
          </div>

          <p className="text-center text-stone-400 text-sm mb-12">
            Built for people who want to understand the numbers—not be sold a dream.
          </p>

          {/* Demo Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            {/* Real-Time Metrics Panel */}
            <div className="bg-paper paper-texture rounded-lg card-frame p-6">
              <h3 className="font-display text-stone-800 text-lg font-semibold mb-6">
                Real-Time Metrics
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-danger" />
                    <span className="text-stone-700">Monthly Cash Flow</span>
                  </div>
                  <span className="font-mono font-bold text-danger text-xl">-$420<span className="text-sm font-normal">/mo</span></span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <span className="text-stone-700">Cash-on-Cash Return</span>
                  </div>
                  <span className="font-mono font-bold text-danger text-xl">-16.8%</span>
                </div>
              </div>

              {/* Mortgage Document Illustration */}
              <div className="mt-8 flex items-end gap-4">
                <div className="bg-paper-dark rounded p-4 border-2 border-stone-400 shadow-md flex-1">
                  <div className="text-stone-600 text-xs font-semibold mb-2 tracking-wide">MORTGAGE</div>
                  <div className="space-y-1">
                    <div className="h-1.5 bg-stone-400/50 rounded w-full" />
                    <div className="h-1.5 bg-stone-400/50 rounded w-3/4" />
                    <div className="h-1.5 bg-stone-400/50 rounded w-5/6" />
                    <div className="h-1.5 bg-stone-400/50 rounded w-2/3" />
                  </div>
                  <div className="mt-3 italic text-stone-500 text-xs">James</div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-2 h-8 bg-gold rounded-full" />
                  <div className="w-3 h-3 bg-gold-dark rounded-full" />
                </div>
                <div className="flex gap-1">
                  <div className="w-6 h-4 bg-gold rounded-sm" />
                  <div className="w-6 h-4 bg-gold rounded-sm" />
                  <div className="w-6 h-4 bg-gold rounded-sm" />
                </div>
              </div>
            </div>

            {/* Explanation Panel */}
            <div className="bg-card rounded-lg card-frame p-6">
              <h3 className="font-display text-foreground text-lg font-semibold mb-6">
                Explanation
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded bg-danger/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-4 h-4 text-danger" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Monthly Cash Flow:</span>
                    <span className="text-muted-foreground text-sm"> Your mortgage payment ($2,120) and expenses greatly exceeded rent after accounting for vacancy and costs.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded bg-warning/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Cash-on-Cash Return:</span>
                    <span className="text-muted-foreground text-sm"> Your $420/month loss amounted to a <span className="text-danger font-semibold">-16.8%</span> return due to significant out-of-pocket cash investment.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <HelpCircle className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Cap Rate:</span>
                    <span className="text-muted-foreground text-sm"> As a result of the negative cash flow, your Cap Rate is <span className="font-semibold">too low</span> (not viable). Consider adjusting rehab costs or financing.</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <span className="font-semibold text-foreground">Tip:</span>
                    <span className="text-muted-foreground text-sm"> Aiming for a positive Monthly Cash Flow and a Cap Rate above 6-8% is typically a safer bet for a rental.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Feature Pills */}
          <div className="flex flex-wrap justify-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              <span className="text-white font-medium">Pro-Forma Driven</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              <span className="text-white font-medium">Time & Risk Matter</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <span className="text-white font-medium">Real Consequences</span>
            </div>
          </div>

          <p className="text-center text-stone-300 text-base mb-8">
            Built for people who want to understand the numbers—<em className="text-white">not be sold a dream.</em>
          </p>
        </main>

        <footer className="safe-area-bottom pb-8" />
      </div>
    </div>
  );
}