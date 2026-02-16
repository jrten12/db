import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface GameState {
  id: number;
  cash: number;
  weeksRemaining: number;
  profitableDeals: number;
  goalDeals: number;
  status: 'active' | 'won' | 'lost';
}

interface Property {
  id: number;
  name: string;
  address: string;
  askingPrice: number;
  propertyType: string;
  locationType: string;
  rentMin: number;
  rentMax: number;
  yearBuilt: number;
  sqft: number;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://dealbreaksimulator.com';

export default function Game() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const { data: gameState, isLoading: gameLoading } = useQuery<GameState>({
    queryKey: ['gameState'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/game/current`);
      if (!res.ok) {
        const newGame = await fetch(`${API_BASE}/api/game/start`, { method: 'POST' });
        return newGame.json();
      }
      return res.json();
    },
  });

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/properties`);
      return res.json();
    },
    enabled: !!gameState,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (gameLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-gray-400 mt-4">Loading game...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-800">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
          testID="button-back"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white font-bold text-lg">Property Search</Text>
        <View className="w-10" />
      </View>

      {/* Game Stats Bar */}
      <View className="px-4 py-3 bg-slate-800/50 flex-row justify-between border-b border-slate-700">
        <View className="items-center">
          <Text className="text-emerald-400 font-bold text-lg">
            {formatCurrency(gameState?.cash || 50000)}
          </Text>
          <Text className="text-gray-500 text-xs">Cash</Text>
        </View>
        <View className="items-center">
          <Text className="text-amber-400 font-bold text-lg">
            {gameState?.weeksRemaining || 52}
          </Text>
          <Text className="text-gray-500 text-xs">Weeks Left</Text>
        </View>
        <View className="items-center">
          <Text className="text-blue-400 font-bold text-lg">
            {gameState?.profitableDeals || 0}/{gameState?.goalDeals || 3}
          </Text>
          <Text className="text-gray-500 text-xs">Deals</Text>
        </View>
      </View>

      {/* Property List */}
      {propertiesLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => (
            <PropertyCard
              property={item}
              onPress={() => router.push(`/property/${item.id}`)}
              formatCurrency={formatCurrency}
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="home-outline" size={48} color="#64748b" />
              <Text className="text-gray-400 mt-4">No properties available</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function PropertyCard({ 
  property, 
  onPress, 
  formatCurrency 
}: { 
  property: Property; 
  onPress: () => void;
  formatCurrency: (n: number) => string;
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
            {property.address}
          </Text>
        </View>
        <View className="bg-emerald-500/20 px-3 py-1 rounded-full ml-2">
          <Text className="text-emerald-400 font-semibold text-sm">
            {formatCurrency(property.askingPrice)}
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
            {property.sqft.toLocaleString()} sqft
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
          <Text className="text-gray-500 text-xs">Built</Text>
          <Text className="text-gray-300">{property.yearBuilt}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
