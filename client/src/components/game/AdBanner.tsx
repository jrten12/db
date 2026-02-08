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

let scriptLoaded = false;
let scriptLoading = false;
const pendingCallbacks: Array<() => void> = [];

function loadAdSenseScript(pubId: string, onReady: () => void) {
  if (scriptLoaded) {
    onReady();
    return;
  }

  pendingCallbacks.push(onReady);

  if (scriptLoading) return;
  scriptLoading = true;

  const script = document.createElement('script');
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    const cbs = pendingCallbacks.splice(0);
    cbs.forEach(cb => cb());
  };
  script.onerror = () => {
    scriptLoading = false;
    pendingCallbacks.splice(0);
  };
  document.head.appendChild(script);
}

export function AdBanner({ slot, format = 'horizontal', className = '' }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  const pubId = ADSENSE_PUB_ID;
  const adSlot = slot || DEFAULT_AD_SLOT;

  useEffect(() => {
    if (!pubId || !adSlot || pushed.current) return;

    loadAdSenseScript(pubId, () => {
      if (adRef.current && !pushed.current) {
        pushed.current = true;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // Ad push failed - ad will remain empty but not break the page
        }
      }
    });
  }, [pubId, adSlot]);

  if (!pubId || !adSlot) {
    return null;
  }

  const heightClass = format === 'rectangle' ? 'min-h-[250px]' : 'min-h-[50px] max-h-[90px]';

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
          data-ad-client={pubId}
          data-ad-slot={adSlot}
          data-ad-format={format === 'auto' ? 'auto' : format === 'rectangle' ? 'rectangle' : 'horizontal'}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
