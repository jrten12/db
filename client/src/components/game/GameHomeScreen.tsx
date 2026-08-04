import { Play, Trophy, Award, BookOpen, Settings } from 'lucide-react';
import { TrophyShelf, TOTAL_TROPHY_COUNT } from './TrophyShelf';
import logo from '@assets/dealbreak_icon_sim_1767848951783.png';
import { formatCurrency } from '@/lib/gameData';

interface GameHomeScreenProps {
  playerName: string;
  hasActiveGame: boolean;
  onPlayGame: () => void;
  onHallOfFame: () => void;
  onBadges: () => void;
  onTutorial: () => void;
  onSettings: () => void;
  earnedTrophies?: string[];
  cash?: number;
  weeksRemaining?: number;
  profitableDeals?: number;
  goalDeals?: number;
}

export function GameHomeScreen({
  playerName,
  hasActiveGame,
  onPlayGame,
  onHallOfFame,
  onBadges,
  onTutorial,
  onSettings,
  earnedTrophies = [],
  cash,
  weeksRemaining,
  profitableDeals,
  goalDeals,
}: GameHomeScreenProps) {
  const totalTrophies = TOTAL_TROPHY_COUNT;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-8 md:py-10 overflow-y-auto">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-5 md:gap-6">
        <div className="relative">
          <img
            src={logo}
            alt="Dealbreak: Real Estate Simulator"
            className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl"
            style={{
              boxShadow: '0 14px 40px rgba(0,0,0,0.6), 0 0 0 2px rgba(212,175,55,0.4), 0 6px 0 rgba(20,12,6,0.9)',
            }}
            data-testid="home-game-logo"
          />
        </div>

        <div className="text-center space-y-2">
          <h1
            className="font-display text-5xl md:text-6xl tracking-wide leading-none"
            style={{
              color: '#d4af37',
              textShadow: '0 3px 0 rgba(80,55,10,0.85), 0 8px 24px rgba(0,0,0,0.45)',
            }}
            data-testid="home-brand"
          >
            Dealbreak
          </h1>
          <p
            className="text-base md:text-lg font-semibold text-[hsl(38_25%_72%)]"
            data-testid="home-greeting"
          >
            Welcome back, <span className="text-[hsl(43_70%_68%)]">{playerName}</span>
          </p>
        </div>

        {hasActiveGame && cash !== undefined && weeksRemaining !== undefined && profitableDeals !== undefined && goalDeals !== undefined && (
          <div className="w-full game-scoreboard" data-testid="home-stats-preview">
            <div className="game-scoreboard-cell">
              <div className="game-scoreboard-value text-emerald-400" data-testid="home-stat-cash">
                {formatCurrency(cash)}
              </div>
              <div className="game-scoreboard-label">Cash</div>
            </div>
            <div className="game-scoreboard-cell">
              <div className="game-scoreboard-value text-[hsl(43_70%_72%)]" data-testid="home-stat-time">
                {weeksRemaining}
                <span className="text-[0.7em] ml-0.5 opacity-70">M</span>
              </div>
              <div className="game-scoreboard-label">Time</div>
            </div>
            <div className="game-scoreboard-cell">
              <div className="game-scoreboard-value" data-testid="home-stat-deals">
                <span className="text-emerald-400">{profitableDeals}</span>
                <span className="text-[hsl(35_15%_55%)]">/{goalDeals}</span>
              </div>
              <div className="game-scoreboard-label">Deals</div>
            </div>
          </div>
        )}

        <div className="w-full space-y-3 mt-1">
          <button
            onClick={onPlayGame}
            className="menu-row menu-row-primary"
            data-testid="button-play-game"
            data-sound="swoosh"
          >
            <Play className="w-7 h-7" fill="currentColor" />
            {hasActiveGame ? 'Continue' : 'Play'}
          </button>

          <button
            onClick={onHallOfFame}
            className="menu-row"
            data-testid="button-hall-of-fame-home"
            data-sound="swoosh"
          >
            <Trophy className="w-6 h-6 text-[hsl(43_72%_55%)]" />
            Hall of Fame
          </button>

          <button
            onClick={onBadges}
            className="menu-row"
            data-testid="button-badges-trophies"
            data-sound="swoosh"
          >
            <Award className="w-6 h-6 text-[hsl(43_72%_55%)]" />
            Badges
            <span className="ml-auto text-sm px-2.5 py-1 rounded-md bg-[rgba(212,175,55,0.18)] text-[hsl(43_70%_72%)] border border-[rgba(212,175,55,0.35)] font-mono">
              {earnedTrophies.length}/{totalTrophies}
            </span>
          </button>

          <button
            onClick={onTutorial}
            className="menu-row"
            data-testid="button-tutorial-home"
            data-sound="swoosh"
          >
            <BookOpen className="w-6 h-6" />
            How to Play
          </button>

          <button
            onClick={onSettings}
            className="menu-row"
            data-testid="button-settings-home"
            data-sound="swoosh"
          >
            <Settings className="w-6 h-6" />
            Settings
          </button>
        </div>

        {earnedTrophies.length > 0 && (
          <div className="w-full mt-1">
            <TrophyShelf
              earnedTrophies={earnedTrophies}
              compact
              className="desk-panel rounded-xl p-4 border-2 border-[rgba(180,140,70,0.3)]"
            />
          </div>
        )}
      </div>
    </div>
  );
}
