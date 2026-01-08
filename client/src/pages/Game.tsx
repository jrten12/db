import { useState, useCallback } from 'react';
import { StatusBar } from '@/components/game/StatusBar';
import { ProFormaPanel } from '@/components/game/ProFormaPanel';
import { MetricsPanel } from '@/components/game/MetricsPanel';
import { 
  GameState, 
  ProFormaInputs, 
  ProFormaOutputs,
  defaultProForma, 
  sampleProperty, 
  calculateProForma 
} from '@/lib/gameData';
import woodTexture from '@assets/generated_images/dark_mahogany_wood_texture.png';

export default function Game() {
  const [gameState, setGameState] = useState<GameState>({
    cash: 30000,
    weeksRemaining: 7,
    profitableDeals: 0,
    goalDeals: 3,
    currentProperty: sampleProperty,
    proForma: defaultProForma,
    isProFormaComplete: false,
  });

  const [proFormaOutputs, setProFormaOutputs] = useState<ProFormaOutputs | null>(null);

  const handleInputsChange = useCallback((inputs: ProFormaInputs) => {
    setGameState(prev => ({ ...prev, proForma: inputs }));
    if (gameState.isProFormaComplete && gameState.currentProperty) {
      setProFormaOutputs(calculateProForma(inputs, gameState.currentProperty));
    }
  }, [gameState.isProFormaComplete, gameState.currentProperty]);

  const handleCalculate = useCallback(() => {
    if (gameState.currentProperty) {
      const outputs = calculateProForma(gameState.proForma, gameState.currentProperty);
      setProFormaOutputs(outputs);
      setGameState(prev => ({ ...prev, isProFormaComplete: true }));
    }
  }, [gameState.proForma, gameState.currentProperty]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${woodTexture})` }}
      data-testid="game-screen"
    >
      <div className="min-h-screen bg-black/30">
        <StatusBar 
          cash={gameState.cash}
          weeksRemaining={gameState.weeksRemaining}
          profitableDeals={gameState.profitableDeals}
          goalDeals={gameState.goalDeals}
        />

        <main className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {gameState.currentProperty && (
                <ProFormaPanel
                  property={gameState.currentProperty}
                  inputs={gameState.proForma}
                  onInputsChange={handleInputsChange}
                  onCalculate={handleCalculate}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <MetricsPanel 
                outputs={proFormaOutputs}
                isUnlocked={gameState.isProFormaComplete}
              />
            </div>
          </div>
        </main>

        <footer className="safe-area-bottom" />
      </div>
    </div>
  );
}