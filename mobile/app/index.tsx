import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Keyboard, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
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
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    checkForActiveGame();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
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
    Keyboard.dismiss();
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
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-5 pb-8 pt-4">
          <View className="items-center mb-6">
            <View className="relative items-center justify-center mb-4">
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  opacity: glowAnim,
                }}
              />
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  opacity: glowAnim,
                }}
              />
              <View
                className="w-20 h-20 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor: '#0a0a0b',
                  borderWidth: 3,
                  borderColor: 'rgba(16,185,129,0.4)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.6,
                  shadowRadius: 30,
                  elevation: 12,
                }}
              >
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  className="w-full h-full rounded-2xl items-center justify-center"
                  style={{ borderRadius: 13 }}
                >
                  <Ionicons name="stats-chart" size={36} color="white" />
                </LinearGradient>
              </View>
            </View>

            <Text className="text-2xl font-bold text-white text-center mb-1" testID="text-app-title">
              Dealbreak
            </Text>
            <Text className="text-sm text-gray-500 mb-4">Real Estate Simulator</Text>
          </View>

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

          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-white text-center mb-1">
              Master Real Estate
            </Text>
            <Text className="text-2xl font-bold text-emerald-400 text-center mb-3">
              Before You Invest
            </Text>
            <Text className="text-sm text-gray-400 text-center leading-5 px-2">
              The numbers don't lie, but they don't tell you everything. Learn to spot deals that work.
            </Text>
          </View>

          <View className="flex-row justify-center gap-6 mb-6">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-gray-500 text-sm">No signup</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-gray-500 text-sm">Play instantly</Text>
            </View>
          </View>

          {activeGame && (
            <View
              className="flex-row mb-4 rounded-xl overflow-hidden"
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              testID="home-stats-preview"
            >
              <View className="flex-1 py-3 items-center" style={{ backgroundColor: 'rgba(16,185,129,0.08)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' }}>
                <Ionicons name="wallet-outline" size={14} color="#34d399" />
                <Text className="text-emerald-400 font-bold text-sm mt-1 font-mono" testID="home-stat-cash">
                  ${((activeGame as any).cash || 100000).toLocaleString()}
                </Text>
                <Text className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">Cash</Text>
              </View>
              <View className="flex-1 py-3 items-center" style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.06)' }}>
                <Ionicons name="time-outline" size={14} color="#60a5fa" />
                <Text className="text-blue-400 font-bold text-sm mt-1" testID="home-stat-time">
                  Wk {activeGame.currentWeek}
                </Text>
                <Text className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">Week</Text>
              </View>
              <View className="flex-1 py-3 items-center" style={{ backgroundColor: 'rgba(245,158,11,0.08)' }}>
                <Ionicons name="flag-outline" size={14} color="#fbbf24" />
                <Text className="text-amber-400 font-bold text-sm mt-1" testID="home-stat-deals">
                  {activeGame.profitableDeals}/{activeGame.goalDeals}
                </Text>
                <Text className="text-gray-500 text-[10px] uppercase tracking-wider mt-0.5">Deals</Text>
              </View>
            </View>
          )}

          <View className="gap-3 mb-8">
            <TouchableOpacity
              onPress={startNewGame}
              activeOpacity={0.85}
              testID="button-start-game"
            >
              <LinearGradient
                colors={['rgba(16,185,129,0.35)', 'rgba(5,150,105,0.45)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-4 rounded-xl items-center"
                style={{
                  borderWidth: 2,
                  borderColor: 'rgba(16,185,129,0.5)',
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.2,
                  shadowRadius: 15,
                  elevation: 8,
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons name="play" size={22} color="#6ee7b7" />
                  <Text style={{ color: '#6ee7b7' }} className="font-bold text-lg">
                    {activeGame ? 'CONTINUE GAME' : 'START NEW GAME'}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {activeGame && (
              <TouchableOpacity
                onPress={continueGame}
                activeOpacity={0.85}
                testID="button-continue-game"
              >
                <View
                  className="py-3.5 rounded-xl items-center"
                  style={{
                    borderWidth: 1.5,
                    borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                  }}
                >
                  {checkingGame ? (
                    <Text className="text-white/40 font-semibold">Checking for saved game...</Text>
                  ) : (
                    <View>
                      <Text className="text-white/80 font-semibold text-center">
                        Continue as {activeGame.playerName}
                      </Text>
                      <Text className="text-emerald-400/60 text-xs text-center mt-1">
                        Week {activeGame.currentWeek} · {activeGame.profitableDeals}/{activeGame.goalDeals} deals
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {!activeGame && (
              <View
                className="py-3.5 rounded-xl items-center"
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.05)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                }}
              >
                <Text className="text-white/30 font-semibold">No Saved Game</Text>
              </View>
            )}

            {activeGame && (
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Start Over?',
                    'Your current game will be ended, and you\'ll start fresh.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Restart',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await api.deleteGameRun(activeGame.id);
                            setActiveGame(null);
                          } catch {
                            Alert.alert('Error', 'Failed to restart.');
                          }
                        },
                      },
                    ]
                  );
                }}
                activeOpacity={0.85}
                testID="button-restart-game"
              >
                <LinearGradient
                  colors={['rgba(239,68,68,0.1)', 'rgba(220,38,38,0.1)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-2.5 rounded-xl items-center"
                  style={{
                    borderWidth: 1,
                    borderColor: 'rgba(239,68,68,0.2)',
                  }}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="refresh" size={16} color="rgba(248,113,113,0.8)" />
                    <Text style={{ color: 'rgba(248,113,113,0.8)' }} className="font-semibold text-sm">
                      Restart Game
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-white text-center mb-2">
              Learn by Doing
            </Text>
            <Text className="text-gray-400 text-center text-sm mb-5">
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
            <Text className="text-lg font-bold text-white text-center mb-5">
              How It Works
            </Text>

            <View className="gap-3">
              <StepItem number="1" title="Browse the Market" description="Review properties with incomplete information" />
              <StepItem number="2" title="Do Your Research" description="Spend time and money on inspections" />
              <StepItem number="3" title="Run the Numbers" description="Build a pro forma with your assumptions" />
              <StepItem number="4" title="Execute" description="Buy, renovate, rent or flip" />
            </View>
          </View>

          <View className="items-center pt-4 pb-2">
            <Text className="text-gray-600 text-xs text-center">
              A real estate decision simulator.{'\n'}Not financial advice.
            </Text>
            <Text className="text-gray-700 text-xs mt-2 font-mono" testID="text-version">
              v2.1.0
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowNameModal(false);
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View className="flex-1 bg-black/60 justify-end">
            <TouchableWithoutFeedback>
              <View className="bg-[#1a1a2e] rounded-t-3xl p-6 pb-10">
                <Text className="text-white text-xl font-bold mb-2">Enter Your Investor Name</Text>
                <Text className="text-gray-400 mb-6">This will appear on the Hall of Fame if you win.</Text>
                <TextInput
                  value={playerName}
                  onChangeText={setPlayerName}
                  placeholder="e.g., Warren B."
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 text-white px-4 py-4 rounded-xl text-lg mb-4"
                  style={{ borderWidth: 1, borderColor: 'rgba(71,85,105,1)' }}
                  autoFocus
                  maxLength={20}
                  returnKeyType="go"
                  onSubmitEditing={confirmStartGame}
                  blurOnSubmit={true}
                  testID="input-player-name"
                />
                <TouchableOpacity
                  onPress={confirmStartGame}
                  testID="button-confirm-start"
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#10b981', '#059669']}
                    className="py-4 rounded-xl items-center mb-3"
                  >
                    <Text className="text-white font-bold text-lg">Start Game</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowNameModal(false);
                    setPlayerName('');
                  }}
                  className="py-3 items-center"
                >
                  <Text className="text-gray-400">Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    <View
      className="flex-row items-start p-4 rounded-xl"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <View
        className="w-10 h-10 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-0.5">{title}</Text>
        <Text className="text-gray-400 text-sm leading-5">{description}</Text>
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
    <View
      className="flex-row items-start p-4 rounded-xl"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
        <Text className="text-emerald-400 font-bold text-sm">{number}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold mb-0.5">{title}</Text>
        <Text className="text-gray-400 text-sm leading-5">{description}</Text>
      </View>
    </View>
  );
}
