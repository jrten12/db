# Dealbreak: Competition & Market Amp-Up Plan

**Decision lock:** **D + Both**  
**Sequence:** Async seasons (A) → Ghost rivals (C) → Live race lobbies (B)  
**Parallel amp-up:** Multi-city markets  
**Non-goals (hard):** No player-to-player buy/sell, no contested inventory, no shared wallets

---

## Why this shape

Solo Dealbreak already teaches underwriting, diligence, rent/flip, tenants, and market swings. What’s thin is **competition**, **distinct markets**, and **unfinished engagement** (trophy stubs, unused difficulty, Hall of Fame that ranks by name but doesn’t feel seasonal).

Parallel competition on the same board — same listings and market weather, separate wallets, ranked by skill — fits the educational loop. Contested inventory and P2P trading would fight it (griefing, race-to-click, less analysis).

| Mode | Fit for Dealbreak | Cost / risk |
|------|-------------------|-------------|
| **A Async seasons** | Highest. Play on your own time; fair seed; ranks profit / deals / survival | Lowest infra; reuses game runs + HoF |
| **C Ghost rivals** | Great “feel alive” without scheduling | Needs run recording + replay UI |
| **B Live race lobbies** | Peak energy for friends/events | Shared week clock, presence, sync — biggest build |
| Multi-city | Fresh boards + teaching regional differences | Content + balance work, not realtime |

---

## Design principles

1. **Same board, separate wallets** — Everyone sees the same season market seed, listing pool, and weather timeline. Buying a property does **not** remove it for others.
2. **Skill ranking, not inventory racing** — Leaderboards use profit, deal quality, survival, trophy milestones — never “who clicked first.”
3. **Educational loop stays sacred** — Competition pressure must not skip diligence or postmortems. Optional “race” UI is additive, not a shortcut mode.
4. **Deterministic market weather** — Season seed drives starting condition + weekly transitions so late joiners get the same economic timeline as early joiners (their *personal* RNG for tenants/surprises can stay private).
5. **Build foundations once** — Season seed + shared listing snapshot + run snapshots unlock A, then C, then B without rewriting the core sim.

---

## Current codebase hooks (what we reuse)

| Asset | Status | Use |
|-------|--------|-----|
| `gameRuns` + deals / ledger / market condition | Strong | Per-player season entries |
| `hallOfFamePlayers` + `/api/hall-of-fame` | Exists, all-time only | Extend with season scopes |
| `trophyTypes` + `checkAndAwardTrophies` | Partially wired | Finish stubs; add season trophies |
| `difficulty` on `gameRuns` | Stored, always `"apprentice"` | Wire tiers for season brackets |
| Property catalog (Philly-flavored neighborhoods) | Single implicit market | Parameterize into city markets |
| Market condition transitions | Per-run random | Seeded season clock for fair races |

---

# Part 1 — Roadmap (phased vision)

## Phase 0 — Engagement foundation (ship with / just before MVP)

Unblocks seasons feeling real and cleans debt players already see stubs for.

- **Difficulty actually matters** — apprentice / operator / titan (names TBD): starting cash, weeks, goal deals, diligence cost/time, surprise severity, listing opacity.
- **Trophy pass** — Align `trophyTypes` with award logic (e.g. `winner` referenced in code vs catalog), wire diligence / big_spender / perfectionist / urban_expert / survivor paths, show progress on TrophyShelf.
- **Hall of Fame scopes** — All-time **and** current season; filter by difficulty bracket.
- **Stable player identity** — Keep display name; add optional durable `playerKey` (device/local + later auth) so season ranks don’t shatter on rename.

## Phase 1 — Async seasons (MVP — build next)

See **Part 2** for concrete build plan.

Outcome: time-boxed season, shared seeded market, personal game runs, season leaderboard, season-end trophies. Still fully solo session timing.

## Phase 2 — Multi-city markets (major amp-up, can overlap late Phase 1)

Distinct boards that teach regional reality, not just reskins.

| City archetype | Teaching angle | Economy levers |
|----------------|----------------|----------------|
| **Legacy Mid-Atlantic** (current Philly-ish) | Rowhomes, mixed urban/suburban, water/heat variety | Baseline |
| **Sun Belt growth** | Newer stock, HOA/insurance pressure, stronger appreciation bias | Higher ARV variance, insurance line items |
| **Rust Belt value** | Cheap basis, tenant/vacancy risk, slower flips | Lower prices, higher vacancy, weaker market multipliers |
| **Coastal constrained** (later) | Expensive basis, thin yields, condo assessments | High entry cash, diligence-heavy |

