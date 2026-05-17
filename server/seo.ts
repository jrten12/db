import type { Request } from "express";
import fs from "fs";
import path from "path";

let hashedAssetCache: Record<string, string> = {};
let assetCacheLoaded = false;

function resolveHashedAsset(prefix: string, ext: string): string | null {
  if (!assetCacheLoaded) {
    const dir = typeof import.meta.dirname === 'string' ? import.meta.dirname : process.cwd();
    const candidates = [
      path.resolve(dir, "public", "assets"),
      path.resolve(process.cwd(), "dist", "public", "assets"),
    ];
    try {
      for (const assetsDir of candidates) {
        if (fs.existsSync(assetsDir)) {
          const files = fs.readdirSync(assetsDir);
          for (const f of files) {
            hashedAssetCache[f] = f;
          }
          break;
        }
      }
    } catch {}
    assetCacheLoaded = true;
  }
  for (const name of Object.keys(hashedAssetCache)) {
    if (name.startsWith(prefix) && name.endsWith(ext)) {
      return name;
    }
  }
  return null;
}

interface PageMeta {
  title: string;
  description: string;
  ogType: string;
  canonical: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = "DealBreak Simulator";
const BASE_URL = "https://dealbreaksimulator.com";
const BASE_DESCRIPTION = "DealBreak Simulator is a realistic real estate investing simulator game where players analyze property deals, build pro formas, estimate rehab costs, and decide whether an investment succeeds or fails.";

interface ArticleEntry {
  title: string;
  subtitle: string;
  category: string;
  readTime: string;
  difficulty: string;
  keywords: string[];
  datePublished: string;
  dateModified: string;
  relatedSlugs: string[];
  sections: { heading: string; content: string }[];
}

const ARTICLE_DATA: Record<string, ArticleEntry> = {
  "what-is-a-pro-forma": {
    title: "What Is a Pro Forma in Real Estate?",
    subtitle: "The one document that separates amateurs from professionals",
    category: "Fundamentals",
    readTime: "5 min",
    difficulty: "Beginner",
    datePublished: "2025-06-15",
    dateModified: "2026-03-20",
    keywords: ["real estate pro forma", "property financial analysis", "investment spreadsheet", "NOI calculation", "real estate underwriting"],
    relatedSlugs: ["cap-rates-cash-on-cash", "hidden-costs", "one-percent-rule"],
    sections: [
      { heading: "Your Deal's Truth Serum", content: "The spreadsheet is more important than the property. A gorgeous Victorian can bankrupt you if the numbers don't work. The pro forma strips away emotional appeal and reveals whether a property actually makes money." },
      { heading: "The Anatomy of a Pro Forma", content: "Every pro forma has two sides — income vs. expenses. Gross rental income, vacancy loss, property taxes, insurance, maintenance reserves, and net operating income. Once you have NOI, you can calculate key metrics like <a href='/learn/cap-rates-cash-on-cash'>cap rates and cash-on-cash returns</a>." },
      { heading: "Why Your Assumptions Will Make or Break You", content: "The skill is knowing whether your inputs reflect reality. Bad vacancy or maintenance assumptions can flip a profitable deal into a cash drain. Many beginners miss <a href='/learn/hidden-costs'>hidden costs</a> that represent 30-40% of gross rental income." },
      { heading: "Flip Pro Forma vs. Rental Pro Forma", content: "Rental pro formas model ongoing cash flow. Flip pro formas model a single transaction: purchase price plus renovation costs vs. sale price." },
      { heading: "The Break-Even Occupancy Rate", content: "The percentage of the year your property needs to be rented just to cover costs. If it's 97%, one missed rent payment puts you underwater. Use <a href='/learn/one-percent-rule'>quick screening filters</a> to identify deals that have a healthy margin before building a full pro forma." }
    ]
  },
  "cap-rates-cash-on-cash": {
    title: "Cap Rates & Cash-on-Cash Returns: The Real Story",
    subtitle: "Two numbers that tell you completely different things about the same deal",
    category: "Financial Metrics",
    readTime: "6 min",
    difficulty: "Beginner",
    datePublished: "2025-06-22",
    dateModified: "2026-03-20",
    keywords: ["cap rate real estate", "cash on cash return", "real estate ROI", "property investment returns", "capitalization rate formula"],
    relatedSlugs: ["what-is-a-pro-forma", "one-percent-rule", "ltv-financing"],
    sections: [
      { heading: "The Metric That Ignores Your Wallet", content: "Cap rate doesn't care how you pay. Formula: NOI / Property Value. Perfect for comparing properties of wildly different sizes and prices. NOI comes from your <a href='/learn/what-is-a-pro-forma'>pro forma analysis</a>." },
      { heading: "The Cap Rate Spectrum", content: "3-4% in premium areas (appreciation play), 5-6% in solid neighborhoods, 7-8% sweet spot, 9-10% higher risk, 11%+ distressed areas." },
      { heading: "Cash-on-Cash: What YOUR Money Earns", content: "Annual Pre-Tax Cash Flow / Total Cash Invested. A 7% cap rate deal can deliver 14% CoC return with smart financing. How much leverage you use — your <a href='/learn/ltv-financing'>LTV ratio</a> — dramatically changes this number." },
      { heading: "The Inverse Dance", content: "When investors pile into a market, prices rise and cap rates compress. Rapidly compressing cap rates are a warning sign." },
      { heading: "Yield on Cost", content: "For value-add investors: projected NOI after improvements / total cost. How professionals find deals in competitive markets. Pair this with <a href='/learn/one-percent-rule'>quick screening filters</a> to evaluate deals faster." }
    ]
  },
  "flip-vs-rent": {
    title: "Flip vs. Rent: The Strategy Decision That Changes Everything",
    subtitle: "One makes you money fast. The other makes you money forever. Pick wrong and neither works.",
    category: "Strategy",
    readTime: "7 min",
    difficulty: "Beginner",
    datePublished: "2025-07-01",
    dateModified: "2026-03-20",
    keywords: ["flip or rent property", "real estate strategy", "house flipping vs rental", "buy and hold vs flip", "real estate investment strategy"],
    relatedSlugs: ["rehab-budgets", "market-conditions", "tenant-management"],
    sections: [
      { heading: "The Adrenaline Play: Flipping", content: "Buy, improve, sell within 3-6 months. A single flip can net $30K-$80K. But profit depends on renovation costs, timeline, and sale price — three variables you can't fully control. Understanding <a href='/learn/rehab-budgets'>rehab budgets</a> is critical for flip success." },
      { heading: "The Wealth Engine: Renting", content: "Three simultaneous income streams: monthly cash flow, appreciation, and equity buildup. Over 20 years, one rental can generate more wealth than a dozen flips. Good <a href='/learn/tenant-management'>tenant management</a> is essential for rental success." },
      { heading: "Head-to-Head Comparison", content: "Time to profit, risk level, income type, capital needed, market sensitivity, and tax treatment all differ dramatically between strategies." },
      { heading: "When the Market Picks for You", content: "Flip in hot markets, buy rentals in cold ones. Rising markets inflate flip margins; uncertain markets favor rental patience. Read more about <a href='/learn/market-conditions'>how to read market conditions</a>." },
      { heading: "The BRRRR Strategy", content: "Buy, Rehab, Rent, Refinance, Repeat — combines flipping's value-add with rental's long-term wealth while recycling investment capital." }
    ]
  },
  "due-diligence": {
    title: "Due Diligence: The $500 That Saves You $50,000",
    subtitle: "Why the smartest investors spend money BEFORE they make money",
    category: "Process",
    readTime: "6 min",
    difficulty: "Beginner",
    datePublished: "2025-07-10",
    dateModified: "2026-03-20",
    keywords: ["real estate due diligence", "property inspection", "title search real estate", "home inspection investment", "real estate appraisal"],
    relatedSlugs: ["hidden-costs", "common-mistakes", "rehab-budgets"],
    sections: [
      { heading: "The Inspection That Pays for Itself 100x Over", content: "A $300-$500 inspection vs. a $30,000+ foundation repair. Every one of these is common in investment properties priced below market. Skipping due diligence is one of <a href='/learn/common-mistakes'>the top mistakes that bankrupt new investors</a>." },
      { heading: "Due Diligence Types", content: "Property inspection catches structural/mechanical issues. Title search reveals liens and disputes. Appraisal validates market value. Market study estimates realistic rent and sale prices." },
      { heading: "Title Searches: The Invisible Landmines", content: "Unpaid tax liens, mechanic's liens, easements, boundary disputes — all transfer to YOU when you buy." },
      { heading: "Comparable Sales Analysis", content: "Analyzing closed sales within a half-mile that match your property's characteristics. Adjusting for differences in condition, size, and lot." },
      { heading: "The Skip-and-Pray Strategy", content: "Properties priced low often have problems. The seller knows. They priced it to attract buyers who won't look closely. Factor in potential <a href='/learn/hidden-costs'>hidden costs</a> and <a href='/learn/rehab-budgets'>rehab budget overruns</a> when evaluating below-market deals." }
    ]
  },
  "ltv-financing": {
    title: "LTV & Financing: The Double-Edged Sword of Leverage",
    subtitle: "How borrowing money can make you rich — or bankrupt you overnight",
    category: "Financing",
    readTime: "6 min",
    difficulty: "Intermediate",
    datePublished: "2025-07-18",
    dateModified: "2026-03-18",
    keywords: ["loan to value ratio", "real estate leverage", "LTV mortgage", "real estate financing", "investment property loan"],
    relatedSlugs: ["cap-rates-cash-on-cash", "common-mistakes", "survive-market-crash"],
    sections: [
      { heading: "Leverage: The Amplifier", content: "80% LTV means a 10% property appreciation gives you 50% return on your investment. But a 10% drop cuts your equity in half. This is why leverage changes your <a href='/learn/cap-rates-cash-on-cash'>cash-on-cash return</a> so dramatically." },
      { heading: "The Danger Zone", content: "Interest rates accelerate above 90% LTV. Tiny equity, massive payments, one bad month from trouble. This is one of the key <a href='/learn/common-mistakes'>mistakes that bankrupt new investors</a>." },
      { heading: "The Math That Changes Strategy", content: "Two investors, same property: 30% down at 6.5% vs 10% down at 9% = $563/month difference, $6,756/year extra cost." },
      { heading: "Matching Financing to Strategy", content: "Flips optimize for total loan cost over hold period. Rentals optimize for monthly cash flow with lower rates." },
      { heading: "The Refinancing Power Move", content: "Buy with higher leverage, improve the property, refinance at better terms based on the new appraised value. Understanding how to <a href='/learn/survive-market-crash'>position your portfolio for downturns</a> means keeping leverage conservative." }
    ]
  },
  "market-conditions": {
    title: "Reading Market Conditions Like a Pro",
    subtitle: "The cyclical patterns that determine when to buy, when to sell, and when to wait",
    category: "Strategy",
    readTime: "6 min",
    difficulty: "Intermediate",
    datePublished: "2025-08-01",
    dateModified: "2026-03-18",
    keywords: ["real estate market cycle", "property market conditions", "when to buy real estate", "real estate timing", "housing market analysis"],
    relatedSlugs: ["survive-market-crash", "flip-vs-rent", "portfolio-strategy"],
    sections: [
      { heading: "The Four Seasons of Real Estate", content: "Recovery, Expansion, Hyper-Supply, Recession — markets follow 7-18 year cycles. The biggest mistake is buying at peak expansion. Learn how to <a href='/learn/survive-market-crash'>survive and profit from market crashes</a>." },
      { heading: "Strategy Performance by Market", content: "Hot markets favor quick flips but compress margins. Cold markets offer cheap entry but higher vacancy risk. Recovery periods offer the best buying. Your <a href='/learn/flip-vs-rent'>flip vs. rent decision</a> should be informed by current conditions." },
      { heading: "It's Not About National Headlines", content: "Focus on local indicators: Days on Market, Months of Inventory, Rental Vacancy Rate, and Job Growth." },
      { heading: "The Contrarian Edge", content: "During 2009-2012 recovery, investors who bought at 50 cents on the dollar built generational wealth. Direction matters more than timing precision." },
      { heading: "Building Permits as Leading Indicator", content: "A surge in permits means new supply in 12-18 months. A drop means future supply constraints that push prices up. Think about this when <a href='/learn/portfolio-strategy'>building your portfolio strategy</a>." }
    ]
  },
  "rehab-budgets": {
    title: "Rehab Budgets: Where Deals Go to Die (or Thrive)",
    subtitle: "How to plan renovations that actually add value — and avoid the money pit",
    category: "Operations",
    readTime: "6 min",
    difficulty: "Intermediate",
    datePublished: "2025-08-12",
    dateModified: "2026-03-18",
    keywords: ["rehab budget real estate", "renovation costs investment property", "house flip renovation", "contractor management", "property renovation planning"],
    relatedSlugs: ["flip-vs-rent", "hidden-costs", "due-diligence"],
    sections: [
      { heading: "The Budget That Always Lies", content: "Your initial rehab budget is wrong. Always. Add a 15-20% contingency buffer for hidden water damage, outdated wiring, and plumbing surprises. Thorough <a href='/learn/due-diligence'>due diligence</a> helps you uncover these issues before closing." },
      { heading: "Common Renovation Cost Ranges", content: "Kitchen $10K-$40K+, Bathroom $5K-$20K, Roof $8K-$25K, HVAC $5K-$15K, Cosmetic $3K-$8K, Paint+Flooring $2K-$6K." },
      { heading: "Picking Your Contractor", content: "Budget, Standard, and Premium tiers. A premium contractor who finishes 6 weeks earlier might actually be cheaper due to reduced holding costs. These are part of the <a href='/learn/hidden-costs'>hidden costs</a> many new investors miss." },
      { heading: "The No-Rehab Flip", content: "Target properties where the previous owner already improved but needs to sell quickly. Smaller margins, zero construction risk. Learn more about the <a href='/learn/flip-vs-rent'>flip vs. rent strategy decision</a>." },
      { heading: "Cash vs. Finance Decision", content: "Paying cash for rehab keeps your loan smaller. Financing preserves cash reserves. Never finance rehab above 90% LTV." }
    ]
  },
  "common-mistakes": {
    title: "The 5 Mistakes That Bankrupt New Investors",
    subtitle: "Every one of these looks reasonable until it costs you everything",
    category: "Risk Management",
    readTime: "7 min",
    difficulty: "Beginner",
    datePublished: "2025-08-20",
    dateModified: "2026-03-18",
    keywords: ["real estate investment mistakes", "beginner investor errors", "real estate bankruptcy", "property investment risks", "overleveraging real estate"],
    relatedSlugs: ["due-diligence", "hidden-costs", "ltv-financing"],
    sections: [
      { heading: "The Fantasy Rent Number", content: "Rental rates should be based on what similar properties are actually renting for RIGHT NOW — not aspirational listings sitting vacant for 3 months." },
      { heading: "The Invisible Expenses", content: "Beyond mortgage+taxes+insurance: maintenance reserves, management fees, capex reserves, landscaping, pest control, legal, accounting. See our full breakdown of <a href='/learn/hidden-costs'>the hidden costs nobody tells you about</a>." },
      { heading: "The Leverage Trap", content: "70% LTV survives a 20% drop. 90% LTV goes underwater with just a 10% drop. 95% LTV is destroyed by a 5% decline. Understand <a href='/learn/ltv-financing'>how LTV works</a> before choosing your financing." },
      { heading: "Speed Over Safety", content: "Urgency is almost always manufactured. The properties that look like the best deals are often priced low because they have problems. Always complete your <a href='/learn/due-diligence'>due diligence</a> before committing." },
      { heading: "Running on Empty", content: "Without cash reserves, any common scenario forces a distressed sale. Keep 3-6 months of expenses per property in reserve." }
    ]
  },
  "one-percent-rule": {
    title: "The 1% Rule and Other Quick Screening Filters",
    subtitle: "How to evaluate 50 properties in an hour without a spreadsheet",
    category: "Advanced Strategy",
    readTime: "5 min",
    difficulty: "Intermediate",
    datePublished: "2025-09-01",
    dateModified: "2026-03-15",
    keywords: ["1 percent rule real estate", "property screening filters", "quick property analysis", "50 percent rule", "real estate rules of thumb"],
    relatedSlugs: ["what-is-a-pro-forma", "cap-rates-cash-on-cash", "common-mistakes"],
    sections: [
      { heading: "Why You Need a Filter", content: "You can't build a detailed <a href='/learn/what-is-a-pro-forma'>pro forma</a> for every property. Quick filters eliminate properties that have no chance of working." },
      { heading: "The Quick-Filter Toolkit", content: "1% Rule (rent ≥ 1% of price), 50% Rule (half of rent goes to expenses), 70% Rule for flips (≤70% of ARV minus repairs), 2% Rule (unusually strong if rent exceeds 2%)." },
      { heading: "When Rules of Thumb Fail", content: "Expensive coastal cities rarely pass the 1% test but still cash flow. Cheap rural markets always pass but have high vacancy." },
      { heading: "Building Your Personal Filter Stack", content: "Layer filters: price range, neighborhoods, property types, bed/bath counts. Goal is to eliminate 90% of listings quickly. For deals that pass, calculate <a href='/learn/cap-rates-cash-on-cash'>cap rate and cash-on-cash return</a> to dig deeper. Watch out for <a href='/learn/common-mistakes'>common mistakes</a> that trip up beginners." }
    ]
  },
  "survive-market-crash": {
    title: "How to Survive (and Profit From) a Market Crash",
    subtitle: "What separates investors who go bankrupt from those who build empires during downturns",
    category: "Advanced Strategy",
    readTime: "7 min",
    difficulty: "Advanced",
    datePublished: "2025-09-15",
    dateModified: "2026-03-15",
    keywords: ["survive real estate crash", "real estate downturn strategy", "recession proof investing", "buy during market crash", "real estate market crash"],
    relatedSlugs: ["market-conditions", "ltv-financing", "portfolio-strategy"],
    sections: [
      { heading: "The Crash Is Coming", content: "Since 1900, significant downturns roughly every 15-20 years. The question isn't whether but whether you're positioned to survive it. Understanding <a href='/learn/market-conditions'>market cycles</a> helps you see it coming." },
      { heading: "The Bankruptcy Cascade", content: "Market drops → values below loans → rents soften → cash flow negative → reserves drain → forced sales at losses." },
      { heading: "The Crash-Proof Portfolio", content: "Low leverage (70-80% LTV), strong cash reserves (6+ months per property), positive cash flow even if rent drops 10%. Keep your <a href='/learn/ltv-financing'>LTV conservative</a> to survive downturns." },
      { heading: "Profiting During Panic", content: "During downturns, prices drop 30-50% below replacement cost. Properties that never cash flow at peak suddenly generate 12%+ cap rates." },
      { heading: "Recession Indicators", content: "Inverted yield curve, rising delinquency rates, construction exceeding absorption, rapidly compressing cap rates. Build a diversified <a href='/learn/portfolio-strategy'>portfolio strategy</a> before the crash hits." }
    ]
  },
  "hidden-costs": {
    title: "The Hidden Costs Nobody Tells You About",
    subtitle: "14 expenses that don't show up in the listing — but definitely show up on your bank statement",
    category: "Financial Metrics",
    readTime: "6 min",
    difficulty: "Intermediate",
    datePublished: "2025-10-01",
    dateModified: "2026-03-15",
    keywords: ["hidden costs real estate", "true cost property investment", "real estate expenses", "investment property costs", "landlord expenses"],
    relatedSlugs: ["what-is-a-pro-forma", "common-mistakes", "tenant-management"],
    sections: [
      { heading: "The Costs You See and the 10 You Don't", content: "Below the obvious costs lurk expenses representing 30-40% of gross rental income. Missing even a few flips a profitable deal into a money pit. Your <a href='/learn/what-is-a-pro-forma'>pro forma</a> needs to capture all of them." },
      { heading: "The Full Expense Stack", content: "Maintenance, capital expenditures, property management, vacancy loss, closing costs, legal/accounting, pest control, landscaping." },
      { heading: "The Expense That Eats Flippers Alive", content: "Holding costs: mortgage interest, taxes, insurance, utilities per month. A flip stretching 3 extra months costs $5,700+ straight from profit." },
      { heading: "The Self-Management Illusion", content: "Midnight plumbing emergencies, tenant showings, eviction research. Budget 5% of rent as self-management fee minimum. See our guide on <a href='/learn/tenant-management'>tenant management</a> for more." },
      { heading: "Tax Implications", content: "Rental depreciation and interest deductions are good. Flips taxed as ordinary income (30%+) vs. capital gains (15-20%) is bad. These are among the <a href='/learn/common-mistakes'>mistakes</a> that catch beginners off guard." }
    ]
  },
  "portfolio-strategy": {
    title: "Building a Real Estate Portfolio: From One Property to Ten",
    subtitle: "The compounding strategy that turns a single deal into generational wealth",
    category: "Advanced Strategy",
    readTime: "8 min",
    difficulty: "Advanced",
    datePublished: "2025-10-15",
    dateModified: "2026-03-15",
    keywords: ["real estate portfolio strategy", "multiple investment properties", "scaling real estate", "BRRRR strategy", "real estate wealth building"],
    relatedSlugs: ["flip-vs-rent", "survive-market-crash", "market-conditions"],
    sections: [
      { heading: "The Portfolio Mindset Shift", content: "Deal-by-deal vs. systems thinking. How does each property fit the portfolio? Does it diversify risk? Does it fund the next acquisition? Understanding <a href='/learn/flip-vs-rent'>when to flip vs. rent</a> drives portfolio composition." },
      { heading: "The Wealth Compounding Cycle", content: "Acquire → Improve → Refinance → Repeat. Each cycle pulls equity out and redeploys into the next property." },
      { heading: "Diversification", content: "Mix property types, locations, strategies, and price points. When one market segment struggles, others carry the portfolio." },
      { heading: "The Cash Flow Tipping Point", content: "At 3-4 stabilized rentals, combined cash flow covers personal expenses. Financial independence from your day job." },
      { heading: "Capital Recycling", content: "Selling underperformers and redeploying equity into better markets. Don't fall in love with properties — fall in love with returns. Know how to <a href='/learn/survive-market-crash'>survive a market crash</a> and <a href='/learn/market-conditions'>read market conditions</a> to time your moves." }
    ]
  },
  "cap-rate-vs-cash-on-cash-math": {
    title: "The Hidden Math of Cap Rate vs Cash-on-Cash",
    subtitle: "Same property, two metrics, two completely different stories.",
    category: "Financial Metrics",
    readTime: "7 min",
    difficulty: "Intermediate",
    datePublished: "2026-05-17",
    dateModified: "2026-05-17",
    keywords: ["cap rate vs cash on cash", "real estate metrics explained", "leverage cash on cash return", "cap rate formula", "real estate underwriting metrics"],
    relatedSlugs: ["cap-rates-cash-on-cash", "ltv-financing", "what-is-a-pro-forma"],
    sections: [
      { heading: "The Same Building, Two Different Truths", content: "A $500K fourplex with $30K NOI is a 6% cap rate deal to one investor and a 14% cash-on-cash deal to another. Cap rate measures the asset. Cash-on-cash measures what happened to your wallet." },
      { heading: "Why Cap Rate Doesn't Care About Your Loan", content: "NOI divided by purchase price. Strips out financing noise so you can compare a $300K duplex against a $1.2M apartment on equal footing. The sanity check on whether the underlying real estate is actually a better asset." },
      { heading: "Cash-on-Cash: Where Leverage Sneaks In", content: "All cash gets you a 6% return that equals the cap rate. 25% down nudges it to 10%. 10% down can push to 22% — or negative, depending on rates. Same building, different financing, completely different returns." },
      { heading: "The Trap Nobody Warns Beginners About", content: "An 18% cash-on-cash deal at 90% LTV flips to negative the month a HVAC compressor fails or insurance renews 35% higher. Pros stress-test cash-on-cash against vacancy, rate hikes, and surprise repairs before they sign." },
      { heading: "Calculate Both, Always", content: "A 9% cap rate with a 4% cash-on-cash is a warning — financing is eating your returns. A 5% cap rate with 14% cash-on-cash means you're dependent on cheap debt. The two numbers together tell the deal's full story." }
    ]
  },
  "why-first-time-flippers-lose": {
    title: "Why Most First-Time Flippers Lose Money",
    subtitle: "An honest postmortem of the seven habits that kill rookie flips.",
    category: "Strategy",
    readTime: "8 min",
    difficulty: "Intermediate",
    datePublished: "2026-05-17",
    dateModified: "2026-05-17",
    keywords: ["why do flippers lose money", "house flipping mistakes", "first time flip lessons", "ARV mistakes", "fix and flip risks"],
    relatedSlugs: ["flip-vs-rent", "due-diligence", "common-mistakes"],
    sections: [
      { heading: "The Industry Doesn't Talk About the Losers", content: "Median first-time flippers lose money after honest accounting — labor they didn't pay themselves for, carrying costs they forgot, ARVs they convinced themselves were real. The math isn't broken. The discipline is." },
      { heading: "ARV Anchoring", content: "Beginners pull three comps, pick the highest, and call it the ARV. Pros pull twelve, throw out the extremes, adjust for differences, then shave 5%. The gap is often the entire deal margin." },
      { heading: "The Rehab Number You Wanted to Hear", content: "First-time flippers underbid rehab by 30-40%. Not because contractors lied — because the bid covered specified work, not what the house actually needed. Take the contractor's number, add 20% for unseen, add 10% more for unknowable." },
      { heading: "Carrying Costs Are Real Money", content: "A $350K flip carries $3K-5K/month in mortgage, taxes, insurance, utilities, HOA. Nine months of slippage vaporizes $35K from a deal with thin margins. The clock is the second-largest enemy after optimism." },
      { heading: "DIY Math Looks Beautiful, Plays Brutal", content: "A pro tile setter does in two days what takes you three weekends. Those weekends are more carrying costs. The opportunity cost of DIY is the months you accumulate going slower than someone whose job it is." },
      { heading: "The Discipline That Separates Pros", content: "Professional flippers underwrite 50-100 deals to buy one. They have a maximum allowable offer formula — 70% of ARV minus rehab — and they don't negotiate it upward because they love the property." }
    ]
  },
  "inspection-red-flags-30-seconds": {
    title: "Reading a Property: 7 Inspection Red Flags Pros Spot in 30 Seconds",
    subtitle: "What experienced investors notice on the first walkthrough that beginners miss completely.",
    category: "Risk Management",
    readTime: "7 min",
    difficulty: "Intermediate",
    datePublished: "2026-05-17",
    dateModified: "2026-05-17",
    keywords: ["house inspection red flags", "first walkthrough checklist", "Federal Pacific panel", "Zinsco breaker", "foundation crack patterns", "galvanized plumbing signs"],
    relatedSlugs: ["due-diligence", "hidden-costs", "common-mistakes"],
    sections: [
      { heading: "Pros Walk a House Differently", content: "Experienced investors barely look at kitchen finishes. They scan floors for slope, ceilings for stain rings, baseboards for moisture line, and the electrical panel brand. Cheap-to-fix things scream while expensive things whisper." },
      { heading: "The Electrical Panel Brand", content: "Federal Pacific Electric (Stab-Lok) and Zinsco panels have decades of failure history. Insurance carriers increasingly refuse coverage. Budget $2,500-5,000 for full panel swap and add it to your offer math." },
      { heading: "The Basement Smell", content: "Faint mustiness means humidity. A real damp earthy scent means active water intrusion. Look for efflorescence on block walls, rust on metal supports, and the paint tide line on wood framing." },
      { heading: "Foundation Crack Patterns", content: "Hairline vertical cracks are normal settling. Diagonal at corners means differential settlement — get an engineer. Horizontal across a wall means lateral pressure failure — major structural. Stair-step in block that's widening means active movement." },
      { heading: "Granules in the Gutters", content: "Asphalt sand-like granules in the gutter mean the roof is shedding its protective coating. Combined with bald or curled shingles, that roof has 1-3 years left. New roof needed that you didn't budget for is the problem." },
      { heading: "The Marble Test", content: "Set a marble on hardwood and watch. Slow drift is normal old-house settling. Picking up speed means joist sag, foundation movement, or termite damage. Then check the doors — if they don't close cleanly, two stories that match deserve an engineer." },
      { heading: "Galvanized Plumbing and HVAC Age", content: "Galvanized supply lines last 50-70 years and need full repipe ($8K-20K). HVAC over 12 years is on borrowed time; over 18 should be priced as 'replace this year' ($8K-15K)." }
    ]
  },
  "tenant-management": {
    title: "Tenant Management: The Human Side of Real Estate",
    subtitle: "Good tenants make you money. Bad tenants make you question your life choices.",
    category: "Operations",
    readTime: "6 min",
    difficulty: "Intermediate",
    datePublished: "2025-11-01",
    dateModified: "2026-03-20",
    keywords: ["tenant management", "landlord tips", "tenant screening", "rental property management", "dealing with tenants"],
    relatedSlugs: ["hidden-costs", "flip-vs-rent", "common-mistakes"],
    sections: [
      { heading: "The Screening Mistake That Costs Thousands", content: "A bad tenant costs 10x more than a month of vacancy. Between unpaid rent, damage, and legal fees — one bad placement costs $10K-$20K. This is one of the <a href='/learn/hidden-costs'>hidden costs</a> that can destroy a deal." },
      { heading: "The Communication Playbook", content: "Friendly but firm, responsive but boundaried. Respond within 24 hours. Document everything. Address late payments immediately." },
      { heading: "The Maintenance Balance", content: "Clean, safe, functional — not luxury. Maintain big-ticket items preventatively. A $200 HVAC tune-up prevents a $10,000 replacement." },
      { heading: "When to Raise Rent", content: "Keep good tenants at slightly below-market rent. Turnover costs 1-2 months vacancy plus $500-2,000 in repairs. Raise 2-3% annually, stay 5-10% below market. Consider the <a href='/learn/flip-vs-rent'>flip vs. rent trade-offs</a> and whether long-term renting still fits your <a href='/learn/common-mistakes'>risk profile</a>." }
    ]
  }
};

const FAQ_DATA = [
  { question: "Is Dealbreak free to play?", answer: "Yes. The full game is free to play with no signup required. Optional premium boosts are available for players who want extra cash or time, but they're never required to win." },
  { question: "Will this teach me real estate investing?", answer: "Dealbreak teaches the analytical framework that professional investors use — pro forma modeling, cap rate analysis, due diligence, and risk assessment. While it's a simulation and not financial advice, the skills transfer directly to evaluating real deals." },
  { question: "How long does a game take?", answer: "A typical game takes 20-40 minutes. You manage a 52-month timeline, evaluating properties, running numbers, and executing deals. Each playthrough is different thanks to randomized properties, market conditions, and events." },
  { question: "What strategies can I use?", answer: "You can flip properties (buy, renovate, sell for profit) or rent them out (buy, hold, collect monthly income). Each strategy has different risk-reward profiles, and the best players learn to mix both depending on market conditions and their financial position." }
];

const ALLOWED_HOSTS = new Set(["dealbreaksimulator.com", "www.dealbreaksimulator.com"]);

function getBaseUrl(req: Request): string {
  const rawHost = (req.headers["x-forwarded-host"] || req.headers.host || "") as string;
  const hostname = rawHost.split(":")[0];

  if (process.env.NODE_ENV === "production" && !ALLOWED_HOSTS.has(hostname)) {
    return BASE_URL;
  }

  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  return `${proto}://${rawHost || "dealbreaksimulator.com"}`;
}

function getPageMeta(url: string, req: Request): PageMeta {
  const baseUrl = getBaseUrl(req);
  const path = url.split("?")[0].split("#")[0];

  if (path === "/" || path === "") {
    return {
      title: "DealBreak Simulator – Real Estate Investing Simulator Game",
      description: BASE_DESCRIPTION,
      ogType: "website",
      canonical: baseUrl + "/",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": SITE_NAME,
          "url": baseUrl,
          "description": BASE_DESCRIPTION,
          "inLanguage": "en-US",
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": baseUrl + "/learn?q={search_term_string}"
            },
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "VideoGame",
          "name": "DealBreak Simulator",
          "genre": "Simulation",
          "applicationCategory": "Game",
          "description": "A real estate investing simulator game where players analyze property deals, build pro formas, estimate rehab costs, and decide whether an investment succeeds or fails.",
          "url": baseUrl,
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
          "author": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
          "publisher": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
          "screenshot": baseUrl + "/opengraph.jpg",
          "playMode": "SinglePlayer",
          "numberOfPlayers": { "@type": "QuantitativeValue", "value": 1 },
          "gamePlatform": ["Web Browser", "iOS"],
          "inLanguage": "en-US",
          "keywords": "real estate investing simulator, pro forma analysis, cap rate calculator, house flipping game, rental property game, real estate education"
        },
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "DealBreak Simulator",
          "url": baseUrl,
          "description": "An educational real estate investing simulator game that teaches pro forma analysis, cap rates, financing, and deal evaluation through interactive gameplay.",
          "applicationCategory": "GameApplication",
          "genre": ["Simulation", "Educational"],
          "operatingSystem": "Web Browser",
          "browserRequirements": "Requires JavaScript. Works on all modern browsers.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
          "author": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
          "screenshot": baseUrl + "/opengraph.jpg",
          "featureList": ["Pro Forma Financial Analysis", "Cap Rate & Cash-on-Cash Calculations", "Flip vs Rent Strategy", "Due Diligence Simulation", "Market Conditions Modeling", "Rehab Budget Planning", "Tenant Management"],
          "softwareHelp": { "@type": "CreativeWork", "url": baseUrl + "/learn" }
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQ_DATA.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": { "@type": "Answer", "text": faq.answer }
          }))
        },
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "DealBreak Simulator",
          "operatingSystem": "iOS",
          "applicationCategory": "EducationApplication",
          "description": "A realistic real estate investing simulator for iOS. Analyze property deals, build pro formas, manage tenants, and learn investment strategies through interactive gameplay.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD", "availability": "https://schema.org/InStock" },
          "author": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
          "screenshot": baseUrl + "/opengraph.jpg",
          "softwareVersion": "1.0"
        }
      ]
    };
  }

  if (path === "/learn") {
    return {
      title: "Learn Real Estate Investing | " + SITE_NAME,
      description: "Free guides on real estate investing fundamentals. Learn about pro formas, cap rates, financing, due diligence, and investment strategies through interactive simulation.",
      ogType: "website",
      canonical: baseUrl + "/learn",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Real Estate Investing Learning Center",
          "description": "Free educational guides covering pro forma analysis, cap rates, financing, due diligence, and investment strategies for real estate.",
          "url": baseUrl + "/learn",
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl },
          "mainEntity": {
            "@type": "ItemList",
            "itemListElement": Object.entries(ARTICLE_DATA).map(([slug, article], i) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": baseUrl + "/learn/" + slug,
              "name": article.title
            }))
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Learning Center", "item": baseUrl + "/learn" }
          ]
        }
      ]
    };
  }

  const articleMatch = path.match(/^\/learn\/([a-z0-9-]+)$/);
  if (articleMatch) {
    const slug = articleMatch[1];
    const article = ARTICLE_DATA[slug];
    if (article) {
      const articleSchemas: Record<string, unknown>[] = [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": article.title,
          "description": article.subtitle,
          "url": baseUrl + "/learn/" + slug,
          "datePublished": article.datePublished,
          "dateModified": article.dateModified,
          "author": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
          "publisher": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl, "logo": { "@type": "ImageObject", "url": baseUrl + "/favicon-32.png" } },
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl },
          "image": baseUrl + "/opengraph.jpg",
          "inLanguage": "en-US",
          "articleSection": article.category,
          "timeRequired": "PT" + parseInt(article.readTime) + "M",
          "educationalLevel": article.difficulty,
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", ".article-subtitle", ".article-content p:first-of-type"]
          },
          "keywords": article.keywords.join(", "),
          "about": {
            "@type": "Thing",
            "name": "Real Estate Investing",
            "description": "Financial analysis and investment strategies for real estate properties"
          },
          "articleBody": article.sections.map(s => s.heading + ": " + s.content).join(" "),
          ...(article.relatedSlugs.length > 0 ? {
            "relatedLink": article.relatedSlugs
              .filter(rs => ARTICLE_DATA[rs])
              .map(rs => baseUrl + "/learn/" + rs)
          } : {})
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Learning Center", "item": baseUrl + "/learn" },
            { "@type": "ListItem", "position": 3, "name": article.title, "item": baseUrl + "/learn/" + slug }
          ]
        }
      ];

      if (slug === "due-diligence") {
        articleSchemas.push({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Conduct Due Diligence on an Investment Property",
          "description": "A step-by-step guide to the four types of due diligence every real estate investor should complete before buying a property.",
          "totalTime": "P7D",
          "estimatedCost": { "@type": "MonetaryAmount", "currency": "USD", "value": "1500" },
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Order a Property Inspection", "text": "Hire a licensed inspector ($300-$500) to examine structural, mechanical, and cosmetic issues. This catches foundation problems, roof damage, HVAC failures, plumbing issues, and electrical hazards before you buy." },
            { "@type": "HowToStep", "position": 2, "name": "Get an Appraisal", "text": "A licensed appraiser validates the property's market value independently. This confirms you're not overpaying and protects against inflated listing prices." },
            { "@type": "HowToStep", "position": 3, "name": "Run Comparable Sales Analysis", "text": "Analyze closed sales within a half-mile that match your property's characteristics. Adjust for differences in condition, square footage, and lot size to estimate true market value." },
            { "@type": "HowToStep", "position": 4, "name": "Conduct a Title Search", "text": "Search for unpaid tax liens, mechanic's liens, easements, and boundary disputes. All of these transfer to YOU when you buy the property." }
          ]
        });
      }

      if (slug === "what-is-a-pro-forma") {
        articleSchemas.push({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "How to Build a Real Estate Pro Forma",
          "description": "Step-by-step guide to creating a pro forma financial model for evaluating rental or flip investment properties.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Estimate Gross Rental Income", "text": "Research comparable rental properties in the area to determine realistic monthly rent. Use actual rented units, not aspirational listing prices." },
            { "@type": "HowToStep", "position": 2, "name": "Calculate Vacancy Loss", "text": "Deduct 5-10% of gross rent for expected vacancy periods between tenants. Higher vacancy rates apply in areas with more rental competition." },
            { "@type": "HowToStep", "position": 3, "name": "Add Up Operating Expenses", "text": "Include property taxes, insurance, maintenance reserves (5-10% of rent), property management fees (8-10%), and capital expenditure reserves." },
            { "@type": "HowToStep", "position": 4, "name": "Calculate Net Operating Income (NOI)", "text": "Subtract total operating expenses from effective gross income (rent minus vacancy). NOI is the property's income before financing costs." },
            { "@type": "HowToStep", "position": 5, "name": "Factor in Financing Costs", "text": "Subtract annual mortgage payments from NOI to get pre-tax cash flow. This is the actual money you pocket each year." },
            { "@type": "HowToStep", "position": 6, "name": "Calculate Return Metrics", "text": "Compute Cap Rate (NOI / Purchase Price) and Cash-on-Cash Return (Annual Cash Flow / Total Cash Invested) to evaluate the deal." }
          ]
        });
      }

      return {
        title: article.title + " | " + SITE_NAME,
        description: article.subtitle + ". Learn real estate investing concepts with Dealbreak's free educational guides.",
        ogType: "article",
        canonical: baseUrl + "/learn/" + slug,
        jsonLd: articleSchemas
      };
    }
  }

  if (path === "/what-is-dealbreak-simulator") {
    return {
      title: "What is DealBreak Simulator? | Real Estate Investing Simulator",
      description: "DealBreak Simulator is a free real estate investing simulator game where you analyze property deals, build pro formas, estimate rehab costs, and learn whether an investment succeeds or fails.",
      ogType: "article",
      canonical: baseUrl + "/what-is-dealbreak-simulator",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "What is DealBreak Simulator?",
          "description": "A free real estate investing simulator game where you analyze property deals, build pro formas, estimate rehab costs, and learn whether an investment succeeds or fails.",
          "url": baseUrl + "/what-is-dealbreak-simulator",
          "author": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
          "publisher": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl },
          "inLanguage": "en-US",
          "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": ["h1", "h2", ".about-intro"]
          },
          "about": {
            "@type": "VideoGame",
            "name": "DealBreak Simulator",
            "genre": "Simulation",
            "applicationCategory": "Game",
            "gamePlatform": ["Web Browser", "iOS"],
            "url": baseUrl,
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
          }
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "What is DealBreak Simulator?", "item": baseUrl + "/what-is-dealbreak-simulator" }
          ]
        }
      ]
    };
  }

  if (path === "/tools") {
    return {
      title: "Free Real Estate Investment Calculators | " + SITE_NAME,
      description: "Free interactive tools for real estate investors. Flip or Rent strategy analyzer, Deal Scorecard with 7 rules of thumb, ROI calculators, and more.",
      ogType: "website",
      canonical: baseUrl + "/tools",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Real Estate Investment Calculators",
          "description": "Free interactive tools to analyze investment properties, compare strategies, and make smarter real estate decisions.",
          "url": baseUrl + "/tools",
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl },
          "hasPart": [
            { "@type": "WebApplication", "name": "Flip or Rent Strategy Analyzer", "url": baseUrl + "/tools/flip-or-rent" },
            { "@type": "WebApplication", "name": "Deal Scorecard", "url": baseUrl + "/tools/deal-scorecard" }
          ]
        }
      ]
    };
  }

  if (path === "/tools/flip-or-rent") {
    return {
      title: "Flip or Rent Calculator — Compare Real Estate Strategies | " + SITE_NAME,
      description: "Free flip vs rent calculator. Compare ROI, cash flow, and total returns side-by-side. See which real estate strategy produces better results at 1, 3, and 5-year horizons.",
      ogType: "website",
      canonical: baseUrl + "/tools/flip-or-rent",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Flip or Rent? Strategy Analyzer",
          "description": "Compare flipping vs renting a property side-by-side. Calculate ROI, cash flow, and break-even timeline for both strategies.",
          "url": baseUrl + "/tools/flip-or-rent",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl }
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the 70% Rule for flipping houses?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The 70% Rule states you should pay no more than 70% of a property's After-Repair Value (ARV) minus repair costs. For example, if a home's ARV is $300,000 and needs $40,000 in repairs, the maximum purchase price should be $300,000 × 70% − $40,000 = $170,000."
              }
            },
            {
              "@type": "Question",
              "name": "What is a good cash-on-cash return for a rental property?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Most investors target 8-12% cash-on-cash return. In high-appreciation markets, investors may accept 4-6% because property values are growing. In cash-flow markets, 10-15% is common. Below 4% is generally considered poor unless appreciation potential is exceptional."
              }
            },
            {
              "@type": "Question",
              "name": "Should I flip or rent an investment property?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "It depends on your goals and market conditions. Flipping provides a lump-sum profit in 3-6 months but requires renovation expertise and involves higher risk. Renting provides ongoing passive income and builds long-term wealth through appreciation and equity. In hot markets, flipping often wins short-term. In stable markets, renting typically wins long-term."
              }
            }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Tools", "item": baseUrl + "/tools" },
            { "@type": "ListItem", "position": 3, "name": "Flip or Rent Calculator", "item": baseUrl + "/tools/flip-or-rent" }
          ]
        }
      ]
    };
  }

  if (path === "/tools/deal-scorecard") {
    return {
      title: "Deal Scorecard — Grade Any Investment Property | " + SITE_NAME,
      description: "Free investment property analyzer. Test any property against the 1% Rule, 50% Rule, 70% Rule, Cap Rate, GRM, and Cash-on-Cash Return. Get an instant letter grade from A to F.",
      ogType: "website",
      canonical: baseUrl + "/tools/deal-scorecard",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Deal Scorecard — Investment Property Analyzer",
          "description": "Test any investment property against 7 real estate rules of thumb simultaneously. Get an instant letter grade and detailed breakdown.",
          "url": baseUrl + "/tools/deal-scorecard",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Any",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl }
        },
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the 1% Rule in real estate investing?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The 1% Rule states that a rental property's monthly rent should be at least 1% of the purchase price. A $200,000 property should rent for at least $2,000/month. It is a quick screening tool for cash flow potential."
              }
            },
            {
              "@type": "Question",
              "name": "What is a good cap rate for an investment property?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Cap rates of 5-10% are typical for investment properties. 3-4% is common in premium areas where investors bet on appreciation. 7-8% is considered the sweet spot for cash flow investors. 9-10%+ usually indicates higher risk or a less desirable area."
              }
            },
            {
              "@type": "Question",
              "name": "Can a property fail these rules and still be a good investment?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. These are rules of thumb, not absolute laws. A property in a rapidly appreciating market might have a low cap rate but generate excellent total returns through value growth. Context matters — consider the specific market, your investment goals, and your risk tolerance."
              }
            }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Tools", "item": baseUrl + "/tools" },
            { "@type": "ListItem", "position": 3, "name": "Deal Scorecard", "item": baseUrl + "/tools/deal-scorecard" }
          ]
        }
      ]
    };
  }

  if (path === "/terms") {
    return {
      title: "Terms of Service | " + SITE_NAME,
      description: "Terms of Service for Dealbreak, the real estate investment simulation game.",
      ogType: "website",
      canonical: baseUrl + "/terms"
    };
  }

  if (path === "/privacy") {
    return {
      title: "Privacy Policy | " + SITE_NAME,
      description: "Privacy Policy for Dealbreak, the real estate investment simulation game.",
      ogType: "website",
      canonical: baseUrl + "/privacy"
    };
  }

  return {
    title: SITE_NAME,
    description: BASE_DESCRIPTION,
    ogType: "website",
    canonical: baseUrl + "/"
  };
}

