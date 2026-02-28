import { useEffect } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowRight, BookOpen, Gamepad2 } from 'lucide-react';
import { getArticleBySlug, LEARN_ARTICLES } from '@/lib/learnArticles';
import { AdBanner } from '@/components/game/AdBanner';
import Footer from '@/components/Footer';
import dbLogoImage from '@assets/dealbreak_icon_sim_1767848951783.png';

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
              <span className="font-bold text-lg tracking-wide" style={{ color: '#d4af37' }}>
                Dealbreak
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/learn">
              <span className="text-sm font-medium" style={{ color: '#d4af37' }} data-testid="link-learn-nav">
                Learn
              </span>
            </Link>
            <Link href="/game">
              <button
                className="px-5 py-2 rounded-md font-semibold text-sm transition-all active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(180deg, #d4af37 0%, #b8962e 100%)',
                  color: '#0c0c0e',
                  boxShadow: '0 2px 8px rgba(212,175,55,0.3)',
                  border: '1px solid rgba(212,175,55,0.5)',
                }}
                data-testid="button-play-from-article"
              >
                Play Now
              </button>
            </Link>
          </div>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-5 pt-10 pb-12">
        <div className="mb-8">
          <Link href="/learn">
            <span className="inline-flex items-center gap-1.5 text-sm mb-6 cursor-pointer transition-colors" style={{ color: 'rgba(212,175,55,0.6)' }} data-testid="link-breadcrumb-learn">
              <ArrowLeft className="w-4 h-4" />
              Learning Center
            </span>
          </Link>

          <div className="flex items-center gap-3 mb-2 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(212,175,55,0.1)', color: 'rgba(212,175,55,0.7)' }}>
              {article.category}
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
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold mb-3" style={{ color: '#e8dfc8' }}>
                {section.heading}
              </h2>
              <p className="text-base leading-[1.8]" style={{ color: 'rgba(210,205,190,0.7)' }}>
                {section.content}
              </p>
            </section>
          ))}
        </div>

        <div
          className="mt-10 p-6 rounded-xl border"
          style={{
            background: 'rgba(16,185,129,0.04)',
            borderColor: 'rgba(16,185,129,0.15)',
          }}
        >
          <div className="flex items-start gap-3">
            <Gamepad2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#10b981' }} />
            <div>
              <h3 className="font-semibold text-sm mb-1" style={{ color: '#4ade80' }}>
                Try It in Dealbreak
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,195,180,0.55)' }}>
                {article.gameConnection}
              </p>
              <Link href="/game">
                <button
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'rgba(16,185,129,0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(16,185,129,0.3)',
                  }}
                  data-testid="button-try-in-game"
                >
                  Play Now — It's Free
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </div>
        </div>

        <AdBanner className="mt-10" />

        {relatedArticles.length > 0 && (
          <div className="mt-12">
            <h3 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'rgba(212,175,55,0.5)' }}>
              Related Articles
            </h3>
            <div className="space-y-3">
              {relatedArticles.map(related => related && (
                <Link key={related.slug} href={`/learn/${related.slug}`}>
                  <div
                    className="group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:border-amber-700/40"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderColor: 'rgba(180,155,80,0.1)',
                    }}
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
