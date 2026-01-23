import { Platform } from 'react-native';

export const ADMOB_CONFIG = {
  ios: {
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    bannerId: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
    interstitialId: 'ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA',
    rewardedId: 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB',
  },
  android: {
    appId: 'ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY',
    bannerId: 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ',
    interstitialId: 'ca-app-pub-XXXXXXXXXXXXXXXX/AAAAAAAAAA',
    rewardedId: 'ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB',
  },
  testIds: {
    banner: 'ca-app-pub-3940256099942544/6300978111',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
  },
};

export function getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded'): string {
  if (__DEV__) {
    return ADMOB_CONFIG.testIds[type];
  }
  
  const platformConfig = Platform.OS === 'ios' ? ADMOB_CONFIG.ios : ADMOB_CONFIG.android;
  
  switch (type) {
    case 'banner':
      return platformConfig.bannerId;
    case 'interstitial':
      return platformConfig.interstitialId;
    case 'rewarded':
      return platformConfig.rewardedId;
  }
}

export function getAppId(): string {
  if (__DEV__) {
    return Platform.OS === 'ios' 
      ? 'ca-app-pub-3940256099942544~1458002511' 
      : 'ca-app-pub-3940256099942544~3347511713';
  }
  
  return Platform.OS === 'ios' 
    ? ADMOB_CONFIG.ios.appId 
    : ADMOB_CONFIG.android.appId;
}
