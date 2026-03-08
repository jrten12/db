import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { api, GameRun } from '../src/lib/api';

export default function Landing() {
  const router = useRouter();
  const [showNameModal, setShowNameModal] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [activeGame, setActiveGame] = useState<GameRun | null>(null);
  const [checkingGame, setCheckingGame] = useState(true);

  useEffect(() => {
    checkForActiveGame();
  }, []);

  const checkForActiveGame = async () => {
    try {
      const game = await api.getActiveGameRun();
      setActiveGame(game);
    } catch {
    } finally {
      setCheckingGame(false);
    }
  };

  const startNewGame = () => {
    if (activeGame) {
      Alert.alert(
        'Active Game Found',
        `You have an active game as "${activeGame.playerName}". Starting a new game will end the current one.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start New',
            style: 'destructive',
            onPress: async () => {
              try {
                await api.deleteGameRun(activeGame.id);
                setActiveGame(null);
                setShowNameModal(true);
              } catch {
                Alert.alert('Error', 'Failed to end current game.');
              }
            },
          },
        ]
      );
    } else {
      setShowNameModal(true);
    }
  };

  const confirmStartGame = async () => {
    const name = playerName.trim();
    if (!name) {
      Alert.alert('Name Required', 'Please enter your investor name.');
      return;
    }
    try {
      const game = await api.createGameRun({ playerName: name });
      setShowNameModal(false);
      setPlayerName('');
      router.push({ pathname: '/game', params: { gameId: game.id.toString() } });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start game.');
    }
  };

  const continueGame = () => {
    if (activeGame) {
      router.push({ pathname: '/game', params: { gameId: activeGame.id.toString() } });
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0a0a0b]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between px-5 py-4">
          <View className="flex-row items-center">
            <LinearGradient
              colors={['#10b981', '#059669']}
              className="w-8 h-8 rounded-lg items-center justify-center mr-2"
            >
              <Ionicons name="stats-chart" size={16} color="white" />
            </LinearGradient>
            <Text className="text-white font-semibold text-lg">Dealbreak</Text>
          </View>
        </View>

        <View className="flex-1 px-5 pb-8">
          <View className="flex-row justify-center gap-2 mb-6">
            <View className="flex-row items-center px-3 py-2 rounded-full bg-white/5 border border-white/10">
              <Ionicons name="cash-outline" size={14} color="#10b981" />
              <Text className="text-white/90 text-sm font-medium ml-1.5">$100K Start</Text>
            </View>
            <View className="flex-row items-center px-3 py-2 rounded-full bg-white/5 border border-white/10">
              <Ionicons name="time-outline" size={14} color="#f59e0b" />
              <Text className="text-white/90 text-sm font-medium ml-1.5">12 Months</Text>
            </View>
            <View className="flex-row items-center px-3 py-2 rounded-full bg-white/5 border border-white/10">
              <Ionicons name="flag-outline" size={14} color="#3b82f6" />
              <Text className="text-white/90 text-sm font-medium ml-1.5">3 Deals</Text>
            </View>
          </View>

          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-white text-center mb-1">
              Master Real Estate
            </Text>
            <Text className="text-3xl font-bold text-emerald-400 text-center mb-4">
              Before You Invest
            </Text>
            <Text className="text-base text-gray-400 text-center leading-6 px-4">
              The numbers don't lie, but they don't tell you everything. Learn to spot deals that work.
            </Text>
          </View>

          <View className="flex-row justify-center gap-6 mb-8">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-gray-500 text-sm">No signup</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-gray-500 text-sm">Play instantly</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={startNewGame}
            activeOpacity={0.9}
            testID="button-start-game"
            className="mb-4"
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              className="py-4 rounded-2xl items-center"
              style={{
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-white font-bold text-lg mr-2">
                  Start Playing
                </Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={continueGame}
            disabled={!activeGame || checkingGame}
            className={`py-4 rounded-2xl items-center border mb-8 ${
              activeGame ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/[0.05]'
            }`}
            activeOpacity={0.7}
            testID="button-continue-game"
          >
            {checkingGame ? (
              <Text className="text-white/40 font-semibold">Checking for saved game...</Text>
            ) : activeGame ? (
              <View>
                <Text className="text-white/80 font-semibold text-center">
                  Continue as {activeGame.playerName}
                </Text>
                <Text className="text-emerald-400/60 text-xs text-center mt-1">
                  Week {activeGame.currentWeek} · {activeGame.profitableDeals}/{activeGame.goalDeals} deals
                </Text>
              </View>
            ) : (
              <Text className="text-white/30 font-semibold">No Saved Game</Text>
            )}
          </TouchableOpacity>

          <View className="mb-6">
            <Text className="text-xl font-bold text-white text-center mb-2">
              Learn by Doing
            </Text>
            <Text className="text-gray-400 text-center mb-6">
              Every decision teaches you something.
            </Text>

            <View className="gap-3">
              <FeatureCard
                icon="search"
                iconColor="#3b82f6"
                title="Due Diligence"
                description="Order inspections and uncover hidden issues"
              />
              <FeatureCard
                icon="stats-chart"
                iconColor="#10b981"
                title="Pro Forma Analysis"
                description="Build financial models with real metrics"
              />
              <FeatureCard
                icon="trending-up"
                iconColor="#a855f7"
                title="Multiple Strategies"
                description="Buy and hold, or flip for quick profits"
              />
              <FeatureCard
                icon="time"
                iconColor="#f59e0b"
                title="Time Pressure"
                description="52 weeks to prove yourself"
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-xl font-bold text-white text-center mb-6">
              How It Works
            </Text>

            <View className="gap-3">
              <StepItem number="1" title="Browse the Market" description="Review properties with incomplete information" />
              <StepItem number="2" title="Do Your Research" description="Spend time and money on inspections" />
              <StepItem number="3" title="Run the Numbers" description="Build a pro forma with your assumptions" />
              <StepItem number="4" title="Execute" description="Buy, renovate, rent or flip" />
            </View>
          </View>

          <View className="items-center pt-4">
            <Text className="text-gray-600 text-sm text-center">
              A real estate decision simulator.{'\n'}Not financial advice.
            </Text>
            <Text className="text-gray-700 text-xs mt-2 font-mono">
              v2.0.0
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#1a1a2e] rounded-t-3xl p-6 pb-10">
            <Text className="text-white text-xl font-bold mb-2">Enter Your Investor Name</Text>
            <Text className="text-gray-400 mb-6">This will appear on the Hall of Fame if you win.</Text>
            <TextInput
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="e.g., Warren B."
              placeholderTextColor="#64748b"
              className="bg-slate-800 text-white px-4 py-4 rounded-xl text-lg border border-slate-700 mb-4"
              autoFocus
              maxLength={20}
              returnKeyType="go"
              onSubmitEditing={confirmStartGame}
              testID="input-player-name"
            />
            <TouchableOpacity
              onPress={confirmStartGame}
              className="bg-emerald-500 py-4 rounded-xl items-center mb-3"
              testID="button-confirm-start"
            >
              <Text className="text-white font-bold text-lg">Start Game</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowNameModal(false); setPlayerName(''); }}
              className="py-3 items-center"
            >
              <Text className="text-gray-400">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function FeatureCard({
  icon,
  iconColor,
  title,
  description
}: {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-0.5">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </View>
  );
}

function StepItem({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-row items-start p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <View className="w-8 h-8 rounded-full bg-emerald-500/15 items-center justify-center mr-3">
        <Text className="text-emerald-400 font-bold text-sm">{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-0.5">{title}</Text>
        <Text className="text-gray-400 text-sm">{description}</Text>
      </View>
    </View>
  );
}
