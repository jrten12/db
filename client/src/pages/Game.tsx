import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from '@/components/game/StatusBar';
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
import { PremiumModal } from '@/components/game/PremiumModal';
import { PlayerNameModal } from '@/components/game/PlayerNameModal';
import { HallOfFameModal } from '@/components/game/HallOfFameModal';
import { TrophyNotificationManager, useTrophyNotifications } from '@/components/game/TrophyUnlockNotification';
import { BankruptModal } from '@/components/game/BankruptModal';
import { SaveIndicator } from '@/components/game/SaveIndicator';
import {
  ProFormaInputs,
  ProFormaOutputs,
  defaultProForma,
  calculateProForma,
  convertPropertyToGameProperty,
  getInterestRateFromLTV,
  getLoanFeesFromLTV
} from '@/lib/gameData';
import { getEffectiveRanges } from '@/lib/propertyIssues';
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

export default function Game() {
  const queryClient = useQueryClient();
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('market');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [proFormaInputs, setProFormaInputs] = useState<ProFormaInputs>(defaultProForma);
  const [proFormaOutputs, setProFormaOutputs] = useState<ProFormaOutputs | null>(null);
  const [isProFormaComplete, setIsProFormaComplete] = useState(false);
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
  const [flipMetrics, setFlipMetrics] = useState({ profit: 0, roi: 0, holdWeeks: 0 });
  const [showLedger, setShowLedger] = useState(false);

  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [moneyAnimationTrigger, setMoneyAnimationTrigger] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showHallOfFame, setShowHallOfFame] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<HallOfFamePlayer | null>(null);
  const [showNameEntry, setShowNameEntry] = useState(true);

  const STARTING_CASH = 50000;

  // Income notifications
  const { events: incomeEvents, dismissEvent, addRentalPayment, addFlipProceeds, addCurveballBonus } = useIncomeNotifications();
  
  // Trophy notifications
  const { pendingTrophies, addTrophies, clearTrophies } = useTrophyNotifications();

  const [gameRun, setGameRun] = useState<GameRun | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [gameError, setGameError] = useState<Error | null>(null);
  const [savedGameInfo, setSavedGameInfo] = useState<ReturnType<typeof getSaveInfo>>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        cash: 50000,
        weeksRemaining: 52,
        profitableDeals: 0,
        goalDeals: 3,
        status: 'active',
      });
      
      if (!newRun) {
        throw new Error('Failed to create game run');
      }
      
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
  }, []);

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
      toast.success(`Added ${updatedGameRun.weeksRemaining} weeks!`);
    },
  });

  const purchaseBundleMutation = useMutation({
    mutationFn: ({ gameRunId, cashAmount, weeksAmount }: { gameRunId: number; cashAmount: number; weeksAmount: number }) =>
      api.purchaseBundle(gameRunId, cashAmount, weeksAmount),
    onSuccess: (updatedGameRun) => {
      setGameRun(updatedGameRun);
      toast.success(`Bundle added! New cash: $${updatedGameRun.cash.toLocaleString()}, Weeks: ${updatedGameRun.weeksRemaining}`);
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

  const handlePropertyClick = useCallback((id: number) => {
    setSelectedPropertyId(id);
    setCurrentScreen('detail');
  }, []);

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
    
    setProFormaInputs(prev => ({
      ...prev,
      strategy,
      contractorType: contractor,
      expectedRent: rentEstimate,
      rehabBudget: rehabEstimate,
      rehabWeeks: timelineEstimate,
    }));
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
      
      setCompletedDiligence(prev => ({
        ...prev,
        [propertyId]: [...(prev[propertyId] || []), diligenceType],
      }));
      
      const timeDisplay = weeks < 1 ? `${Math.round(weeks * 7)} days` : `${weeksToDeduct} week${weeksToDeduct !== 1 ? 's' : ''}`;
      
      if (cost > 0) {
        setMoneyAnimationTrigger(Date.now());
      }
      
      toast.success(`Investigation complete! -$${cost.toLocaleString()}, -${timeDisplay}`);
    } catch (error) {
      toast.error('Failed to complete investigation');
    }
  }, [gameRun, properties, updateGameMutation, createInvestigationMutation, createLedgerMutation, completedDiligence]);

  const handleBackToMarket = useCallback(() => {
    setCurrentScreen('market');
    setIsProFormaComplete(false);
    setProFormaOutputs(null);
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

  const handleInputsChange = useCallback((inputs: ProFormaInputs) => {
    setProFormaInputs(inputs);
    if (isProFormaComplete && selectedProperty) {
      setProFormaOutputs(calculateProForma(inputs, selectedProperty));
    }
  }, [isProFormaComplete, selectedProperty]);

  const handleCalculate = useCallback(() => {
    if (selectedProperty) {
      const outputs = calculateProForma(proFormaInputs, selectedProperty);
      setProFormaOutputs(outputs);
      setIsProFormaComplete(true);
      setProFormaCompletions(prev => ({
        ...prev,
        [selectedProperty.id]: true,
      }));
      toast.success('Pro forma calculated!');
    }
  }, [proFormaInputs, selectedProperty]);

  const [isCommittingDeal, setIsCommittingDeal] = useState(false);
  const [dealOutcome, setDealOutcome] = useState<{
    property: Property;
    totalCashRequired: number;
    downPayment: number;
    closingCosts: number;
    loanOriginationFee: number;
    loanAmount: number;
    strategy: 'rent' | 'flip';
  } | null>(null);

  const handleCommitDeal = useCallback(async () => {
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
      toast.warning('Cheap contractor: -2 weeks while they get started on the job.', { duration: 4000 });
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
        const contingencyPct = proFormaInputs.contingencyPct ?? 0;
        const interestRate = getInterestRateFromLTV(proFormaInputs.ltv);
        const taxesAnnual = proFormaInputs.taxesAnnual ?? 0;
        const insuranceAnnual = proFormaInputs.insuranceAnnual ?? 0;
        const rehabWeeks = proFormaInputs.rehabWeeks ?? 0;
        
        const allInBasis = selectedProperty.price + closingCosts + rehabBudget * (1 + contingencyPct / 100);
        const holdingCostPerWeek = Math.round((selectedProperty.price * (interestRate / 100) / 52) +
          (taxesAnnual / 52) + (insuranceAnnual / 52));
        const arvMid = (selectedProperty.arvMin + selectedProperty.arvMax) / 2;
        const profit = arvMid - allInBasis - (holdingCostPerWeek * rehabWeeks);
        const roi = proFormaOutputs.totalCashInvested > 0 ? (profit / proFormaOutputs.totalCashInvested) * 100 : 0;
        setFlipMetrics({ profit, roi, holdWeeks: rehabWeeks });

        // Start flip rehab period
        await api.startFlipRehab(newDeal.id, gameRun.id, rehabWeeks);
        toast.success('Flip started! Check Time & Income panel to track progress.');
      } else {
        // Activate rental property
        const rentalResult = await api.activateRental(newDeal.id, gameRun.id, proFormaOutputs.cashFlowMonthly);
        
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
        
        // Show reality check feedback - compare player assumptions to market reality
        if (rentalResult.realityCheck) {
          const rc = rentalResult.realityCheck;
          if (rc.wasOptimistic) {
            toast.error(`📊 Reality Check: ${rc.explanation}`, { duration: 8000 });
          } else if (rc.actualCashFlow > rc.projectedCashFlow) {
            toast.success(`📊 ${rc.explanation}`, { duration: 5000 });
          }
        }
        
        // Update game run with new cash balance after surprise costs
        const updatedGameRun = await api.getGameRun(gameRun.id);
        setGameRun(updatedGameRun);
        
        toast.success('Rental activated! You will receive weekly income.');
        
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
  }, [gameRun, selectedProperty, proFormaOutputs, proFormaInputs, createDealMutation, createLedgerMutation, queryClient, updateGameMutation]);

  const handleAdvanceWeek = useCallback(async () => {
    if (!gameRun) return;

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

      // Refresh game run state and other data
      const updatedGameRun = await api.getGameRun(gameRun.id);
      setGameRun(updatedGameRun);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });

      toast.success(`Week ${result.newWeek} complete!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to advance week');
    }
  }, [gameRun, queryClient, addRentalPayment, addFlipProceeds, properties, deals]);

  const handleSellRental = useCallback(async (dealId: number) => {
    if (!gameRun) return;
    
    try {
      const result = await api.sellRental(dealId, gameRun.id);
      
      // Update game state with new cash and weeks
      setGameRun(result.gameRun);
      
      // Find property name for toast
      const deal = deals.find(d => d.id === dealId);
      const property = properties.find(p => p.id === deal?.propertyId);
      
      const profitSign = result.saleProfit >= 0 ? '+' : '';
      toast.success(
        `Sold ${property?.name || 'property'} for $${result.salePrice.toLocaleString()} (${profitSign}$${result.saleProfit.toLocaleString()})`,
        { duration: 5000 }
      );
      
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
      
      // Find property name for toast
      const deal = deals.find(d => d.id === dealId);
      const property = properties.find(p => p.id === deal?.propertyId);
      
      const profitSign = result.saleProfit >= 0 ? '+' : '';
      toast.success(
        `Flipped ${property?.name || 'property'} for $${result.salePrice.toLocaleString()} (${profitSign}$${result.saleProfit.toLocaleString()})`,
        { duration: 5000 }
      );
      
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

  const handleContinueFromResults = useCallback(() => {
    setCurrentScreen('market');
    setIsProFormaComplete(false);
    setProFormaOutputs(null);
    setProFormaInputs(defaultProForma);
    setSelectedPropertyId(null);
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

  const handleBankruptReturnHome = useCallback(() => {
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
    queryClient.invalidateQueries();
  }, [queryClient]);

  const handleBankruptTryAgain = useCallback(async () => {
    if (!playerName) {
      handleBankruptReturnHome();
      return;
    }
    // Start a fresh game with the same player name
    try {
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
      setGameRun(newRun);
      setCurrentScreen('market');
      setSelectedPropertyId(null);
      setProFormaInputs(defaultProForma);
      setProFormaOutputs(null);
      setIsProFormaComplete(false);
      setCompletedDiligence({});
      setProFormaCompletions({});
      queryClient.invalidateQueries();
      toast.success('New game started!');
    } catch (error) {
      toast.error('Failed to start new game');
      handleBankruptReturnHome();
    }
  }, [playerName, queryClient, handleBankruptReturnHome]);

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

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${woodTexture})` }}
      data-testid="game-screen"
    >
      <div className="min-h-screen bg-black/30">
        <StatusBar
          cash={gameRun.cash}
          weeksRemaining={gameRun.weeksRemaining}
          profitableDeals={gameRun.profitableDeals}
          goalDeals={gameRun.goalDeals}
          onOpenLedger={() => setShowLedger(true)}
          onOpenPremium={() => setShowPremiumModal(true)}
          onOpenHallOfFame={() => setShowHallOfFame(true)}
        />
        
        <SaveIndicator />

        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          {currentScreen === 'market' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <PropertySelector
                  properties={properties}
                  selectedId={selectedPropertyId}
                  onSelect={handlePropertyClick}
                  locationFilter={locationFilter}
                  onLocationFilterChange={setLocationFilter}
                  propertiesWithInvestigations={new Set(investigations.map(inv => inv.propertyId))}
                  propertyDeals={deals.map(d => ({ propertyId: d.propertyId, strategy: d.strategy as 'rent' | 'flip', status: d.status }))}
                />
              </div>
              <div className="lg:col-span-1">
                <TimeProgressionPanel
                  gameRun={gameRun}
                  deals={deals}
                  properties={properties}
                  onAdvanceWeek={handleAdvanceWeek}
                  onSellRental={handleSellRental}
                  onSellFlip={handleSellFlip}
                />
              </div>
            </div>
          )}

          {currentScreen === 'proforma' && selectedProperty && (
            <>
              <button 
                onClick={handleBackToMarket}
                className="mb-4 px-4 py-2 bg-card hover:bg-muted text-foreground rounded-lg text-sm font-medium border border-border transition-colors"
                data-testid="button-back-to-market"
              >
                Back to Market
              </button>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="lg:col-span-2">
                  <ProFormaPanel
                    property={convertPropertyToGameProperty(selectedProperty)}
                    inputs={proFormaInputs}
                    onInputsChange={handleInputsChange}
                    onCalculate={handleCalculate}
                    completedDiligence={completedDiligence[selectedProperty.id] || []}
                    playerCash={gameRun?.cash ?? 50000}
                    onReturnToProperty={handleReturnToProperty}
                    onProceedWithoutDiligence={handleProceedWithoutDiligence}
                    skippedDiligence={skippedDiligenceDeals.has(selectedProperty.id)}
                  />
                </div>

                <div className="lg:col-span-1">
                  <MetricsPanel 
                    outputs={proFormaOutputs}
                    isUnlocked={isProFormaComplete}
                    onCommitDeal={handleCommitDeal}
                    strategy={proFormaInputs.strategy}
                    flipROI={flipMetrics.roi}
                    isCommitting={isCommittingDeal}
                    playerCash={gameRun?.cash ?? 0}
                    flipProfit={flipMetrics.profit}
                  />
                  
                </div>

              </div>
            </>
          )}

          {currentScreen === 'results' && proFormaOutputs && (
            <div className="max-w-4xl mx-auto">
              <ResultsPanel
                strategy={proFormaInputs.strategy}
                outputs={proFormaOutputs}
                flipProfit={flipMetrics.profit}
                flipROI={flipMetrics.roi}
                holdWeeks={flipMetrics.holdWeeks}
                onContinue={handleContinueFromResults}
              />
            </div>
          )}
        </main>

        {/* Property Detail Modal */}
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
          />
        )}


        {/* Copyright Footer */}
        <Footer />

        <div className="safe-area-bottom" />

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
            setCurrentScreen('results');
            setIsCommittingDeal(false);
            setDealOutcome(null);
          }}
        />

        {/* Ledger Panel Modal */}
        {showLedger && (
          <LedgerPanel
            entries={ledgerEntries}
            startingCash={STARTING_CASH}
            onClose={() => setShowLedger(false)}
          />
        )}

        {/* Premium Modal */}
        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onPurchase={handlePremiumPurchase}
          currentCash={gameRun.cash}
          currentWeeks={gameRun.weeksRemaining}
        />

        {/* Hall of Fame Modal */}
        <HallOfFameModal
          isOpen={showHallOfFame}
          onClose={() => setShowHallOfFame(false)}
        />

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
      </div>
    </div>
  );
}