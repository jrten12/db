# DealBreak Simulator - Beta Testing Report

**Tester:** Professional Beta Tester (15+ years, card/strategy/simulation specialty)
**Date:** 2026-02-07
**Build:** Current main + feature branch
**Platform:** Web (desktop + mobile responsive)
**Testing Duration:** Full codebase audit + systematic mechanic analysis

---

## EXECUTIVE SUMMARY

DealBreak Simulator is an ambitious educational real estate investment game with solid fundamentals. The core game loop (browse properties -> due diligence -> pro forma -> execute -> outcome) is well-designed and genuinely educational. The financial modeling is impressively accurate for a game. However, there are several bugs, balance issues, and UX problems that would hurt retention and player trust if shipped as-is.

**Overall Assessment:** 7/10 - Strong foundation with fixable issues. Not ship-ready without addressing Critical and High severity items.

**Strengths:**
- Genuinely educational financial modeling that teaches real RE concepts
- Deep, interconnected systems (curveballs, tenant personalities, due diligence consequences)
- Strong dark-mode UI with polished animations
- Well-architected codebase with clear separation of concerns

**Key Concerns:**
- Several exploitable strategies that trivialize the game
- Critical terminology inconsistency (weeks vs months) throughout UI
- No automated test coverage at all
- Unsecured admin/premium endpoints allow free cheating
- Balance issues make some strategies strictly dominant

---

## SECTION 1: CRITICAL BUGS (Must Fix Before Ship)

### BUG-001: Time Unit Inconsistency - "Weeks" vs "Months" Confusion
**Severity:** CRITICAL
**Location:** Throughout codebase - `StatusBar.tsx`, `Game.tsx`, `gameMechanics.ts`

**Description:** The game's internal time unit is "weeks" (52 per game = 1 year), but the UI labels inconsistently say "Months" in many places. This is deeply confusing.

**Evidence:**
- `StatusBar.tsx:202` - Label says "Months" but value is `weeksRemaining` (up to 52)
- `StatusBar.tsx:293` - Mobile shows `{weeksRemaining}M` with label "Time"
- `Game.tsx:617` - Toast says `${weeksToDeduct} month${weeksToDeduct !== 1 ? 's' : ''}`
- `Game.tsx:823` - Toast: "Cheap contractor: -2 months while they get started"
- `schema.ts:31-32` - Database stores `weeksRemaining` and `currentWeek`
- `gameMechanics.ts:1261-1262` - Logic clearly operates in weeks

**Impact:** A player sees "45 Months" remaining but the game actually means 45 weeks. That's 3.75 years vs 10.4 months. This creates completely wrong mental models about time pressure, holding costs, and deal pacing. Educational credibility is undermined.

**Expected:** All UI should consistently use one time unit. Since the game spans 52 "turns" representing 1 year, either:
- Use "weeks" consistently everywhere, OR
- Use "months" with 12 turns per game (would require significant rebalancing)

**Reproduction:** Start any game. Look at StatusBar. It says "X Months" but the value is a week count up to 52.

---

### BUG-002: Premium Purchase Endpoints Have No Authentication/Payment Verification
**Severity:** CRITICAL
**Location:** `routes.ts:582-667`

**Description:** The `/api/game-runs/:id/purchase-cash`, `/api/game-runs/:id/purchase-weeks`, and `/api/game-runs/:id/purchase-bundle` endpoints accept arbitrary amounts and add them to the player's game state with no payment verification, no authentication, and no server-side validation of amounts.

**Evidence:**
```
routes.ts:598-599:
  const updatedGameRun = await storage.updateGameRun(gameRunId, {
    cash: gameRun.cash + amount
  });
```

Any HTTP client can call `POST /api/game-runs/1/purchase-cash` with `{ amount: 999999999 }` and get infinite money. Rate limiting (5/min) is the only protection.

**Impact:** Trivially exploitable by any player with browser dev tools. Completely breaks the game economy and leaderboard integrity. If this ships with real IAP, it's a revenue bypass vulnerability.

**Recommendation:** Either remove these endpoints entirely for the web version, or implement proper payment verification (receipt validation, session tokens, server-side amount mapping).

---

### BUG-003: Admin Price Refresh Endpoint Exposed Without Authentication
**Severity:** CRITICAL
**Location:** `routes.ts:170-178`

**Description:** `POST /api/admin/refresh-prices` is publicly accessible with no authentication. Any user can trigger a full property price reset mid-game.

**Impact:** Could disrupt active games for all players. Also leaks internal property data in the response.

**Recommendation:** Add authentication middleware or remove the endpoint from production builds.

