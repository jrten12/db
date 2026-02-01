import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

const MUSIC_TRACKS = [
  '/music-1.mp3',
  '/music-2.mp3',
  '/music-3.wav',
];

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
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(MUSIC_TRACKS[0]);
      audioRef.current.volume = 0.3;
      audioRef.current.loop = false;
    }

    const audio = audioRef.current;

    const handleEnded = () => {
      const nextTrack = (currentTrack + 1) % MUSIC_TRACKS.length;
      setCurrentTrack(nextTrack);
      audio.src = MUSIC_TRACKS[nextTrack];
      if (isPlaying && hasInteracted.current) {
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [currentTrack, isPlaying]);

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
    const handleFirstInteraction = () => {
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
