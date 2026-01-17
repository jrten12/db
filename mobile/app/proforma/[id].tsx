import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import Slider from '@react-native-community/slider';
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

interface Property {
  id: number;
  name: string;
  askingPrice: number;
  rentMin: number;
  rentMax: number;
}

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export default function ProFormaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id: string;
    strategy: 'rent' | 'flip';
    contractor: 'cheap' | 'fast';
    diligence: string;
  }>();

  const [inputs, setInputs] = useState<ProFormaInputs>({
    ...defaultProForma,
    strategy: params.strategy || 'rent',
    contractorType: params.contractor || 'cheap',
  });

  const { data: property, isLoading } = useQuery<Property>({
    queryKey: ['property', params.id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/properties/${params.id}`);
      return res.json();
    },
  });

  const completedDiligence = params.diligence?.split(',').filter(Boolean) || [];
  const hasMarketStudy = completedDiligence.includes('market_study');

  const updateInput = <K extends keyof ProFormaInputs>(
    field: K,
    value: ProFormaInputs[K]
  ) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const outputs = useMemo(() => {
    if (!property || inputs.strategy !== 'rent') return null;
    return calculateRentalOutputs(inputs, property.askingPrice);
  }, [inputs, property]);

  const isComplete = isProFormaInputsComplete(inputs);
  const missingFields = getMissingFields(inputs);

  const handleMakeOffer = () => {
    if (!isComplete) {
      Alert.alert(
        'Incomplete Pro Forma',
        `Please fill in all required fields:\n${missingFields.join(', ')}`
      );
      return;
    }

    Alert.alert(
      'Confirm Offer',
      `Make an offer on ${property?.name} for ${formatCurrency(property?.askingPrice || 0)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Make Offer',
          onPress: () => {
            router.replace('/game');
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
          <Text className="text-white font-bold text-lg">Pro Forma Analysis</Text>
          <Text className="text-gray-400 text-sm">
            {inputs.strategy === 'rent' ? 'Rental Strategy' : 'Flip Strategy'}
          </Text>
        </View>
        <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
          <Text className="text-emerald-400 font-semibold">
            {formatCurrency(property.askingPrice)}
          </Text>
        </View>
      </View>

      {/* Progress Banner */}
      <View className="px-4 py-2 bg-slate-800/50 border-b border-slate-700">
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-400 text-sm">
            Fields completed: {inputs.strategy === 'rent' ? 6 - missingFields.length : 4 - missingFields.length} / {inputs.strategy === 'rent' ? 6 : 4}
          </Text>
          {isComplete && (
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text className="text-emerald-400 text-sm ml-1">Ready to offer</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {inputs.strategy === 'rent' ? (
            <>
              {/* Income Section */}
              <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
                <Text className="text-gray-300 font-semibold mb-4">Income Assumptions</Text>

                <InputField
                  label="Expected Rent (Monthly)"
                  value={inputs.expectedRent}
                  onChange={(v) => updateInput('expectedRent', v)}
                  placeholder={hasMarketStudy ? `${property.rentMin}-${property.rentMax}` : 'Enter estimate'}
                  prefix="$"
                  hint={hasMarketStudy ? 'Market study revealed range' : 'Estimate based on research'}
                />

                <InputField
                  label="Vacancy Rate"
                  value={inputs.vacancyRate}
                  onChange={(v) => updateInput('vacancyRate', v)}
                  placeholder="5-10%"
                  suffix="%"
                  hint="% of year property is vacant"
                />
              </View>

              {/* Expenses Section */}
              <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
                <Text className="text-gray-300 font-semibold mb-4">Operating Expenses</Text>

                <InputField
                  label="Property Taxes (Annual)"
                  value={inputs.taxesAnnual}
                  onChange={(v) => updateInput('taxesAnnual', v)}
                  placeholder="1-2% of value"
                  prefix="$"
                />

                <InputField
                  label="Insurance (Annual)"
                  value={inputs.insuranceAnnual}
                  onChange={(v) => updateInput('insuranceAnnual', v)}
                  placeholder="$1,000-2,500"
                  prefix="$"
                />

                <InputField
                  label="Maintenance Reserve"
                  value={inputs.maintenancePct}
                  onChange={(v) => updateInput('maintenancePct', v)}
                  placeholder="5-10%"
                  suffix="%"
                  hint="% of rent for repairs"
                />

                <InputField
                  label="CapEx Reserve"
                  value={inputs.capExPct}
                  onChange={(v) => updateInput('capExPct', v)}
                  placeholder="5-10%"
                  suffix="%"
                  hint="% of rent for major repairs"
                />
              </View>
            </>
          ) : (
            /* Flip Strategy Inputs */
            <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
              <Text className="text-gray-300 font-semibold mb-4">Flip Assumptions</Text>

              <InputField
                label="Rehab Budget"
                value={inputs.rehabBudget}
                onChange={(v) => updateInput('rehabBudget', v)}
                placeholder="Total renovation cost"
                prefix="$"
              />

              <InputField
                label="Rehab Timeline"
                value={inputs.rehabWeeks}
                onChange={(v) => updateInput('rehabWeeks', v)}
                placeholder="Weeks to complete"
                suffix=" weeks"
              />

              <InputField
                label="Contingency"
                value={inputs.contingencyPct}
                onChange={(v) => updateInput('contingencyPct', v)}
                placeholder="10-20%"
                suffix="%"
                hint="Buffer for unexpected costs"
              />

              <InputField
                label="Selling Costs"
                value={inputs.sellingCostsPct}
                onChange={(v) => updateInput('sellingCostsPct', v)}
                placeholder="6-8%"
                suffix="%"
                hint="Agent fees, closing costs"
              />
            </View>
          )}

          {/* Financing Section */}
          <View className="bg-slate-800 rounded-2xl p-4 mb-4 border border-slate-700">
            <Text className="text-gray-300 font-semibold mb-4">Financing</Text>

            <View className="mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-400">Loan-to-Value (LTV)</Text>
                <Text className="text-white font-semibold">{inputs.ltv}%</Text>
              </View>
              <Slider
                value={inputs.ltv}
                onValueChange={(v) => updateInput('ltv', Math.round(v))}
                minimumValue={LTV_MIN}
                maximumValue={LTV_MAX}
                step={5}
                minimumTrackTintColor="#10b981"
                maximumTrackTintColor="#475569"
                thumbTintColor="#10b981"
              />
              <View className="flex-row justify-between mt-1">
                <Text className="text-gray-500 text-xs">{LTV_MIN}% (Conservative)</Text>
                <Text className="text-gray-500 text-xs">{LTV_MAX}% (Aggressive)</Text>
              </View>
            </View>

            <View className="bg-slate-700/50 rounded-xl p-3 space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Down Payment</Text>
                <Text className="text-white">{formatPercent(downPaymentPct)} ({formatCurrency(property.askingPrice * (downPaymentPct / 100))})</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Interest Rate</Text>
                <Text className="text-amber-400">{formatPercent(interestRate)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-400 text-sm">Loan Fees</Text>
                <Text className="text-red-400">{formatPercent(loanFees)}</Text>
              </View>
            </View>

            <Text className="text-gray-500 text-xs mt-2 text-center">
              Higher leverage = higher returns but more risk
            </Text>
          </View>

          {/* Results Section */}
          {inputs.strategy === 'rent' && outputs && (
            <View className="bg-gradient-to-br from-emerald-500/20 to-slate-800 rounded-2xl p-4 mb-4 border border-emerald-500/30">
              <Text className="text-emerald-400 font-semibold mb-4">Projected Returns</Text>

              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-gray-300">Monthly NOI</Text>
                  <Text className="text-white font-semibold">{formatCurrency(outputs.noiMonthly)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-300">Debt Service</Text>
                  <Text className="text-red-400">-{formatCurrency(outputs.debtServiceMonthly)}</Text>
                </View>
                <View className="flex-row justify-between pt-2 border-t border-slate-600">
                  <Text className="text-white font-semibold">Monthly Cash Flow</Text>
                  <Text className={`font-bold text-lg ${outputs.cashFlowMonthly >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(outputs.cashFlowMonthly)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-300">Cap Rate</Text>
                  <Text className="text-blue-400 font-semibold">{formatPercent(outputs.capRate)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-300">Cash-on-Cash Return</Text>
                  <Text className={`font-semibold ${outputs.cashOnCash >= 8 ? 'text-emerald-400' : outputs.cashOnCash >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {formatPercent(outputs.cashOnCash)}
                  </Text>
                </View>
                <View className="flex-row justify-between pt-2 border-t border-slate-600">
                  <Text className="text-gray-300">Total Cash Required</Text>
                  <Text className="text-amber-400 font-semibold">{formatCurrency(outputs.totalCashInvested)}</Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-4 border-t border-slate-800">
        <TouchableOpacity
          onPress={handleMakeOffer}
          disabled={!isComplete}
          className={`py-4 rounded-2xl items-center ${
            isComplete
              ? 'bg-emerald-500'
              : 'bg-slate-700'
          }`}
          activeOpacity={0.8}
          testID="button-make-offer"
        >
          <Text className={`font-bold text-lg ${isComplete ? 'text-white' : 'text-gray-500'}`}>
            {isComplete ? 'Make Offer' : `Complete ${missingFields.length} More Field${missingFields.length > 1 ? 's' : ''}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  const isFilled = value !== null && value !== undefined;

  return (
    <View className="mb-4">
      <Text className="text-gray-400 text-sm mb-2">{label}</Text>
      <View className={`flex-row items-center bg-slate-700/50 rounded-xl border ${isFilled ? 'border-emerald-500/50' : 'border-slate-600'}`}>
        {prefix && (
          <Text className="text-gray-400 pl-3">{prefix}</Text>
        )}
        <TextInput
          value={value?.toString() || ''}
          onChangeText={(text) => {
            const num = parseFloat(text);
            onChange(isNaN(num) ? null : num);
          }}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          keyboardType="decimal-pad"
          className="flex-1 text-white py-3 px-3"
          style={{ fontSize: 16 }}
        />
        {suffix && (
          <Text className="text-gray-400 pr-3">{suffix}</Text>
        )}
        {isFilled && (
          <View className="pr-3">
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          </View>
        )}
      </View>
      {hint && (
        <Text className="text-gray-500 text-xs mt-1">{hint}</Text>
      )}
    </View>
  );
}
