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
- Property issue system for due diligence reveals in `lib/propertyIssues.ts` and `shared/propertyIssues.ts`
- **Surprise Repair Costs**: If player skips contractor walkthrough/inspection, hidden property issues are discovered during flip completion. These surprise costs are deducted from both profit and cash (via ledger), teaching the consequences of skipping due diligence.
- Strategy options: Rent vs Flip with different financial models
- Financing options: Bank vs Hard Money with different terms
- Contractor options: Cheap vs Fast affecting timeline and costs

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