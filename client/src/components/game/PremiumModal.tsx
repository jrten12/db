import { X, Wallet, Clock, Sparkles, Ticket, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { playPurchaseConfirmSound } from '@/hooks/useClickSound';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (type: 'cash' | 'weeks' | 'bundle', cashAmount: number, weeksAmount?: number) => void;
  onCouponRedeemed?: (cashAdded: number, monthsAdded: number) => void;
  currentCash: number;
  currentWeeks: number;
  gameRunId?: number;
  triggerReason?: 'no_weeks' | 'low_cash' | 'manual';
  canClose?: boolean;
  onEndGame?: () => void;
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
    title: '10 Extra Months',
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
    title: '25 Extra Months',
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

export function PremiumModal({ isOpen, onClose, onPurchase, onCouponRedeemed, currentCash, currentWeeks, gameRunId, triggerReason = 'manual', canClose = true, onEndGame }: PremiumModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<{ cash: number; months: number } | null>(null);

  // Sort packages based on what the player needs most
  const sortedPackages = [...packages].sort((a, b) => {
    // If out of time, show weeks packages first
    if (triggerReason === 'no_weeks' || currentWeeks <= 0) {
      if (a.type === 'weeks' && b.type !== 'weeks') return -1;
      if (a.type !== 'weeks' && b.type === 'weeks') return 1;
    }
    // If low on cash, show cash packages first
    if (triggerReason === 'low_cash' || currentCash < 3000) {
      if (a.type === 'cash' && b.type !== 'cash') return -1;
      if (a.type !== 'cash' && b.type === 'cash') return 1;
    }
    return 0;
  });

  if (!isOpen) return null;
  
  // Get contextual messaging based on trigger reason
  const getAlertMessage = () => {
    if (triggerReason === 'no_weeks') {
      return {
        show: true,
        title: "You're Out of Time!",
        message: "You have 0 months remaining. Purchase more time to continue playing and close more deals.",
        icon: Clock,
        color: 'red',
      };
    }
    if (triggerReason === 'low_cash') {
      return {
        show: true,
        title: "Running Low on Cash!",
        message: "Your cash is below $3,000. You may need a boost to close your next deal.",
        icon: Wallet,
        color: 'amber',
      };
    }
    return { show: false, title: '', message: '', icon: Wallet, color: '' };
  };
  
  const alert = getAlertMessage();

  const handlePurchase = async (pkg: PremiumPackage) => {
    playPurchaseConfirmSound();
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

  const handleCouponRedeem = async () => {
    if (!couponCode.trim() || !gameRunId) return;
    
    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const response = await apiRequest('POST', '/api/coupons/redeem', {
        code: couponCode.trim(),
        gameRunId,
      });

      const data = await response.json();

      if (data.success) {
        setCouponSuccess({ cash: data.cashAdded, months: data.monthsAdded });
        setCouponCode('');
        
        // Notify parent component
        if (onCouponRedeemed) {
          onCouponRedeemed(data.cashAdded, data.monthsAdded);
        }

        // Close modal after success if not frozen
        if (canClose) {
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      }
    } catch (error: any) {
      setCouponError(error.message || 'Failed to redeem coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={canClose && !purchasing ? onClose : undefined}
    >
      <div 
        className="flex flex-col items-center pt-20 pb-12 px-4 min-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button - always visible at top right */}
        <button
          onClick={onClose}
          className={`fixed top-4 right-4 p-3 rounded-full text-white transition-all z-[100] min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation ${
            canClose 
              ? 'bg-red-500/30 hover:bg-red-500/50 border border-red-500/50' 
              : 'bg-gray-500/30 cursor-not-allowed opacity-50'
          }`}
          disabled={purchasing || !canClose}
          data-testid="button-close-premium"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-4xl">
          {/* Alert Banner for triggered popups */}
          {alert.show && (
            <div className={`mb-6 p-4 rounded-xl border ${
              alert.color === 'red' 
                ? 'bg-red-500/20 border-red-500/40' 
                : 'bg-amber-500/20 border-amber-500/40'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  alert.color === 'red' ? 'bg-red-500/30' : 'bg-amber-500/30'
                }`}>
                  <alert.icon className={`w-6 h-6 ${
                    alert.color === 'red' ? 'text-red-400' : 'text-amber-400'
                  }`} />
                </div>
                <div>
                  <h3 className={`font-bold ${
                    alert.color === 'red' ? 'text-red-300' : 'text-amber-300'
                  }`}>{alert.title}</h3>
                  <p className="text-gray-300 text-sm">{alert.message}</p>
                </div>
              </div>
            </div>
          )}

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
              <div className="text-gray-400 text-sm mb-1">Months Remaining</div>
              <div className="text-white font-bold text-xl">{currentWeeks} Months</div>
            </div>
          </div>

          {/* Packages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {sortedPackages.map((pkg) => {
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
                          <span className="text-blue-400 font-bold">+{pkg.weeksAmount} Months</span>
                        </div>
                      )}
                    </div>

                    <button
                      disabled={true}
                      className="w-full py-3 rounded-xl font-bold transition-all bg-gray-600/50 text-gray-400 border border-gray-500/30 cursor-not-allowed"
                      data-testid={`button-purchase-${pkg.id}`}
                    >
                      ${pkg.priceUSD.toFixed(2)} - Coming Soon
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coupon Code Section */}
          {gameRunId && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowCouponInput(!showCouponInput);
                  setCouponError(null);
                  setCouponSuccess(null);
                }}
                className="flex items-center gap-2 mx-auto text-gray-400 hover:text-white transition-colors"
                data-testid="button-toggle-coupon"
              >
                <Ticket className="w-5 h-5" />
                <span>{showCouponInput ? 'Hide Coupon Code' : 'Have a Coupon Code?'}</span>
              </button>

              {showCouponInput && (
                <div className="mt-4 max-w-md mx-auto">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500/50"
                      disabled={couponLoading}
                      data-testid="input-coupon-code"
                    />
                    <button
                      onClick={handleCouponRedeem}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl font-bold text-black transition-all"
                      data-testid="button-redeem-coupon"
                    >
                      {couponLoading ? '...' : 'Redeem'}
                    </button>
                  </div>

                  {couponError && (
                    <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{couponError}</span>
                    </div>
                  )}

                  {couponSuccess && (
                    <div className="mt-3 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Check className="w-5 h-5" />
                        <span className="font-bold">Coupon Redeemed!</span>
                      </div>
                      <div className="mt-1 text-sm text-emerald-300">
                        {couponSuccess.cash > 0 && <span>+${couponSuccess.cash.toLocaleString()} cash</span>}
                        {couponSuccess.cash > 0 && couponSuccess.months > 0 && <span> and </span>}
                        {couponSuccess.months > 0 && <span>+{couponSuccess.months} months</span>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Info Note */}
          <div className="text-center text-gray-500 text-sm mt-6">
            <p>Premium purchases coming soon!</p>
            <p className="mt-1">These boosts will be available after payment integration</p>
          </div>

          {/* End Game Button - Only show when game is frozen (can't close) */}
          {!canClose && onEndGame && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm">Don't want to continue?</p>
              </div>
              <button
                onClick={onEndGame}
                className="w-full max-w-md mx-auto block py-4 px-6 rounded-xl font-bold text-lg transition-all bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                data-testid="button-end-game"
              >
                See Final Results
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
