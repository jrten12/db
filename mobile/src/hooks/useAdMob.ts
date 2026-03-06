import { useState, useEffect, useCallback, useRef } from 'react';
import { getAdUnitId } from '../lib/admob';

let mobileAds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;

try {
  const adsModule = require('react-native-google-mobile-ads');
  mobileAds = adsModule.default;
  InterstitialAd = adsModule.InterstitialAd;
  AdEventType = adsModule.AdEventType;
} catch (e) {
  console.log('AdMob not available');
}

export function useAdMobInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      if (!mobileAds) return;

      try {
        let trackingModule;
        try {
          trackingModule = require('expo-tracking-transparency');
        } catch (e) {}

        if (trackingModule) {
          const { status } = await trackingModule.getTrackingPermissionsAsync();
          if (status === 'undetermined') {
            await trackingModule.requestTrackingPermissionsAsync();
          }
        }

        await mobileAds().initialize();
        setInitialized(true);
      } catch (error) {
        console.error('Failed to initialize AdMob:', error);
      }
    }

    init();
  }, []);

  return initialized;
}

export function useInterstitialAd() {
  const [loaded, setLoaded] = useState(false);
  const adRef = useRef<any>(null);
  const weekCountRef = useRef(0);

  useEffect(() => {
    if (!InterstitialAd) return;

    const ad = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'));

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      setTimeout(() => ad.load(), 1000);
    });

    ad.load();
    adRef.current = ad;

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const showIfReady = useCallback(() => {
    if (adRef.current && loaded) {
      adRef.current.show();
      return true;
    }
    return false;
  }, [loaded]);

  const showAfterWeekAdvance = useCallback(() => {
    weekCountRef.current += 1;
    if (weekCountRef.current % 4 === 0 && loaded && adRef.current) {
      adRef.current.show();
      return true;
    }
    return false;
  }, [loaded]);

  const showOnGameOver = useCallback(() => {
    return showIfReady();
  }, [showIfReady]);

  return { loaded, showIfReady, showAfterWeekAdvance, showOnGameOver };
}
