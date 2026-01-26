# Dealbreak: Real Estate Simulator

## Overview

Dealbreak is a turn-based real estate investment simulator designed as an educational game. Players evaluate properties, build pro forma financial models, and make investment decisions under uncertainty. The core gameplay loop teaches real estate underwriting skills through realistic deal analysis rather than simple number-picking.

The game emphasizes understanding causality between assumptions, metrics, and outcomes. Players start with limited cash and time, evaluate properties, optionally purchase due diligence, complete pro forma analysis (for rent or flip strategies), commit to deals, and experience execution events before receiving outcomes with educational postmortems.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state, React useState for local state
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **UI Components**: shadcn/ui component library (New York style) with Radix UI primitives
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Style**: RESTful JSON API under `/api/*` routes
- **Development**: tsx for TypeScript execution, Vite dev server for HMR

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema sync
- **Connection**: pg Pool with `DATABASE_URL` environment variable

### Key Data Models
- **Users**: Basic auth with username/password
- **GameRuns**: Active game sessions with player state (cash, weeks, goals)
- **Properties**: Real estate listings with financial ranges (rent, ARV, rehab costs), location types (urban/suburban), and property types (house, apartment, condo, townhouse, duplex)
- **Deals**: Player investment decisions linked to game runs
- **PropertyInvestigations**: Due diligence purchases tracking what's been revealed
- **HallOfFamePlayers**: Persistent player records that survive game resets
- **PlayerTrophies**: Trophy awards linked to players for achievements

### Project Structure
```
├── client/src/          # React web frontend
│   ├── components/      # UI components (game/, ui/)
│   ├── pages/           # Route pages (Landing, Game)
│   ├── lib/             # Utilities, API client, game logic
│   └── hooks/           # Custom React hooks
├── mobile/              # React Native/Expo iOS app
│   ├── app/             # Expo Router screens
│   │   ├── _layout.tsx  # Root layout with providers
│   │   ├── index.tsx    # Landing screen
│   │   ├── game.tsx     # Property list screen
│   │   ├── property/[id].tsx  # Property detail
│   │   └── proforma/[id].tsx  # Pro forma analysis
│   ├── src/
│   │   ├── components/  # Native UI components
│   │   └── lib/         # Shared game logic (ported)
│   ├── assets/          # App icon, splash screen
│   ├── app.config.ts    # Expo configuration
│   ├── eas.json         # EAS Build configuration
│   └── APP_STORE_CHECKLIST.md  # Submission guide
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   └── static.ts        # Static file serving
├── shared/              # Shared code
│   └── schema.ts        # Drizzle schema + Zod validation
└── attached_assets/     # Game design documents and images
```

### Mobile App (iOS)
- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind for React Native)
- **Animations**: React Native Reanimated
- **State**: TanStack React Query (same as web)
- **Bundle ID**: com.dealbreak.simulator
- **Build**: EAS Build for TestFlight/App Store
- **Monetization**: Google AdMob (react-native-google-mobile-ads)
  - Banner, Interstitial, and Rewarded ad support
  - Configuration: `mobile/src/lib/admob.ts`
  - Hooks: `mobile/src/hooks/useAdMob.ts`
  - Setup guide: `mobile/ADMOB_SETUP.md`

### Game Logic Architecture
- Pro forma calculations handled client-side in `lib/gameData.ts`
- **Empty Pro Forma Inputs**: Fields start empty (null) requiring players to fill them manually, reinforcing learning
  - Completion progress banner tracks X/N fields filled
  - Green glow styling on filled inputs for visual feedback
  - Placeholder hints guide players on what each field means
  - Validation helpers: `isProFormaInputsComplete()`, `getMissingFields()`
- Property issue system for due diligence reveals in `lib/propertyIssues.ts` and `shared/propertyIssues.ts`
- **Surprise Repair Costs**: If player skips contractor walkthrough/inspection, hidden property issues are discovered during flip completion. These surprise costs are deducted from both profit and cash (via ledger), teaching the consequences of skipping due diligence.
- **Reality Check System**: For rentals, player assumptions are compared to market reality when the property activates:
  - True rent = midpoint of property's rent range (market study reveals this)
  - True vacancy = location-based baseline (urban 7%, suburban 5%)
  - Optimistic assumptions = lower actual cash flow with educational feedback
  - Conservative assumptions = higher actual cash flow (reward for caution)
