# Dealbreak: Real Estate Simulator

## Overview

Dealbreak is a turn-based real estate investment simulator designed as an educational game. Its primary purpose is to teach real estate underwriting skills by engaging players in property evaluation, financial modeling, and investment decision-making under realistic uncertainty. The game emphasizes understanding the cause-and-effect relationships between assumptions, metrics, and outcomes in deal analysis. Players manage resources, conduct due diligence, analyze different investment strategies (rent or flip), commit to deals, and experience execution events with educational postmortems. The project's vision is to be an engaging and informative platform for aspiring real estate investors.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX and Design
- **Frontend Framework**: React 18 with TypeScript.
- **Styling**: Tailwind CSS v4 with custom CSS variables, utilizing `shadcn/ui` component library built on Radix UI primitives.
- **Typography**: Inter (sans-serif), Fraunces (serif), Space Mono (monospace for financial figures).
- **Mobile App UI**: React Native with Expo SDK 52, styled with NativeWind v4, and utilizing a WebView wrapper for the main game experience with native-feel CSS injections to disable standard web interactions.
- **Pro Forma Editor UX**: Card-styled sections with ROI color highlighting, dual strategy display (Cash-on-Cash, Flip ROI), and mobile-optimized toggles. Sliders provide haptic feedback and enlarged touch targets for mobile.
- **Content & SEO**: Consistent branding ("DealBreak Simulator"), keyword-optimized titles and content, structured data (JSON-LD schemas for VideoGame, WebApplication, FAQPage, Article, BreadcrumbList), and canonical tags.
- **Interactive Tools**: Includes "Flip or Rent? Strategy Analyzer" and "Deal Scorecard" with interactive comparison and grading features.
- **Landing Page Showcase**: `GameShowcase` component (`client/src/components/GameShowcase.tsx`) replaces the old "Every Deal Has a Story" section with styled gameplay preview cards showing property browsing, pro forma analysis, deal results, and portfolio views using the game's dark/gold/emerald theme.

### Technical Implementation
- **Backend**: Node.js with Express, written in TypeScript with ESM modules, providing a RESTful JSON API.
- **State Management**: TanStack React Query for server state, React `useState` for local state.
- **Routing**: Wouter for web, Expo Router for mobile.
- **Data Storage**: PostgreSQL database managed via Drizzle ORM.
- **Game Logic**: Implemented with a focus on realism, including time-based progression (months), starting cash ($100,000), property issue system with due diligence consequences, dynamic market conditions, LTV-based financing, contractor options, and strategy-specific financial models (Rent vs. Flip).
- **Advanced Game Mechanics**: Incorporates surprise repair costs, reality checks for rental income, dynamic investor profiles, tenant text messages, "Overtime Mode," and market-condition-dependent renovation yield system (renovation costs and rent impacts scale with market conditions — hot markets increase both costs and potential rent, soft markets offer cheaper labor but limited rent upside).
- **Renovation Yield Display**: ContractorWalkthroughModal shows per-repair annual yield %, payback period, and market condition banners. ItemizedRepairsPanel shows approximate rent impact for rental strategy repairs. DealCongratulations shows renovation opportunity hints with market-aware messaging.
- **Monetization**: Hidden in-game purchases via Stripe Checkout for boosts, gated by an environment variable.
- **Tutorial System**: A 17-step, 7-phase interactive tutorial with UI spotlighting and state persistence.
- **Post-Deal Analysis**: Features dynamic notifications comparing pro forma to actual outcomes, a shareable deal card for social media, and a "Your Prediction vs Reality" postmortem on the Property Sold screen with accuracy grades (A+ through F), side-by-side metric comparisons, and explanatory reasons for any gaps between projections and actual outcomes.
- **Balance Tuning**: Continuous adjustments to game parameters (e.g., maintenance frequency, curveball probabilities, selling costs, diligence bonuses) to refine gameplay and educational value.
- **Flip Rebalancing**: Flip profits tied to rehab effort + diligence depth. No-rehab flips cap below purchase price (wholesale deals). Low rehab (<25%) caps gains at 8%. Spread capture uses completionFactor^0.7 curve. Rare 3% windfall for diligent rehabbers. Without comps, wider uncertainty range.
- **Progressive Expense Escalation**: Unfixed rental issues get worse over time (months 1-3 normal, 4-6 building 1.3x, 7-9 serious 1.6x, 10-12 critical 2.0x, 13+ severe 2.5x). Both probability and cost multiplied. Multiple unfixed issues compound via severity factor.
- **Tenant Satisfaction System**: Tenants have a `satisfaction` score (0–100, initialized 70–85). Unfixed issues lower satisfaction each month (−4 per issue, capped at −15); no issues recover +3/month. `weeksUnhappy` tracks consecutive months below 40. Mood indicator (Happy ≥65 / Concerned ≥40 / Unhappy <40) shown on rental cards in TimeProgressionPanel with tooltip.
- **Tenant Leaving Mechanic**: When satisfaction < 40, escalating departure probability (5% base + 2%/week unhappy, cap 25%). Turnover costs $500–$1500 on departure. Life situation departures also possible (1.2%/month with $500–$1000 turnover). Departure = 1 month vacancy (rentMultiplier=0). Tenant deleted on departure, auto-created next month.
- **Diligence Rental Bonus**: 2+ diligence types give 1-3% rent premium for rentals (2→1%, 3→2%, 4→3%; better lease negotiation, tenant screening).
- **Market-Driven Rent Adjustments**: When market conditions change during gameplay, active rental `monthlyGrossRent` adjusts automatically. Scale: terrible (−8% to −4%), poor (−4% to −1%), neutral (0%), good (+1% to +4%), excellent (+4% to +8%). Capped at 70%–135% of `activationMonthlyRent` stored in proFormaOutputs. Cash flow and weeklyIncome recalculated. Toast notification on market shift.
- **Cosmetic Upgrade System**: One-time upgrade per property ($2k–$8k based on property value). For rentals: 45–85% success rate (market-dependent), +1–6% rent boost. For flips: +0.5–4% sale price boost applied in `calculateFlipSalePrice`. Route: `POST /api/deals/:id/cosmetic-upgrade`. UI: Paintbrush button in TimeProgressionPanel for active rentals, flips in rehab, and ready-to-list flips. Stored as `cosmeticUpgradeApplied`, `cosmeticUpgradeCost`, `cosmeticUpgradeRentBoost`/`cosmeticUpgradeSaleBoost` in proFormaOutputs.
- **Performance Optimizations**: CSS code-splitting (game animations in `client/src/styles/game-animations.css` lazy-loaded with Game route), gzip compression via `compression` middleware, route-aware LCP image preload (landing page hero images via `server/seo.ts` with hashed asset resolver), deferred Google Analytics loading (post-load + 2s delay), vendor chunk splitting (`vendor-query` for TanStack, `vendor-ui` for Radix/CVA), lazy-loaded below-fold landing components (GameShowcase, Footer), tiered static file caching (1yr immutable for hashed assets, 7d for images, 7d for media/fonts/icons, 1h for other static, no-cache for HTML), `index: false` on express.static to ensure all HTML routes flow through SEO injection.

## External Dependencies

- **Database**: PostgreSQL, Drizzle ORM
- **Frontend Libraries**: `@tanstack/react-query`, Radix UI, Lucide React, date-fns, class-variance-authority, wouter
- **Build & Development Tools**: Vite, esbuild, Replit plugins
- **Validation**: Zod, drizzle-zod, @hookform/resolvers
- **Payment Processing**: Stripe Checkout (for in-game purchases)
- **Mobile Development**: Expo SDK 52, React Native, NativeWind v4