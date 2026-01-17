import { useState } from 'react';
import { User, Trophy, Save, PlayCircle, RefreshCcw, Loader2 } from 'lucide-react';
import type { GameRun } from '@shared/schema';

interface PlayerNameModalProps {
  isOpen: boolean;
  onSubmit: (playerName: string) => void;
  onViewHallOfFame: () => void;
  savedGameInfo?: {
    playerName: string;
    savedAt: Date;
    cash: number;
    weeksRemaining: number;
  } | null;
  onContinueSavedGame?: () => void;
  onResumeGame?: (gameRun: GameRun) => void;
  onNewGameReplace?: (playerName: string, existingGameId: number) => void;
  checkExistingGame?: (playerName: string) => Promise<GameRun | null>;
}

export function PlayerNameModal({ 
  isOpen, 
  onSubmit, 
  onViewHallOfFame,
  savedGameInfo,
  onContinueSavedGame,
  onResumeGame,
  onNewGameReplace,
  checkExistingGame 
}: PlayerNameModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [existingGame, setExistingGame] = useState<GameRun | null>(null);
  const [showExistingGameOptions, setShowExistingGameOptions] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = playerName.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmed.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    
    setIsChecking(true);
    setError('');
    
    try {
      if (checkExistingGame) {
        const existing = await checkExistingGame(trimmed);
        if (existing && existing.status === 'active') {
          setExistingGame(existing);
          setShowExistingGameOptions(true);
        } else {
          onSubmit(trimmed);
        }
      } else {
        onSubmit(trimmed);
      }
    } catch (err) {
      setError('Failed to check for existing game');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResume = () => {
    if (existingGame && onResumeGame) {
      onResumeGame(existingGame);
    }
  };

  const handleNewGame = () => {
    if (existingGame && onNewGameReplace) {
      onNewGameReplace(playerName.trim(), existingGame.id);
    }
  };

  const handleBack = () => {
    setShowExistingGameOptions(false);
    setExistingGame(null);
  };

  if (showExistingGameOptions && existingGame) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gold/30 shadow-2xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-emerald-500/20 to-green-600/10 rounded-2xl border border-emerald-500/30 mb-4">
                <Save className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {existingGame.playerName}!</h2>
              <p className="text-gray-400">You have an existing game in progress</p>
            </div>

            <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/10">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-green-400">
                    ${existingGame.cash.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Cash</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-400">
                    {existingGame.weeksRemaining}
                  </div>
                  <div className="text-xs text-gray-500">Weeks Left</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-amber-400">
                    {existingGame.profitableDeals}/{existingGame.goalDeals}
                  </div>
                  <div className="text-xs text-gray-500">Deals</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleResume}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold text-lg rounded-xl hover:from-emerald-500 hover:to-emerald-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                data-testid="button-resume-game"
              >
                <PlayCircle className="w-6 h-6" />
                Resume Game
              </button>

              <button
                onClick={handleNewGame}
                className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg rounded-xl hover:from-amber-500 hover:to-orange-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                data-testid="button-new-game"
              >
                <RefreshCcw className="w-6 h-6" />
                Start New Game
              </button>
              <p className="text-xs text-center text-gray-500">
                This will delete your current progress
              </p>
            </div>

            <button
              onClick={handleBack}
              className="w-full mt-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              data-testid="button-back"
            >
              &larr; Use a different name
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gold/30 shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-gold/20 to-amber-600/10 rounded-2xl border border-gold/30 mb-4">
              <User className="w-10 h-10 text-gold" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to Dealbreak</h2>
            <p className="text-gray-400">Enter your name to start or resume your game</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError('');
                }}
                placeholder="Your name..."
                className="w-full px-4 py-4 bg-black/40 border border-white/20 rounded-xl text-white text-lg placeholder:text-gray-500 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/20 transition-all"
                autoFocus
                disabled={isChecking}
                data-testid="input-player-name"
              />
              {error && (
                <p className="mt-2 text-red-400 text-sm">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className="w-full py-4 bg-gradient-to-r from-gold to-amber-600 text-black font-bold text-lg rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="button-start-game"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                'Continue'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              onClick={onViewHallOfFame}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all"
              data-testid="button-view-hall-of-fame"
            >
              <Trophy className="w-5 h-5 text-gold" />
              View Hall of Fame
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
