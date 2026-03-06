import { Platform } from 'react-native';

export const ADMOB_CONFIG = {
  ios: {
    appId: 'ca-app-pub-2744316013184797~5324139821',
    interstitialId: 'ca-app-pub-2744316013184797/4011058152',
  },
  android: {
    appId: 'ca-app-pub-2744316013184797~5324139821',
    interstitialId: 'ca-app-pub-2744316013184797/4011058152',
  },
  testIds: {
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
  },
};

export function getAdUnitId(type: 'interstitial'): string {
  if (__DEV__) {
    return ADMOB_CONFIG.testIds[type];
  }

  const platformConfig = Platform.OS === 'ios' ? ADMOB_CONFIG.ios : ADMOB_CONFIG.android;

  switch (type) {
    case 'interstitial':
      return platformConfig.interstitialId;
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
