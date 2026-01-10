# State-Based Progression Analysis: Dealbreak

**Date:** 2026-01-10
**Focus:** State gating, causal loops, information leakage, determinism
**Scope:** System-level design feedback

---

## Executive Summary

Dealbreak has a **strong architectural foundation** for state-based progression but contains **critical information leakage** and **weak causal enforcement** that allow players to bypass the intended learning loop. The core issue: **the game asks players to gather information through diligence but doesn't enforce use of that information in decision-making**.

**Severity Classification:**
- 🔴 **CRITICAL** - Breaks core game loop
- 🟡 **MODERATE** - Weakens intended mechanics
- 🟢 **MINOR** - Edge case or polish issue

---

## Part 1: Critical State Leakage Issues

### 🔴 CRITICAL #1: Pro Forma Calculation Bypasses Diligence Requirement

**Location:** `ProFormaPanel.tsx:114-308`

**Problem:** Players can calculate pro forma metrics without purchasing required diligence.

**Current Flow:**
```
Player opens property detail
  → Clicks "Build Pro Forma"
  → ProFormaPanel renders
  → Rent input shows "???" if no market study
  → BUT input is still editable
  → Player enters $2500 rent (pure guess)
  → Clicks "Lock In Pro Forma"
  → Calculation proceeds using player's guess
  → Metrics unlock
```

**What Should Happen:**
```
Player opens property detail
  → Clicks "Build Pro Forma"
  → ProFormaPanel renders
  → Rent input is DISABLED if no market study
  → Rehab input is DISABLED if no contractor walkthrough
  → "Lock In Pro Forma" button is DISABLED until required diligence completed
  → Player forced to purchase diligence to proceed
```

**Code Evidence:**
```typescript
// ProFormaPanel.tsx:677-723
{effectiveRanges.rent.known ? (
  <input type="number" value={inputs.expectedRent} onChange={...} />
) : (
  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
    <p className="text-amber-400 text-xs">
      Complete a Market Rent Study to unlock rent estimates
    </p>
  </div>
)}
```

The unknown state shows a message but **doesn't prevent calculation**. The inputs still exist in state and the Calculate button works.

**Impact:**
- Completely bypasses diligence system
- Player can win without ever purchasing investigations
- Learning objective ("gather data before deciding") is not enforced

**Recommendation:**
```typescript
// Hard gate: disable calculation if required diligence missing
const missingCriticalDiligence =
  (strategy === 'rent' && !hasMarketStudy) ||
  (strategy === 'flip' && !hasAppraisal) ||
  !hasContractorWalkthrough;

<button
  onClick={onCalculate}
  disabled={missingCriticalDiligence || !isViable}
  className={...}
>
  {missingCriticalDiligence
    ? 'Complete Required Diligence First'
    : isViable ? 'Lock In Pro Forma' : 'Fix Issues First'}
</button>
```

---

### 🔴 CRITICAL #2: Deal Commitment Doesn't Validate Diligence State

**Location:** `Game.tsx:372-441`, `MetricsPanel.tsx:60-62`

**Problem:** Player can commit to deals without having purchased diligence to support their assumptions.

**Current Validation:**
```typescript
// MetricsPanel.tsx:60-62
const meetsThresholds = strategy === 'rent'
  ? outputs && outputs.cashOnCash >= 8 && outputs.cashFlowMonthly >= 0
  : flipROI >= 20 && flipProfit >= 15000;
```

**What's Missing:**
```typescript
// Should also check:
const hasRequiredDiligence = strategy === 'rent'
  ? completedDiligence.includes('market_study') &&
    completedDiligence.includes('contractor_walkthrough')
  : completedDiligence.includes('appraisal') &&
    completedDiligence.includes('contractor_walkthrough');

const meetsThresholds =
  metricsAreGood && hasRequiredDiligence;
```

**Impact:**
- Player can commit based on pure speculation
- Diligence system becomes optional when it should be mandatory
- No causal link between investigation → informed decision → outcome

**Recommendation:**
Add diligence gating at commit time. Show clear messaging:
```
"⚠️ Cannot commit to deal without:
• Market Rent Study (to validate rent assumption)
• Contractor Walkthrough (to validate rehab cost)
• [Strategy-specific investigations]"
```

---

### 🔴 CRITICAL #3: Execution Uses Player Assumptions Instead of Ground Truth

**Location:** `gameMechanics.ts:50-85`, `Game.tsx:418-425`

**Problem:** When deals execute, the game uses the player's pro forma assumptions rather than property ground truth, eliminating consequences for poor diligence.

**Current Execution Logic:**
```typescript
// gameMechanics.ts:59-66
export async function completeFlipDeal(deal, gameRun, curveball?) {
  const proFormaOutputs = deal.proFormaOutputs as any;

  // Base sale price from pro forma
  let salePrice = proFormaOutputs.arv || 0;  // ← PLAYER'S GUESS
  let cashImpact = curveball?.cashImpact || 0;

  if (curveball) {
    salePrice += cashImpact;  // ← Random variance only
  }
}
```

