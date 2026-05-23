import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { LEARN_ARTICLES } from '@/lib/learnArticles';
import Footer from '@/components/Footer';
import dbLogoImage from '@assets/dealbreak_brand_icon.png';

import imgProForma from '@assets/generated_images/learn_pro_forma.webp';
import imgCapRates from '@assets/generated_images/learn_cap_rates.webp';
import imgFlipVsRent from '@assets/generated_images/learn_flip_vs_rent.webp';
import imgDueDiligence from '@assets/generated_images/learn_due_diligence.webp';
import imgLtvFinancing from '@assets/generated_images/learn_ltv_financing.webp';
import imgMarketConditions from '@assets/generated_images/learn_market_conditions.webp';
import imgRehabBudgets from '@assets/generated_images/learn_rehab_budgets.webp';
import imgCommonMistakes from '@assets/generated_images/learn_common_mistakes.webp';
import imgQuickFilters from '@assets/generated_images/learn_quick_filters.webp';
import imgMarketCrash from '@assets/generated_images/learn_market_crash.webp';
import imgPortfolioStrategy from '@assets/generated_images/learn_portfolio_strategy.webp';
import imgTenantManagement from '@assets/generated_images/learn_tenant_management.webp';

const HERO_IMAGES: Record<string, string> = {
  learn_pro_forma: imgProForma,
  learn_cap_rates: imgCapRates,
  learn_flip_vs_rent: imgFlipVsRent,
  learn_due_diligence: imgDueDiligence,
  learn_ltv_financing: imgLtvFinancing,
  learn_market_conditions: imgMarketConditions,
  learn_rehab_budgets: imgRehabBudgets,
  learn_common_mistakes: imgCommonMistakes,
  learn_quick_filters: imgQuickFilters,
  learn_market_crash: imgMarketCrash,
  learn_portfolio_strategy: imgPortfolioStrategy,
  learn_tenant_management: imgTenantManagement,
};

const DIFFICULTY_COLORS: Record<string, { color: string; bg: string }> = {
  beginner: { color: 'rgba(74,222,128,0.8)', bg: 'rgba(16,185,129,0.1)' },
  intermediate: { color: 'rgba(251,191,36,0.8)', bg: 'rgba(251,191,36,0.1)' },
  advanced: { color: 'rgba(239,68,68,0.7)', bg: 'rgba(239,68,68,0.1)' },
};