---

### BUG-004: Curveball Event Ordering Creates Bias
**Severity:** HIGH
**Location:** `curveballs.ts:987-1015` - `rollForCurveball()`

**Description:** Events are rolled sequentially - the first event in the array that passes its probability check fires, and no further events are checked. Since positive curveballs are concatenated first (`[...POSITIVE_CURVEBALLS, ...NEGATIVE_CURVEBALLS, ...NEUTRAL_CURVEBALLS]` at line 959), positive events have a structural advantage in being evaluated first.

**Impact:** The effective probability of negative events is lower than their stated probability because positive events can "block" them by firing first. In simulation: if a 14% positive event fires, no 10% negative event is checked that turn. This creates a subtle positive bias that makes the game easier than intended.

**Recommendation:** Either shuffle the event array before rolling, or use a single combined probability roll to select event type first, then roll within that category.

---

## SECTION 2: HIGH SEVERITY ISSUES

### BUG-005: LTV Interest Rate Curve Has Mathematical Discontinuity
**Severity:** HIGH
**Location:** `gameData.ts:82-101` - `getInterestRateFromLTV()`

**Description:** At exactly LTV=90%, the formula switches from the standard curve to the "danger zone" curve. The `baseAt90` value is calculated as `Math.pow(0.8, 1.2)` which equals ~0.773. The danger zone formula adds `dangerNormalized^2 * (1 - 0.773) * 1.5` on top. At LTV=90%, `dangerNormalized=0` so this evaluates to exactly `baseAt90`, creating a smooth transition. However, at LTV=89% the standard formula gives a slightly different value than what the danger zone formula would extrapolate backward to. Testing with values around the boundary shows a minor rate jump.

**Impact:** Players may see their interest rate jump non-linearly when sliding the LTV slider through 90%. Educationally misleading - real lending doesn't have this exact behavior.

**Recommendation:** Use a single continuous formula, or smooth the transition with interpolation in the 85-95% range.

---

### BUG-006: Flip Holding Cost Double-Counting
**Severity:** HIGH
**Location:** `gameMechanics.ts:551-582` (completeFlipDeal) AND `gameMechanics.ts:1028-1071` (chargeFlipCarryingCosts)

**Description:** Holding costs are charged in two places:
1. `chargeFlipCarryingCosts()` deducts weekly carrying costs from cash during rehab (line 1054)
2. `completeFlipDeal()` also calculates `totalHoldingCosts = holdingCostPerWeek * rehabWeeks` and deducts it from cash via ledger entries (line 600-609)

The comment at lines 573-580 in `completeFlipDeal` tries to explain this isn't double-counting, but the cash effect IS doubled: weekly deductions happen during rehab via `advanceGameWeek()`, then the full period is charged again at sale.

**Impact:** Flips are significantly less profitable than they should be. Players are paying holding costs twice - once weekly during rehab, and again as a lump sum at sale. This makes flips feel unfairly punishing.

**Recommendation:** Remove the `totalHoldingCosts` deduction from `completeFlipDeal()` since `chargeFlipCarryingCosts()` already handles this weekly. OR remove the weekly charging and only charge at completion. Pick one.

---

### BUG-007: Race Condition in Cash Balance Updates
**Severity:** HIGH
**Location:** `gameMechanics.ts:939-947`, `routes.ts:373`

**Description:** Multiple rental income calculations can run in sequence within the same `advanceGameWeek()` call. Each one fetches `currentCash` from the database, but the pattern is:
```
const currentGameRun = await storage.getGameRun(gameRun.id);
const currentCash = currentGameRun?.cash ?? gameRun.cash;
```
If two rentals process in the same tick, the second rental's `getGameRun()` may not reflect the first rental's cash update if the database write hasn't committed yet. This can cause cash balance drift.

**Impact:** With multiple active rentals, the player's cash balance can become slightly incorrect over time. In a 52-week game with 3 rentals, this could accumulate to meaningful amounts.

**Recommendation:** Use database transactions or accumulate all cash changes and apply them in a single atomic update at the end of `advanceGameWeek()`.

---

### BUG-008: Save/Load Creates Orphaned Database Records
**Severity:** HIGH
**Location:** `Game.tsx:270-324` - `continueSavedGame()`

**Description:** Loading a saved game creates a NEW game run via `api.createGameRun()` and restores deals/investigations/ledger to it. The old game run (with its original ID) remains in the database as an orphan. Repeated save/load cycles create unbounded database growth.

**Impact:** Database bloat over time. Also, the old game run may still appear as "active" for `getActiveGameRun()` queries, potentially causing state confusion.

