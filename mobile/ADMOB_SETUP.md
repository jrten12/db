# Google AdMob Setup Guide for Dealbreak

This guide explains how to configure Google AdMob for the Dealbreak mobile app.

## Prerequisites

1. Create a Google AdMob account at https://admob.google.com/
2. Create an app in AdMob for iOS and Android
3. Create ad units for each ad type you want to use

## Configuration Steps

### 1. Get Your App IDs

In AdMob Console:
- Go to Apps > Add App (or select existing)
- Copy the App ID for each platform (format: `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`)

### 2. Create Ad Units

For each platform, create these ad units:
- **Banner Ad** - for displaying at bottom of screens
- **Interstitial Ad** - for between game phases (e.g., after completing a deal)
- **Rewarded Ad** - for optional bonuses (e.g., watch ad to get extra cash or time)

### 3. Update Configuration

Edit `mobile/app.config.ts` and replace the test IDs:

```typescript
plugins: [
  [
    'react-native-google-mobile-ads',
    {
      androidAppId: 'ca-app-pub-YOUR_ANDROID_APP_ID',
      iosAppId: 'ca-app-pub-YOUR_IOS_APP_ID',
    },
  ],
],
```

Edit `mobile/src/lib/admob.ts` and replace the placeholder IDs:

```typescript
export const ADMOB_CONFIG = {
  ios: {
    appId: 'ca-app-pub-YOUR_IOS_APP_ID',
    bannerId: 'ca-app-pub-YOUR_IOS_BANNER_UNIT',
    interstitialId: 'ca-app-pub-YOUR_IOS_INTERSTITIAL_UNIT',
    rewardedId: 'ca-app-pub-YOUR_IOS_REWARDED_UNIT',
  },
  android: {
    appId: 'ca-app-pub-YOUR_ANDROID_APP_ID',
    bannerId: 'ca-app-pub-YOUR_ANDROID_BANNER_UNIT',
    interstitialId: 'ca-app-pub-YOUR_ANDROID_INTERSTITIAL_UNIT',
    rewardedId: 'ca-app-pub-YOUR_ANDROID_REWARDED_UNIT',
  },
  // Test IDs remain for development
};
```

### 4. Build with EAS

AdMob requires a custom development build (Expo Go won't work):

```bash
cd mobile
npm install
npx expo prebuild
eas build --profile development --platform all
```

## Usage Examples

### Initialize AdMob (in root layout)

```tsx
import { useAdMobInit } from '../src/hooks/useAdMob';

export default function RootLayout() {
  const adMobInitialized = useAdMobInit();
  // ...
}
```

### Show Banner Ad

```tsx
import { BannerAdView } from '../src/components/BannerAdView';

// At bottom of a screen
<BannerAdView size="adaptive" />
```

### Show Interstitial (between game phases)

```tsx
import { useInterstitialAd } from '../src/hooks/useAdMob';

function GameScreen() {
  const { loaded, show } = useInterstitialAd();
  
  const handleDealComplete = () => {
    // Show ad after completing a deal (optional, don't annoy users)
    if (loaded && Math.random() < 0.3) { // 30% chance
      show();
    }
  };
}
```

### Show Rewarded Ad (for in-game bonuses)

```tsx
import { useRewardedAd } from '../src/hooks/useAdMob';

function BonusButton() {
  const { loaded, show } = useRewardedAd();
  
  const handleWatchAd = () => {
    show((reward) => {
      console.log('User earned:', reward.amount, reward.type);
      // Grant bonus: extra cash, extra week, etc.
    });
  };
  
  return (
    <Button 
      disabled={!loaded}
      onPress={handleWatchAd}
    >
      Watch Ad for Bonus
    </Button>
  );
}
```

## Game Integration Ideas

1. **Rewarded Ads**: Watch an ad to:
   - Get $5,000 bonus cash
   - Gain 1 extra week
   - Reveal a due diligence item for free
   - Get a second chance after bankruptcy

2. **Interstitial Ads**: Show between:
   - Major game phases (after closing a deal)
   - Every 3rd property evaluation
   - After game over screen

3. **Banner Ads**: Display at:
   - Bottom of property list
   - Property detail footer
   - Results/postmortem screen

## Important Notes

- Always use test IDs during development to avoid account suspension
- Test on real devices before release
- For EU users, implement GDPR consent (see AdMob UMP SDK)
- Mark "contains ads" in App Store/Play Store listings
