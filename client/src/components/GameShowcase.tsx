import { Link } from 'wouter';
import { ArrowRight, BarChart3, Home, Target } from 'lucide-react';

const showcasePropertyImage = '/images/properties/craftsman_bungalow_home_exterior.jpg';

function PropertyBrowseCard() {
  return (
    <div className="border border-[hsl(var(--workstation-rule))] bg-[hsl(var(--workstation-ink))]" data-testid="showcase-property-browse">
      <div className="relative h-28 sm:h-32 overflow-hidden">
        <img
          src={showcasePropertyImage}
          alt="Property listing preview"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--workstation-ink))] via-transparent to-transparent" />
        <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-2">
          <p className="text-[hsl(var(--workstation-paper))] font-medium text-sm">Elmwood Bungalow</p>
          <p className="font-mono text-xs text-[hsl(var(--workstation-brass))]">$185,000</p>
        </div>
      </div>
      <div className="p-3 space-y-2 border-t border-[hsl(var(--workstation-rule))]">
        <p className="text-[10px] text-[hsl(var(--workstation-muted))]">Rent variability: High · Condition clarity: Low</p>
        <p className="text-[10px] text-[hsl(var(--workstation-muted))]">Diligence required before pro forma</p>
      </div>
    </div>
  );
}

function ProFormaCard() {
  return (
    <div className="border border-[hsl(var(--workstation-rule))] bg-[hsl(var(--workstation-ink))] p-3" data-testid="showcase-pro-forma">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-3.5 h-3.5 text-[hsl(var(--workstation-brass))]" />
        <span className="text-xs font-medium text-[hsl(var(--workstation-paper))]">Pro forma worksheet</span>
      </div>
      <div className="space-y-2 text-[11px]">
        <div className="flex justify-between border-b border-[hsl(var(--workstation-rule))] pb-2">
          <span className="text-[hsl(var(--workstation-muted))]">All-in basis</span>
          <span className="font-mono text-[hsl(var(--workstation-paper))]">$198,400</span>
        </div>
        <div className="flex justify-between border-b border-[hsl(var(--workstation-rule))] pb-2">
          <span className="text-[hsl(var(--workstation-muted))]">Monthly NOI</span>
          <span className="font-mono text-[hsl(var(--workstation-paper))]">$1,170</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[hsl(var(--workstation-muted))]">Cash flow</span>
          <span className="font-mono text-[hsl(var(--workstation-profit))]">+$312/mo</span>
        </div>
      </div>
    </div>
  );
}

function DealResultsCard() {
  return (
    <div className="border border-[hsl(var(--workstation-rule))] bg-[hsl(var(--workstation-ink))] p-3" data-testid="showcase-deal-results">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-3.5 h-3.5 text-[hsl(var(--workstation-brass))]" />
        <span className="text-xs font-medium text-[hsl(var(--workstation-paper))]">Postmortem</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <p className="text-[hsl(var(--workstation-muted))]">You projected</p>
          <p className="font-mono text-[hsl(var(--workstation-paper))]">$1,800/mo rent</p>
        </div>
        <div>
          <p className="text-[hsl(var(--workstation-muted))]">Actual</p>
          <p className="font-mono text-[hsl(var(--workstation-loss))]">$1,620/mo</p>
        </div>
      </div>
      <p className="text-[10px] text-[hsl(var(--workstation-muted))] mt-3 leading-relaxed">
        Skipped market study → optimistic rent assumption.
      </p>
    </div>
  );
}

function PortfolioCard() {
  return (
    <div className="border border-[hsl(var(--workstation-rule))] bg-[hsl(var(--workstation-ink))] p-3" data-testid="showcase-portfolio">
      <div className="flex items-center gap-2 mb-3">
        <Home className="w-3.5 h-3.5 text-[hsl(var(--workstation-brass))]" />
        <span className="text-xs font-medium text-[hsl(var(--workstation-paper))]">Portfolio</span>
      </div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-[hsl(var(--workstation-muted))]">Cash</span>
        <span className="font-mono text-[hsl(var(--workstation-paper))]">$84,200</span>
      </div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-[hsl(var(--workstation-muted))]">Months left</span>
        <span className="font-mono text-[hsl(var(--workstation-paper))]">41</span>
      </div>
      <div className="flex justify-between text-[11px]">
        <span className="text-[hsl(var(--workstation-muted))]">Profitable deals</span>
        <span className="font-mono text-[hsl(var(--workstation-profit))]">1 / 2</span>
      </div>
    </div>
  );
}

export function GameShowcase() {
  return (
    <div data-testid="section-game-showcase">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <PropertyBrowseCard />
        <ProFormaCard />
        <DealResultsCard />
        <PortfolioCard />
      </div>
      <Link href="/game">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--workstation-brass))] hover:underline"
          data-testid="button-showcase-play"
        >
          Open the simulator
          <ArrowRight className="w-4 h-4" />
        </button>
      </Link>
    </div>
  );
}
