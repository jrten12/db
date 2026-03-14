import { useEffect } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, Gamepad2, AlertTriangle, Lightbulb, Info } from 'lucide-react';
import { getArticleBySlug, LEARN_ARTICLES } from '@/lib/learnArticles';
import type { ArticleSection, InfographicData } from '@/lib/learnArticles';
import Footer from '@/components/Footer';
import dbLogoImage from '@assets/new_icon_db_1772940176909.webp';

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

const DIFFICULTY_BADGES: Record<string, { label: string; color: string; bg: string }> = {
  beginner: { label: 'Beginner', color: 'rgba(74,222,128,0.8)', bg: 'rgba(16,185,129,0.1)' },
  intermediate: { label: 'Intermediate', color: 'rgba(251,191,36,0.8)', bg: 'rgba(251,191,36,0.1)' },
  advanced: { label: 'Advanced', color: 'rgba(239,68,68,0.7)', bg: 'rgba(239,68,68,0.1)' },
};

function InfographicBlock({ data }: { data: InfographicData }) {
  const colorMap: Record<string, { bar: string; text: string; border: string }> = {
    emerald: { bar: 'rgba(16,185,129,0.6)', text: '#4ade80', border: 'rgba(16,185,129,0.2)' },
    red: { bar: 'rgba(239,68,68,0.5)', text: '#f87171', border: 'rgba(239,68,68,0.2)' },
    amber: { bar: 'rgba(251,191,36,0.5)', text: '#fbbf24', border: 'rgba(251,191,36,0.2)' },
    blue: { bar: 'rgba(59,130,246,0.5)', text: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
    purple: { bar: 'rgba(147,51,234,0.5)', text: '#a78bfa', border: 'rgba(147,51,234,0.2)' },
  };

  if (data.type === 'breakdown' || data.type === 'scale') {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(180,155,80,0.12)' }}>
        {data.title && (
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(180,155,80,0.08)' }}>
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.6)' }}>{data.title}</h4>
          </div>
        )}
        <div className="p-5 space-y-3">
          {data.items.map((item, i) => {
            const c = colorMap[item.color || 'amber'];
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium" style={{ color: '#e8dfc8' }}>{item.label}</span>
                </div>
                <div className="relative h-8 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div
                    className="absolute inset-y-0 left-0 rounded-lg flex items-center px-3 transition-all duration-700"
                    style={{ width: `${Math.max(item.percentage || 50, 15)}%`, background: c.bar }}
                  >
                    <span className="text-xs font-medium truncate" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {item.value}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (data.type === 'comparison') {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(180,155,80,0.12)' }}>
        {data.title && (
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(180,155,80,0.08)' }}>
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.6)' }}>{data.title}</h4>
          </div>
        )}
        <div className="divide-y" style={{ borderColor: 'rgba(180,155,80,0.06)' }}>
          {data.items.map((item, i) => {
            const c = colorMap[item.color || 'amber'];
            return (
              <div key={i} className="px-5 py-3.5 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: c.bar }} />
                <div>
                  <div className="text-sm font-medium mb-0.5" style={{ color: '#e8dfc8' }}>{item.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: 'rgba(200,195,180,0.55)' }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (data.type === 'steps') {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(180,155,80,0.12)' }}>
        {data.title && (
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(180,155,80,0.08)' }}>
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.6)' }}>{data.title}</h4>
          </div>
        )}
        <div className="p-5 space-y-0">
          {data.items.map((item, i) => {
            const c = colorMap[item.color || 'amber'];
            const isLast = i === data.items.length - 1;
            return (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: c.bar, color: '#fff' }}>
                    {i + 1}
                  </div>
                  {!isLast && <div className="w-0.5 flex-1 my-1" style={{ background: 'rgba(180,155,80,0.1)' }} />}
                </div>
                <div className={isLast ? 'pb-0' : 'pb-4'}>
                  <div className="text-sm font-medium mb-0.5" style={{ color: '#e8dfc8' }}>{item.label}</div>
                  <div className="text-xs leading-relaxed" style={{ color: 'rgba(200,195,180,0.55)' }}>{item.value}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (data.type === 'spectrum') {
    return (
      <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(180,155,80,0.12)' }}>
        {data.title && (
          <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(180,155,80,0.08)' }}>
            <h4 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'rgba(212,175,55,0.6)' }}>{data.title}</h4>
          </div>
        )}
        <div className="p-5">
          <div className="relative h-3 rounded-full mb-5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '100%', background: 'linear-gradient(90deg, rgba(59,130,246,0.5), rgba(16,185,129,0.5), rgba(251,191,36,0.5), rgba(239,68,68,0.5))' }} />
          </div>
          <div className="space-y-3">
            {data.items.map((item, i) => {
              const c = colorMap[item.color || 'amber'];
              return (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <span className="text-sm font-bold flex-shrink-0 w-12 text-right" style={{ color: c.text }}>{item.label}</span>
                  <span className="text-xs leading-relaxed" style={{ color: 'rgba(200,195,180,0.6)' }}>{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function SectionBlock({ section }: { section: ArticleSection }) {
  const sectionType = section.type || 'text';

  if (sectionType === 'callout') {
    return (
      <section className="rounded-xl border p-5" style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.15)' }}>
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#60a5fa' }} />
          <div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#93c5fd' }}>{section.heading}</h2>
            <p className="text-sm leading-[1.8]" style={{ color: 'rgba(210,205,190,0.7)' }}>{section.content}</p>
          </div>
        </div>
      </section>
    );
  }

  if (sectionType === 'warning') {
    return (
      <section className="rounded-xl border p-5" style={{ background: 'rgba(239,68,68,0.04)', borderColor: 'rgba(239,68,68,0.15)' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
          <div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#fca5a5' }}>{section.heading}</h2>
            <p className="text-sm leading-[1.8]" style={{ color: 'rgba(210,205,190,0.7)' }}>{section.content}</p>
          </div>
        </div>
      </section>
    );
  }

  if (sectionType === 'tip') {
    return (
      <section className="rounded-xl border p-5" style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#4ade80' }} />
          <div>
            <h2 className="text-lg font-semibold mb-2" style={{ color: '#86efac' }}>{section.heading}</h2>
            <p className="text-sm leading-[1.8]" style={{ color: 'rgba(210,205,190,0.7)' }}>{section.content}</p>
          </div>
        </div>
      </section>
    );
  }

  if (sectionType === 'infographic' && section.infographicData) {
    return (
      <section>
        <h2 className="text-xl font-semibold mb-2" style={{ color: '#e8dfc8' }}>{section.heading}</h2>
        <p className="text-sm leading-[1.8] mb-4" style={{ color: 'rgba(210,205,190,0.6)' }}>{section.content}</p>
        <InfographicBlock data={section.infographicData} />
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold mb-3" style={{ color: '#e8dfc8' }}>{section.heading}</h2>
      <p className="text-base leading-[1.8]" style={{ color: 'rgba(210,205,190,0.7)' }}>{section.content}</p>
    </section>
  );
}

export default function LearnArticle() {
  const params = useParams<{ slug: string }>();
  const article = getArticleBySlug(params.slug || '');

  useEffect(() => {
    if (article) {
      document.title = `${article.title} | Dealbreak Learning Center`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute('content', `${article.subtitle}. Learn real estate investing concepts with Dealbreak's free guides.`);
      }
    }
    window.scrollTo(0, 0);
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0c0e' }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4" style={{ color: '#f0e6d0' }}>Article Not Found</h1>
          <Link href="/learn">
            <span className="inline-flex items-center gap-2 text-sm cursor-pointer" style={{ color: '#d4af37' }}>
              <ArrowLeft className="w-4 h-4" />
              Back to Learning Center
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const heroSrc = article.heroImage ? HERO_IMAGES[article.heroImage] : null;
  const diffBadge = DIFFICULTY_BADGES[article.difficulty || 'beginner'];

  const relatedArticles = article.relatedSlugs
    .map(slug => LEARN_ARTICLES.find(a => a.slug === slug))
    .filter(Boolean);

  return (
    <div
      className="min-h-screen min-h-[100dvh]"
      style={{ background: '#0c0c0e' }}
      data-testid={`article-page-${article.slug}`}
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
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={dbLogoImage} alt="Dealbreak" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-lg tracking-wide" style={{ color: '#d4af37' }}>Dealbreak</span>
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
                data-testid="button-play-from-article"
              >
                Play Now
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {heroSrc && (
        <div className="relative w-full max-h-[280px] sm:max-h-[340px] overflow-hidden">
          <img
            src={heroSrc}
            alt={article.title}
            className="w-full h-full object-cover"
            style={{ filter: 'brightness(0.6)' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 30%, #0c0c0e 100%)' }} />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-5 pt-8 pb-12" style={{ marginTop: heroSrc ? '-60px' : '0', position: 'relative', zIndex: 1 }}>
        <div className="mb-8">
          <Link href="/learn">
            <span className="inline-flex items-center gap-1.5 text-sm mb-6 cursor-pointer transition-colors" style={{ color: 'rgba(212,175,55,0.6)' }} data-testid="link-breadcrumb-learn">
              <ArrowLeft className="w-4 h-4" />
              Learning Center
            </span>
          </Link>

          <div className="flex items-center gap-3 mb-3 mt-4 flex-wrap">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(212,175,55,0.1)', color: 'rgba(212,175,55,0.7)' }}>
              {article.category}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: diffBadge.bg, color: diffBadge.color }}>
              {diffBadge.label}
            </span>
            <span className="text-xs" style={{ color: 'rgba(200,195,180,0.35)' }}>
              {article.readTime} read
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight mb-3" style={{ color: '#f0e6d0' }} data-testid="text-article-title">
            {article.title}
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(220,215,200,0.6)' }}>
            {article.subtitle}
          </p>
        </div>

        <div className="space-y-8">
          {article.sections.map((section, i) => {
            const midPoint = Math.floor(article.sections.length / 2);
            return (
              <div key={i}>
                <SectionBlock section={section} />
              </div>
            );
          })}
        </div>

        <div className="mt-10 p-6 rounded-xl border" style={{ background: 'rgba(16,185,129,0.04)', borderColor: 'rgba(16,185,129,0.15)' }}>
          <div className="flex items-start gap-3">
            <Gamepad2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
            <div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#4ade80' }}>Try It in Dealbreak</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,195,180,0.55)' }}>{article.gameConnection}</p>
              <Link href="/game">
                <button
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{ background: 'rgba(16,185,129,0.15)', color: '#4ade80', border: '1px solid rgba(16,185,129,0.3)' }}
                  data-testid="button-try-in-game"
                >
                  Play Now — It's Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>


        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'rgba(212,175,55,0.5)' }}>
              Continue Reading
            </h3>
            <div className="space-y-3">
              {relatedArticles.map(related => related && (
                <Link key={related.slug} href={`/learn/${related.slug}`}>
                  <div
                    className="group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-amber-700/40"
                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(180,155,80,0.1)' }}
                    data-testid={`link-related-${related.slug}`}
                  >
                    <span className="text-xl flex-shrink-0">{related.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm group-hover:text-amber-200 transition-colors" style={{ color: '#f0e6d0' }}>
                        {related.title}
                      </h4>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(200,195,180,0.4)' }}>
                        {related.readTime} read
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: '#d4af37' }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>

      <Footer />
      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}