**What Should Happen:**
```typescript
export async function completeFlipDeal(deal, gameRun, property, curveball?) {
  // Get actual property data
  const actualARV = property.arvMin + (property.arvMax - property.arvMin) *
    (completedDiligence.includes('appraisal') ? 0.5 : Math.random());

  // Player's assumption
  const assumedARV = deal.proFormaOutputs.arv;

  // Calculate miss (how wrong were they?)
  const assumptionError = actualARV - assumedARV;

  // Final sale price
  let salePrice = actualARV + (curveball?.cashImpact || 0);

  // Store both for postmortem
  return {
    salePrice,
    assumedPrice: assumedARV,
    assumptionError,
    lesson: assumptionError < 0
      ? "You overestimated ARV - always get comps!"
      : "Your ARV estimate was accurate"
  };
}
```

**Impact:**
- **No consequence for bad assumptions** - player's guess becomes reality
- **Curveballs are only randomness** - they don't reveal player's forecasting errors
- **Missing the core teaching moment** - "Your assumptions were wrong, here's why"

**Recommendation:**
Introduce **Ground Truth Resolution** system:
1. Store property's actual values separately from player assumptions
2. At execution time, resolve player assumption vs. actual
3. Use actual for outcome, show delta in postmortem
4. Tie accuracy to diligence: more diligence = smaller variance in actuals

---

### 🔴 CRITICAL #4: Pro Forma Inputs Not Constrained to Diligence Ranges

**Location:** `ProFormaPanel.tsx:664-723`

**Problem:** Even when ranges are "known", player can input values outside the unlocked ranges.

**Current Code:**
```typescript
// ProFormaPanel.tsx:682-695
<input
  type="number"
  value={inputs.expectedRent}
  onChange={(e) => {
    const val = Number(e.target.value);
    if (val >= effectiveRanges.rent.min && val <= effectiveRanges.rent.max) {
      handleChange('expectedRent', val);
    }
  }}
  min={effectiveRanges.rent.min}
  max={effectiveRanges.rent.max}
/>
```

The validation exists, but:
1. Only when typing in number input (not when using slider)
2. Easy to bypass by editing existing value
3. No server-side validation at commit time

**Recommendation:**
```typescript
// Enforce at multiple layers
const validateProFormaInputs = (inputs: ProFormaInputs, ranges: EffectiveRanges) => {
  const errors = [];

  if (inputs.expectedRent < ranges.rent.min || inputs.expectedRent > ranges.rent.max) {
    errors.push(`Rent must be between ${ranges.rent.min}-${ranges.rent.max}`);
  }

  if (inputs.rehabBudget < ranges.rehab.min || inputs.rehabBudget > ranges.rehab.max) {
    errors.push(`Rehab must be between ${ranges.rehab.min}-${ranges.rehab.max}`);
  }

  return errors;
};

// Disable commit if validation fails
const validationErrors = validateProFormaInputs(inputs, effectiveRanges);
const canCommit = meetsThresholds && validationErrors.length === 0;
```

---

## Part 2: Weak Causal Loops

### 🟡 MODERATE #5: Hidden Issues Don't Affect Pro Forma Calculations

**Location:** `propertyIssues.ts:589-597`, `ProFormaPanel.tsx:114-309`

**Problem:** Issues revealed by inspections are shown to the player but don't automatically update pro forma calculations.

**Current Flow:**
```
Player purchases inspection
  → Issues revealed (e.g., "Mold: $8K-$20K")
  → Player sees issues in PropertyDetail
  → Player manually increases rehab budget (or doesn't)
  → No enforcement that discovered costs are included
```

**Recommended Flow:**
```
Player purchases inspection
  → Issues revealed with cost ranges
  → System calculates minimum issue costs
  → Pro forma rehab budget auto-adjusts to include discovered issues
  → Player can add more buffer, but can't go below discovered minimum
  → Warning shown: "You have $15K in known issues, budget only $10K"
```

**Code Recommendation:**
```typescript
// Calculate minimum rehab based on discovered issues
const discoveredIssueCosts = getTotalIssuesCostRange(revealedIssues);
const minimumRehabBudget = Math.max(
  effectiveRanges.rehab.min,
  discoveredIssueCosts.min
);

// Prevent player from budgeting less than discovered costs
<input
  type="number"
  value={inputs.rehabBudget}
  min={minimumRehabBudget}  // ← Enforced minimum
  onChange={...}
/>

{inputs.rehabBudget < discoveredIssueCosts.min && (
  <div className="text-red-400 text-xs">
    ⚠️ Budget is {formatCurrency(discoveredIssueCosts.min - inputs.rehabBudget)}
    below known repair costs!
  </div>
)}
```