export function injectSeoMeta(html: string, url: string, req: Request): string {
  const meta = getPageMeta(url, req);

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);

  html = html.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${escapeAttr(meta.description)}" />`
  );

  html = html.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${escapeAttr(meta.title)}" />`
  );
  html = html.replace(
    /<meta property="og:description" content="[^"]*" \/>/,
    `<meta property="og:description" content="${escapeAttr(meta.description)}" />`
  );
  html = html.replace(
    /<meta property="og:type" content="[^"]*" \/>/,
    `<meta property="og:type" content="${meta.ogType}" />`
  );
  html = html.replace(
    /<meta property="og:url" content="[^"]*" \/>/,
    `<meta property="og:url" content="${escapeAttr(meta.canonical)}" />`
  );

  html = html.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`
  );

  const canonicalTag = `<link rel="canonical" href="${escapeAttr(meta.canonical)}" />`;
  const existingCanonical = /<link rel="canonical" href="[^"]*" \/>/;
  if (existingCanonical.test(html)) {
    html = html.replace(existingCanonical, canonicalTag);
  } else {
    html = html.replace("</head>", `    ${canonicalTag}\n  </head>`);
  }

  const normalizedPath = url.split('?')[0].replace(/\/+$/, '') || '/';
  if (normalizedPath === '/') {
    const preloads = [
      '<link rel="preload" as="image" type="image/webp" href="/hero-bg-pattern.webp" fetchpriority="high" />',
    ];
    html = html.replace('</head>', `    ${preloads.join('\n    ')}\n  </head>`);
  }

  const rssLink = `<link rel="alternate" type="application/rss+xml" title="DealBreak Simulator — Real Estate Investing Guides" href="${getBaseUrl(req)}/feed.xml" />`;
  if (!html.includes('application/rss+xml')) {
    html = html.replace('</head>', `    ${rssLink}\n  </head>`);
  }

  if (meta.jsonLd) {
    const existingJsonLd = /<script type="application\/ld\+json">[\s\S]*?<\/script>/g;
    html = html.replace(existingJsonLd, '');

    const jsonLdArray = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    const jsonLdTags = jsonLdArray
      .map(ld => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`)
      .join("\n    ");
    html = html.replace("</head>", `    ${jsonLdTags}\n  </head>`);
  }

  return html;
}

