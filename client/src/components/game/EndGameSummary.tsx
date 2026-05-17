import { useState, useEffect } from 'react';
import { X, Trophy, Target, TrendingUp, Search, DollarSign, BarChart3, Award, ChevronRight, Landmark, Zap, Scale, Sprout, Lightbulb, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Deal, Property, PropertyInvestigation, GameRun } from '@shared/schema';
import {
  calculateGameStats,
  calculateScorecard,
  getDynamicProfile,
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
  midGame?: boolean;
}

function getContextualTips(stats: GameStats, scorecard: PlayerScorecard, gameRun: GameRun, deals: Deal[]): { tip: string; type: 'insight' | 'warning' | 'encouragement' }[] {
  const tips: { tip: string; type: 'insight' | 'warning' | 'encouragement' }[] = [];
  const monthsUsed = 52 - (gameRun.weeksRemaining || 0);
  const monthsLeft = gameRun.weeksRemaining || 0;
  const cashPct = (gameRun.cash / 100000) * 100;
  const activeRentals = deals.filter(d => d.status === 'active_rental').length;
  const inRehab = deals.filter(d => d.status === 'in_rehab').length;
  const dealsNeeded = (gameRun.goalDeals || 2) - (gameRun.profitableDeals || 0);

  if (stats.totalDeals === 0 && monthsUsed >= 6) {
    tips.push({ tip: "You're halfway through with no deals closed. Time to get aggressive — pick a property and commit.", type: 'warning' });
  } else if (stats.totalDeals === 0 && monthsUsed >= 3) {
    tips.push({ tip: "Still exploring? That's smart early on, but don't wait too long. Good deals need time to pay off.", type: 'insight' });
  }

  if (dealsNeeded > 0 && monthsLeft <= 12 && monthsLeft > 0) {
    tips.push({ tip: `${dealsNeeded} more profitable deal${dealsNeeded > 1 ? 's' : ''} needed with ${monthsLeft} months left. Focus on quick-turn flips or properties with strong cash flow.`, type: 'warning' });
  }

  if (gameRun.profitableDeals >= gameRun.goalDeals) {
    tips.push({ tip: "You've hit your goal! Keep going to build your portfolio or coast into overtime for bragging rights.", type: 'encouragement' });
  }

  if (cashPct < 20 && stats.totalDeals > 0) {
    tips.push({ tip: "Cash is getting thin. Consider selling a rental to free up capital, or wait for rental income to rebuild reserves.", type: 'warning' });
  } else if (cashPct > 150) {
    tips.push({ tip: "You're sitting on a lot of cash. Money in the bank doesn't earn returns — put it to work in a deal.", type: 'insight' });
  }

  if (stats.skippedDiligenceDeals > 0 && stats.totalDeals >= 2) {
    const skipPct = Math.round((stats.skippedDiligenceDeals / stats.totalDeals) * 100);
    if (skipPct > 50) {
      tips.push({ tip: `You've skipped due diligence on ${skipPct}% of deals. Surprise costs eat into profits — inspection reports are worth the time.`, type: 'warning' });
    }
  }

  if (stats.fullDiligenceDeals > 0 && stats.fullDiligenceDeals === stats.totalDeals) {
    tips.push({ tip: "Perfect due diligence record. You're avoiding surprises and making informed decisions.", type: 'encouragement' });
  }

  if (activeRentals >= 2 && stats.totalProfit > 0) {
    tips.push({ tip: "Multiple rentals generating income — your portfolio is building passive cash flow. Watch for refinance opportunities.", type: 'encouragement' });
  }

  if (inRehab >= 2) {
    tips.push({ tip: "Multiple properties in rehab ties up capital. Consider finishing one before starting another.", type: 'insight' });
  }

  if (scorecard.riskTolerance > 80 && stats.totalDeals >= 2) {
    tips.push({ tip: "You're leveraged heavily. High LTV means bigger profits when things work, but one bad deal could sink you.", type: 'warning' });
  }

  if (stats.totalDeals >= 2 && stats.totalProfit < 0) {
    tips.push({ tip: "In the red so far — focus on smaller deals with clear margins. Budget properties with low rehab needs can be reliable winners.", type: 'insight' });
  }

  if (stats.totalDeals >= 3 && stats.flipDeals === 0) {
    tips.push({ tip: "All rentals, no flips. Flipping can generate quick cash to fund more ambitious deals.", type: 'insight' });
  } else if (stats.totalDeals >= 3 && stats.rentalDeals === 0) {
    tips.push({ tip: "All flips, no rentals. A rental provides steady income that can cushion you between flip projects.", type: 'insight' });
  }

  if (monthsUsed <= 3 && stats.totalDeals <= 1) {
    tips.push({ tip: "Early game — research is free. Browse properties, run pro formas, and understand the market before committing big.", type: 'encouragement' });
  }

  return tips.slice(0, 3);
}

