# Dealbreak: Real Estate Simulator

## Overview

Dealbreak is a turn-based real estate investment simulator designed as an educational game. It teaches real estate underwriting skills by having players evaluate properties, build pro forma financial models, and make investment decisions under uncertainty. The game focuses on understanding the causality between assumptions, metrics, and outcomes, simulating realistic deal analysis rather than simple number-picking. Players manage cash and time, conduct due diligence, analyze rent or flip strategies, commit to deals, and experience execution events with educational postmortems. The project aims to provide an engaging and informative platform for aspiring real estate investors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query (server state), React `useState` (local state)
- **Styling**: Tailwind CSS v4 with custom CSS variables, shadcn/ui component library built on Radix UI primitives
- **Typography**: Inter (primary sans-serif, closest free match to GT America), Fraunces (serif), Space Mono (monospace for financial figures)
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful JSON API (`/api/*` routes)

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit

### Key Data Models
- Users, GameRuns, Properties, Deals, PropertyInvestigations, HallOfFamePlayers, PlayerTrophies, Coupons, CouponRedemptions.

### Mobile App (iOS)
- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind v4 (Tailwind for RN) — requires `jsxImportSource: 'nativewind'` in babel.config.js
- **Animations**: React Native Reanimated
- **State**: TanStack React Query
- **API Client**: `mobile/src/lib/api.ts` — centralized API client matching all server endpoints
- **Game Logic**: `mobile/src/lib/gameLogic.ts` — pro forma calculations, LTV curves, formatters
- **Screens**: Landing (`index.tsx`), Game (`game.tsx`), Property Detail (`property/[id].tsx`), Pro Forma (`proforma/[id].tsx`), Deal Management (`deal/[id].tsx`), Results (`results.tsx`)
- **UI Design**: WebView wrapper loading dealbreaksimulator.com with native-feel CSS injection (no text selection, no tap highlights, no callouts, no bounce/pull-to-refresh, no link previews). Branded loading screen with fade transition.
- **App Config**: `mobile/app.config.ts` — iOS 17+ privacy manifests, bundle ID `com.dealbreak.simulator`
- **EAS Submit**: `eas.json` — ascAppId `6760164395`, Apple Team `9G2NL8NSRT`, uses `eas submit --platform ios --latest` for TestFlight
- **App Store Checklist**: `mobile/APP_STORE_CHECKLIST.md`

### Content & SEO
- **Branding**: "DealBreak Simulator" (capitalized B) — used consistently in titles, meta, OG tags, JSON-LD
- **Homepage Title**: "DealBreak Simulator – Real Estate Investing Simulator Game" (keyword-optimized)
- **Homepage H1**: "DealBreak Simulator" with subheadline "A Real Estate Investing Simulator Game" and key description paragraph
- **Structured Data**: VideoGame + WebApplication + FAQPage JSON-LD schemas on homepage; Article schemas on content pages
- **Canonical Tags**: Server-side injection replaces existing canonical (not duplicate append) via `injectSeoMeta()` in `server/seo.ts`
- **Explainer Page**: `/what-is-dealbreak-simulator` — SEO-focused content page with Article + BreadcrumbList JSON-LD, priority 0.9 in sitemap
- **Learning Center**: `/learn` hub page with 13 educational articles about real estate investing concepts
- **Article Pages**: `/learn/:slug` individual article pages with engaging content, hero images, CSS infographics, callout/warning/tip sections
- **Article Data**: `client/src/lib/learnArticles.ts` — structured article content with sections (text/callout/warning/tip/infographic types), InfographicData (comparison/scale/breakdown/steps/spectrum), difficulty levels, seoKeywords, heroImage references
- **Article Images**: AI-generated hero images in `attached_assets/generated_images/learn_*.png`, imported via `@assets` alias in LearnArticle.tsx and Learn.tsx
- **SEO Server Module**: `server/seo.ts` — duplicate ARTICLE_DATA for server-side meta injection, per-article keywords, difficulty levels, JSON-LD Article/BreadcrumbList schemas
- **Target Keywords**: "real estate investing simulator", "real estate simulator game", "property investment simulator", "real estate deal analyzer" — used naturally in homepage and explainer page copy
- **Structured Data**: JSON-LD schema markup via server/seo.ts for WebApplication, FAQPage, Article, BreadcrumbList, CollectionPage types

