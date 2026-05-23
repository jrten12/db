import '@/styles/game-animations.css';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { StatusBar } from '@/components/game/StatusBar';
import { MarketBar, MarketChangeNotification } from '@/components/game/MarketIndicator';
import type { MarketCondition } from '@shared/schema';
import { ProFormaPanel } from '@/components/game/ProFormaPanel';
import { MetricsPanel } from '@/components/game/MetricsPanel';
import { PropertySelector, type LocationFilter, type PropertyDealInfo } from '@/components/game/PropertySelector';
import { PropertyDetail } from '@/components/game/PropertyDetail';
import { ResultsPanel } from '@/components/game/ResultsPanel';
import { LedgerPanel } from '@/components/game/LedgerPanel';
import { MoneyAnimation } from '@/components/game/MoneyAnimation';
import { DealTransactionAnimation } from '@/components/game/DealTransactionAnimation';
import { TimeProgressionPanel } from '@/components/game/TimeProgressionPanel';
import { IncomeNotification, useIncomeNotifications } from '@/components/game/IncomeNotification';
import { ConstructionNotification, useConstructionNotifications } from '@/components/game/ConstructionNotification';
import { TenantIssuePopup, type TenantIssueEvent } from '@/components/game/TenantIssuePopup';
import { TenantTextPopup } from '@/components/game/TenantTextPopup';
import { AnimatedBackground } from '@/components/game/AnimatedBackground';
import { generateTenantName, getRandomPersonalityType, getSpeechPatterns, getRandomMessage, getRandomPaymentEthic } from '@/lib/tenantGenerator';
import type { Tenant } from '@shared/schema';
import { PremiumModal } from '@/components/game/PremiumModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SeasonEndModal } from '@/components/game/SeasonEndModal';
import { XpFlash, type XpFlashEvent } from '@/components/game/XpFlash';
import { BadgesModal } from '@/components/game/BadgesModal';
import { PlayerNameModal } from '@/components/game/PlayerNameModal';
import { HallOfFameModal } from '@/components/game/HallOfFameModal';
import { EndGameSummary } from '@/components/game/EndGameSummary';
import { AchievementQueue } from '@/components/game/AchievementPopup';
import { checkAchievements, type AchievementCheckContext } from '@/lib/achievements';
import { TrophyNotificationManager, useTrophyNotifications } from '@/components/game/TrophyUnlockNotification';
import { BankruptModal } from '@/components/game/BankruptModal';
import { SaveIndicator } from '@/components/game/SaveIndicator';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { TutorialPrompt } from '@/components/game/TutorialPrompt';
import { DebtPanel, DebtPanelTrigger } from '@/components/game/DebtPanel';
import { RefinanceModal } from '@/components/game/RefinanceModal';
import { ContractorWalkthroughModal } from '@/components/game/ContractorWalkthroughModal';
import { GoldTreasureModal } from '@/components/game/GoldTreasureModal';
import { OperatingExpensesPopup } from '@/components/game/OperatingExpensesPopup';
import { DealCongratulations } from '@/components/game/DealCongratulations';
import { RentalRealityReveal } from '@/components/game/RentalRealityReveal';
import { PropertySoldAnimation } from '@/components/game/PropertySoldAnimation';
import { PassiveIncomeMilestone } from '@/components/game/PassiveIncomeMilestone';
import { DealShareCard } from '@/components/game/DealShareCard';
import { useTutorial } from '@/contexts/TutorialContext';
import { GameHomeScreen } from '@/components/game/GameHomeScreen';
import {
  ProFormaInputs,
  ProFormaOutputs,
  defaultProForma,
  getPropertyBasedDefaults,
  calculateProForma,
  convertPropertyToGameProperty,
  getInterestRateFromLTV,
  getLoanFeesFromLTV,
  calculateTimePenalty,
  TIME_PENALTY_TENANT_PAYS_UTILITIES,
  PlayerFinancials,
  getSaleEstimateRange,
  MARKET_DEFAULTS,
  applyPriceDrift
} from '@/lib/gameData';
import { getEffectiveRanges, getRevealedIssues, getRevealedRandomizedIssues } from '@/lib/propertyIssues';
import { type Curveball, getTenantMessageForCurveball, curveballHasTenantMessage, getCurveballById } from '@/lib/curveballs';
import { api } from '@/lib/api';
import { saveGame, loadGame, getSaveInfo, clearSave } from '@/lib/saveGame';
import type { GameRun, Property, LedgerEntry, Deal, HallOfFamePlayer } from '@shared/schema';
import woodTexture from '@assets/generated_images/dark_mahogany_wood_texture.webp';
import Footer from '@/components/Footer';
import { Loader2, Play } from 'lucide-react';
import { playAdvanceWeekSound, playRentDayChime } from '@/hooks/useClickSound';
import { toast } from 'sonner';

type GameScreen = 'home' | 'market' | 'detail' | 'proforma' | 'results';

interface DiligenceState {
  [propertyId: number]: string[];
}

interface ProFormaCompletionState {
  [propertyId: number]: boolean;
}

const TENANT_PERSONAS = [
  {
    name: 'Alex',
    trait: 'organized and concise',
    note: 'Shares a tidy checklist and keeps updates short.',
  },
  {
    name: 'Jordan',
    trait: 'friendly and proactive',
    note: 'Offers flexible times and appreciates quick updates.',
  },
  {
    name: 'Riley',
    trait: 'detail-oriented and calm',
    note: 'Sends clear photos and a calm summary of the issue.',
  },
  {
    name: 'Casey',
    trait: 'straightforward and punctual',
    note: 'Prefers quick resolutions and clear timelines.',
  },
  {
    name: 'Taylor',
    trait: 'thoughtful and patient',
    note: 'Checks in politely and values transparency.',
  },
];

