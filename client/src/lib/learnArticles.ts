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
  },
  {
    slug: "cap-rate-vs-cash-on-cash-math",
    title: "The Hidden Math of Cap Rate vs Cash-on-Cash",
    subtitle: "Same property, two metrics, two completely different stories.",
    icon: "🧮",
    category: "Financial Metrics",
    readTime: "7 min",
    difficulty: "intermediate",
    heroImage: "learn_cap_vs_coc",
    seoKeywords: [
      "cap rate vs cash on cash",
      "is cap rate or cash on cash more important",
      "how does leverage change cash on cash return",
      "real estate metrics explained",
      "what does a 6% cap rate actually mean",
      "cash on cash return formula",
      "real estate underwriting metrics",
    ],
    sections: [
      {
        heading: "The Same Building, Two Different Truths",
        content: "Picture a $500,000 fourplex throwing off $30,000 a year in NOI. To one investor, that's a 6% cap rate deal — fine, not exciting. To another, that same building is a 14% cash-on-cash machine. They're not arguing about the property. They're using two metrics that measure entirely different things, and the gap between them is where most of the misunderstandings in real estate happen. Cap rate measures the asset. Cash-on-cash measures what happened to your wallet."
      },
      {
        heading: "Why Cap Rate Doesn't Care About Your Loan",
        content: "Cap rate is NOI divided by purchase price. That's it — no mortgage, no down payment, no closing costs. This is its whole superpower: it lets you compare a $300K duplex against a $1.2M apartment building on equal footing, regardless of how either one is financed. Brokers use it because it strips out the financing noise and forces a comparison of the underlying real estate. If you ever find yourself comparing two properties and one looks dramatically better than the other, cap rate is the sanity check that tells you whether the building itself is actually a better asset."
      },
      {
        heading: "Cash-on-Cash: Where Leverage Sneaks In",
        type: "infographic",
        content: "Watch what happens to the same $500K / $30K NOI fourplex as you change how you pay for it.",
        infographicData: {
          type: "comparison",
          title: "Same Property, Different Financing",
          items: [
            { label: "All Cash ($500K in)", value: "6% CoC — equals the cap rate", color: "blue", percentage: 30 },
            { label: "25% down ($125K + 6.5% loan)", value: "~10% CoC after debt service", color: "emerald", percentage: 50 },
            { label: "20% down ($100K + 7% loan)", value: "~13% CoC — looks great", color: "emerald", percentage: 65 },
            { label: "10% down ($50K + 7.5% loan)", value: "~22% CoC OR negative — depending on rates", color: "amber", percentage: 85 },
            { label: "Over-leveraged (5% down)", value: "Often negative cash flow despite 'great' deal", color: "red", percentage: 95 }
          ]
        }
      },
      {
        heading: "The Trap Nobody Warns Beginners About",
        type: "warning",
        content: "Chasing cash-on-cash by stacking leverage feels brilliant until rates move or one tenant leaves. A deal that pencils at 18% CoC with 90% LTV can flip to negative the month a HVAC compressor fails or your insurance renews 35% higher. The math that made you a genius on paper makes you a forced seller in real life. Pros use cash-on-cash to evaluate what their money is doing — but they stress-test it against vacancy, rate hikes, and a $15K surprise repair before they sign anything."
      },
      {
        heading: "When to Use Which",
        content: "Cap rate is the right metric when you're comparing properties, evaluating market trends, or trying to understand whether a neighborhood is overheating. If cap rates in your target market compressed from 7% to 4.5% in three years, the market is telling you something — usually that prices are getting ahead of fundamentals. Cash-on-cash is the right metric when you're deciding whether to actually pull the trigger. It answers the only question that matters at closing: 'Is this what my $80,000 will earn me, after the bank gets paid?'"
      },
      {
        heading: "The Pro Move: Calculate Both, Always",
        type: "tip",
        content: "Experienced investors never look at one without the other. A 9% cap rate with a 4% cash-on-cash return is a warning — your financing is eating most of the returns. A 5% cap rate with a 14% cash-on-cash return means you're dependent on cheap debt and should ask what happens at refinance. The two numbers in conversation tell you the deal's whole story. The single number in isolation tells you what the seller wants you to hear."
      }
    ],
    relatedSlugs: ["cap-rates-cash-on-cash", "ltv-financing", "what-is-a-pro-forma"],
    gameConnection: "In Dealbreak, every pro forma shows both your cap rate and your cash-on-cash side by side, then watches what happens when financing assumptions or expenses move on you — turning the abstract math into a felt experience."
  },
  {
    slug: "why-first-time-flippers-lose",
    title: "Why Most First-Time Flippers Lose Money",
    subtitle: "An honest postmortem of the seven habits that kill rookie flips.",
    icon: "🪓",
    category: "Strategy",
    readTime: "8 min",
    difficulty: "intermediate",
    heroImage: "learn_flipper_failure",
    seoKeywords: [
      "why do flippers lose money",
      "common house flipping mistakes",
      "first time house flip lessons",
      "house flipping ARV mistakes",
      "how much do house flippers actually make",
      "fix and flip risks",
      "flipping houses for beginners reality",
    ],
    sections: [
      {
        heading: "The Industry Doesn't Talk About the Losers",
        content: "HGTV doesn't run a show called 'Brad Lost $42,000 On His First Flip.' But that's the median first-time flipper experience once you net out the labor they didn't pay themselves for, the carrying costs they forgot, and the ARV they convinced themselves was real. ATTOM data on completed flips shows gross margins look great in headlines — net margins after honest accounting tell a much smaller story. The math isn't broken. The discipline is."
      },
      {
        heading: "Failure Mode #1: ARV Anchoring",
        content: "Beginners pull three comps from the MLS, pick the highest one, and call it the ARV. Pros pull twelve, throw out the top two and bottom two, and adjust the rest for square footage, lot size, condition, and time-on-market. Then they shave 5%. The difference between a 'top of comps' ARV and a realistic ARV on a $400K flip is usually $30-50K — which is also approximately the entire margin on the deal. If your spreadsheet only works at the optimistic ARV, you don't have a deal. You have a hope."
      },
      {
        heading: "Failure Mode #2: The Rehab Number You Wanted to Hear",
        type: "warning",
        content: "First-time flippers underbid rehab by 30-40% on average. Not because the contractors lied, but because the bid covered the work they specified, not the work the house actually needed. The kitchen quote didn't include the rotted subfloor under the dishwasher. The bathroom quote didn't include the lead paint discovered after demo. The 'cosmetic only' assumption fell apart the moment they opened the wall. A working rule: take the contractor's number, add 20% for what they didn't see, and add another 10% for what nobody could see."
      },
      {
        heading: "Failure Mode #3: Carrying Costs Are Real Money",
        content: "Carrying costs on a $350K flip — mortgage interest, taxes, insurance, utilities, lawn care, HOA — typically run $3,000-5,000 a month. Beginners pencil in 'three months to renovate' on a project that takes seven, then sit on the market another two before accepting an offer. Nine months of carrying costs can vaporize $35,000 from a deal that already had thin margins. The clock is the second-largest enemy of a first-time flipper, right behind their own optimism."
      },
      {
        heading: "Failure Mode #4: 'I'll Save Money Doing It Myself'",
        type: "callout",
        content: "DIY math looks beautiful on a spreadsheet and brutal in reality. Even if your hourly labor really is free, you're not faster than a crew. A pro tile setter does in two days what takes you three weekends. Three weekends = three more months of carrying costs while the project sits half-finished. The opportunity cost of DIY isn't your hourly rate — it's the carrying costs you accumulate while doing it slower than someone whose job it is. Most successful flippers hire out everything except project management."
      },
      {
        heading: "Failure Mode #5: Buying In a Market That's About to Soften",
        content: "Flips take 4-9 months from purchase to sale. A market that supported your ARV when you bought may have moved 5-10% by the time you list. Rising rates, increased inventory, or a regional employer announcing layoffs can crater your exit price in a window that feels random but is actually visible months in advance. Pros watch days-on-market trends, list-to-sale price ratios, and inventory levels weekly — and they walk away from deals when those signals start trending wrong, even if the property itself is fine."
      },
      {
        heading: "The Discipline That Separates Pros",
        type: "tip",
        content: "Professional flippers underwrite 50-100 deals to buy one. They walk away from 95%+ of properties they look at. They have a maximum allowable offer formula — usually 70% of ARV minus rehab — and they don't negotiate it upward because they 'love the property.' Loving the property is exactly the disease this discipline cures. The rule isn't there because deals are hard to find. It's there because the alternative is being one bad deal away from a forced sale."
      }
    ],
    relatedSlugs: ["flip-vs-rent", "due-diligence", "common-mistakes"],
    gameConnection: "Dealbreak puts you through the full flip cycle — purchase, rehab, market timing, sale — and shows you the gap between your projected and actual outcomes after each deal, surfacing exactly which of these failure modes you walked into."
  },
  {
    slug: "inspection-red-flags-30-seconds",
    title: "Reading a Property: 7 Inspection Red Flags Pros Spot in 30 Seconds",
    subtitle: "What experienced investors notice on the first walkthrough that beginners miss completely.",
    icon: "🔍",
    category: "Risk Management",
    readTime: "7 min",
    difficulty: "intermediate",
    heroImage: "learn_inspection_red_flags",
    seoKeywords: [
      "what to look for inspecting a house",
      "real estate red flags first walkthrough",
      "Federal Pacific electrical panel danger",
      "Zinsco panel replacement",
      "foundation crack patterns to worry about",
      "signs of basement water damage",
      "how to inspect a house before buying",
      "what does a roof tell you about a house",
    ],
    sections: [
      {
        heading: "Pros Walk a House Differently",
        content: "Watch an experienced investor walk a property and you'll notice they barely look at the kitchen finishes everyone else is admiring. They're scanning floors for slope, ceilings for stain rings, baseboards for moisture line, and the electrical panel for a brand name. They're not being dramatic about it — they've just learned that the cheap-to-fix things scream while the expensive things whisper. Here are the seven whispers that change deals."
      },
      {
        heading: "1. The Electrical Panel Brand",
        type: "warning",
        content: "Open the panel cover and read the label. Two names should make your stomach drop: Federal Pacific Electric (Stab-Lok) and Zinsco. Both have decades of failure history — breakers that don't trip during overloads, leading to fires. Insurance carriers increasingly refuse to write policies on houses with these panels, which means the next buyer will face the same forced replacement. Budget $2,500-5,000 for full panel swap and add it to your offer math, not your hopeful renovation list."
      },
      {
        heading: "2. The Basement Smell",
        content: "Walk into a basement and breathe before you turn the lights on. A faint mustiness means humidity. A real damp smell — that earthy, mineral, slightly sweet scent — means active water intrusion happening regularly. Look for efflorescence (white powder on block walls), rust on the bottom of metal supports, and the height of the paint line on wood framing. Water that's been there long enough to leave a tide mark has been there long enough to compromise everything between the slab and that mark."
      },
      {
        heading: "3. Foundation Cracks: Which Patterns Matter",
        type: "infographic",
        content: "Not every foundation crack is a deal-killer. Some are completely normal. The pattern is what matters.",
        infographicData: {
          type: "scale",
          title: "Foundation Crack Severity",
          items: [
            { label: "Hairline vertical, <1/8\"", value: "Normal settling — monitor only", color: "emerald", percentage: 15 },
            { label: "Vertical 1/8\"-1/4\"", value: "Investigate, may need epoxy injection", color: "blue", percentage: 35 },
            { label: "Diagonal at corners", value: "Differential settlement — engineer needed", color: "amber", percentage: 60 },
            { label: "Horizontal across wall", value: "Lateral pressure failure — major structural", color: "red", percentage: 90 },
            { label: "Stair-step in block, widening", value: "Active movement — walk away or get bid", color: "red", percentage: 95 }
          ]
        }
      },
      {
        heading: "4. Granules in the Gutters",
        content: "Open the downspout cleanout or peek into the gutter run. If you see a layer of asphalt sand-like granules, the roof is shedding its protective coating. Combined with shingles that look bald or curled at the edges, that roof has 1-3 years left. Get a quote before you write the offer — depending on the property, a tear-off and replace runs $9,000-25,000+. New roof needed isn't a deal-killer; new roof needed that you didn't budget for is."
      },
      {
        heading: "5. The Marble Test on the Floor",
        type: "tip",
        content: "Bring a marble. Set it down in the middle of any room with hardwood or tile and watch what it does. Old houses settle a little — a marble that drifts slowly is normal. A marble that picks up speed across the room means you have meaningful slope, which usually means joist sag, foundation movement, or termite damage. Then check the doors in that room — if they don't close cleanly, the house is telling you the same story twice. Two stories that match deserve a structural engineer's opinion before you negotiate."
      },
      {
        heading: "6. The Pipe at the Water Meter",
        content: "Crouch down at the main water meter or the supply line entering the house and look at the metal. Bright copper means modern repipe — great. PEX (colored plastic) means somebody renovated recently — also fine. Galvanized steel (dull gray, often with crusty mineral buildup at joints) is the warning. Galvanized supply lines typically last 50-70 years, restrict flow as they age, and need full repipe — easily $8,000-20,000 in a single-family. If the visible pipe is galvanized, assume the rest of the house is too."
      },
      {
        heading: "7. The HVAC Nameplate Date",
        content: "Walk around the outdoor condenser unit and find the metal nameplate. There's a manufacture date stamped on it, sometimes encoded in the serial number. Anything over 12 years old is on borrowed time; anything over 18 should be priced as 'replace this year.' Look at the indoor air handler too — sometimes the outdoor unit was replaced but the indoor unit is the original from 1997. A full system swap on a 2,000 sqft house runs $8,000-15,000. Budget it now or be surprised in July."
      }
    ],
    relatedSlugs: ["due-diligence", "hidden-costs", "common-mistakes"],
    gameConnection: "Dealbreak's inspection and contractor walkthrough phases surface these exact issues — Federal Pacific panels, galvanized plumbing, foundation settling — and reward you for spending the diligence dollars to find them before you sign, just like the real walkthrough discipline pros develop."
  }
];

export function getArticleBySlug(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES.find(a => a.slug === slug);
}
