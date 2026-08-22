import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Volume2, VolumeX, Download } from 'lucide-react';
import { useMusic } from '@/hooks/useMusicPlayer';
import { useAppInstall } from '@/hooks/useAppInstall';

function LandingInstallButton() {
  const { canInstall, isIos, hasNativePrompt, promptInstall } = useAppInstall();
  if (!canInstall) return null;
  return (
    <button
      type="button"
      onClick={() => {
        if (hasNativePrompt) {
          promptInstall();
          return;
        }
        document.querySelector('[data-testid="install-app-banner"]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }}
      className="w-full sm:w-auto py-3 px-5 font-medium text-sm transition-colors flex items-center justify-center gap-2 min-h-[48px] border border-[hsl(var(--workstation-rule))] text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-paper))] hover:border-[hsl(var(--workstation-brass)/0.4)]"
      data-testid="button-install-landing"
    >
      <Download className="w-4 h-4" />
      {isIos && !hasNativePrompt ? 'Add to Home Screen' : 'Install app'}
    </button>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details
      className="group border-b border-[hsl(var(--workstation-rule))] py-4"
      data-testid={`faq-${question.slice(0, 20).toLowerCase().replace(/\s+/g, '-')}`}
    >
      <summary className="cursor-pointer text-sm font-medium list-none flex items-center justify-between text-[hsl(var(--workstation-paper))]">
        {question}
        <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90 flex-shrink-0 ml-2 text-[hsl(var(--workstation-brass)/0.6)]" />
      </summary>
      <p className="pt-3 text-sm leading-relaxed text-[hsl(var(--workstation-muted))]">{answer}</p>
    </details>
  );
}

const GameShowcase = lazy(() => import('@/components/GameShowcase').then((m) => ({ default: m.GameShowcase })));
const Footer = lazy(() => import('@/components/Footer'));

export default function Landing() {
  const { isPlaying: isMusicPlaying, toggleMusic } = useMusic();

  return (
    <div className="min-h-screen min-h-[100dvh] overflow-x-clip bg-[hsl(var(--workstation-ink))] text-[hsl(var(--workstation-paper))]" data-testid="landing-page">
      <nav className="sticky top-0 z-50 border-b border-[hsl(var(--workstation-rule))] bg-[hsl(var(--workstation-ink)/0.92)] backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 lg:px-8 py-3 max-w-5xl mx-auto">
          <span className="font-display text-lg tracking-tight text-[hsl(var(--workstation-brass))]">Dealbreak</span>
          <div className="flex items-center gap-4">
            <Link href="/learn" className="text-sm text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-paper))] hidden sm:inline">
              Learn
            </Link>
            <button
              type="button"
              onClick={toggleMusic}
              className="p-2 text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-brass))]"
              data-testid="button-toggle-music-landing"
              aria-label={isMusicPlaying ? 'Mute music' : 'Play music'}
            >
              {isMusicPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <section className="px-5 lg:px-8 pt-12 lg:pt-20 pb-10 max-w-5xl mx-auto">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--workstation-brass)/0.75)] mb-4">
          Real estate underwriting simulator
        </p>
        <h1 className="font-display text-[2rem] sm:text-[2.75rem] lg:text-[3.25rem] leading-[1.08] tracking-tight max-w-3xl mb-5">
          Practice underwriting before you write a check.
        </h1>
        <p className="text-base lg:text-lg leading-relaxed text-[hsl(var(--workstation-muted))] max-w-2xl mb-8">
          Browse properties with incomplete information. Run diligence. Build a pro forma. Watch your assumptions collide with reality — then learn why.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <Link href="/game" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto min-w-[200px] py-3.5 px-7 font-semibold text-sm bg-[hsl(var(--workstation-brass))] text-[hsl(var(--workstation-ink))] hover:brightness-110 transition-all flex items-center justify-center gap-2"
              data-testid="button-play-simulator"
            >
              Start a run
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/methodology" className="w-full sm:w-auto">
            <button
              type="button"
              className="w-full sm:w-auto py-3.5 px-6 text-sm font-medium border border-[hsl(var(--workstation-rule))] text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-paper))]"
              data-testid="button-how-it-works"
            >
              How it works
            </button>
          </Link>
          <LandingInstallButton />
        </div>

        <ul className="grid sm:grid-cols-3 gap-6 border-t border-[hsl(var(--workstation-rule))] pt-8 text-sm">
          <li>
            <p className="font-mono text-[hsl(var(--workstation-brass))] mb-1">01</p>
            <p className="font-medium mb-1">Incomplete listings</p>
            <p className="text-[hsl(var(--workstation-muted))] leading-relaxed">Rent, rehab, and condition stay hidden until you pay for diligence.</p>
          </li>
          <li>
            <p className="font-mono text-[hsl(var(--workstation-brass))] mb-1">02</p>
            <p className="font-medium mb-1">Real pro formas</p>
            <p className="text-[hsl(var(--workstation-muted))] leading-relaxed">Basis, leverage, NOI, and hold time — in the order professionals think.</p>
          </li>
          <li>
            <p className="font-mono text-[hsl(var(--workstation-brass))] mb-1">03</p>
            <p className="font-medium mb-1">Honest postmortems</p>
            <p className="text-[hsl(var(--workstation-muted))] leading-relaxed">Every gap between projection and outcome ties back to a decision you made.</p>
          </li>
        </ul>
      </section>

      <Suspense fallback={null}>
        <section className="px-5 lg:px-8 py-12 border-t border-[hsl(var(--workstation-rule))] bg-[hsl(var(--workstation-surface))]">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-xl lg:text-2xl mb-2">Inside a run</h2>
            <p className="text-sm text-[hsl(var(--workstation-muted))] mb-8 max-w-xl">
              $100,000 starting cash. 52 months. Two profitable deals to win — if your analysis holds up.
            </p>
            <GameShowcase />
          </div>
        </section>
      </Suspense>

      <section className="px-5 lg:px-8 py-12 max-w-3xl mx-auto">
        <h2 className="font-display text-xl mb-6">Questions</h2>
        <FaqItem
          question="Is Dealbreak free?"
          answer="Yes. The full simulator is free with no signup. Optional paid boosts exist but are not required to finish a run."
        />
        <FaqItem
          question="Will this teach real investing?"
          answer="It teaches the workflow: diligence before numbers, basis before yield, and postmortems after every close. The math mirrors how investors evaluate flips and rentals — the outcomes are simulated, the logic is real."
        />
        <FaqItem
          question="How long does a run take?"
          answer="Most players finish in 20–40 minutes. You can save and return anytime."
        />
        <FaqItem
          question="Game or calculator?"
          answer="A simulation. Markets shift, tenants leave, hidden issues surface, and your pro forma diverges from reality. You make decisions under time and cash constraints — not just fill in a spreadsheet."
        />
      </section>

      <section className="px-5 lg:px-8 py-12 border-t border-[hsl(var(--workstation-rule))] text-center">
        <p className="text-sm text-[hsl(var(--workstation-muted))] mb-4 max-w-md mx-auto">
          Most first deals miss projections by 30–40%. That is the point.
        </p>
        <Link href="/game">
          <button
            type="button"
            className="py-3.5 px-8 font-semibold text-sm bg-[hsl(var(--workstation-brass))] text-[hsl(var(--workstation-ink))] hover:brightness-110 inline-flex items-center gap-2"
            data-testid="button-start-first-deal"
          >
            Run your first deal
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </section>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
