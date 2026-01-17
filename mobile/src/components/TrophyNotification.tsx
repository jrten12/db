import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

export interface Trophy {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface TrophyNotificationProps {
  trophy: Trophy;
  onDismiss: () => void;
  duration?: number;
}

const TIER_COLORS = {
  bronze: { bg: '#92400e', text: '#fbbf24', icon: '#cd7f32' },
  silver: { bg: '#475569', text: '#e2e8f0', icon: '#c0c0c0' },
  gold: { bg: '#854d0e', text: '#fcd34d', icon: '#ffd700' },
  platinum: { bg: '#1e293b', text: '#e2e8f0', icon: '#e5e4e2' },
};

const TIER_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  bronze: 'medal-outline',
  silver: 'medal',
  gold: 'trophy',
  platinum: 'diamond',
};

export function TrophyNotification({
  trophy,
  onDismiss,
  duration = 5000,
}: TrophyNotificationProps) {
  const translateY = useSharedValue(-100);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const shine = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    scale.value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 12 })
    );
    opacity.value = withTiming(1, { duration: 300 });
    
    shine.value = withSequence(
      withDelay(300, withTiming(1, { duration: 500 })),
      withTiming(0, { duration: 500 })
    );

    const timeout = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      });
    }, duration);

    return () => clearTimeout(timeout);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: shine.value * 0.6,
    transform: [{ translateX: (shine.value - 0.5) * 200 }],
  }));

  const colors = TIER_COLORS[trophy.tier];
  const iconName = TIER_ICONS[trophy.tier];

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.card, { backgroundColor: colors.bg }]}>
        <Animated.View style={[styles.shine, shineStyle]} />
        
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={32} color={colors.icon} />
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>
            Trophy Unlocked!
          </Text>
          <Text style={styles.name}>{trophy.name}</Text>
          <Text style={styles.description}>{trophy.description}</Text>
        </View>
        
        <View style={[styles.tierBadge, { borderColor: colors.icon }]}>
          <Text style={[styles.tierText, { color: colors.icon }]}>
            {trophy.tier.toUpperCase()}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 60,
    backgroundColor: 'rgba(255,255,255,0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
