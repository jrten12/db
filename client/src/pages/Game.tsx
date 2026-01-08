import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StatusBar } from '@/components/game/StatusBar';
import { ProFormaPanel } from '@/components/game/ProFormaPanel';
import { MetricsPanel } from '@/components/game/MetricsPanel';
import { PropertySelector } from '@/components/game/PropertySelector';
import { 
  ProFormaInputs, 
  ProFormaOutputs,
  defaultProForma, 
  calculateProForma,
  convertPropertyToGameProperty
} from '@/lib/gameData';
import { api } from '@/lib/api';
import type { GameRun, Property } from '@shared/schema';
import woodTexture from '@assets/generated_images/dark_mahogany_wood_texture.png';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Game() {
  const queryClient = useQueryClient();
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [proFormaInputs, setProFormaInputs] = useState<ProFormaInputs>(defaultProForma);
  const [proFormaOutputs, setProFormaOutputs] = useState<ProFormaOutputs | null>(null);
  const [isProFormaComplete, setIsProFormaComplete] = useState(false);

  // Fetch or create game run
  const { data: gameRun, isLoading: isLoadingGame, error: gameError } = useQuery({
    queryKey: ['activeGameRun'],
    queryFn: async () => {
      const active = await api.getActiveGameRun();
      if (active) return active;
      
      // Create new game run if none exists
      const newRun = await api.createGameRun({
        playerName: 'Player',
        difficulty: 'apprentice',
        cash: 30000,
        weeksRemaining: 7,
        profitableDeals: 0,
        goalDeals: 3,
        status: 'active',
      });
      
      if (!newRun) {
        throw new Error('Failed to create game run');
      }
      
      return newRun;
    },
  });

  // Fetch properties
  const { data: properties = [], isLoading: isLoadingProps } = useQuery({
    queryKey: ['properties'],
    queryFn: api.getProperties,
  });

  // Update game run mutation
  const updateGameMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<GameRun> }) =>
      api.updateGameRun(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeGameRun'] });
    },
  });

  // Create deal mutation
  const createDealMutation = useMutation({
    mutationFn: api.createDeal,
    onSuccess: () => {
      toast.success('Deal saved!');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

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
      toast.success('Pro forma calculated!');
    }
  }, [proFormaInputs, selectedProperty]);

  const handleCommitDeal = useCallback(async () => {
    if (!gameRun || !selectedProperty || !proFormaOutputs) return;

    try {
      await createDealMutation.mutateAsync({
        gameRunId: gameRun.id,
        propertyId: selectedProperty.id,
        strategy: proFormaInputs.strategy,
        proFormaInputs: proFormaInputs as any,
        proFormaOutputs: proFormaOutputs as any,
        actualProfit: null,
        status: 'planned',
        weeksSpent: null,
      });

      // Update game state
      const newCash = gameRun.cash - proFormaOutputs.downPaymentAmount;
      await updateGameMutation.mutateAsync({
        id: gameRun.id,
        updates: { cash: newCash },
      });

      // Reset for next property
      setIsProFormaComplete(false);
      setProFormaOutputs(null);
      setProFormaInputs(defaultProForma);
    } catch (error) {
      toast.error('Failed to save deal');
    }
  }, [gameRun, selectedProperty, proFormaOutputs, proFormaInputs, createDealMutation, updateGameMutation]);

  if (isLoadingGame || isLoadingProps) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (gameError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-2">Failed to load game</p>
          <p className="text-sm text-muted-foreground">{(gameError as Error).message}</p>
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
        />

        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <PropertySelector
            properties={properties}
            selectedId={selectedPropertyId}
            onSelect={setSelectedPropertyId}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              {selectedProperty && (
                <ProFormaPanel
                  property={convertPropertyToGameProperty(selectedProperty)}
                  inputs={proFormaInputs}
                  onInputsChange={handleInputsChange}
                  onCalculate={handleCalculate}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <MetricsPanel 
                outputs={proFormaOutputs}
                isUnlocked={isProFormaComplete}
                onCommitDeal={handleCommitDeal}
              />
            </div>
          </div>
        </main>

        <footer className="safe-area-bottom" />
      </div>
    </div>
  );
}