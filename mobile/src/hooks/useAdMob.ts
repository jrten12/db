import { useState, useEffect, useCallback } from 'react';
import { getAdUnitId } from '../lib/admob';

let mobileAds: any = null;
let InterstitialAd: any = null;
let RewardedAd: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;

try {
  const adsModule = require('react-native-google-mobile-ads');
  mobileAds = adsModule.default;
  InterstitialAd = adsModule.InterstitialAd;
  RewardedAd = adsModule.RewardedAd;
  AdEventType = adsModule.AdEventType;
  RewardedAdEventType = adsModule.RewardedAdEventType;
} catch (e) {
  console.log('AdMob not available - install react-native-google-mobile-ads for production');
}

export function useAdMobInit() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      if (!mobileAds) {
        console.log('AdMob module not available');
        return;
      }

      try {
        let trackingModule;
        try {
          trackingModule = require('expo-tracking-transparency');
        } catch (e) {
          console.log('Tracking transparency not available');
        }

        if (trackingModule) {
          const { status } = await trackingModule.getTrackingPermissionsAsync();
          if (status === 'undetermined') {
            await trackingModule.requestTrackingPermissionsAsync();
          }
        }

        await mobileAds().initialize();
        setInitialized(true);
        console.log('AdMob initialized successfully');
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
  const [interstitial, setInterstitial] = useState<any>(null);

  useEffect(() => {
    if (!InterstitialAd) return;

    const ad = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'));
    
    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      ad.load();
    });

    ad.load();
    setInterstitial(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const show = useCallback(() => {
    if (interstitial && loaded) {
      interstitial.show();
      return true;
    }
    return false;
  }, [interstitial, loaded]);

  return { loaded, show };
}

export function useRewardedAd() {
  const [loaded, setLoaded] = useState(false);
  const [rewarded, setRewarded] = useState<any>(null);

  useEffect(() => {
    if (!RewardedAd) return;

    const ad = RewardedAd.createForAdRequest(getAdUnitId('rewarded'));
    
    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoaded(true);
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      ad.load();
    });

    ad.load();
    setRewarded(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
    };
  }, []);

  const show = useCallback((onReward: (reward: { type: string; amount: number }) => void) => {
    if (!rewarded || !loaded) return false;

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward: { type: string; amount: number }) => {
        onReward(reward);
        unsubscribeEarned();
      }
    );

    rewarded.show();
    return true;
  }, [rewarded, loaded]);

  return { loaded, show };
}
