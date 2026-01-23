import { View, Text, StyleSheet } from 'react-native';
import { getAdUnitId } from '../lib/admob';

let BannerAd: any = null;
let BannerAdSize: any = null;

try {
  const adsModule = require('react-native-google-mobile-ads');
  BannerAd = adsModule.BannerAd;
  BannerAdSize = adsModule.BannerAdSize;
} catch (e) {
  console.log('BannerAd not available');
}

interface BannerAdViewProps {
  size?: 'banner' | 'largeBanner' | 'mediumRectangle' | 'fullBanner' | 'leaderboard' | 'adaptive';
}

export function BannerAdView({ size = 'adaptive' }: BannerAdViewProps) {
  if (!BannerAd) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Ad Space</Text>
      </View>
    );
  }

  const getSizeEnum = () => {
    switch (size) {
      case 'banner':
        return BannerAdSize.BANNER;
      case 'largeBanner':
        return BannerAdSize.LARGE_BANNER;
      case 'mediumRectangle':
        return BannerAdSize.MEDIUM_RECTANGLE;
      case 'fullBanner':
        return BannerAdSize.FULL_BANNER;
      case 'leaderboard':
        return BannerAdSize.LEADERBOARD;
      case 'adaptive':
      default:
        return BannerAdSize.ANCHORED_ADAPTIVE_BANNER;
    }
  };

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getAdUnitId('banner')}
        size={getSizeEnum()}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdLoaded={() => console.log('Banner ad loaded')}
        onAdFailedToLoad={(error: any) => console.log('Banner ad failed:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    height: 50,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginVertical: 8,
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 12,
  },
});
