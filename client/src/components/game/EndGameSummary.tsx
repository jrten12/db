import { useState, useEffect } from 'react';
import { X, Trophy, Target, TrendingUp, Search, DollarSign, BarChart3, Award, ChevronRight, Landmark, Zap, Scale, Sprout, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Deal, Property, PropertyInvestigation, GameRun } from '@shared/schema';
import {
  calculateGameStats,
  calculateScorecard,
  classifyInvestorProfile,
  generateBenchmarks,
  type InvestorProfile,
  type PlayerScorecard,
  type GameStats,
  type Benchmark
} from '@/lib/investorProfile';

const PROFILE_ICONS: Record<string, LucideIcon> = {
  'landmark': Landmark,
  'trending-up': TrendingUp,
  'zap': Zap,
  'search': Search,
  'scale': Scale,
  'sprout': Sprout,
};

interface EndGameSummaryProps {
  isOpen: boolean;
  onClose: () => void;
  gameRun: GameRun;
  deals: Deal[];
  properties: Property[];
  investigations: PropertyInvestigation[];
  won: boolean;
}

export function EndGameSummary({ 
  isOpen, 
  onClose, 
  gameRun, 
  deals, 
  properties, 
  investigations,
  won
}: EndGameSummaryProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'scorecard' | 'benchmarks'>('profile');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [scorecard, setScorecard] = useState<PlayerScorecard | null>(null);
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);

  useEffect(() => {
    if (isOpen) {
      const weeksUsed = 52 - (gameRun.weeksRemaining || 0);
      const gameStats = calculateGameStats(deals, investigations, properties, weeksUsed);
      const playerScorecard = calculateScorecard(gameStats);
      const investorProfile = classifyInvestorProfile(gameStats, playerScorecard);
      const playerBenchmarks = generateBenchmarks(gameStats, playerScorecard);
      
      setStats(gameStats);
      setScorecard(playerScorecard);
      setProfile(investorProfile);
      setBenchmarks(playerBenchmarks);
    }
  }, [isOpen, deals, investigations, properties, gameRun]);

  if (!isOpen) return null;
  
  if (!stats || !scorecard || !profile) {
    return null;
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-400' },
      blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-400' },
      red: { bg: 'bg-red-500/20', border: 'border-red-500/40', text: 'text-red-400' },
      purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-400' },
      amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-400' },
      teal: { bg: 'bg-teal-500/20', border: 'border-teal-500/40', text: 'text-teal-400' },
    };
    return colors[color] || colors.blue;
  };

  const profileColors = getColorClasses(profile.color);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="flex flex-col items-center pt-16 pb-12 px-4 min-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="fixed top-4 right-4 p-3 bg-red-500/30 hover:bg-red-500/50 border border-red-500/50 rounded-full text-white transition-all z-[100] min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
          data-testid="button-close-summary"
          data-sound="swoosh"
          type="button"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${won ? 'bg-amber-500/20 border-2 border-amber-500/50' : 'bg-slate-700/50 border-2 border-slate-600'} mb-4`}>
              {won ? (
                <Trophy className="w-10 h-10 text-amber-400" />
              ) : (
                <Target className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${won ? 'text-amber-400' : 'text-white'}`}>
              {won ? 'Victory!' : 'Game Over'}
            </h1>
            <p className="text-gray-400">
              {won 
                ? `Congratulations, ${gameRun.playerName}! You achieved your investment goals.`
                : `Good effort, ${gameRun.playerName}. Review your performance below.`
              }
            </p>
          </div>

          <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl">
            {(['profile', 'scorecard', 'benchmarks'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-slate-700 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'profile' && 'Profile'}
                {tab === 'scorecard' && 'Scorecard'}
                {tab === 'benchmarks' && 'Benchmarks'}
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className={`${profileColors.bg} border ${profileColors.border} rounded-2xl p-6`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className={`p-4 rounded-xl ${profileColors.bg} border ${profileColors.border}`}>
                    {(() => {
                      const IconComponent = PROFILE_ICONS[profile.icon] || Target;
                      return <IconComponent className={`w-10 h-10 ${profileColors.text}`} />;
                    })()}
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${profileColors.text}`}>{profile.title}</h2>
                    <p className="text-gray-300 text-sm mt-1">{profile.description}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-600/50 pt-4 mt-4">
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">Your Investment Traits</h3>
                  <div className="space-y-2">
                    {profile.traits.map((trait, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <ChevronRight className={`w-4 h-4 ${profileColors.text}`} />
                        {trait}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Game Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalDeals}</div>
                    <div className="text-xs text-gray-400">Total Deals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-400">{formatCurrency(stats.totalProfit)}</div>
                    <div className="text-xs text-gray-400">Total Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{stats.rentalDeals}</div>
                    <div className="text-xs text-gray-400">Rentals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{stats.flipDeals}</div>
                    <div className="text-xs text-gray-400">Flips</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scorecard' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Overall Score</h3>
                  <div className="text-3xl font-bold text-white">{scorecard.overallScore}<span className="text-lg text-gray-400">/100</span></div>
                </div>
                <Progress value={scorecard.overallScore} className="h-3" />
              </div>

              <div className="grid gap-4">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <TrendingUp className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">Risk Tolerance</span>
                        <span className="text-sm text-gray-400">{scorecard.riskToleranceLabel}</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={scorecard.riskTolerance} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">
                    Based on average LTV of {Math.round(stats.averageLTV)}% and {stats.highLeverageDeals} high-leverage deals
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Search className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">Due Diligence</span>
                        <span className="text-sm text-gray-400">{scorecard.dueDiligenceLabel}</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={scorecard.dueDiligenceThoroughness} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">
                    Completed {stats.completedDiligenceItems} of {stats.totalPossibleDiligence} possible investigations
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">Strategy Balance</span>
                        <span className="text-sm text-gray-400">{scorecard.strategyLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400">Flips</span>
                    <Progress value={100 - scorecard.cashFlowVsAppreciation} className="h-2 flex-1" />
                    <Progress value={scorecard.cashFlowVsAppreciation} className="h-2 flex-1" />
                    <span className="text-xs text-emerald-400">Rentals</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.rentalDeals} rentals vs {stats.flipDeals} flips
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-white">Capital Efficiency</span>
                        <span className="text-sm text-gray-400">{scorecard.efficiencyLabel}</span>
                      </div>
                    </div>
                  </div>
                  <Progress value={scorecard.capitalEfficiency} className="h-2" />
                  <p className="text-xs text-gray-500 mt-2">
                    {formatCurrency(stats.totalProfit)} profit on {formatCurrency(stats.totalInvested)} invested
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'benchmarks' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                <p className="text-sm text-gray-400 text-center">
                  See how your performance compares to other investors
                </p>
              </div>

              {benchmarks.map((benchmark, i) => (
                <div 
                  key={i} 
                  className={`rounded-xl p-4 border ${
                    benchmark.isPositive 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-amber-500/10 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-white">{benchmark.metric}</h4>
                      <p className={`text-sm ${benchmark.isPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {benchmark.message}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {typeof benchmark.playerValue === 'number' && benchmark.metric.includes('ROI') 
                          ? `${benchmark.playerValue}%`
                          : benchmark.playerValue
                        }
                      </div>
                      <div className="text-xs text-gray-400">
                        Avg: {typeof benchmark.averageValue === 'number' && benchmark.metric.includes('ROI')
                          ? `${benchmark.averageValue}%`
                          : benchmark.averageValue
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Percentile:</span>
                    <Progress value={benchmark.percentile} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-white">{Math.round(benchmark.percentile)}%</span>
                  </div>
                </div>
              ))}

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-blue-400" />
                  <h4 className="font-medium text-blue-400">Pro Tip</h4>
                </div>
                <p className="text-sm text-gray-300">
                  {scorecard.dueDiligenceThoroughness < 50
                    ? 'More thorough due diligence reduces surprise costs and improves deal outcomes.'
                    : scorecard.riskTolerance > 70
                      ? 'High leverage amplifies both gains and losses. Consider moderating for consistency.'
                      : scorecard.capitalEfficiency < 50
                        ? 'Look for deals with better profit margins to improve your return on investment.'
                        : 'Great work! Keep analyzing deals carefully and adjusting your strategy to market conditions.'
                  }
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Button 
              onClick={onClose}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
