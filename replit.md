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
- **UI Design**: Matches web game's visual language — gradient buttons, bordered stat cards, color-coded sections, `LinearGradient` from expo-linear-gradient for button styling
- **App Config**: `mobile/app.config.ts` — iOS 17+ privacy manifests, bundle ID `com.dealbreak.simulator`
- **EAS Submit**: `eas.json` — ascAppId `6760164395`, Apple Team `9G2NL8NSRT`, uses `eas submit --platform ios --latest` for TestFlight
- **App Store Checklist**: `mobile/APP_STORE_CHECKLIST.md`

### Content & SEO (AdSense Compliance)
- **Learning Center**: `/learn` hub page with 13 educational articles about real estate investing concepts
- **Article Pages**: `/learn/:slug` individual article pages with engaging content, hero images, CSS infographics, callout/warning/tip sections
- **Article Data**: `client/src/lib/learnArticles.ts` — structured article content with sections (text/callout/warning/tip/infographic types), InfographicData (comparison/scale/breakdown/steps/spectrum), difficulty levels, seoKeywords, heroImage references
- **Article Images**: AI-generated hero images in `attached_assets/generated_images/learn_*.png`, imported via `@assets` alias in LearnArticle.tsx and Learn.tsx
- **SEO Server Module**: `server/seo.ts` — duplicate ARTICLE_DATA for server-side meta injection, per-article keywords, difficulty levels, JSON-LD Article/BreadcrumbList schemas
- **Ad Placement**: Ads only on content-rich pages (Landing page, Learn hub, article pages). Removed from game UI screens (PropertySelector, ResultsPanel) per AdSense policy.
- **Structured Data**: JSON-LD schema markup via server/seo.ts for WebApplication, FAQPage, Article, BreadcrumbList, CollectionPage types

### Monetization
- **Web**: Google AdSense on content pages only (Landing, Learn hub, articles). Not on game screens.
- **Mobile**: Google AdMob (Banner, Interstitial, Rewarded ads).
- **Premium Boosts (Stripe)**: In-game purchases via Stripe Checkout for cash/time boosts. Currently hidden from all game UI (home screen and in-game menu). Server routes remain but are gated by ENABLE_PREMIUM_PURCHASES env var.
  - `server/stripeClient.ts` - Stripe client using Replit connector credentials
  - `server/webhookHandlers.ts` - Processes Stripe webhooks via stripe-replit-sync
  - Webhook route registered BEFORE express.json() in `server/index.ts` for raw Buffer access
  - Gated by ENABLE_PREMIUM_PURCHASES env var (set to 'true' to enable)

### Tutorial System
- A 17-step, 7-phase interactive tutorial system with UI spotlighting and state persistence.

### Pro Forma Editor UX
- Card-styled sections for financing, renovation, and income/expenses. Features ROI color highlighting, dual strategy display (Cash-on-Cash, Flip ROI), and mobile-optimized toggles.
- Pro forma calculations are client-side. Inputs start empty to encourage manual entry, with validation and visual feedback.

### Game Logic
- Property issue system for due diligence reveals.
- Surprise repair costs if due diligence is skipped.
- Reality check system for rental income and vacancy assumptions.
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
- **Overtime Mode**: Players can keep playing past 52 weeks but cannot earn new profitable deal awards. StatusBar shows "Overtime"/"OT" indicator. Server allows week advancement past 0 but blocks won/lost status games.

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