Each city packs: neighborhood set, property mix weights, rent/ARV/rehab ranges, starting market bias, issue profile weights, photo/art direction.

Season can be **one featured city** or **player-picked city with separate brackets** (prefer featured city for MVP clarity).

## Phase 3 — Ghost rivals

After seasons produce finished runs:

- Record compact **ghost tapes**: week-by-week cash, deals completed, property IDs bought, market condition at each week.
- In a new solo/season run on the **same seed**, overlay 1–3 ghosts on market / status UI (“Alex is at $142K in week 18”).
- Ghosts never block listings; optional “ghost postmortem” compares decisions on the same address.
- Source ghosts from: your best prior run, season top-N, or canned AI ghosts when population is thin.

## Phase 4 — Live race lobbies (2–6 players)

Friend/event mode on top of the same parallel rules:

- Lobby create/join → lock season seed + city + difficulty + week length.
- **Shared week advances** when all ready (or host timer) — not realtime property contention.
- Live rival strip: cash, profitable deals, weeks — poll or lightweight websocket.
- End lobby → lobby leaderboard; optional push into season if lobby used official season seed.

Defer: chat, spectating, mid-lobby join, cross-platform presence polish.

## Phase 5+ — Optional later

- Auth / accounts for cross-device identity
- Public season archives + share cards
- City DLC / weekly micro-seasons
- Spectator “ghost only” mode for content/creators

---

# Part 2 — Concrete next MVP (Async Season v1)

## Goal

Ship **one playable season** where players compete in parallel on the same seeded board, ranked fairly, without any live sync.

## Player-facing pitch

> **Season 1: Mid-Atlantic Open** — Same listings. Same market weather. Your wallet. Climb the season board by profit and survival before the clock ends.

## Scope in

1. **Season entity** — id, name, cityId, seed, startAt, endAt, difficultyBrackets, status (`upcoming` | `active` | `closed`).
2. **Seeded market clock** — From `seed`, derive starting `marketCondition` and the condition at each game week (replace pure per-run randomness when `seasonId` is set).
3. **Season listing snapshot** — On season create, freeze N active properties (or property IDs + any season-specific numeric overrides) so the board doesn’t drift mid-season as catalog edits land.
4. **Season entry** — Starting a game with `seasonId` + display name creates a `gameRuns` row linked to season; difficulty selects bracket.
5. **Season scoring** (v1, simple & teachable):
   - **Primary:** net worth proxy = cash + estimated equity from active rentals − debt (define formula once; document in UI).
   - **Secondary:** profitable deals completed.
   - **Tertiary:** weeks remaining at win / survival flag.
   - Submit score on game end **and** optional mid-run “check-in” snapshot for live-feeling boards without live play.
6. **Season leaderboard UI** — Top ranks by bracket; show your best entry; link from HoF / home.
7. **Season trophies** — e.g. `season_finisher`, `season_top10`, `season_podium` (award at close via job or lazy finalize).
8. **Admin/seed path** — Script or server bootstrap to create Season 1 from current property set (single city = current catalog tagged `legacy_mid_atlantic`).

## Scope out (explicit)

- Live lobbies, websockets, ghost replay
- Removing listings when someone else buys
- Trading / messaging between players
- Full auth (names + optional local key enough)
- Multiple concurrent featured cities (one city for Season 1)
- Perfect net-worth appraisal science — good-enough equity estimate OK for v1

## Data model sketch

```text
seasons
  id, slug, name, cityId, seed, startsAt, endsAt, status, config jsonb

season_properties
  seasonId, propertyId, sortOrder
  -- optional overrides: price, rentMin/Max, etc.

game_runs (+ columns)
  seasonId nullable
  seasonBracket (difficulty)
  scoreSnapshot jsonb nullable  -- last computed score components
  scoreFinal integer nullable
  finalizedAt timestamp nullable

season_score_events (optional)
  gameRunId, seasonId, score, payload, createdAt
  -- supports mid-run check-ins / audit
```

