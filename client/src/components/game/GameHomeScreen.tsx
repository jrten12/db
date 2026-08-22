import { Play, BookOpen, Wallet, Clock, Target, RotateCcw, GraduationCap, Download, Share } from 'lucide-react';
import { formatCurrency } from '@/lib/gameData';
import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAppInstall } from '@/hooks/useAppInstall';

interface GameHomeScreenProps {
  playerName: string;
  hasActiveGame: boolean;
  onPlayGame: () => void;
  onHallOfFame: () => void;
  onBadges: () => void;
  onTutorial: () => void;
  onRestartGame?: () => void;
  onSettings?: () => void;
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
  onTutorial,
  onRestartGame,
  cash,
  weeksRemaining,
  profitableDeals,
  goalDeals,
}: GameHomeScreenProps) {
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { canInstall, isIos, hasNativePrompt, promptInstall } = useAppInstall();

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start px-4 py-6 md:py-10">
      <div
        className="w-full max-w-sm mx-auto flex flex-col items-center gap-6 transition-opacity duration-500"
        style={{ opacity: mounted ? 1 : 0 }}
      >
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-[hsl(var(--workstation-brass)/0.8)] mb-2" data-testid="home-title">
            Dealbreak
          </p>
          <h1 className="font-display text-2xl text-[hsl(var(--workstation-paper))]">Underwriting simulator</h1>
          <p className="text-sm text-[hsl(var(--workstation-muted))] mt-2" data-testid="home-greeting">
            {playerName}
          </p>
        </div>

        {hasActiveGame && cash !== undefined && weeksRemaining !== undefined && profitableDeals !== undefined && goalDeals !== undefined && (
          <div className="w-full border border-[hsl(var(--workstation-rule))] divide-y divide-[hsl(var(--workstation-rule))]" data-testid="home-stats-preview">
            <div className="grid grid-cols-3 divide-x divide-[hsl(var(--workstation-rule))]">
              <div className="px-3 py-3 text-center">
                <Wallet className="w-3.5 h-3.5 text-[hsl(var(--workstation-muted))] mx-auto mb-1" />
                <div className="text-sm font-mono font-semibold text-[hsl(var(--workstation-paper))]" data-testid="home-stat-cash">
                  {formatCurrency(cash)}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--workstation-muted))]">Cash</div>
              </div>
              <div className="px-3 py-3 text-center">
                <Clock className="w-3.5 h-3.5 text-[hsl(var(--workstation-muted))] mx-auto mb-1" />
                <div className="text-sm font-mono font-semibold text-[hsl(var(--workstation-paper))]" data-testid="home-stat-time">
                  {weeksRemaining <= 0 ? 'OT' : `${weeksRemaining}M`}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--workstation-muted))]">
                  {weeksRemaining <= 0 ? 'Overtime' : 'Time'}
                </div>
              </div>
              <div className="px-3 py-3 text-center">
                <Target className="w-3.5 h-3.5 text-[hsl(var(--workstation-muted))] mx-auto mb-1" />
                <div className="text-sm font-mono font-semibold text-[hsl(var(--workstation-paper))]" data-testid="home-stat-deals">
                  {profitableDeals}<span className="text-[hsl(var(--workstation-muted))]">/{goalDeals}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[hsl(var(--workstation-muted))]">Deals</div>
              </div>
            </div>
          </div>
        )}

        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={onPlayGame}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-sm bg-[hsl(var(--workstation-brass))] text-[hsl(var(--workstation-ink))] hover:brightness-110 transition-all touch-target"
            data-testid="button-play-game"
          >
            <Play className="w-5 h-5" />
            {hasActiveGame ? 'Continue run' : 'Start new run'}
          </button>

          {!hasActiveGame && (
            <button
              type="button"
              onClick={onTutorial}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium border border-[hsl(var(--workstation-rule))] text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-paper))] touch-target"
              data-testid="button-tutorial-home"
            >
              <GraduationCap className="w-4 h-4" />
              Start with tutorial
            </button>
          )}

          {hasActiveGame && (
            <button
              type="button"
              onClick={onTutorial}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-sm text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-paper))] touch-target"
              data-testid="button-tutorial-continue"
            >
              <BookOpen className="w-4 h-4" />
              Review tutorial
            </button>
          )}

          {canInstall ? (
            <button
              type="button"
              onClick={() => {
                if (hasNativePrompt) {
                  promptInstall();
                  return;
                }
                if (isIos) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm border border-[hsl(var(--workstation-rule))] text-[hsl(var(--workstation-muted))] touch-target"
              data-testid="button-install-home"
            >
              {isIos && !hasNativePrompt ? (
                <>
                  <Share className="w-4 h-4" />
                  Add to home screen
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Install app
                </>
              )}
            </button>
          ) : null}

          {hasActiveGame && onRestartGame ? (
            showRestartConfirm ? (
              <div className="border border-[hsl(var(--workstation-loss)/0.4)] p-3 space-y-2">
                <p className="text-xs text-[hsl(var(--workstation-muted))]">Discard this run and start over?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRestartGame();
                      setShowRestartConfirm(false);
                    }}
                    className="flex-1 py-2 text-xs font-medium bg-[hsl(var(--workstation-loss))] text-white"
                    data-testid="button-confirm-restart"
                  >
                    Yes, restart
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRestartConfirm(false)}
                    className="flex-1 py-2 text-xs border border-[hsl(var(--workstation-rule))] text-[hsl(var(--workstation-muted))]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRestartConfirm(true)}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-loss))]"
                data-testid="button-restart-game"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restart run
              </button>
            )
          ) : null}
        </div>

        <Link href="/learn" className="text-xs text-[hsl(var(--workstation-muted))] hover:text-[hsl(var(--workstation-brass))]">
          Read the field guides →
        </Link>
      </div>
    </div>
  );
}
