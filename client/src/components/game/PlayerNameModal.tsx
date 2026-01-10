import { useState } from 'react';
import { X, User, Trophy } from 'lucide-react';

interface PlayerNameModalProps {
  isOpen: boolean;
  onSubmit: (playerName: string) => void;
  onViewHallOfFame: () => void;
}

export function PlayerNameModal({ isOpen, onSubmit, onViewHallOfFame }: PlayerNameModalProps) {
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gold/30 shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-gold/20 to-amber-600/10 rounded-2xl border border-gold/30 mb-4">
              <User className="w-10 h-10 text-gold" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to Dealbreak</h2>
            <p className="text-gray-400">Enter your name to join the Hall of Fame</p>
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
                data-testid="input-player-name"
              />
              {error && (
                <p className="mt-2 text-red-400 text-sm">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-gold to-amber-600 text-black font-bold text-lg rounded-xl hover:from-amber-500 hover:to-amber-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              data-testid="button-start-game"
            >
              Start Game
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