---

### 🟡 MODERATE #6: Curveball Events Don't Reference Player Assumptions

**Location:** `curveballs.ts:353-373`, `gameMechanics.ts:50-130`

**Problem:** Random events modify outcomes but don't interact with whether player made good assumptions.

**Current System:**
- Curveballs are pure randomness
- No connection to player's diligence quality
- Player who skipped all investigations has same event probabilities as thorough player

**Recommended Enhancement:**
```typescript
// Curveball probability should be modified by diligence quality
export function rollForCurveball(
  trigger: CurveballTrigger,
  diligenceCompleted: string[]
): Curveball | null {
  const possibleEvents = getCurveballsForTrigger(trigger);

  // Diligence quality affects negative event probability
  const diligenceBonus = diligenceCompleted.length * 0.05; // 5% reduction per investigation

  for (const event of possibleEvents) {
    let adjustedProbability = event.probability;

    if (event.type === 'negative') {
      // Thorough diligence reduces bad surprises
      adjustedProbability *= (1 - diligenceBonus);
    } else if (event.type === 'positive') {
      // Thorough diligence increases good opportunities
      adjustedProbability *= (1 + diligenceBonus);
    }

    const roll = Math.random() * 100;
    if (roll < adjustedProbability) {
      return resolveEvent(event);
    }
  }

  return null;
}
```

**Impact:**
Creates causal link: **Good diligence → Better outcomes** (not just better predictions)

---

### 🟡 MODERATE #7: Rental Income Uses Player's Cash Flow Assumption

**Location:** `gameMechanics.ts:287-291`, `Game.tsx:432`

**Problem:** Weekly rental income is calculated from player's pro forma cash flow, not actual market rent.

**Current Code:**
```typescript
// Game.tsx:432
await api.activateRental(newDeal.id, gameRun.id, proFormaOutputs.cashFlowMonthly);

// gameMechanics.ts:287-291
export function calculateWeeklyIncome(monthlyCashFlow: number): number {
  return Math.floor(monthlyCashFlow / 4.33);
}
```

**Problem:** If player assumed $1800 rent without market study, they get $1800/mo forever. No reality check.

**Recommendation:**
```typescript
export async function activateRental(
  deal: Deal,
  property: Property,
  assumedMonthlyCashFlow: number,
  completedDiligence: string[]
) {
  // Determine actual rent based on property data + diligence quality
  const rentVariance = completedDiligence.includes('market_study')
    ? 0.05  // ±5% if studied
    : 0.25; // ±25% if guessed

  const rentMid = (property.rentMin + property.rentMax) / 2;
  const actualRent = rentMid * (1 + (Math.random() * 2 - 1) * rentVariance);

  // Calculate actual cash flow (may differ from assumption)
  const actualMonthlyCashFlow = calculateActualCashFlow(
    actualRent,
    deal.proFormaInputs
  );

  const weeklyIncome = Math.floor(actualMonthlyCashFlow / 4.33);

  // Store both for learning
  await storage.updateDeal(deal.id, {
    status: 'active_rental',
    weeklyIncome,
    assumedCashFlow: assumedMonthlyCashFlow,
    actualCashFlow: actualMonthlyCashFlow,
    rentAssumptionError: actualRent - deal.proFormaInputs.expectedRent
  });
}
```

---

## Part 3: Incomplete State Machines

### 🟡 MODERATE #8: Contractor Choice is Non-Functional

**Location:** `PropertyDetail.tsx:537-559`

**Problem:** Contractor choice UI exists but is permanently disabled and has no effect.

**Current State:**
```typescript
// PropertyDetail.tsx:537-559
<div className="bg-slate-800/30 ... opacity-60">
  <h3 className="...">
    <Lock className="w-4 h-4" /> Contractor Choice
    <span className="...">(Available after offer accepted)</span>
  </h3>
  {/* Greyed out options */}
</div>
```

**What's Missing:**
1. No unlock condition implemented
2. No effect on rehab cost or timeline
3. Choice is stored in `proFormaInputs.contractorType` but never used

**Recommendation:**

**Option A: Remove It**
If contractor choice doesn't add meaningful strategic depth, remove the UI entirely.

**Option B: Implement It**
```typescript
// PropertyDetail.tsx - unlock after pro forma complete
const contractorUnlocked = isProFormaComplete;

<div className={contractorUnlocked ? 'opacity-100' : 'opacity-60'}>
  <button
    disabled={!contractorUnlocked}
    onClick={() => setContractor('cheap')}
  >
    Cheap & Slow
  </button>
  <button
    disabled={!contractorUnlocked}
    onClick={() => setContractor('fast')}
  >
    Fast & Expensive
  </button>
</div>

// Then in gameMechanics.ts - apply modifiers
const contractorModifiers = {
  cheap: { costMultiplier: 0.85, timeMultiplier: 1.5 },
  fast: { costMultiplier: 1.3, timeMultiplier: 0.7 }
};

const modifier = contractorModifiers[deal.proFormaInputs.contractorType];
const actualRehabCost = baseRehabCost * modifier.costMultiplier;
const actualRehabWeeks = baseRehabWeeks * modifier.timeMultiplier;
```

