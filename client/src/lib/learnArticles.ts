export interface ArticleSection {
  heading: string;
  content: string;
  type?: 'text' | 'callout' | 'warning' | 'tip' | 'infographic';
  infographicData?: InfographicData;
}

export interface InfographicData {
  type: 'comparison' | 'scale' | 'breakdown' | 'steps' | 'spectrum';
  items: { label: string; value: string; color?: string; percentage?: number }[];
  title?: string;
}

export interface LearnArticle {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  category: string;
  readTime: string;
  heroImage?: string;
  sections: ArticleSection[];
  relatedSlugs: string[];
  gameConnection: string;
  seoKeywords: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "what-is-a-pro-forma",
    title: "What Is a Pro Forma in Real Estate?",
    subtitle: "The one document that separates amateurs from professionals",
    icon: "📊",
    category: "Fundamentals",
    readTime: "5 min",
    difficulty: "beginner",
    heroImage: "learn_pro_forma",
    seoKeywords: ["real estate pro forma", "property financial analysis", "investment spreadsheet", "NOI calculation", "real estate underwriting"],
    sections: [
      {
        heading: "Your Deal's Truth Serum",
        content: "Here's something most real estate gurus won't tell you: the spreadsheet is more important than the property. A gorgeous Victorian in a trendy neighborhood can bankrupt you if the numbers don't work. A boring duplex in a quiet suburb can make you wealthy if they do. The pro forma is how you tell the difference — it's a forward-looking financial model that strips away the emotional appeal of a property and reveals whether it actually makes money."
      },
      {
        heading: "The Anatomy of a Pro Forma",
        type: "infographic",
        content: "Every pro forma has two sides fighting each other — income vs. expenses. The gap between them determines whether you're building wealth or burning cash.",
        infographicData: {
          type: "breakdown",
          title: "What Goes Into the Model",
          items: [
            { label: "Gross Rental Income", value: "What tenants pay you", color: "emerald", percentage: 100 },
            { label: "Vacancy Loss", value: "5-10% — months with no tenant", color: "red", percentage: 8 },
            { label: "Property Taxes", value: "Largest fixed expense", color: "amber", percentage: 25 },
            { label: "Insurance", value: "Protection against disasters", color: "amber", percentage: 8 },
            { label: "Maintenance Reserve", value: "1-2% of property value/year", color: "amber", percentage: 15 },
            { label: "Net Operating Income", value: "What's left — the magic number", color: "emerald", percentage: 44 }
          ]
        }
      },
      {
        heading: "Why Your Assumptions Will Make or Break You",
        type: "warning",
        content: "Anyone can fill in a spreadsheet. The skill is knowing whether your inputs reflect reality. Assume 3% vacancy when the neighborhood actually runs at 12%? Your \"profitable\" deal just became a cash drain. Underestimate maintenance by $200/month? That's $2,400/year bleeding from your returns. The pro forma doesn't lie — but it will happily reflect your delusions if you feed it bad data. This is exactly why due diligence exists: to validate your assumptions before you commit real money."
      },
      {
        heading: "Flip Pro Forma vs. Rental Pro Forma",
        content: "These are fundamentally different animals. A rental pro forma is about ongoing cash flow — monthly rent minus monthly expenses, projected over years. You're asking: \"Will this property pay me every month?\" A flip pro forma is about a single transaction: purchase price + renovation costs vs. sale price. You're asking: \"Can I buy low, add value, and sell high — fast enough to make the math work?\" The risks are completely different. Rentals are killed by vacancies and expense creep. Flips are killed by renovation overruns and market timing."
      },
      {
        heading: "The Number Nobody Talks About",
        type: "tip",
        content: "Experienced investors obsess over one number most beginners ignore: the break-even occupancy rate. This tells you what percentage of the year your property needs to be rented just to cover costs. If your break-even is 85%, you can absorb a month or two of vacancy. If it's 97%, one missed rent payment puts you underwater. Always calculate this before you buy."
      }
    ],
    relatedSlugs: ["cap-rates-cash-on-cash", "flip-vs-rent", "due-diligence", "hidden-costs"],
    gameConnection: "In Dealbreak, you build a pro forma for every property before deciding to buy. The game challenges you to make realistic assumptions — and then shows you what happens when reality doesn't match your projections."
  },
  {
    slug: "cap-rates-cash-on-cash",
    title: "Cap Rates & Cash-on-Cash Returns: The Real Story",
    subtitle: "Two numbers that tell you completely different things about the same deal",
    icon: "📈",
    category: "Financial Metrics",
    readTime: "6 min",
    difficulty: "beginner",
    heroImage: "learn_cap_rates",
    seoKeywords: ["cap rate real estate", "cash on cash return", "real estate ROI", "property investment returns", "capitalization rate formula"],
    sections: [
      {
        heading: "The Metric That Ignores Your Wallet",
        content: "Cap rate has a superpower: it doesn't care how you pay for the property. Whether you paid all cash or borrowed 90%, the cap rate is the same. Formula: Net Operating Income / Property Value. That's it. A property generating $12,000/year in NOI with a value of $150,000 has an 8% cap rate. This makes it perfect for comparing properties of wildly different sizes and prices — a $200K duplex against a $500K fourplex. Same metric, apples-to-apples."
      },
      {
        heading: "What Cap Rates Actually Tell You",
        type: "infographic",
        content: "Cap rates encode both return AND risk. Higher cap rates don't always mean better deals.",
        infographicData: {
          type: "spectrum",
          title: "The Cap Rate Spectrum",
          items: [
            { label: "3-4%", value: "Premium areas, lowest risk, appreciation play", color: "blue", percentage: 15 },
            { label: "5-6%", value: "Solid neighborhoods, moderate growth potential", color: "emerald", percentage: 30 },
            { label: "7-8%", value: "Sweet spot for most investors", color: "emerald", percentage: 55 },
            { label: "9-10%", value: "Higher returns, higher risk, more management", color: "amber", percentage: 75 },
            { label: "11%+", value: "Distressed areas or properties — proceed with caution", color: "red", percentage: 95 }
          ]
        }
      },
      {
        heading: "Cash-on-Cash: What YOUR Money Actually Earns",
        content: "Here's where it gets personal. Cash-on-Cash return measures what your actual out-of-pocket investment earns. Formula: Annual Pre-Tax Cash Flow / Total Cash Invested. Put $40,000 down and earn $4,800/year in cash flow after the mortgage? That's a 12% CoC return. This metric matters because leverage changes everything. A deal with a modest 7% cap rate can deliver a 14% CoC return with smart financing. Conversely, over-leverage can turn a great cap rate into negative cash flow."
      },
      {
        heading: "The Inverse Dance: Cap Rates and Prices",
        type: "callout",
        content: "When investors pile into a market, they compete for properties, driving prices up. Higher prices with the same NOI = lower cap rates. That's why booming cities like Austin or Nashville see cap rates compress to 4-5% while struggling markets offer 10%+. If you see cap rates compressing rapidly in your target market, it's a warning sign: properties are getting expensive relative to their income. Great for sellers, dangerous for buyers."
      },
      {
        heading: "The Metric Nobody Mentions: Yield on Cost",
        type: "tip",
        content: "For value-add investors, there's a third metric that matters more than either: Yield on Cost. It's your projected NOI after improvements divided by your total cost (purchase price + renovation). If you buy a property at a 6% cap rate but renovate it to produce a 9% yield on cost, you've created 3% of value out of thin air. This is how professional investors consistently find \"deals\" in competitive markets."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "ltv-financing", "market-conditions", "one-percent-rule"],
    gameConnection: "Dealbreak calculates your cap rate and cash-on-cash return in real time as you adjust your pro forma inputs. The results panel shows whether your projections meet typical investment benchmarks."
  },
  {
    slug: "flip-vs-rent",
    title: "Flip vs. Rent: The Strategy Decision That Changes Everything",
    subtitle: "One makes you money fast. The other makes you money forever. Pick wrong and neither works.",
    icon: "🔄",
    category: "Strategy",
    readTime: "7 min",
    difficulty: "beginner",
    heroImage: "learn_flip_vs_rent",
    seoKeywords: ["flip or rent property", "real estate strategy", "house flipping vs rental", "buy and hold vs flip", "real estate investment strategy"],
    sections: [
      {
        heading: "The Adrenaline Play: Flipping",
        content: "Flipping is real estate's sprint. Buy a property, improve it, sell it — ideally within 3-6 months. A single successful flip can net $30,000-$80,000 in profit. The appeal is obvious: concentrated, visible returns. But here's what the TV shows don't emphasize: your profit depends on three variables you can't fully control. Renovation costs (contractors are legendarily unpredictable). Timeline (every extra month costs you in holding costs like loan interest and taxes). Sale price (which depends on what the market does between your purchase and your listing). One bad surprise in any of these and your profit evaporates."
      },
      {
        heading: "The Wealth Engine: Renting",
        content: "Renting is real estate's marathon. The returns are slower but the wealth-building mechanics are extraordinary. A good rental gives you three simultaneous income streams: monthly cash flow (rent minus expenses), appreciation (the property's value growing over time), and equity buildup (your tenant is literally paying off your mortgage for you). Over 20 years, a single well-chosen rental property can generate more total wealth than a dozen flips — with far less stress and risk."
      },
      {
        heading: "Head-to-Head Comparison",
        type: "infographic",
        content: "The right strategy depends on your situation, market, and risk tolerance.",
        infographicData: {
          type: "comparison",
          title: "Flip vs. Rent at a Glance",
          items: [
            { label: "Time to Profit", value: "Flip: 3-6 months | Rent: 1-3 years", color: "amber" },
            { label: "Risk Level", value: "Flip: High (concentrated) | Rent: Moderate (spread out)", color: "red" },
            { label: "Income Type", value: "Flip: One-time lump sum | Rent: Ongoing monthly", color: "emerald" },
            { label: "Capital Needed", value: "Flip: Moderate + rehab | Rent: Down payment + reserves", color: "amber" },
            { label: "Market Sensitivity", value: "Flip: Very high | Rent: Moderate", color: "red" },
            { label: "Tax Treatment", value: "Flip: Ordinary income | Rent: Depreciation benefits", color: "emerald" }
          ]
        }
      },
      {
        heading: "When the Market Picks for You",
        type: "callout",
        content: "In a rising market, flipping looks genius — properties appreciate while you renovate, inflating your profit margin. But in a flat or declining market, flipping becomes gambling. You could finish your renovation and discover comps have dropped $20K since you bought. Rentals, on the other hand, perform well in uncertain markets because you can wait out downturns while collecting rent. Many experienced investors flip in hot markets and buy rentals in cold ones."
      },
      {
        heading: "The Hybrid Move Most People Miss",
        type: "tip",
        content: "The BRRRR strategy (Buy, Rehab, Rent, Refinance, Repeat) combines the best of both worlds. You buy undervalued, renovate to increase value AND rental income, rent it out, then refinance to pull your capital back out — and use that capital to buy the next one. It's slower than pure flipping but builds long-term wealth while recycling your investment capital."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "rehab-budgets", "market-conditions", "portfolio-strategy"],
    gameConnection: "In Dealbreak, you choose between flip and rent strategies for each property you buy. The game models realistic timelines, costs, and outcomes for both — including surprise expenses, market shifts, and tenant issues."
  },
  {
    slug: "due-diligence",
    title: "Due Diligence: The $500 That Saves You $50,000",
    subtitle: "Why the smartest investors spend money BEFORE they make money",
    icon: "🔍",
    category: "Process",
    readTime: "6 min",
    difficulty: "beginner",
    heroImage: "learn_due_diligence",
    seoKeywords: ["real estate due diligence", "property inspection", "title search real estate", "home inspection investment", "real estate appraisal"],
    sections: [
      {
        heading: "The Inspection That Pays for Itself 100x Over",
        content: "A professional home inspection costs $300-$500 for a typical residential property. That feels like money you could save, especially when you're already stretching your budget. But here's the reality check: a cracked foundation costs $30,000+ to repair. A failing roof? $15,000+. Knob-and-tube wiring replacement? $20,000+. Termite damage that's compromised structural integrity? Open your wallet and close your eyes. Every single one of these is a common finding in investment properties, especially those priced below market. The inspection fee isn't an expense — it's insurance against catastrophe."
      },
      {
        heading: "What Each Investigation Reveals",
        type: "infographic",
        content: "Different types of due diligence protect you from different risks.",
        infographicData: {
          type: "breakdown",
          title: "Due Diligence Types & What They Catch",
          items: [
            { label: "Property Inspection", value: "Structural, mechanical, and safety issues", color: "emerald", percentage: 40 },
            { label: "Title Search", value: "Liens, ownership disputes, easements", color: "blue", percentage: 20 },
            { label: "Appraisal", value: "True market value (vs. listing price)", color: "amber", percentage: 20 },
            { label: "Market Study", value: "Realistic rent and sale price estimates", color: "purple", percentage: 20 }
          ]
        }
      },
      {
        heading: "Title Searches: The Invisible Landmines",
        content: "You'd be amazed what can be hiding in a property's legal history. Unpaid tax liens from previous owners that transfer to YOU when you buy. Mechanic's liens from contractors who were never paid. Easements that prevent you from building on part of the property. Boundary disputes with neighbors that could cost you a chunk of your yard. A title search costs a few hundred dollars and a couple weeks. It's the most boring due diligence step and also the one most likely to save you from a legal nightmare you never saw coming."
      },
      {
        heading: "The Comparable Sales Analysis Nobody Talks About",
        type: "callout",
        content: "Here's where amateurs and professionals truly diverge. A market study isn't just checking Zillow estimates. It's analyzing the last 6 months of actual closed sales (not listings, not pendings — closings) for properties within a half-mile that match your property's characteristics. You adjust for differences in condition, size, and lot. This gives you a realistic sale price for flips and a realistic rent for rentals. Without this research, you're literally guessing with six figures on the line."
      },
      {
        heading: "The Skip-and-Pray Strategy (Don't)",
        type: "warning",
        content: "When a deal looks amazing, the temptation is to move fast and skip inspections. \"I'll save the money and two weeks of time.\" This is almost always a mistake. The properties that look like the best deals are often priced low BECAUSE they have hidden problems. The seller knows about the foundation crack. They know about the mold behind the drywall. They priced it to attract buyers who won't look too closely. The best deals can withstand scrutiny — if a deal only works when you don't look, it's not actually a good deal."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "common-mistakes", "rehab-budgets", "hidden-costs"],
    gameConnection: "Dealbreak lets you choose which investigations to conduct — or skip — for each property. Skipping due diligence saves time and money upfront but can lead to surprise repair costs and bad assumptions that tank your deal."
  },
  {
    slug: "ltv-financing",
    title: "LTV & Financing: The Double-Edged Sword of Leverage",
    subtitle: "How borrowing money can make you rich — or bankrupt you overnight",
    icon: "🏦",
    category: "Financing",
    readTime: "6 min",
    difficulty: "intermediate",
    heroImage: "learn_ltv_financing",
    seoKeywords: ["loan to value ratio", "real estate leverage", "LTV mortgage", "real estate financing", "investment property loan"],
    sections: [
      {
        heading: "Leverage: The Amplifier",
        content: "Loan-to-Value ratio is the single most important number in real estate financing. An 80% LTV on a $200,000 property means you're borrowing $160,000 and putting $40,000 down. Here's why it matters: leverage amplifies EVERYTHING. If the property appreciates 10%, your $200K property is worth $220K. On a $40K investment, that's a 50% return. Incredible. But flip it: if the value drops 10%, your $40K equity just got cut in half. Same amplification, different direction. This is why leverage is called a double-edged sword — it cuts both ways, and the deeper you cut, the more it can hurt."
      },
      {
        heading: "The Danger Zone",
        type: "infographic",
        content: "Interest rates don't scale linearly with LTV — they accelerate into dangerous territory above 90%.",
        infographicData: {
          type: "scale",
          title: "LTV Risk & Rate Escalation",
          items: [
            { label: "60% LTV", value: "Best rates, lowest risk, large equity cushion", color: "emerald", percentage: 20 },
            { label: "70% LTV", value: "Still favorable terms, solid buffer", color: "emerald", percentage: 35 },
            { label: "80% LTV", value: "Standard — most common for investors", color: "amber", percentage: 50 },
            { label: "85% LTV", value: "Rates tick up, PMI may kick in", color: "amber", percentage: 65 },
            { label: "90% LTV", value: "Entering danger zone — rates jump significantly", color: "red", percentage: 80 },
            { label: "95%+ LTV", value: "Extreme risk — tiny equity, massive payments, one bad month away from trouble", color: "red", percentage: 95 }
          ]
        }
      },
      {
        heading: "The Math That Changes Your Strategy",
        type: "callout",
        content: "Consider two investors buying the same $200K property. Investor A puts 30% down ($60K) at 6.5% interest = $885/month payment. Investor B puts 10% down ($20K) at 9% interest = $1,448/month payment. Investor B needs $563 MORE per month in rent just to match Investor A's cash flow position. That's $6,756/year in extra cost for the privilege of borrowing more. Sometimes high leverage makes sense (when rents easily cover it). Often, it's a trap."
      },
      {
        heading: "Matching Your Financing to Your Strategy",
        content: "For flips, think about TOTAL cost of the loan over your hold period. Sometimes a higher rate with lower origination fees is cheaper for a 4-month flip than a lower rate with 2 points upfront. For rentals, optimize for monthly cash flow — a lower rate matters more even if it means a larger down payment. Also consider whether to finance renovation costs in the loan. This preserves cash but increases your payment. Running out of cash is worse than a bigger mortgage — but barely."
      },
      {
        heading: "The Refinancing Power Move",
        type: "tip",
        content: "Smart investors often buy with higher leverage to preserve cash, then refinance after they've improved the property and increased its appraised value. This lets you lock in a lower rate on a better LTV ratio based on the NEW value — potentially pulling cash back out while actually improving your loan terms. It's like a financial magic trick, but it requires patience and a property that genuinely appreciates through your improvements."
      }
    ],
    relatedSlugs: ["cap-rates-cash-on-cash", "what-is-a-pro-forma", "common-mistakes", "survive-market-crash"],
    gameConnection: "In Dealbreak, a single LTV slider drives your interest rate, loan fees, and monthly payment. Push it into the danger zone above 90% and watch your costs skyrocket — a lesson many real investors learn the hard way."
  },
  {
    slug: "market-conditions",
    title: "Reading Market Conditions Like a Pro",
    subtitle: "The cyclical patterns that determine when to buy, when to sell, and when to wait",
    icon: "📉",
    category: "Strategy",
    readTime: "6 min",
    difficulty: "intermediate",
    heroImage: "learn_market_conditions",
    seoKeywords: ["real estate market cycle", "property market conditions", "when to buy real estate", "real estate timing", "housing market analysis"],
    sections: [
      {
        heading: "The Four Seasons of Real Estate",
        content: "Markets don't move randomly — they follow a cycle that repeats over roughly 7-18 year periods. Recovery (prices are low, smart money is buying), Expansion (prices rising, confidence growing, everyone wants in), Hyper-Supply (too much construction, too many listings, cracks forming), and Recession (prices falling, vacancies rising, overleveraged investors panic). The biggest mistake isn't buying in a recession — it's buying at the peak of expansion thinking prices will go up forever."
      },
      {
        heading: "Market Impact on Your Strategy",
        type: "infographic",
        content: "Different market conditions favor different strategies. Adapt or lose money.",
        infographicData: {
          type: "comparison",
          title: "Strategy Performance by Market",
          items: [
            { label: "Hot Market + Flip", value: "Quick sales, good prices — but high purchase costs eat margins", color: "amber" },
            { label: "Hot Market + Rental", value: "Low vacancy, strong rents — but compressed cap rates", color: "amber" },
            { label: "Cold Market + Flip", value: "Cheap purchases — but slow sales and uncertain pricing", color: "red" },
            { label: "Cold Market + Rental", value: "Great entry prices — but higher vacancy risk, tenant quality issues", color: "amber" },
            { label: "Recovery + Either", value: "Best buying opportunities — prices low, trajectory up", color: "emerald" }
          ]
        }
      },
      {
        heading: "It's Not About National Headlines",
        type: "callout",
        content: "Real estate is fundamentally local. A city with a new Amazon headquarters might be booming while a town losing its factory is collapsing — simultaneously. Don't make decisions based on cable news housing segments. Focus on local indicators: Days on Market (how long properties sit before selling), Months of Inventory (how many months it would take to sell all current listings), Rental Vacancy Rate (what percentage of rentals are empty), and Job Growth (the single best predictor of housing demand). These local metrics tell you more than any national average."
      },
      {
        heading: "The Contrarian Edge",
        content: "Warren Buffett's famous advice — \"Be fearful when others are greedy, and greedy when others are fearful\" — applies perfectly to real estate. The best deals happen when everyone else is running away. During the 2009-2012 recovery, investors who bought distressed properties at 50 cents on the dollar built generational wealth. They didn't time the absolute bottom — they just had the conviction to buy when the market was unpopular. Timing doesn't need to be perfect. Direction matters more than precision."
      },
      {
        heading: "The Signal Nobody Watches",
        type: "tip",
        content: "Building permits are one of the most powerful leading indicators for real estate investors. A surge in new permits means new supply is coming in 12-18 months, which can suppress price growth and increase competition for tenants. A drop in permits means future supply constraints, which tends to push prices and rents UP. Most investors only look at current prices — the smart ones are watching what's being built."
      }
    ],
    relatedSlugs: ["flip-vs-rent", "cap-rates-cash-on-cash", "common-mistakes", "survive-market-crash"],
    gameConnection: "Dealbreak simulates a dynamic market that shifts between five conditions — from terrible to excellent — every few months. Your flip sale prices and rental property values fluctuate with the market, teaching you to factor market risk into every deal."
  },
  {
    slug: "rehab-budgets",
    title: "Rehab Budgets: Where Deals Go to Die (or Thrive)",
    subtitle: "How to plan renovations that actually add value — and avoid the money pit",
    icon: "🔨",
    category: "Operations",
    readTime: "6 min",
    difficulty: "intermediate",
    heroImage: "learn_rehab_budgets",
    seoKeywords: ["rehab budget real estate", "renovation costs investment property", "house flip renovation", "contractor management", "property renovation planning"],
    sections: [
      {
        heading: "The Budget That Always Lies",
        content: "Here's an uncomfortable truth every experienced investor knows: your initial rehab budget is wrong. Always. The question is whether it's wrong by 10% or by 100%. Opening walls reveals surprises — hidden water damage, outdated wiring, asbestos insulation, plumbing that crumbles when you touch it. The rule of thumb: estimate your costs carefully, then add a 15-20% contingency buffer. If you can't afford the contingency, you can't afford the renovation."
      },
      {
        heading: "What Renovations Actually Cost",
        type: "infographic",
        content: "Typical renovation costs for investment properties — these ranges reflect materials and labor in most US markets.",
        infographicData: {
          type: "breakdown",
          title: "Common Renovation Cost Ranges",
          items: [
            { label: "Kitchen Remodel", value: "$10,000 - $40,000+", color: "red", percentage: 85 },
            { label: "Bathroom Renovation", value: "$5,000 - $20,000", color: "amber", percentage: 55 },
            { label: "New Roof", value: "$8,000 - $25,000", color: "amber", percentage: 60 },
            { label: "HVAC Replacement", value: "$5,000 - $15,000", color: "amber", percentage: 45 },
            { label: "Cosmetic Updates", value: "$3,000 - $8,000", color: "emerald", percentage: 25 },
            { label: "Paint + Flooring", value: "$2,000 - $6,000", color: "emerald", percentage: 18 }
          ]
        }
      },
      {
        heading: "Picking Your Contractor (It's Like Hiring a Surgeon)",
        content: "You generally have three tiers: Budget contractors who are cheapest but often slower and less reliable. Standard contractors who balance cost, quality, and timeline. Premium contractors who charge a lot but move fast and handle problems professionally. For a flip where every month of holding costs you $1,500+, that premium contractor who finishes 6 weeks earlier might actually be cheaper overall. For a rental where you're not in a rush, a budget contractor can save thousands if you can tolerate the longer timeline. Match your contractor to your strategy."
      },
      {
        heading: "The No-Rehab Flip (Yes, It Exists)",
        type: "callout",
        content: "Not every flip needs a gut renovation. Some investors specifically target properties where the previous owner already did the improvements but needs to sell quickly (divorce, job relocation, estate sale). You're buying at a discount not because the property needs work, but because the seller needs speed. The trade-off: smaller margins, but zero construction risk. For newer investors, this is often the smarter first flip."
      },
      {
        heading: "The Cash vs. Finance Decision",
        type: "tip",
        content: "Paying cash for rehab keeps your loan smaller but drains your reserves. Financing rehab preserves cash but increases your monthly nut. Here's the deciding factor: how many deals are you juggling? If this is your only project, financing rehab is usually smart — you keep cash reserves for emergencies. If you're running multiple projects, cash-paying one and financing the other gives you flexibility. Never finance rehab if it pushes your total loan above 90% LTV — the rate penalty will eat you alive."
      }
    ],
    relatedSlugs: ["flip-vs-rent", "due-diligence", "common-mistakes", "hidden-costs"],
    gameConnection: "In Dealbreak, you set your rehab budget with a slider and choose from different contractor tiers. Skip rehab on a flip and watch your sale price suffer. Choose a cheap contractor and risk timeline delays that eat into your returns."
  },
  {
    slug: "common-mistakes",
    title: "The 5 Mistakes That Bankrupt New Investors",
    subtitle: "Every one of these looks reasonable until it costs you everything",
    icon: "⚠️",
    category: "Risk Management",
    readTime: "7 min",
    difficulty: "beginner",
    heroImage: "learn_common_mistakes",
    seoKeywords: ["real estate investment mistakes", "beginner investor errors", "real estate bankruptcy", "property investment risks", "overleveraging real estate"],
    sections: [
      {
        heading: "Mistake #1: The Fantasy Rent Number",
        type: "warning",
        content: "\"I'll rent it for $2,000/month!\" Based on what? The nicest listing in a 5-mile radius? Your mortgage payment? What you need it to be? Rental rates should be based on what similar properties in the immediate area are actually renting for RIGHT NOW — not the aspirational listing that's been sitting vacant for 3 months. And vacancy happens. Even in strong markets, budget 5-8% vacancy as a baseline. A pro forma built on fantasy rent is a recipe for negative cash flow and midnight stress."
      },
      {
        heading: "Mistake #2: The Invisible Expenses",
        content: "New investors add up mortgage + taxes + insurance and call it \"total expenses.\" They're forgetting: maintenance reserves (1-2% of property value annually), property management fees (8-12% of rent if you hire help), capital expenditure reserves (for the eventual $15K roof or $10K HVAC), landscaping, pest control, HOA dues, legal fees, accounting costs, and that one random thing that breaks every quarter. A deal that looks profitable when you only count three expenses turns negative when you count twelve."
      },
      {
        heading: "Mistake #3: The Leverage Trap",
        type: "infographic",
        content: "High leverage feels clever in good times. In bad times, it's the #1 cause of foreclosure.",
        infographicData: {
          type: "scale",
          title: "How Fast Leverage Can Kill Your Equity",
          items: [
            { label: "70% LTV", value: "Property drops 20% → You still have 10% equity", color: "emerald", percentage: 30 },
            { label: "80% LTV", value: "Property drops 20% → You're at breakeven", color: "amber", percentage: 50 },
            { label: "90% LTV", value: "Property drops 10% → You're underwater", color: "red", percentage: 75 },
            { label: "95% LTV", value: "Property drops 5% → You owe more than it's worth", color: "red", percentage: 95 }
          ]
        }
      },
      {
        heading: "Mistake #4: Speed Over Safety",
        content: "\"This deal won't last! I need to move NOW and skip the inspection.\" This urgency is almost always manufactured — either by a motivated seller, a real estate agent working on commission, or your own excitement. The properties that look like the best deals are often priced low because they have problems. The seller knows. They're counting on you not to look. A $400 inspection that kills a bad deal is the best $400 you'll ever spend."
      },
      {
        heading: "Mistake #5: Running on Empty",
        type: "warning",
        content: "Cash reserves aren't sexy. They don't earn high returns sitting in a savings account. But running out of cash is the #1 way investors lose properties. An unexpected $8,000 repair. A tenant who stops paying (and eviction takes 3-6 months). A flip that takes 4 months longer to sell than projected. Without cash reserves, any of these common scenarios forces a distressed sale — and distressed sellers get distressed prices. Keep 3-6 months of expenses per property in reserve. It's boring. It's essential."
      }
    ],
    relatedSlugs: ["ltv-financing", "due-diligence", "cap-rates-cash-on-cash", "hidden-costs"],
    gameConnection: "Dealbreak is designed to teach these lessons through experience. Skip inspections and face surprise costs. Over-leverage and watch your cash evaporate. The game's bankruptcy system makes the consequences of these mistakes viscerally real."
  },
  {
    slug: "one-percent-rule",
    title: "The 1% Rule and Other Quick Screening Filters",
    subtitle: "How to evaluate 50 properties in an hour without a spreadsheet",
    icon: "⚡",
    category: "Advanced Strategy",
    readTime: "5 min",
    difficulty: "intermediate",
    heroImage: "learn_quick_filters",
    seoKeywords: ["1 percent rule real estate", "property screening filters", "quick property analysis", "50 percent rule", "real estate rules of thumb"],
    sections: [
      {
        heading: "Why You Need a Filter Before the Pro Forma",
        content: "You can't build a detailed pro forma for every property on the market — there are too many. Before you invest hours in detailed analysis, you need quick filters that eliminate properties that have no chance of working. Think of it as triage: most properties won't meet your criteria, and that's fine. You only need to find one good deal. These rules of thumb are imperfect by design — they're meant to be fast, not precise. They help you focus your detailed analysis time on the 10% of properties that might actually work."
      },
      {
        heading: "The Quick-Filter Toolkit",
        type: "infographic",
        content: "These rules aren't gospel — they're first-pass screens to save you time.",
        infographicData: {
          type: "steps",
          title: "Rapid Screening Rules of Thumb",
          items: [
            { label: "The 1% Rule", value: "Monthly rent should be at least 1% of purchase price ($200K property = $2,000/month rent)", color: "emerald" },
            { label: "The 50% Rule", value: "Assume 50% of gross rent goes to expenses (excluding mortgage) for a quick NOI estimate", color: "amber" },
            { label: "The 70% Rule (Flips)", value: "Never pay more than 70% of ARV minus repair costs (ARV $300K, repairs $40K = max $170K offer)", color: "blue" },
            { label: "The 2% Rule", value: "If rent exceeds 2% of price, it's unusually strong (or the neighborhood has risk factors to investigate)", color: "purple" }
          ]
        }
      },
      {
        heading: "When Rules of Thumb Fail",
        type: "warning",
        content: "These filters work well in most markets, but they can mislead you in extremes. In expensive coastal cities, almost nothing passes the 1% test — but properties still cash flow because of strong appreciation and rent growth. In cheap rural markets, everything passes the 1% test — but vacancy rates might be 15% and tenant quality is a real issue. Context matters. A property that barely misses the 1% rule in a booming market with 2% vacancy might be a better investment than one that smashes the 2% rule in a declining town."
      },
      {
        heading: "Building Your Personal Filter Stack",
        type: "tip",
        content: "Experienced investors develop custom filter stacks for their specific market and strategy. Start with the 1% rule to set the floor, then add layers: price range you can finance, neighborhoods you've researched, property types you understand, and minimum bed/bath counts that attract your target tenant. The goal isn't to find the perfect property — it's to quickly eliminate the 90% of listings that don't deserve your detailed analysis time."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "cap-rates-cash-on-cash", "flip-vs-rent", "portfolio-strategy"],
    gameConnection: "In Dealbreak, you browse multiple properties with different price points and income potential. Learning to quickly screen properties and focus your limited time on the best opportunities is a critical skill the game teaches."
  },
  {
    slug: "survive-market-crash",
    title: "How to Survive (and Profit From) a Market Crash",
    subtitle: "What separates investors who go bankrupt from those who build empires during downturns",
    icon: "🛡️",
    category: "Advanced Strategy",
    readTime: "7 min",
    difficulty: "advanced",
    heroImage: "learn_market_crash",
    seoKeywords: ["survive real estate crash", "real estate downturn strategy", "recession proof investing", "buy during market crash", "real estate market crash"],
    sections: [
      {
        heading: "The Crash Is Coming (Eventually)",
        content: "Real estate crashes aren't \"if\" events — they're \"when\" events. Since 1900, the US has experienced significant real estate downturns roughly every 15-20 years. The 2008 crash wiped out trillions in property value. The early 1990s saw similar devastation in certain markets. Understanding this isn't pessimism — it's realism. The question isn't whether a crash will happen during your investing career. It's whether you're positioned to survive it — or even profit from it."
      },
      {
        heading: "Why Most Investors Fail in Downturns",
        type: "infographic",
        content: "Crashes don't destroy careful investors. They destroy overleveraged, undercapitalized ones.",
        infographicData: {
          type: "steps",
          title: "The Bankruptcy Cascade",
          items: [
            { label: "Step 1", value: "Market drops 15-20% — property values fall below loan balances for high-LTV investors", color: "amber" },
            { label: "Step 2", value: "Rents soften, vacancies increase — cash flow turns negative for thin-margin deals", color: "amber" },
            { label: "Step 3", value: "Cash reserves drain paying expenses on cash-flow-negative properties", color: "red" },
            { label: "Step 4", value: "Forced to sell at a loss or face foreclosure — selling floods the market, pushing prices lower", color: "red" }
          ]
        }
      },
      {
        heading: "The Crash-Proof Portfolio",
        content: "Investors who survive crashes share three characteristics: low leverage (70-80% LTV gives you a 20-30% equity cushion), strong cash reserves (6+ months of expenses per property), and positive cash flow on every property (no properties that only work if appreciation continues). If your rental covers its own expenses even if rent drops 10%, you can hold through any downturn. If your equity cushion exceeds the worst historical decline in your market, you can't go underwater. Boring? Yes. Bankruptcy-proof? Also yes."
      },
      {
        heading: "How to Profit When Everyone Else Is Panicking",
        type: "callout",
        content: "The investors who built the biggest real estate portfolios in the last 50 years all share one trait: they bought aggressively during downturns. When others are desperate to sell, prices drop 30-50% below replacement cost. Properties that would never cash flow at peak prices suddenly generate 12%+ cap rates. The catch: you need cash and conviction when fear is at its peak. This means building reserves during good times specifically so you have dry powder for the next downturn."
      },
      {
        heading: "Recession Indicators to Watch",
        type: "tip",
        content: "Don't wait for the crash to prepare. Watch these leading indicators: inverted yield curve (short-term interest rates exceeding long-term rates), rising mortgage delinquency rates, new construction exceeding absorption rates, and rapidly compressing cap rates (a sign of overheated pricing). When multiple indicators flash simultaneously, it's time to stop buying, build reserves, and prepare your shopping list for the deals that will emerge in 12-18 months."
      }
    ],
    relatedSlugs: ["market-conditions", "ltv-financing", "common-mistakes", "portfolio-strategy"],
    gameConnection: "In Dealbreak, market conditions shift dynamically — sometimes crashing just when you need to sell. The game teaches you to maintain cash reserves and avoid over-leverage so a market downturn doesn't end your run."
  },
  {
    slug: "hidden-costs",
    title: "The Hidden Costs Nobody Tells You About",
    subtitle: "14 expenses that don't show up in the listing — but definitely show up on your bank statement",
    icon: "💸",
    category: "Financial Metrics",
    readTime: "6 min",
    difficulty: "intermediate",
    heroImage: "learn_common_mistakes",
    seoKeywords: ["hidden costs real estate", "true cost property investment", "real estate expenses", "investment property costs", "landlord expenses"],
    sections: [
      {
        heading: "The Costs You See (and the 10 You Don't)",
        content: "When you evaluate a property, the obvious costs jump out: purchase price, mortgage payment, property taxes, insurance. Those are the tip of the iceberg. Below the waterline lurk a dozen expenses that collectively represent 30-40% of your gross rental income. Missing even a few of these in your analysis can flip a profitable deal into a money pit. Here's the full picture that most listing descriptions conveniently omit."
      },
      {
        heading: "The Full Expense Stack",
        type: "infographic",
        content: "Here's every expense category experienced investors budget for — missing even two or three of these will distort your projections.",
        infographicData: {
          type: "breakdown",
          title: "The Complete Cost Picture",
          items: [
            { label: "Maintenance & Repairs", value: "1-2% of property value/year — things break constantly", color: "red", percentage: 100 },
            { label: "Capital Expenditures", value: "Roof, HVAC, water heater — save monthly for the big ones", color: "red", percentage: 85 },
            { label: "Property Management", value: "8-12% of rent, even if you self-manage (your time has value)", color: "amber", percentage: 70 },
            { label: "Vacancy Loss", value: "5-10% of gross rent — turnover is unavoidable", color: "amber", percentage: 55 },
            { label: "Closing Costs", value: "2-5% of purchase price — often forgotten in flip ROI calcs", color: "amber", percentage: 45 },
            { label: "Legal & Accounting", value: "$1,000-3,000/year for proper entity and tax management", color: "blue", percentage: 30 },
            { label: "Pest Control & Landscaping", value: "$100-300/month depending on property and climate", color: "blue", percentage: 20 }
          ]
        }
      },
      {
        heading: "The Expense That Eats Flippers Alive",
        type: "warning",
        content: "Holding costs during a flip are the silent killer. Every month you own a property that isn't generating income, you're paying: mortgage interest, property taxes, insurance, utilities, and lawn maintenance. For a typical flip with a $200K loan at 8%, that's roughly $1,900/month in holding costs BEFORE renovation expenses. A flip projected to take 4 months but stretching to 7 costs an extra $5,700 — and that comes straight out of your profit margin."
      },
      {
        heading: "The Self-Management Illusion",
        content: "\"I'll save 10% by managing it myself!\" Sure — until you factor in the midnight plumbing emergencies, the 3 hours spent showing the unit to prospective tenants, the legal research for eviction procedures, and the emotional weight of being your tenant's landlord. Self-management is a real job. If you wouldn't accept $15/hour to do it for someone else, you shouldn't accept it from yourself. At minimum, budget 5% of rent as a \"self-management fee\" in your pro forma so your analysis reflects the true picture."
      },
      {
        heading: "The Tax Surprise (Good and Bad)",
        type: "tip",
        content: "Tax implications can swing your effective return by 3-5 percentage points. On the good side: rental property depreciation (a paper loss that reduces your tax bill), mortgage interest deductions, and the ability to defer capital gains through 1031 exchanges. On the bad side: flips are taxed as ordinary income (potentially 30%+), not long-term capital gains (15-20%). This alone can make a mediocre rental outperform a good flip on an after-tax basis."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "common-mistakes", "due-diligence", "one-percent-rule"],
    gameConnection: "Dealbreak forces you to account for realistic expenses in your pro forma. The reality check system challenges overly optimistic assumptions and shows you exactly how hidden costs affect your bottom line."
  },
  {
    slug: "portfolio-strategy",
    title: "Building a Real Estate Portfolio: From One Property to Ten",
    subtitle: "The compounding strategy that turns a single deal into generational wealth",
    icon: "🏗️",
    category: "Advanced Strategy",
    readTime: "8 min",
    difficulty: "advanced",
    heroImage: "learn_portfolio_strategy",
    seoKeywords: ["real estate portfolio strategy", "multiple investment properties", "scaling real estate", "BRRRR strategy", "real estate wealth building"],
    sections: [
      {
        heading: "The Portfolio Mindset Shift",
        content: "Most investors think deal-by-deal. Portfolio investors think in systems. The difference is enormous. A deal-by-deal investor asks: \"Is this one property profitable?\" A portfolio investor asks: \"How does this property fit into my overall portfolio? Does it diversify my risk? Does it generate cash flow I can deploy into the next acquisition?\" This mental shift — from individual deals to portfolio construction — is what separates people who own one rental from people who own ten."
      },
      {
        heading: "The Portfolio Growth Flywheel",
        type: "infographic",
        content: "Each property feeds into the next through cash flow recycling and equity building.",
        infographicData: {
          type: "steps",
          title: "The Wealth Compounding Cycle",
          items: [
            { label: "Acquire", value: "Buy property with strong fundamentals and value-add potential", color: "emerald" },
            { label: "Improve", value: "Renovate, stabilize with tenants, force appreciation through better management", color: "amber" },
            { label: "Refinance", value: "Pull equity out via cash-out refi — recycle your down payment", color: "blue" },
            { label: "Repeat", value: "Deploy recovered capital into the next property — each cycle grows faster", color: "purple" }
          ]
        }
      },
      {
        heading: "Diversification Isn't Just for Stocks",
        content: "A portfolio of five identical properties in the same neighborhood is five times the risk, not diversification. Smart portfolio construction means mixing property types (houses, condos, multifamily), locations (different neighborhoods, school districts, employment centers), strategies (some flips for short-term cash, some rentals for long-term wealth), and price points (some affordable bread-and-butter rentals, some higher-end with better appreciation potential). When one market segment struggles, others carry the portfolio."
      },
      {
        heading: "The Cash Flow Tipping Point",
        type: "callout",
        content: "Something magical happens when your portfolio reaches 3-4 stabilized rentals: the combined cash flow starts covering your personal expenses. At this point, you're financially independent from your day job. Every additional property is pure wealth building. Most people never get here because they over-leverage early on, creating negative cash flow that prevents them from saving for the next down payment. Patient, conservative leverage on early properties is what funds aggressive growth later."
      },
      {
        heading: "When to Sell: The Optimization Nobody Discusses",
        type: "tip",
        content: "Portfolio strategy isn't just about buying — knowing when to sell is equally important. A property that was your best performer 5 years ago might now be your weakest. Maybe the neighborhood peaked. Maybe the property needs expensive capital improvements. Selling an underperformer and redeploying the equity into a better-performing market is called capital recycling, and it's how professional investors keep their portfolio's average returns high. Don't fall in love with properties — fall in love with returns."
      }
    ],
    relatedSlugs: ["flip-vs-rent", "ltv-financing", "survive-market-crash", "cap-rates-cash-on-cash"],
    gameConnection: "In Dealbreak, you manage a portfolio of up to three properties simultaneously, balancing flip and rental strategies, managing cash flow across deals, and making sell-or-hold decisions as market conditions change."
  },
  {
    slug: "tenant-management",
    title: "Tenant Management: The Human Side of Real Estate",
    subtitle: "Good tenants make you money. Bad tenants make you question your life choices.",
    icon: "🏠",
    category: "Operations",
    readTime: "6 min",
    difficulty: "intermediate",
    heroImage: "learn_tenant_management",
    seoKeywords: ["tenant management", "landlord tips", "tenant screening", "rental property management", "dealing with tenants"],
    sections: [
      {
        heading: "The Tenant Screening Mistake That Costs Thousands",
        content: "Vacancy is expensive, so when someone applies, there's a temptation to approve them quickly and start collecting rent. Resist it. A bad tenant costs 10x more than a month of vacancy. Between unpaid rent, property damage, legal fees for eviction, and the 3-6 months it takes to remove a non-paying tenant in many states, one bad placement can easily cost $10,000-$20,000. Thorough screening — credit check, income verification (3x rent minimum), references from previous landlords, and a background check — is the most profitable hour you'll spend as a landlord."
      },
      {
        heading: "The Communication Playbook",
        type: "callout",
        content: "Professional landlords have a counterintuitive approach to tenant relationships: they're friendly but firm, responsive but boundaried. Respond to maintenance requests within 24 hours (it prevents small problems from becoming expensive ones). Be clear about lease terms from day one. Document everything in writing. Never make verbal promises. And here's the big one: address late payments immediately, not after the third occurrence. The pattern you allow becomes the standard your tenant expects."
      },
      {
        heading: "The Maintenance Balance",
        content: "There's a sweet spot between neglecting the property (which loses you good tenants and creates expensive deferred maintenance) and over-improving it (which eats your cash flow with zero return). Investment properties should be clean, safe, and functional — not luxury. Fix structural and safety issues immediately. Address cosmetic issues between tenants. And always, always maintain the big-ticket items (roof, HVAC, plumbing) preventatively rather than reactively. A $200 HVAC tune-up prevents a $10,000 replacement."
      },
      {
        heading: "When to Raise Rent (and How)",
        type: "tip",
        content: "Keeping a good tenant at slightly below-market rent is almost always better than raising to market and risking turnover. Turnover costs: lost rent during vacancy (1-2 months), cleaning and repairs ($500-2,000), listing and showing time, and the risk of getting a worse tenant. A good rule: raise rent annually by 2-3% to keep pace with inflation, but stay 5-10% below market to incentivize your tenant to stay. The best tenant is the one who never leaves."
      }
    ],
    relatedSlugs: ["hidden-costs", "common-mistakes", "flip-vs-rent", "portfolio-strategy"],
    gameConnection: "Dealbreak features an interactive tenant communication system where different tenant personality types send you text messages about maintenance requests, complaints, and issues — teaching you to manage the human side of rental investing."
  }
];

export function getArticleBySlug(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES.find(a => a.slug === slug);
}