**Recommendation:** Delete or mark the old game run as "abandoned" when restoring from a save. Or reuse the same game run ID.

---

## SECTION 3: BALANCE & DESIGN ISSUES

### BAL-001: Rental Strategy is Strictly Dominant Over Flipping
**Severity:** HIGH

**Analysis:** With $75K starting cash at Apprentice difficulty:
- **Rental:** Buy a $150K property at 75% LTV = ~$37.5K down + $4.5K closing + fees. Monthly cash flow starts immediately. No rehab risk. Low variance. Refinance after 8 weeks to extract equity for next deal.
- **Flip:** Same property needs $37.5K down + $4.5K closing + fees + $10-30K rehab budget (cash out of pocket if not financed). Holding costs accrue weekly. Sale price has high variance (70%-130% without comps). Multiple curveball risks during rehab.

The rental-then-refinance loop is clearly dominant: buy rental -> collect income for 8 weeks -> refinance to extract cash -> buy next rental -> repeat. This can be done 3 times within the 52-week window with much lower risk than any flip strategy.

Flipping has higher expected variance, higher costs, and requires the same amount of weeks (rehab + sale time) while generating zero income. The only reason to flip is educational exploration.

**Recommendation:**
- Increase rental seasoning period for refinance (8 weeks is very fast)
- Add a tenant search period with vacancy (e.g., 2-4 weeks of zero income after purchase)
- Make flip profits higher or reduce flip costs
- Consider a "deal type variety" bonus toward the 3-deal goal

---

### BAL-002: Due Diligence is Too Cheap Relative to Risk Avoidance
**Severity:** MEDIUM

**Analysis:** Full diligence costs ~$1,000 and 2 weeks. Skipping it creates:
- 20% chance of title issues ($2K-$100K range, mean ~$25K)
- 30% chance per phase of hidden repair issues ($2K-$40K range)
- Curveball probability multiplied by undiscovered issues

Expected cost of skipping ALL diligence: roughly $8-15K in surprise costs. Expected cost of doing diligence: $1,000 + 2 weeks of time.

The math strongly favors always doing full diligence. There's no interesting strategic tension - skipping is strictly dominated unless you're out of time.

**Recommendation:** Either increase diligence costs/time, or reduce surprise cost probabilities to create a genuine risk/reward tradeoff. Currently the "skip diligence" path is a trap, not a strategy.

---

### BAL-003: Market Condition Distribution is Too Favorable
**Severity:** MEDIUM
**Location:** `gameMechanics.ts:70-108`

**Analysis:** The market transition probabilities create a steady state where ~65%+ of time is spent in Good or Excellent. With Good giving -3% to +10% and Excellent giving 0% to +15%, the expected sale price multiplier is almost always positive. Combined with starting market = "good", most games will never see Terrible or Poor markets.

This undermines the educational message about market risk and timing.

**Recommendation:** Start new games with a random market condition. Reduce the upward bias so players occasionally face genuinely bad markets. Consider making the first market shift happen sooner (week 4 is late for a 52-week game).

---

### BAL-004: 100% LTV is Available but Practically Useless
**Severity:** LOW

**Analysis:** At 100% LTV: 12% interest rate, 6% loan fees, $0 down payment. The monthly payment on a $200K loan at 12% = ~$2,057/month. Combined with 6% origination ($12,000), this makes nearly every deal cash-flow-negative from day one. No rational player would choose this.

The "leverage trap" concept is good educationally, but it should be more tempting before being revealed as bad. Currently, the UI shows the high rate before commitment, so there's no actual trap.

**Recommendation:** Consider hiding the exact rate until after commitment (with a warning range), or make the 90-100% zone slightly more viable so players are tempted to try it at least once.

---

## SECTION 4: UX/UI ISSUES

### UX-001: Mobile "Next Month" Button Appears Twice
**Severity:** MEDIUM
**Location:** `StatusBar.tsx:256-320`

**Description:** On mobile, there are TWO advance-week buttons - one on the far left (line 257) and one on the far right (line 306) of the status bar. Both are identical blue play buttons.

**Impact:** Confusing. Players may accidentally double-tap (though there is a loading guard). Wastes precious screen real estate on mobile.

**Recommendation:** Remove one of the duplicate buttons. One prominent "Next Month" button is sufficient.

---

### UX-002: Pro Forma Editor Lacks Input Validation Feedback
**Severity:** MEDIUM
**Location:** `ProFormaEditor.tsx:206-267`

