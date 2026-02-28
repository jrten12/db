import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { LEARN_ARTICLES } from '@/lib/learnArticles';
import { AdBanner } from '@/components/game/AdBanner';
import Footer from '@/components/Footer';
import dbLogoImage from '@assets/dealbreak_icon_sim_1767848951783.png';

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
        <p className="text-lg leading-relaxed max-w-2xl" style={{ color: 'rgba(220,215,200,0.65)' }}>
          Master the fundamentals of real estate investing. These guides cover the same concepts you'll encounter in the Dealbreak simulator — understanding them will help you make better decisions both in the game and in real life.
        </p>
      </section>

      {categories.map(category => (
        <section key={category} className="max-w-5xl mx-auto px-5 pb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-5" style={{ color: 'rgba(212,175,55,0.5)' }}>
            {category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LEARN_ARTICLES.filter(a => a.category === category).map(article => (
              <Link key={article.slug} href={`/learn/${article.slug}`}>
                <div
                  className="group p-5 rounded-xl border cursor-pointer transition-all hover:border-amber-700/40"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(180,155,80,0.12)',
                  }}
                  data-testid={`card-article-${article.slug}`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0 mt-0.5">{article.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 group-hover:text-amber-200 transition-colors" style={{ color: '#f0e6d0' }}>
                        {article.title}
                      </h3>
                      <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(200,195,180,0.5)' }}>
                        {article.subtitle}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.1)', color: 'rgba(212,175,55,0.6)' }}>
                          {article.category}
                        </span>
                        <span className="text-xs" style={{ color: 'rgba(200,195,180,0.3)' }}>
                          {article.readTime} read
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-60 transition-opacity" style={{ color: '#d4af37' }} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="max-w-5xl mx-auto px-5 py-10">
        <div
          className="p-8 rounded-2xl border text-center"
          style={{
            background: 'rgba(16,185,129,0.04)',
            borderColor: 'rgba(16,185,129,0.15)',
          }}
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
              style={{
                background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                boxShadow: '0 4px 24px rgba(16,185,129,0.35)',
                border: '1px solid rgba(16,185,129,0.4)',
              }}
              data-testid="button-play-from-learn-cta"
            >
              Start Playing Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </Link>
        </div>
      </section>

      <AdBanner className="max-w-5xl mx-auto px-5 pb-6" />

      <Footer />
      <div className="pb-[max(0.5rem,env(safe-area-inset-bottom))]" />
    </div>
  );
}
