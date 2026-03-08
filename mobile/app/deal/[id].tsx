import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api, Deal, Property, GameRun, formatCurrency } from '../../src/lib/api';

function StatRow({ label, value, valueColor = '#e2e8f0', icon, iconColor }: {
  label: string;
  value: string;
  valueColor?: string;
  icon?: string;
  iconColor?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon && <Ionicons name={icon as any} size={14} color={iconColor || '#9ca3af'} />}
        <Text style={{ color: '#9ca3af', fontSize: 13 }}>{label}</Text>
      </View>
      <Text style={{ color: valueColor, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  const statusConfig: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
    planned: { color: '#60a5fa', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: 'cart', label: 'Purchased' },
    in_rehab: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: 'construct', label: 'In Rehab' },
    ready_to_list: { color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)', icon: 'checkmark-circle', label: 'Ready to List' },
    leasing: { color: '#818cf8', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', icon: 'key', label: 'Leasing' },
    active_rental: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: 'home', label: 'Active Rental' },
    listing: { color: '#fb923c', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)', icon: 'pricetag', label: 'Listed for Sale' },
    completed: { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', icon: 'checkmark-done', label: 'Completed' },
    sold_rental: { color: '#9ca3af', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', icon: 'flag', label: 'Sold' },
  };

  const status = statusConfig[deal.status] || statusConfig.planned;
  const proFormaOutputs = deal.proFormaOutputs as any;
  const proFormaInputs = deal.proFormaInputs as any;

  const monthlyRent = proFormaOutputs?.monthlyGrossRent || 0;
  const monthlyVacancy = proFormaOutputs?.monthlyVacancyLoss || 0;
  const monthlyOpEx = proFormaOutputs?.monthlyOperatingExpenses || 0;
  const monthlyDebt = proFormaOutputs?.debtServiceMonthly || proFormaOutputs?.monthlyDebtService || 0;
  const monthlyCashFlow = monthlyRent - monthlyVacancy - monthlyOpEx - monthlyDebt;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        gap: 8,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ padding: 6, marginLeft: -6 }}
          testID="button-back"
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 17 }} numberOfLines={1}>
            {property?.name || `Deal #${deal.id}`}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 12, textTransform: 'capitalize', marginTop: 1 }}>
            {deal.strategy} Strategy
          </Text>
        </View>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: status.bg,
          borderWidth: 1,
          borderColor: status.border,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 4,
          gap: 4,
        }}>
          <Ionicons name={status.icon as any} size={12} color={status.color} />
          <Text style={{ color: status.color, fontWeight: '600', fontSize: 12 }}>{status.label}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ padding: 16, gap: 12 }}>

          <View style={{
            backgroundColor: 'rgba(30,41,59,0.8)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: 'rgba(255,255,255,0.06)',
              gap: 6,
            }}>
              <Ionicons name="document-text" size={14} color="#60a5fa" />
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Deal Summary</Text>
            </View>
            <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
              {deal.purchasePrice != null && (
                <StatRow label="Purchase Price" value={formatCurrency(deal.purchasePrice)} valueColor="#e2e8f0" icon="cash-outline" iconColor="#60a5fa" />
              )}
              <StatRow label="Strategy" value={deal.strategy.charAt(0).toUpperCase() + deal.strategy.slice(1)} valueColor="#e2e8f0" icon="git-branch-outline" iconColor="#a78bfa" />
              {deal.originalLoanAmount != null && (
                <StatRow label="Loan Amount" value={formatCurrency(deal.originalLoanAmount)} valueColor="#fbbf24" icon="card-outline" iconColor="#fbbf24" />
              )}
              {deal.loanInterestRate != null && (
                <StatRow label="Interest Rate" value={`${deal.loanInterestRate.toFixed(1)}%`} valueColor="#fbbf24" icon="trending-up" iconColor="#fbbf24" />
              )}
              {deal.currentLoanBalance != null && (
                <StatRow label="Loan Balance" value={formatCurrency(deal.currentLoanBalance)} valueColor="#f87171" icon="alert-circle-outline" iconColor="#f87171" />
              )}
            </View>
          </View>

          {deal.status === 'in_rehab' && deal.weeksUntilCompletion !== null && (() => {
            const totalWeeks = (proFormaInputs?.rehabWeeks || (deal.weeksSpent || 0) + deal.weeksUntilCompletion);
            const weeksSpent = deal.weeksSpent || 0;
            const progress = totalWeeks > 0 ? Math.min(100, (weeksSpent / totalWeeks) * 100) : 10;
            return (
              <View style={{
                backgroundColor: 'rgba(245,158,11,0.08)',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(245,158,11,0.25)',
                overflow: 'hidden',
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(245,158,11,0.15)',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="construct" size={16} color="#fbbf24" />
                    <Text style={{ color: '#fbbf24', fontWeight: '600', fontSize: 14 }}>Renovation In Progress</Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(245,158,11,0.2)',
                    borderRadius: 10,
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                  }}>
                    <Text style={{ color: '#fbbf24', fontSize: 11, fontWeight: '700' }}>
                      {deal.weeksUntilCompletion}mo left
                    </Text>
                  </View>
                </View>
                <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#d1d5db', fontSize: 12 }}>
                      {weeksSpent} of {totalWeeks} months complete
                    </Text>
                    <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: '600' }}>
                      {Math.round(progress)}%
                    </Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(30,41,59,0.8)',
                    height: 8,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                    <LinearGradient
                      colors={['#f59e0b', '#d97706']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                  {proFormaInputs?.contractorType && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>Contractor</Text>
                      <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '500', textTransform: 'capitalize' }}>
                        {proFormaInputs.contractorType}
                      </Text>
                    </View>
                  )}
                  {proFormaInputs?.rehabBudget != null && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>Rehab Budget</Text>
                      <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '500' }}>
                        {formatCurrency(proFormaInputs.rehabBudget)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })()}

          {deal.status === 'active_rental' && (
            <View style={{
              backgroundColor: 'rgba(16,185,129,0.08)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(16,185,129,0.25)',
              overflow: 'hidden',
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(16,185,129,0.15)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="cash" size={16} color="#34d399" />
                  <Text style={{ color: '#34d399', fontWeight: '600', fontSize: 14 }}>Rental Income</Text>
                </View>
                <View style={{
                  backgroundColor: monthlyCashFlow >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}>
                  <Text style={{
                    color: monthlyCashFlow >= 0 ? '#34d399' : '#f87171',
                    fontSize: 11,
                    fontWeight: '700',
                  }}>
                    {monthlyCashFlow >= 0 ? 'Cash Flow +' : 'Cash Flow -'}
                  </Text>
                </View>
              </View>
              <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                {deal.weeklyIncome != null && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'baseline',
                    marginBottom: 12,
                    gap: 4,
                  }}>
                    <Text style={{
                      color: (deal.weeklyIncome || 0) >= 0 ? '#34d399' : '#f87171',
                      fontSize: 28,
                      fontWeight: '800',
                    }}>
                      {(deal.weeklyIncome || 0) >= 0 ? '+' : ''}{formatCurrency(deal.weeklyIncome || 0)}
                    </Text>
                    <Text style={{ color: '#9ca3af', fontSize: 13 }}>/month</Text>
                  </View>
                )}

                <View style={{
                  backgroundColor: 'rgba(30,41,59,0.6)',
                  borderRadius: 8,
                  padding: 10,
                  gap: 6,
                }}>
                  {monthlyRent > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>Monthly Rent</Text>
                      <Text style={{ color: '#4ade80', fontSize: 12, fontWeight: '600' }}>
                        +{formatCurrency(monthlyRent)}
                      </Text>
                    </View>
                  )}
                  {monthlyVacancy > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>Vacancy Loss</Text>
                      <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '600' }}>
                        -{formatCurrency(monthlyVacancy)}
                      </Text>
                    </View>
                  )}
                  {monthlyOpEx > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>Operating Expenses</Text>
                      <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '600' }}>
                        -{formatCurrency(monthlyOpEx)}
                      </Text>
                    </View>
                  )}
                  {monthlyDebt > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ color: '#9ca3af', fontSize: 12 }}>Mortgage Payment</Text>
                      <Text style={{ color: '#f87171', fontSize: 12, fontWeight: '600' }}>
                        -{formatCurrency(monthlyDebt)}
                      </Text>
                    </View>
                  )}
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.08)',
                    paddingTop: 6,
                    marginTop: 2,
                  }}>
                    <Text style={{ color: '#e2e8f0', fontSize: 12, fontWeight: '600' }}>Net Cash Flow</Text>
                    <Text style={{
                      color: monthlyCashFlow >= 0 ? '#4ade80' : '#f87171',
                      fontSize: 12,
                      fontWeight: '700',
                    }}>
                      {monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(Math.round(monthlyCashFlow))}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {deal.actualProfit !== null && (
            <View style={{
              backgroundColor: deal.actualProfit >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: deal.actualProfit >= 0 ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
              overflow: 'hidden',
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: deal.actualProfit >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                gap: 6,
              }}>
                <Ionicons
                  name={deal.actualProfit >= 0 ? 'trending-up' : 'trending-down'}
                  size={16}
                  color={deal.actualProfit >= 0 ? '#34d399' : '#f87171'}
                />
                <Text style={{
                  color: deal.actualProfit >= 0 ? '#34d399' : '#f87171',
                  fontWeight: '600',
                  fontSize: 14,
                }}>
                  {deal.actualProfit >= 0 ? 'Profit' : 'Loss'}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{
                  color: deal.actualProfit >= 0 ? '#34d399' : '#f87171',
                  fontSize: 28,
                  fontWeight: '800',
                }}>
                  {deal.actualProfit >= 0 ? '+' : '-'}{formatCurrency(Math.abs(deal.actualProfit))}
                </Text>
                {deal.salePrice != null && (
                  <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>
                    Sale price: {formatCurrency(deal.salePrice)}
                  </Text>
                )}
              </View>
            </View>
          )}

          {property && (
            <View style={{
              backgroundColor: 'rgba(30,41,59,0.8)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.06)',
                gap: 6,
              }}>
                <Ionicons name="home" size={14} color="#60a5fa" />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Property Info</Text>
              </View>
              <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                <StatRow label="Location" value={property.neighborhood} icon="location-outline" iconColor="#60a5fa" />
                <StatRow label="Type" value={property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)} icon="business-outline" iconColor="#a78bfa" />
                <StatRow label="Size" value={`${property.sizeSqft.toLocaleString()} sqft`} icon="resize-outline" iconColor="#fbbf24" />
                <StatRow label="Beds / Baths" value={`${property.bedrooms} bed / ${property.bathrooms} bath`} icon="bed-outline" iconColor="#34d399" />
              </View>
            </View>
          )}

          {proFormaOutputs && deal.strategy === 'flip' && (
            <View style={{
              backgroundColor: 'rgba(30,41,59,0.8)',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: 'rgba(255,255,255,0.06)',
                gap: 6,
              }}>
                <Ionicons name="analytics" size={14} color="#a78bfa" />
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>Flip Projections</Text>
              </View>
              <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                {proFormaOutputs.arv != null && (
                  <StatRow label="After Repair Value" value={formatCurrency(proFormaOutputs.arv)} valueColor="#60a5fa" icon="trending-up" iconColor="#60a5fa" />
                )}
                {proFormaOutputs.profit != null && (
                  <StatRow
                    label="Projected Profit"
                    value={`${proFormaOutputs.profit >= 0 ? '+' : ''}${formatCurrency(proFormaOutputs.profit)}`}
                    valueColor={proFormaOutputs.profit >= 0 ? '#4ade80' : '#f87171'}
                    icon="bar-chart"
                    iconColor={proFormaOutputs.profit >= 0 ? '#4ade80' : '#f87171'}
                  />
                )}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {gameState?.status === 'active' && (
        <View style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.08)',
          gap: 8,
        }}>
          {deal.status === 'planned' && deal.strategy === 'flip' && (
            <TouchableOpacity
              onPress={handleStartRehab}
              disabled={actionLoading}
              testID="button-start-rehab"
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="construct" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Start Rehab</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {deal.status === 'planned' && deal.strategy === 'rental' && (
            <TouchableOpacity
              onPress={handleActivateRental}
              disabled={actionLoading}
              testID="button-activate-rental"
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="key" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Activate Rental</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {(deal.status === 'ready_to_list' || deal.status === 'listing') && deal.strategy === 'flip' && (
            <TouchableOpacity
              onPress={handleCompleteFlip}
              disabled={actionLoading}
              testID="button-complete-flip"
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  opacity: actionLoading ? 0.6 : 1,
                }}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="white" />
                    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Complete Flip Sale</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {deal.status === 'active_rental' && (
            <TouchableOpacity
              onPress={handleSellRental}
              disabled={actionLoading}
              testID="button-sell-rental"
              activeOpacity={0.85}
            >
              <View style={{
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                backgroundColor: 'rgba(239,68,68,0.15)',
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.3)',
                opacity: actionLoading ? 0.6 : 1,
              }}>
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#f87171" />
                ) : (
                  <>
                    <Ionicons name="pricetag" size={18} color="#f87171" />
                    <Text style={{ color: '#f87171', fontWeight: '700', fontSize: 16 }}>Sell Property</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}