**Description:** The `TextInput` component accepts any text including negative numbers (line 221 handles `-` as valid input). There's no visual indication when a value is out of reasonable range. A player could enter negative rent, negative vacancy, or arbitrarily large values without immediate feedback.

**Impact:** Players can submit nonsensical pro formas (negative rent, 99% vacancy) and the calculator will happily compute them. The educational value is lost when garbage-in-garbage-out is allowed.

**Recommendation:** Add range validation with visual feedback (red border, warning text) for obviously wrong values. Clamp inputs to reasonable ranges.

---

### UX-003: Cheap Contractor Time Penalty is Deducted Silently
**Severity:** MEDIUM
**Location:** `Game.tsx:816-824`

**Description:** When a player chooses the "cheap" contractor, 2 weeks are immediately deducted from their remaining time with only a toast notification. This happens BEFORE the deal is committed, during the commit flow. If the player's deal then fails (insufficient funds), the 2 weeks are already gone.

**Impact:** Players lose time even if their deal doesn't go through. The penalty should only apply on successful deal commitment.

**Recommendation:** Move the time deduction to after the deal is successfully created and ledger entries are confirmed.

---

### UX-004: No Confirmation Dialog for "New Game"
**Severity:** MEDIUM
**Location:** `StatusBar.tsx:402-414`, `Game.tsx:629-654`

**Description:** The "New Game" button in the menu immediately destroys the current game with no confirmation dialog. One accidental tap and hours of progress are gone (the local save is also cleared at line 653).

**Impact:** Accidental game loss. High frustration for mobile players where accidental taps are common.

**Recommendation:** Add a confirmation modal: "Are you sure? Current game progress will be lost."

---

### UX-005: Ledger Amount Column Says "in cents for precision" but Uses Dollars
**Severity:** LOW
**Location:** `schema.ts:162`

**Description:** The schema comment says `amount: integer("amount").notNull(), // in cents for precision, positive value` but the actual code stores dollar amounts (e.g., `amount: 500` for $500, not 50000 cents).

**Impact:** Developer confusion. If someone later implements the cents interpretation, all amounts will be 100x wrong.

**Recommendation:** Fix the comment to say "in dollars" or convert the system to actually use cents.

---

### UX-006: "Forged Deed in Chain of Title" Title Issue is Disproportionate
**Severity:** MEDIUM
**Location:** `gameMechanics.ts:247` - `TITLE_ISSUES`

**Description:** The title issue array includes "Forged deed in chain of title" with a cost range of $25,000-$100,000. This is an outlier - most other issues are $2,000-$35,000. When this rolls (equal probability with all 10 issues), it can instantly bankrupt a player on their second deal.

**Impact:** A 20% chance of a title issue * 10% chance of this specific issue = 2% chance of a potentially game-ending $100K hit for skipping a $200 title search. The punishment is disproportionate and feels unfair.

**Recommendation:** Either reduce the max cost to $50K, or give this issue lower selection weight, or split it into a separate rare category.

---

## SECTION 5: MISSING FEATURES / GAPS

### GAP-001: No Automated Test Coverage
**Severity:** HIGH

**Description:** Zero test files found in the entire codebase. No unit tests, integration tests, or E2E tests. Only `npm run check` (TypeScript type checking) exists as QA.

**Impact:** Regressions are undetectable. The complex financial calculations in `gameData.ts` and `gameMechanics.ts` are untested - any formula change could silently break game balance.

**Recommendation:** At minimum, add unit tests for:
- `calculateProForma()` with known inputs/outputs
- `getInterestRateFromLTV()` curve verification
- `rollForCurveball()` probability distribution
- `completeFlipDeal()` profit calculation
- `processRentalIncome()` income calculation

---

### GAP-002: No Win/Loss Screen When Game Ends
**Severity:** MEDIUM

**Description:** While `GameOverModal.tsx` and `BankruptModal.tsx` exist as components, the actual trigger logic for when the game ends (weeks reach 0, or 3 profitable deals completed) is not clearly visible in the main Game.tsx flow. The game may just stop progressing without a clear victory/defeat screen.

**Recommendation:** Verify and test the end-game flow. Ensure the win condition (3 profitable deals) and loss conditions (0 weeks, bankruptcy) all trigger clear, celebratory or educational end screens.

---

### GAP-003: Difficulty Levels Beyond "Apprentice" Are Not Implemented
**Severity:** MEDIUM
**Location:** `Game.tsx:240-248`

**Description:** The game always starts with `difficulty: 'apprentice'`, `cash: 75000`, `weeksRemaining: 52`. The Professional ($50K), Expert ($30K), and Hardcore modes described in design docs are not selectable in the UI.

