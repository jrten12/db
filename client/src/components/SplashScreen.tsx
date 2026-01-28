import { useState, useEffect, useRef } from 'react';
import splashLogo from '@assets/image_1769643759418.png';
import splashJingle from '@assets/splash_jingle.wav';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const playJingle = async () => {
      if (hasPlayedRef.current) return;
      hasPlayedRef.current = true;
      
      try {
        audioRef.current = new Audio(splashJingle);
        audioRef.current.volume = 0.5;
        await audioRef.current.play();
      } catch (err) {
        console.log('Audio autoplay blocked, continuing without sound');
      }
    };

    playJingle();

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 3500);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 4500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [onComplete]);

  const handleClick = () => {
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 500);
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[200] bg-[#0a1628] flex items-center justify-center cursor-pointer transition-opacity duration-1000 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClick}
      data-testid="splash-screen"
    >
      <div className="flex flex-col items-center gap-6">
        <p className="text-gray-400 text-sm tracking-[0.3em] uppercase font-light">
          A Game By
        </p>
        
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full" />
          <img 
            src={splashLogo} 
            alt="Infarill & LVI Properties, LLC"
            className="relative max-w-md w-full h-auto"
            data-testid="img-splash-logo"
          />
        </div>
        
        <p className="text-gray-500 text-xs mt-8 animate-pulse">
          Click anywhere to continue
        </p>
      </div>
    </div>
  );
}