interface SitemapUrl {
  loc: string;
  priority: string;
  changefreq: string;
  lastmod: string;
  image?: string;
}

export function generateSitemap(baseUrl: string): string {
  const today = new Date().toISOString().split("T")[0];
  const ogImage = baseUrl + "/opengraph.jpg";

  const staticUrls: SitemapUrl[] = [
    { loc: "/", priority: "1.0", changefreq: "weekly", lastmod: today, image: ogImage },
    { loc: "/learn", priority: "0.9", changefreq: "weekly", lastmod: today },
    { loc: "/game", priority: "0.8", changefreq: "monthly", lastmod: today, image: ogImage },
    { loc: "/what-is-dealbreak-simulator", priority: "0.9", changefreq: "monthly", lastmod: "2026-03-20", image: ogImage },
    { loc: "/tools", priority: "0.9", changefreq: "weekly", lastmod: today },
    { loc: "/tools/flip-or-rent", priority: "0.9", changefreq: "monthly", lastmod: "2026-03-15" },
    { loc: "/tools/deal-scorecard", priority: "0.9", changefreq: "monthly", lastmod: "2026-03-15" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly", lastmod: "2025-06-01" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly", lastmod: "2025-06-01" },
  ];

  const articleUrls: SitemapUrl[] = Object.entries(ARTICLE_DATA).map(([slug, article]) => ({
    loc: `/learn/${slug}`,
    priority: "0.8",
    changefreq: "monthly",
    lastmod: article.dateModified,
    image: ogImage
  }));

  const allUrls: SitemapUrl[] = [...staticUrls, ...articleUrls];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allUrls.map(u => {
    let entry = `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>`;
    if (u.image) {
      entry += `
    <image:image>
      <image:loc>${u.image}</image:loc>
      <image:title>DealBreak Simulator - Real Estate Investing Game</image:title>
    </image:image>`;
    }
    entry += `
  </url>`;
    return entry;
  }).join("\n")}
