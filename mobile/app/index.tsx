import { useRef, useState, useCallback, useEffect } from 'react';
import { View, ActivityIndicator, Text, BackHandler, Platform, StatusBar as RNStatusBar, Image, Animated } from 'react-native';
import { WebView as RNWebView } from 'react-native-webview';
const WebView = RNWebView as any;
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const WEB_APP_URL = 'https://dealbreaksimulator.com';
const AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-2744316013184797/4011058152';
const AD_WEEK_INTERVAL = 6;

const interstitial = InterstitialAd.createForAdRequest(AD_UNIT_ID, {
  requestNonPersonalizedAdsOnly: true,
});

export default function App() {
  const webViewRef = useRef<any>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const lastAdWeek = useRef(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const hasFinishedFirstLoad = useRef(false);

  useEffect(() => {
    const unsubLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoaded(true);
    });
    const unsubClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      interstitial.load();
    });
    interstitial.load();
    return () => {
      unsubLoaded();
      unsubClosed();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });
      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const showAdIfNeeded = useCallback((currentWeek: number) => {
    if (currentWeek > 0 && currentWeek % AD_WEEK_INTERVAL === 0 && currentWeek !== lastAdWeek.current) {
      lastAdWeek.current = currentWeek;
      if (adLoaded) {
        interstitial.show();
      }
    }
  }, [adLoaded]);

  const showGameOverAd = useCallback(() => {
    if (adLoaded) {
      interstitial.show();
    }
  }, [adLoaded]);

  const injectedJS = `
    (function() {
      var style = document.createElement('style');
      style.textContent = [
        '.adsbygoogle, [data-ad-slot], ins.adsbygoogle { display: none !important; }',
        '* { -webkit-touch-callout: none !important; -webkit-user-select: none !important; user-select: none !important; -webkit-tap-highlight-color: transparent !important; }',
        'input, textarea, [contenteditable="true"] { -webkit-user-select: text !important; user-select: text !important; }',
        'body { overscroll-behavior: none !important; -webkit-overflow-scrolling: touch; }',
        '::-webkit-scrollbar { display: none !important; }',
        'body { -webkit-text-size-adjust: 100% !important; }',
        'a { -webkit-touch-callout: none !important; }',
      ].join(' ');
      document.head.appendChild(style);

      var lastWeek = 0;
      var observer = new MutationObserver(function() {
        var weekEl = document.querySelector('[data-testid="status-time"], [data-testid="text-weeks-remaining"], [data-testid="status-week"]');
        if (weekEl) {
          var text = weekEl.textContent || '';
          var match = text.match(/(\\d+)/);
          if (match) {
            var week = parseInt(match[1]);
            if (week !== lastWeek) {
              lastWeek = week;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'week', week: week }));
            }
          }
        }
        var resultEl = document.querySelector('[data-testid="text-game-result"], [data-testid="results-panel"]');
        if (resultEl) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'gameOver' }));
        }
      });
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });

      document.addEventListener('contextmenu', function(e) { e.preventDefault(); }, false);

      true;
    })();
  `;

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'week') {
        showAdIfNeeded(data.week);
      } else if (data.type === 'gameOver') {
        showGameOverAd();
      }
    } catch {}
  }, [showAdIfNeeded, showGameOverAd]);

  const handleLoadEnd = useCallback(() => {
    if (!hasFinishedFirstLoad.current) {
      hasFinishedFirstLoad.current = true;
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setLoading(false);
        });
      }, 300);
    } else {
      setLoading(false);
    }
  }, [fadeAnim]);

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
        <StatusBar style="light" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Connection Error
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            Unable to connect. Please check your internet connection and try again.
          </Text>
          <View
            style={{
              backgroundColor: 'rgba(16,185,129,0.15)',
              borderWidth: 1,
              borderColor: 'rgba(16,185,129,0.3)',
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{ color: '#10b981', fontWeight: '600', fontSize: 16 }}
              onPress={() => {
                setError(false);
                setLoading(true);
                hasFinishedFirstLoad.current = false;
                fadeAnim.setValue(1);
                webViewRef.current?.reload();
              }}
            >
              Try Again
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <StatusBar style="light" translucent />
      <View style={{ height: insets.top, backgroundColor: '#0f172a' }} />
      <WebView
        ref={webViewRef}
        source={{ uri: WEB_APP_URL }}
        style={{ flex: 1, backgroundColor: '#0f172a' }}
        injectedJavaScript={injectedJS}
        onMessage={handleMessage}
        onLoadStart={() => {
          if (!hasFinishedFirstLoad.current) {
            setLoading(true);
          }
        }}
        onLoadEnd={handleLoadEnd}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        onHttpError={(syntheticEvent: any) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 500) {
            setError(true);
          }
        }}
        onNavigationStateChange={(navState: any) => {
          setCanGoBack(navState.canGoBack);
        }}
        allowsBackForwardNavigationGestures={false}
        allowsInlineMediaPlayback={true}
        allowsLinkPreview={false}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        contentMode="mobile"
        pullToRefreshEnabled={false}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        cacheEnabled={true}
        overScrollMode="never"
        decelerationRate="normal"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={true}
        automaticallyAdjustContentInsets={false}
        contentInsetAdjustmentBehavior="never"
        testID="webview-main"
      />
      <View style={{ height: insets.bottom, backgroundColor: '#0f172a' }} />
      {loading && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0f172a',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: fadeAnim,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#ffffff', fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 4 }}>
              DEALBREAK
            </Text>
            <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 40 }}>
              Real Estate Simulator
            </Text>
            <ActivityIndicator size="small" color="#10b981" />
          </View>
        </Animated.View>
      )}
    </View>
  );
}