---

### 🟡 MODERATE #9: "Make Offer" Button is Dead-End UI

**Location:** `PropertyDetail.tsx:596-607`

**Problem:** Button exists but does nothing and is never enabled.

**Current Code:**
```typescript
<button
  disabled={!isProFormaComplete}
  className={...}
>
  {!isProFormaComplete && <Lock className="w-4 h-4" />}
  {isProFormaComplete ? 'Make Offer' : 'Complete Pro Forma to Make Offer'}
</button>
```

No onClick handler, no functionality.

**Recommendation:**

**Option A: Remove It**
The "Build Pro Forma" flow already leads to commitment. This button is redundant.

**Option B: Make It Functional**
```typescript
const handleMakeOffer = () => {
  // Navigate directly to pro forma with pre-selected options
  onOpenProForma(strategy, financing, contractor);
};

<button
  onClick={handleMakeOffer}
  disabled={!isProFormaComplete}
>
  Make Offer
</button>
```

But this still doesn't add value. **Recommendation: Remove.**

---

## Part 4: Sequence Breaking Vulnerabilities

### 🟢 MINOR #10: Week Advancement Doesn't Check Win/Loss State

**Location:** `gameMechanics.ts:208-282`, `Game.tsx:443-472`

**Problem:** Player can continue advancing weeks after winning or losing.

**Current Check:**
```typescript
// gameMechanics.ts:214-216
if (gameRun.weeksRemaining <= 0) {
  throw new Error('Game time has expired');
}
```

**Missing Check:**
```typescript
if (gameRun.status === 'completed' || gameRun.status === 'lost') {
  throw new Error('Game has already ended');
}
```

**Impact:** Low - UI likely prevents this, but server should enforce it.

**Recommendation:**
```typescript
export async function advanceGameWeek(gameRunId: number) {
  const gameRun = await storage.getGameRun(gameRunId);
  if (!gameRun) throw new Error('Game run not found');

  // State guards
  if (gameRun.status !== 'active') {
    throw new Error('Cannot advance week - game is not active');
  }
  if (gameRun.weeksRemaining <= 0) {
    throw new Error('Game time has expired');
  }

  // ... proceed with week advancement
}
```

---

### 🟢 MINOR #11: Diligence Can Be Purchased After Deal Commitment

**Location:** `Game.tsx:285-344`, no check for existing deal on property

**Problem:** Player can commit to a deal, then purchase diligence on that property.

**Expected Behavior:** Diligence should be locked once deal is committed.

**Recommendation:**
```typescript
// In PropertyDetail.tsx
const propertyHasDeal = deals.some(d => d.propertyId === property.id);

<button
  disabled={isCompleted || !canAfford || propertyHasDeal}
  onClick={() => handleDiligenceClick(option)}
>
  {propertyHasDeal ? 'Deal already committed' : option.name}
</button>
```

---

## Part 5: Where The System Succeeds

### ✅ Strength #1: Diligence Purchase Gating is Solid

**Location:** `Game.tsx:285-344`

**What Works:**
```typescript
const existingDiligence = completedDiligence[propertyId] || [];
if (existingDiligence.includes(diligenceType)) {
  toast.error('Investigation already completed');
  return;
}

if (gameRun.cash < cost) {
  toast.error('Not enough cash for this investigation');
  return;
}
```

- Can't purchase twice ✓
- Requires sufficient cash ✓
- Deducts resources atomically ✓
- Creates investigation record ✓

**Causal Chain:** Resources → Purchase → State Change → Effects

---

### ✅ Strength #2: Time Progression State Machine

**Location:** `gameMechanics.ts:208-282`

**What Works:**
- Rentals pay weekly income predictably ✓
- Flip timelines decrement correctly ✓
- Completion triggers automatically when `weeksUntilCompletion <= 0` ✓
- Week and resource counters update atomically ✓

**State Flow:**
```
Deal Created (status='planned')
  → startFlipRehab() → status='in_rehab', weeksUntilCompletion=N
  → advanceGameWeek() → weeksUntilCompletion--
  → (repeat N times)
  → weeksUntilCompletion=0 → completeFlipDeal() → status='completed'
```

This is deterministic and leak-free. ✓

---

### ✅ Strength #3: Deal Profitability Tracking

**Location:** `gameMechanics.ts:112-117`

**What Works:**
```typescript
// Update profitable deals count if profit > 0
if (profit > 0) {
  await storage.updateGameRun(gameRun.id, {
    profitableDeals: gameRun.profitableDeals + 1,
  });
}
```

