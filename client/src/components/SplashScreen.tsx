import { useState, useEffect, useRef } from 'react';
import splashLogo from '@assets/ChatGPT_Image_Jan_29,_2026,_12_02_57_AM_1769662997139.png';
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

function FloatingParticle({ delay, duration, x, size }: { delay: number; duration: number; x: number; size: number }) {
  return (
    <div
      className="absolute bottom-0 pointer-events-none animate-float-up"
      style={{
        left: `${x}%`,
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
      }}
    >
      <div 
        className="rounded-full bg-gradient-to-t from-cyan-400/40 to-white/60"
        style={{ width: size, height: size }}
      />
    </div>
  );
}

function LightRay({ angle, delay }: { angle: number; delay: number }) {
  return (
    <div
      className="absolute top-1/2 left-1/2 origin-center pointer-events-none animate-ray"
      style={{
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="w-[2px] h-[400px] bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" />
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
    { delay: 200, x: 12, y: 22, size: 14 },
    { delay: 400, x: 88, y: 18, size: 18 },
    { delay: 600, x: 8, y: 72, size: 12 },
    { delay: 800, x: 92, y: 78, size: 16 },
    { delay: 1000, x: 22, y: 12, size: 10 },
    { delay: 1200, x: 78, y: 88, size: 14 },
    { delay: 1400, x: 3, y: 42, size: 12 },
    { delay: 1600, x: 97, y: 55, size: 10 },
    { delay: 1800, x: 28, y: 92, size: 16 },
    { delay: 2000, x: 72, y: 8, size: 12 },
    { delay: 2200, x: 48, y: 3, size: 18 },
    { delay: 2400, x: 42, y: 97, size: 14 },
    { delay: 300, x: 35, y: 30, size: 8 },
    { delay: 900, x: 65, y: 70, size: 10 },
    { delay: 1500, x: 18, y: 55, size: 8 },
    { delay: 2100, x: 82, y: 45, size: 10 },
  ];

  const particles = [
    { delay: 0, duration: 4000, x: 15, size: 3 },
    { delay: 500, duration: 3500, x: 25, size: 2 },
    { delay: 1000, duration: 4500, x: 35, size: 4 },
    { delay: 1500, duration: 3800, x: 45, size: 2 },
    { delay: 2000, duration: 4200, x: 55, size: 3 },
    { delay: 2500, duration: 3600, x: 65, size: 2 },
    { delay: 3000, duration: 4100, x: 75, size: 4 },
    { delay: 3500, duration: 3900, x: 85, size: 3 },
    { delay: 800, duration: 4300, x: 20, size: 2 },
    { delay: 1800, duration: 3700, x: 80, size: 3 },
  ];

  const rays = [
    { angle: 0, delay: 0 },
    { angle: 45, delay: 200 },
    { angle: 90, delay: 400 },
    { angle: 135, delay: 600 },
    { angle: 180, delay: 800 },
    { angle: 225, delay: 1000 },
    { angle: 270, delay: 1200 },
    { angle: 315, delay: 1400 },
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
      {/* Deep space gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000814] via-[#001d3d] to-[#000814]" />
      
      {/* Animated nebula effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] animate-nebula-1">
          <div className="absolute inset-0 bg-gradient-radial from-cyan-500/12 via-transparent to-transparent" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] animate-nebula-2">
          <div className="absolute inset-0 bg-gradient-radial from-blue-400/8 via-transparent to-transparent" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] animate-nebula-3">
          <div className="absolute inset-0 bg-gradient-radial from-purple-500/6 via-transparent to-transparent" />
        </div>
      </div>

      {/* Light rays emanating from center */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        {rays.map((ray, i) => (
          <LightRay key={i} {...ray} />
        ))}
      </div>

      {/* Floating particles rising up */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle, i) => (
          <FloatingParticle key={i} {...particle} />
        ))}
      </div>

      {/* Sparkles scattered around */}
      {sparkles.map((sparkle, i) => (
        <Sparkle key={i} {...sparkle} />
      ))}

      {/* Main content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div 
          className={`flex flex-col items-center transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          {/* Logo container with multiple glow layers */}
          <div className="relative animate-logo-float">
            {/* Outer glow ring */}
            <div className="absolute -inset-32 bg-cyan-400/8 blur-[120px] rounded-full animate-glow-pulse" />
            
            {/* Middle glow ring */}
            <div className="absolute -inset-20 bg-blue-400/12 blur-[80px] rounded-full animate-glow-pulse-offset" />
            
            {/* Inner glow ring */}
            <div className="absolute -inset-10 bg-cyan-300/15 blur-[40px] rounded-full animate-glow-pulse-fast" />
            
            {/* Sharp logo with enhanced rendering */}
            <img 
              src={splashLogo} 
              alt="Infarill & LVI Properties, LLC"
              className="relative w-[360px] sm:w-[520px] md:w-[640px] lg:w-[760px] h-auto animate-logo-shine"
              style={{
                filter: 'drop-shadow(0 0 60px rgba(34, 211, 238, 0.25)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.2)) contrast(1.05) brightness(1.02)',
                imageRendering: 'auto',
              }}
              data-testid="img-splash-logo"
            />
            
            {/* Overlay shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-shine-sweep pointer-events-none" />
          </div>
          
          {/* "Click to Continue" with elegant animation */}
          <div 
            className={`mt-16 transition-all duration-700 delay-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}
          >
            <p 
              className="text-white/40 text-[11px] sm:text-sm tracking-[0.25em] font-light animate-text-pulse"
              style={{ fontFamily: "'SF Pro Display', 'Helvetica Neue', -apple-system, sans-serif" }}
            >
              TAP TO BEGIN
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
            transform: scale(1.2) rotate(180deg);
          }
        }
        
        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0.5);
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) scale(1);
          }
        }
        
        @keyframes ray {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes nebula-1 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
          }
        }
        
        @keyframes nebula-2 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1.05) rotate(0deg);
          }
          50% {
            transform: translate(-50%, -50%) scale(0.95) rotate(-5deg);
          }
        }
        
        @keyframes nebula-3 {
          0%, 100% {
            transform: translate(-50%, -50%) scale(0.95);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.15);
          }
        }
        
        @keyframes logo-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        
        @keyframes logo-shine {
          0%, 100% {
            filter: drop-shadow(0 0 60px rgba(34, 211, 238, 0.25)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.2)) contrast(1.05) brightness(1.02);
          }
          50% {
            filter: drop-shadow(0 0 80px rgba(34, 211, 238, 0.35)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.3)) contrast(1.08) brightness(1.05);
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        @keyframes glow-pulse-offset {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1.05);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.95);
          }
        }
        
        @keyframes glow-pulse-fast {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }
        
        @keyframes shine-sweep {
          0% {
            transform: translateX(-100%) rotate(-45deg);
          }
          100% {
            transform: translateX(200%) rotate(-45deg);
          }
        }
        
        @keyframes text-glow {
          0%, 100% {
            text-shadow: 0 0 10px rgba(34, 211, 238, 0.3);
          }
          50% {
            text-shadow: 0 0 20px rgba(34, 211, 238, 0.6), 0 0 40px rgba(34, 211, 238, 0.3);
          }
        }
        
        @keyframes text-pulse {
          0%, 100% {
            opacity: 0.5;
            letter-spacing: 0.3em;
          }
          50% {
            opacity: 0.9;
            letter-spacing: 0.35em;
          }
        }
        
        .animate-sparkle {
          animation: sparkle 2.5s ease-in-out infinite;
        }
        
        .animate-float-up {
          animation: float-up linear infinite;
        }
        
        .animate-ray {
          animation: ray 3s ease-in-out infinite;
        }
        
        .animate-nebula-1 {
          animation: nebula-1 8s ease-in-out infinite;
        }
        
        .animate-nebula-2 {
          animation: nebula-2 10s ease-in-out infinite;
        }
        
        .animate-nebula-3 {
          animation: nebula-3 6s ease-in-out infinite;
        }
        
        .animate-logo-float {
          animation: logo-float 4s ease-in-out infinite;
        }
        
        .animate-logo-shine {
          animation: logo-shine 3s ease-in-out infinite;
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 4s ease-in-out infinite;
        }
        
        .animate-glow-pulse-offset {
          animation: glow-pulse-offset 5s ease-in-out infinite;
        }
        
        .animate-glow-pulse-fast {
          animation: glow-pulse-fast 2s ease-in-out infinite;
        }
        
        .animate-shine-sweep {
          animation: shine-sweep 4s ease-in-out infinite;
        }
        
        .animate-text-glow {
          animation: text-glow 3s ease-in-out infinite;
        }
        
        .animate-text-pulse {
          animation: text-pulse 2s ease-in-out infinite;
        }
        
        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-from) 0%, var(--tw-gradient-via) 50%, var(--tw-gradient-to) 100%);
        }
      `}</style>
    </div>
  );
}