- **Dual-Path Due Diligence Gating**: Players can return to property detail (recommended) or proceed without full diligence (not recommended), with consequences tracked
- **Utilities Trade-off**: Tenant pays utilities = saves money but +1 week vacancy to find tenants
- Strategy options: Rent vs Flip with different financial models
- **LTV-Based Financing**: Single LTV slider (50-100%) drives all financing terms
  - Interest rate: 5% at 50% LTV, ~7.4% at 90% LTV, 18% at 100% LTV (exponential curve in danger zone)
  - Loan fees: 1% at 50% LTV, 4% at 90% LTV, 6% at 100% LTV (steep climb above 90%)
  - Down payment: Automatically calculated as 100% - LTV (0% down at 100% LTV!)
  - **Danger Zone (90-100% LTV)**: Visual warnings, red styling, rates climb exponentially
  - **Player-State Adjustments**: Interest rate also factors in player's DTI, cash reserves, and asset coverage via `getInterestRateWithPlayerState()`
  - Helper functions: `getInterestRateFromLTV()`, `getInterestRateWithPlayerState()`, `getLoanFeesFromLTV()`, `getDownPaymentFromLTV()`
  - Educational messaging shows leverage-risk tradeoffs - 100% LTV is a "trap" for undisciplined players
- Contractor options: Cheap vs Fast affecting timeline and costs
- **First Purchase Protection**: Players cannot go bankrupt on their very first property purchase - transaction is blocked if insufficient funds. Subsequent purchases allow overdraft, triggering bankruptcy if cash goes negative.
- **Rental Property Selling**: Players can sell active rental properties to convert equity back to cash
  - Sale price: Random -10% to +15% of original purchase price (market volatility simulation)
  - Time cost: 2 weeks to complete sale
  - UI: TimeProgressionPanel shows active rentals with sell button and price estimate
  - Schema fields: `purchasePrice`, `salePrice`, `saleMultiplier` on deals table
  - Status changes: `active_rental` → `sold_rental` on sale completion
- **Rehab Budget**: Slider allows $0 to max, supporting no-rehab flips or conservative assumptions
  - Starts at $0, player can slide up to their chosen budget
  - With diligence: Shows the contractor-estimated range as a hint above slider
  - Without diligence: Wider range (up to 1.5x max) since player is guessing
  - "No Rehab" badge appears when budget is $0
- **Rehab Financing for Flips**: Toggle to include rehab costs in the loan (acquisition + construction loan)
  - `financeRehab` toggle appears in pro forma when rehab budget > $0 (flip strategy only)
  - When enabled: loanBasis = purchasePrice + rehabCosts, reducing upfront cash needed
  - When disabled: rehab costs paid out of pocket as before
  - Educational messaging explains construction loan tradeoffs
- **Rental Refinancing**: Cash-out refinance to free up capital from appreciated rentals
  - 8-week seasoning period required before refinancing
  - New appraisal at 5-15% appreciation over purchase price
  - 75% max LTV on refinance, 2% refinance fees
  - One refinance per property (prevents infinite leverage)
- **Debt Tracking & Amortization**: Visual loan paydown system
  - Schema fields: originalLoanAmount, loanInterestRate, loanTermMonths, totalPrincipalPaid, totalInterestPaid
  - Accelerated amortization (5x factor) for bookkeeping only - cash payments are realistic
  - DebtPanel UI shows total debt, individual loans, paydown progress, equity percentages
  - Accessible via floating button when player has active loans
  - Educational notes explain how mortgage amortization works
- **Tenant Text Messages**: Interactive tenant communication for rental properties
  - Tenants auto-created when rental becomes active with random name and personality
  - 9 personality types: corporate_brain, retired_micromanager, anxious_professional, new_money, law_curious, lonely_caller, control_seeker, passive_aggressive, chaos_magnet
  - Personality types are internal only, never shown to player
  - 30% chance per week to receive a tenant text message
  - iPhone-style text popup: notification banner → tap to see full message
  - Diverse name generator with 50 first names × 40 last names avoiding stereotypes
  - Schema: `tenants` table with dealId, name, personalityType, speechPatterns, portraitUrl
  - Optional GPT-generated portraits via OpenAI AI integrations

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: Session storage (available but sessions not currently implemented)

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Lucide React**: Icon library
- **date-fns**: Date formatting utilities
- **class-variance-authority**: Component variant management
- **wouter**: Client-side routing

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Server bundling for production
- **Replit plugins**: Dev banner, cartographer, runtime error overlay

### Validation
- **Zod**: Runtime type validation
- **drizzle-zod**: Auto-generated Zod schemas from Drizzle tables
- **@hookform/resolvers**: Form validation integration