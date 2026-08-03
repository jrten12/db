import { Play, Trophy, Award, BookOpen, Settings, Wallet, Clock, Target } from 'lucide-react';
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
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-start px-4 py-8 md:py-12 overflow-y-auto">
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
        <div className="relative mb-1">
          <img
            src={logo}
            alt="Dealbreak: Real Estate Simulator"
            className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl"
            style={{
              boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.35)',
            }}
            data-testid="home-game-logo"
          />
        </div>

        <div className="text-center space-y-1">
          <h1
            className="font-display text-3xl md:text-4xl tracking-wide"
            style={{ color: '#d4af37' }}
            data-testid="home-brand"
          >
            Dealbreak
          </h1>
          <p className="text-sm text-[hsl(35_18%_70%)]" data-testid="home-greeting">
            Welcome back, {playerName}
          </p>
        </div>

        <div className="brass-rule w-full" />

        {hasActiveGame && cash !== undefined && weeksRemaining !== undefined && profitableDeals !== undefined && goalDeals !== undefined && (
          <div
            className="w-full desk-panel rounded-lg px-3 py-3 grid grid-cols-3 gap-2"
            data-testid="home-stats-preview"
          >
            <div className="text-center">
              <Wallet className="w-4 h-4 text-emerald-400/90 mx-auto mb-1" />
              <div className="text-sm font-bold text-emerald-400 font-mono" data-testid="home-stat-cash">
                {formatCurrency(cash)}
              </div>
              <div className="text-[10px] text-[hsl(30_12%_55%)] uppercase tracking-wider">Cash</div>
            </div>
            <div className="text-center border-x border-[rgba(180,140,70,0.2)]">
              <Clock className="w-4 h-4 text-[hsl(43_55%_58%)] mx-auto mb-1" />
              <div className="text-sm font-bold text-[hsl(43_55%_68%)]" data-testid="home-stat-time">
                {weeksRemaining}M
              </div>
              <div className="text-[10px] text-[hsl(30_12%_55%)] uppercase tracking-wider">Time Left</div>
            </div>
            <div className="text-center">
              <Target className="w-4 h-4 text-[hsl(43_72%_55%)] mx-auto mb-1" />
              <div className="text-sm font-bold" data-testid="home-stat-deals">
                <span className="text-emerald-400">{profitableDeals}</span>
                <span className="text-[hsl(30_12%_55%)]">/{goalDeals}</span>
              </div>
              <div className="text-[10px] text-[hsl(30_12%_55%)] uppercase tracking-wider">Deals</div>
            </div>
          </div>
        )}

        <div className="w-full space-y-2.5">
          <button
            onClick={onPlayGame}
            className="menu-row menu-row-primary text-lg"
            data-testid="button-play-game"
            data-sound="swoosh"
          >
            <Play className="w-6 h-6" />
            {hasActiveGame ? 'Continue Game' : 'Play Game'}
          </button>

          <button
            onClick={onHallOfFame}
            className="menu-row"
            data-testid="button-hall-of-fame-home"
            data-sound="swoosh"
          >
            <Trophy className="w-5 h-5 text-[hsl(43_72%_55%)]" />
            Hall of Fame
          </button>

          <button
            onClick={onBadges}
            className="menu-row"
            data-testid="button-badges-trophies"
            data-sound="swoosh"
          >
            <Award className="w-5 h-5 text-[hsl(43_72%_55%)]" />
            Badges & Trophies
            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-[rgba(212,175,55,0.15)] text-[hsl(43_60%_70%)] border border-[rgba(212,175,55,0.25)]">
              {earnedTrophies.length}/{totalTrophies}
            </span>
          </button>

          <button
            onClick={onTutorial}
            className="menu-row"
            data-testid="button-tutorial-home"
            data-sound="swoosh"
          >
            <BookOpen className="w-5 h-5" />
            Learn How to Play
          </button>

          <button
            onClick={onSettings}
            className="menu-row"
            data-testid="button-settings-home"
            data-sound="swoosh"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </div>

        {earnedTrophies.length > 0 && (
          <div className="w-full mt-1">
            <TrophyShelf
              earnedTrophies={earnedTrophies}
              compact
              className="desk-panel rounded-lg p-3"
            />
          </div>
        )}
      </div>
    </div>
  );
}