### SEO Tools (Backlink Assets)
- **Tools Hub**: `/tools` — landing page listing all free interactive tools
- **Flip or Rent? Strategy Analyzer**: `/tools/flip-or-rent` — side-by-side comparison calculator (flip profit vs rental cash flow, 1/3/5-year horizon bars, winner badges)
- **Deal Scorecard**: `/tools/deal-scorecard` — grades properties A-F against 7 rules of thumb (1% Rule, 2% Rule, 50% Rule, 70% Rule, Cap Rate, GRM, Cash-on-Cash)
- Both pages have FAQPage + WebApplication JSON-LD structured data, breadcrumb schemas, copy-to-clipboard results, cross-links to Learn articles, and CTA to simulator
- Added to sitemap at priority 0.9, navigation bar, and footer
- Files: `client/src/pages/Tools.tsx`, `client/src/pages/FlipOrRentTool.tsx`, `client/src/pages/DealScorecardTool.tsx`

### Monetization
- **Ads**: Removed. No Google AdSense (web) or Google AdMob (mobile).
- **Premium Boosts (Stripe)**: In-game purchases via Stripe Checkout for cash/time boosts. Currently hidden from all game UI (home screen and in-game menu). Server routes remain but are gated by ENABLE_PREMIUM_PURCHASES env var.
  - `server/stripeClient.ts` - Stripe client using Replit connector credentials
  - `server/webhookHandlers.ts` - Processes Stripe webhooks via stripe-replit-sync
  - Webhook route registered BEFORE express.json() in `server/index.ts` for raw Buffer access
  - Gated by ENABLE_PREMIUM_PURCHASES env var (set to 'true' to enable)

### Tutorial System
- A 17-step, 7-phase interactive tutorial system with UI spotlighting and state persistence.

### Pro Forma Editor UX
- Card-styled sections for financing, renovation, and income/expenses. Features ROI color highlighting, dual strategy display (Cash-on-Cash, Flip ROI), and mobile-optimized toggles.
- Pro forma calculations are client-side. All sliders start at zero — player must manually set every assumption. Haptic feedback on all sliders.
- Issue matching: ProFormaPanel receives `gameRunId` prop to use `getRevealedRandomizedIssues()` (same as PropertyDetail), ensuring consistent issues between pages.
- Repair selection defaults to all unchecked (fixedIssueIds starts empty). Player explicitly opts in to each repair. Unselected repairs don't affect financing.

