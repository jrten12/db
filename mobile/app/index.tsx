import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function Landing() {
  const router = useRouter();

  const startGame = () => {
    router.push('/game');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0b]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4">
          <View className="flex-row items-center">
            <LinearGradient
              colors={['#10b981', '#059669']}
              className="w-8 h-8 rounded-lg items-center justify-center mr-2"
            >
              <Ionicons name="stats-chart" size={16} color="white" />
            </LinearGradient>
            <Text className="text-white font-semibold text-lg">Dealbreak</Text>
          </View>
        </View>

        <View className="flex-1 px-5 pb-8">
          {/* Stats Pills */}
          <View className="flex-row justify-center gap-2 mb-6">
            <View className="flex-row items-center px-3 py-2 rounded-full bg-white/5 border border-white/10">
              <Ionicons name="cash-outline" size={14} color="#10b981" />
              <Text className="text-white/90 text-sm font-medium ml-1.5">$75K Start</Text>
            </View>
            <View className="flex-row items-center px-3 py-2 rounded-full bg-white/5 border border-white/10">
              <Ionicons name="time-outline" size={14} color="#f59e0b" />
              <Text className="text-white/90 text-sm font-medium ml-1.5">12 Months</Text>
            </View>
            <View className="flex-row items-center px-3 py-2 rounded-full bg-white/5 border border-white/10">
              <Ionicons name="flag-outline" size={14} color="#3b82f6" />
              <Text className="text-white/90 text-sm font-medium ml-1.5">3 Deals</Text>
            </View>
          </View>

          {/* Hero Section */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-white text-center mb-1">
              Master Real Estate
            </Text>
            <Text className="text-3xl font-bold text-emerald-400 text-center mb-4">
              Before You Invest
            </Text>
            <Text className="text-base text-gray-400 text-center leading-6 px-4">
              The numbers don't lie, but they don't tell you everything. Learn to spot deals that work.
            </Text>
          </View>

          {/* Trust Indicators */}
          <View className="flex-row justify-center gap-6 mb-8">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-gray-500 text-sm">No signup</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-gray-500 text-sm">Play instantly</Text>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={startGame}
            activeOpacity={0.9}
            testID="button-start-game"
            className="mb-4"
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              className="py-4 rounded-2xl items-center"
              style={{
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">
                  Start Playing
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Button */}
          <TouchableOpacity
            className="py-4 rounded-2xl items-center bg-white/5 border border-white/10 mb-8"
            activeOpacity={0.7}
            testID="button-continue-game"
          >
            <Text className="text-white/80 font-semibold">
              Continue Saved Game
            </Text>
          </TouchableOpacity>

          {/* Features Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-white text-center mb-2">
              Learn by Doing
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Every decision teaches you something.
            </Text>

            <View className="gap-3">
              <FeatureCard
                icon="search"
                iconColor="#3b82f6"
                title="Due Diligence"
                description="Order inspections and uncover hidden issues"
              />
              <FeatureCard
                icon="stats-chart"
                iconColor="#10b981"
                title="Pro Forma Analysis"
                description="Build financial models with real metrics"
              />
              <FeatureCard
                icon="trending-up"
                iconColor="#a855f7"
                title="Multiple Strategies"
                description="Buy and hold, or flip for quick profits"
              />
              <FeatureCard
                icon="time"
                iconColor="#f59e0b"
                title="Time Pressure"
                description="12 months to prove yourself"
              />
            </View>
          </View>

          {/* How it Works */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-white text-center mb-6">
              How It Works
            </Text>

            <View className="gap-3">
              <StepItem number="1" title="Browse the Market" description="Review properties with incomplete information" />
              <StepItem number="2" title="Do Your Research" description="Spend time and money on inspections" />
              <StepItem number="3" title="Run the Numbers" description="Build a pro forma with your assumptions" />
              <StepItem number="4" title="Execute" description="Buy, renovate, rent or flip" />
            </View>
          </View>

          {/* Disclaimer */}
          <View className="items-center pt-4">
            <Text className="text-gray-600 text-sm text-center">
              A real estate decision simulator.{'\n'}Not financial advice.
            </Text>
            <Text className="text-gray-700 text-xs mt-2 font-mono">
              v1.65
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureCard({
  icon,
  iconColor,
  title,
  description
}: {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-0.5">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </View>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <View className="w-8 h-8 rounded-full bg-emerald-500/15 items-center justify-center mr-3">
        <Text className="text-emerald-400 font-bold text-sm">{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-0.5">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </View>
  );
}