export default function Learn() {
  useEffect(() => {
    document.title = 'Learn Real Estate Investing | Dealbreak';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Free guides on real estate investing fundamentals. Learn about pro formas, cap rates, financing, due diligence, and investment strategies through interactive simulation.');
    }
    window.scrollTo(0, 0);
  }, []);

  const categories = Array.from(new Set(LEARN_ARTICLES.map(a => a.category)));

  return (
    <div
      className="min-h-screen min-h-[100dvh]"
      style={{ background: '#0c0c0e' }}
      data-testid="learn-page"
    >
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(180deg, #141416 0%, rgba(14,14,16,0.97) 100%)',
          borderBottom: '1px solid rgba(180,155,80,0.3)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] max-w-6xl mx-auto">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <img
                src={dbLogoImage}
                alt="Dealbreak"
                className="w-11 h-11 rounded-xl ring-1 ring-amber-300/15 shadow-[0_1px_8px_rgba(212,175,55,0.18)] transition-transform duration-200 group-hover:scale-[1.04]"
              />
              <span
                className="font-display text-[1.65rem] leading-none tracking-[-0.015em]"
                style={{
                  background: 'linear-gradient(180deg, #f0d27a 0%, #d4af37 55%, #a87d28 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 1px 0 rgba(0,0,0,0.25)',
                }}
              >
                Dealbreak
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/learn">
              <span className="text-sm font-medium" style={{ color: '#d4af37' }} data-testid="link-learn-nav">Learn</span>
            </Link>
            <Link href="/game">
              <button
                className="px-5 py-2 rounded-md font-semibold text-sm transition-all active:scale-[0.97]"
                style={{ background: 'linear-gradient(180deg, #d4af37 0%, #b8962e 100%)', color: '#0c0c0e', boxShadow: '0 2px 8px rgba(212,175,55,0.3)', border: '1px solid rgba(212,175,55,0.5)' }}
                data-testid="button-play-from-learn"
              >
                Play Now
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-5 pt-12 pb-8">
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm mb-6 cursor-pointer transition-colors" style={{ color: 'rgba(212,175,55,0.6)' }} data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Home
          </span>
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <BookOpen className="w-8 h-8" style={{ color: '#d4af37' }} />
          <h1 className="text-3xl sm:text-4xl font-bold" style={{ color: '#f0e6d0' }} data-testid="text-learn-title">
            Learning Center
          </h1>
        </div>
        <p className="text-lg leading-relaxed max-w-2xl mb-2" style={{ color: 'rgba(220,215,200,0.65)' }}>
          Master the fundamentals of real estate investing. These guides cover the same concepts you'll encounter in the Dealbreak simulator — understanding them will help you make better decisions both in the game and in real life.
        </p>
        <p className="text-sm" style={{ color: 'rgba(200,195,180,0.4)' }}>
          {LEARN_ARTICLES.length} articles across {categories.length} categories
        </p>
      </section>

      {categories.map((category, catIndex) => (
        <div key={category}>
          <section className="max-w-5xl mx-auto px-5 pb-10">
            <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'rgba(212,175,55,0.5)' }}>
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {LEARN_ARTICLES.filter(a => a.category === category).map(article => {
                const heroSrc = article.heroImage ? HERO_IMAGES[article.heroImage] : null;
                const diff = DIFFICULTY_COLORS[article.difficulty || 'beginner'];
                return (
                  <Link key={article.slug} href={`/learn/${article.slug}`}>
                    <div
                      className="group rounded-xl border cursor-pointer transition-all hover:border-amber-700/40 overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(180,155,80,0.12)' }}
                      data-testid={`card-article-${article.slug}`}
                    >
                      {heroSrc && (
                        <div className="relative h-32 sm:h-36 overflow-hidden">
                          <img
                            src={heroSrc}
                            alt={article.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            style={{ filter: 'brightness(0.5)' }}
                            loading="lazy"
                          />
                          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(12,12,14,0.95) 100%)' }} />
                          <div className="absolute bottom-3 left-4">
                            <span className="text-2xl">{article.icon}</span>
                          </div>
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-semibold text-base mb-1.5 group-hover:text-amber-200 transition-colors leading-snug" style={{ color: '#f0e6d0' }}>
                          {article.title}
                        </h3>
                        <p className="text-sm leading-relaxed mb-3 line-clamp-2" style={{ color: 'rgba(200,195,180,0.5)' }}>
                          {article.subtitle}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.color }}>
                            {article.difficulty.charAt(0).toUpperCase() + article.difficulty.slice(1)}
                          </span>
                          <span className="text-xs" style={{ color: 'rgba(200,195,180,0.3)' }}>
                            {article.readTime} read
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      ))}

      <section className="max-w-5xl mx-auto px-5 py-10">
        <div
          className="p-8 rounded-2xl border text-center"
          style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}
        >
          <h2 className="text-xl font-bold mb-3" style={{ color: '#f0e6d0' }}>
            Ready to Put Theory Into Practice?
          </h2>
          <p className="text-sm mb-6 max-w-lg mx-auto" style={{ color: 'rgba(200,195,180,0.55)' }}>
            Dealbreak lets you apply everything you've learned in a realistic real estate simulation. Build pro formas, analyze deals, and learn from your mistakes — without risking real money.
          </p>
          <Link href="/game">
            <button
              className="group py-3 px-8 rounded-lg font-bold text-base transition-all hover:brightness-110 active:scale-[0.98] inline-flex items-center gap-2"
              style={{ background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', color: '#fff', boxShadow: '0 4px 24px rgba(16,185,129,0.35)', border: '1px solid rgba(16,185,129,0.4)' }}
              data-testid="button-play-from-learn-cta"
            >
              Start Playing Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </section>


      <Footer />
      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}
