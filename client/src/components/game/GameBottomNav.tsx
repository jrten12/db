import { Home, Building2, Play, Loader2 } from 'lucide-react';

type GameTab = 'home' | 'market';

interface GameBottomNavProps {
  active: GameTab;
  onHome: () => void;
  onMarket: () => void;
  onAdvanceWeek?: () => void;
  isAdvancingWeek?: boolean;
  showAdvance?: boolean;
}

/**
 * Native-feeling bottom dock for the game shell on phones.
 */
export function GameBottomNav({
  active,
  onHome,
  onMarket,
  onAdvanceWeek,
  isAdvancingWeek = false,
  showAdvance = false,
}: GameBottomNavProps) {
  return (
    <nav
      className="game-bottom-nav md:hidden"
      aria-label="Game navigation"
      data-testid="game-bottom-nav"
    >
      <div className="game-bottom-nav__inner">
        <button
          type="button"
          onClick={onHome}
          className={`game-bottom-nav__item ${active === 'home' ? 'is-active' : ''}`}
          data-testid="nav-home"
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={onMarket}
          className={`game-bottom-nav__item ${active === 'market' ? 'is-active' : ''}`}
          data-testid="nav-market"
        >
          <Building2 className="w-5 h-5" />
          <span>Market</span>
        </button>

        {showAdvance && onAdvanceWeek ? (
          <button
            type="button"
            onClick={onAdvanceWeek}
            disabled={isAdvancingWeek}
            className="game-bottom-nav__advance"
            data-testid="nav-advance-week"
            data-no-click-sound
          >
            {isAdvancingWeek ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5 fill-current" />
            )}
            <span>Next Month</span>
          </button>
        ) : null}
      </div>
    </nav>
  );
}
