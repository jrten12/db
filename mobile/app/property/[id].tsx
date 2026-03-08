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
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.3)',
  },
  {
    id: 'appraisal',
    name: 'Comp Analysis',
    icon: 'home',
    cost: 750,
    weeks: 1,
    reveals: 'After Repair Value (ARV) range',
    color: '#8b5cf6',
    bgColor: 'rgba(139,92,246,0.1)',
    borderColor: 'rgba(139,92,246,0.3)',
  },
  {
    id: 'inspection',
    name: 'Property Inspection',
    icon: 'construct',
    cost: 400,
    weeks: 1,
    reveals: 'Hidden property issues and repair costs',
    color: '#f97316',
    bgColor: 'rgba(249,115,22,0.1)',
    borderColor: 'rgba(249,115,22,0.3)',
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

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return '#10b981';
      case 'good': return '#22c55e';
      case 'fair': return '#f59e0b';
      case 'fixer-upper': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const conditionColor = getConditionColor(property.conditionTag);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="px-4 py-3 flex-row items-center border-b border-slate-700/50">
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
          <View className="flex-row items-center mt-0.5">
            <Ionicons name="location-outline" size={12} color="#9ca3af" />
            <Text className="text-gray-400 text-sm ml-1" numberOfLines={1}>
              {property.neighborhood}
            </Text>
          </View>
        </View>
        <View className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
          <Text className="text-emerald-400 font-bold text-base">
            {formatCurrency(property.price)}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled">
        <View className="p-4">

          <View className="bg-slate-800/60 rounded-xl p-4 mb-4 border border-slate-700/50">
            <View className="flex-row">
              <View className="flex-1 items-center py-2">
                <Ionicons name="bed-outline" size={18} color="#60a5fa" />
                <Text className="text-white font-bold text-lg mt-1">{property.bedrooms}</Text>
                <Text className="text-gray-500 text-xs">Beds</Text>
              </View>
              <View className="w-px bg-slate-700/50" />
              <View className="flex-1 items-center py-2">
                <Ionicons name="water-outline" size={18} color="#60a5fa" />
                <Text className="text-white font-bold text-lg mt-1">{property.bathrooms}</Text>
                <Text className="text-gray-500 text-xs">Baths</Text>
              </View>
              <View className="w-px bg-slate-700/50" />
              <View className="flex-1 items-center py-2">
                <Ionicons name="resize-outline" size={18} color="#60a5fa" />
                <Text className="text-white font-bold text-lg mt-1">{property.sizeSqft.toLocaleString()}</Text>
                <Text className="text-gray-500 text-xs">Sqft</Text>
              </View>
              <View className="w-px bg-slate-700/50" />
              <View className="flex-1 items-center py-2">
                <Ionicons name="construct-outline" size={18} color={conditionColor} />
                <Text
                  className="font-bold text-base mt-1 capitalize"
                  style={{ color: conditionColor }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {property.conditionTag}
                </Text>
                <Text className="text-gray-500 text-xs">Condition</Text>
              </View>
            </View>
          </View>

          <View className="bg-slate-800/60 rounded-xl p-4 mb-4 border border-slate-700/50">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-300 font-semibold text-xs uppercase tracking-wider">Financial Estimates</Text>
              <View className="flex-row items-center">
                <Ionicons name="information-circle-outline" size={14} color="#f59e0b" />
                <Text className="text-amber-400 text-xs ml-1">Ranges narrow with diligence</Text>
              </View>
            </View>

            <View
              className={`flex-row items-center justify-between rounded-lg p-3 mb-2 border ${
                hasMarketStudy
                  ? 'border-amber-500/30'
                  : 'border-slate-700/30'
              }`}
              style={{ backgroundColor: hasMarketStudy ? 'rgba(245,158,11,0.1)' : 'rgba(51,65,85,0.2)' }}
            >
              <Text className={`text-xs font-semibold ${hasMarketStudy ? 'text-amber-400' : 'text-gray-400'}`}>
                Rent Potential
              </Text>
              {hasMarketStudy ? (
                <Text className="text-amber-400 font-mono font-bold text-sm">
                  {formatCurrency(property.rentMin)} - {formatCurrency(property.rentMax)}/mo
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                  <Text className="text-gray-500 text-xs italic ml-1">Not yet investigated</Text>
                </View>
              )}
            </View>

            <View
              className={`flex-row items-center justify-between rounded-lg p-3 mb-2 border ${
                hasAppraisal
                  ? 'border-violet-500/30'
                  : 'border-slate-700/30'
              }`}
              style={{ backgroundColor: hasAppraisal ? 'rgba(139,92,246,0.1)' : 'rgba(51,65,85,0.2)' }}
            >
              <Text className={`text-xs font-semibold ${hasAppraisal ? 'text-violet-400' : 'text-gray-400'}`}>
                After Repair Value
              </Text>
              {hasAppraisal ? (
                <Text className="text-violet-400 font-mono font-bold text-sm">
                  {formatCurrency(property.arvMin)} - {formatCurrency(property.arvMax)}
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                  <Text className="text-gray-500 text-xs italic ml-1">Not yet investigated</Text>
                </View>
              )}
            </View>

            <View
              className={`flex-row items-center justify-between rounded-lg p-3 border ${
                hasInspection
                  ? 'border-emerald-500/30'
                  : 'border-slate-700/30'
              }`}
              style={{ backgroundColor: hasInspection ? 'rgba(16,185,129,0.1)' : 'rgba(51,65,85,0.2)' }}
            >
              <Text className={`text-xs font-semibold ${hasInspection ? 'text-emerald-400' : 'text-gray-400'}`}>
                Rehab Estimate
              </Text>
              {hasInspection ? (
                <Text className="text-emerald-400 font-mono font-bold text-sm">
                  {formatCurrency(property.rehabMin)} - {formatCurrency(property.rehabMax)}
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                  <Text className="text-gray-500 text-xs italic ml-1">Not yet investigated</Text>
                </View>
              )}
            </View>
          </View>

          <View className="bg-slate-800/60 rounded-xl p-4 mb-4 border border-slate-700/50">
            <Text className="text-gray-300 font-semibold text-xs uppercase tracking-wider mb-3">
              Due Diligence
            </Text>

            {DILIGENCE_OPTIONS.map((option) => {
              const isCompleted = completedTypes.includes(option.id);
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => !isCompleted && handleDiligencePurchase(option.id)}
                  disabled={isCompleted}
                  className="mb-2"
                  testID={`button-diligence-${option.id}`}
                >
                  <View
                    className={`flex-row items-center p-3 rounded-xl border ${
                      isCompleted
                        ? 'border-emerald-500/50'
                        : 'border-slate-600/50'
                    }`}
                    style={{
                      backgroundColor: isCompleted
                        ? 'rgba(16,185,129,0.15)'
                        : 'rgba(51,65,85,0.3)',
                    }}
                  >
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{
                        backgroundColor: isCompleted
                          ? '#10b981'
                          : option.bgColor,
                        borderWidth: isCompleted ? 0 : 1,
                        borderColor: isCompleted ? 'transparent' : option.borderColor,
                      }}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={20} color="white" />
                      ) : (
                        <Ionicons name={option.icon as any} size={20} color={option.color} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold text-sm ${isCompleted ? 'text-emerald-400' : 'text-white'}`}>
                        {option.name}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-0.5" numberOfLines={1}>{option.reveals}</Text>
                    </View>
                    {isCompleted ? (
                      <View className="bg-emerald-500/20 rounded-lg px-2 py-1">
                        <Text className="text-emerald-400 text-xs font-semibold">Done</Text>
                      </View>
                    ) : (
                      <View className="items-end ml-2">
                        <Text className="text-red-400 font-mono font-semibold text-sm">
                          -{formatCurrency(option.cost)}
                        </Text>
                        <Text className="text-amber-400 text-xs">-{option.weeks}mo</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <View className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 h-full">
                <Text className="text-gray-300 font-semibold text-xs uppercase tracking-wider mb-3">Strategy</Text>

                <TouchableOpacity
                  onPress={() => setStrategy('rent')}
                  className="mb-2"
                  testID="button-strategy-rent"
                >
                  <View
                    className={`flex-row items-center p-3 rounded-xl ${
                      strategy === 'rent'
                        ? 'border-2 border-emerald-500'
                        : 'border-2 border-transparent'
                    }`}
                    style={{
                      backgroundColor: strategy === 'rent' ? 'rgba(16,185,129,0.15)' : 'rgba(51,65,85,0.3)',
                    }}
                  >
                    <View
                      className="w-6 h-6 rounded-md items-center justify-center mr-2"
                      style={{ backgroundColor: strategy === 'rent' ? '#10b981' : '#475569' }}
                    >
                      {strategy === 'rent' && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-sm">Rental</Text>
                      <Text className="text-gray-400 text-xs">Cash flow</Text>
                    </View>
                    <Ionicons
                      name="home"
                      size={18}
                      color={strategy === 'rent' ? '#10b981' : '#6b7280'}
                    />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStrategy('flip')}
                  testID="button-strategy-flip"
                >
                  <View
                    className={`flex-row items-center p-3 rounded-xl ${
                      strategy === 'flip'
                        ? 'border-2 border-emerald-500'
                        : 'border-2 border-transparent'
                    }`}
                    style={{
                      backgroundColor: strategy === 'flip' ? 'rgba(16,185,129,0.15)' : 'rgba(51,65,85,0.3)',
                    }}
                  >
                    <View
                      className="w-6 h-6 rounded-md items-center justify-center mr-2"
                      style={{ backgroundColor: strategy === 'flip' ? '#10b981' : '#475569' }}
                    >
                      {strategy === 'flip' && (
                        <Ionicons name="checkmark" size={14} color="white" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-sm">Flip</Text>
                      <Text className="text-gray-400 text-xs">Quick profit</Text>
                    </View>
                    <Ionicons
                      name="trending-up"
                      size={18}
                      color={strategy === 'flip' ? '#10b981' : '#6b7280'}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-1 ml-2">
              <View className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 h-full">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="hammer-outline" size={14} color="#9ca3af" />
                  <Text className="text-gray-300 font-semibold text-xs uppercase tracking-wider ml-1">Contractor</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setContractor('cheap')}
                  className="mb-2"
                  testID="button-contractor-cheap"
                >
                  <View
                    className={`items-center p-3 rounded-xl ${
                      contractor === 'cheap'
                        ? 'border-2 border-blue-400'
                        : 'border border-slate-600/50'
                    }`}
                    style={{
                      backgroundColor: contractor === 'cheap' ? 'rgba(96,165,250,0.15)' : 'rgba(51,65,85,0.3)',
                    }}
                  >
                    <Ionicons
                      name="time"
                      size={22}
                      color={contractor === 'cheap' ? '#60a5fa' : '#9ca3af'}
                    />
                    <Text className={`font-semibold text-xs mt-1 ${
                      contractor === 'cheap' ? 'text-blue-300' : 'text-gray-400'
                    }`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Sole Operator
                    </Text>
                    <Text className="text-amber-400 text-xs mt-0.5">+2 months</Text>
                    <Text className="text-emerald-400 text-xs">Lower cost</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setContractor('fast')}
                  testID="button-contractor-fast"
                >
                  <View
                    className={`items-center p-3 rounded-xl ${
                      contractor === 'fast'
                        ? 'border-2 border-purple-400'
                        : 'border border-slate-600/50'
                    }`}
                    style={{
                      backgroundColor: contractor === 'fast' ? 'rgba(192,132,252,0.15)' : 'rgba(51,65,85,0.3)',
                    }}
                  >
                    <Ionicons
                      name="flash"
                      size={22}
                      color={contractor === 'fast' ? '#c084fc' : '#9ca3af'}
                    />
                    <Text className={`font-semibold text-xs mt-1 ${
                      contractor === 'fast' ? 'text-purple-300' : 'text-gray-400'
                    }`} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Full Crew
                    </Text>
                    <Text className="text-emerald-400 text-xs mt-0.5">On schedule</Text>
                    <Text className="text-red-400 text-xs">+25-40% cost</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 mb-4 border border-slate-600/50">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center mr-3">
                <Ionicons name="lock-closed" size={18} color="#9ca3af" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">Deal Outcome Unknown</Text>
                <Text className="text-gray-400 text-xs">Build a pro forma to determine viability</Text>
              </View>
            </View>
            <View className="border-t border-slate-700 pt-3">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-gray-300 text-sm">Diligence completed:</Text>
                <Text className="text-emerald-400 font-semibold text-sm">{completedTypes.length}/3</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="p-4 border-t border-slate-700/50 bg-slate-900">
        <TouchableOpacity
          onPress={openProForma}
          activeOpacity={0.8}
          testID="button-open-proforma"
        >
          <View className="bg-emerald-500 py-4 rounded-xl items-center" style={{ shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}>
            <Text className="text-white font-bold text-base">Build Pro Forma</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-2"
          testID="button-pass"
        >
          <View className="py-3 rounded-xl items-center border border-red-500/30" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
            <Text className="text-red-400 font-semibold text-sm">Pass on Property</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