- Only increments on actual profit ✓
- Transactional update ✓
- Win condition tied to this counter ✓

**Causal Chain:** Deal Completes → Calculate Profit → If > 0 → Increment Counter → Check Win

---

### ✅ Strength #4: Hidden Issues Revelation

**Location:** `propertyIssues.ts:589-597`

**What Works:**
```typescript
export function getRevealedIssues(
  propertyName: string,
  completedDiligence: string[]
): PropertyIssue[] {
  const allIssues = getPropertyIssues(propertyName);
  return allIssues.filter(issue =>
    issue.discoveredBy.some(method => completedDiligence.includes(method))
  );
}
```

- Issues exist in configuration before player sees them ✓
- Only revealed when specific diligence purchased ✓
- No way to infer hidden issues without investigation ✓

**Causal Chain:** Purchase Inspection → Filter Issues → Reveal → Player Updates Budget

---

### ✅ Strength #5: Resource Deduction is Atomic

**Location:** `Game.tsx:304-344`

**What Works:**
```typescript
await createLedgerMutation.mutateAsync({
  gameRunId: gameRun.id,
  entries: [{
    direction: 'debit',
    category: 'due_diligence',
    amount: cost,
    description: `${diligenceType} - ${property?.name}`,
    propertyId,
  }],
  currentCash: gameRun.cash,
});

await updateGameMutation.mutateAsync({
  id: gameRun.id,
  updates: { weeksRemaining: newWeeks },
});

await createInvestigationMutation.mutateAsync({...});
```

All three operations happen in sequence:
1. Deduct cash (creates ledger entry)
2. Deduct time (updates weeks)
3. Create investigation record

If any fails, the prior state is preserved. ✓

---

## Part 6: Design Recommendations (Prioritized)

### Priority 1: Close the Core Learning Loop

**Goal:** Enforce the intended cause-effect chain: Diligence → Informed Assumptions → Accurate Outcomes

**Changes:**

