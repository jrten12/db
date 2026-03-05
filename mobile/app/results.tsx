import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, GameRun, Deal, Property, formatCurrency } from '../src/lib/api';

export default function Results() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();

  const [gameState, setGameState] = useState<GameRun | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const gid = parseInt(gameId || '0');
      const [game, gameDeals, props] = await Promise.all([
        api.getGameRun(gid),
        api.getDeals(gid),
        api.getProperties(),
      ]);
      setGameState(game);
      setDeals(gameDeals);
      setProperties(props);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading || !gameState) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  const isWin = gameState.status === 'won';
  const totalProfit = deals.reduce((sum, d) => sum + (d.actualProfit || 0), 0);
  const profitableDeals = deals.filter(d => (d.actualProfit || 0) > 0);
  const unprofitableDeals = deals.filter(d => d.actualProfit !== null && d.actualProfit <= 0);
  const weeksUsed = 52 - gameState.weeksRemaining;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <View className="items-center mb-8 pt-6">
            <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
              isWin ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              <Ionicons
                name={isWin ? 'trophy' : 'close-circle'}
                size={40}
                color={isWin ? '#10b981' : '#ef4444'}
              />
            </View>
            <Text className={`text-3xl font-bold ${isWin ? 'text-emerald-400' : 'text-red-400'}`}>
              {isWin ? 'You Win!' : 'Game Over'}
            </Text>
            <Text className="text-gray-400 text-center mt-2">
              {isWin
                ? `Congratulations, ${gameState.playerName}! You completed ${gameState.profitableDeals} profitable deals.`
                : gameState.weeksRemaining <= 0
                  ? "Time's up! You ran out of weeks."
                  : `${gameState.playerName}, better luck next time.`
              }
            </Text>
          </View>

          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-4">Game Summary</Text>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Player</Text>
                <Text className="text-white font-medium">{gameState.playerName}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Weeks Used</Text>
                <Text className="text-white font-medium">{weeksUsed} / 52</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Final Cash</Text>
                <Text className="text-emerald-400 font-medium">{formatCurrency(gameState.cash)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Profitable Deals</Text>
                <Text className="text-white font-medium">{gameState.profitableDeals} / {gameState.goalDeals}</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-slate-700">
                <Text className="text-gray-300 font-semibold">Total Profit</Text>
                <Text className={`font-bold text-lg ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(totalProfit)}
                </Text>
              </View>
            </View>
          </View>

          {deals.length > 0 && (
            <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
              <Text className="text-gray-300 font-semibold mb-4">Deal Breakdown</Text>

              {deals.map((deal) => {
                const prop = properties.find(p => p.id === deal.propertyId);
                const profit = deal.actualProfit || 0;
                return (
                  <View key={deal.id} className="flex-row justify-between items-center py-3 border-b border-slate-700/50">
                    <View className="flex-1">
                      <Text className="text-white font-medium" numberOfLines={1}>
                        {prop?.name || `Property #${deal.propertyId}`}
                      </Text>
                      <Text className="text-gray-500 text-sm capitalize">{deal.strategy}</Text>
                    </View>
                    {deal.actualProfit !== null ? (
                      <Text className={`font-semibold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                      </Text>
                    ) : (
                      <Text className="text-gray-500 text-sm">In Progress</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View className="bg-slate-800 rounded-2xl p-4 mb-6 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-3">Performance</Text>
            <View className="space-y-2">
              <StatBar
                label="Profitable Deals"
                value={profitableDeals.length}
                max={deals.length || 1}
                color="#10b981"
              />
              <StatBar
                label="Unprofitable"
                value={unprofitableDeals.length}
                max={deals.length || 1}
                color="#ef4444"
              />
              <StatBar
                label="Time Efficiency"
                value={weeksUsed}
                max={52}
                color="#f59e0b"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              router.dismissAll();
              router.replace('/');
            }}
            className="bg-emerald-500 py-4 rounded-2xl items-center mb-3"
            testID="button-play-again"
          >
            <Text className="text-white font-bold text-lg">Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.dismissAll();
              router.replace('/');
            }}
            className="py-4 rounded-2xl items-center bg-white/5 border border-white/10"
            testID="button-home"
          >
            <Text className="text-white/80 font-semibold">Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-gray-400 text-sm">{label}</Text>
        <Text className="text-gray-300 text-sm">{value}/{max}</Text>
      </View>
      <View className="bg-slate-700 h-2 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
