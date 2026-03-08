import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: Array<Record<string, unknown>>;
  }
}

interface AdBannerProps {
  slot?: string;
  format?: 'horizontal' | 'rectangle' | 'auto';
  className?: string;
}

const ADSENSE_PUB_ID = import.meta.env.VITE_ADSENSE_PUB_ID as string | undefined;
const DEFAULT_AD_SLOT = import.meta.env.VITE_ADSENSE_SLOT_ID as string | undefined;

export function AdBanner({ slot, format = 'horizontal', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const pubId = ADSENSE_PUB_ID;
  const adSlot = slot || DEFAULT_AD_SLOT;

  useEffect(() => {
    if (!pubId || pushed.current) return;

    const tryPush = () => {
      if (adRef.current && !pushed.current) {
        pushed.current = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // Ad push failed silently
        }
      }
    };

    if (window.adsbygoogle) {
      tryPush();
    } else {
      const timer = setTimeout(tryPush, 1500);
      return () => clearTimeout(timer);
    }
  }, [pubId, adSlot]);

  if (!pubId) {
    return null;
  }

  const heightClass = format === 'rectangle' ? 'min-h-[250px]' : 'max-h-[90px]';

  const adProps: Record<string, string> = {
    'data-ad-client': pubId,
    'data-ad-format': format === 'auto' ? 'auto' : format === 'rectangle' ? 'rectangle' : 'horizontal',
    'data-full-width-responsive': 'true',
  };

  if (adSlot) {
    adProps['data-ad-slot'] = adSlot;
  }

  return (
    <div 
      className={`w-full flex items-center justify-center ${className}`}
      data-testid="ad-banner"
    >
      <div className={`w-full ${heightClass} overflow-hidden rounded-lg opacity-80`}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', height: '100%' }}
          {...adProps}
        />
      </div>
    </div>
  );
}