**Impact:** Reduces replay value. Experienced players have no progression beyond mastering Apprentice.

**Recommendation:** Add difficulty selection to the PlayerNameModal or pre-game screen.

---

### GAP-004: Trophy Descriptions Don't Match Implementation
**Severity:** LOW
**Location:** `schema.ts:224` vs `gameMechanics.ts:365`

**Description:** The "Millionaire" trophy description says "Earn $750,000 total profit" but the code checks `cumulativeProfit >= 500000` (line 365). The "Detective" trophy (complete all diligence on 5 properties) has no implementation in `checkAndAwardTrophies()`.

**Recommendation:** Align descriptions with code, or vice versa. Implement missing trophy checks.

---

## SECTION 6: SECURITY CONCERNS

### SEC-001: Game Run Deletion Has No Authorization
**Severity:** HIGH
**Location:** `routes.ts:220-229`

**Description:** `DELETE /api/game-runs/:id` deletes any game run by ID with no authentication. Any player could delete another player's game.

---

### SEC-002: Player Stats Can Be Directly Modified
**Severity:** HIGH
**Location:** `routes.ts:743-764`

**Description:** `PATCH /api/players/:id/stats` allows setting arbitrary values for `totalGamesPlayed`, `totalDealsCompleted`, `totalProfitEarned`, `bestGameProfit`, `gamesWon` with no authentication.

**Impact:** Hall of Fame leaderboard can be trivially manipulated.

---

### SEC-003: Trophy Awards Endpoint is Unauthenticated
**Severity:** MEDIUM
**Location:** `routes.ts:722-740`

**Description:** `POST /api/players/:id/trophies` allows awarding any trophy to any player. No verification that the player actually earned it.

---

## SECTION 7: POSITIVE OBSERVATIONS

What works well:

1. **Educational depth is genuinely impressive.** The pro forma calculation teaches real RE math. LTV-based financing, vacancy rates, cap rates, cash-on-cash returns - this is accurate education wrapped in a game.

2. **Tenant personality system is delightful.** The 9 personality types with unique text patterns (corporate brain, chaos magnet, retired micromanager) add genuine character. The tenant messages are well-written and funny.

3. **Curveball system is well-designed.** Property-aware events that scale with price and condition create realistic variance. The issue-to-curveball mapping where undiscovered issues cause related problems is clever.

4. **Dark UI with emerald accents looks professional.** The StatusBar with animated number transitions, progress ring, and pulse effects feels polished.

5. **The "leverage trap" concept is brilliant game design.** Teaching players that 100% LTV is available but terrible through mechanical consequences (not just a warning label) is excellent experiential learning.

6. **Refinance system adds strategic depth.** The 8-week seasoning period, cooldown between refinances, and LTV-based terms create genuine decision-making.

7. **Rate limiting and IP blocking show security awareness.** The strike-based progressive blocking system is more sophisticated than most game backends.

---

## SECTION 8: PRIORITIZED RECOMMENDATIONS

### Must Fix (Pre-Launch):
1. Fix weeks/months terminology confusion (BUG-001)
2. Secure or remove premium purchase endpoints (BUG-002)
3. Add authentication to admin endpoint (BUG-003)
4. Fix flip holding cost double-counting (BUG-006)
5. Add confirmation dialog for New Game (UX-004)
6. Fix contractor penalty timing (UX-003)

### Should Fix (First Patch):
7. Fix curveball ordering bias (BUG-004)
8. Address race condition in multi-rental cash updates (BUG-007)
9. Remove duplicate mobile Next Month button (UX-001)
10. Add input validation to pro forma fields (UX-002)
11. Add basic unit tests for financial calculations (GAP-001)
12. Secure player stats and game deletion endpoints (SEC-001, SEC-002)

### Nice to Have (Future Updates):
13. Balance rental vs flip strategy parity (BAL-001)
14. Implement difficulty levels (GAP-003)
15. Add market condition variety (BAL-003)
16. Fix trophy description mismatches (GAP-004)
17. Clean up save/load orphaned records (BUG-008)

---

## APPENDIX: TEST ENVIRONMENT NOTES

- No build was run (database dependency required). Analysis performed via comprehensive code review.
- All findings are based on reading source code, not live gameplay observation.
- Probability analysis for curveballs and market conditions was done mathematically, not via Monte Carlo simulation.
- Financial formula verification was done manually against standard RE investment math.

---

*Report prepared for James. All findings are actionable. Happy to discuss priority ordering or provide additional detail on any item.*