### Game Logic
- **Time Unit**: Months (UI consistently uses "months" everywhere; internal code still uses `weeksRemaining` field names for backward compatibility)
- **Starting Cash**: $100,000 (BAL-005: increased from $80K for better early game flexibility)
- Property issue system for due diligence reveals.
- Surprise repair costs if due diligence is skipped.
- Reality check system for rental income and vacancy assumptions.
- **Pro Forma vs Actual Notifications**: First-time comparison toast when actual rental cash flow differs from pro forma projections by >5%. Server returns `proFormaComparison` in `RentalIncomeResult` with specific explanations (unfixed issues, market conditions, assumption gaps).
- Dual-path due diligence gating with consequences.
- Strategy options: Rent vs. Flip, each with distinct financial models.
- **LTV-Based Financing**: Single LTV slider drives interest rates and loan fees, with exponential curves in "danger zones" (90-100% LTV) and player-state adjustments.
- Contractor options affect timeline and costs.
- First purchase protection prevents immediate bankruptcy.
- **Market Conditions System**: Dynamic, 5-level market (terrible to excellent) changes every 4 weeks, affecting flip and rental sale prices.
- **Rental Property Selling**: Allows players to sell active rentals, converting equity to cash, with market-adjusted pricing.
- **Rehab Budget & No-Rehab Flips**: Flexible rehab budget slider supporting no-rehab flips, with consequences for sale price if rehab is skipped.
- **Rehab Financing for Flips**: Toggle to include rehab costs in the loan.
- **Rental Refinancing**: Cash-out refinance available after an 8-week seasoning period, subject to appraisal and LTV limits.
- **Debt Tracking & Amortization**: Visual loan paydown system with accelerated amortization for bookkeeping.
- **Tenant Text Messages**: Interactive tenant communication system with personality types, generated names, and optional AI-generated portraits.
- **Dynamic Investor Profile**: Performance Stats profile evolves in real-time based on player behavior. 8 profile types (including early-game `methodical_researcher` and `quick_starter`). Traits are generated dynamically from actual game state (deals, investigations, LTV, cash, time) rather than static text. Profile classification works from month 0 — considers pipeline deals, investigations, and research activity even before deals close. Periodic toast reminders at months 10/20/30/40 nudge players to check stats.
- **Overtime Mode**: Players can keep playing past 52 weeks but cannot earn new profitable deal awards. StatusBar shows "Overtime"/"OT" indicator. Server allows week advancement past 0 but blocks won/lost status games.
- **Mobile Advance Button**: Floating "Next Month" button at bottom-right on mobile (hidden from top StatusBar). Desktop retains the advance button in TimeProgressionPanel.
- **Balance Tuning (BAL-005)**: Reduced maintenance frequency multipliers for budget (2.5→1.8) and mid-range (1.5→1.2) properties. Reduced condition-based curveball multipliers (fixer-upper 1.8→1.4, needs-work 1.5→1.3, fair 1.2→1.15). Undiscovered issue curveball chance reduced from 15% to 10% per check.
- **Balance Tuning (BAL-006)**: Goal reduced from 3→2 profitable deals. Selling costs 6%→5%. Closing costs 3%→2.5%. Market crash probability reduced (good→poor 5%→2%, excellent→poor 3%→1%). Friendlier starting market (terrible 8%→5%, excellent 23%→25%). Market floor raised (terrible min 0.88→0.90, poor min 0.92→0.93). Maintenance multipliers reduced (budget 1.8→1.5, mid-range 1.2→1.0, high-end 0.8→0.7, luxury 0.5→0.4). Curveball condition multipliers reduced (fixer-upper 1.4→1.25, needs-work 1.3→1.15).
- **Balance Tuning (BAL-008)**: Title issue costs reduced ~40% across all types (max was $40k, now $25k). Title issue probability reduced 20%→15%. Diligence bonus increased (full diligence 6%→8% sale price bonus). No-comps flip reality range narrowed (floor 0.70→0.75). Rental no-market-study penalties softened (worst-case 60-85%→68-88% rent, 50%→40% chance of underperformance, 25%→30% chance of lucky outcome). Rental blindness penalty reduced (80%→70% chance, 3-15%→2-12% range).
- **Balance Tuning (BAL-007)**: Selective repair penalties and rewards. Discovered-but-skipped issues penalize flip sale price at 1.5% each (undiscovered still 2%). Fixed issues boost flip sale price +1% each (max +5%). Rental rent penalized 1% per known-unfixed issue, boosted 1.5% per fixed issue (max 8%). Rental rehab unfixed depression increased from 0.25% to 1% per item. Luxury finish boosts increased: ARV 8%→10%, rent 10%→12%.
- **Balance Tuning (BAL-009)**: Repair timeline impacts capped — max 3 weeks per issue (was 6). With cheap contractor (1.5x), max is 5 months; fast contractor (0.7x), max is 3 months. Trophy popup reduced from 5s to 3s, paused during PropertySoldAnimation.
- **Pre-Purchase Repair Selection**: Players can cherry-pick which discovered issues to fix via ItemizedRepairsPanel in ProFormaPanel. Selected repairs populate fixedIssueIds in proFormaInputs. Unselected items tracked as known-but-skipped issues with proportional penalties on sale/rent. All repairs default to unselected.
- **Deal Share Card**: Shareable 1080x1080 PNG generated via HTML Canvas when a property is sold (flip or rental exit). Shows deal financials (purchase, renovation, sale price, profit/loss, ROI) with a viral headline like "I just made/lost $X flipping a house in a simulator." Players can download the image or share via Web Share API. Designed for Reddit, Twitter, and real estate forum distribution. Files: `DealShareCard.tsx`, triggered from `PropertySoldAnimation.tsx`.

## External Dependencies

### Database
- **PostgreSQL**
- **Drizzle ORM**

### Frontend Libraries
- **@tanstack/react-query**
- **Radix UI**
- **Lucide React**
- **date-fns**
- **class-variance-authority**
- **wouter**

### Build & Development
- **Vite**
- **esbuild**
- **Replit plugins**

### Validation
- **Zod**
- **drizzle-zod**
- **@hookform/resolvers**