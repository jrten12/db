import { useState } from 'react';

const SIZES = {
  '6.9"': { w: 1320, h: 2868, label: 'iPhone 6.9" (iPhone 16 Pro Max)' },
  '6.5"': { w: 1284, h: 2778, label: 'iPhone 6.5" (iPhone 11 Pro Max)' },
  '6.3"': { w: 1206, h: 2622, label: 'iPhone 6.3" (iPhone 16 Pro)' },
};

type SizeKey = keyof typeof SIZES;

const SCREENSHOTS = [
  {
    id: 'market',
    title: 'Browse Properties',
    subtitle: 'Find Your Next Deal',
    description: 'Explore a diverse market of investment properties',
    gradient: 'from-emerald-600 to-teal-800',
    mockContent: 'market',
  },
  {
    id: 'proforma',
    title: 'Build Your Pro Forma',
    subtitle: 'Analyze Every Deal',
    description: 'Run the numbers with real financial models',
    gradient: 'from-blue-600 to-indigo-800',
    mockContent: 'proforma',
  },
  {
    id: 'gameplay',
    title: 'Manage Your Portfolio',
    subtitle: 'Make Smart Decisions',
    description: 'Track cash, time, and profitable deals',
    gradient: 'from-purple-600 to-violet-800',
    mockContent: 'gameplay',
  },
  {
    id: 'results',
    title: 'See Your Results',
    subtitle: 'Learn From Every Deal',
    description: 'Detailed postmortems on every investment',
    gradient: 'from-amber-600 to-orange-800',
    mockContent: 'results',
  },
  {
    id: 'learn',
    title: 'Learn Real Estate',
    subtitle: 'Educational Content',
    description: '13 in-depth articles on investing fundamentals',
    gradient: 'from-rose-600 to-pink-800',
    mockContent: 'learn',
  },
];

function StatusBarMock() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 24px', fontSize: 14, fontWeight: 600, color: '#fff' }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="12" viewBox="0 0 17 12" fill="white"><rect x="0" y="4" width="3" height="8" rx="1" /><rect x="4.5" y="2.5" width="3" height="9.5" rx="1" /><rect x="9" y="1" width="3" height="11" rx="1" /><rect x="13.5" y="0" width="3" height="12" rx="1" /></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="white"><path d="M8 2.4C5.6 2.4 3.4 3.4 1.8 5L0 3.2C2.2 1.2 5 0 8 0s5.8 1.2 8 3.2L14.2 5C12.6 3.4 10.4 2.4 8 2.4zM8 7.2c-1.6 0-3 .6-4 1.6L2 6.8c1.4-1.4 3.6-2.4 6-2.4s4.6 1 6 2.4L12 8.8c-1-1-2.4-1.6-4-1.6zM8 12l-2.4-2.4c.6-.6 1.4-1 2.4-1s1.8.4 2.4 1L8 12z" /></svg>
        <svg width="27" height="13" viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="22" height="12" rx="2.5" stroke="white" strokeOpacity="0.35" /><rect x="24" y="4" width="2.5" height="5" rx="1" fill="white" fillOpacity="0.4" /><rect x="2" y="2" width="18" height="9" rx="1.5" fill="white" /></svg>
      </div>
    </div>
  );
}

function GameStatusBarMock() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 16px', margin: '0 12px',
      background: 'rgba(0,0,0,0.4)', borderRadius: 12, backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.08)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#4ade80', fontSize: 22, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>$87,450</div>
        <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>CASH</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#60a5fa', fontSize: 22, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>38</div>
        <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>MONTHS LEFT</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div><span style={{ color: '#4ade80', fontSize: 22, fontWeight: 800 }}>1</span><span style={{ color: '#6b7280', fontSize: 18 }}>/2</span></div>
        <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>DEALS</div>
      </div>
    </div>
  );
}

