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
├── client/src/          # React frontend
│   ├── components/      # UI components (game/, ui/)
│   ├── pages/           # Route pages (Landing, Game)
│   ├── lib/             # Utilities, API client, game logic
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations
│   └── static.ts        # Static file serving
├── shared/              # Shared code
│   └── schema.ts        # Drizzle schema + Zod validation
└── attached_assets/     # Game design documents and images
```

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
- **LTV-Based Financing**: Single LTV slider (50-90%) drives all financing terms
  - Interest rate: 5% at 50% LTV, 12% at 90% LTV (curved risk premium formula)
  - Loan fees: 1% at 50% LTV, 4% at 90% LTV (linear)
  - Down payment: Automatically calculated as 100% - LTV
  - Helper functions: `getInterestRateFromLTV()`, `getLoanFeesFromLTV()`, `getDownPaymentFromLTV()`
  - Educational messaging shows leverage-risk tradeoffs
- Contractor options: Cheap vs Fast affecting timeline and costs
- **Rental Property Selling**: Players can sell active rental properties to convert equity back to cash
  - Sale price: Random -10% to +15% of original purchase price (market volatility simulation)
  - Time cost: 2 weeks to complete sale
  - UI: TimeProgressionPanel shows active rentals with sell button and price estimate
  - Schema fields: `purchasePrice`, `salePrice`, `saleMultiplier` on deals table
  - Status changes: `active_rental` → `sold_rental` on sale completion

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