import { X, Wallet, Clock, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (type: 'cash' | 'weeks' | 'bundle', cashAmount: number, weeksAmount?: number) => void;
  currentCash: number;
  currentWeeks: number;
}

interface PremiumPackage {
  id: string;
  type: 'cash' | 'weeks' | 'bundle';
  title: string;
  description: string;
  priceUSD: number;
  cashAmount?: number;
  weeksAmount?: number;
  icon: React.ElementType;
  iconColor: string;
  bgGradient: string;
  borderColor: string;
  popular?: boolean;
}

const packages: PremiumPackage[] = [
  {
    id: 'cash-small',
    type: 'cash',
    title: '$50,000 Cash Boost',
    description: 'Perfect for closing your next deal',
    priceUSD: 0.99,
    cashAmount: 50000,
    icon: Wallet,
    iconColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'cash-medium',
    type: 'cash',
    title: '$150,000 Cash Boost',
    description: 'Level up your investment power',
    priceUSD: 1.99,
    cashAmount: 150000,
    icon: Wallet,
    iconColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
  },
  {
    id: 'cash-large',
    type: 'cash',
    title: '$300,000 Cash Boost',
    description: 'Premium investor package',
    priceUSD: 2.99,
    cashAmount: 300000,
    icon: Wallet,
    iconColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-500/30',
    popular: true,
  },
  {
    id: 'weeks-small',
    type: 'weeks',
    title: '10 Extra Weeks',
    description: 'More time to find opportunities',
    priceUSD: 0.99,
    weeksAmount: 10,
    icon: Clock,
    iconColor: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'weeks-medium',
    type: 'weeks',
    title: '25 Extra Weeks',
    description: 'Extended timeline for success',
    priceUSD: 1.99,
    weeksAmount: 25,
    icon: Clock,
    iconColor: 'text-blue-400',
    bgGradient: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 'bundle-ultimate',
    type: 'bundle',
    title: 'Ultimate Bundle',
    description: 'Cash & Time combo package',
    priceUSD: 4.99,
    cashAmount: 200000,
    weeksAmount: 20,
    icon: Sparkles,
    iconColor: 'text-purple-400',
    bgGradient: 'from-purple-500/20 to-pink-600/10',
    borderColor: 'border-purple-500/30',
    popular: true,
  },
];

export function PremiumModal({ isOpen, onClose, onPurchase, currentCash, currentWeeks }: PremiumModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  if (!isOpen) return null;

  const handlePurchase = async (pkg: PremiumPackage) => {
    setSelectedPackage(pkg.id);
    setPurchasing(true);

    try {
      if (pkg.type === 'bundle') {
        await onPurchase(pkg.type, pkg.cashAmount || 0, pkg.weeksAmount || 0);
      } else if (pkg.type === 'cash') {
        await onPurchase(pkg.type, pkg.cashAmount || 0);
      } else if (pkg.type === 'weeks') {
        await onPurchase(pkg.type, pkg.weeksAmount || 0);
      }

      // Success animation delay before closing
      setTimeout(() => {
        setPurchasing(false);
        setSelectedPackage(null);
        onClose();
      }, 800);
    } catch (error) {
      console.error('Purchase failed:', error);
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="flex flex-col items-center py-12 px-4 min-h-full">
        <button
          onClick={onClose}
          className="fixed top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-10"
          disabled={purchasing}
          data-testid="button-close-premium"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-yellow-500/20 to-orange-600/10 rounded-2xl border border-yellow-500/30 mb-4">
              <Sparkles className="w-10 h-10 text-yellow-400" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-2">Premium Boosts</h2>
            <p className="text-gray-400 text-lg">Get more cash and time to reach your goals</p>
          </div>

          {/* Current Stats */}
          <div className="flex justify-center gap-4 mb-8">
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-gray-400 text-sm mb-1">Current Cash</div>
              <div className="text-white font-bold text-xl">${currentCash.toLocaleString()}</div>
            </div>
            <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="text-gray-400 text-sm mb-1">Weeks Remaining</div>
              <div className="text-white font-bold text-xl">{currentWeeks} Weeks</div>
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {packages.map((pkg) => {
              const Icon = pkg.icon;
              const isSelected = selectedPackage === pkg.id;
              const isPurchasing = purchasing && isSelected;

              return (
                <div
                  key={pkg.id}
                  className={`relative overflow-hidden rounded-2xl border backdrop-blur-md transition-all ${
                    pkg.borderColor
                  } ${
                    isPurchasing
                      ? 'scale-105 shadow-2xl'
                      : 'hover:scale-105 hover:shadow-xl'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute top-3 right-3 px-3 py-1 bg-yellow-500/90 rounded-full text-xs font-bold text-black">
                      POPULAR
                    </div>
                  )}

                  <div className={`p-6 bg-gradient-to-br ${pkg.bgGradient}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-3 bg-black/30 rounded-xl ${pkg.iconColor}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{pkg.title}</h3>
                      </div>
                    </div>

                    <p className="text-gray-300 text-sm mb-4 min-h-[40px]">{pkg.description}</p>

                    <div className="space-y-2 mb-4">
                      {pkg.cashAmount && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Cash Bonus:</span>
                          <span className="text-emerald-400 font-bold">
                            +${pkg.cashAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {pkg.weeksAmount && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Time Bonus:</span>
                          <span className="text-blue-400 font-bold">+{pkg.weeksAmount} Weeks</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={purchasing}
                      className={`w-full py-3 rounded-xl font-bold transition-all ${
                        isPurchasing
                          ? 'bg-emerald-500 text-white animate-pulse'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                      data-testid={`button-purchase-${pkg.id}`}
                    >
                      {isPurchasing ? '✓ Purchased!' : `Buy for $${pkg.priceUSD.toFixed(2)}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Note */}
          <div className="text-center text-gray-500 text-sm">
            <p>Purchases are simulated - Stripe integration coming soon</p>
            <p className="mt-1">Premium purchases instantly boost your in-game resources</p>
          </div>
        </div>
      </div>
    </div>
  );
}