function PropertyCardMock({ name, price, type, location, condition, beds, sqft, highlighted }: {
  name: string; price: string; type: string; location: string; condition: string;
  beds: string; sqft: string; highlighted?: boolean;
}) {
  return (
    <div style={{
      background: highlighted ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
      border: highlighted ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16, padding: '18px 16px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ color: '#fff', fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{name}</div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>{location} · {type}</div>
        </div>
        <div style={{ color: '#4ade80', fontSize: 20, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>{price}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#d1d5db' }}>{beds}</span>
        <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#d1d5db' }}>{sqft}</span>
        <span style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: '#d1d5db' }}>{condition}</span>
      </div>
    </div>
  );
}

function MarketScreen() {
  return (
    <div style={{ padding: '16px 12px' }}>
      <GameStatusBarMock />
      <div style={{ padding: '16px 4px', marginTop: 12 }}>
        <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Property Market</div>
        <div style={{ color: '#9ca3af', fontSize: 13, marginBottom: 16 }}>Select a property to analyze</div>
        <PropertyCardMock name="Elmwood Bungalow" price="$188K" type="Single Family" location="Suburban" condition="Needs Work" beds="3 bed / 1 bath" sqft="1,200 sqft" highlighted />
        <PropertyCardMock name="Downtown Loft" price="$330K" type="Condo" location="Urban" condition="Good" beds="2 bed / 2 bath" sqft="1,100 sqft" />
        <PropertyCardMock name="Riverside Ranch" price="$293K" type="Single Family" location="Suburban" condition="Fair" beds="4 bed / 2 bath" sqft="1,800 sqft" />
        <PropertyCardMock name="Kensington Row" price="$218K" type="Rowhouse" location="Urban" condition="Dated" beds="3 bed / 1.5 bath" sqft="1,400 sqft" />
      </div>
    </div>
  );
}

function ProFormaScreen() {
  return (
    <div style={{ padding: '16px 12px' }}>
      <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginBottom: 4, padding: '0 4px' }}>Pro Forma Analysis</div>
      <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 16, padding: '0 4px' }}>Elmwood Bungalow · $188,000</div>
      
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 12 }}>
        <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' as const }}>Financing</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>LTV</span>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>75%</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 14 }}>
          <div style={{ height: 6, background: 'linear-gradient(90deg, #3b82f6, #10b981)', borderRadius: 3, width: '55%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>Down Payment</span>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>$47,000</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>Interest Rate</span>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>5.8%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>Monthly Payment</span>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>$829</span>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 12 }}>
        <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' as const }}>Income & Expenses</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>Expected Rent</span>
          <span style={{ color: '#4ade80', fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>$1,450/mo</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>Vacancy (7%)</span>
          <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>-$102</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#9ca3af', fontSize: 13 }}>Operating Expenses</span>
          <span style={{ color: '#ef4444', fontSize: 14, fontWeight: 600, fontFamily: 'Space Mono, monospace' }}>-$386</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>Monthly Cash Flow</span>
          <span style={{ color: '#4ade80', fontSize: 16, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>$133</span>
        </div>
      </div>

      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, padding: 18 }}>
        <div style={{ color: '#10b981', fontSize: 11, fontWeight: 700, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' as const }}>Returns</div>
        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4ade80', fontSize: 28, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>2.8%</div>
            <div style={{ color: '#9ca3af', fontSize: 11 }}>Cash-on-Cash</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#60a5fa', fontSize: 28, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>6.1%</div>
            <div style={{ color: '#9ca3af', fontSize: 11 }}>Cap Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GameplayScreen() {
  return (
    <div style={{ padding: '16px 12px' }}>
      <GameStatusBarMock />
      <div style={{ padding: '16px 4px', marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>Your Portfolio</div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>1 active rental · 1 flip in progress</div>
          </div>
          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: 10, padding: '8px 14px', color: '#4ade80', fontWeight: 700, fontSize: 13
          }}>
            Market: Good ↑
          </div>
        </div>

        <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: '#4ade80', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const }}>Active Rental</div>
            <div style={{ background: 'rgba(16,185,129,0.2)', borderRadius: 6, padding: '2px 8px', color: '#4ade80', fontSize: 10, fontWeight: 600 }}>+$133/mo</div>
          </div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Elmwood Bungalow</div>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 10 }}>Purchased at $188,000 · LTV 75%</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div><span style={{ color: '#9ca3af', fontSize: 11 }}>Equity: </span><span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>$52,400</span></div>
            <div><span style={{ color: '#9ca3af', fontSize: 11 }}>Total Return: </span><span style={{ color: '#4ade80', fontSize: 12, fontWeight: 600 }}>+$2,660</span></div>
          </div>
        </div>

        <div style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)', borderRadius: 16, padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: '#fbbf24', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' as const }}>Flip — Rehab In Progress</div>
            <div style={{ background: 'rgba(251,191,36,0.2)', borderRadius: 6, padding: '2px 8px', color: '#fbbf24', fontSize: 10, fontWeight: 600 }}>3 mo left</div>
          </div>
          <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Downtown Loft</div>
          <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 10 }}>Purchased at $330,000 · Rehab: $45,000</div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3 }}>
            <div style={{ height: 6, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 3, width: '62%' }} />
          </div>
          <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 6 }}>62% complete · Standard finish</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 16 }}>
          <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' as const }}>Recent Activity</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#4ade80' }} />
            <span style={{ color: '#d1d5db', fontSize: 12 }}>Rent collected: +$1,450</span>
            <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>Month 14</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#f59e0b' }} />
            <span style={{ color: '#d1d5db', fontSize: 12 }}>Rehab progress: roof complete</span>
            <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>Month 14</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444' }} />
            <span style={{ color: '#d1d5db', fontSize: 12 }}>Maintenance: plumbing repair -$450</span>
            <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>Month 13</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultsScreen() {
  return (
    <div style={{ padding: '16px 12px' }}>
      <div style={{ textAlign: 'center', marginBottom: 20, paddingTop: 8 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
        <div style={{ color: '#4ade80', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>YOU WON!</div>
        <div style={{ color: '#9ca3af', fontSize: 14 }}>2 profitable deals in 38 months</div>
      </div>

      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 16, padding: 18, marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <div style={{ color: '#4ade80', fontSize: 24, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>$142K</div>
            <div style={{ color: '#9ca3af', fontSize: 11 }}>Final Cash</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div>
            <div style={{ color: '#60a5fa', fontSize: 24, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>$42K</div>
            <div style={{ color: '#9ca3af', fontSize: 11 }}>Total Profit</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />
          <div>
            <div style={{ color: '#fbbf24', fontSize: 24, fontWeight: 800, fontFamily: 'Space Mono, monospace' }}>42%</div>
            <div style={{ color: '#9ca3af', fontSize: 11 }}>ROI</div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18, marginBottom: 12 }}>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Deal Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ color: '#d1d5db', fontSize: 13 }}>Elmwood Bungalow (Rental)</span>
          <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>+$18,200</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#d1d5db', fontSize: 13 }}>Downtown Loft (Flip)</span>
          <span style={{ color: '#4ade80', fontSize: 13, fontWeight: 700 }}>+$24,100</span>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18 }}>
        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Achievements Earned</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { emoji: '🎯', name: 'First Deal', color: '#10b981' },
            { emoji: '🔨', name: 'Flip Master', color: '#f59e0b' },
            { emoji: '🏠', name: 'Landlord', color: '#3b82f6' },
          ].map((a) => (
            <div key={a.name} style={{
              background: `rgba(255,255,255,0.04)`,
              border: `1px solid rgba(255,255,255,0.08)`,
              borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 20 }}>{a.emoji}</span>
              <span style={{ color: a.color, fontSize: 12, fontWeight: 600 }}>{a.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LearnScreen() {
  return (
    <div style={{ padding: '16px 12px' }}>
      <div style={{ padding: '0 4px', marginBottom: 20 }}>
        <div style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Learning Center</div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>Master real estate investing fundamentals</div>
      </div>
      {[
        { title: 'What Is a Pro Forma?', difficulty: 'Beginner', color: '#10b981', desc: 'The financial blueprint every investor needs' },
        { title: 'Understanding Cap Rate', difficulty: 'Beginner', color: '#10b981', desc: 'How to measure property profitability' },
        { title: 'The LTV Trap', difficulty: 'Intermediate', color: '#f59e0b', desc: 'Why higher leverage isn\'t always better' },
        { title: 'Due Diligence Deep Dive', difficulty: 'Intermediate', color: '#f59e0b', desc: 'What inspections actually reveal' },
        { title: 'Flip vs. Rent Analysis', difficulty: 'Advanced', color: '#ef4444', desc: 'Choosing the right exit strategy' },
      ].map((article) => (
        <div key={article.title} style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 16, padding: 16, marginBottom: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, flex: 1 }}>{article.title}</div>
            <span style={{
              background: `${article.color}20`, color: article.color,
              borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' as const,
            }}>{article.difficulty}</span>
          </div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>{article.desc}</div>
        </div>
      ))}
    </div>
  );
}

function ScreenFrame({ screenshot, size }: { screenshot: typeof SCREENSHOTS[0]; size: typeof SIZES['6.9"'] }) {
  const scale = 0.25;
  const contentRenderers: Record<string, () => JSX.Element> = {
    market: MarketScreen,
    proforma: ProFormaScreen,
    gameplay: GameplayScreen,
    results: ResultsScreen,
    learn: LearnScreen,
  };
  const ContentComponent = contentRenderers[screenshot.mockContent];

  return (
    <div style={{ display: 'inline-block', margin: 16, verticalAlign: 'top' }}>
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4, textAlign: 'center' }}>
        {screenshot.title} — {size.w}×{size.h}
      </div>
      <div
        id={`screenshot-${screenshot.id}-${size.w}x${size.h}`}
        style={{
          width: size.w * scale,
          height: size.h * scale,
          overflow: 'hidden',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
        }}
      >
        <div style={{
          width: size.w,
          height: size.h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          background: '#0f172a',
          fontFamily: 'Inter, -apple-system, sans-serif',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              background: `linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,1) 100%)`,
              paddingTop: 54,
            }}>
              <StatusBarMock />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ContentComponent />
            </div>
            <div style={{ height: 34, background: '#0f172a' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FullSizeScreenshot({ screenshot, size }: { screenshot: typeof SCREENSHOTS[0]; size: typeof SIZES['6.9"'] }) {
  const contentRenderers: Record<string, () => JSX.Element> = {
    market: MarketScreen,
    proforma: ProFormaScreen,
    gameplay: GameplayScreen,
    results: ResultsScreen,
    learn: LearnScreen,
  };
  const ContentComponent = contentRenderers[screenshot.mockContent];

  return (
    <div
      id={`full-${screenshot.id}-${size.w}x${size.h}`}
      style={{
        width: size.w,
        height: size.h,
        background: '#0f172a',
        fontFamily: 'Inter, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        left: -9999,
        top: 0,
      }}
    >
      <div style={{ paddingTop: 54 }}>
        <StatusBarMock />
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ContentComponent />
      </div>
      <div style={{ height: 34, background: '#0f172a' }} />
    </div>
  );
}

export default function AppStoreScreenshots() {
  const [selectedSize, setSelectedSize] = useState<SizeKey>('6.5"');
  const size = SIZES[selectedSize];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ padding: '32px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>App Store Screenshot Generator</h1>
        <p style={{ color: '#9ca3af', fontSize: 14, marginBottom: 16 }}>
          Right-click any full-size frame below and "Open image in new tab", then save. Or use browser dev tools to screenshot the full-size elements.
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {(Object.keys(SIZES) as SizeKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedSize(key)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: selectedSize === key ? '#10b981' : 'rgba(255,255,255,0.1)',
                color: selectedSize === key ? '#000' : '#fff',
                border: 'none',
              }}
            >
              iPhone {key} ({SIZES[key].w}×{SIZES[key].h})
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#9ca3af' }}>Preview ({selectedSize})</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {SCREENSHOTS.map((s) => (
            <ScreenFrame key={s.id} screenshot={s} size={size} />
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: '#fbbf24' }}>
          How to capture full-size screenshots:
        </h2>
        <ol style={{ color: '#d1d5db', fontSize: 13, lineHeight: 2, paddingLeft: 20 }}>
          <li>Open browser DevTools (F12 or Cmd+Option+I)</li>
          <li>Click the device toolbar icon (or Cmd+Shift+M)</li>
          <li>Set dimensions to {size.w} × {size.h}</li>
          <li>Navigate to each /screenshots/[screen] route</li>
          <li>Take a screenshot using DevTools (three-dot menu → "Capture screenshot")</li>
        </ol>
      </div>

      {SCREENSHOTS.map((s) => (
        <FullSizeScreenshot key={s.id} screenshot={s} size={size} />
      ))}
    </div>
  );
}
