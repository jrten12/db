import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, Deal, Property, GameRun, formatCurrency } from '../../src/lib/api';

export default function DealDetail() {
  const router = useRouter();
  const { id, gameId } = useLocalSearchParams<{ id: string; gameId: string }>();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [gameState, setGameState] = useState<GameRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const gid = parseInt(gameId || '0');
      const [deals, props, game] = await Promise.all([
        api.getDeals(gid),
        api.getProperties(),
        api.getGameRun(gid),
      ]);
      const targetDeal = deals.find(d => d.id === parseInt(id || '0'));
      const targetProp = targetDeal ? props.find(p => p.id === targetDeal.propertyId) : null;
      setDeal(targetDeal || null);
      setProperty(targetProp || null);
      setGameState(game);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRehab = () => {
    if (!deal || !gameState) return;
    Alert.alert(
      'Start Rehab',
      'Begin the renovation on this property? This will take several weeks.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: async () => {
            setActionLoading(true);
            try {
              const rehabWeeks = property?.timelineMin || 4;
              await api.startRehab(deal.id, { gameRunId: gameState.id, rehabWeeks });
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to start rehab.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleActivateRental = () => {
    if (!deal || !gameState) return;
    Alert.alert(
      'Activate Rental',
      'Start renting this property? You will begin collecting weekly income.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.activateRental(deal.id, { gameRunId: gameState.id });
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to activate rental.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSellRental = () => {
    if (!deal || !gameState) return;
    Alert.alert(
      'Sell Rental Property',
      'Are you sure you want to sell this rental property? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sell',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await api.sellRental(deal.id, { gameRunId: gameState.id });
              Alert.alert(
                'Property Sold!',
                `Sale price: ${formatCurrency(result.deal?.salePrice || 0)}\nProfit: ${formatCurrency(result.deal?.actualProfit || 0)}`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to sell property.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteFlip = () => {
    if (!deal || !gameState) return;
    Alert.alert(
      'Complete Flip',
      'List this property for sale?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            setActionLoading(true);
            try {
              const result = await api.completeFlip(deal.id, { gameRunId: gameState.id });
              Alert.alert(
                'Flip Complete!',
                `Sale price: ${formatCurrency(result.deal?.salePrice || 0)}\nProfit: ${formatCurrency(result.deal?.actualProfit || 0)}`,
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to complete flip.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading || !deal) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

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
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="px-4 py-3 flex-row items-center border-b border-slate-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2"
          testID="button-back"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View className="flex-1 ml-2">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>
            {property?.name || `Deal #${deal.id}`}
          </Text>
          <Text className="text-gray-400 text-sm capitalize">{deal.strategy} Strategy</Text>
        </View>
        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Text style={{ color }} className="font-semibold text-sm">{label}</Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-3">Deal Summary</Text>

            <View className="space-y-2">
              {deal.purchasePrice && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-400">Purchase Price</Text>
                  <Text className="text-white font-medium">{formatCurrency(deal.purchasePrice)}</Text>
                </View>
              )}
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Strategy</Text>
                <Text className="text-white font-medium capitalize">{deal.strategy}</Text>
              </View>
              {deal.originalLoanAmount && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-400">Loan Amount</Text>
                  <Text className="text-amber-400 font-medium">{formatCurrency(deal.originalLoanAmount)}</Text>
                </View>
              )}
              {deal.loanInterestRate && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-400">Interest Rate</Text>
                  <Text className="text-amber-400 font-medium">{deal.loanInterestRate.toFixed(1)}%</Text>
                </View>
              )}
              {deal.currentLoanBalance && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-400">Current Loan Balance</Text>
                  <Text className="text-red-400 font-medium">{formatCurrency(deal.currentLoanBalance)}</Text>
                </View>
              )}
            </View>
          </View>

          {deal.status === 'in_rehab' && deal.weeksUntilCompletion !== null && (
            <View className="bg-amber-500/10 rounded-2xl p-4 mb-4 border border-amber-500/30">
              <View className="flex-row items-center mb-2">
                <Ionicons name="construct" size={20} color="#f59e0b" />
                <Text className="text-amber-400 font-semibold ml-2">Renovation In Progress</Text>
              </View>
              <Text className="text-gray-300">
                {deal.weeksUntilCompletion} week{deal.weeksUntilCompletion !== 1 ? 's' : ''} remaining
              </Text>
              <View className="bg-slate-700 h-2 rounded-full mt-3 overflow-hidden">
                <View
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: deal.weeksSpent
                      ? `${Math.min(100, (deal.weeksSpent / (deal.weeksSpent + deal.weeksUntilCompletion)) * 100)}%`
                      : '10%',
                  }}
                />
              </View>
            </View>
          )}

          {deal.status === 'active_rental' && deal.weeklyIncome && (
            <View className="bg-emerald-500/10 rounded-2xl p-4 mb-4 border border-emerald-500/30">
              <View className="flex-row items-center mb-2">
                <Ionicons name="cash" size={20} color="#10b981" />
                <Text className="text-emerald-400 font-semibold ml-2">Rental Income</Text>
              </View>
              <Text className="text-white text-2xl font-bold">
                {formatCurrency(deal.weeklyIncome)}/week
              </Text>
              <Text className="text-gray-400 text-sm mt-1">
                {formatCurrency(deal.weeklyIncome * 4)}/month estimated
              </Text>
            </View>
          )}

          {deal.actualProfit !== null && (
            <View className={`rounded-2xl p-4 mb-4 border ${
              deal.actualProfit >= 0
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}>
              <Text className={deal.actualProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} style={{ fontSize: 14, fontWeight: '600' }}>
                {deal.actualProfit >= 0 ? 'Profit' : 'Loss'}
              </Text>
              <Text className={`text-2xl font-bold ${deal.actualProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(Math.abs(deal.actualProfit))}
              </Text>
              {deal.salePrice && (
                <Text className="text-gray-400 text-sm mt-1">
                  Sale price: {formatCurrency(deal.salePrice)}
                </Text>
              )}
            </View>
          )}

          {property && (
            <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
              <Text className="text-gray-300 font-semibold mb-3">Property Info</Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Location</Text>
                <Text className="text-white">{property.neighborhood}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Type</Text>
                <Text className="text-white capitalize">{property.propertyType}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Size</Text>
                <Text className="text-white">{property.sizeSqft.toLocaleString()} sqft</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400">Beds/Baths</Text>
                <Text className="text-white">{property.bedrooms} bed / {property.bathrooms} bath</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {gameState?.status === 'active' && (
        <View className="p-4 border-t border-slate-800">
          {deal.status === 'planned' && deal.strategy === 'flip' && (
            <TouchableOpacity
              onPress={handleStartRehab}
              disabled={actionLoading}
              className="bg-amber-500 py-4 rounded-2xl items-center"
              testID="button-start-rehab"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Start Rehab</Text>
              )}
            </TouchableOpacity>
          )}

          {deal.status === 'planned' && deal.strategy === 'rental' && (
            <TouchableOpacity
              onPress={handleActivateRental}
              disabled={actionLoading}
              className="bg-emerald-500 py-4 rounded-2xl items-center"
              testID="button-activate-rental"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Activate Rental</Text>
              )}
            </TouchableOpacity>
          )}

          {(deal.status === 'ready_to_list' || deal.status === 'listing') && deal.strategy === 'flip' && (
            <TouchableOpacity
              onPress={handleCompleteFlip}
              disabled={actionLoading}
              className="bg-emerald-500 py-4 rounded-2xl items-center"
              testID="button-complete-flip"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Complete Flip Sale</Text>
              )}
            </TouchableOpacity>
          )}

          {deal.status === 'active_rental' && (
            <TouchableOpacity
              onPress={handleSellRental}
              disabled={actionLoading}
              className="bg-red-500/80 py-4 rounded-2xl items-center"
              testID="button-sell-rental"
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">Sell Property</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
