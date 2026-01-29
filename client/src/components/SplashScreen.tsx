import { useState, useEffect, useRef } from 'react';
import splashLogo from '@assets/image_1769643759418.png';
import splashJingle from '@assets/splash_jingle.wav';

interface SplashScreenProps {
  onComplete: () => void;
}

function Sparkle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="animate-sparkle"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
          <path
            d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
            fill="url(#sparkleGradient)"
          />
          <defs>
            <linearGradient id="sparkleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#67e8f9" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);

  const sparkles = [
    { delay: 200, x: 15, y: 25, size: 12 },
    { delay: 400, x: 85, y: 20, size: 16 },
    { delay: 600, x: 10, y: 70, size: 10 },
    { delay: 800, x: 90, y: 75, size: 14 },
    { delay: 1000, x: 25, y: 15, size: 8 },
    { delay: 1200, x: 75, y: 85, size: 12 },
    { delay: 1400, x: 5, y: 45, size: 10 },
    { delay: 1600, x: 95, y: 50, size: 8 },
    { delay: 1800, x: 30, y: 90, size: 14 },
    { delay: 2000, x: 70, y: 10, size: 10 },
    { delay: 2200, x: 50, y: 5, size: 16 },
    { delay: 2400, x: 45, y: 95, size: 12 },
  ];

  useEffect(() => {
    const contentTimer = setTimeout(() => {
      setShowContent(true);
    }, 100);

    const playJingle = async () => {
      if (hasPlayedRef.current) return;
      hasPlayedRef.current = true;
      
      try {
        audioRef.current = new Audio(splashJingle);
        audioRef.current.volume = 0.6;
        await audioRef.current.play();
      } catch (err) {
        console.log('Audio autoplay blocked, continuing without sound');
      }
    };

    playJingle();

    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 4700);

    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 5200);

    return () => {
      clearTimeout(contentTimer);
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
      className={`fixed inset-0 z-[200] cursor-pointer transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      onClick={handleClick}
      data-testid="splash-screen"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0a1628] to-[#020617]" />
      
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/8 via-transparent to-transparent animate-pulse-slow" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/5 via-transparent to-transparent animate-pulse-slower" />
        </div>
      </div>

      {sparkles.map((sparkle, i) => (
        <Sparkle key={i} {...sparkle} />
      ))}

      <div className="relative z-10 h-full flex items-center justify-center">
        <div 
          className={`flex flex-col items-center transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <p 
            className="text-cyan-300/60 text-xs sm:text-sm tracking-[0.4em] uppercase mb-6 font-extralight"
            style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
          >
            A Game By
          </p>
          
          <div className="relative">
            <div className="absolute -inset-20 bg-cyan-400/5 blur-[100px] rounded-full" />
            <div className="absolute -inset-10 bg-blue-500/8 blur-[60px] rounded-full animate-pulse-slow" />
            
            <img 
              src={splashLogo} 
              alt="Infarill & LVI Properties, LLC"
              className="relative w-[340px] sm:w-[480px] md:w-[580px] lg:w-[680px] h-auto drop-shadow-2xl"
              style={{
                filter: 'drop-shadow(0 0 40px rgba(34, 211, 238, 0.15))',
              }}
              data-testid="img-splash-logo"
            />
          </div>
          
          <div 
            className={`mt-10 transition-all duration-700 delay-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}
          >
            <p 
              className="text-gray-600 text-[10px] sm:text-xs tracking-widest animate-pulse"
              style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
            >
              CLICK TO CONTINUE
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sparkle {
          0%, 100% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg);
          }
        }
        
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-pulse-slower {
          animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 50%, var(--tw-gradient-to) 100%);
        }
      `}</style>
    </div>
  );
}
