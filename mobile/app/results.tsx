import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, GameRun, Deal, Property, formatCurrency } from '../src/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getGrade(profitableDeals: number, totalDeals: number, totalProfit: number, weeksUsed: number): { letter: string; color: string; glowColor: string } {
  const profitRatio = totalDeals > 0 ? profitableDeals / totalDeals : 0;
  const efficiency = Math.max(0, (52 - weeksUsed) / 52);
  const score = (profitRatio * 50) + (totalProfit > 0 ? 25 : 0) + (efficiency * 25);

  if (score >= 90) return { letter: 'A+', color: '#10b981', glowColor: 'rgba(16,185,129,0.4)' };
  if (score >= 80) return { letter: 'A', color: '#10b981', glowColor: 'rgba(16,185,129,0.3)' };
  if (score >= 70) return { letter: 'B+', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)' };
  if (score >= 60) return { letter: 'B', color: '#3b82f6', glowColor: 'rgba(59,130,246,0.3)' };
  if (score >= 50) return { letter: 'C+', color: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)' };
  if (score >= 40) return { letter: 'C', color: '#f59e0b', glowColor: 'rgba(245,158,11,0.3)' };
  if (score >= 30) return { letter: 'D', color: '#ef4444', glowColor: 'rgba(239,68,68,0.3)' };
  return { letter: 'F', color: '#ef4444', glowColor: 'rgba(239,68,68,0.3)' };
}

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
  const grade = getGrade(profitableDeals.length, deals.length, totalProfit, weeksUsed);

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-5">
          <View className="items-center mb-6 pt-4">
            <View
              style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                backgroundColor: isWin ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                borderWidth: 2,
                borderColor: isWin ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.4)',
                shadowColor: isWin ? '#f59e0b' : '#ef4444',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <Ionicons
                name={isWin ? 'trophy' : 'close-circle'}
                size={48}
                color={isWin ? '#f59e0b' : '#ef4444'}
              />
            </View>
            <Text
              className="text-3xl font-bold"
              style={{ color: isWin ? '#f59e0b' : '#ef4444' }}
            >
              {isWin ? 'Victory!' : 'Game Over'}
            </Text>
            <Text className="text-gray-400 text-center mt-2 px-4 text-base leading-5">
              {isWin
                ? `Congratulations, ${gameState.playerName}! You achieved your investment goals.`
                : gameState.weeksRemaining <= 0
                  ? `Time's up, ${gameState.playerName}! You ran out of weeks.`
                  : `Good effort, ${gameState.playerName}. Review your performance below.`
              }
            </Text>
          </View>

          <View
            style={{
              alignItems: 'center',
              marginBottom: 24,
              padding: 20,
              borderRadius: 16,
              backgroundColor: 'rgba(15,23,42,0.8)',
              borderWidth: 1,
              borderColor: 'rgba(100,116,139,0.3)',
            }}
          >
            <Text className="text-gray-400 text-sm font-medium mb-2">Performance Grade</Text>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 3,
                borderColor: grade.color,
                backgroundColor: grade.glowColor,
                shadowColor: grade.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: '900',
                  color: grade.color,
                }}
              >
                {grade.letter}
              </Text>
            </View>
          </View>

          <View
            style={{
              backgroundColor: 'rgba(15,23,42,0.8)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              borderWidth: 1,
              borderColor: 'rgba(100,116,139,0.3)',
            }}
          >
            <View className="flex-row items-center gap-2 mb-4 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(100,116,139,0.2)' }}>
              <Ionicons name="stats-chart" size={18} color="#94a3b8" />
              <Text className="text-white font-semibold text-base">Game Summary</Text>
            </View>

            <View style={{ gap: 12 }}>
              <SummaryRow label="Player" value={gameState.playerName} />
              <SummaryRow label="Weeks Used" value={`${weeksUsed} / 52`} />
              <SummaryRow
                label="Final Cash"
                value={formatCurrency(gameState.cash)}
                valueColor="#10b981"
              />
              <SummaryRow
                label="Profitable Deals"
                value={`${gameState.profitableDeals} / ${gameState.goalDeals}`}
                valueColor={gameState.profitableDeals >= gameState.goalDeals ? '#10b981' : '#f59e0b'}
              />
              <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(100,116,139,0.2)', paddingTop: 12 }}>
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300 font-semibold">Total Profit</Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: '700',
                      color: totalProfit >= 0 ? '#10b981' : '#ef4444',
                    }}
                  >
                    {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {deals.length > 0 && (
            <View
              style={{
                backgroundColor: 'rgba(15,23,42,0.8)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: 'rgba(100,116,139,0.3)',
              }}
            >
              <View className="flex-row items-center gap-2 mb-4 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(100,116,139,0.2)' }}>
                <Ionicons name="briefcase" size={18} color="#94a3b8" />
                <Text className="text-white font-semibold text-base">Deal Breakdown</Text>
              </View>

              {deals.map((deal, index) => {
                const prop = properties.find(p => p.id === deal.propertyId);
                const profit = deal.actualProfit || 0;
                const isLast = index === deals.length - 1;
                return (
                  <View
                    key={deal.id}
                    className="flex-row items-center py-3"
                    style={{
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: 'rgba(100,116,139,0.15)',
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: profit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={profit >= 0 ? 'trending-up' : 'trending-down'}
                        size={18}
                        color={profit >= 0 ? '#10b981' : '#ef4444'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium text-sm" numberOfLines={1}>
                        {prop?.name || `Property #${deal.propertyId}`}
                      </Text>
                      <View className="flex-row items-center gap-2 mt-1">
                        <View
                          style={{
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                            backgroundColor: deal.strategy === 'flip' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              fontWeight: '600',
                              color: deal.strategy === 'flip' ? '#f59e0b' : '#3b82f6',
                              textTransform: 'uppercase',
                            }}
                          >
                            {deal.strategy}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {deal.actualProfit !== null ? (
                      <Text
                        style={{
                          fontWeight: '700',
                          fontSize: 14,
                          fontVariant: ['tabular-nums'],
                          color: profit >= 0 ? '#10b981' : '#ef4444',
                        }}
                      >
                        {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                      </Text>
                    ) : (
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: 'rgba(100,116,139,0.2)',
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>In Progress</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          <View
            style={{
              backgroundColor: 'rgba(15,23,42,0.8)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: 'rgba(100,116,139,0.3)',
            }}
          >
            <View className="flex-row items-center gap-2 mb-4 pb-3" style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(100,116,139,0.2)' }}>
              <Ionicons name="bar-chart" size={18} color="#94a3b8" />
              <Text className="text-white font-semibold text-base">Performance</Text>
            </View>
            <View style={{ gap: 16 }}>
              <StatBar
                label="Profitable Deals"
                value={profitableDeals.length}
                max={deals.length || 1}
                color="#10b981"
                bgColor="rgba(16,185,129,0.15)"
                icon="checkmark-circle"
              />
              <StatBar
                label="Unprofitable"
                value={unprofitableDeals.length}
                max={deals.length || 1}
                color="#ef4444"
                bgColor="rgba(239,68,68,0.15)"
                icon="close-circle"
              />
              <StatBar
                label="Time Efficiency"
                value={weeksUsed}
                max={52}
                color="#f59e0b"
                bgColor="rgba(245,158,11,0.15)"
                icon="time"
                invertProgress
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              router.dismissAll();
              router.replace('/');
            }}
            testID="button-play-again"
            activeOpacity={0.8}
            style={{
              marginBottom: 10,
              borderRadius: 14,
              overflow: 'hidden',
              shadowColor: '#10b981',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text className="text-white font-bold text-lg">Play Again</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              router.dismissAll();
              router.replace('/');
            }}
            testID="button-home"
            activeOpacity={0.7}
            style={{
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              marginBottom: 20,
            }}
          >
            <Ionicons name="home-outline" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontWeight: '600', fontSize: 15 }}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className="text-gray-400 text-sm">{label}</Text>
      <Text style={{ color: valueColor || '#fff', fontWeight: '500', fontSize: 14 }}>{value}</Text>
    </View>
  );
}

function StatBar({
  label,
  value,
  max,
  color,
  bgColor,
  icon,
  invertProgress,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  bgColor: string;
  icon: keyof typeof Ionicons.glyphMap;
  invertProgress?: boolean;
}) {
  const rawPct = Math.min(100, (value / max) * 100);
  const displayPct = invertProgress ? Math.max(0, 100 - rawPct) : rawPct;

  return (
    <View>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: bgColor,
            }}
          >
            <Ionicons name={icon} size={14} color={color} />
          </View>
          <Text className="text-gray-300 text-sm font-medium">{label}</Text>
        </View>
        <Text style={{ color, fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'] }}>
          {value}/{max}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: 'rgba(51,65,85,0.5)',
          height: 8,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${displayPct}%`,
            height: '100%',
            borderRadius: 4,
            backgroundColor: color,
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: 4,
          }}
        />
      </View>
    </View>
  );
}