1. **Require diligence to unlock pro forma inputs** (Critical #1)
   - Disable rent input until market study purchased
   - Disable rehab input until contractor walkthrough purchased
   - Disable ARV until comp analysis purchased (flips only)

2. **Validate diligence at commit time** (Critical #2)
   - Add `hasRequiredDiligence` check to deal commitment
   - Show clear error: "Cannot commit without [missing investigations]"

3. **Introduce ground truth resolution** (Critical #3)
   - Store property actuals separately from player assumptions
   - At execution, resolve actual vs. assumed
   - Show delta in postmortem: "You assumed $200K, actual was $185K"

4. **Constrain inputs to unlocked ranges** (Critical #4)
   - Hard enforce min/max at input level
   - Server-side validation at commit
   - Visual indication when out of bounds

**Impact:** Transforms diligence from "nice to have" to "required for success"

---

### Priority 2: Strengthen Causal Consequences

**Goal:** Make player decisions have clear, traceable outcomes

**Changes:**

1. **Auto-include discovered issues in budget** (Moderate #5)
   - Minimum rehab budget = discovered issue costs
   - Warning if budgeting below known costs

2. **Link diligence quality to event probabilities** (Moderate #6)
   - More diligence → fewer negative surprises
   - Create feedback loop rewarding thoroughness

3. **Resolve rental income against actuals** (Moderate #7)
   - Calculate actual rent based on property + variance
   - Show assumption error in ongoing reports
   - Teach: "Your $1800 assumption was $200 too high"

**Impact:** Every choice matters; players see consequences of assumptions

---

### Priority 3: Clean Up Incomplete Features

**Goal:** Remove dead code and non-functional UI elements

**Changes:**

1. **Remove or implement contractor choice** (Moderate #8)
   - If keeping: unlock after pro forma, apply cost/time modifiers
   - If removing: delete UI and state

2. **Remove "Make Offer" button** (Moderate #9)
   - Redundant with pro forma flow
   - Delete button entirely

3. **Add game status checks** (Minor #10)
   - Prevent week advancement after win/loss
   - Server-side enforcement

4. **Lock diligence after deal commitment** (Minor #11)
   - Prevent purchasing investigations after committing
   - Clear messaging

**Impact:** Cleaner, more intentional design

---

## Part 7: Concrete Implementation Examples

### Example 1: Required Diligence Gate

**File:** `ProFormaPanel.tsx`

**Before:**
```typescript
{effectiveRanges.rent.known ? (
  <input type="number" value={inputs.expectedRent} onChange={...} />
) : (
  <div className="bg-amber-500/10">
    <p>Complete a Market Rent Study to unlock rent estimates</p>
  </div>
)}
```

**After:**
```typescript
const canCalculate =
  (strategy === 'rent' && hasMarketStudy && hasContractorWalkthrough) ||
  (strategy === 'flip' && hasAppraisal && hasContractorWalkthrough);

const missingDiligence = [];
if (strategy === 'rent' && !hasMarketStudy) missingDiligence.push('Market Rent Study');
if (strategy === 'flip' && !hasAppraisal) missingDiligence.push('Comp Analysis');
if (!hasContractorWalkthrough) missingDiligence.push('Contractor Walkthrough');

// At bottom of panel
<button
  onClick={onCalculate}
  disabled={!canCalculate || !isViable}
>
  {!canCalculate
    ? `Complete ${missingDiligence.join(', ')} first`
    : isViable ? 'Lock In Pro Forma' : 'Fix Issues First'}
</button>

{!canCalculate && (
  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm">
    <AlertTriangle className="w-4 h-4 inline mr-2" />
    <strong>Required Diligence Missing:</strong>
    <ul className="ml-6 mt-2">
      {missingDiligence.map(d => (
        <li key={d}>• {d}</li>
      ))}
    </ul>
    <p className="mt-2 text-xs text-gray-400">
      Pro forma cannot be calculated without verified data. Return to property detail to purchase investigations.
    </p>
  </div>
)}
```

---

### Example 2: Ground Truth Resolution

**File:** `gameMechanics.ts`

**Before:**
```typescript
export async function completeFlipDeal(deal, gameRun, curveball?) {
  const proFormaOutputs = deal.proFormaOutputs as any;
  let salePrice = proFormaOutputs.arv || 0;  // Player's guess

  if (curveball) {
    salePrice += curveball.cashImpact;
  }

  const profit = salePrice - allInCost;
  // ... rest
}
```

**After:**
```typescript
export async function completeFlipDeal(
  deal: Deal,
  gameRun: GameRun,
  property: Property,
  completedDiligence: string[],
  curveball?: any
): Promise<FlipSaleResult> {
  const proFormaOutputs = deal.proFormaOutputs as any;
  const proFormaInputs = deal.proFormaInputs as any;

  // Calculate actual ARV based on property data + diligence quality
  const hasAppraisal = completedDiligence.includes('appraisal');
  const arvVariance = hasAppraisal ? 0.05 : 0.15; // ±5% if studied, ±15% if guessed

  const arvMid = (property.arvMin + property.arvMax) / 2;
  const actualARV = arvMid * (1 + (Math.random() * 2 - 1) * arvVariance);

  // Calculate actual rehab cost
  const hasContractorWT = completedDiligence.includes('contractor_walkthrough');
  const rehabVariance = hasContractorWT ? 0.10 : 0.30;

  const rehabMid = (property.rehabMin + property.rehabMax) / 2;
  const actualRehab = rehabMid * (1 + (Math.random() * 2 - 1) * rehabVariance);

  // Apply curveball
  const curveballImpact = curveball?.cashImpact || 0;
  const finalSalePrice = actualARV + curveballImpact;

  // Calculate costs using actuals
  const closingCosts = property.price * 0.03;
  const actualAllInCost = property.price + closingCosts + actualRehab;

  // Calculate holding costs using actual timeline
  const actualWeeks = proFormaInputs.rehabWeeks * (hasContractorWT ? 1.05 : 1.25);
  const holdingCosts = (property.price * (proFormaInputs.interestRate / 100) / 52) * actualWeeks;

  // Final profit
  const profit = finalSalePrice - actualAllInCost - holdingCosts;

  // Store assumptions vs actuals for postmortem
  const assumptionErrors = {
    arvError: actualARV - proFormaInputs.arv,
    rehabError: actualRehab - proFormaInputs.rehabBudget,
    timelineError: actualWeeks - proFormaInputs.rehabWeeks
  };

  // Create detailed ledger entry
  const ledgerEntry = {
    direction: 'credit',
    category: 'income',
    amount: finalSalePrice,
    description: `Flip sale - ${property.name}`,
    metadata: {
      assumedARV: proFormaInputs.arv,
      actualARV,
      assumedRehab: proFormaInputs.rehabBudget,
      actualRehab,
      assumptionErrors,
      curveball: curveball?.name
    }
  };

  // ... rest of ledger creation and deal update

  return {
    salePrice: finalSalePrice,
    profit,
    assumptionErrors,
    postmortem: generatePostmortem(assumptionErrors, completedDiligence),
    curveball
  };
}

function generatePostmortem(errors: any, diligence: string[]): string {
  const lessons = [];

  if (Math.abs(errors.arvError) > 10000) {
    lessons.push(
      errors.arvError < 0
        ? "❌ ARV overestimated by $" + Math.abs(errors.arvError).toLocaleString() +
          (!diligence.includes('appraisal') ? " - should have done comp analysis!" : "")
        : "✓ ARV underestimated (left money on table)"
    );
  }

  if (Math.abs(errors.rehabError) > 5000) {
    lessons.push(
      errors.rehabError < 0
        ? "❌ Rehab underestimated by $" + Math.abs(errors.rehabError).toLocaleString() +
          (!diligence.includes('contractor_walkthrough') ? " - contractor walkthrough would have caught this!" : "")
        : "✓ Rehab overbudgeted (good buffer)"
    );
  }

  return lessons.join('\n');
}
```

---

### Example 3: Diligence-Based Event Probabilities

**File:** `curveballs.ts`

**Before:**
```typescript
export function rollForCurveball(trigger: CurveballTrigger): Curveball | null {
  const possibleEvents = getCurveballsForTrigger(trigger);

  for (const event of possibleEvents) {
    const roll = Math.random() * 100;
    if (roll < event.probability) {
      return resolveEvent(event);
    }
  }

  return null;
}
```

**After:**
```typescript
export function rollForCurveball(
  trigger: CurveballTrigger,
  completedDiligence: string[] = []
): Curveball | null {
  const possibleEvents = getCurveballsForTrigger(trigger);

  // Calculate diligence quality modifier
  const diligenceQuality = completedDiligence.length / 5; // 0.0 to 1.0
  const negativeReduction = diligenceQuality * 0.30; // Up to 30% reduction
  const positiveIncrease = diligenceQuality * 0.20; // Up to 20% increase

  for (const event of possibleEvents) {
    let adjustedProbability = event.probability;

    // Adjust based on event type
    if (event.type === 'negative') {
      // More diligence = fewer bad surprises
      adjustedProbability *= (1 - negativeReduction);
    } else if (event.type === 'positive') {
      // More diligence = more good opportunities discovered
      adjustedProbability *= (1 + positiveIncrease);
    }

    // Some events are specifically prevented by diligence
    if (event.id === 'hidden_mold' && completedDiligence.includes('inspection')) {
      adjustedProbability = 0; // Inspection would have caught this
    }

    const roll = Math.random() * 100;
    if (roll < adjustedProbability) {
      const resolved = resolveEvent(event);

      // Add context about why this happened
      if (event.type === 'negative' && !completedDiligence.includes(getPreventativeDiligence(event))) {
        resolved.description += ` (Could have been prevented with ${getPreventativeDiligence(event)})`;
      }

      return resolved;
    }
  }

  return null;
}

function getPreventativeDiligence(event: Curveball): string {
  const preventionMap: Record<string, string> = {
    'hidden_mold': 'inspection',
    'permit_delay': 'contractor walkthrough',
    'title_issue': 'title search',
    // ... etc
  };
  return preventionMap[event.id] || '';
}
```

---

## Part 8: State Flow Diagrams

### Current Flow (Broken)

```
┌─────────────────────────────────────────────────────────────┐
│ PROPERTY EVALUATION                                         │
│                                                             │
│ Player views property                                       │
│   ↓                                                         │
│ (Optional) Purchase diligence ← NOT ENFORCED               │
│   ↓                                                         │
│ Open pro forma                                             │
│   ↓                                                         │
│ Enter assumptions ← CAN BE PURE GUESSES                    │
│   ↓                                                         │
│ Calculate metrics ← ALWAYS WORKS                           │
│   ↓                                                         │
│ Commit deal ← NO VALIDATION                                │
│                                                             │
│ LEAK: Player never needs diligence ❌                      │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ EXECUTION                                                    │
│                                                             │
│ Flip completes                                              │
│   ↓                                                         │
│ Use player's ARV assumption ← NOT GROUND TRUTH             │
│   ↓                                                         │
│ Add random curveball                                       │
│   ↓                                                         │
│ Calculate profit                                           │
│                                                             │
│ LEAK: No consequence for bad assumptions ❌                │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Flow (Tight)

```
┌─────────────────────────────────────────────────────────────┐
│ PROPERTY EVALUATION                                         │
│                                                             │
│ Player views property                                       │
│   ↓                                                         │
│ Attempt to open pro forma                                  │
│   ↓                                                         │
│ ┌──────────────────────────────────────┐                   │
│ │ GATE: Required diligence check       │                   │
│ │                                      │                   │
│ │ IF missing market study (rental):   │                   │
│ │   → Block pro forma                 │                   │
│ │   → Show: "Purchase Market Study"   │                   │
│ │                                      │                   │
│ │ IF missing comp analysis (flip):    │                   │
│ │   → Block pro forma                 │                   │
│ │   → Show: "Purchase Comp Analysis"  │                   │
│ │                                      │                   │
│ │ IF missing contractor walkthrough:  │                   │
│ │   → Block pro forma                 │                   │
│ │                                      │                   │
│ │ ELSE: Unlock pro forma ✓            │                   │
│ └──────────────────────────────────────┘                   │
│   ↓                                                         │
│ Enter assumptions WITHIN UNLOCKED RANGES ← ENFORCED         │
│   ↓                                                         │
│ Calculate metrics                                          │
│   ↓                                                         │
│ ┌──────────────────────────────────────┐                   │
│ │ GATE: Diligence + threshold check    │                   │
│ │                                      │                   │
│ │ IF missing required diligence:      │                   │
│ │   → Block commit                    │                   │
│ │                                      │                   │
│ │ IF metrics below threshold:         │                   │
│ │   → Block commit                    │                   │
│ │                                      │                   │
│ │ ELSE: Allow commit ✓                │                   │
│ └──────────────────────────────────────┘                   │
│                                                             │
│ ENFORCED: Diligence required ✓                             │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│ EXECUTION                                                    │
│                                                             │
│ Flip timeline completes                                     │
│   ↓                                                         │
│ ┌──────────────────────────────────────┐                   │
│ │ GROUND TRUTH RESOLUTION              │                   │
│ │                                      │                   │
│ │ Load property actual ranges         │                   │
│ │ Calculate variance based on         │                   │
│ │   diligence quality                 │                   │
│ │ Resolve actual ARV                  │                   │
│ │ Resolve actual rehab cost           │                   │
│ │ Resolve actual timeline             │                   │
│ │                                      │                   │
│ │ Compare to player assumptions       │                   │
│ │ Calculate assumption errors         │                   │
│ └──────────────────────────────────────┘                   │
│   ↓                                                         │
│ Apply curveball (if any)                                   │
│   ↓                                                         │
│ Calculate profit using ACTUALS ← NOT ASSUMPTIONS            │
│   ↓                                                         │
│ ┌──────────────────────────────────────┐                   │
│ │ POSTMORTEM                           │                   │
│ │                                      │                   │
│ │ Show:                                │                   │
│ │ • Assumed ARV vs Actual ARV         │                   │
│ │ • Assumed Rehab vs Actual Rehab     │                   │
│ │ • Error magnitude                   │                   │
│ │ • Lesson: "Comp analysis would      │                   │
│ │   have revealed ARV was $15K lower" │                   │
│ └──────────────────────────────────────┘                   │
│                                                             │
│ ENFORCED: Assumptions tested ✓                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary Table

| Issue | Severity | Impact | Effort | Priority |
|-------|----------|--------|--------|----------|
| Pro forma calc bypasses diligence | 🔴 Critical | Breaks learning loop | Medium | P0 |
| Deal commit without diligence validation | 🔴 Critical | Diligence optional | Low | P0 |
| Execution uses player assumptions | 🔴 Critical | No consequences | High | P0 |
| Inputs not constrained to ranges | 🔴 Critical | Undermines data | Medium | P0 |
| Issues don't auto-update budget | 🟡 Moderate | Weak enforcement | Low | P1 |
| Curveballs ignore diligence quality | 🟡 Moderate | Missed causality | Medium | P1 |
| Rental income uses assumptions | 🟡 Moderate | No reality check | Medium | P1 |
| Contractor choice non-functional | 🟡 Moderate | Dead feature | Low | P2 |
| Make Offer button dead-end | 🟡 Moderate | Confusing UX | Trivial | P2 |
| Week advance after game end | 🟢 Minor | Edge case | Trivial | P3 |
| Diligence after deal commit | 🟢 Minor | Sequence break | Low | P3 |

---

## Final Recommendations

### Immediate Actions (P0)

1. **Gate pro forma behind required diligence**
   - Disable inputs for unknown values
   - Block calculation until diligence purchased
   - Show clear "unlock" path

2. **Add diligence validation at commit**
   - Check `completedDiligence` includes required types
   - Error message with specific missing items

3. **Implement ground truth system** (This is the big one)
   - Store property actuals separately
   - Resolve assumptions vs actuals at execution
   - Show postmortem with errors and lessons

4. **Enforce input constraints**
   - Hard min/max on all numeric inputs
   - Server-side validation
   - Visual feedback when out of bounds

**Timeline:** These 4 changes transform the game from "diligence is cosmetic" to "diligence is essential."

### Follow-up Actions (P1)

5. **Auto-include discovered issue costs**
6. **Link diligence to curveball probabilities**
7. **Resolve rental income against actuals**

**Impact:** Strengthens causal loops, adds replayability

### Polish (P2-P3)

8. **Remove non-functional UI elements**
9. **Add state transition guards**

**Impact:** Cleaner, more professional feel

---

## Conclusion

Dealbreak has **excellent bones** - the state management infrastructure, time progression, and resource tracking are solid. The core issue is that **the system is too permissive**. It allows players to succeed without engaging with the educational loop.

By implementing the P0 recommendations, you'll create a tight, deterministic system where:
- **Every choice has traceable consequences**
- **Information must be earned to be used**
- **Assumptions are tested against reality**
- **Diligence quality affects outcomes**

This transforms the game from a calculator with random events into a **genuine learning simulation** where poor decisions lead to losses and thorough analysis leads to wins - **deterministically**.

The system will teach real estate investing through **experienced consequences**, not just information delivery. That's powerful educational design.
