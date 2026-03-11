import { useState, useEffect } from 'react';
import { Trophy, Save, PlayCircle, RefreshCcw, Loader2, TrendingUp, DollarSign, Building2, Briefcase, ArrowRight } from 'lucide-react';
import type { GameRun } from '@shared/schema';
import logo from '@assets/new_icon_db_1772940176909.webp';

let keyAudioPool: HTMLAudioElement[] = [];
let keyPoolIndex = 0;
const KEY_POOL_SIZE = 5;
let keyPoolInitialized = false;

const initKeyAudioPool = () => {
  if (keyPoolInitialized || typeof window === 'undefined') return;
  keyPoolInitialized = true;
  for (let i = 0; i < KEY_POOL_SIZE; i++) {
    const audio = new Audio('/sounds/key_type.wav');
    audio.volume = 0.2;
    keyAudioPool.push(audio);
  }
};

const playKeySound = () => {
  initKeyAudioPool();
  if (keyAudioPool.length === 0) return;
  const audio = keyAudioPool[keyPoolIndex];
  audio.currentTime = 0;
  audio.play().catch(() => {});
  keyPoolIndex = (keyPoolIndex + 1) % KEY_POOL_SIZE;
};

const playUkuleleStrum = () => {
  const audio = new Audio('/sounds/ukulele_strum.wav');
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

const HEADLINES = [
  { icon: TrendingUp, text: '$100K starting cash. 12 months on the clock.' },
  { icon: DollarSign, text: 'Flip houses. Build rental income. Beat the market.' },
  { icon: Building2, text: 'Analyze deals. Manage risk. Close profitable exits.' },
  { icon: Briefcase, text: 'Due diligence matters. Skip it at your own risk.' },
];

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
  const [mounted, setMounted] = useState(false);
  const [headlineIdx, setHeadlineIdx] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setMounted(true), 50);
      return () => clearTimeout(t);
    }
    setMounted(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setHeadlineIdx(prev => (prev + 1) % HEADLINES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isOpen]);

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
    
    playUkuleleStrum();
    
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

  const HeadlineIcon = HEADLINES[headlineIdx].icon;

  if (showExistingGameOptions && existingGame) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            background: 'linear-gradient(180deg, #141420 0%, #0c0c14 100%)',
            border: '1px solid rgba(16,185,129,0.2)',
            boxShadow: '0 0 80px rgba(16,185,129,0.08), 0 32px 64px rgba(0,0,0,0.5)',
          }}
        >
          <div className="p-6">
            <div className="text-center mb-5">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
                  border: '1.5px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 30px rgba(16,185,129,0.1)',
                }}
              >
                <Save className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Welcome back, {existingGame.playerName}!</h2>
              <p className="text-sm text-white/50">You have a game in progress</p>
            </div>

            <div
              className="rounded-xl p-3.5 mb-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-400 font-mono">
                    ${existingGame.cash.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Cash</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-400">
                    {existingGame.weeksRemaining}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Months Left</div>
                </div>
                <div>
                  <div className="text-lg font-bold">
                    <span className="text-emerald-400">{existingGame.profitableDeals}</span>
                    <span className="text-white/40">/{existingGame.goalDeals}</span>
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wider">Deals</div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={handleResume}
                className="w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.35), rgba(5,150,105,0.45))',
                  border: '1.5px solid rgba(16,185,129,0.5)',
                  color: '#6ee7b7',
                  boxShadow: '0 0 25px rgba(16,185,129,0.15)',
                }}
                data-testid="button-resume-game"
              >
                <PlayCircle className="w-5 h-5" />
                Resume Game
              </button>

              <button
                onClick={handleNewGame}
                className="w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.25))',
                  border: '1.5px solid rgba(251,191,36,0.4)',
                  color: '#fbbf24',
                }}
                data-testid="button-new-game"
              >
                <RefreshCcw className="w-5 h-5" />
                Start Fresh
              </button>
              <p className="text-[11px] text-center text-white/35">
                Starting fresh will erase current progress
              </p>
            </div>

            <button
              onClick={handleBack}
              className="w-full mt-3 py-2 text-white/40 hover:text-white/60 text-sm transition-colors"
              data-testid="button-back"
            >
              &larr; Different name
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#08080c' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-1/2" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(16,185,129,0.02) 100%)' }} />
      </div>

      <div
        className="relative w-full max-w-md transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <div className="text-center mb-6">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-3 rounded-2xl bg-emerald-500/15 blur-xl" />
            <img
              src={logo}
              alt="Dealbreak"
              className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl"
              style={{
                boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 2px rgba(16,185,129,0.35), 0 0 30px rgba(16,185,129,0.1)',
              }}
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1" data-testid="text-welcome-title">
            Dealbreak
          </h1>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/35 mb-5">Real Estate Simulator</p>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-500"
            style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.12)',
            }}
            key={headlineIdx}
          >
            <HeadlineIcon className="w-3.5 h-3.5 text-emerald-500/70 flex-shrink-0" />
            <span className="text-xs text-white/50 leading-tight">{HEADLINES[headlineIdx].text}</span>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 mb-4"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="investor-name-input" className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium mb-2 block">
                Your investor name
              </label>
              <input
                id="investor-name-input"
                type="text"
                value={playerName}
                onChange={(e) => {
                  if (e.target.value !== playerName) {
                    playKeySound();
                  }
                  setPlayerName(e.target.value);
                  setError('');
                }}
                placeholder="Enter your name..."
                className="w-full px-4 py-3.5 rounded-xl text-white text-base placeholder:text-white/15 focus:outline-none transition-all font-medium"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${error ? 'rgba(239,68,68,0.4)' : playerName ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: playerName ? '0 0 20px rgba(16,185,129,0.05)' : 'none',
                }}
                autoFocus
                disabled={isChecking}
                data-testid="input-player-name"
              />
              {error && (
                <p className="mt-1.5 text-red-400 text-xs">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChecking || !playerName.trim()}
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: playerName.trim()
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(5,150,105,0.5))'
                  : 'rgba(255,255,255,0.04)',
                border: playerName.trim()
                  ? '1.5px solid rgba(16,185,129,0.5)'
                  : '1.5px solid rgba(255,255,255,0.06)',
                color: playerName.trim() ? '#6ee7b7' : 'rgba(255,255,255,0.2)',
                boxShadow: playerName.trim() ? '0 0 30px rgba(16,185,129,0.15)' : 'none',
              }}
              data-testid="button-start-game"
            >
              {isChecking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  Let's Go
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <button
          onClick={onViewHallOfFame}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.97]"
          style={{
            color: 'rgba(251,191,36,0.6)',
          }}
          data-testid="button-view-hall-of-fame"
        >
          <Trophy className="w-4 h-4" />
          Hall of Fame
        </button>
      </div>
    </div>
  );
}
