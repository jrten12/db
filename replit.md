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

### Technical Implementation
- **Backend**: Node.js with Express, written in TypeScript with ESM modules, providing a RESTful JSON API.
- **State Management**: TanStack React Query for server state, React `useState` for local state.
- **Routing**: Wouter for web, Expo Router for mobile.
- **Data Storage**: PostgreSQL database managed via Drizzle ORM.
- **Game Logic**: Implemented with a focus on realism, including time-based progression (months), starting cash ($100,000), property issue system with due diligence consequences, dynamic market conditions, LTV-based financing, contractor options, and strategy-specific financial models (Rent vs. Flip).
- **Advanced Game Mechanics**: Incorporates surprise repair costs, reality checks for rental income, dynamic investor profiles, tenant text messages, and an "Overtime Mode."
- **Monetization**: Hidden in-game purchases via Stripe Checkout for boosts, gated by an environment variable.
- **Tutorial System**: A 17-step, 7-phase interactive tutorial with UI spotlighting and state persistence.
- **Post-Deal Analysis**: Features dynamic notifications comparing pro forma to actual outcomes, a shareable deal card for social media, and a "Your Prediction vs Reality" postmortem on the Property Sold screen with accuracy grades (A+ through F), side-by-side metric comparisons, and explanatory reasons for any gaps between projections and actual outcomes.
- **Balance Tuning**: Continuous adjustments to game parameters (e.g., maintenance frequency, curveball probabilities, selling costs, diligence bonuses) to refine gameplay and educational value.
- **Performance Optimizations**: CSS code-splitting (game animations in `client/src/styles/game-animations.css` lazy-loaded with Game route), gzip compression via `compression` middleware, route-aware LCP image preload (landing page only via `server/seo.ts`), deferred Google Analytics loading.

## External Dependencies

- **Database**: PostgreSQL, Drizzle ORM
- **Frontend Libraries**: `@tanstack/react-query`, Radix UI, Lucide React, date-fns, class-variance-authority, wouter
- **Build & Development Tools**: Vite, esbuild, Replit plugins
- **Validation**: Zod, drizzle-zod, @hookform/resolvers
- **Payment Processing**: Stripe Checkout (for in-game purchases)
- **Mobile Development**: Expo SDK 52, React Native, NativeWind v4