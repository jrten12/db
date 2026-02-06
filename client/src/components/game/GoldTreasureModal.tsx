import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/gameData';

interface GoldTreasureModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  propertyName: string;
  discoveryContext: 'diligence' | 'walkthrough';
}

export function GoldTreasureModal({ isOpen, onClose, amount, propertyName, discoveryContext }: GoldTreasureModalProps) {
  const [showGlow, setShowGlow] = useState(false);
  const [showCoins, setShowCoins] = useState(false);
  const [showAmount, setShowAmount] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const glowTimer = setTimeout(() => setShowGlow(true), 200);
      const coinsTimer = setTimeout(() => setShowCoins(true), 600);
      const amountTimer = setTimeout(() => setShowAmount(true), 1200);
      
      return () => {
        clearTimeout(glowTimer);
        clearTimeout(coinsTimer);
        clearTimeout(amountTimer);
      };
    } else {
      setShowGlow(false);
      setShowCoins(false);
      setShowAmount(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500"
      onClick={onClose}
      data-testid="modal-gold-treasure"
      data-sound="swoosh"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      
      <div 
        className="relative max-w-md w-full bg-gradient-to-b from-amber-950 via-amber-900 to-amber-950 rounded-3xl border-4 border-amber-500 shadow-2xl overflow-hidden transform transition-all duration-700 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute inset-0 bg-gradient-to-t from-amber-500/30 via-transparent to-amber-400/20 transition-opacity duration-1000 ${showGlow ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${showGlow ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-400/40 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-300/50 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.3s' }} />
        </div>

        <div className="relative p-8 text-center">
          <div className="mb-4">
            <span className="inline-block px-4 py-1 bg-amber-600/50 rounded-full text-amber-200 text-sm font-bold uppercase tracking-widest animate-pulse">
              {discoveryContext === 'diligence' ? 'Inspection Discovery' : 'Contractor Discovery'}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 mb-6 drop-shadow-lg">
            HIDDEN TREASURE FOUND!
          </h2>

          <div className="relative h-48 flex items-center justify-center mb-6">
            <div className={`transition-all duration-1000 ${showCoins ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <div className="relative">
                <div className="w-40 h-28 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 rounded-b-3xl rounded-t-lg border-4 border-amber-600 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-amber-500 to-amber-700" />
                  <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-yellow-400 via-amber-400 to-transparent">
                    <div className="absolute inset-0 flex flex-wrap justify-center gap-0.5 p-2 pt-4">
                      {[...Array(20)].map((_, i) => (
                        <div 
                          key={i}
                          className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 border border-amber-600 shadow-lg animate-pulse"
                          style={{ 
                            animationDelay: `${i * 0.1}s`,
                            transform: `translateY(${Math.sin(i) * 3}px)`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className={`absolute -top-8 left-1/2 -translate-x-1/2 transition-all duration-500 ${showCoins ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500 border-2 border-amber-600 shadow-xl animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-700 ${showAmount ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-amber-200/80 text-lg mb-2">
              Gold bars discovered under the floorboards at
            </p>
            <p className="text-amber-100 font-bold text-xl mb-4">
              {propertyName}
            </p>
            <div className="inline-block px-8 py-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 rounded-2xl shadow-lg border-2 border-yellow-400/50">
              <span className="text-4xl sm:text-5xl font-black text-amber-950 drop-shadow-sm">
                +{formatCurrency(amount)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`mt-8 w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-amber-500 ${showAmount ? 'opacity-100' : 'opacity-0'}`}
            data-testid="button-treasure-close"
          >
            Collect Treasure
          </button>
        </div>

        {showCoins && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 animate-float-up opacity-0"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  bottom: '30%',
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
