import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
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
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/* Hero Section */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 bg-emerald-500/20 rounded-2xl items-center justify-center mb-4">
              <Ionicons name="business" size={40} color="#10b981" />
            </View>
            <Text className="text-4xl font-bold text-white text-center mb-2">
              Dealbreak
            </Text>
            <Text className="text-lg text-gray-400 text-center">
              Real Estate Investment Simulator
            </Text>
          </View>

          {/* Game Description */}
          <View className="bg-slate-800/50 rounded-2xl p-5 mb-6 border border-slate-700">
            <Text className="text-white font-semibold text-lg mb-3">
              Learn Real Estate Investing
            </Text>
            <Text className="text-gray-300 leading-6 mb-4">
              Master property analysis through hands-on deal evaluation. 
              Build pro formas, conduct due diligence, and make investment 
              decisions under realistic market conditions.
            </Text>
            
            {/* Game Stats */}
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-emerald-400 font-bold text-xl">$50K</Text>
                <Text className="text-gray-500 text-xs">Starting Cash</Text>
              </View>
              <View className="items-center">
                <Text className="text-amber-400 font-bold text-xl">52</Text>
                <Text className="text-gray-500 text-xs">Weeks</Text>
              </View>
              <View className="items-center">
                <Text className="text-blue-400 font-bold text-xl">3</Text>
                <Text className="text-gray-500 text-xs">Deals to Win</Text>
              </View>
            </View>
          </View>

          {/* Features */}
          <View className="mb-8">
            <Text className="text-gray-300 font-semibold mb-3 px-1">
              What You'll Learn
            </Text>
            
            <View className="space-y-3">
              <FeatureItem 
                icon="calculator" 
                title="Pro Forma Analysis"
                description="Calculate NOI, cap rates, and cash-on-cash returns"
              />
              <FeatureItem 
                icon="search" 
                title="Due Diligence"
                description="Uncover hidden issues before they cost you"
              />
              <FeatureItem 
                icon="trending-up" 
                title="Strategy Selection"
                description="Choose between rental income or fix-and-flip"
              />
              <FeatureItem 
                icon="shield-checkmark" 
                title="Risk Management"
                description="Balance leverage, timeline, and contractor choices"
              />
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            onPress={startGame}
            className="bg-emerald-500 py-4 rounded-2xl items-center shadow-lg"
            activeOpacity={0.8}
            testID="button-start-game"
          >
            <View className="flex-row items-center">
              <Text className="text-white font-bold text-lg mr-2">
                Start New Game
              </Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </View>
          </TouchableOpacity>

          {/* Continue Game (if save exists) */}
          <TouchableOpacity
            className="py-4 items-center mt-3"
            activeOpacity={0.7}
            testID="button-continue-game"
          >
            <Text className="text-gray-400">
              Continue Saved Game
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FeatureItem({ 
  icon, 
  title, 
  description 
}: { 
  icon: string; 
  title: string; 
  description: string;
}) {
  return (
    <View className="flex-row items-start bg-slate-800/30 rounded-xl p-4 border border-slate-700/50">
      <View className="w-10 h-10 bg-slate-700 rounded-xl items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color="#10b981" />
      </View>
      <View className="flex-1">
        <Text className="text-white font-medium mb-1">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </View>
  );
}
