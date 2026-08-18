---
name: Deal integer columns vs client pro forma floats
description: Client-computed proFormaOutputs contain fractional dollars; writing them to integer Postgres columns aborts purchases after cash is deducted.
---

The deals table (and ledger/game_runs cash fields) use integer columns, but the client's pro forma math produces fractional values (e.g. loanAmount = price * 0.75 = 133927.5). Writing those raw values fails with Postgres `invalid input syntax for type integer` — and because the purchase flow deducts cash (ledger) BEFORE activating the deal, the player loses money with no property.

**Why:** Real incident (Aug 2026): every purchase with a fractional loan amount failed at activate-rental after the down payment was taken. Fixed with `sanitizeDealIntegers` in `DBStorage` (rounds known integer deal fields in createDeal/updateDeal and the raw sale/refinance/restore writes).

**How to apply:** Any new write path to deals/ledger/game_runs that takes values derived from proFormaOutputs must round to integers first — or better, route through storage createDeal/updateDeal so the sanitizer covers it. Ideally the whole purchase (deal + ledger + activation) would be one server-side transaction; today it's three client-sequenced calls with no rollback.
