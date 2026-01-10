import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from '@/components/game/StatusBar';
import { ProFormaPanel } from '@/components/game/ProFormaPanel';
import { MetricsPanel } from '@/components/game/MetricsPanel';
import { PropertySelector, type LocationFilter } from '@/components/game/PropertySelector';
import { PropertyDetail } from '@/components/game/PropertyDetail';
import { ResultsPanel } from '@/components/game/ResultsPanel';
import { LedgerPanel } from '@/components/game/LedgerPanel';
import { MoneyAnimation } from '@/components/game/MoneyAnimation';
import { TimeProgressionPanel } from '@/components/game/TimeProgressionPanel';
import { IncomeNotification, useIncomeNotifications } from '@/components/game/IncomeNotification';
import { PremiumModal } from '@/components/game/PremiumModal';
import { PlayerNameModal } from '@/components/game/PlayerNameModal';
import { HallOfFameModal } from '@/components/game/HallOfFameModal';
import {
  ProFormaInputs,
  ProFormaOutputs,
  defaultProForma,
  calculateProForma,
  convertPropertyToGameProperty
} from '@/lib/gameData';
import { getEffectiveRanges } from '@/lib/propertyIssues';
import { api } from '@/lib/api';
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

  const [gameRun, setGameRun] = useState<GameRun | null>(null);
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [gameError, setGameError] = useState<Error | null>(null);

  useEffect(() => {
    const checkActiveGame = async () => {
      try {
        const activeRun = await api.getActiveGameRun();
        if (activeRun) {
          setGameRun(activeRun);
          setPlayerName(activeRun.playerName);
          setShowNameEntry(false);
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
      
      setGameRun(newRun);
      setShowNameEntry(false);
    } catch (err) {
      setGameError(err as Error);
    } finally {
      setIsLoadingGame(false);
    }
  }, []);

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

  const handleOpenProForma = useCallback((strategy: 'rent' | 'flip', financing: 'bank' | 'hard-money', contractor: 'cheap' | 'fast') => {
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
      financingType: financing,
      interestRate: financing === 'bank' ? 6.5 : 12,
      downPaymentPct: financing === 'bank' ? 25 : 10,
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

  const handleCommitDeal = useCallback(async () => {
    if (!gameRun || !selectedProperty || !proFormaOutputs) return;

    const closingCosts = Math.round(selectedProperty.price * 0.03);
    const loanOriginationFee = Math.round((selectedProperty.price - proFormaOutputs.downPaymentAmount) * 0.01);

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
            description: `Loan origination fee (1%) - ${selectedProperty.name}`,
            propertyId: selectedProperty.id,
          },
        ],
        currentCash: gameRun.cash,
      });

      if (proFormaInputs.strategy === 'flip') {
        const allInBasis = selectedProperty.price + closingCosts + proFormaInputs.rehabBudget * (1 + proFormaInputs.contingencyPct / 100);
        const holdingCostPerWeek = Math.round((selectedProperty.price * (proFormaInputs.interestRate / 100) / 52) +
          (proFormaInputs.taxesAnnual / 52) + (proFormaInputs.insuranceAnnual / 52));
        const arvMid = (selectedProperty.arvMin + selectedProperty.arvMax) / 2;
        const profit = arvMid - allInBasis - (holdingCostPerWeek * proFormaInputs.rehabWeeks);
        const roi = proFormaOutputs.totalCashInvested > 0 ? (profit / proFormaOutputs.totalCashInvested) * 100 : 0;
        setFlipMetrics({ profit, roi, holdWeeks: proFormaInputs.rehabWeeks });

        // Start flip rehab period
        await api.startFlipRehab(newDeal.id, gameRun.id, proFormaInputs.rehabWeeks);
        toast.success('Flip started! Check Time & Income panel to track progress.');
      } else {
        // Activate rental property
        await api.activateRental(newDeal.id, gameRun.id, proFormaOutputs.cashFlowMonthly);
        toast.success('Rental activated! You will receive weekly income.');
      }

      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setCurrentScreen('results');
    } catch (error) {
      toast.error('Failed to save deal');
    }
  }, [gameRun, selectedProperty, proFormaOutputs, proFormaInputs, createDealMutation, createLedgerMutation, queryClient]);

  const handleAdvanceWeek = useCallback(async () => {
    if (!gameRun) return;

    try {
      const result = await api.advanceGameWeek(gameRun.id);

      // Show income notifications for rental payments
      result.rentalPayments.forEach((payment: any) => {
        const property = properties.find(p => p.id === deals.find(d => d.id === payment.dealId)?.propertyId);
        addRentalPayment(payment.weeklyIncome, property?.name);
      });

      // Show flip completion notifications
      result.completedFlips.forEach((flip: any) => {
        const deal = deals.find(d => d.id === flip.dealId);
        const property = properties.find(p => p.id === deal?.propertyId);
        addFlipProceeds(flip.salePrice, flip.profit, property?.name);
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


        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          {currentScreen === 'market' && (
            <PropertySelector
              properties={properties}
              selectedId={selectedPropertyId}
              onSelect={handlePropertyClick}
              locationFilter={locationFilter}
              onLocationFilterChange={setLocationFilter}
            />
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
                  />
                </div>

                <div className="lg:col-span-1">
                  <MetricsPanel 
                    outputs={proFormaOutputs}
                    isUnlocked={isProFormaComplete}
                    onCommitDeal={handleCommitDeal}
                    strategy={proFormaInputs.strategy}
                    flipROI={flipMetrics.roi}
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
      </div>
    </div>
  );
}