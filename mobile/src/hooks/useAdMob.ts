import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

const INTERSTITIAL_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/1033173712'
  : Platform.OS === 'ios'
    ? 'ca-app-pub-2744316013184797/4011058152'
    : 'ca-app-pub-2744316013184797/4011058152';

let adsInitialized = false;
let adsInitPromise: Promise<void> | null = null;

function initAdsOnce(): Promise<void> {
  if (adsInitialized) return Promise.resolve();
  if (adsInitPromise) return adsInitPromise;

  adsInitPromise = (async () => {
    try {
      const adsModule = require('react-native-google-mobile-ads');
      await adsModule.default().initialize();
      adsInitialized = true;
    } catch (e) {
      console.log('AdMob init failed:', e);
    }
  })();

  return adsInitPromise;
}

export function useInterstitialAd() {
  const [loaded, setLoaded] = useState(false);
  const adRef = useRef<any>(null);
  const weekCountRef = useRef(0);

  useEffect(() => {
    let unsubLoaded: (() => void) | undefined;
    let unsubClosed: (() => void) | undefined;

    (async () => {
      try {
        await initAdsOnce();
        const { InterstitialAd, AdEventType } = require('react-native-google-mobile-ads');
        const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID);

        unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
          setLoaded(true);
        });

        unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
          setLoaded(false);
          setTimeout(() => {
            try { ad.load(); } catch (e) {}
          }, 1000);
        });

        ad.load();
        adRef.current = ad;
      } catch (e) {
        console.log('Interstitial setup failed:', e);
      }
    })();

    return () => {
      try { unsubLoaded?.(); } catch (e) {}
      try { unsubClosed?.(); } catch (e) {}
    };
  }, []);

  const showIfReady = useCallback(() => {
    try {
      if (adRef.current && loaded) {
        adRef.current.show();
        return true;
      }
    } catch (e) {
      console.log('Ad show failed:', e);
    }
    return false;
  }, [loaded]);

  const showAfterWeekAdvance = useCallback(() => {
    weekCountRef.current += 1;
    if (weekCountRef.current % 6 === 0) {
      return showIfReady();
    }
    return false;
  }, [showIfReady]);

  const showOnGameOver = useCallback(() => {
    return showIfReady();
  }, [showIfReady]);

  return { loaded, showIfReady, showAfterWeekAdvance, showOnGameOver };
}
