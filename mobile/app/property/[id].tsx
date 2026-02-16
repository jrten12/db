import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Property {
  id: number;
  name: string;
  address: string;
  askingPrice: number;
  propertyType: string;
  locationType: string;
  rentMin: number;
  rentMax: number;
  rehabCostMin: number;
  rehabCostMax: number;
  arvMin: number;
  arvMax: number;
  yearBuilt: number;
  sqft: number;
  bedrooms: number;
  bathrooms: number;
}

type Strategy = 'rent' | 'flip';
type Contractor = 'cheap' | 'fast';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://dealbreaksimulator.com';

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
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [strategy, setStrategy] = useState<Strategy>('rent');
  const [contractor, setContractor] = useState<Contractor>('cheap');
  const [completedDiligence, setCompletedDiligence] = useState<string[]>([]);

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ['property', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/properties/${id}`);
      return res.json();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDiligencePurchase = (optionId: string) => {
    const option = DILIGENCE_OPTIONS.find(o => o.id === optionId);
    if (!option) return;

    Alert.alert(
      'Confirm Investigation',
      `${option.name}\n\nCost: ${formatCurrency(option.cost)}\nTime: ${option.weeks} week(s)\n\n${option.reveals}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: () => {
            setCompletedDiligence(prev => [...prev, optionId]);
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
        strategy, 
        contractor,
        diligence: completedDiligence.join(','),
      },
    });
  };

  if (isLoading || !property) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  const hasAppraisal = completedDiligence.includes('appraisal');
  const hasMarketStudy = completedDiligence.includes('market_study');
  const hasInspection = completedDiligence.includes('inspection');

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
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
            {property.address}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {/* Price & Key Stats */}
          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-gray-400">Asking Price</Text>
              <Text className="text-emerald-400 font-bold text-2xl">
                {formatCurrency(property.askingPrice)}
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
                <Text className="text-white font-semibold text-lg">{property.sqft.toLocaleString()}</Text>
                <Text className="text-gray-500 text-xs">Sqft</Text>
              </View>
              <View className="items-center flex-1">
                <Text className="text-white font-semibold text-lg">{property.yearBuilt}</Text>
                <Text className="text-gray-500 text-xs">Built</Text>
              </View>
            </View>
          </View>

          {/* Market Data (locked/unlocked) */}
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
                  <Text className="text-amber-400 ml-1">Requires Market Study</Text>
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
                  <Text className="text-amber-400 ml-1">Requires Comp Analysis</Text>
                </View>
              )}
            </View>

            <View className="flex-row justify-between">
              <Text className="text-gray-400">Rehab Estimate</Text>
              {hasInspection ? (
                <Text className="text-red-400 font-medium">
                  {formatCurrency(property.rehabCostMin)} - {formatCurrency(property.rehabCostMax)}
                </Text>
              ) : (
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed" size={14} color="#f59e0b" />
                  <Text className="text-amber-400 ml-1">Requires Inspection</Text>
                </View>
              )}
            </View>
          </View>

          {/* Due Diligence Options */}
          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-3">Due Diligence</Text>
            
            {DILIGENCE_OPTIONS.map((option) => {
              const isCompleted = completedDiligence.includes(option.id);
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

          {/* Strategy Selection */}
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

          {/* Contractor Selection */}
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
                <Text className="text-amber-400 text-xs mt-1">-2 weeks penalty</Text>
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

      {/* Bottom Action */}
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
