import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'Dealbreak',
  slug: 'dealbreak',
  version: '2.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0f172a',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    bundleIdentifier: 'com.dealbreak.simulator',
    supportsTablet: true,
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
      ITSAppUsesNonExemptEncryption: false,
      GADApplicationIdentifier: 'ca-app-pub-2744316013184797~5324139821',
      SKAdNetworkItems: [
        { SKAdNetworkIdentifier: 'cstr6suwn9.skadnetwork' },
      ],
      NSUserTrackingUsageDescription: 'This allows us to show you relevant ads.',
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyTracking: false,
    },
  },
  android: {
    package: 'com.dealbreak.simulator',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0f172a',
    },
  },
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: 'd8482835-c595-4478-a09c-a3a4232b7c73',
    },
  },
  plugins: [
    [
      'react-native-google-mobile-ads',
      {
        iosAppId: 'ca-app-pub-2744316013184797~5324139821',
      },
    ],
    [
      'expo-tracking-transparency',
      {
        userTrackingPermission: 'This allows us to show you relevant ads.',
      },
    ],
  ],
});
