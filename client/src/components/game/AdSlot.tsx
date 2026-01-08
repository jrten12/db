import { useEffect, useRef, useState } from 'react';

type AdSize = 'banner' | 'leaderboard' | 'rectangle' | 'skyscraper' | 'mobile-banner';

interface AdSlotProps {
  size: AdSize;
  className?: string;
  id: string;
}

const AD_SIZES: Record<AdSize, { desktop: [number, number]; mobile: [number, number] }> = {
  'banner': { desktop: [728, 90], mobile: [320, 50] },
  'leaderboard': { desktop: [970, 90], mobile: [320, 100] },
  'rectangle': { desktop: [300, 250], mobile: [300, 250] },
  'skyscraper': { desktop: [160, 600], mobile: [300, 250] },
  'mobile-banner': { desktop: [468, 60], mobile: [320, 100] },
};

const getInitialMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(max-width: 767px)').matches;
};

export function AdSlot({ size, className = '', id }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(getInitialMobile);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const dimensions = AD_SIZES[size];
  const [width, height] = isMobile ? dimensions.mobile : dimensions.desktop;

  return (
    <div
      ref={containerRef}
      id={id}
      className={`ad-slot flex items-center justify-center bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg overflow-hidden ${className}`}
      style={{ 
        minHeight: height,
        maxWidth: width,
        width: '100%',
      }}
      aria-hidden="true"
      data-testid={`ad-slot-${id}`}
    >
      {isVisible && (
        <div className="text-center p-4">
          <div className="text-gray-600 text-xs uppercase tracking-wider mb-1">Advertisement</div>
          <div className="text-gray-500 text-xs">
            {width} x {height}
          </div>
        </div>
      )}
    </div>
  );
}

export function BannerAd({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full flex justify-center py-2 ${className}`}>
      <AdSlot size="leaderboard" id="banner-top" />
    </div>
  );
}

export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <div className={className}>
      <AdSlot size="rectangle" id="sidebar-ad" />
    </div>
  );
}

export function InlineAd({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full flex justify-center py-3 ${className}`}>
      <AdSlot size="rectangle" id="inline-ad" />
    </div>
  );
}

export function FooterAd({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full flex justify-center py-2 safe-area-bottom ${className}`}>
      <AdSlot size="mobile-banner" id="footer-ad" />
    </div>
  );
}