export function EndGameSummary({ 
  isOpen, 
  onClose, 
  gameRun, 
  deals, 
  properties, 
  investigations,
  won,
  midGame = false
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
      const investorProfile = getDynamicProfile(gameStats, playerScorecard, gameRun, deals);
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
  const contextualTips = midGame ? getContextualTips(stats, scorecard, gameRun, deals) : [];

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const monthsUsed = 52 - (gameRun.weeksRemaining || 0);
  const cashChange = gameRun.cash - 100000;
  const cashChangeColor = cashChange >= 0 ? 'text-emerald-400' : 'text-red-400';
  const cashChangeSign = cashChange >= 0 ? '+' : '';

  return (
    <div 
      className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      onClick={handleClose}
    >
      <div 
        className="flex flex-col items-center pb-12 px-4 min-h-full"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className="fixed right-4 p-3 bg-red-500/30 hover:bg-red-500/50 border border-red-500/50 rounded-full text-white transition-all z-[100] min-w-[48px] min-h-[48px] flex items-center justify-center cursor-pointer"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 68px)' }}
          data-testid="button-close-summary"
          data-sound="close"
          type="button"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-full max-w-2xl">
          <div className="text-center mb-6">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              midGame ? 'bg-purple-500/20 border-2 border-purple-500/50' 
              : won ? 'bg-amber-500/20 border-2 border-amber-500/50' 
              : 'bg-slate-700/50 border-2 border-slate-600'
            } mb-3`}>
              {midGame ? (
                <BarChart3 className="w-8 h-8 text-purple-400" />
              ) : won ? (
                <Trophy className="w-8 h-8 text-amber-400" />
              ) : (
                <Target className="w-8 h-8 text-slate-400" />
              )}
            </div>
            <h1 className={`text-2xl font-bold mb-1 ${
              midGame ? 'text-purple-400' : won ? 'text-amber-400' : 'text-white'
            }`}>
              {midGame ? 'Performance Stats' : won ? 'Victory!' : 'Game Over'}
            </h1>
            <p className="text-gray-400 text-sm">
              {midGame
                ? `Month ${monthsUsed} of 52 — Here's your progress, ${gameRun.playerName}.`
                : won 
                ? `Congratulations, ${gameRun.playerName}! You achieved your investment goals.`
                : `Good effort, ${gameRun.playerName}. Review your performance below.`
              }
            </p>
          </div>

          {midGame && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                <div className="text-lg font-bold text-emerald-400 font-mono">{formatCurrency(gameRun.cash)}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Cash</div>
                <div className={`text-[10px] font-medium ${cashChangeColor}`}>{cashChangeSign}{formatCurrency(cashChange)}</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                <div className="text-lg font-bold text-blue-400">{gameRun.weeksRemaining}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Months Left</div>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                <div className="text-lg font-bold">
                  <span className={gameRun.profitableDeals >= gameRun.goalDeals ? 'text-emerald-400' : 'text-amber-400'}>{gameRun.profitableDeals}</span>
                  <span className="text-gray-500">/{gameRun.goalDeals}</span>
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">Goal</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 mb-5 bg-slate-800/50 p-1 rounded-xl">
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
            <div className="space-y-4">
              <div className={`${profileColors.bg} border ${profileColors.border} rounded-2xl p-5`}>
                <div className="flex items-center gap-4 mb-3">
                  <div className={`p-3 rounded-xl ${profileColors.bg} border ${profileColors.border}`}>
                    {(() => {
                      const IconComponent = PROFILE_ICONS[profile.icon] || Target;
                      return <IconComponent className={`w-8 h-8 ${profileColors.text}`} />;
                    })()}
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${profileColors.text}`}>{profile.title}</h2>
                    <p className="text-gray-300 text-sm mt-0.5">{profile.description}</p>
                  </div>
                </div>
                
                <div className="border-t border-slate-600/50 pt-3 mt-3">
                  <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Your Investment Traits</h3>
                  <div className="space-y-1.5">
                    {profile.traits.map((trait, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <ChevronRight className={`w-3.5 h-3.5 ${profileColors.text} flex-shrink-0`} />
                        {trait}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {contextualTips.length > 0 && (
                <div className="space-y-2">
                  {contextualTips.map((tip, i) => (
                    <div 
                      key={i} 
                      className={`rounded-xl p-3.5 border flex items-start gap-3 ${
                        tip.type === 'warning' ? 'bg-amber-500/8 border-amber-500/20' :
                        tip.type === 'encouragement' ? 'bg-emerald-500/8 border-emerald-500/20' :
                        'bg-blue-500/8 border-blue-500/20'
                      }`}
                    >
                      <Lightbulb className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        tip.type === 'warning' ? 'text-amber-400' :
                        tip.type === 'encouragement' ? 'text-emerald-400' :
                        'text-blue-400'
                      }`} />
                      <p className="text-sm text-gray-300 leading-relaxed">{tip.tip}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3">Game Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{stats.totalDeals}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Deals</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-xl font-bold ${stats.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(stats.totalProfit)}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Total Profit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-400">{stats.rentalDeals}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Rentals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-amber-400">{stats.flipDeals}</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Flips</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'scorecard' && (
            <div className="space-y-4">
              {stats.totalDeals === 0 ? (
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 text-center">
                  <div className="p-4 rounded-full bg-slate-700/50 inline-flex mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Data Yet</h3>
                  <p className="text-gray-400 text-sm">
                    Complete at least one deal to see your scorecard. Browse properties, run the numbers, and commit to a deal first.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Overall Score</h3>
                      <div className="text-3xl font-bold text-white">{scorecard.overallScore}<span className="text-lg text-gray-400">/100</span></div>
                    </div>
                    <Progress value={scorecard.overallScore} className="h-3" />
                  </div>

                  <div className="grid gap-3">
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
                </>
              )}
            </div>
          )}

          {activeTab === 'benchmarks' && (
            <div className="space-y-4">
              {stats.totalDeals === 0 ? (
                <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700 text-center">
                  <div className="p-4 rounded-full bg-slate-700/50 inline-flex mb-4">
                    <Award className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Benchmarks Yet</h3>
                  <p className="text-gray-400 text-sm">
                    Complete at least one deal to see how you compare to other investors.
                  </p>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button 
              onClick={onClose}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {midGame ? 'Back to Game' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
