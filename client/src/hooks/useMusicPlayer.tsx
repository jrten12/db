import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

const MUSIC_TRACKS = [
  '/music-1.mp3',
  '/music-2.mp3',
  '/music-3.mp3',
  '/music-4.mp3',
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface MusicContextType {
  isPlaying: boolean;
  toggleMusic: () => void;
  setPlaying: (playing: boolean) => void;
  triggerInteraction: () => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(() => {
    const saved = localStorage.getItem('musicEnabled');
    return saved !== 'false';
  });
  const [shuffledTracks, setShuffledTracks] = useState<string[]>(() => shuffleArray(MUSIC_TRACKS));
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(shuffledTracks[0]);
      audioRef.current.volume = 0.3;
      audioRef.current.loop = false;
    }

    const audio = audioRef.current;

    const handleEnded = () => {
      const nextIndex = currentTrackIndex + 1;
      if (nextIndex >= shuffledTracks.length) {
        const newShuffle = shuffleArray(MUSIC_TRACKS);
        setShuffledTracks(newShuffle);
        setCurrentTrackIndex(0);
        audio.src = newShuffle[0];
      } else {
        setCurrentTrackIndex(nextIndex);
        audio.src = shuffledTracks[nextIndex];
      }
      if (isPlaying && hasInteracted.current) {
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentTrackIndex, shuffledTracks, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && hasInteracted.current) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }

    localStorage.setItem('musicEnabled', String(isPlaying));
  }, [isPlaying]);

  useEffect(() => {
    const handleFirstInteraction = (e: Event) => {
      // Don't start music if clicking on splash screen - splash has its own jingle
      const target = e.target as HTMLElement;
      if (target.closest('[data-testid="splash-screen"]')) {
        return;
      }
      
      hasInteracted.current = true;
      if (isPlaying && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isPlaying]);

  const toggleMusic = () => {
    hasInteracted.current = true;
    setIsPlaying(prev => !prev);
  };

  const setPlaying = (playing: boolean) => {
    hasInteracted.current = true;
    setIsPlaying(playing);
  };

  const triggerInteraction = () => {
    hasInteracted.current = true;
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <MusicContext.Provider value={{ isPlaying, toggleMusic, setPlaying, triggerInteraction }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
