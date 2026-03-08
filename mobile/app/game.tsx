import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, GameRun, Property, Deal, formatCurrency, formatCompactCurrency, MARKET_LABELS } from '../src/lib/api';
import { useInterstitialAd } from '../src/hooks/useAdMob';

type Tab = 'market' | 'portfolio';

function getPropertyTypeConfig(name: string, propertyType: string): { icon: string; label: string; color: string; bgColor: string; borderColor: string } {
  const lowerName = name.toLowerCase();
  const type = lowerName.includes('duplex') ? 'duplex'
    : lowerName.includes('condo') ? 'condo'
    : lowerName.includes('townhouse') || lowerName.includes('town home') ? 'townhouse'
    : lowerName.includes('apartment') || lowerName.includes('unit') ? 'apartment'
    : propertyType || 'house';

  const configs: Record<string, { icon: string; label: string; color: string; bgColor: string; borderColor: string }> = {
    house: { icon: 'home-outline', label: 'House', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' },
    condo: { icon: 'business-outline', label: 'Condo', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)' },
    duplex: { icon: 'grid-outline', label: 'Duplex', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)' },
    townhouse: { icon: 'home-outline', label: 'Townhouse', color: '#ec4899', bgColor: 'rgba(236,72,153,0.15)', borderColor: 'rgba(236,72,153,0.3)' },
    apartment: { icon: 'albums-outline', label: 'Apartment', color: '#06b6d4', bgColor: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.3)' },
  };
  return configs[type] || configs.house;
}

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
  const { showAfterWeekAdvance, showOnGameOver } = useInterstitialAd();

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

      if (result.gameRun?.status === 'won' || result.gameRun?.status === 'lost') {
        showOnGameOver();
        router.push({ pathname: '/results', params: { gameId: gameState.id.toString() } });
      } else {
        showAfterWeekAdvance();
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name={market.icon as any} size={18} color={market.color} />
          <Text style={{ color: market.color, fontSize: 12, fontWeight: '600' }}>{market.label}</Text>
        </View>
      </View>

      <View className="px-3 py-3" style={{ backgroundColor: 'rgba(30,41,59,0.5)' }}>
        <View className="flex-row" style={{ gap: 8 }}>
          <View
            className="flex-1 rounded-xl p-3"
            style={{
              backgroundColor: 'rgba(16,185,129,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(16,185,129,0.25)',
            }}
          >
            <View className="flex-row items-center" style={{ gap: 4, marginBottom: 4 }}>
              <Ionicons name="wallet-outline" size={14} color="#10b981" />
              <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>CASH</Text>
            </View>
            <Text className="font-bold" style={{ color: '#34d399', fontSize: 18 }} testID="text-cash">
              {formatCompactCurrency(gameState.cash)}
            </Text>
          </View>

          <View
            className="flex-1 rounded-xl p-3"
            style={{
              backgroundColor: 'rgba(245,158,11,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(245,158,11,0.25)',
            }}
          >
            <View className="flex-row items-center" style={{ gap: 4, marginBottom: 4 }}>
              <Ionicons name="time-outline" size={14} color="#f59e0b" />
              <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>
                {gameState.weeksRemaining <= 0 ? 'OVERTIME' : 'WEEKS LEFT'}
              </Text>
            </View>
            <Text className="font-bold" style={{ color: '#fbbf24', fontSize: 18 }} testID="text-weeks">
              {gameState.weeksRemaining <= 0 ? 'OT' : gameState.weeksRemaining}
            </Text>
          </View>

          <View
            className="flex-1 rounded-xl p-3"
            style={{
              backgroundColor: 'rgba(59,130,246,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(59,130,246,0.25)',
            }}
          >
            <View className="flex-row items-center" style={{ gap: 4, marginBottom: 4 }}>
              <Ionicons name="flag-outline" size={14} color="#3b82f6" />
              <Text style={{ color: '#6b7280', fontSize: 10, fontWeight: '600', letterSpacing: 0.5 }}>GOAL</Text>
            </View>
            <View className="flex-row items-baseline" style={{ gap: 2 }}>
              <Text className="font-bold" style={{ color: '#34d399', fontSize: 18 }} testID="text-deals">
                {gameState.profitableDeals}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 14 }}>/ {gameState.goalDeals}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className="flex-row border-b border-slate-800" style={{ backgroundColor: 'rgba(15,23,42,0.8)' }}>
        <TouchableOpacity
          onPress={() => setTab('market')}
          className="flex-1 py-3 items-center"
          style={{
            borderBottomWidth: 2,
            borderBottomColor: tab === 'market' ? '#10b981' : 'transparent',
          }}
          testID="tab-market"
        >
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="storefront-outline" size={16} color={tab === 'market' ? '#34d399' : '#6b7280'} />
            <Text style={{ color: tab === 'market' ? '#34d399' : '#6b7280', fontWeight: tab === 'market' ? '600' : '400' }}>
              Market
            </Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: tab === 'market' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)' }}
            >
              <Text style={{ color: tab === 'market' ? '#34d399' : '#6b7280', fontSize: 11, fontWeight: '600' }}>
                {properties.length}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setTab('portfolio')}
          className="flex-1 py-3 items-center"
          style={{
            borderBottomWidth: 2,
            borderBottomColor: tab === 'portfolio' ? '#10b981' : 'transparent',
          }}
          testID="tab-portfolio"
        >
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Ionicons name="briefcase-outline" size={16} color={tab === 'portfolio' ? '#34d399' : '#6b7280'} />
            <Text style={{ color: tab === 'portfolio' ? '#34d399' : '#6b7280', fontWeight: tab === 'portfolio' ? '600' : '400' }}>
              My Deals
            </Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: tab === 'portfolio' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)' }}
            >
              <Text style={{ color: tab === 'portfolio' ? '#34d399' : '#6b7280', fontSize: 11, fontWeight: '600' }}>
                {activeDeals.length}
              </Text>
            </View>
          </View>
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
              <Text className="text-gray-400 mt-4 font-semibold">No deals yet</Text>
              <Text className="text-gray-500 text-sm mt-1">Browse the market to find your first property</Text>
            </View>
          }
        />
      )}

      <View className="px-4 pb-4 pt-2 border-t border-slate-800">
        {isGameOver ? (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/results', params: { gameId: gameState.id.toString() } })}
            testID="button-view-results"
          >
            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center' }}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Ionicons name="trophy" size={20} color="white" />
                <Text className="text-white font-bold text-lg">View Results</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleAdvanceWeek}
            disabled={advancing}
            activeOpacity={0.8}
            testID="button-advance-week"
          >
            <LinearGradient
              colors={advancing ? ['#475569', '#334155'] : ['#3b82f6', '#2563eb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                borderRadius: 16,
                alignItems: 'center',
                shadowColor: advancing ? 'transparent' : '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: advancing ? 0 : 8,
              }}
            >
              <View className="flex-row items-center" style={{ gap: 8 }}>
                {advancing ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="play-forward" size={20} color="white" />
                    <Text className="text-white font-bold text-lg">Advance Week</Text>
                  </>
                )}
              </View>
            </LinearGradient>
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
  const typeConfig = getPropertyTypeConfig(property.name, property.propertyType);
  const conditionColors: Record<string, { color: string; bg: string }> = {
    excellent: { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
    good: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
    fair: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    poor: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    'needs work': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  };
  const condStyle = conditionColors[property.conditionTag?.toLowerCase()] || conditionColors.fair;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      testID={`card-property-${property.id}`}
      style={{
        backgroundColor: 'rgba(30,41,59,0.9)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(51,65,85,0.8)',
        overflow: 'hidden',
      }}
    >
      <View className="p-4">
        <View className="flex-row justify-between items-start" style={{ marginBottom: 8 }}>
          <View className="flex-1" style={{ marginRight: 8 }}>
            <Text className="text-white font-bold text-base" numberOfLines={1}>
              {property.name}
            </Text>
            <View className="flex-row items-center" style={{ gap: 4, marginTop: 2 }}>
              <Ionicons name="location-outline" size={12} color="#9ca3af" />
              <Text style={{ color: '#9ca3af', fontSize: 13 }} numberOfLines={1}>
                {property.neighborhood}
              </Text>
            </View>
          </View>
          <View
            className="rounded-lg px-3 py-1.5"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
          >
            <Text className="font-bold" style={{ color: '#ffffff', fontSize: 15 }}>
              {formatCurrency(property.price)}
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap" style={{ gap: 6, marginTop: 4 }}>
          <View
            className="flex-row items-center rounded px-2 py-1"
            style={{ backgroundColor: typeConfig.bgColor, borderWidth: 1, borderColor: typeConfig.borderColor }}
          >
            <Ionicons name={typeConfig.icon as any} size={11} color={typeConfig.color} />
            <Text style={{ color: typeConfig.color, fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
              {typeConfig.label}
            </Text>
          </View>

          {property.locationType === 'urban' ? (
            <View
              className="flex-row items-center rounded px-2 py-1"
              style={{ backgroundColor: 'rgba(59,130,246,0.15)', borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)' }}
            >
              <Ionicons name="business-outline" size={11} color="#60a5fa" />
              <Text style={{ color: '#60a5fa', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>Urban</Text>
            </View>
          ) : (
            <View
              className="flex-row items-center rounded px-2 py-1"
              style={{ backgroundColor: 'rgba(16,185,129,0.15)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)' }}
            >
              <Ionicons name="leaf-outline" size={11} color="#34d399" />
              <Text style={{ color: '#34d399', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>Suburban</Text>
            </View>
          )}

          <View
            className="flex-row items-center rounded px-2 py-1"
            style={{ backgroundColor: 'rgba(107,114,128,0.15)', borderWidth: 1, borderColor: 'rgba(107,114,128,0.3)' }}
          >
            <Ionicons name="resize-outline" size={11} color="#9ca3af" />
            <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '600', marginLeft: 4 }}>
              {property.sizeSqft.toLocaleString()} sqft
            </Text>
          </View>

          <View
            className="flex-row items-center rounded px-2 py-1"
            style={{ backgroundColor: condStyle.bg, borderWidth: 1, borderColor: condStyle.color + '40' }}
          >
            <Ionicons name="build-outline" size={11} color={condStyle.color} />
            <Text style={{ color: condStyle.color, fontSize: 11, fontWeight: '600', marginLeft: 4 }} numberOfLines={1}>
              {property.conditionTag}
            </Text>
          </View>
        </View>

        <View
          className="flex-row justify-between items-center mt-3 pt-3"
          style={{ borderTopWidth: 1, borderTopColor: 'rgba(51,65,85,0.6)' }}
        >
          <View>
            <Text style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>Rent Potential</Text>
            <Text style={{ color: '#34d399', fontWeight: '600', fontSize: 14 }}>
              {formatCurrency(property.rentMin)} - {formatCurrency(property.rentMax)}/mo
            </Text>
          </View>
          <View className="flex-row items-center" style={{ gap: 4 }}>
            <Ionicons name="lock-closed-outline" size={12} color="#6b7280" />
            <Text style={{ color: '#6b7280', fontSize: 11 }}>Financials Unknown</Text>
          </View>
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

  const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; label: string; icon: string }> = {
    planned: { color: '#60a5fa', bgColor: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)', label: 'Purchased', icon: 'checkmark-circle-outline' },
    in_rehab: { color: '#fbbf24', bgColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', label: 'In Rehab', icon: 'hammer-outline' },
    ready_to_list: { color: '#a78bfa', bgColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.4)', label: 'Ready to List', icon: 'pricetag-outline' },
    leasing: { color: '#818cf8', bgColor: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.4)', label: 'Leasing', icon: 'key-outline' },
    active_rental: { color: '#34d399', bgColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.4)', label: 'Active Rental', icon: 'home-outline' },
    listing: { color: '#fb923c', bgColor: 'rgba(249,115,22,0.15)', borderColor: 'rgba(249,115,22,0.4)', label: 'Listed for Sale', icon: 'megaphone-outline' },
    completed: { color: '#4ade80', bgColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', label: 'Completed', icon: 'checkmark-done-outline' },
    sold_rental: { color: '#9ca3af', bgColor: 'rgba(107,114,128,0.15)', borderColor: 'rgba(107,114,128,0.4)', label: 'Sold', icon: 'checkmark-done-outline' },
  };

  const config = statusConfig[deal.status] || statusConfig.planned;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      testID={`card-deal-${deal.id}`}
      style={{
        backgroundColor: 'rgba(30,41,59,0.9)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(51,65,85,0.8)',
        overflow: 'hidden',
      }}
    >
      <View className="p-4">
        <View className="flex-row justify-between items-start" style={{ marginBottom: 8 }}>
          <View className="flex-1" style={{ marginRight: 8 }}>
            <Text className="text-white font-bold text-base" numberOfLines={1}>
              {property?.name || `Property #${deal.propertyId}`}
            </Text>
            <View className="flex-row items-center" style={{ gap: 4, marginTop: 2 }}>
              <Ionicons
                name={deal.strategy === 'flip' ? 'swap-horizontal-outline' : 'key-outline'}
                size={12}
                color="#9ca3af"
              />
              <Text style={{ color: '#9ca3af', fontSize: 13, textTransform: 'capitalize' }}>
                {deal.strategy} Strategy
              </Text>
            </View>
          </View>
          <View
            className="flex-row items-center rounded-lg px-3 py-1.5"
            style={{ backgroundColor: config.bgColor, borderWidth: 1, borderColor: config.borderColor, gap: 4 }}
          >
            <Ionicons name={config.icon as any} size={13} color={config.color} />
            <Text style={{ color: config.color, fontWeight: '600', fontSize: 12 }}>
              {config.label}
            </Text>
          </View>
        </View>

        <View
          className="flex-row justify-between items-center pt-3"
          style={{ borderTopWidth: 1, borderTopColor: 'rgba(51,65,85,0.6)' }}
        >
          {deal.purchasePrice != null && (
            <View>
              <Text style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>Purchase</Text>
              <Text className="text-white font-semibold" style={{ fontSize: 14 }}>{formatCurrency(deal.purchasePrice)}</Text>
            </View>
          )}
          {deal.weeklyIncome != null && deal.weeklyIncome > 0 && (
            <View className="items-end">
              <Text style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>Weekly Income</Text>
              <Text style={{ color: '#34d399', fontWeight: '600', fontSize: 14 }}>{formatCurrency(deal.weeklyIncome)}/wk</Text>
            </View>
          )}
          {deal.weeksUntilCompletion != null && deal.weeksUntilCompletion > 0 && (
            <View className="items-end">
              <Text style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>Rehab Time</Text>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <View style={{ width: 40, height: 4, backgroundColor: 'rgba(245,158,11,0.2)', borderRadius: 2 }}>
                  <View style={{
                    width: `${Math.max(10, Math.min(100, ((deal.weeksSpent || 0) / ((deal.weeksSpent || 0) + deal.weeksUntilCompletion)) * 100))}%` as any,
                    height: 4,
                    backgroundColor: '#fbbf24',
                    borderRadius: 2,
                  }} />
                </View>
                <Text style={{ color: '#fbbf24', fontWeight: '600', fontSize: 14 }}>{deal.weeksUntilCompletion}wk</Text>
              </View>
            </View>
          )}
          {deal.actualProfit != null && (
            <View className="items-end">
              <Text style={{ color: '#6b7280', fontSize: 11, marginBottom: 2 }}>Profit</Text>
              <Text style={{
                color: deal.actualProfit >= 0 ? '#34d399' : '#f87171',
                fontWeight: '600',
                fontSize: 14,
              }}>
                {deal.actualProfit >= 0 ? '+' : ''}{formatCurrency(deal.actualProfit)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