export default function Game() {
  const queryClient = useQueryClient();
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [proFormaInputs, setProFormaInputs] = useState<ProFormaInputs>(defaultProForma);
  const [proFormaOutputs, setProFormaOutputs] = useState<ProFormaOutputs | null>(null);
  const [isProFormaComplete, setIsProFormaComplete] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof ProFormaInputs>>(new Set());
  const [proFormaComparisonShown, setProFormaComparisonShown] = useState<Set<number>>(new Set());
  const [completedDiligence, setCompletedDiligence] = useState<DiligenceState>({});
  const [proFormaCompletions, setProFormaCompletions] = useState<ProFormaCompletionState>({});
  const [skippedDiligenceDeals, setSkippedDiligenceDeals] = useState<Set<number>>(() => {
    try {
      const stored = sessionStorage.getItem('skippedDiligenceDeals');
      if (stored) {
        return new Set(JSON.parse(stored) as number[]);
      }
    } catch {}
    return new Set();
  });
  
  // Persist skipped diligence to sessionStorage
  const skippedDiligenceArray = Array.from(skippedDiligenceDeals);
  const [flipMetrics, setFlipMetrics] = useState({ profit: 0, roi: 0, holdWeeks: 0, hasAppraisal: false });
  const [showLedger, setShowLedger] = useState(false);

  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [moneyAnimationTrigger, setMoneyAnimationTrigger] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [bankruptcyConfirm, setBankruptcyConfirm] = useState<{ required: number; cash: number; shortfall: number } | null>(null);
  const [premiumTriggerReason, setPremiumTriggerReason] = useState<'no_weeks' | 'low_cash' | 'manual'>('manual');
  const [showSeasonEndModal, setShowSeasonEndModal] = useState(false);
  // Snapshot of the just-ended season — captured from the 409 response so the
  // recap modal can render real numbers (server resets these on unlock).
  type SeasonEndSnapshot = {
    seasonStats: {
      bestDealProfit: number;
      bestDealLabel: string;
      totalCashFlow: number;
      dealsClosed: number;
      profitableThisSeason: number;
      xpEarnedThisSeason: number;
    };
    currentStreak: number;
    bestStreak: number;
    cash: number;
  };
  const [seasonEndSnapshot, setSeasonEndSnapshot] = useState<SeasonEndSnapshot | null>(null);
  // Single XP/tier-up flash event slot. Setting it shows the flash; clearing hides it.
  const [xpFlash, setXpFlash] = useState<XpFlashEvent | null>(null);
  const [hasShownNoWeeksPopup, setHasShownNoWeeksPopup] = useState(false);
  const [hasShownLowCashPopup, setHasShownLowCashPopup] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showEndGameSummary, setShowEndGameSummary] = useState(false);
  const [endGameWon, setEndGameWon] = useState(false);
  const [endGameMidGame, setEndGameMidGame] = useState(false);
  const [showDebtPanel, setShowDebtPanel] = useState(false);
  const [achievementQueue, setAchievementQueue] = useState<string[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<HallOfFamePlayer | null>(null);
  const [showNameEntry, setShowNameEntry] = useState(true);
  
  // Sale confirmation dialog state
  const [pendingSale, setPendingSale] = useState<{
    dealId: number;
    strategy: 'rent' | 'flip';
    propertyName: string;
    purchasePrice: number;
    minSale: number;
    maxSale: number;
  } | null>(null);
  const [isSelling, setIsSelling] = useState(false);
  
  // Passive income milestone queue (played one at a time, after other notifications settle)
  const [milestoneQueue, setMilestoneQueue] = useState<number[]>([]);
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);

  // Refinance modal state
  const [refinancingDeal, setRefinancingDeal] = useState<{
    deal: Deal;
    property: Property;
  } | null>(null);
  
  // Contractor walkthrough modal state
  const [walkthroughDeal, setWalkthroughDeal] = useState<{
    deal: Deal;
    property: Property;
  } | null>(null);
  
  // Operating expenses popup state
  const [opexPopupData, setOpexPopupData] = useState<{
    deal: Deal;
    property: Property;
  } | null>(null);
  
  // Gold treasure discovery state (1/300 chance during contractor walkthrough)
  const [treasureData, setTreasureData] = useState<{
    amount: number;
    propertyName: string;
    context: 'diligence' | 'walkthrough';
  } | null>(null);

  const STARTING_CASH = 100000;

  // Income notifications
  const { events: incomeEvents, dismissEvent, addRentalPayment, addFlipProceeds, addCurveballBonus } = useIncomeNotifications();
  const { 
    events: constructionEvents, 
    addConstructionStart, 
    addConstructionComplete, 
    dismissEvent: dismissConstructionEvent 
  } = useConstructionNotifications();
  
  // Trophy notifications
  const { pendingTrophies, addTrophies, clearTrophies } = useTrophyNotifications();

  // Tutorial
  const { completeAction, startTutorial } = useTutorial();

  const [gameRun, setGameRun] = useState<GameRun | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [gameError, setGameError] = useState<Error | null>(null);
  const [savedGameInfo, setSavedGameInfo] = useState<ReturnType<typeof getSaveInfo>>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  // Scroll to top when switching to results screen
  useEffect(() => {
    if (currentScreen === 'results' && mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentScreen]);

  useEffect(() => {
    try {
      sessionStorage.setItem('skippedDiligenceDeals', JSON.stringify(skippedDiligenceArray));
    } catch {}
  }, [skippedDiligenceArray]);

  useEffect(() => {
    const checkActiveGame = async () => {
      try {
        const savedInfo = getSaveInfo();
        setSavedGameInfo(savedInfo);
        
        const sessionGameId = sessionStorage.getItem('currentGameRunId');
        if (sessionGameId) {
          const activeRun = await api.getActiveGameRun();
          if (activeRun && activeRun.id === parseInt(sessionGameId)) {
            setGameRun(activeRun);
            setPlayerName(activeRun.playerName);
            setShowNameEntry(false);
          }
        }
      } catch (err) {
        console.error('Failed to check active game:', err);
      } finally {
        setIsLoadingGame(false);
      }
    };
    checkActiveGame();
  }, []);

  const startNewGame = useCallback(async (name: string) => {
    setIsLoadingGame(true);
    setGameError(null);
    try {
      const player = await api.getOrCreatePlayer(name);
      setCurrentPlayer(player);
      setPlayerName(name);
      
      await api.updatePlayerStats(player.id, {
        totalGamesPlayed: player.totalGamesPlayed + 1,
      });

      const newRun = await api.createGameRun({
        playerName: name,
        difficulty: 'apprentice',
        cash: STARTING_CASH,
        weeksRemaining: 52,
        profitableDeals: 0,
        goalDeals: 2,
        status: 'active',
      });
      
      if (!newRun) {
        throw new Error('Failed to create game run');
      }
      
      // Invalidate properties cache to ensure fresh data on new game
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      
      sessionStorage.setItem('currentGameRunId', String(newRun.id));
      sessionStorage.removeItem('skippedDiligenceDeals');
      setSkippedDiligenceDeals(new Set());
      setGameRun(newRun);
      setShowNameEntry(false);
      clearSave();
    } catch (err) {
      setGameError(err as Error);
      setIsLoadingGame(false);
      throw err;
    }
    setIsLoadingGame(false);
  }, [queryClient]);

  const continueSavedGame = useCallback(async () => {
    const saved = loadGame();
    if (!saved) {
      toast.error('No saved game found');
      return;
    }
    
    setIsLoadingGame(true);
    try {
      const player = await api.getOrCreatePlayer(saved.gameRun.playerName);
      setCurrentPlayer(player);
      
      const restoredRun = await api.createGameRun({
        playerName: saved.gameRun.playerName,
        difficulty: saved.gameRun.difficulty,
        cash: saved.gameRun.cash,
        weeksRemaining: saved.gameRun.weeksRemaining,
        profitableDeals: saved.gameRun.profitableDeals,
        goalDeals: saved.gameRun.goalDeals,
        status: 'active',
      });
      
      if (!restoredRun) {
        throw new Error('Failed to restore game');
      }
      
      // Restore all game data to the database
      if (saved.deals.length > 0 || saved.investigations.length > 0 || saved.ledgerEntries.length > 0) {
        await api.restoreGameRunData(restoredRun.id, {
          deals: saved.deals,
          investigations: saved.investigations,
          ledgerEntries: saved.ledgerEntries,
        });
      }
      
      sessionStorage.setItem('currentGameRunId', String(restoredRun.id));
      setGameRun(restoredRun);
      setPlayerName(restoredRun.playerName);
      setProFormaCompletions(saved.proFormaCompletions);
      setSkippedDiligenceDeals(new Set(saved.skippedDiligenceDeals));
      setShowNameEntry(false);
      
      // Invalidate queries to fetch the restored data
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      
      toast.success('Game restored!');
    } catch (err) {
      console.error('Failed to restore game:', err);
      toast.error('Failed to restore saved game');
    } finally {
      setIsLoadingGame(false);
    }
  }, [queryClient]);

  const { data: rawProperties = [], isLoading: isLoadingProps } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const properties = useMemo(() => {
    const drift = gameRun?.priceDriftPct;
    if (!drift) return rawProperties;
    return rawProperties.map(p => applyPriceDrift(p, drift));
  }, [rawProperties, gameRun?.priceDriftPct]);

  const updateGameMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<GameRun> }) =>
      api.updateGameRun(id, updates),
    onSuccess: (updatedGameRun) => {
      setGameRun(updatedGameRun);
    },
  });

  const createDealMutation = useMutation({
    mutationFn: api.createDeal,
    onSuccess: () => {
      toast.success('Deal saved!');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const createInvestigationMutation = useMutation({
    mutationFn: api.createInvestigation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
    },
  });

  const { data: investigations = [] } = useQuery({
    queryKey: ['investigations', gameRun?.id],
    queryFn: () => api.getInvestigations(gameRun!.id),
    enabled: !!gameRun?.id,
  });

  const { data: ledgerEntries = [] } = useQuery({
    queryKey: ['ledger', gameRun?.id],
    queryFn: () => api.getLedger(gameRun!.id),
    enabled: !!gameRun?.id,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['deals', gameRun?.id],
    queryFn: () => api.getDeals(gameRun!.id),
    enabled: !!gameRun?.id,
  });

  const { data: tenants = [] } = useQuery({
    queryKey: ['tenants', gameRun?.id],
    queryFn: () => api.getTenants(gameRun!.id),
    enabled: !!gameRun?.id,
  });

  // Calculate player financials for interest rate adjustments
  const playerFinancials = useMemo((): PlayerFinancials => {
    let totalMonthlyDebt = 0;
    let totalMonthlyIncome = 0;
    let totalAssetValue = 0;
    let completedProfitableDeals = 0;
    let totalDealsCompleted = 0;
    
    for (const deal of deals) {
      if (deal.status === 'active_rental') {
        const outputs = deal.proFormaOutputs as any;
        totalMonthlyDebt += outputs?.monthlyDebtService || outputs?.debtServiceMonthly || 0;
        totalMonthlyIncome += outputs?.monthlyGrossRent || 0;
        const property = properties?.find(p => p.id === deal.propertyId);
        totalAssetValue += property?.price || 0;
      }
      if (deal.status === 'completed' || deal.status === 'sold_rental') {
        totalDealsCompleted++;
        if ((deal.actualProfit ?? 0) > 0) {
          completedProfitableDeals++;
        }
      }
    }
    
    return {
      cash: gameRun?.cash || 0,
      totalMonthlyDebt,
      totalMonthlyIncome,
      totalAssetValue,
      marketCondition: (gameRun as any)?.marketCondition || 'neutral',
      completedProfitableDeals,
      totalDealsCompleted,
    };
  }, [deals, properties, gameRun?.cash, gameRun]);

  // Check for new achievements when deals change
  useEffect(() => {
    if (!gameRun || deals.length === 0 || !achievementsLoaded) return;
    
    const activeRentals = deals.filter(d => d.status === 'active_rental').length;
    const completedFlips = deals.filter(d => d.strategy === 'flip' && d.status === 'completed').length;
    
    // Count consecutive profitable flips
    const flipDeals = deals
      .filter(d => d.strategy === 'flip' && d.status === 'completed')
      .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    
    let consecutiveFlipProfits = 0;
    for (const deal of flipDeals) {
      if ((deal.actualProfit || 0) > 0) {
        consecutiveFlipProfits++;
      } else {
        break;
      }
    }
    
    // Calculate total profit from completed deals
    const totalProfit = deals.reduce((sum, d) => {
      if (d.status === 'completed' || d.status === 'sold_rental') {
        return sum + (d.actualProfit || 0);
      }
      return sum;
    }, 0);
    
    const context: AchievementCheckContext = {
      deals,
      totalProfit,
      startingCash: STARTING_CASH,
      currentCash: gameRun.cash,
      consecutiveFlipProfits,
      activeRentals,
      completedFlips,
      weeksUsed: 52 - (gameRun.weeksRemaining || 0),
      unlockedAchievements,
    };
    
    const newAchievements = checkAchievements(context);
    
    if (newAchievements.length > 0) {
      // Unlock each new achievement on the server
      newAchievements.forEach(async (achievementId) => {
        try {
          await api.unlockAchievement(gameRun.id, achievementId);
        } catch (err) {
          console.error('Failed to unlock achievement:', err);
        }
      });
      
      // Add to local state and queue for display
      setUnlockedAchievements(prev => [...prev, ...newAchievements]);
      setAchievementQueue(prev => [...prev, ...newAchievements]);
    }
  }, [deals, gameRun?.cash, gameRun?.id, unlockedAchievements, achievementsLoaded]);

  // Load existing achievements when game starts
  useEffect(() => {
    if (!gameRun?.id) return;
    
    setAchievementsLoaded(false);
    api.getAchievements(gameRun.id).then(achievements => {
      setUnlockedAchievements(achievements.map(a => a.achievementId));
      setAchievementsLoaded(true);
    }).catch(err => {
      console.error('Failed to load achievements:', err);
      setAchievementsLoaded(true); // Still allow checking even if load fails
    });
  }, [gameRun?.id]);

  useEffect(() => {
    if (!gameRun || gameRun.status !== 'active' || gameRun.weeksRemaining <= 0) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveGame({
        gameRun,
        deals,
        ledgerEntries,
        investigations,
        completedDiligence,
        proFormaCompletions,
        skippedDiligenceDeals: Array.from(skippedDiligenceDeals),
      });
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [gameRun, deals, ledgerEntries, investigations, completedDiligence, proFormaCompletions, skippedDiligenceDeals]);

  const createLedgerMutation = useMutation({
    mutationFn: ({ gameRunId, entries, currentCash }: {
      gameRunId: number;
      entries: Array<{ direction: string; category: string; amount: number; description: string; propertyId?: number; dealId?: number }>;
      currentCash: number;
    }) => api.createLedgerEntries(gameRunId, entries, currentCash),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      if (data?.newCash !== undefined) {
        setGameRun(prev => prev ? { ...prev, cash: data.newCash } : prev);
      }
    },
  });

  const purchaseSkuMutation = useMutation({
    mutationFn: ({ gameRunId, sku }: { gameRunId: number; sku: string }) =>
      api.purchaseSku(gameRunId, sku),
    onSuccess: (updatedGameRun) => {
      setGameRun(updatedGameRun);
      toast.success(`Purchase complete! Cash: $${updatedGameRun.cash.toLocaleString()}, Months: ${updatedGameRun.weeksRemaining}`);
    },
  });

  useEffect(() => {
    const diligenceMap: DiligenceState = {};
    for (const inv of investigations) {
      if (!diligenceMap[inv.propertyId]) {
        diligenceMap[inv.propertyId] = [];
      }
      if (!diligenceMap[inv.propertyId].includes(inv.investigationType)) {
        diligenceMap[inv.propertyId].push(inv.investigationType);
      }
    }
    setCompletedDiligence(prev => {
      const prevStr = JSON.stringify(prev);
      const newStr = JSON.stringify(diligenceMap);
      if (prevStr === newStr) return prev;
      return diligenceMap;
    });
  }, [investigations]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  // Live flip metrics derived directly from proFormaOutputs for perfect consistency
  const liveFlipMetrics = useMemo(() => {
    if (!selectedProperty || proFormaInputs.strategy !== 'flip' || !proFormaOutputs) {
      return { profit: 0, roi: 0 };
    }
    
    const hasAppraisal = completedDiligence[selectedProperty.id]?.includes('appraisal');
    if (!hasAppraisal) {
      return { profit: 0, roi: 0 };
    }
    
    // Use flipProfit and flipROI directly from proFormaOutputs
    // These are calculated by calculateProForma with all the correct factors:
    // - Player-state-aware interest rates
    // - Week-based market rate variability
    // - Construction loan premium
    // - financeRehab effects on cash invested
    // - Holding costs tied to rehab weeks
    return { profit: proFormaOutputs.flipProfit, roi: proFormaOutputs.flipROI };
  }, [selectedProperty, proFormaInputs.strategy, proFormaOutputs, completedDiligence]);

  const handlePropertyClick = useCallback((id: number) => {
    setSelectedPropertyId(id);
    setCurrentScreen('detail');
    setProFormaInputs(defaultProForma);
    setProFormaOutputs(null);
    setIsProFormaComplete(false);
    setTouchedFields(new Set());
    completeAction('select_property');
  }, [completeAction]);

  const handleCloseDetail = useCallback(() => {
    setCurrentScreen('market');
  }, []);

  const handleOpenProForma = useCallback((strategy: 'rent' | 'flip', contractor: 'cheap' | 'fast') => {
    if (!selectedProperty) return;

    const diligenceForProperty = completedDiligence[selectedProperty.id] || [];
    const effectiveRanges = getEffectiveRanges(
      convertPropertyToGameProperty(selectedProperty),
      diligenceForProperty
    );

    const hasMarketStudy = diligenceForProperty.includes('market_study');
    const hasContractorWalkthrough = diligenceForProperty.includes('contractor_walkthrough');

    const rentEstimate = hasMarketStudy
      ? Math.round((effectiveRanges.rent.min + effectiveRanges.rent.max) / 2)
      : 0;

    const rehabEstimate = hasContractorWalkthrough
      ? Math.round((effectiveRanges.rehab.min + effectiveRanges.rehab.max) / 2)
      : 0;

    const timelineEstimate = hasContractorWalkthrough
      ? Math.round((effectiveRanges.timeline.min + effectiveRanges.timeline.max) / 2)
      : 8;

    // Get property-specific defaults for taxes and insurance
    const propertyDefaults = getPropertyBasedDefaults(selectedProperty.price);
    
    setProFormaInputs(prev => ({
      ...prev,
      strategy,
      contractorType: contractor,
      expectedRent: prev.expectedRent ?? rentEstimate,
      rehabBudget: prev.rehabBudget ?? rehabEstimate,
      rehabWeeks: prev.rehabWeeks ?? timelineEstimate,
      sellingCostsPct: prev.sellingCostsPct ?? MARKET_DEFAULTS.sellingCostsPct,
      contingencyPct: prev.contingencyPct ?? MARKET_DEFAULTS.contingencyPct,
      // Apply property-based defaults for taxes/insurance if not already set
      taxesAnnual: prev.taxesAnnual ?? propertyDefaults.taxesAnnual,
      insuranceAnnual: prev.insuranceAnnual ?? propertyDefaults.insuranceAnnual,
    }));
    // Reset touched fields - user must interact with all fields
    // Mark only the fields chosen by buttons (strategy, financing, contractor) as touched
    setTouchedFields(new Set(['strategy', 'financingType', 'contractorType'] as (keyof ProFormaInputs)[]));
    setIsProFormaComplete(false);
    setProFormaOutputs(null);
    setCurrentScreen('proforma');
  }, [selectedProperty, completedDiligence]);

  const handlePassProperty = useCallback(() => {
    setCurrentScreen('market');
    setSelectedPropertyId(null);
    toast.info('Passed on property');
  }, []);

  const handleDiligencePurchase = useCallback(async (propertyId: number, diligenceType: string, cost: number, weeks: number) => {
    if (!gameRun) return;
    
    const property = properties.find(p => p.id === propertyId);
    const existingDiligence = completedDiligence[propertyId] || [];
    if (existingDiligence.includes(diligenceType)) {
      toast.error('Investigation already completed');
      return;
    }
    
    if (gameRun.cash < cost) {
      toast.error('Not enough cash for this investigation');
      return;
    }
    
    const weeksToDeduct = Math.ceil(weeks);
    const newWeeks = Math.max(0, gameRun.weeksRemaining - weeksToDeduct);
    
    try {
      if (cost > 0) {
        await createLedgerMutation.mutateAsync({
          gameRunId: gameRun.id,
          entries: [{
            direction: 'debit',
            category: 'due_diligence',
            amount: cost,
            description: `${diligenceType} - ${property?.name || 'Property'}`,
            propertyId,
          }],
          currentCash: gameRun.cash,
        });
      }

      await updateGameMutation.mutateAsync({
        id: gameRun.id,
        updates: { weeksRemaining: newWeeks },
      });

      await createInvestigationMutation.mutateAsync({
        gameRunId: gameRun.id,
        propertyId,
        investigationType: diligenceType,
        cost,
        weeksUsed: weeksToDeduct,
      });
      
      const newCompletedDiligence = [...(completedDiligence[propertyId] || []), diligenceType];
      
      setCompletedDiligence(prev => ({
        ...prev,
        [propertyId]: newCompletedDiligence,
      }));
      
      if (property) {
        const revealedIssues = gameRun.id > 0
          ? getRevealedRandomizedIssues(gameRun.id, property.id, property.propertyType || 'house', property.conditionTag || 'Fair', newCompletedDiligence, property.waterSource || 'public')
          : getRevealedIssues(property.name, newCompletedDiligence);
        const revealedIssueIds = revealedIssues.map(issue => issue.id);
        
        if (revealedIssueIds.length > 0) {
          setProFormaInputs(prev => ({
            ...prev,
            discoveredIssueIds: revealedIssueIds,
          }));
        }
      }
      
      const timeDisplay = `${weeksToDeduct} month${weeksToDeduct !== 1 ? 's' : ''}`;
      
      if (cost > 0) {
        setMoneyAnimationTrigger(Date.now());
      }
      
      toast.success(`Investigation complete! -$${cost.toLocaleString()}, -${timeDisplay}`);
    } catch (error) {
      toast.error('Failed to complete investigation');
    }
  }, [gameRun, properties, updateGameMutation, createInvestigationMutation, createLedgerMutation, completedDiligence]);

  const handleShowEndGameSummary = useCallback((isMidGame = false) => {
    if (gameRun) {
      const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 2);
      setEndGameWon(won);
      setEndGameMidGame(isMidGame);
      setShowEndGameSummary(true);
      clearSave();
    }
  }, [gameRun]);

  const handleNewGame = useCallback(async () => {
    // Record game end stats to Hall of Fame if there's an active game
    if (gameRun?.id) {
      try {
        const finalCash = gameRun.cash;
        const weeksRemaining = gameRun.weeksRemaining;
        const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 2);
        await api.endGame(gameRun.id, won, finalCash, weeksRemaining);
        console.log('Game stats recorded to Hall of Fame');
      } catch (err) {
        console.error('Failed to record game stats:', err);
      }
    }
    
    setShowEndGameSummary(false);
    sessionStorage.removeItem('currentGameRunId');
    sessionStorage.removeItem('skippedDiligenceDeals');
    setSkippedDiligenceDeals(new Set());
    setGameRun(null);
    setShowNameEntry(true);
    setCurrentScreen('market');
    // Reset premium popup flags so they don't trigger on fresh game
    setShowPremiumModal(false);
    setHasShownNoWeeksPopup(false);
    setHasShownLowCashPopup(false);
    clearSave();
  }, [gameRun]);

  const handleBackToMarket = useCallback(() => {
    setCurrentScreen('market');
    // Don't reset pro forma state - preserve user's work when going back
  }, []);

  const handleReturnToProperty = useCallback(() => {
    setCurrentScreen('detail');
  }, []);

  const handleProceedWithoutDiligence = useCallback(() => {
    if (!selectedProperty) return;
    setSkippedDiligenceDeals(prev => {
      const newSet = new Set(prev);
      newSet.add(selectedProperty.id);
      return newSet;
    });
    toast.warning('Proceeding without full due diligence - hidden issues may surface later!');
  }, [selectedProperty]);

  // Current week for market rate variability
  const currentWeek = gameRun?.weeksRemaining ? 52 - gameRun.weeksRemaining : 1;

  const handleInputsChange = useCallback((inputs: ProFormaInputs) => {
    let updatedInputs = inputs;
    
    const hasExplicitIssueSelection = inputs.fixedIssueIds !== undefined && inputs.fixedIssueIds.length > 0;
    
    if (hasExplicitIssueSelection) {
      updatedInputs = inputs;
    } else if (selectedProperty && inputs.rehabBudget !== undefined && inputs.rehabBudget > 0 && (!inputs.fixedIssueIds || inputs.fixedIssueIds.length === 0)) {
      const diligence = completedDiligence[selectedProperty.id] || [];
      const revealedIssues = gameRun && gameRun.id > 0
        ? getRevealedRandomizedIssues(gameRun.id, selectedProperty.id, selectedProperty.propertyType || 'house', selectedProperty.conditionTag || 'Fair', diligence, selectedProperty.waterSource || 'public')
        : getRevealedIssues(selectedProperty.name, diligence);
      
      const sortedIssues = [...revealedIssues].sort((a, b) => a.costRangeMax - b.costRangeMax);
      
      let remainingBudget = inputs.rehabBudget ?? 0;
      const fixedIds: string[] = [];
      
      for (const issue of sortedIssues) {
        if (remainingBudget >= issue.costRangeMax) {
          fixedIds.push(issue.id);
          remainingBudget -= issue.costRangeMax;
        }
      }
      
      updatedInputs = { ...inputs, fixedIssueIds: fixedIds };
    } else if (inputs.rehabBudget === 0 || inputs.rehabBudget === null || inputs.rehabBudget === undefined) {
      updatedInputs = { ...inputs, fixedIssueIds: [] };
    }
    
    setProFormaInputs(updatedInputs);
    if (isProFormaComplete && selectedProperty) {
      setProFormaOutputs(calculateProForma(updatedInputs, selectedProperty, playerFinancials, currentWeek));
    }
  }, [isProFormaComplete, selectedProperty, playerFinancials, currentWeek, completedDiligence, gameRun]);

  const handleFieldTouch = useCallback((fieldKey: keyof ProFormaInputs) => {
    setTouchedFields(prev => {
      const newSet = new Set(prev);
      newSet.add(fieldKey);
      return newSet;
    });
  }, []);

  const handleCalculate = useCallback(() => {
    if (selectedProperty) {
      const outputs = calculateProForma(proFormaInputs, selectedProperty, playerFinancials, currentWeek);
      setProFormaOutputs(outputs);
      setIsProFormaComplete(true);
      setProFormaCompletions(prev => ({
        ...prev,
        [selectedProperty.id]: true,
      }));
      completeAction('lock_proforma');
      toast.success('Pro forma calculated!');
    }
  }, [proFormaInputs, selectedProperty, playerFinancials, currentWeek, completeAction]);

  const [isCommittingDeal, setIsCommittingDeal] = useState(false);
  const [isAdvancingWeek, setIsAdvancingWeek] = useState(false);
  
  // Tenant text message state
  const [tenantTextPopup, setTenantTextPopup] = useState<{
    isOpen: boolean;
    tenant: Tenant | null;
    message: string;
  }>({ isOpen: false, tenant: null, message: '' });
  const [dealOutcome, setDealOutcome] = useState<{
    property: Property;
    totalCashRequired: number;
    downPayment: number;
    closingCosts: number;
    loanOriginationFee: number;
    loanAmount: number;
    strategy: 'rent' | 'flip';
  } | null>(null);
  
  const [rentalReveal, setRentalReveal] = useState<{
    isOpen: boolean;
    data: {
      propertyName: string;
      projectedRent: number;
      actualRent: number;
      projectedCashFlow: number;
      actualCashFlow: number;
      projectedVacancy: number;
      actualVacancy: number;
      projectedExpenses: number;
      actualExpenses: number;
      debtService: number;
      explanation: string;
      wasOptimistic: boolean;
      isInRehab: boolean;
      rehabMonths?: number;
    } | null;
  }>({ isOpen: false, data: null });

  const [dealCongrats, setDealCongrats] = useState<{
    isOpen: boolean;
    data: {
      propertyName: string;
      strategy: 'rent' | 'flip';
      totalCashInvested: number;
      ltv: number;
      cashFlow?: number;
      profit?: number;
      roi?: number;
      isFirstDeal?: boolean;
      didDueDiligence?: boolean;
      propertyPrice: number;
      dealCount?: number;
      hasUnfixedIssues?: boolean;
      unfixedIssueCount?: number;
      marketCondition?: string;
    } | null;
  }>({ isOpen: false, data: null });

  const [propertySoldAnim, setPropertySoldAnim] = useState<{
    isOpen: boolean;
    data: {
      propertyName: string;
      salePrice: number;
      purchasePrice: number;
      mortgagePayoff: number;
      netProceeds: number;
      saleProfit: number;
      isRental: boolean;
      rehabCost?: number;
      sellingCosts?: number;
      closingCosts?: number;
      holdingCosts?: number;
      loanFees?: number;
    } | null;
    proFormaProjections?: {
      projectedProfit?: number;
      projectedROI?: number;
      projectedMonthlyCashFlow?: number;
      projectedCashOnCash?: number;
      projectedSalePrice?: number;
      projectedRent?: number;
      projectedTotalExpenses?: number;
      totalRentalIncome?: number;
      totalExpensesPaid?: number;
      monthsHeld?: number;
      strategy: 'rent' | 'flip';
    } | null;
  }>({ isOpen: false, data: null, proFormaProjections: null });

  const [shareCardData, setShareCardData] = useState<{
    isOpen: boolean;
    data: {
      propertyName: string;
      salePrice: number;
      purchasePrice: number;
      rehabCost: number;
      saleProfit: number;
      strategy: 'flip' | 'rental';
      roi: number;
    } | null;
  }>({ isOpen: false, data: null });

  // Dequeue milestones one at a time, only when no other overlays/notifications are active
  const hasMilestoneBlockers = incomeEvents.length > 0 
    || constructionEvents.length > 0 
    || pendingTrophies.length > 0
    || tenantTextPopup.isOpen
    || propertySoldAnim.isOpen
    || dealCongrats.isOpen;

  useEffect(() => {
    if (activeMilestone !== null) return;
    if (milestoneQueue.length === 0) return;
    if (hasMilestoneBlockers) return;

    const timer = setTimeout(() => {
      const [next, ...rest] = milestoneQueue;
      setActiveMilestone(next);
      setMilestoneQueue(rest);
    }, 600);
    return () => clearTimeout(timer);
  }, [milestoneQueue, activeMilestone, hasMilestoneBlockers]);

  const handleCommitDeal = useCallback(async (skipBankruptcyCheck: boolean = false) => {
    // Guard against double-clicks
    if (isCommittingDeal) {
      return;
    }
    
    if (!gameRun || !selectedProperty || !proFormaOutputs) {
      toast.error('Missing required data. Please try again.');
      return;
    }

    const closingCosts = Math.round(selectedProperty.price * 0.025);
    const loanFeesPct = getLoanFeesFromLTV(proFormaInputs.ltv);
    const loanOriginationFee = Math.round((selectedProperty.price - proFormaOutputs.downPaymentAmount) * (loanFeesPct / 100));
    
    // Use totalCashInvested from pro forma as single source of truth
    // This includes: down payment + closing costs + loan fees + rehab + holding costs (for flips)
    const totalCashRequired = proFormaOutputs.totalCashInvested;
    
    // CASH VALIDATION - If purchase would push cash negative, surface a
    // "hold up, this will bankrupt you" confirmation instead of silently
    // letting the player proceed straight into a Game Over screen.
    if (!skipBankruptcyCheck && totalCashRequired > gameRun.cash) {
      setBankruptcyConfirm({
        required: totalCashRequired,
        cash: gameRun.cash,
        shortfall: totalCashRequired - gameRun.cash,
      });
      return;
    }
    
    const remainingAfterPurchase = gameRun.cash - totalCashRequired;
    if (!skipBankruptcyCheck && remainingAfterPurchase >= 0 && remainingAfterPurchase < 3000) {
      toast.warning(`After this purchase you'll only have $${remainingAfterPurchase.toLocaleString()} left. Monthly expenses could push you into bankruptcy — proceed carefully!`, { duration: 6000 });
    }
    
    setIsCommittingDeal(true);
    
    // Check contractor type for penalties
    const contractorType = proFormaInputs.contractorType ?? 'cheap';
    const isCheapContractor = contractorType === 'cheap';
    
    // Apply cheap contractor time penalty (-2 weeks immediately)
    if (isCheapContractor) {
      const updatedGameRun = await updateGameMutation.mutateAsync({
        id: gameRun.id,
        updates: { weeksRemaining: gameRun.weeksRemaining - 2 }
      });
      setGameRun(updatedGameRun);
      toast.warning('Cheap contractor: -2 months while they get started on the job.', { duration: 4000 });
    }
    
    // Apply rental management time penalties (tenant-pays-utilities setup)
    if (proFormaInputs.strategy === 'rent') {
      const timePenalty = calculateTimePenalty(proFormaInputs);
      if (timePenalty > 0) {
        const penalties: string[] = [];
        if (!proFormaInputs.utilities) {
          penalties.push(`Setting up tenant utilities: -${TIME_PENALTY_TENANT_PAYS_UTILITIES} months`);
        }
        const currentWeeks = gameRun.weeksRemaining - (isCheapContractor ? 2 : 0);
        const updatedGameRun = await updateGameMutation.mutateAsync({
          id: gameRun.id,
          updates: { weeksRemaining: currentWeeks - timePenalty }
        });
        setGameRun(updatedGameRun);
        toast.warning(penalties.join('. ') + '.', { duration: 4000 });
      }
    }

    try {
      const newDeal = await createDealMutation.mutateAsync({
        gameRunId: gameRun.id,
        propertyId: selectedProperty.id,
        strategy: proFormaInputs.strategy,
        proFormaInputs: proFormaInputs as any,
        proFormaOutputs: proFormaOutputs as any,
        actualProfit: null,
        status: 'planned',
        weeksSpent: null,
      });

      await createLedgerMutation.mutateAsync({
        gameRunId: gameRun.id,
        entries: [
          {
            direction: 'debit',
            category: 'down_payment',
            amount: proFormaOutputs.downPaymentAmount,
            description: `Down payment - ${selectedProperty.name}`,
            propertyId: selectedProperty.id,
            dealId: newDeal.id,
          },
          {
            direction: 'debit',
            category: 'closing_cost',
            amount: closingCosts,
            description: `Closing costs (2.5%) - ${selectedProperty.name}`,
            propertyId: selectedProperty.id,
            dealId: newDeal.id,
          },
          {
            direction: 'debit',
            category: 'loan_fee',
            amount: loanOriginationFee,
            description: `Loan origination fee (${loanFeesPct.toFixed(1)}%) - ${selectedProperty.name}`,
            propertyId: selectedProperty.id,
            dealId: newDeal.id,
          },
        ],
        currentCash: gameRun.cash,
      });

      if (proFormaInputs.strategy === 'flip') {
        const rehabBudget = proFormaInputs.rehabBudget ?? 0;
        const renovationWeeks = proFormaOutputs.renovationWeeks ?? 0;
        const renovationCost = proFormaOutputs.renovationCost ?? 0;
        const totalBudget = rehabBudget + renovationCost;
        const hasAppraisal = (completedDiligence[selectedProperty.id] || []).includes('appraisal');
        
        // If no rehab budget and no renovations, timeline is 0
        const baseRehabWeeks = totalBudget > 0 ? (proFormaInputs.rehabWeeks ?? 0) : 0;
        const totalWeeks = baseRehabWeeks + renovationWeeks;
        
        if (hasAppraisal) {
          const contingencyPct = proFormaInputs.contingencyPct ?? 0;
          const interestRate = getInterestRateFromLTV(proFormaInputs.ltv);
          const taxesAnnual = proFormaInputs.taxesAnnual ?? 0;
          const insuranceAnnual = proFormaInputs.insuranceAnnual ?? 0;
          
          const allInBasis = selectedProperty.price + closingCosts + totalBudget * (1 + contingencyPct / 100);
          const holdingCostPerWeek = Math.round((selectedProperty.price * (interestRate / 100) / 52) +
            (taxesAnnual / 52) + (insuranceAnnual / 52));
          const arvMid = (selectedProperty.arvMin + selectedProperty.arvMax) / 2;
          const profit = arvMid - allInBasis - (holdingCostPerWeek * totalWeeks);
          const roi = proFormaOutputs.totalCashInvested > 0 ? (profit / proFormaOutputs.totalCashInvested) * 100 : 0;
          setFlipMetrics({ profit, roi, holdWeeks: totalWeeks, hasAppraisal: true });
        } else {
          setFlipMetrics({ profit: 0, roi: 0, holdWeeks: totalWeeks, hasAppraisal: false });
        }

        // Start flip - if no budget at all, use 0 weeks (ready to list immediately)
        await api.startFlipRehab(newDeal.id, gameRun.id, totalWeeks);
        if (totalBudget > 0) {
          addConstructionStart(selectedProperty.name, 'flip', totalWeeks, totalBudget);
        } else {
          toast.success('Flip started! No renovations planned - ready to list immediately. Sale price will reflect property condition.');
        }
      } else {
        const rentalResult = await api.activateRental(newDeal.id, gameRun.id);
        
        if (rentalResult.titleIssue) {
          toast.error(`📜 Title Issue: ${rentalResult.titleIssue.name} - $${rentalResult.titleIssue.cost.toLocaleString()} to resolve! Should have done the title search.`, { duration: 8000 });
        }
        
        const repairIssues = rentalResult.surpriseIssues.filter((i: string) => !i.startsWith('Title:'));
        if (repairIssues.length > 0) {
          const repairCost = rentalResult.surpriseCosts - (rentalResult.titleIssue?.cost || 0);
          if (repairCost > 0) {
            toast.warning(`⚠️ Surprise repairs: $${repairCost.toLocaleString()} for ${repairIssues.join(', ')}. Your investment just got more expensive!`);
          }
        }

        const updatedGameRun = await api.getGameRun(gameRun.id);
        setGameRun(updatedGameRun);

        const dealOutputs = rentalResult.deal.proFormaOutputs as any;
        const dealInputs = rentalResult.deal.proFormaInputs as any;
        const dealSavedOutputs = dealOutputs || {};
        const projectedRent = dealInputs?.expectedRent || proFormaInputs.expectedRent || 0;
        const actualRent = dealSavedOutputs.monthlyGrossRent || projectedRent;
        const projectedVacancy = dealInputs?.vacancyRate ?? proFormaInputs.vacancyRate ?? 5;
        const actualVacancy = dealSavedOutputs.effectiveVacancyRate || projectedVacancy;
        const savedProjectedOutputs = dealSavedOutputs.debtServiceMonthly ? dealSavedOutputs : (proFormaOutputs || {});
        const projectedDebtService = savedProjectedOutputs.debtServiceMonthly || 0;
        const actualDebtService = dealSavedOutputs.monthlyDebtService || projectedDebtService;
        const projectedCF = savedProjectedOutputs.cashFlowMonthly || 0;
        const actualCF = dealSavedOutputs.cashFlowMonthly || 0;
        const projectedEffRent = projectedRent * (1 - projectedVacancy / 100);
        const projectedExpenses = Math.max(0, projectedEffRent - (savedProjectedOutputs.noiMonthly || 0));
        const actualExpenses = dealSavedOutputs.monthlyOperatingExpenses || projectedExpenses;
        const isInRehab = !!rentalResult.deal.rentalRehabActive;
        const rehabMonths = isInRehab ? (dealInputs?.rehabWeeks || 0) : undefined;

        const rc = rentalResult.realityCheck;
        let explanation = '';
        if (rc) {
          explanation = rc.explanation;
        } else if (Math.abs(actualCF - projectedCF) < 50) {
          explanation = 'Your projections were right on target. Good underwriting leads to predictable results.';
        } else if (actualCF > projectedCF) {
          explanation = 'The property is performing better than expected. Your conservative estimates gave you upside.';
        } else {
          explanation = 'Reality came in below your projections. Market conditions, property condition, and diligence depth all play a role.';
        }

        setRentalReveal({
          isOpen: false,
          data: {
            propertyName: selectedProperty.name,
            projectedRent,
            actualRent,
            projectedCashFlow: projectedCF,
            actualCashFlow: actualCF,
            projectedVacancy,
            actualVacancy,
            projectedExpenses,
            actualExpenses,
            debtService: actualDebtService,
            explanation,
            wasOptimistic: rc?.wasOptimistic ?? (actualCF < projectedCF),
            isInRehab,
            rehabMonths,
          },
        });
        
        if (rentalResult.awardedTrophies && rentalResult.awardedTrophies.length > 0) {
          addTrophies(rentalResult.awardedTrophies);
        }
      }

      // Store deal outcome for animation - this triggers the DealTransactionAnimation
      setDealOutcome({
        property: selectedProperty,
        totalCashRequired,
        downPayment: proFormaOutputs.downPaymentAmount,
        closingCosts,
        loanOriginationFee,
        loanAmount: selectedProperty.price - proFormaOutputs.downPaymentAmount,
        strategy: proFormaInputs.strategy,
      });

      // Trigger money animation
      setMoneyAnimationTrigger(totalCashRequired);

      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      
      // Animation onComplete callback will handle transitioning to results screen
    } catch (error: any) {
      setIsCommittingDeal(false);
      setDealOutcome(null);
      // Check for insufficient funds error
      if (error?.message?.includes('Insufficient funds')) {
        toast.error(error.message);
      } else if (error?.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        console.error('Deal commit error:', error);
        toast.error('Failed to save deal. Please try again.');
      }
    }
  }, [isCommittingDeal, gameRun, selectedProperty, proFormaOutputs, proFormaInputs, createDealMutation, createLedgerMutation, queryClient, updateGameMutation]);

  const handleAdvanceWeek = useCallback(async () => {
    if (!gameRun) return;

    setIsAdvancingWeek(true);
    try {
      const result = await api.advanceGameWeek(gameRun.id);

      const rentalPayments: Array<{ grossRent?: number }> = result.rentalPayments || [];
      const collectedAnyRent = rentalPayments.some(
        (p) => (p.grossRent ?? 0) > 0
      );
      if (collectedAnyRent) {
        setTimeout(() => playRentDayChime(), 700);
      }

      // Show income notifications for rental payments
      result.rentalPayments.forEach((payment: any) => {
        const property = properties.find(p => p.id === deals.find(d => d.id === payment.dealId)?.propertyId);
        const monthlyNet = (payment.grossRent || 0) - (payment.totalExpenses || 0);
        addRentalPayment(
          monthlyNet,
          payment.grossRent || 0,
          payment.totalExpenses || 0,
          property?.name
        );

        if (payment.proFormaComparison && !proFormaComparisonShown.has(payment.dealId)) {
          const comp = payment.proFormaComparison;
          const cashFlowDiff = comp.actualCashFlow - comp.projectedCashFlow;
          const pctDiff = comp.projectedCashFlow !== 0 ? Math.round((cashFlowDiff / Math.abs(comp.projectedCashFlow)) * 100) : 0;
          if (Math.abs(pctDiff) >= 5) {
            setProFormaComparisonShown(prev => new Set(prev).add(payment.dealId));
            if (comp.wasOptimistic) {
              toast.warning(
                `${comp.propertyName}: Cash flow is $${Math.abs(cashFlowDiff).toLocaleString()}/mo (${Math.abs(pctDiff)}%) below your pro forma. ${comp.explanation}`,
                { duration: 6000 }
              );
            } else {
              toast(`${comp.propertyName}: Cash flow is $${cashFlowDiff.toLocaleString()}/mo (+${pctDiff}%) above your pro forma projection!`, { duration: 5000 });
            }
          }
        }
      });

      // Show flip completion notifications
      result.completedFlips.forEach((flip: any) => {
        const deal = deals.find(d => d.id === flip.dealId);
        const property = properties.find(p => p.id === deal?.propertyId);
        
        // If this flip is ready to list (not sold yet), show construction complete notification
        if (flip.readyToList) {
          addConstructionComplete(property?.name || 'Property', 'flip');
          return; // Don't show flip proceeds for ready_to_list flips
        }
        
        addFlipProceeds(flip.salePrice, flip.profit, property?.name);
        
        // Show title issue warning if skipped title search
        if (flip.titleIssue) {
          toast.error(`Title Issue on ${property?.name || 'property'}: ${flip.titleIssue.name} - $${flip.titleIssue.cost.toLocaleString()} to resolve! Should have done the title search.`, { duration: 8000 });
        }
        
        // Show surprise costs warning if any hidden repair issues were discovered during flip
        const repairIssues = (flip.surpriseIssues || []).filter((i: string) => !i.startsWith('Title:'));
        if (repairIssues.length > 0) {
          const repairCost = flip.surpriseCosts - (flip.titleIssue?.cost || 0);
          if (repairCost > 0) {
            toast.warning(`Surprise repairs on ${property?.name || 'property'}: $${repairCost.toLocaleString()} for ${repairIssues.join(', ')}. This cut into your profit!`);
          }
        }
      });
      
      // Show beautiful rental rehab completion notifications with rent increase
      if (result.completedRentalRehabs && result.completedRentalRehabs.length > 0) {
        result.completedRentalRehabs.forEach((rehab: any) => {
          const newNet = rehab.newNetRent ?? rehab.newMonthlyRent;
          const oldNet = rehab.previousNetRent ?? rehab.previousRent;
          const netIncrease = newNet - oldNet;
          addConstructionComplete(
            rehab.propertyName, 
            'rent', 
            netIncrease > 0 ? netIncrease : undefined,
            oldNet,
            newNet
          );
        });
      }

      // Show lease renewal notifications
      if (result.curveballs && result.curveballs.length > 0) {
        const leaseRenewals = result.curveballs.filter((c: any) => c.id === 'lease_renewal');
        for (const renewal of leaseRenewals) {
          if (renewal.type === 'positive') {
            toast.success(`${renewal.emoji} ${renewal.description}`, { duration: 5000 });
          } else if (renewal.type === 'negative') {
            toast.warning(`${renewal.emoji} ${renewal.description}`, { duration: 5000 });
          } else {
            toast(`${renewal.emoji} ${renewal.description}`, { duration: 4000 });
          }
        }

        const moveIns = result.curveballs.filter((c: any) => c.id === 'tenant_move_in');
        for (const moveIn of moveIns) {
          if (moveIn.type === 'positive') {
            toast.success(`${moveIn.emoji} ${moveIn.description}`, { duration: 6000 });
          } else if (moveIn.type === 'negative') {
            toast.warning(`${moveIn.emoji} ${moveIn.description}`, { duration: 6000 });
          } else {
            toast(`${moveIn.emoji} ${moveIn.description}`, { duration: 5000 });
          }
        }

        // Tenant move-OUT events (departure, life change, non-renewal) — keep player informed
        const departures = result.curveballs.filter((c: any) =>
          c.id === 'tenant_departure_conditions' ||
          c.id === 'tenant_departure_life' ||
          c.id === 'tenant_nonrenewal'
        );
        for (const dep of departures) {
          toast.warning(`${dep.emoji} ${dep.name}: ${dep.description}`, { duration: 7000 });
        }
        // If anyone moved out, force tenant cache refresh so names/personalities sync everywhere
        if (departures.length > 0 || moveIns.length > 0) {
          queryClient.invalidateQueries({ queryKey: ['tenants'] });
          queryClient.invalidateQueries({ queryKey: ['/api/game-runs', gameRun.id, 'tenants'] });
        }
      }

      if (result.marketChanged && result.marketCondition) {
        const marketLabels: Record<string, string> = {
          terrible: 'Terrible',
          poor: 'Poor',
          neutral: 'Neutral',
          good: 'Good',
          excellent: 'Excellent',
        };
        const label = marketLabels[result.marketCondition] || result.marketCondition;
        const hasRentals = deals.some(d => d.status === 'active_rental');
        const rentNote = hasRentals ? ' This will affect your next lease renewal.' : '';
        toast(`📊 Market shifted to ${label}.${rentNote}`, { duration: 4000 });
      }

      if (result.passiveIncomeMilestones && result.passiveIncomeMilestones.length > 0) {
        setMilestoneQueue(prev => [...prev, ...result.passiveIncomeMilestones]);
      }

      const updatedGameRun = await api.getGameRun(gameRun.id);
      setGameRun(updatedGameRun);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });

      // If player went bankrupt this week, stop processing immediately
      if (updatedGameRun.cash < 0) {
        setCurrentScreen('market');
        return;
      }

      // Create tenants for newly activated rentals and possibly trigger text messages
      try {
        const updatedDeals = await api.getDeals(gameRun.id);
        const activeRentals = updatedDeals.filter((d: Deal) => d.status === 'active_rental');
        
        // Batch fetch tenants once to avoid N+1 queries
        const existingTenants = await api.getTenants(gameRun.id);
        const tenantDealIds = new Set(existingTenants.map(t => t.dealId));
        
        // Create tenants only for rentals that don't have one yet
        const rentalsNeedingTenants = activeRentals.filter(r => !tenantDealIds.has(r.id) && !r.rentalRehabActive);
        for (const rental of rentalsNeedingTenants) {
          try {
            // Get monthly rent from pro forma outputs to determine property class
            // This affects tenant personality distribution (budget=casual, luxury=refined)
            const proFormaOutputs = rental.proFormaOutputs as any;
            const monthlyRent = proFormaOutputs?.monthlyGrossRent || proFormaOutputs?.grossRent || undefined;
            
            // Personality weighted by property class - budget tenants more casual, luxury more refined
            const personalityType = getRandomPersonalityType(monthlyRent);
            const name = generateTenantName();
            const speechPatterns = getSpeechPatterns(personalityType);
            const paymentEthic = getRandomPaymentEthic();
            
            await api.createTenant(rental.id, {
              name,
              personalityType,
              speechPatterns,
              paymentEthic,
            });
          } catch (err) {
            // Silently continue - tenant creation is non-critical
            console.error('Failed to create tenant:', err);
          }
        }
        
        // Handle tenant text messages - prioritize expense-linked messages from curveballs
        // Refetch tenants to include newly created ones
        const allTenants = rentalsNeedingTenants.length > 0 
          ? await api.getTenants(gameRun.id) 
          : existingTenants;
        
        if (allTenants.length > 0) {
          // Helper to check if a deal is self-managed (no property manager)
          const isDealSelfManaged = (dealId: number) => {
            const deal = updatedDeals.find((d: Deal) => d.id === dealId);
            if (!deal) return false;
            const inputs = deal.proFormaInputs as ProFormaInputs;
            return !inputs.propertyManagement; // true if NO property manager (self-managed)
          };
          
          // Filter to only self-managed rentals (PM handles tenant communications for managed properties)
          const selfManagedTenants = allTenants.filter(t => isDealSelfManaged(t.dealId));
          
          // Check if any rental payment had a curveball with tenant messages
          let expenseMessageShown = false;
          
          for (const payment of result.rentalPayments) {
            // Skip tenant texts for managed properties (PM handles this)
            if (!isDealSelfManaged(payment.dealId)) continue;
            
            // Check if curveball has a tenant message (now provided by server with correct personality)
            if (payment.curveball?.id) {
              // Use server-provided tenant message if available (ensures consistency with personality)
              const serverTenantMessage = payment.curveball.tenantMessage;
              
              if (serverTenantMessage) {
                // Find the tenant for this deal
                const tenantForDeal = selfManagedTenants.find(t => t.dealId === payment.dealId);
                if (tenantForDeal) {
                  // Add context if this repair was caused by an undiscovered property issue
                  let finalMessage = serverTenantMessage;
                  if (payment.curveball.fromIssue) {
                    // The repair was caused by skipping due diligence - this is educational
                    console.log(`Repair triggered by undiscovered issue: ${payment.curveball.issueId}`);
                  }
                  
                  setTenantTextPopup({
                    isOpen: true,
                    tenant: tenantForDeal,
                    message: finalMessage,
                  });
                  expenseMessageShown = true;
                  break; // Only show one expense message per week advancement
                }
              } else {
                // Fallback: look up curveball definition and generate message client-side
                const fullCurveball = getCurveballById(payment.curveball.id);
                
                if (!fullCurveball) {
                  console.warn(`Curveball id "${payment.curveball.id}" not found in definitions`);
                  continue;
                }
                
                if (curveballHasTenantMessage(fullCurveball)) {
                  const tenantForDeal = selfManagedTenants.find(t => t.dealId === payment.dealId);
                  if (tenantForDeal) {
                    const personalityType = tenantForDeal.personalityType || 'generic';
                    const expenseMessage = getTenantMessageForCurveball(
                      fullCurveball,
                      personalityType
                    );
                    
                    if (expenseMessage) {
                      setTenantTextPopup({
                        isOpen: true,
                        tenant: tenantForDeal,
                        message: expenseMessage,
                      });
                      expenseMessageShown = true;
                      break;
                    }
                  }
                }
              }
            }
          }
          
          if (!expenseMessageShown) {
            for (const payment of result.rentalPayments) {
              if (!isDealSelfManaged(payment.dealId)) continue;
              if (payment.latePayment) {
                const tenantForDeal = selfManagedTenants.find(t => t.dealId === payment.dealId);
                if (tenantForDeal) {
                  setTenantTextPopup({
                    isOpen: true,
                    tenant: tenantForDeal,
                    message: payment.latePayment.tenantMessage,
                  });
                  break;
                }
              }
            }
          }
        }
      } catch (err) {
        // Tenant feature errors should not break week advancement
        console.error('Tenant feature error:', err);
      }

      toast.success(`Month ${result.newWeek} complete!`);

      const STATS_REMINDER_MONTHS = [10, 20, 30, 40];
      if (STATS_REMINDER_MONTHS.includes(result.newWeek)) {
        setTimeout(() => {
          let message = '';
          if (result.newWeek === 10) {
            message = "10 months in — check your Performance Stats to see your investor profile. Open the menu to view.";
          } else if (result.newWeek === 20) {
            message = "20 months in. How's your strategy shaping up? Tap the menu to review your Performance Stats.";
          } else if (result.newWeek === 30) {
            message = "Past the halfway mark. Your scorecard is tracking your progress — review it in the menu.";
          } else if (result.newWeek === 40) {
            message = "12 months left. Time to review your benchmarks and make final moves. Check Performance Stats.";
          }
          if (message) {
            toast(message, { duration: 5000 });
          }
        }, 2000);
      }
    } catch (error: any) {
      // Season gate — server says player has used all 52 weeks of the current season.
      // Open the SeasonEndModal which lets the player watch a sponsor video to unlock more.
      if (error?.code === 'season_ended') {
        // Capture the recap snapshot before opening — server resets these on unlock.
        setSeasonEndSnapshot({
          seasonStats: error.seasonStats ?? {
            bestDealProfit: 0, bestDealLabel: '', totalCashFlow: 0,
            dealsClosed: 0, profitableThisSeason: 0, xpEarnedThisSeason: 0,
          },
          currentStreak: error.currentStreak ?? 0,
          bestStreak: error.bestStreak ?? 0,
          cash: error.cash ?? gameRun.cash,
        });
        setShowSeasonEndModal(true);
      } else {
        toast.error(error.message || 'Failed to advance month');
        try {
          const recoveredRun = await api.getGameRun(gameRun.id);
          if (recoveredRun) setGameRun(recoveredRun);
        } catch {}
      }
    } finally {
      setIsAdvancingWeek(false);
    }
  }, [gameRun, queryClient, addRentalPayment, addFlipProceeds, properties, deals]);

  // Called by SeasonEndModal after the rewarded video completes.
  // Hits the unlock endpoint, refreshes local state, shows the bonus celebration.
  const handleSeasonUnlocked = useCallback(async () => {
    if (!gameRun) throw new Error('No active game');
    const result = await api.unlockSeason(gameRun.id);
    setGameRun(result.gameRun);
    queryClient.invalidateQueries({ queryKey: ['ledger'] });
    queryClient.invalidateQueries({ queryKey: ['/api/game-runs', gameRun.id] });
    return { bonus: result.bonus, nextSeason: result.seasonsUnlocked };
  }, [gameRun, queryClient]);

  const handleSellRental = useCallback(async (dealId: number) => {
    if (!gameRun) {
      throw new Error('No active game found');
    }
    
    const prevXp = gameRun.xp ?? 0;
    const prevStreak = gameRun.currentStreak ?? 0;
    const result = await api.sellRental(dealId, gameRun.id);

    // Fire XP/tier-up flash if the server awarded XP for this close.
    const nextXp = result.gameRun.xp ?? prevXp;
    const xpGained = nextXp - prevXp;
    if (xpGained > 0) {
      setXpFlash({
        id: Date.now(),
        xpGained,
        newXp: nextXp,
        prevXp,
        newStreak: result.gameRun.currentStreak ?? 0,
        prevStreak,
      });
    }

    setGameRun(result.gameRun);
    
    const deal = deals.find(d => d.id === dealId);
    const property = properties.find(p => p.id === deal?.propertyId);
    
    const pfi = deal?.proFormaInputs && typeof deal.proFormaInputs === 'object' ? deal.proFormaInputs as any : {};
    const pfo = deal?.proFormaOutputs && typeof deal.proFormaOutputs === 'object' ? deal.proFormaOutputs as any : {};
    const rentalRehab = pfi.rehabBudget || 0;
    const rPurchasePrice = deal?.purchasePrice || property?.price || 0;
    const rClosingCosts = Math.round(rPurchasePrice * 0.025);
    const rLoanAmount = pfo.loanAmount || 0;
    const rLoanOriginationPct = pfi.loanOriginationPct ?? 2;
    const rLoanFees = Math.round(rLoanAmount * (rLoanOriginationPct / 100));
    const rSellingCostsPct = pfi.sellingCostsPct || 5;
    const rSellingCosts = Math.round(result.salePrice * (rSellingCostsPct / 100));

    const rentalMonthsHeld = deal?.weeksUntilCompletion || (gameRun ? Math.max(1, gameRun.currentWeek - (deal?.lastIncomePaymentWeek || 0)) : 1);
    const projectedMonthlyCashFlow = pfo.cashFlowMonthly || 0;
    const projectedCashOnCash = pfo.cashOnCash || 0;
    const projectedRent = pfi.expectedRent || pfi.monthlyRent || 0;
    const actualMonthlyCashFlow = deal?.weeklyIncome || 0;
    const totalRentalIncomeCollected = (deal?.weeklyIncome || 0) * rentalMonthsHeld;

    setPropertySoldAnim({
      isOpen: true,
      data: {
        propertyName: property?.name || 'Property',
        salePrice: result.salePrice,
        purchasePrice: rPurchasePrice,
        mortgagePayoff: result.mortgagePayoff,
        netProceeds: result.netProceeds,
        saleProfit: result.saleProfit,
        isRental: true,
        rehabCost: rentalRehab,
        sellingCosts: rSellingCosts,
        closingCosts: rClosingCosts,
        loanFees: rLoanFees,
      },
      proFormaProjections: {
        strategy: 'rent',
        projectedProfit: projectedMonthlyCashFlow * rentalMonthsHeld,
        projectedMonthlyCashFlow,
        projectedCashOnCash,
        projectedRent,
        monthsHeld: rentalMonthsHeld,
        actualMonthlyCashFlow,
        totalRentalIncomeCollected,
      },
    });
    
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    queryClient.invalidateQueries({ queryKey: ['ledger'] });
  }, [gameRun, deals, properties, queryClient]);

  const handleSellFlip = useCallback(async (dealId: number) => {
    if (!gameRun) {
      throw new Error('No active game found');
    }
    
    const prevXp = gameRun.xp ?? 0;
    const prevStreak = gameRun.currentStreak ?? 0;
    const result = await api.sellFlip(dealId, gameRun.id);

    const nextXp = result.gameRun.xp ?? prevXp;
    const xpGained = nextXp - prevXp;
    if (xpGained > 0) {
      setXpFlash({
        id: Date.now(),
        xpGained,
        newXp: nextXp,
        prevXp,
        newStreak: result.gameRun.currentStreak ?? 0,
        prevStreak,
      });
    }

    setGameRun(result.gameRun);
    
    const deal = deals.find(d => d.id === dealId);
    const property = properties.find(p => p.id === deal?.propertyId);
    const fpfi = deal?.proFormaInputs && typeof deal.proFormaInputs === 'object' ? deal.proFormaInputs as any : {};
    const fpfo = deal?.proFormaOutputs && typeof deal.proFormaOutputs === 'object' ? deal.proFormaOutputs as any : {};
    const flipPurchasePrice = deal?.purchasePrice || property?.price || 0;
    const flipRehabBudget = fpfi.rehabBudget || 0;
    const flipClosingCosts = Math.round(flipPurchasePrice * 0.025);
    const flipLoanAmount = fpfo.loanAmount || 0;
    const flipLoanOriginationPct = fpfi.loanOriginationPct ?? 2;
    const flipLoanFees = Math.round(flipLoanAmount * (flipLoanOriginationPct / 100));
    const flipSellingCostsPct = fpfi.sellingCostsPct || 5;
    const flipSellingCosts = Math.round(result.salePrice * (flipSellingCostsPct / 100));
    const flipInterestRate = fpfo.interestRate || fpfi.interestRate || 0;
    const flipTaxesAnnual = fpfi.taxesAnnual || 0;
    const flipInsuranceAnnual = fpfi.insuranceAnnual || 0;
    const flipRehabWeeks = deal?.weeksUntilCompletion || fpfi.rehabWeeks || 0;
    const flipHoldingPerWeek = Math.round(
      (flipLoanAmount * (flipInterestRate / 100) / 52) +
      (flipTaxesAnnual / 52) +
      (flipInsuranceAnnual / 52)
    );
    const flipHoldingCosts = flipHoldingPerWeek * flipRehabWeeks;
    
    const flipProjectedProfit = fpfo.flipProfit || 0;
    const flipProjectedROI = fpfo.flipROI || 0;
    const flipProjectedSalePrice = fpfo.arvWithFinishBoost || fpfo.arv || fpfi.arv || 0;

    setPropertySoldAnim({
      isOpen: true,
      data: {
        propertyName: property?.name || 'Property',
        salePrice: result.salePrice,
        purchasePrice: flipPurchasePrice,
        mortgagePayoff: result.mortgagePayoff || 0,
        netProceeds: result.netProceeds || result.salePrice,
        saleProfit: result.saleProfit,
        isRental: false,
        rehabCost: flipRehabBudget,
        sellingCosts: flipSellingCosts,
        closingCosts: flipClosingCosts,
        holdingCosts: flipHoldingCosts,
        loanFees: flipLoanFees,
      },
      proFormaProjections: {
        strategy: 'flip',
        projectedProfit: flipProjectedProfit,
        projectedROI: flipProjectedROI,
        projectedSalePrice: flipProjectedSalePrice,
        projectedTotalExpenses: flipRehabBudget + flipClosingCosts + flipLoanFees,
        monthsHeld: flipRehabWeeks,
      },
    });
    
    if (result.awardedTrophies && result.awardedTrophies.length > 0) {
      addTrophies(result.awardedTrophies);
    }
    
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    queryClient.invalidateQueries({ queryKey: ['ledger'] });
  }, [gameRun, deals, properties, queryClient, addTrophies]);

  const handleOpenRefinanceModal = useCallback(async (dealId: number) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const property = properties.find(p => p.id === deal.propertyId);
    if (!property) return;
    
    setRefinancingDeal({ deal, property });
  }, [deals, properties]);

  // Open contractor walkthrough modal
  const handleOpenWalkthroughModal = useCallback((dealId: number) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const property = properties.find(p => p.id === deal.propertyId);
    if (!property) return;
    
    setWalkthroughDeal({ deal, property });
  }, [deals, properties]);

  // Handle walkthrough completion - refresh deals
  const handleWalkthroughComplete = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deals'] });
    queryClient.invalidateQueries({ queryKey: ['ledger'] });
    if (gameRun) {
      api.getGameRun(gameRun.id).then(setGameRun).catch(console.error);
    }
  }, [queryClient, gameRun]);

  // Execute refinance with selected LTV from modal
  const handleExecuteRefinance = useCallback(async (dealId: number, selectedLtv: number) => {
    if (!gameRun) return;
    
    try {
      const result = await api.refinanceRental(dealId, gameRun.id, selectedLtv);
      
      // Update game state with new cash
      setGameRun(result.gameRun);
      
      // Find property name for toast
      const deal = deals.find(d => d.id === dealId);
      const property = properties.find(p => p.id === deal?.propertyId);
      
      toast.success(
        `Refinanced ${property?.name || 'property'}! Cash out: $${result.cashOut.toLocaleString()} @ ${result.newInterestRate.toFixed(2)}%`,
        { duration: 6000 }
      );
      
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to refinance property');
    }
  }, [gameRun, deals, properties, queryClient]);

  // Show confirmation dialog before selling
  const handleSellProperty = useCallback((dealId: number, strategy: 'rent' | 'flip') => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    const property = properties.find(p => p.id === deal.propertyId);
    const purchasePrice = deal.purchasePrice || property?.price || 0;
    
    const marketCondition = (gameRun as any)?.marketCondition || 'neutral';
    const { min: minSale, max: maxSale } = getSaleEstimateRange(purchasePrice, marketCondition);
    
    setPendingSale({
      dealId,
      strategy,
      propertyName: property?.name || 'Property',
      purchasePrice,
      minSale,
      maxSale,
    });
  }, [deals, properties, gameRun]);
  
  // Actually execute the sale after confirmation
  const confirmSale = useCallback(async () => {
    if (!pendingSale || isSelling) return;
    
    const { dealId, strategy } = pendingSale;
    setIsSelling(true);
    
    try {
      if (strategy === 'rent') {
        await handleSellRental(dealId);
      } else {
        await handleSellFlip(dealId);
      }
      setPendingSale(null);
    } catch (error: any) {
      console.error('confirmSale: sale failed', error);
      toast.error(error.message || 'Failed to complete sale');
    } finally {
      setIsSelling(false);
    }
  }, [pendingSale, isSelling, handleSellRental, handleSellFlip]);
  
  const cancelSale = useCallback(() => {
    setPendingSale(null);
  }, []);

  const handleContinueFromResults = useCallback(() => {
    setCurrentScreen('market');
    setIsProFormaComplete(false);
    setProFormaOutputs(null);
    setProFormaInputs(defaultProForma);
    setSelectedPropertyId(null);
    setFlipMetrics({ profit: 0, roi: 0, holdWeeks: 0, hasAppraisal: false });
  }, []);

  const handlePremiumPurchase = useCallback(async (type: 'cash' | 'weeks' | 'bundle', cashAmount: number, weeksAmount?: number) => {
    if (!gameRun) return;

    try {
      let sku: string;
      if (type === 'cash') {
        sku = cashAmount >= 500000 ? 'cash_large' : cashAmount >= 150000 ? 'cash_medium' : 'cash_small';
      } else if (type === 'weeks') {
        const weeks = weeksAmount || 0;
        sku = weeks >= 24 ? 'weeks_large' : weeks >= 12 ? 'weeks_medium' : 'weeks_small';
      } else {
        sku = cashAmount >= 300000 ? 'bundle_pro' : 'bundle_starter';
      }
      await purchaseSkuMutation.mutateAsync({ gameRunId: gameRun.id, sku });
    } catch (error) {
      toast.error('Purchase failed');
    }
  }, [gameRun, purchaseSkuMutation]);

  // Check if player is bankrupt (cash below zero)
  const isBankrupt = gameRun && gameRun.cash < 0;
  
  // When bankruptcy is detected, clean up any in-progress state and ensure market screen
  useEffect(() => {
    if (isBankrupt) {
      setIsCommittingDeal(false);
      setDealOutcome(null);
      setShowPremiumModal(false);
      setTenantTextPopup({ isOpen: false, tenant: null, message: '' });
      if (currentScreen === 'results' || currentScreen === 'detail' || currentScreen === 'proforma') {
        setCurrentScreen('market');
      }
    }
  }, [isBankrupt]);
  // Auto-show premium popup when cash is low (removed weeks freeze - players can keep playing)
  const hasActiveRehab = useMemo(() => {
    return deals.some(d => d.rentalRehabActive || d.status === 'in_rehab');
  }, [deals]);
  
  useEffect(() => {
    if (!gameRun || isBankrupt) return;
    
    // Check for low cash (below $1,000) - but not if player just started a renovation
    if (gameRun.cash < 1000 && gameRun.weeksRemaining > 0 && !hasShownLowCashPopup && !showPremiumModal && !hasActiveRehab) {
      setPremiumTriggerReason('low_cash');
      setShowPremiumModal(true);
      setHasShownLowCashPopup(true);
    }
  }, [gameRun?.weeksRemaining, gameRun?.cash, isBankrupt, hasShownLowCashPopup, showPremiumModal, hasActiveRehab]);

  // Handle Stripe checkout return
  useEffect(() => {
    if (!gameRun?.id) return;

    const params = new URLSearchParams(window.location.search);
    const checkout = params.get('checkout');
    const sessionId = params.get('session_id');

    if (checkout === 'success' && sessionId) {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);

      // Verify session and apply boost
      (async () => {
        try {
          const response = await fetch('/api/stripe/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const data = await response.json();
          if (data.success && data.gameRun) {
            setGameRun(data.gameRun);
            queryClient.invalidateQueries({ queryKey: ['/api/games', gameRun.id] });
          }
        } catch (error) {
          console.error('Failed to verify checkout:', error);
        }
      })();
    } else if (checkout === 'cancelled') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [gameRun?.id]);

  const handleBankruptReturnHome = useCallback(async () => {
    // Record game end stats to Hall of Fame before resetting
    if (gameRun?.id) {
      try {
        const finalCash = gameRun.cash;
        const weeksRemaining = gameRun.weeksRemaining;
        const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 2);
        await api.endGame(gameRun.id, won, finalCash, weeksRemaining);
        console.log('Game stats recorded to Hall of Fame');
      } catch (err) {
        console.error('Failed to record game stats:', err);
      }
    }
    
    // Reset game state and go back to name entry
    clearSave();
    setGameRun(null);
    setShowNameEntry(true);
    setCurrentScreen('market');
    setSelectedPropertyId(null);
    setProFormaInputs(defaultProForma);
    setProFormaOutputs(null);
    setIsProFormaComplete(false);
    setCompletedDiligence({});
    setProFormaCompletions({});
    // Reset premium popup flags so they don't trigger on fresh game
    setShowPremiumModal(false);
    setHasShownNoWeeksPopup(false);
    setHasShownLowCashPopup(false);
    queryClient.invalidateQueries();
  }, [queryClient, gameRun]);

  const handleBankruptTryAgain = useCallback(async () => {
    if (!playerName) {
      handleBankruptReturnHome();
      return;
    }
    
    // Get the old game run ID before we start
    const oldGameRunId = gameRun?.id;
    
    // Record game end stats to Hall of Fame before starting new game
    if (oldGameRunId && gameRun) {
      try {
        const finalCash = gameRun.cash;
        const weeksRemaining = gameRun.weeksRemaining;
        const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 2);
        await api.endGame(oldGameRunId, won, finalCash, weeksRemaining);
        console.log('Game stats recorded to Hall of Fame');
      } catch (err) {
        console.error('Failed to record game stats:', err);
      }
    }
    
    // Start a fresh game with the same player name
    try {
      // First, cancel all in-flight queries to prevent race conditions
      await queryClient.cancelQueries();
      
      // Remove old game-specific query data from cache to prevent stale data
      if (oldGameRunId) {
        queryClient.removeQueries({ queryKey: ['deals', oldGameRunId] });
        queryClient.removeQueries({ queryKey: ['investigations', oldGameRunId] });
        queryClient.removeQueries({ queryKey: ['ledger', oldGameRunId] });
        queryClient.removeQueries({ queryKey: ['tenants', oldGameRunId] });
      }
      
      const newRun = await api.createGameRun({
        playerName: playerName,
        difficulty: 'apprentice',
        cash: STARTING_CASH,
        weeksRemaining: 52,
        currentWeek: 0,
        profitableDeals: 0,
        goalDeals: 2,
        status: 'active',
      });
      
      // Reset all local state first
      setCurrentScreen('market');
      setSelectedPropertyId(null);
      setProFormaInputs(defaultProForma);
      setProFormaOutputs(null);
      setIsProFormaComplete(false);
      setCompletedDiligence({});
      setProFormaCompletions({});
      // Reset premium popup flags so they don't trigger on fresh game
      setShowPremiumModal(false);
      setHasShownNoWeeksPopup(false);
      setHasShownLowCashPopup(false);
      
      // Now set the new game run - this will trigger fresh queries with the new ID
      setGameRun(newRun);
      
      // Don't invalidate properties - they're global and don't change between games
      // Just invalidate queries that are game-specific (they'll use the new gameRun.id)
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['investigations'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      
      toast.success('New game started!');
    } catch (error) {
      toast.error('Failed to start new game');
      handleBankruptReturnHome();
    }
  }, [playerName, gameRun?.id, queryClient, handleBankruptReturnHome]);

  if (isLoadingGame && !gameRun) {
    return (
      <div 
        className="min-h-screen bg-[hsl(220,14%,6%)]"
        data-game-area
      >
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      </div>
    );
  }

  if (showNameEntry) {
    return (
      <div 
        className="min-h-screen bg-[hsl(220,14%,6%)]"
        data-game-area
      >
        <div className="min-h-screen">
          <PlayerNameModal
            isOpen={showNameEntry && !showHallOfFame}
            onSubmit={startNewGame}
            onViewHallOfFame={() => setShowHallOfFame(true)}
            savedGameInfo={savedGameInfo}
            onContinueSavedGame={continueSavedGame}
            checkExistingGame={async (name: string) => {
              const result = await api.getActiveGameByPlayer(name);
              return result;
            }}
            onResumeGame={(existingRun) => {
              setGameRun(existingRun);
              setPlayerName(existingRun.playerName);
              setShowNameEntry(false);
              sessionStorage.setItem('currentGameRunId', String(existingRun.id));
            }}
            onNewGameReplace={async (name: string, existingGameId: number) => {
              await api.deleteGameRun(existingGameId);
              sessionStorage.removeItem('currentGameRunId');
              setGameRun(null);
              await startNewGame(name);
            }}
          />
          <HallOfFameModal
            isOpen={showHallOfFame}
            onClose={() => setShowHallOfFame(false)}
          />
          {isLoadingGame && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-2">Failed to load game</p>
          <p className="text-sm text-muted-foreground">{gameError.message}</p>
          <button 
            onClick={() => setShowNameEntry(true)}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white/80 rounded-lg font-medium transition-colors duration-150"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!gameRun) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
      </div>
    );
  }

  // Screen transition variants
  const screenVariants = {
    initial: { opacity: 0, x: 30, scale: 0.98 },
    animate: { opacity: 1, x: 0, scale: 1 },
    exit: { opacity: 0, x: -30, scale: 0.98 }
  };

  const screenTransition = {
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1]
  };

  return (
    <div
      className="bg-[hsl(220,14%,6%)] min-h-screen min-h-[100dvh]"
      data-testid="game-screen"
      data-game-area
    >

      {/* Fixed header at top of viewport - safe area handled by StatusBar */}
      {currentScreen !== 'home' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[hsl(220,14%,8%)] border-b border-white/6 pointer-events-auto overflow-hidden" style={{ isolation: 'isolate' }}>
          <StatusBar
            cash={gameRun.cash}
            weeksRemaining={gameRun.weeksRemaining}
            seasonsUnlocked={gameRun.seasonsUnlocked ?? 1}
            currentStreak={gameRun.currentStreak ?? 0}
            profitableDeals={gameRun.profitableDeals}
            goalDeals={gameRun.goalDeals}
            onOpenLedger={() => setShowLedger(true)}
            onOpenPremium={() => {
              setPremiumTriggerReason('manual');
              setShowPremiumModal(true);
            }}
            onOpenHallOfFame={() => setShowHallOfFame(true)}
            onViewStats={() => handleShowEndGameSummary(true)}
            onAdvanceWeek={currentScreen === 'market' ? handleAdvanceWeek : undefined}
            isAdvancingWeek={isAdvancingWeek}
            onNewGame={handleNewGame}
            onGoHome={() => setCurrentScreen('home')}
          />
          {/* Market Condition Indicator - compact on mobile */}
          <div className="px-3 pb-2 pt-0.5">
            <MarketBar 
              condition={(gameRun.marketCondition as MarketCondition) || 'good'} 
              compact={true}
              className="w-full max-w-xs mx-auto md:max-w-sm"
            />
          </div>
        </div>
      )}
      
      {/* Main content with top padding to account for fixed header + safe area + market bar */}
      <div ref={mainContentRef} className={`min-h-screen min-h-[100dvh] ${currentScreen !== 'home' ? 'pt-36 md:pt-44' : ''} overflow-y-auto`}>
        <SaveIndicator />

        <main className="w-full px-4 lg:px-6 xl:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
          {currentScreen === 'home' && (
            <motion.div
              key="home"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={screenVariants}
              transition={screenTransition}
            >
              <GameHomeScreen
                playerName={playerName || 'Player'}
                hasActiveGame={deals.length > 0 || (gameRun?.weeksRemaining ?? 52) < 52}
                onPlayGame={() => setCurrentScreen('market')}
                onHallOfFame={() => setShowHallOfFame(true)}
                onBadges={() => setShowBadges(true)}
                onTutorial={() => { startTutorial(); setCurrentScreen('market'); }}
                onRestartGame={handleNewGame}
                earnedTrophies={unlockedAchievements}
                cash={gameRun.cash}
                weeksRemaining={gameRun.weeksRemaining}
                profitableDeals={gameRun.profitableDeals}
                goalDeals={gameRun.goalDeals}
              />
            </motion.div>
          )}

          {currentScreen === 'market' && (
            <motion.div
              key="market"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={screenVariants}
              transition={screenTransition}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-[1800px] mx-auto"
            >
              <div className="lg:col-span-9 xl:col-span-9">
                <PropertySelector
                  properties={properties}
                  selectedId={selectedPropertyId}
                  onSelect={handlePropertyClick}
                  locationFilter={locationFilter}
                  onLocationFilterChange={setLocationFilter}
                  propertiesWithInvestigations={new Set(investigations.map(inv => inv.propertyId))}
                  propertyDeals={deals.map(d => {
                    const SEASONING_WEEKS = 8;
                    const currentWeek = 52 - (gameRun?.weeksRemaining ?? 52);
                    const weeksOwned = d.purchaseWeek != null ? currentWeek - d.purchaseWeek : 0;
                    const canRefinance = d.status === 'active_rental' && 
                                        weeksOwned >= SEASONING_WEEKS && 
                                        (d.refinanceCount ?? 0) === 0;
                    return { 
                      dealId: d.id,
                      propertyId: d.propertyId, 
                      strategy: d.strategy as 'rent' | 'flip', 
                      status: d.status,
                      purchasePrice: d.purchasePrice || undefined,
                      weeksOwned,
                      canRefinance,
                      contractorWalkthroughCompleted: d.contractorWalkthroughCompleted ?? false,
                      rentalRehabActive: d.rentalRehabActive ?? false,
                      rentalRehabWeeksRemaining: d.rentalRehabWeeksRemaining ?? undefined,
                      weeksUntilCompletion: d.weeksUntilCompletion ?? undefined,
                      hasRemainingRepairs: d.contractorWalkthroughCompleted && (() => {
                        const walkthroughData = d.contractorWalkthroughData as any;
                        const completedIds = (d.completedRepairIds as string[] | null) || [];
                        const allItems = walkthroughData?.repairItems || [];
                        return allItems.some((item: any) => !completedIds.includes(item.id));
                      })(),
                      completedRepairIds: (d.completedRepairIds as string[] | null) || [],
                    };
                  })}
                  onSellProperty={handleSellProperty}
                  onRefinanceProperty={handleOpenRefinanceModal}
                  onContractorWalkthrough={handleOpenWalkthroughModal}
                />
              </div>
              <div className="lg:col-span-3 xl:col-span-3 space-y-3">
                <TimeProgressionPanel
                  gameRun={gameRun}
                  deals={deals}
                  properties={properties}
                  tenants={tenants}
                  onAdvanceWeek={handleAdvanceWeek}
                  onSellRental={handleSellRental}
                  onSellFlip={handleSellFlip}
                  onSellProperty={handleSellProperty}
                  onRefinanceRental={handleOpenRefinanceModal}
                />
                <DebtPanelTrigger
                  deals={deals}
                  onClick={() => setShowDebtPanel(true)}
                />
              </div>
            </motion.div>
          )}

          {currentScreen === 'proforma' && selectedProperty && (
            <motion.div
              key="proforma"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={screenVariants}
              transition={screenTransition}
            >
              <div className="mb-4 flex flex-wrap gap-2">
                <button 
                  onClick={handleReturnToProperty}
                  className="touch-target px-4 py-2.5 bg-card hover:bg-muted active:bg-muted/80 text-foreground rounded-lg text-sm font-medium border border-border transition-colors"
                  data-testid="button-back-to-property"
                >
                  ← Back to Property
                </button>
                <button 
                  onClick={handleBackToMarket}
                  className="touch-target px-4 py-2.5 bg-card hover:bg-muted active:bg-muted/80 text-foreground rounded-lg text-sm font-medium border border-border transition-colors"
                  data-testid="button-back-to-market"
                >
                  Back to Market
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1800px] mx-auto">
                <div className="lg:col-span-9">
                  <ProFormaPanel
                    property={convertPropertyToGameProperty(selectedProperty)}
                    inputs={proFormaInputs}
                    onInputsChange={handleInputsChange}
                    onCalculate={handleCalculate}
                    completedDiligence={completedDiligence[selectedProperty.id] || []}
                    playerCash={gameRun?.cash ?? STARTING_CASH}
                    playerFinancials={playerFinancials}
                    weekNumber={gameRun?.weeksRemaining ? 52 - gameRun.weeksRemaining : 1}
                    onReturnToProperty={handleReturnToProperty}
                    onProceedWithoutDiligence={handleProceedWithoutDiligence}
                    skippedDiligence={skippedDiligenceDeals.has(selectedProperty.id)}
                    touchedFields={touchedFields}
                    onFieldTouch={handleFieldTouch}
                    gameRunId={gameRun?.id}
                  />
                </div>

                <div className="lg:col-span-3 relative">
                  <div className="lg:fixed lg:top-32 lg:w-[calc(25%-2rem)] lg:max-w-[280px]">
                    <MetricsPanel 
                      outputs={proFormaOutputs}
                      isUnlocked={isProFormaComplete}
                      onCommitDeal={handleCommitDeal}
                      strategy={proFormaInputs.strategy}
                      flipROI={liveFlipMetrics.roi}
                      isCommitting={isCommittingDeal}
                      playerCash={gameRun?.cash ?? 0}
                      flipProfit={liveFlipMetrics.profit}
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {currentScreen === 'results' && proFormaOutputs && (
            <motion.div
              key="results"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={screenVariants}
              transition={screenTransition}
              className="max-w-4xl mx-auto"
            >
              <ResultsPanel
                strategy={proFormaInputs.strategy}
                outputs={proFormaOutputs}
                flipProfit={flipMetrics.profit}
                flipROI={flipMetrics.roi}
                holdWeeks={flipMetrics.holdWeeks}
                hasAppraisal={flipMetrics.hasAppraisal}
                onContinue={handleContinueFromResults}
              />
            </motion.div>
          )}
          </AnimatePresence>
        </main>

        {/* Property Detail Modal - with inline pro forma inputs */}
        {currentScreen === 'detail' && selectedProperty && (
          <PropertyDetail
            property={selectedProperty}
            onClose={handleCloseDetail}
            onOpenProForma={handleOpenProForma}
            onPass={handlePassProperty}
            onGoHome={() => { handleCloseDetail(); setCurrentScreen('home'); }}
            isProFormaComplete={proFormaCompletions[selectedProperty.id] || false}
            completedDiligence={completedDiligence[selectedProperty.id] || []}
            onDiligencePurchase={handleDiligencePurchase}
            cash={gameRun?.cash || 0}
            proFormaInputs={proFormaInputs}
            onProFormaInputsChange={handleInputsChange}
            touchedFields={touchedFields}
            onFieldTouch={handleFieldTouch}
            gameRunId={gameRun?.id}
          />
        )}


        {currentScreen === 'market' && gameRun && (
          <div className="md:hidden fixed bottom-6 right-4 z-40" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
            <button
              onClick={() => { playAdvanceWeekSound(); handleAdvanceWeek(); }}
              disabled={isAdvancingWeek}
              className="touch-target flex items-center gap-2 px-5 py-3 bg-[hsl(152,44%,42%)] hover:bg-[hsl(152,44%,48%)] active:bg-[hsl(152,44%,38%)] disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed rounded-full text-white font-medium text-base transition-colors duration-150"
              data-testid="button-advance-week-floating"
              data-no-click-sound
            >
              {isAdvancingWeek ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              <span>Next Month</span>
            </button>
          </div>
        )}

        {/* Copyright Footer */}
        <Footer />

        {/* Money Animation - triggered on purchases */}
        <MoneyAnimation 
          trigger={moneyAnimationTrigger} 
          onComplete={() => setMoneyAnimationTrigger(0)}
        />

        {/* Deal Transaction Animation */}
        <DealTransactionAnimation
          isVisible={isCommittingDeal && dealOutcome !== null}
          propertyName={dealOutcome?.property.name || ''}
          purchasePrice={dealOutcome?.property.price || 0}
          downPayment={dealOutcome?.downPayment || 0}
          closingCosts={dealOutcome?.closingCosts || 0}
          loanOriginationFee={dealOutcome?.loanOriginationFee || 0}
          loanAmount={dealOutcome?.loanAmount || 0}
          strategy={dealOutcome?.strategy || 'rent'}
          onComplete={() => {
            // If player went bankrupt from this deal (surprise costs), skip results
            if (gameRun && gameRun.cash < 0) {
              setCurrentScreen('market');
              setIsCommittingDeal(false);
              setDealOutcome(null);
              return;
            }
            
            const isFirstDeal = deals.length === 0;
            const didDueDiligence = selectedProperty ? 
              (completedDiligence[selectedProperty.id] || []).length >= 2 : false;
            
            const fixedIds = proFormaInputs.fixedIssueIds || [];
            let totalIssueCount = 0;
            if (dealOutcome && gameRun) {
              const diligence = completedDiligence[dealOutcome.property.id] || [];
              const allIssues = gameRun.id > 0
                ? getRevealedRandomizedIssues(gameRun.id, dealOutcome.property.id, dealOutcome.property.propertyType || 'house', dealOutcome.property.conditionTag || 'Fair', diligence, dealOutcome.property.waterSource || 'public')
                : getRevealedIssues(dealOutcome.property.name, diligence);
              totalIssueCount = allIssues.length;
            }
            const unfixedCount = Math.max(0, totalIssueCount - fixedIds.length);
            
            const congratsData = {
              propertyName: dealOutcome?.property.name || '',
              strategy: dealOutcome?.strategy as 'rent' | 'flip' || 'rent',
              totalCashInvested: proFormaOutputs?.totalCashInvested || 0,
              ltv: proFormaInputs.ltv,
              cashFlow: dealOutcome?.strategy === 'rent' ? proFormaOutputs?.cashFlowMonthly : undefined,
              profit: dealOutcome?.strategy === 'flip' ? flipMetrics.profit : undefined,
              roi: dealOutcome?.strategy === 'flip' ? flipMetrics.roi : undefined,
              isFirstDeal,
              didDueDiligence,
              propertyPrice: dealOutcome?.property.price || 0,
              dealCount: deals.length + 1,
              hasUnfixedIssues: unfixedCount > 0,
              unfixedIssueCount: unfixedCount,
              marketCondition: gameRun?.marketCondition || 'neutral',
            };

            if (dealOutcome?.strategy === 'rent' && rentalReveal.data) {
              setRentalReveal(prev => ({ ...prev, isOpen: true }));
              setDealCongrats({ isOpen: false, data: congratsData });
            } else {
              setDealCongrats({ isOpen: true, data: congratsData });
            }
            
            setCurrentScreen('results');
            setIsCommittingDeal(false);
            setDealOutcome(null);
          }}
        />
        
        {/* Rental Reality Reveal */}
        <RentalRealityReveal
          isOpen={rentalReveal.isOpen}
          onClose={() => {
            setRentalReveal({ isOpen: false, data: null });
            if (dealCongrats.data) {
              setDealCongrats(prev => ({ ...prev, isOpen: true }));
            }
          }}
          data={rentalReveal.data}
        />

        {/* Deal Congratulations Popup */}
        <DealCongratulations
          isOpen={dealCongrats.isOpen}
          onClose={() => setDealCongrats({ isOpen: false, data: null })}
          dealData={dealCongrats.data}
        />

        {/* Property Sold Animation */}
        <PropertySoldAnimation
          isOpen={propertySoldAnim.isOpen}
          onClose={() => setPropertySoldAnim({ isOpen: false, data: null, proFormaProjections: null })}
          proFormaProjections={propertySoldAnim.proFormaProjections}
          onShareCard={() => {
            if (propertySoldAnim.data) {
              const d = propertySoldAnim.data;
              const roi = d.purchasePrice > 0 ? (d.saleProfit / d.purchasePrice) * 100 : 0;
              setShareCardData({
                isOpen: true,
                data: {
                  propertyName: d.propertyName,
                  salePrice: d.salePrice,
                  purchasePrice: d.purchasePrice,
                  rehabCost: d.rehabCost || 0,
                  saleProfit: d.saleProfit,
                  strategy: d.isRental ? 'rental' : 'flip',
                  roi,
                },
              });
            }
          }}
          saleData={propertySoldAnim.data}
        />

        {/* Deal Share Card */}
        {shareCardData.data && (
          <DealShareCard
            isOpen={shareCardData.isOpen}
            onClose={() => setShareCardData({ isOpen: false, data: null })}
            data={shareCardData.data}
          />
        )}

        {/* Ledger Panel Modal */}
        {showLedger && (
          <LedgerPanel
            entries={ledgerEntries}
            startingCash={STARTING_CASH}
            deals={deals}
            properties={properties}
            onClose={() => setShowLedger(false)}
            onOpexClick={(dealId) => {
              const deal = deals.find(d => d.id === dealId);
              const property = deal ? properties.find(p => p.id === deal.propertyId) : undefined;
              if (deal && property) {
                setOpexPopupData({ deal, property });
              }
            }}
          />
        )}
        
        {/* Sale Confirmation Dialog */}
        {pendingSale && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9998] p-4" data-testid="sale-confirmation-dialog">
            <div className="bg-[hsl(220,14%,10%)] border border-white/8 rounded-xl w-full max-w-md p-5 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-white/90 mb-4">
                Sell {pendingSale.propertyName}?
              </h2>
              
              <div className="rounded-lg p-4 mb-4 border border-white/6">
                <p className="text-sm text-white/50 mb-3">
                  {pendingSale.strategy === 'rent' 
                    ? "This will end your rental income stream."
                    : "The final price depends on market conditions."}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">You paid</span>
                    <span className="text-white/70 font-mono font-medium" style={{ letterSpacing: '-0.02em' }}>${pendingSale.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">Possible sale price</span>
                    <span className="text-white/70 font-mono font-medium" style={{ letterSpacing: '-0.02em' }}>
                      ${pendingSale.minSale.toLocaleString()} – ${pendingSale.maxSale.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-white/6 pt-2 mt-2">
                    <span className="text-white/50">Potential outcome</span>
                    <span className="text-sm font-mono" style={{ letterSpacing: '-0.02em' }}>
                      <span className="text-red-400/70 font-medium">-${(pendingSale.purchasePrice - pendingSale.minSale).toLocaleString()}</span>
                      <span className="text-white/20"> to </span>
                      <span className="text-[hsl(152,44%,50%)] font-medium">+${(pendingSale.maxSale - pendingSale.purchasePrice).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-white/30 mb-4">
                Sale takes 2 months. Final price based on market, condition, and diligence.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelSale}
                  className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/8 text-white/70 rounded-lg font-medium text-sm transition-colors duration-150 touch-manipulation disabled:opacity-50"
                  data-testid="button-cancel-sale"
                  type="button"
                  disabled={isSelling}
                >
                  Keep Property
                </button>
                <button
                  onClick={confirmSale}
                  className="flex-1 px-4 py-3.5 bg-[hsl(152,44%,42%)] hover:bg-[hsl(152,44%,48%)] text-white rounded-lg font-medium text-sm transition-colors duration-150 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-confirm-sale"
                  type="button"
                  disabled={isSelling}
                >
                  {isSelling ? 'Selling...' : 'Sell Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bankruptcy confirmation — purchase would push cash negative */}
        <AlertDialog open={!!bankruptcyConfirm} onOpenChange={(open) => !open && setBankruptcyConfirm(null)}>
          <AlertDialogContent className="bg-[hsl(220,14%,10%)] border-red-500/30 max-w-md" data-testid="dialog-bankruptcy-warning">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-400 text-xl flex items-center gap-2">
                ⚠️ Hold up — this will bankrupt you
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300 space-y-2 pt-2">
                {bankruptcyConfirm && (
                  <>
                    <span className="block">
                      This deal needs <span className="text-white font-semibold">${bankruptcyConfirm.required.toLocaleString()}</span> upfront but you only have <span className="text-white font-semibold">${bankruptcyConfirm.cash.toLocaleString()}</span> in cash.
                    </span>
                    <span className="block text-red-300">
                      You'd be <span className="font-semibold">${bankruptcyConfirm.shortfall.toLocaleString()}</span> short — committing now sends your account negative and ends the run immediately.
                    </span>
                    <span className="block text-gray-400 text-sm pt-2">
                      Real investors never close a deal without reserves. Walk away, or push through anyway?
                    </span>
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3">
              <AlertDialogCancel
                className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
                data-testid="button-bankruptcy-cancel"
              >
                Walk Away
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600/80 hover:bg-red-600 text-white border border-red-500/40"
                data-testid="button-bankruptcy-proceed"
                onClick={() => {
                  setBankruptcyConfirm(null);
                  handleCommitDeal(true);
                }}
              >
                Commit Anyway
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Premium Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => {
            setShowPremiumModal(false);
            setPremiumTriggerReason('manual');
          }}
          onPurchase={handlePremiumPurchase}
          onCouponRedeemed={(cashAdded, monthsAdded) => {
            // Refresh game run data to reflect new values
            queryClient.invalidateQueries({ queryKey: ['/api/games', gameRun.id] });
            // Update local state
            setGameRun(prev => prev ? {
              ...prev,
              cash: prev.cash + cashAdded,
              weeksRemaining: prev.weeksRemaining + monthsAdded,
            } : prev);
          }}
          currentCash={gameRun.cash}
          currentWeeks={gameRun.weeksRemaining}
          gameRunId={gameRun.id}
          triggerReason={premiumTriggerReason}
          canClose={true}
          onEndGame={undefined}
        />

        {/* Season End Modal — gates progression past 52 weeks */}
        <SeasonEndModal
          isOpen={showSeasonEndModal}
          onClose={() => setShowSeasonEndModal(false)}
          onSeasonUnlocked={handleSeasonUnlocked}
          currentSeason={gameRun.seasonsUnlocked ?? 1}
          // Modal normalizes nullish/partial values internally — cast through unknown
          // since the jsonb column is typed loosely on GameRun.
          seasonStats={(seasonEndSnapshot?.seasonStats ?? gameRun.seasonStats) as unknown as never}
          bestStreak={seasonEndSnapshot?.bestStreak ?? gameRun.bestStreak ?? 0}
          cash={seasonEndSnapshot?.cash ?? gameRun.cash}
        />

        {/* XP flash — fires after profitable deal close */}
        <XpFlash event={xpFlash} onDone={() => setXpFlash(null)} />

        {/* Hall of Fame Modal */}
        <HallOfFameModal
          isOpen={showHallOfFame}
          onClose={() => setShowHallOfFame(false)}
        />

        {/* Badges & Trophies Modal */}
        <BadgesModal
          isOpen={showBadges}
          onClose={() => setShowBadges(false)}
          earnedTrophies={unlockedAchievements}
        />

        {/* End Game Summary Modal */}
        {gameRun && (
          <EndGameSummary
            isOpen={showEndGameSummary}
            onClose={() => setShowEndGameSummary(false)}
            gameRun={gameRun}
            deals={deals}
            properties={properties}
            investigations={investigations}
            won={endGameWon}
            midGame={endGameMidGame}
          />
        )}

        {/* Income Notifications */}
        <IncomeNotification events={incomeEvents} onDismiss={dismissEvent} />

        {/* Construction Notifications */}
        <ConstructionNotification events={constructionEvents} onDismiss={dismissConstructionEvent} />

        {/* Passive Income Milestone Celebration */}
        {activeMilestone !== null && (
          <PassiveIncomeMilestone
            threshold={activeMilestone}
            onDismiss={() => setActiveMilestone(null)}
          />
        )}

        {/* Trophy Unlock Notifications - paused when sold animation is showing */}
        <TrophyNotificationManager 
          awardedTrophies={pendingTrophies} 
          onAllDismissed={clearTrophies}
          paused={propertySoldAnim.isOpen}
        />

        {/* Achievement Popups */}
        <AchievementQueue 
          queue={achievementQueue}
          onDismiss={(id) => setAchievementQueue(prev => prev.filter(a => a !== id))}
        />

        {/* Bankruptcy Modal */}
        {isBankrupt && (
          <BankruptModal
            cash={gameRun.cash}
            weeksPlayed={52 - gameRun.weeksRemaining}
            onReturnHome={handleBankruptReturnHome}
            onTryAgain={handleBankruptTryAgain}
          />
        )}

        {/* Tenant Text Messages */}
        <TenantTextPopup
          isOpen={tenantTextPopup.isOpen}
          onClose={() => setTenantTextPopup({ isOpen: false, tenant: null, message: '' })}
          tenantName={tenantTextPopup.tenant?.name || ''}
          tenantPortraitUrl={tenantTextPopup.tenant?.portraitUrl}
          message={tenantTextPopup.message}
        />

        {/* Debt Panel Modal */}
        <DebtPanel
          deals={deals}
          properties={properties}
          isOpen={showDebtPanel}
          onOpenChange={setShowDebtPanel}
        />

        {/* Refinance Modal */}
        {refinancingDeal && gameRun && (
          <RefinanceModal
            isOpen={!!refinancingDeal}
            onClose={() => setRefinancingDeal(null)}
            deal={refinancingDeal.deal}
            property={refinancingDeal.property}
            gameRun={gameRun}
            onRefinance={handleExecuteRefinance}
          />
        )}

        {/* Contractor Walkthrough Modal */}
        {walkthroughDeal && gameRun && (
          <ContractorWalkthroughModal
            isOpen={!!walkthroughDeal}
            onClose={() => setWalkthroughDeal(null)}
            deal={walkthroughDeal.deal}
            property={walkthroughDeal.property}
            gameRun={gameRun}
            onComplete={handleWalkthroughComplete}
            onTreasureFound={(amount, propertyName) => {
              setTreasureData({ amount, propertyName, context: 'walkthrough' });
            }}
            onStartRepairs={(dealId, propertyName, weeks, cost, varianceInfo, strategy) => {
              addConstructionStart(propertyName, strategy || 'rent', weeks, cost, varianceInfo);
              queryClient.invalidateQueries({ queryKey: ['deals'] });
              queryClient.invalidateQueries({ queryKey: ['ledger'] });
              if (gameRun) {
                api.getGameRun(gameRun.id).then(setGameRun).catch(console.error);
              }
            }}
          />
        )}
        
        {/* Gold Treasure Modal (extremely rare 1/300 discovery) */}
        <GoldTreasureModal
          isOpen={!!treasureData}
          onClose={() => setTreasureData(null)}
          amount={treasureData?.amount || 0}
          propertyName={treasureData?.propertyName || ''}
          discoveryContext={treasureData?.context || 'walkthrough'}
        />
        
        {/* Operating Expenses Popup */}
        {opexPopupData && (
          <OperatingExpensesPopup
            isOpen={!!opexPopupData}
            onClose={() => setOpexPopupData(null)}
            deal={opexPopupData.deal}
            property={opexPopupData.property}
          />
        )}

        {/* Tutorial System */}
        <TutorialOverlay />
        <TutorialPrompt />
      </div>
    </div>
  );
}
