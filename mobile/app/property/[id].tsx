import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api, Property, Investigation, GameRun, formatCurrency } from '../../src/lib/api';

type Strategy = 'rent' | 'flip';
type Contractor = 'cheap' | 'fast';

const DILIGENCE_OPTIONS = [
  {
    id: 'market_study',
    name: 'Market Study',
    icon: 'analytics',
    cost: 500,
    weeks: 1,
    reveals: 'True rent potential in this market',
  },
  {
    id: 'appraisal',
    name: 'Comp Analysis',
    icon: 'home',
    cost: 750,
    weeks: 1,
    reveals: 'After Repair Value (ARV) range',
  },
  {
    id: 'inspection',
    name: 'Property Inspection',
    icon: 'construct',
    cost: 400,
    weeks: 1,
    reveals: 'Hidden property issues and repair costs',
  },
];

export default function PropertyDetail() {
  const router = useRouter();
  const { id, gameId } = useLocalSearchParams<{ id: string; gameId: string }>();

  const [strategy, setStrategy] = useState<Strategy>('rent');
  const [contractor, setContractor] = useState<Contractor>('cheap');
  const [property, setProperty] = useState<Property | null>(null);
  const [gameState, setGameState] = useState<GameRun | null>(null);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const gid = parseInt(gameId || '0');
      if (!gid) {
        setError('No active game found.');
        setLoading(false);
        return;
      }
      const [props, game, invs] = await Promise.all([
        api.getProperties(),
        api.getGameRun(gid),
        api.getInvestigations(gid),
      ]);
      const prop = props.find(p => p.id === parseInt(id || '0'));
      if (!prop) {
        setError('Property not found.');
        setLoading(false);
        return;
      }
      setProperty(prop);
      setGameState(game);
      setInvestigations(invs.filter(inv => inv.propertyId === parseInt(id || '0')));
    } catch (err: any) {
      setError(err.message || 'Failed to load property data.');
    } finally {
      setLoading(false);
    }
  };

  const completedTypes = investigations.map(inv => inv.investigationType);

  const handleDiligencePurchase = (optionId: string) => {
    const option = DILIGENCE_OPTIONS.find(o => o.id === optionId);
    if (!option || !gameState || !property) return;

    if (gameState.cash < option.cost) {
      Alert.alert('Insufficient Funds', `You need ${formatCurrency(option.cost)} but only have ${formatCurrency(gameState.cash)}.`);
      return;
    }

    Alert.alert(
      'Confirm Investigation',
      `${option.name}\n\nCost: ${formatCurrency(option.cost)}\nTime: ${option.weeks} week(s)\n\n${option.reveals}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            try {
              await api.createInvestigation({
                gameRunId: gameState.id,
                propertyId: property.id,
                investigationType: option.id,
                cost: option.cost,
                weeksUsed: option.weeks,
              });
              await loadData();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to create investigation.');
            }
          },
        },
      ]
    );
  };

  const openProForma = () => {
    router.push({
      pathname: '/proforma/[id]',
      params: {
        id: id!,
        gameId: gameId!,
        strategy,
        contractor,
        diligence: completedTypes.join(','),
      },
    });
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center p-6">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-white font-bold text-lg mt-4 text-center">{error}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-emerald-500 px-8 py-3 rounded-xl mt-6"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading || !property) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  const hasAppraisal = completedTypes.includes('appraisal');
  const hasMarketStudy = completedTypes.includes('market_study');
  const hasInspection = completedTypes.includes('inspection');

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
            {property.name}
          </Text>
          <Text className="text-gray-400 text-sm" numberOfLines={1}>
            {property.neighborhood}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-400">Asking Price</Text>
              <Text className="text-emerald-400 font-bold text-2xl">
                {formatCurrency(property.price)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg">{property.bedrooms}</Text>
                <Text className="text-gray-500 text-xs">Beds</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg">{property.bathrooms}</Text>
                <Text className="text-gray-500 text-xs">Baths</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg">{property.sizeSqft.toLocaleString()}</Text>
                <Text className="text-gray-500 text-xs">Sqft</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg capitalize">{property.conditionTag}</Text>
                <Text className="text-gray-500 text-xs">Condition</Text>
              </View>
            </View>
          </View>

          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-3">Market Data</Text>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-400">Rent Potential</Text>
              {hasMarketStudy ? (
                <Text className="text-emerald-400 font-medium">
                  {formatCurrency(property.rentMin)} - {formatCurrency(property.rentMax)}/mo
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={14} color="#f59e0b" />
                  <Text className="text-amber-400 ml-1 text-sm">Requires Market Study</Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-400">After Repair Value</Text>
              {hasAppraisal ? (
                <Text className="text-emerald-400 font-medium">
                  {formatCurrency(property.arvMin)} - {formatCurrency(property.arvMax)}
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={14} color="#f59e0b" />
                  <Text className="text-amber-400 ml-1 text-sm">Requires Comp Analysis</Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400">Rehab Estimate</Text>
              {hasInspection ? (
                <Text className="text-red-400 font-medium">
                  {formatCurrency(property.rehabMin)} - {formatCurrency(property.rehabMax)}
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={14} color="#f59e0b" />
                  <Text className="text-amber-400 ml-1 text-sm">Requires Inspection</Text>
                </View>
              )}
            </View>
          </View>

          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-3">Due Diligence</Text>

            {DILIGENCE_OPTIONS.map((option) => {
              const isCompleted = completedTypes.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => !isCompleted && handleDiligencePurchase(option.id)}
                  disabled={isCompleted}
                  className={`flex-row items-center p-3 rounded-xl mb-2 ${
                    isCompleted
                      ? 'bg-emerald-500/20 border border-emerald-500/50'
                      : 'bg-slate-700/50 border border-slate-600'
                  }`}
                  testID={`button-diligence-${option.id}`}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                    isCompleted ? 'bg-emerald-500' : 'bg-slate-600'
                  }`}>
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={20} color="white" />
                    ) : (
                      <Ionicons name={option.icon as any} size={20} color="#9ca3af" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className={`font-medium ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                      {option.name}
                    </Text>
                    <Text className="text-gray-400 text-xs">{option.reveals}</Text>
                  </View>
                  {!isCompleted && (
                    <View className="items-end">
                      <Text className="text-red-400 font-medium text-sm">
                        {formatCurrency(option.cost)}
                      </Text>
                      <Text className="text-amber-400 text-xs">{option.weeks}wk</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-3">Choose Strategy</Text>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setStrategy('rent')}
                className={`flex-1 p-4 rounded-xl mr-2 items-center ${
                  strategy === 'rent'
                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                    : 'bg-slate-700/50 border border-slate-600'
                }`}
                testID="button-strategy-rent"
              >
                <Ionicons
                  name="home"
                  size={24}
                  color={strategy === 'rent' ? '#10b981' : '#9ca3af'}
                />
                <Text className={`font-semibold mt-2 ${
                  strategy === 'rent' ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  Rental
                </Text>
                <Text className="text-gray-500 text-xs text-center mt-1">
                  Cash flow focus
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStrategy('flip')}
                className={`flex-1 p-4 rounded-xl ml-2 items-center ${
                  strategy === 'flip'
                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                    : 'bg-slate-700/50 border border-slate-600'
                }`}
                testID="button-strategy-flip"
              >
                <Ionicons
                  name="trending-up"
                  size={24}
                  color={strategy === 'flip' ? '#10b981' : '#9ca3af'}
                />
                <Text className={`font-semibold mt-2 ${
                  strategy === 'flip' ? 'text-emerald-400' : 'text-gray-400'
                }`}>
                  Flip
                </Text>
                <Text className="text-gray-500 text-xs text-center mt-1">
                  Quick profit
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-3">Contractor Choice</Text>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setContractor('cheap')}
                className={`flex-1 p-4 rounded-xl mr-2 items-center ${
                  contractor === 'cheap'
                    ? 'bg-blue-500/20 border-2 border-blue-400'
                    : 'bg-slate-700/50 border border-slate-600'
                }`}
                testID="button-contractor-cheap"
              >
                <Ionicons
                  name="time"
                  size={24}
                  color={contractor === 'cheap' ? '#60a5fa' : '#9ca3af'}
                />
                <Text className={`font-semibold mt-2 ${
                  contractor === 'cheap' ? 'text-blue-400' : 'text-gray-400'
                }`}>
                  Cheap & Slow
                </Text>
                <Text className="text-amber-400 text-xs mt-1">+2 weeks</Text>
                <Text className="text-emerald-400 text-xs">Standard cost</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setContractor('fast')}
                className={`flex-1 p-4 rounded-xl ml-2 items-center ${
                  contractor === 'fast'
                    ? 'bg-purple-500/20 border-2 border-purple-400'
                    : 'bg-slate-700/50 border border-slate-600'
                }`}
                testID="button-contractor-fast"
              >
                <Ionicons
                  name="flash"
                  size={24}
                  color={contractor === 'fast' ? '#c084fc' : '#9ca3af'}
                />
                <Text className={`font-semibold mt-2 ${
                  contractor === 'fast' ? 'text-purple-400' : 'text-gray-400'
                }`}>
                  Fast & Expensive
                </Text>
                <Text className="text-emerald-400 text-xs mt-1">No time penalty</Text>
                <Text className="text-red-400 text-xs">+50% cost</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-slate-800">
        <TouchableOpacity
          onPress={openProForma}
          className="bg-emerald-500 py-4 rounded-2xl items-center"
          activeOpacity={0.8}
          testID="button-open-proforma"
        >
          <Text className="text-white font-bold text-lg">Build Pro Forma</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="py-3 items-center mt-2"
          testID="button-pass"
        >
          <Text className="text-red-400">Pass on Property</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