</urlset>`;
}

export function generateRssFeed(baseUrl: string): string {
  const articles = Object.entries(ARTICLE_DATA)
    .sort(([, a], [, b]) => new Date(b.dateModified).getTime() - new Date(a.dateModified).getTime());

  const buildDate = new Date().toUTCString();

  const items = articles.map(([slug, article]) => {
    const pubDate = new Date(article.datePublished).toUTCString();
    const description = escapeXml(article.subtitle + ". " + article.sections[0].content);
    return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${baseUrl}/learn/${slug}</link>
      <guid isPermaLink="true">${baseUrl}/learn/${slug}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
      <category>${escapeXml(article.category)}</category>
    </item>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DealBreak Simulator — Real Estate Investing Guides</title>
    <link>${baseUrl}/learn</link>
    <description>Free educational guides on real estate investing fundamentals. Learn about pro formas, cap rates, financing, due diligence, and investment strategies.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/favicon-32.png</url>
      <title>DealBreak Simulator</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;
}

export function getArticleData() {
  return ARTICLE_DATA;
}

const INDEXNOW_KEY = "dealbreak-indexnow-2026-key";

export function getIndexNowKey(): string {
  return INDEXNOW_KEY;
}

export function pingIndexNow(baseUrl: string): void {
  const urls = [
    baseUrl + "/",
    baseUrl + "/learn",
    baseUrl + "/tools",
    baseUrl + "/tools/flip-or-rent",
    baseUrl + "/tools/deal-scorecard",
    baseUrl + "/what-is-dealbreak-simulator",
    ...Object.keys(ARTICLE_DATA).map(slug => baseUrl + "/learn/" + slug)
  ];

  const payload = JSON.stringify({
    host: new URL(baseUrl).hostname,
    key: INDEXNOW_KEY,
    keyLocation: baseUrl + "/" + INDEXNOW_KEY + ".txt",
    urlList: urls
  });

  fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload
  }).then(res => {
    console.log(`IndexNow ping: ${res.status} ${res.statusText}`);
  }).catch(err => {
    console.error("IndexNow ping failed:", err.message);
  });
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
