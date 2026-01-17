import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface MoneyAnimationProps {
  amount: number;
  isPositive: boolean;
  onComplete?: () => void;
}

export function MoneyAnimation({ amount, isPositive, onComplete }: MoneyAnimationProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1500, withTiming(0, { duration: 300 }))
    );
    
    translateY.value = withTiming(-100, {
      duration: 2000,
      easing: Easing.out(Easing.cubic),
    });
    
    scale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 100 })
    );

    const timeout = setTimeout(() => {
      onComplete?.();
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const formatAmount = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000) {
      return `$${(absValue / 1000000).toFixed(1)}M`;
    }
    if (absValue >= 1000) {
      return `$${(absValue / 1000).toFixed(0)}K`;
    }
    return `$${absValue.toFixed(0)}`;
  };

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.badge, animatedStyle]}>
        <Ionicons
          name={isPositive ? 'arrow-up-circle' : 'arrow-down-circle'}
          size={24}
          color={isPositive ? '#10b981' : '#ef4444'}
        />
        <Text style={[styles.amount, { color: isPositive ? '#10b981' : '#ef4444' }]}>
          {isPositive ? '+' : '-'}{formatAmount(amount)}
        </Text>
      </Animated.View>
    </View>
  );
}

interface FloatingDollarsProps {
  count?: number;
  isPositive: boolean;
}

export function FloatingDollars({ count = 5, isPositive }: FloatingDollarsProps) {
  return (
    <View style={styles.dollarsContainer} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <FloatingDollar key={i} index={i} isPositive={isPositive} />
      ))}
    </View>
  );
}

function FloatingDollar({ index, isPositive }: { index: number; isPositive: boolean }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    const delay = index * 100;
    const startX = (Math.random() - 0.5) * SCREEN_WIDTH * 0.5;
    
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 200 }),
      withDelay(1000, withTiming(0, { duration: 500 }))
    ));
    
    translateY.value = withDelay(delay, withTiming(
      isPositive ? -150 - Math.random() * 100 : 150 + Math.random() * 100,
      { duration: 1500, easing: Easing.out(Easing.cubic) }
    ));
    
    translateX.value = startX;
    
    rotate.value = withDelay(delay, withTiming(
      (Math.random() - 0.5) * 60,
      { duration: 1500 }
    ));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.dollar, style]}>
      <Text style={styles.dollarText}>$</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dollarsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
  },
  dollar: {
    position: 'absolute',
  },
  dollarText: {
    fontSize: 32,
    color: '#10b981',
    fontWeight: 'bold',
  },
});
