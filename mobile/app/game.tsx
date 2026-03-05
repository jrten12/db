import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, GameRun, Property, Deal, formatCurrency, formatCompactCurrency, MARKET_LABELS } from '../src/lib/api';

type Tab = 'market' | 'portfolio';

export default function Game() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const [tab, setTab] = useState<Tab>('market');
  const [gameState, setGameState] = useState<GameRun | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const id = parseInt(gameId || '0');
      if (!id) {
        setError('No game found. Please start a new game.');
        setLoading(false);
        return;
      }

      const [game, props, gameDeals] = await Promise.all([
        api.getGameRun(id),
        api.getProperties(),
        api.getDeals(id),
      ]);

      setGameState(game);
      setProperties(props);
      setDeals(gameDeals);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load game data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gameId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAdvanceWeek = async () => {
    if (!gameState || advancing) return;

    if (gameState.status !== 'active') {
      router.push({ pathname: '/results', params: { gameId: gameState.id.toString() } });
      return;
    }

    setAdvancing(true);
    try {
      const result = await api.advanceWeek(gameState.id);
      await loadData();

      if (result.gameRun?.status === 'won') {
        router.push({ pathname: '/results', params: { gameId: gameState.id.toString() } });
      } else if (result.gameRun?.status === 'lost') {
        router.push({ pathname: '/results', params: { gameId: gameState.id.toString() } });
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to advance week.');
    } finally {
      setAdvancing(false);
    }
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center p-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-white font-bold text-lg mt-4">{error}</Text>
        <TouchableOpacity
          onPress={() => router.replace('/')}
          className="bg-emerald-500 px-8 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-semibold">Go Home</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading || !gameState) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-400 mt-4">Loading game...</Text>
      </SafeAreaView>
    );
  }

  const market = MARKET_LABELS[gameState.marketCondition] || MARKET_LABELS.neutral;
  const activeDeals = deals.filter(d => d.status !== 'completed' && d.status !== 'sold_rental');
  const isGameOver = gameState.status !== 'active';

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2"
          testID="button-back"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">
          {gameState.playerName}'s Portfolio
        </Text>
        <View className="w-10" />
      </View>

      <View className="px-4 py-3 bg-slate-800/50 flex-row justify-between border-b border-slate-700">
        <View className="items-center">
          <Text className="text-emerald-400 font-bold text-lg" testID="text-cash">
            {formatCompactCurrency(gameState.cash)}
          </Text>
          <Text className="text-gray-500 text-xs">Cash</Text>
        </View>
        <View className="items-center">
          <Text className="text-amber-400 font-bold text-lg" testID="text-weeks">
            {gameState.weeksRemaining}
          </Text>
          <Text className="text-gray-500 text-xs">Weeks Left</Text>
        </View>
        <View className="items-center">
          <Text className="text-blue-400 font-bold text-lg" testID="text-deals">
            {gameState.profitableDeals}/{gameState.goalDeals}
          </Text>
          <Text className="text-gray-500 text-xs">Deals</Text>
        </View>
        <View className="items-center">
          <Ionicons name={market.icon as any} size={20} color={market.color} />
          <Text className="text-gray-500 text-xs">Market</Text>
        </View>
      </View>

      <View className="flex-row border-b border-slate-800">
        <TouchableOpacity
          onPress={() => setTab('market')}
          className={`flex-1 py-3 items-center border-b-2 ${
            tab === 'market' ? 'border-emerald-500' : 'border-transparent'
          }`}
          testID="tab-market"
        >
          <Text className={tab === 'market' ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
            Market ({properties.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('portfolio')}
          className={`flex-1 py-3 items-center border-b-2 ${
            tab === 'portfolio' ? 'border-emerald-500' : 'border-transparent'
          }`}
          testID="tab-portfolio"
        >
          <Text className={tab === 'portfolio' ? 'text-emerald-400 font-semibold' : 'text-gray-500'}>
            My Deals ({activeDeals.length})
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'market' ? (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#10b981" />
          }
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push({
                pathname: '/property/[id]',
                params: { id: item.id.toString(), gameId: gameState.id.toString() },
              })}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="home-outline" size={48} color="#64748b" />
              <Text className="text-gray-400 mt-4">No properties available</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#10b981" />
          }
          renderItem={({ item }) => (
            <DealCard
              deal={item}
              properties={properties}
              onPress={() => router.push({
                pathname: '/deal/[id]',
                params: { id: item.id.toString(), gameId: gameState.id.toString() },
              })}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="briefcase-outline" size={48} color="#64748b" />
              <Text className="text-gray-400 mt-4">No deals yet</Text>
              <Text className="text-gray-500 text-sm mt-1">Browse the market to find your first property</Text>
            </View>
          }
        />
      )}

      <View className="p-4 border-t border-slate-800">
        {isGameOver ? (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/results', params: { gameId: gameState.id.toString() } })}
            className="bg-blue-500 py-4 rounded-2xl items-center"
            testID="button-view-results"
          >
            <Text className="text-white font-bold text-lg">View Results</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleAdvanceWeek}
            disabled={advancing}
            className={`py-4 rounded-2xl items-center ${advancing ? 'bg-slate-700' : 'bg-amber-500'}`}
            activeOpacity={0.8}
            testID="button-advance-week"
          >
            <View className="flex-row items-center">
              {advancing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="play-forward" size={20} color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Advance Week
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function PropertyCard({
  property,
  onPress,
}: {
  property: Property;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-slate-800 rounded-2xl p-4 border border-slate-700"
      activeOpacity={0.7}
      testID={`card-property-${property.id}`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base" numberOfLines={1}>
            {property.name}
          </Text>
          <Text className="text-gray-400 text-sm" numberOfLines={1}>
            {property.neighborhood}
          </Text>
        </View>
        <View className="bg-emerald-500/20 px-3 py-1 rounded-full ml-2">
          <Text className="text-emerald-400 font-semibold text-sm">
            {formatCurrency(property.price)}
          </Text>
        </View>
      </View>

      <View className="flex-row mt-3">
        <View className="flex-row items-center mr-4">
          <Ionicons name="business-outline" size={14} color="#9ca3af" />
          <Text className="text-gray-400 text-xs ml-1 capitalize">
            {property.propertyType}
          </Text>
        </View>
        <View className="flex-row items-center mr-4">
          <Ionicons name="location-outline" size={14} color="#9ca3af" />
          <Text className="text-gray-400 text-xs ml-1 capitalize">
            {property.locationType}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="resize-outline" size={14} color="#9ca3af" />
          <Text className="text-gray-400 text-xs ml-1">
            {property.sizeSqft.toLocaleString()} sqft
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mt-3 pt-3 border-t border-slate-700">
        <View>
          <Text className="text-gray-500 text-xs">Rent Potential</Text>
          <Text className="text-emerald-400 font-medium">
            {formatCurrency(property.rentMin)} - {formatCurrency(property.rentMax)}/mo
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-gray-500 text-xs">Condition</Text>
          <Text className="text-gray-300 capitalize">{property.conditionTag}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function DealCard({
  deal,
  properties,
  onPress,
}: {
  deal: Deal;
  properties: Property[];
  onPress: () => void;
}) {
  const property = properties.find(p => p.id === deal.propertyId);
  const statusColors: Record<string, string> = {
    planned: '#3b82f6',
    in_rehab: '#f59e0b',
    ready_to_list: '#8b5cf6',
    leasing: '#6366f1',
    active_rental: '#10b981',
    listing: '#f97316',
    completed: '#22c55e',
    sold_rental: '#6b7280',
  };

  const statusLabels: Record<string, string> = {
    planned: 'Purchased',
    in_rehab: 'In Rehab',
    ready_to_list: 'Ready to List',
    leasing: 'Leasing',
    active_rental: 'Active Rental',
    listing: 'Listed for Sale',
    completed: 'Completed',
    sold_rental: 'Sold',
  };

  const color = statusColors[deal.status] || '#6b7280';
  const label = statusLabels[deal.status] || deal.status;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-slate-800 rounded-2xl p-4 border border-slate-700"
      activeOpacity={0.7}
      testID={`card-deal-${deal.id}`}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base" numberOfLines={1}>
            {property?.name || `Property #${deal.propertyId}`}
          </Text>
          <Text className="text-gray-400 text-sm capitalize">
            {deal.strategy} Strategy
          </Text>
        </View>
        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Text style={{ color }} className="font-semibold text-sm">
            {label}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-700">
        {deal.purchasePrice && (
          <View>
            <Text className="text-gray-500 text-xs">Purchase</Text>
            <Text className="text-white font-medium">{formatCurrency(deal.purchasePrice)}</Text>
          </View>
        )}
        {deal.weeklyIncome && (
          <View className="items-end">
            <Text className="text-gray-500 text-xs">Weekly Income</Text>
            <Text className="text-emerald-400 font-medium">{formatCurrency(deal.weeklyIncome)}/wk</Text>
          </View>
        )}
        {deal.weeksUntilCompletion !== null && deal.weeksUntilCompletion > 0 && (
          <View className="items-end">
            <Text className="text-gray-500 text-xs">Rehab Time</Text>
            <Text className="text-amber-400 font-medium">{deal.weeksUntilCompletion} wks left</Text>
          </View>
        )}
        {deal.actualProfit !== null && (
          <View className="items-end">
            <Text className="text-gray-500 text-xs">Profit</Text>
            <Text className={`font-medium ${deal.actualProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(deal.actualProfit)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
