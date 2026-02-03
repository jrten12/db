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
import { TenantIssuePopup, type TenantIssueEvent } from '@/components/game/TenantIssuePopup';
import { TenantTextPopup } from '@/components/game/TenantTextPopup';
import { AnimatedBackground } from '@/components/game/AnimatedBackground';
import { WeekTimeline } from '@/components/game/WeekTimeline';
import { generateTenantName, getRandomPersonalityType, getSpeechPatterns, getRandomMessage } from '@/lib/tenantGenerator';
import type { Tenant } from '@shared/schema';
import { PremiumModal } from '@/components/game/PremiumModal';
import { PlayerNameModal } from '@/components/game/PlayerNameModal';
import { HallOfFameModal } from '@/components/game/HallOfFameModal';
import { EndGameSummary } from '@/components/game/EndGameSummary';
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
import { PropertySoldAnimation } from '@/components/game/PropertySoldAnimation';
import { useTutorial } from '@/contexts/TutorialContext';
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
  TIME_PENALTY_SELF_MANAGED,
  TIME_PENALTY_TENANT_PAYS_UTILITIES,
  PlayerFinancials
} from '@/lib/gameData';
import { getEffectiveRanges, getRevealedIssues } from '@/lib/propertyIssues';
import { type Curveball, getTenantMessageForCurveball, curveballHasTenantMessage, getCurveballById } from '@/lib/curveballs';
import { api } from '@/lib/api';
import { saveGame, loadGame, getSaveInfo, clearSave } from '@/lib/saveGame';
import type { GameRun, Property, LedgerEntry, Deal, HallOfFamePlayer } from '@shared/schema';
import woodTexture from '@assets/generated_images/dark_mahogany_wood_texture.png';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type GameScreen = 'market' | 'detail' | 'proforma' | 'results';

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
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('market');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [proFormaInputs, setProFormaInputs] = useState<ProFormaInputs>(defaultProForma);
  const [proFormaOutputs, setProFormaOutputs] = useState<ProFormaOutputs | null>(null);
  const [isProFormaComplete, setIsProFormaComplete] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof ProFormaInputs>>(new Set());
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
  const [premiumTriggerReason, setPremiumTriggerReason] = useState<'no_weeks' | 'low_cash' | 'manual'>('manual');
  const [hasShownNoWeeksPopup, setHasShownNoWeeksPopup] = useState(false);
  const [hasShownLowCashPopup, setHasShownLowCashPopup] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [showEndGameSummary, setShowEndGameSummary] = useState(false);
  const [endGameWon, setEndGameWon] = useState(false);
  const [showDebtPanel, setShowDebtPanel] = useState(false);
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

  const STARTING_CASH = 75000;

  // Income notifications
  const { events: incomeEvents, dismissEvent, addRentalPayment, addFlipProceeds, addCurveballBonus } = useIncomeNotifications();
  
  // Trophy notifications
  const { pendingTrophies, addTrophies, clearTrophies } = useTrophyNotifications();

  // Tutorial
  const { completeAction } = useTutorial();

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
        goalDeals: 3,
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
    } finally {
      setIsLoadingGame(false);
    }
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

  const { data: properties = [], isLoading: isLoadingProps } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
    staleTime: 0, // Always refetch properties to ensure we have the latest list
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes but always refetch
  });

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

  // Calculate player financials for interest rate adjustments
  const playerFinancials = useMemo((): PlayerFinancials => {
    let totalMonthlyDebt = 0;
    let totalMonthlyIncome = 0;
    let totalAssetValue = 0;
    
    for (const deal of deals) {
      if (deal.status === 'active_rental') {
        const outputs = deal.proFormaOutputs as any;
        totalMonthlyDebt += outputs?.monthlyDebtService || outputs?.debtServiceMonthly || 0;
        totalMonthlyIncome += outputs?.monthlyGrossRent || 0;
        // Asset value approximated as property purchase price
        const property = properties?.find(p => p.id === deal.propertyId);
        totalAssetValue += property?.price || 0;
      }
    }
    
    return {
      cash: gameRun?.cash || 0,
      totalMonthlyDebt,
      totalMonthlyIncome,
      totalAssetValue,
    };
  }, [deals, properties, gameRun?.cash]);

  useEffect(() => {
    if (!gameRun || gameRun.status !== 'active') return;
    
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

  const purchaseCashMutation = useMutation({
    mutationFn: ({ gameRunId, amount }: { gameRunId: number; amount: number }) =>
      api.purchaseCash(gameRunId, amount),
    onSuccess: (updatedGameRun) => {
      setGameRun(updatedGameRun);
      toast.success(`Added $${updatedGameRun.cash.toLocaleString()} cash!`);
    },
  });

  const purchaseWeeksMutation = useMutation({
    mutationFn: ({ gameRunId, amount }: { gameRunId: number; amount: number }) =>
      api.purchaseWeeks(gameRunId, amount),
    onSuccess: (updatedGameRun) => {
      setGameRun(updatedGameRun);
      toast.success(`Added ${updatedGameRun.weeksRemaining} months!`);
    },
  });

  const purchaseBundleMutation = useMutation({
    mutationFn: ({ gameRunId, cashAmount, weeksAmount }: { gameRunId: number; cashAmount: number; weeksAmount: number }) =>
      api.purchaseBundle(gameRunId, cashAmount, weeksAmount),
    onSuccess: (updatedGameRun) => {
      setGameRun(updatedGameRun);
      toast.success(`Bundle added! New cash: $${updatedGameRun.cash.toLocaleString()}, Months: ${updatedGameRun.weeksRemaining}`);
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
      
      // Update proFormaInputs with discovered issue IDs
      // This enables the unfixed issues mechanic where discovered but unfixed issues cause more maintenance problems
      if (property) {
        const revealedIssues = getRevealedIssues(property.name, newCompletedDiligence);
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

  const handleShowEndGameSummary = useCallback(() => {
    if (gameRun) {
      const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 3);
      setEndGameWon(won);
      setShowEndGameSummary(true);
    }
  }, [gameRun]);

  const handleNewGame = useCallback(async () => {
    // Record game end stats to Hall of Fame if there's an active game
    if (gameRun?.id) {
      try {
        const finalCash = gameRun.cash;
        const weeksRemaining = gameRun.weeksRemaining;
        const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 3);
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
    // Calculate fixedIssueIds based on rehab budget
    // If rehab budget covers issue costs, those issues are considered "fixed"
    let updatedInputs = inputs;
    
    if (selectedProperty && inputs.rehabBudget !== undefined && inputs.rehabBudget > 0) {
      const discoveredIssueIds = inputs.discoveredIssueIds || [];
      const revealedIssues = getRevealedIssues(selectedProperty.name, completedDiligence[selectedProperty.id] || []);
      
      // Calculate which issues are covered by the rehab budget
      // Sort by cost (cheapest first) to maximize issues fixed per dollar
      const sortedIssues = [...revealedIssues].sort((a, b) => a.costRangeMax - b.costRangeMax);
      
      let remainingBudget = inputs.rehabBudget;
      const fixedIds: string[] = [];
      
      for (const issue of sortedIssues) {
        // Use max cost to be conservative - issue is only "fixed" if budget covers worst case
        if (remainingBudget >= issue.costRangeMax && discoveredIssueIds.includes(issue.id)) {
          fixedIds.push(issue.id);
          remainingBudget -= issue.costRangeMax;
        }
      }
      
      updatedInputs = { ...inputs, fixedIssueIds: fixedIds };
    } else if (inputs.rehabBudget === 0 || inputs.rehabBudget === undefined) {
      // No rehab budget means no issues are fixed
      updatedInputs = { ...inputs, fixedIssueIds: [] };
    }
    
    setProFormaInputs(updatedInputs);
    if (isProFormaComplete && selectedProperty) {
      setProFormaOutputs(calculateProForma(updatedInputs, selectedProperty, playerFinancials, currentWeek));
    }
  }, [isProFormaComplete, selectedProperty, playerFinancials, currentWeek, completedDiligence]);

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
    } | null;
  }>({ isOpen: false, data: null });

  const handleCommitDeal = useCallback(async () => {
    // Guard against double-clicks
    if (isCommittingDeal) {
      return;
    }
    
    if (!gameRun || !selectedProperty || !proFormaOutputs) {
      toast.error('Missing required data. Please try again.');
      return;
    }

    const closingCosts = Math.round(selectedProperty.price * 0.03);
    const loanFeesPct = getLoanFeesFromLTV(proFormaInputs.ltv);
    const loanOriginationFee = Math.round((selectedProperty.price - proFormaOutputs.downPaymentAmount) * (loanFeesPct / 100));
    
    // Use totalCashInvested from pro forma as single source of truth
    // This includes: down payment + closing costs + loan fees + rehab + holding costs (for flips)
    const totalCashRequired = proFormaOutputs.totalCashInvested;
    
    // CASH VALIDATION - Block if player doesn't have enough
    if (totalCashRequired > gameRun.cash) {
      toast.error(`Insufficient funds! You need $${totalCashRequired.toLocaleString()} but only have $${gameRun.cash.toLocaleString()}.`, { duration: 5000 });
      return;
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
    
    // Apply rental management time penalties (self-managed and/or tenant-pays-utilities)
    if (proFormaInputs.strategy === 'rent') {
      const timePenalty = calculateTimePenalty(proFormaInputs);
      if (timePenalty > 0) {
        const penalties: string[] = [];
        if (!proFormaInputs.propertyManagement) {
          penalties.push(`Self-managing: -${TIME_PENALTY_SELF_MANAGED} month`);
        }
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
          },
          {
            direction: 'debit',
            category: 'closing_cost',
            amount: closingCosts,
            description: `Closing costs (3%) - ${selectedProperty.name}`,
            propertyId: selectedProperty.id,
          },
          {
            direction: 'debit',
            category: 'loan_fee',
            amount: loanOriginationFee,
            description: `Loan origination fee (${loanFeesPct.toFixed(1)}%) - ${selectedProperty.name}`,
            propertyId: selectedProperty.id,
          },
        ],
        currentCash: gameRun.cash,
      });

      if (proFormaInputs.strategy === 'flip') {
        const rehabBudget = proFormaInputs.rehabBudget ?? 0;
        const hasAppraisal = (completedDiligence[selectedProperty.id] || []).includes('appraisal');
        
        // If no rehab budget, timeline is 0 (skip rehab phase, go straight to ready-to-list)
        const rehabWeeks = rehabBudget > 0 ? (proFormaInputs.rehabWeeks ?? 0) : 0;
        
        if (hasAppraisal) {
          const contingencyPct = proFormaInputs.contingencyPct ?? 0;
          const interestRate = getInterestRateFromLTV(proFormaInputs.ltv);
          const taxesAnnual = proFormaInputs.taxesAnnual ?? 0;
          const insuranceAnnual = proFormaInputs.insuranceAnnual ?? 0;
          
          const allInBasis = selectedProperty.price + closingCosts + rehabBudget * (1 + contingencyPct / 100);
          const holdingCostPerWeek = Math.round((selectedProperty.price * (interestRate / 100) / 52) +
            (taxesAnnual / 52) + (insuranceAnnual / 52));
          const arvMid = (selectedProperty.arvMin + selectedProperty.arvMax) / 2;
          const profit = arvMid - allInBasis - (holdingCostPerWeek * rehabWeeks);
          const roi = proFormaOutputs.totalCashInvested > 0 ? (profit / proFormaOutputs.totalCashInvested) * 100 : 0;
          setFlipMetrics({ profit, roi, holdWeeks: rehabWeeks, hasAppraisal: true });
        } else {
          setFlipMetrics({ profit: 0, roi: 0, holdWeeks: rehabWeeks, hasAppraisal: false });
        }

        // Start flip - if no rehab budget, use 0 weeks (ready to list immediately)
        await api.startFlipRehab(newDeal.id, gameRun.id, rehabWeeks);
        if (rehabBudget > 0) {
          toast.success('Flip started! Renovations in progress. Check Time & Income panel.');
        } else {
          toast.success('Flip started! No renovations planned - ready to list immediately. Sale price will reflect property condition.');
        }
      } else {
        // Activate rental property
        const rentalResult = await api.activateRental(newDeal.id, gameRun.id);
        
        // Show title issue warning if skipped title search
        if (rentalResult.titleIssue) {
          toast.error(`📜 Title Issue: ${rentalResult.titleIssue.name} - $${rentalResult.titleIssue.cost.toLocaleString()} to resolve! Should have done the title search.`, { duration: 8000 });
        }
        
        // Show surprise costs warning if any hidden issues were discovered
        const repairIssues = rentalResult.surpriseIssues.filter((i: string) => !i.startsWith('Title:'));
        if (repairIssues.length > 0) {
          const repairCost = rentalResult.surpriseCosts - (rentalResult.titleIssue?.cost || 0);
          if (repairCost > 0) {
            toast.warning(`⚠️ Surprise repairs: $${repairCost.toLocaleString()} for ${repairIssues.join(', ')}. Your investment just got more expensive!`);
          }
        }

        // Update game run with new cash balance after surprise costs
        const updatedGameRun = await api.getGameRun(gameRun.id);
        setGameRun(updatedGameRun);

        toast.success('Rental activated! You will receive monthly income.');
        
        // Show trophy notifications if any were awarded
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

      // Show income notifications for rental payments
      result.rentalPayments.forEach((payment: any) => {
        const property = properties.find(p => p.id === deals.find(d => d.id === payment.dealId)?.propertyId);
        addRentalPayment(
          payment.weeklyIncome,
          payment.grossRent || 0,
          payment.totalExpenses || 0,
          property?.name
        );
      });

      // Show flip completion notifications
      result.completedFlips.forEach((flip: any) => {
        const deal = deals.find(d => d.id === flip.dealId);
        const property = properties.find(p => p.id === deal?.propertyId);
        
        // If this flip is ready to list (not sold yet), show a different notification
        if (flip.readyToList) {
          toast.success(
            `🏠 ${property?.name || 'Property'} rehab complete! Ready to sell. Check the Time & Income panel.`,
            { duration: 5000 }
          );
          return; // Don't show flip proceeds for ready_to_list flips
        }
        
        addFlipProceeds(flip.salePrice, flip.profit, property?.name);
        
        // Show title issue warning if skipped title search
        if (flip.titleIssue) {
          toast.error(`📜 Title Issue on ${property?.name || 'property'}: ${flip.titleIssue.name} - $${flip.titleIssue.cost.toLocaleString()} to resolve! Should have done the title search.`, { duration: 8000 });
        }
        
        // Show surprise costs warning if any hidden repair issues were discovered during flip
        const repairIssues = (flip.surpriseIssues || []).filter((i: string) => !i.startsWith('Title:'));
        if (repairIssues.length > 0) {
          const repairCost = flip.surpriseCosts - (flip.titleIssue?.cost || 0);
          if (repairCost > 0) {
            toast.warning(`⚠️ Surprise repairs on ${property?.name || 'property'}: $${repairCost.toLocaleString()} for ${repairIssues.join(', ')}. This cut into your profit!`);
          }
        }
      });
      
      // Show rental rehab completion notifications
      if (result.completedRentalRehabs && result.completedRentalRehabs.length > 0) {
        result.completedRentalRehabs.forEach((rehab: any) => {
          const rentIncrease = rehab.newMonthlyRent - rehab.previousRent;
          const percentIncrease = Math.round((rentIncrease / rehab.previousRent) * 100);
          const statusNote = rehab.fixedCount < rehab.totalIssueCount
            ? ` (${rehab.fixedCount}/${rehab.totalIssueCount} issues fixed)`
            : ' (all issues fixed!)';
          
          toast.success(
            `🔧 Renovation Complete: ${rehab.propertyName}! New rent: $${rehab.newMonthlyRent.toLocaleString()}/mo (+${percentIncrease}%)${statusNote}`,
            { duration: 6000 }
          );
        });
      }

      // Refresh game run state and other data
      const updatedGameRun = await api.getGameRun(gameRun.id);
      setGameRun(updatedGameRun);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });

      // Create tenants for newly activated rentals and possibly trigger text messages
      try {
        const updatedDeals = await api.getDeals(gameRun.id);
        const activeRentals = updatedDeals.filter((d: Deal) => d.status === 'active_rental');
        
        // Batch fetch tenants once to avoid N+1 queries
        const existingTenants = await api.getTenants(gameRun.id);
        const tenantDealIds = new Set(existingTenants.map(t => t.dealId));
        
        // Create tenants only for rentals that don't have one yet
        const rentalsNeedingTenants = activeRentals.filter(r => !tenantDealIds.has(r.id));
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
            
            await api.createTenant(rental.id, {
              name,
              personalityType,
              speechPatterns,
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
          
          // Removed random humor messages - tenant texts now only appear when
          // tied to an actual expense event (curveball). This prevents confusion
          // where tenants text about issues that don't appear in the ledger.
          // Landlord expenses (PM, taxes, insurance, etc.) don't generate tenant texts.
        }
      } catch (err) {
        // Tenant feature errors should not break week advancement
        console.error('Tenant feature error:', err);
      }

      toast.success(`Month ${result.newWeek} complete!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to advance month');
    } finally {
      setIsAdvancingWeek(false);
    }
  }, [gameRun, queryClient, addRentalPayment, addFlipProceeds, properties, deals]);

  const handleSellRental = useCallback(async (dealId: number) => {
    if (!gameRun) return;
    
    try {
      const result = await api.sellRental(dealId, gameRun.id);
      
      // Update game state with new cash and weeks
      setGameRun(result.gameRun);
      
      // Find property name for animation
      const deal = deals.find(d => d.id === dealId);
      const property = properties.find(p => p.id === deal?.propertyId);
      
      // Show cool sold animation
      setPropertySoldAnim({
        isOpen: true,
        data: {
          propertyName: property?.name || 'Property',
          salePrice: result.salePrice,
          purchasePrice: deal?.purchasePrice || property?.price || 0,
          mortgagePayoff: result.mortgagePayoff,
          netProceeds: result.netProceeds,
          saleProfit: result.saleProfit,
          isRental: true,
        }
      });
      
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sell property');
    }
  }, [gameRun, deals, properties, queryClient]);

  const handleSellFlip = useCallback(async (dealId: number) => {
    if (!gameRun) return;
    
    try {
      const result = await api.sellFlip(dealId, gameRun.id);
      
      // Update game state with new cash and weeks
      setGameRun(result.gameRun);
      
      // Find property name for animation
      const deal = deals.find(d => d.id === dealId);
      const property = properties.find(p => p.id === deal?.propertyId);
      
      // Show cool sold animation
      setPropertySoldAnim({
        isOpen: true,
        data: {
          propertyName: property?.name || 'Property',
          salePrice: result.salePrice,
          purchasePrice: deal?.purchasePrice || property?.price || 0,
          mortgagePayoff: result.mortgagePayoff || 0,
          netProceeds: result.netProceeds || result.salePrice,
          saleProfit: result.saleProfit,
          isRental: false,
        }
      });
      
      // Show trophy notifications if any were awarded
      if (result.awardedTrophies && result.awardedTrophies.length > 0) {
        addTrophies(result.awardedTrophies);
      }
      
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to sell flip property');
    }
  }, [gameRun, deals, properties, queryClient, addTrophies]);

  // Open refinance modal instead of directly refinancing
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
    
    // Sale price range: -10% to +15% of purchase price
    const minSale = Math.round(purchasePrice * 0.90);
    const maxSale = Math.round(purchasePrice * 1.15);
    
    setPendingSale({
      dealId,
      strategy,
      propertyName: property?.name || 'Property',
      purchasePrice,
      minSale,
      maxSale,
    });
  }, [deals, properties]);
  
  // Actually execute the sale after confirmation
  const confirmSale = useCallback(() => {
    if (!pendingSale) return;
    
    if (pendingSale.strategy === 'rent') {
      handleSellRental(pendingSale.dealId);
    } else {
      handleSellFlip(pendingSale.dealId);
    }
    
    setPendingSale(null);
  }, [pendingSale, handleSellRental, handleSellFlip]);
  
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
      if (type === 'cash') {
        await purchaseCashMutation.mutateAsync({ gameRunId: gameRun.id, amount: cashAmount });
      } else if (type === 'weeks') {
        await purchaseWeeksMutation.mutateAsync({ gameRunId: gameRun.id, amount: weeksAmount || 0 });
      } else if (type === 'bundle') {
        await purchaseBundleMutation.mutateAsync({
          gameRunId: gameRun.id,
          cashAmount,
          weeksAmount: weeksAmount || 0
        });
      }
    } catch (error) {
      toast.error('Purchase failed');
    }
  }, [gameRun, purchaseCashMutation, purchaseWeeksMutation, purchaseBundleMutation]);

  // Check if player is bankrupt (cash below zero)
  const isBankrupt = gameRun && gameRun.cash < 0;
  
  // Derived state: is the player frozen (out of weeks)?
  const isPlayerFrozen = gameRun?.weeksRemaining !== undefined && gameRun.weeksRemaining <= 0 && !isBankrupt;

  // Auto-show premium popup when player runs out of weeks or cash is low
  useEffect(() => {
    if (!gameRun || isBankrupt) return;
    
    // Check for 0 weeks - highest priority, freezes game
    if (gameRun.weeksRemaining <= 0 && !hasShownNoWeeksPopup && !showPremiumModal) {
      setPremiumTriggerReason('no_weeks');
      setShowPremiumModal(true);
      setHasShownNoWeeksPopup(true);
    }
    // Check for low cash (below $1,000)
    else if (gameRun.cash < 1000 && gameRun.weeksRemaining > 0 && !hasShownLowCashPopup && !showPremiumModal) {
      setPremiumTriggerReason('low_cash');
      setShowPremiumModal(true);
      setHasShownLowCashPopup(true);
    }
  }, [gameRun?.weeksRemaining, gameRun?.cash, isBankrupt, hasShownNoWeeksPopup, hasShownLowCashPopup, showPremiumModal]);

  // Auto-show end game summary when game is won
  useEffect(() => {
    if (!gameRun || isBankrupt) return;
    
    const isWon = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 3);
    if (isWon && !showEndGameSummary) {
      setEndGameWon(true);
      setShowEndGameSummary(true);
    }
  }, [gameRun?.profitableDeals, gameRun?.goalDeals, isBankrupt, showEndGameSummary]);

  const handleBankruptReturnHome = useCallback(async () => {
    // Record game end stats to Hall of Fame before resetting
    if (gameRun?.id) {
      try {
        const finalCash = gameRun.cash;
        const weeksRemaining = gameRun.weeksRemaining;
        const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 3);
        await api.endGame(gameRun.id, won, finalCash, weeksRemaining);
        console.log('Game stats recorded to Hall of Fame');
      } catch (err) {
        console.error('Failed to record game stats:', err);
      }
    }
    
    // Reset game state and go back to name entry
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
        const won = (gameRun.profitableDeals || 0) >= (gameRun.goalDeals || 3);
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
        goalDeals: 3,
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
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${woodTexture})` }}
      >
        <div className="min-h-screen bg-black/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      </div>
    );
  }

  if (showNameEntry) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${woodTexture})` }}
      >
        <div className="min-h-screen bg-black/50">
          <PlayerNameModal
            isOpen={showNameEntry && !showHallOfFame}
            onSubmit={startNewGame}
            onViewHallOfFame={() => setShowHallOfFame(true)}
            savedGameInfo={savedGameInfo}
            onContinueSavedGame={continueSavedGame}
          />
          <HallOfFameModal
            isOpen={showHallOfFame}
            onClose={() => setShowHallOfFame(false)}
          />
          {isLoadingGame && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
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
            className="mt-4 px-4 py-2 bg-gold text-black rounded-lg font-medium"
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
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
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
      className="bg-cover bg-center bg-fixed min-h-screen min-h-[100dvh]"
      style={{ backgroundImage: `url(${woodTexture})` }}
      data-testid="game-screen"
    >
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Fixed header at top of viewport - safe area handled by StatusBar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm pointer-events-auto">
        <StatusBar
          cash={gameRun.cash}
          weeksRemaining={gameRun.weeksRemaining}
          profitableDeals={gameRun.profitableDeals}
          goalDeals={gameRun.goalDeals}
          onOpenLedger={() => setShowLedger(true)}
          onOpenPremium={() => {
            setPremiumTriggerReason('manual');
            setShowPremiumModal(true);
          }}
          onOpenHallOfFame={() => setShowHallOfFame(true)}
          onViewStats={handleShowEndGameSummary}
          onAdvanceWeek={currentScreen === 'market' ? handleAdvanceWeek : undefined}
          isAdvancingWeek={isAdvancingWeek}
          onNewGame={handleNewGame}
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
      
      {/* Main content with top padding to account for fixed header + safe area + market bar */}
      <div ref={mainContentRef} className="min-h-screen min-h-[100dvh] bg-black/30 pt-32 md:pt-40 overflow-y-auto">
        <SaveIndicator />

        <main className="w-full px-4 lg:px-6 xl:px-8 py-6 md:py-8">
          <AnimatePresence mode="wait">
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
                  onAdvanceWeek={handleAdvanceWeek}
                  onSellRental={handleSellRental}
                  onSellFlip={handleSellFlip}
                  onRefinanceRental={handleOpenRefinanceModal}
                />
                {/* Week Timeline Visualization */}
                <div className="bg-slate-900/80 backdrop-blur rounded-xl p-4 border border-slate-700">
                  <WeekTimeline
                    currentWeek={52 - (gameRun?.weeksRemaining ?? 52)}
                    totalWeeks={52}
                  />
                </div>
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
              <button 
                onClick={handleBackToMarket}
                className="mb-4 px-4 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-colors"
                data-testid="button-back-to-market"
              >
                Back to Market
              </button>
              
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
            const isFirstDeal = deals.length === 0;
            const didDueDiligence = selectedProperty ? 
              (completedDiligence[selectedProperty.id] || []).length >= 2 : false;
            
            setDealCongrats({
              isOpen: true,
              data: {
                propertyName: dealOutcome?.property.name || '',
                strategy: dealOutcome?.strategy || 'rent',
                totalCashInvested: proFormaOutputs?.totalCashInvested || 0,
                ltv: proFormaInputs.ltv,
                cashFlow: dealOutcome?.strategy === 'rent' ? proFormaOutputs?.cashFlowMonthly : undefined,
                profit: dealOutcome?.strategy === 'flip' ? flipMetrics.profit : undefined,
                roi: dealOutcome?.strategy === 'flip' ? flipMetrics.roi : undefined,
                isFirstDeal,
                didDueDiligence,
                propertyPrice: dealOutcome?.property.price || 0,
                dealCount: deals.length + 1,
              }
            });
            
            setCurrentScreen('results');
            setIsCommittingDeal(false);
            setDealOutcome(null);
          }}
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
          onClose={() => setPropertySoldAnim({ isOpen: false, data: null })}
          saleData={propertySoldAnim.data}
        />

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
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="sale-confirmation-dialog">
            <div className="bg-slate-900/95 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>💰</span> Sell {pendingSale.propertyName}?
              </h2>
              
              <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
                <p className="text-gray-300 mb-3">
                  {pendingSale.strategy === 'rent' 
                    ? "You're about to sell your rental property. This will end your rental income stream."
                    : "You're about to list your flip for sale. The final price depends on market conditions."}
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">You paid:</span>
                    <span className="text-white font-mono">${pendingSale.purchasePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Possible sale price:</span>
                    <span className="text-amber-400 font-mono">
                      ${pendingSale.minSale.toLocaleString()} – ${pendingSale.maxSale.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-600 pt-2 mt-2">
                    <span className="text-gray-400">Potential outcome:</span>
                    <span className="text-xs">
                      <span className="text-red-400">-${(pendingSale.purchasePrice - pendingSale.minSale).toLocaleString()}</span>
                      <span className="text-gray-500"> to </span>
                      <span className="text-emerald-400">+${(pendingSale.maxSale - pendingSale.purchasePrice).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">
                Sale takes 2 months. The final price is random — you could make or lose money!
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelSale}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                  data-testid="button-cancel-sale"
                >
                  Keep Property
                </button>
                <button
                  onClick={confirmSale}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
                  data-testid="button-confirm-sale"
                >
                  Sell Now
                </button>
              </div>
            </div>
          </div>
        )}

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
          canClose={!isPlayerFrozen}
          onEndGame={isPlayerFrozen ? handleBankruptReturnHome : undefined}
        />

        {/* Hall of Fame Modal */}
        <HallOfFameModal
          isOpen={showHallOfFame}
          onClose={() => setShowHallOfFame(false)}
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
          />
        )}

        {/* Income Notifications */}
        <IncomeNotification events={incomeEvents} onDismiss={dismissEvent} />

        {/* Trophy Unlock Notifications */}
        <TrophyNotificationManager 
          awardedTrophies={pendingTrophies} 
          onAllDismissed={clearTrophies} 
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
            onStartRepairs={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
              queryClient.invalidateQueries({ queryKey: ['/api/game-runs'] });
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
