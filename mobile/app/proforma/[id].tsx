import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import RNSlider from '@react-native-community/slider';
import {
  ProFormaInputs,
  defaultProForma,
  isProFormaInputsComplete,
  getMissingFields,
  calculateRentalOutputs,
  getInterestRateFromLTV,
  getLoanFeesFromLTV,
  getDownPaymentFromLTV,
  formatCurrency,
  formatPercent,
  LTV_MIN,
  LTV_MAX,
} from '@/lib/gameLogic';
import { api, Property } from '../../src/lib/api';

export default function ProFormaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    gameId: string;
    strategy: 'rent' | 'flip';
    contractor: 'cheap' | 'fast';
    diligence: string;
  }>();

  const [inputs, setInputs] = useState<ProFormaInputs>({
    ...defaultProForma,
    strategy: params.strategy || 'rent',
    contractorType: params.contractor || 'cheap',
  });

  const [submitting, setSubmitting] = useState(false);

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['properties'],
    queryFn: () => api.getProperties(),
  });

  const property = properties?.find(p => p.id === parseInt(params.id || '0'));
  const completedDiligence = params.diligence?.split(',').filter(Boolean) || [];
  const hasMarketStudy = completedDiligence.includes('market_study');
  const hasContractorWalkthrough = completedDiligence.includes('contractor_walkthrough');

  const updateInput = <K extends keyof ProFormaInputs>(
    field: K,
    value: ProFormaInputs[K]
  ) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const outputs = useMemo(() => {
    if (!property || inputs.strategy !== 'rent') return null;
    return calculateRentalOutputs(inputs, property.price);
  }, [inputs, property]);

  const isComplete = isProFormaInputsComplete(inputs);
  const missingFields = getMissingFields(inputs);

  const handleMakeOffer = () => {
    if (!isComplete || !property) {
      Alert.alert(
        'Incomplete Pro Forma',
        `Please fill in all required fields:\n${missingFields.join(', ')}`
      );
      return;
    }

    const gameRunId = parseInt(params.gameId || '0');
    if (!gameRunId) {
      Alert.alert('Error', 'No active game found.');
      return;
    }

    Alert.alert(
      'Confirm Offer',
      `Make an offer on ${property.name} for ${formatCurrency(property.price)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Offer',
          onPress: async () => {
            setSubmitting(true);
            try {
              const deal = await api.createDeal({
                gameRunId,
                propertyId: property.id,
                strategy: inputs.strategy === 'rent' ? 'rental' : 'flip',
                proFormaInputs: inputs,
                proFormaOutputs: outputs || {},
                purchasePrice: property.price,
              });

              Alert.alert(
                'Offer Accepted!',
                `You now own ${property.name}. Head to your portfolio to manage the deal.`,
                [
                  {
                    text: 'View Portfolio',
                    onPress: () => {
                      router.dismissAll();
                      router.push({ pathname: '/game', params: { gameId: params.gameId! } });
                    },
                  },
                ]
              );
            } catch (err: any) {
              Alert.alert('Offer Failed', err.message || 'Failed to create deal.');
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading || !property) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </SafeAreaView>
    );
  }

  const interestRate = getInterestRateFromLTV(inputs.ltv);
  const loanFees = getLoanFeesFromLTV(inputs.ltv);
  const downPaymentPct = getDownPaymentFromLTV(inputs.ltv);
  const leverageLevel = inputs.ltv > 85 ? 'high' : inputs.ltv > 70 ? 'moderate' : 'low';

  const isRental = inputs.strategy === 'rent';
  const isFlip = inputs.strategy === 'flip';

  const rentGuidance = hasMarketStudy
    ? `${formatCurrency(property.rentMin)}-${formatCurrency(property.rentMax)}`
    : `${formatCurrency(property.rentMin)}-${formatCurrency(property.rentMax)} (guess)`;

  const rehabGuidance = hasContractorWalkthrough
    ? `${formatCurrency(property.rehabMin)}-${formatCurrency(property.rehabMax)}`
    : `${formatCurrency(property.rehabMin)}-${formatCurrency(property.rehabMax)} (guess)`;

  const timelineGuidance = hasContractorWalkthrough
    ? `${property.timelineMin}-${property.timelineMax} months`
    : `${property.timelineMin}-${property.timelineMax} months (guess)`;

  const taxGuidance = `${formatCurrency(Math.round(property.price * 0.01))}-${formatCurrency(Math.round(property.price * 0.02))}`;
  const insuranceGuidance = `${formatCurrency(Math.round(property.price * 0.005))}-${formatCurrency(Math.round(property.price * 0.01))}`;

  const totalRequired = isRental ? 6 : 4;
  const completed = totalRequired - missingFields.length;

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="px-4 py-3 flex-row items-center border-b border-slate-700/50" style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 rounded-full"
          style={{ backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
          testID="button-back"
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View className="flex-1 ml-3">
          <Text className="text-white font-bold text-lg" numberOfLines={1}>{property.name}</Text>
          <Text className="text-gray-400 text-xs">
            {formatCurrency(property.price)} · {property.bedrooms}bd/{property.bathrooms}ba · {property.sizeSqft} sqft
          </Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between px-4 py-2 border-b border-slate-700/30" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
        <View className="flex-row items-center gap-2">
          <View className="flex-row gap-1">
            {Array.from({ length: totalRequired }).map((_, i) => (
              <View
                key={i}
                className="rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: i < completed ? '#10b981' : '#334155',
                }}
              />
            ))}
          </View>
          <Text className="text-gray-400 text-xs">{completed}/{totalRequired} fields</Text>
        </View>
        {isComplete && (
          <View className="flex-row items-center gap-1 bg-emerald-500/15 px-2 py-1 rounded-full">
            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
            <Text className="text-emerald-400 text-xs font-semibold">Ready</Text>
          </View>
        )}
      </View>

      <View className="px-4 py-3 border-b border-slate-700/30" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
        <Text className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Strategy</Text>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => updateInput('strategy', 'rent')}
            className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg"
            style={{
              backgroundColor: isRental ? 'rgba(16, 185, 129, 0.15)' : 'rgba(51, 65, 85, 0.4)',
              borderWidth: 1.5,
              borderColor: isRental ? '#10b981' : '#475569',
            }}
            testID="button-strategy-rent"
          >
            <Ionicons name="home" size={16} color={isRental ? '#10b981' : '#9ca3af'} />
            <Text className={`font-semibold text-sm ${isRental ? 'text-emerald-400' : 'text-gray-400'}`}>Rental</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateInput('strategy', 'flip')}
            className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-lg"
            style={{
              backgroundColor: isFlip ? 'rgba(245, 158, 11, 0.15)' : 'rgba(51, 65, 85, 0.4)',
              borderWidth: 1.5,
              borderColor: isFlip ? '#f59e0b' : '#475569',
            }}
            testID="button-strategy-flip"
          >
            <Ionicons name="trending-up" size={16} color={isFlip ? '#f59e0b' : '#9ca3af'} />
            <Text className={`font-semibold text-sm ${isFlip ? 'text-amber-400' : 'text-gray-400'}`}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-3">

          <SectionCard
            title="Financing"
            subtitle="How much you borrow vs. pay upfront"
            icon="wallet"
            borderColor="#f59e0b"
            gradientFrom="rgba(245, 158, 11, 0.08)"
          >
            <View className="px-4 py-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-300 text-sm font-medium">Loan-to-Value (LTV)</Text>
                <View className="flex-row items-center gap-1">
                  <Text className={`font-bold text-base ${leverageLevel === 'high' ? 'text-red-400' : leverageLevel === 'moderate' ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {inputs.ltv}%
                  </Text>
                </View>
              </View>
              <RNSlider
                value={inputs.ltv}
                onValueChange={(v) => updateInput('ltv', Math.round(v))}
                minimumValue={LTV_MIN}
                maximumValue={LTV_MAX}
                step={5}
                minimumTrackTintColor={leverageLevel === 'high' ? '#ef4444' : leverageLevel === 'moderate' ? '#f59e0b' : '#10b981'}
                maximumTrackTintColor="#334155"
                thumbTintColor={leverageLevel === 'high' ? '#ef4444' : leverageLevel === 'moderate' ? '#f59e0b' : '#10b981'}
              />
              <View className="flex-row justify-between mt-1">
                <Text className="text-gray-600 text-xs">{LTV_MIN}% Conservative</Text>
                <Text className="text-gray-600 text-xs">{LTV_MAX}% Aggressive</Text>
              </View>
            </View>

            <View className="flex-row mx-4 mb-3 rounded-lg overflow-hidden" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
              <View className="flex-1 items-center py-2.5">
                <Text className="text-gray-500 text-xs">Down Payment</Text>
                <Text className="text-white font-bold text-sm">{downPaymentPct}%</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#334155' }} />
              <View className="flex-1 items-center py-2.5">
                <Text className="text-gray-500 text-xs">Interest Rate</Text>
                <Text className={`font-bold text-sm ${inputs.ltv >= 80 ? 'text-amber-400' : 'text-white'}`}>
                  {interestRate.toFixed(1)}%
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#334155' }} />
              <View className="flex-1 items-center py-2.5">
                <Text className="text-gray-500 text-xs">Loan Fees</Text>
                <Text className={`font-bold text-sm ${inputs.ltv >= 80 ? 'text-amber-400' : 'text-white'}`}>
                  {loanFees.toFixed(1)}%
                </Text>
              </View>
            </View>
          </SectionCard>

          <SectionCard
            title="Renovation & Costs"
            subtitle="Your repair budget and contingency"
            icon="construct"
            borderColor="#3b82f6"
            gradientFrom="rgba(59, 130, 246, 0.08)"
          >
            <FieldRow
              label="Rehab Budget"
              guidance={rehabGuidance}
              guidanceColor={hasContractorWalkthrough ? '#10b981' : '#f59e0b'}
              isLocked={!hasContractorWalkthrough}
              lockMessage="Do walkthrough"
            >
              <ProFormaInput
                value={inputs.rehabBudget}
                onChange={(v) => updateInput('rehabBudget', v)}
                placeholder="Enter amount"
                prefix="$"
              />
            </FieldRow>

            <FieldRow
              label="Contingency Buffer"
              guidance="10-20% recommended"
              guidanceColor={(inputs.contingencyPct ?? 10) >= 10 ? '#10b981' : '#f59e0b'}
            >
              <SliderField
                value={inputs.contingencyPct ?? 10}
                onChange={(v) => updateInput('contingencyPct', v)}
                min={0}
                max={30}
                step={1}
                suffix="%"
                color={(inputs.contingencyPct ?? 10) >= 10 ? '#10b981' : '#f59e0b'}
              />
            </FieldRow>

            {isFlip && (
              <>
                <FieldRow
                  label="Rehab Timeline"
                  guidance={timelineGuidance}
                  guidanceColor={hasContractorWalkthrough ? '#10b981' : '#f59e0b'}
                  isLocked={!hasContractorWalkthrough}
                  lockMessage="Do walkthrough"
                >
                  <SliderField
                    value={inputs.rehabWeeks ?? 4}
                    onChange={(v) => updateInput('rehabWeeks', v)}
                    min={1}
                    max={24}
                    step={1}
                    suffix=" mo"
                    color="#3b82f6"
                  />
                </FieldRow>

                <FieldRow
                  label="Selling Costs"
                  guidance="8-10% typical"
                  guidanceColor={(inputs.sellingCostsPct ?? 8) >= 7.5 ? '#10b981' : '#f59e0b'}
                >
                  <SliderField
                    value={inputs.sellingCostsPct ?? 8}
                    onChange={(v) => updateInput('sellingCostsPct', v)}
                    min={6}
                    max={12}
                    step={0.5}
                    suffix="%"
                    color={(inputs.sellingCostsPct ?? 8) >= 7.5 ? '#10b981' : '#f59e0b'}
                  />
                </FieldRow>
              </>
            )}
          </SectionCard>

          {isRental && (
            <SectionCard
              title="Rental Income & Expenses"
              subtitle="Monthly revenue, costs, and cash flow"
              icon="trending-up"
              borderColor="#10b981"
              gradientFrom="rgba(16, 185, 129, 0.08)"
            >
              <FieldRow
                label="Monthly Rent"
                guidance={rentGuidance}
                guidanceColor={hasMarketStudy ? '#10b981' : '#f59e0b'}
                isLocked={!hasMarketStudy}
                lockMessage="Do market study"
              >
                <ProFormaInput
                  value={inputs.expectedRent}
                  onChange={(v) => updateInput('expectedRent', v)}
                  placeholder="Enter rent"
                  prefix="$"
                />
              </FieldRow>

              <FieldRow
                label="Vacancy Rate"
                guidance="5-10% typical"
                guidanceColor={(inputs.vacancyRate ?? 5) >= 5 ? '#10b981' : '#f59e0b'}
              >
                <SliderField
                  value={inputs.vacancyRate ?? 5}
                  onChange={(v) => updateInput('vacancyRate', v)}
                  min={0}
                  max={20}
                  step={0.5}
                  suffix="%"
                  color={(inputs.vacancyRate ?? 5) >= 5 ? '#10b981' : '#f59e0b'}
                />
              </FieldRow>

              <FieldRow
                label="Property Taxes (Annual)"
                guidance={taxGuidance}
                guidanceColor="#10b981"
              >
                <ProFormaInput
                  value={inputs.taxesAnnual}
                  onChange={(v) => updateInput('taxesAnnual', v)}
                  placeholder={formatCurrency(Math.round(property.price * 0.015))}
                  prefix="$"
                />
              </FieldRow>

              <FieldRow
                label="Insurance (Annual)"
                guidance={insuranceGuidance}
                guidanceColor="#10b981"
              >
                <ProFormaInput
                  value={inputs.insuranceAnnual}
                  onChange={(v) => updateInput('insuranceAnnual', v)}
                  placeholder={formatCurrency(Math.round(property.price * 0.007))}
                  prefix="$"
                />
              </FieldRow>

              <FieldRow
                label="Maintenance Reserve"
                guidance="5-10% of rent"
                guidanceColor={(inputs.maintenancePct ?? 5) >= 5 ? '#10b981' : '#f59e0b'}
              >
                <SliderField
                  value={inputs.maintenancePct ?? 5}
                  onChange={(v) => updateInput('maintenancePct', v)}
                  min={0}
                  max={15}
                  step={0.5}
                  suffix="%"
                  color={(inputs.maintenancePct ?? 5) >= 5 ? '#10b981' : '#f59e0b'}
                />
              </FieldRow>

              <FieldRow
                label="CapEx Reserve"
                guidance="8-12% of rent"
                guidanceColor={(inputs.capExPct ?? 8) >= 8 ? '#10b981' : '#f59e0b'}
              >
                <SliderField
                  value={inputs.capExPct ?? 8}
                  onChange={(v) => updateInput('capExPct', v)}
                  min={0}
                  max={20}
                  step={0.5}
                  suffix="%"
                  color={(inputs.capExPct ?? 8) >= 8 ? '#10b981' : '#f59e0b'}
                />
              </FieldRow>

              <View className="px-4 py-3 border-t border-slate-700/30">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-300 text-sm font-medium">Landlord Pays Utilities?</Text>
                  <Text className="text-gray-500 text-xs">Adds ~$150/mo</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => updateInput('utilities', true)}
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: inputs.utilities ? 'rgba(59, 130, 246, 0.15)' : 'rgba(51, 65, 85, 0.4)',
                      borderWidth: 1,
                      borderColor: inputs.utilities ? '#3b82f6' : '#475569',
                    }}
                  >
                    <Text className={`text-sm font-medium ${inputs.utilities ? 'text-blue-400' : 'text-gray-400'}`}>Yes (you pay)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateInput('utilities', false)}
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: !inputs.utilities ? 'rgba(59, 130, 246, 0.15)' : 'rgba(51, 65, 85, 0.4)',
                      borderWidth: 1,
                      borderColor: !inputs.utilities ? '#3b82f6' : '#475569',
                    }}
                  >
                    <Text className={`text-sm font-medium ${!inputs.utilities ? 'text-blue-400' : 'text-gray-400'}`}>Tenant pays</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {inputs.utilities && (
                <FieldRow
                  label="Monthly Utilities"
                  guidance="$100-$200/mo typical"
                  guidanceColor="#10b981"
                >
                  <ProFormaInput
                    value={inputs.utilitiesMonthly}
                    onChange={(v) => updateInput('utilitiesMonthly', v)}
                    placeholder="$150"
                    prefix="$"
                  />
                </FieldRow>
              )}

              <View className="px-4 py-3 border-t border-slate-700/30">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-300 text-sm font-medium">Property Manager?</Text>
                  <Text className="text-gray-500 text-xs">5% of rent</Text>
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => updateInput('propertyManagement', true)}
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: inputs.propertyManagement ? 'rgba(59, 130, 246, 0.15)' : 'rgba(51, 65, 85, 0.4)',
                      borderWidth: 1,
                      borderColor: inputs.propertyManagement ? '#3b82f6' : '#475569',
                    }}
                  >
                    <Text className={`text-sm font-medium ${inputs.propertyManagement ? 'text-blue-400' : 'text-gray-400'}`}>Yes (5% fee)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateInput('propertyManagement', false)}
                    className="flex-1 py-2 rounded-lg items-center"
                    style={{
                      backgroundColor: !inputs.propertyManagement ? 'rgba(59, 130, 246, 0.15)' : 'rgba(51, 65, 85, 0.4)',
                      borderWidth: 1,
                      borderColor: !inputs.propertyManagement ? '#3b82f6' : '#475569',
                    }}
                  >
                    <Text className={`text-sm font-medium ${!inputs.propertyManagement ? 'text-blue-400' : 'text-gray-400'}`}>Self-Manage</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </SectionCard>
          )}

          {isRental && outputs && (
            <View className="mt-1 mb-3 mx-0 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              <View className="px-4 py-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)' }}>
                <View className="flex-row items-center gap-2">
                  <Ionicons name="analytics" size={18} color="#10b981" />
                  <Text className="text-emerald-400 font-bold text-base">Projected Returns</Text>
                </View>
              </View>

              <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.6)' }}>
                <MetricRow label="Monthly NOI" value={formatCurrency(outputs.noiMonthly)} color="white" />
                <MetricRow label="Debt Service" value={`-${formatCurrency(outputs.debtServiceMonthly)}`} color="#ef4444" />
                <View className="mx-4" style={{ height: 1, backgroundColor: '#334155' }} />
                <View className="flex-row justify-between px-4 py-3">
                  <Text className="text-white font-bold">Monthly Cash Flow</Text>
                  <Text className={`font-bold text-lg ${outputs.cashFlowMonthly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {outputs.cashFlowMonthly >= 0 ? '+' : ''}{formatCurrency(outputs.cashFlowMonthly)}
                  </Text>
                </View>
                <MetricRow label="Cap Rate" value={formatPercent(outputs.capRate)} color="#60a5fa" />
                <MetricRow
                  label="Cash-on-Cash"
                  value={`${formatPercent(outputs.cashOnCash)} ${outputs.cashOnCash >= 12 ? 'Great' : outputs.cashOnCash >= 8 ? 'Good' : outputs.cashOnCash >= 4 ? 'OK' : 'Low'}`}
                  color={outputs.cashOnCash >= 8 ? '#10b981' : outputs.cashOnCash >= 4 ? '#f59e0b' : '#ef4444'}
                />
                <View className="mx-4" style={{ height: 1, backgroundColor: '#334155' }} />
                <MetricRow label="Total Cash Required" value={formatCurrency(outputs.totalCashInvested)} color="#f59e0b" bold />
              </View>
            </View>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      <View className="px-4 py-3 border-t border-slate-700/50" style={{ backgroundColor: 'rgba(15, 23, 42, 0.95)' }}>
        {isRental && outputs && (
          <View className="flex-row justify-between mb-3">
            <View>
              <Text className="text-gray-500 text-xs uppercase tracking-wider">Cash Needed</Text>
              <Text className="text-white font-bold text-base">{formatCurrency(outputs.totalCashInvested)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-gray-500 text-xs uppercase tracking-wider">Cash Flow</Text>
              <Text className={`font-bold text-base ${outputs.cashFlowMonthly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {outputs.cashFlowMonthly >= 0 ? '+' : ''}{formatCurrency(outputs.cashFlowMonthly)}/mo
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          onPress={handleMakeOffer}
          disabled={!isComplete || submitting}
          className="rounded-xl items-center justify-center"
          style={{
            paddingVertical: 14,
            backgroundColor: isComplete && !submitting
              ? undefined
              : '#334155',
            ...(isComplete && !submitting ? {} : {}),
          }}
          activeOpacity={0.8}
          testID="button-make-offer"
        >
          {isComplete && !submitting && (
            <View className="absolute inset-0 rounded-xl overflow-hidden">
              <View className="flex-1" style={{ backgroundColor: '#7c3aed', opacity: 0.9 }} />
            </View>
          )}
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <View className="flex-row items-center gap-2">
              <Ionicons
                name={isComplete ? 'checkmark-circle' : 'alert-circle'}
                size={20}
                color={isComplete ? 'white' : '#6b7280'}
              />
              <Text className={`font-bold text-base ${isComplete ? 'text-white' : 'text-gray-500'}`}>
                {isComplete ? 'Make Offer' : `Complete ${missingFields.length} More Field${missingFields.length > 1 ? 's' : ''}`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function SectionCard({
  title,
  subtitle,
  icon,
  borderColor,
  gradientFrom,
  children,
}: {
  title: string;
  subtitle: string;
  icon: string;
  borderColor: string;
  gradientFrom: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3 rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: `${borderColor}33` }}>
      <View className="px-4 py-3 flex-row items-center gap-2 border-b" style={{ backgroundColor: gradientFrom, borderBottomColor: `${borderColor}33` }}>
        <Ionicons name={icon as any} size={18} color={borderColor} />
        <View>
          <Text className="font-bold text-sm" style={{ color: borderColor }}>{title}</Text>
          <Text className="text-gray-500 text-xs">{subtitle}</Text>
        </View>
      </View>
      <View style={{ backgroundColor: 'rgba(30, 41, 59, 0.4)' }}>
        {children}
      </View>
    </View>
  );
}

function FieldRow({
  label,
  guidance,
  guidanceColor = '#9ca3af',
  isLocked,
  lockMessage,
  children,
}: {
  label: string;
  guidance?: string;
  guidanceColor?: string;
  isLocked?: boolean;
  lockMessage?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="px-4 py-3 border-b" style={{ borderBottomColor: 'rgba(51, 65, 85, 0.3)' }}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-300 text-sm font-medium">{label}</Text>
        {isLocked ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="lock-closed" size={12} color="#f59e0b" />
            <Text className="text-amber-400 text-xs">{lockMessage || 'Unknown'}</Text>
          </View>
        ) : guidance ? (
          <Text className="text-xs" style={{ color: guidanceColor, fontVariant: ['tabular-nums'] }}>{guidance}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

function ProFormaInput({
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
}) {
  const isFilled = value !== null && value !== undefined;

  return (
    <View className="flex-row items-center rounded-lg" style={{
      backgroundColor: 'rgba(51, 65, 85, 0.4)',
      borderWidth: 1,
      borderColor: isFilled ? 'rgba(16, 185, 129, 0.4)' : '#475569',
    }}>
      {prefix && (
        <Text className="text-gray-400 pl-3 text-sm">{prefix}</Text>
      )}
      <TextInput
        value={value?.toString() || ''}
        onChangeText={(text) => {
          const num = parseFloat(text);
          onChange(isNaN(num) ? null : num);
        }}
        placeholder={placeholder}
        placeholderTextColor="#4b5563"
        keyboardType="decimal-pad"
        className="flex-1 text-white py-2.5 px-2"
        style={{ fontSize: 15, fontVariant: ['tabular-nums'] }}
        returnKeyType="done"
        onSubmitEditing={() => Keyboard.dismiss()}
      />
      {suffix && (
        <Text className="text-gray-400 pr-3 text-sm">{suffix}</Text>
      )}
      {isFilled && (
        <View className="pr-3">
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
        </View>
      )}
    </View>
  );
}

function SliderField({
  value,
  onChange,
  min,
  max,
  step,
  suffix,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  suffix: string;
  color: string;
}) {
  return (
    <View className="flex-row items-center gap-2">
      <View className="flex-1">
        <RNSlider
          value={value}
          onValueChange={(v) => onChange(Math.round(v * (1 / step)) / (1 / step))}
          minimumValue={min}
          maximumValue={max}
          step={step}
          minimumTrackTintColor={color}
          maximumTrackTintColor="#334155"
          thumbTintColor={color}
        />
      </View>
      <View className="rounded-lg px-2.5 py-1.5 min-w-[60]" style={{ backgroundColor: 'rgba(51, 65, 85, 0.6)', borderWidth: 1, borderColor: '#475569' }}>
        <Text className="text-white text-sm font-bold text-center" style={{ fontVariant: ['tabular-nums'] }}>
          {Number.isInteger(value) ? value : value.toFixed(1)}{suffix}
        </Text>
      </View>
    </View>
  );
}

function MetricRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: string;
  color: string;
  bold?: boolean;
}) {
  return (
    <View className="flex-row justify-between px-4 py-2.5">
      <Text className={`text-gray-300 text-sm ${bold ? 'font-semibold' : ''}`}>{label}</Text>
      <Text className={`text-sm ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color }}>{value}</Text>
    </View>
  );
}