## API sketch

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/seasons/current` | Active season + player rank if named |
| GET | `/api/seasons/:id/leaderboard?bracket=` | Ranked entries |
| POST | `/api/game-runs` | Accept `seasonId`, `difficulty`; attach seed behavior |
| POST | `/api/game-runs/:id/finalize-season` | Compute + lock score on end |
| GET | `/api/cities` | Stub list for UI; one real city in MVP |

## Determinism rules

- **Shared (seeded):** listing set, list order, starting market, market condition by week number.
- **Private (per run):** tenant personalities/messages, some surprise rolls, flip sale micro-variance *unless* we later decide those must match for ghost fairness (ghost phase can re-seed from `seed + gameRunId`).

Document this split in-game: “Same economy. Your execution luck still applies.”

## Difficulty brackets (wire for real)

| Bracket | Starting cash | Weeks | Goal deals | Pressure |
|---------|---------------|-------|------------|----------|
| Apprentice | Higher | More | 3 | Softer surprises |
| Operator | Current baseline | Baseline | 3 | Current feel |
| Titan | Lower | Fewer | 3+ or higher profit bar | Harsher opacity / surprises |

Season leaderboard **separates** brackets (no mixing Titan with Apprentice).

## UI surfaces (minimal)

1. **Home / name entry** — “Play Season 1” vs “Free play”
2. **Season hub** — dates, city blurb, your rank, CTA continue/start
3. **In-run badge** — subtle season name + bracket (not a cluttered dashboard)
4. **Leaderboard modal** — extend HoF with Season / All-time tabs
5. **Game over** — season score breakdown + “View board”

## Implementation order (engineering)

1. Schema + migration for seasons / links on game runs  
2. Seeded market transition helper (`getMarketAtWeek(seed, week)`)  
3. Bootstrap Season 1 from current properties  
4. Create/resume season game runs  
5. Score finalize + leaderboard endpoints  
6. Client: season hub + HoF tabs + start flow  
7. Wire difficulty modifiers (even if only Operator + Apprentice ship)  
8. Trophy awards for season participation / placement  
9. QA: two clients, same season seed → same weekly weather & listing IDs; different wallets/outcomes  

## Acceptance criteria

- [ ] Two players can finish Season 1 on their own schedules  
- [ ] Both see identical property IDs and week-N market condition for the season seed  
- [ ] Neither purchase affects the other’s availability  
- [ ] Leaderboard ranks by documented score; ties break on profitable deals then earlier finalize time  
- [ ] Free-play (no season) still works unchanged  
- [ ] Difficulty choice changes starting resources and lands you in the matching bracket  
- [ ] Closing the season freezes new entries; board remains readable as archive  

## Test plan (MVP)

- Unit: seed → market sequence stable across 52 weeks  
- Unit: score formula fixtures (cash-only, cash+rental equity, bankrupt)  
- Integration: create season → start two runs → advance weeks → assert shared market field  
- Manual: leaderboard updates after finalize; free-play regression  

## Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Equity estimate feels unfair | Show formula; weight cash heavily in v1; refine later |
| Catalog edits mid-season | `season_properties` snapshot |
| Name smurfing on board | Optional local player key; moderate display names later |
| Difficulty still ignored | Ship bracket modifiers in same MVP PR train |
| Scope creep into live lobbies | Hard scope-out list; ghosts/live are Phase 3/4 |

---

# Part 3 — Engagement stubs to close in Phase 0/1

Concrete gaps observed in code today:

1. **`difficulty`** — Always sent as `'apprentice'`; no modifiers in mechanics.  
2. **Trophies** — Catalog vs `checkAndAwardTrophies` drift (`winner` and several catalog IDs need a single source of truth).  
3. **HoF** — All-time profit list works; no season dimension, weak “why climb again” loop.  
4. **Single market identity** — Neighborhoods are rich but not framed as a city you chose or a season board.

Phase 0/1 should close these so competition has somewhere to land.

---

# Part 4 — Success metrics

- Season start rate among returning players  
- % of season entrants who finalize a score  
- Median diligence purchases in season vs free-play (should not collapse)  
- Leaderboard return visits per week during season  
- Qualitative: players describe rivalry as “better analysis,” not “faster click”

---

# Summary

| Choice | Lock |
|--------|------|
| Multiplayer shape | **D** — full phased vision |
| Build order | **A → C → B**, plus **multi-city** as parallel content amp-up |
| Plan depth | **Both** — roadmap above + Async Season v1 as next MVP |
| Never | P2P markets, contested listings, shared wallets |

**Next build:** Async Season v1 (schema, seeded weather, snapshot listings, scoring, leaderboard UI, difficulty brackets), with trophy/HoF cleanup in the same train.
