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

const ARTICLE_DATA: Record<string, { title: string; subtitle: string; category: string; readTime: string; difficulty: string; keywords: string[]; sections: { heading: string; content: string }[] }> = {
  "what-is-a-pro-forma": {
    title: "What Is a Pro Forma in Real Estate?",
    subtitle: "The one document that separates amateurs from professionals",
    category: "Fundamentals",
    readTime: "5 min",
    difficulty: "Beginner",
    keywords: ["real estate pro forma", "property financial analysis", "investment spreadsheet", "NOI calculation", "real estate underwriting"],
    sections: [
      { heading: "Your Deal's Truth Serum", content: "The spreadsheet is more important than the property. A gorgeous Victorian can bankrupt you if the numbers don't work. The pro forma strips away emotional appeal and reveals whether a property actually makes money." },
      { heading: "The Anatomy of a Pro Forma", content: "Every pro forma has two sides — income vs. expenses. Gross rental income, vacancy loss, property taxes, insurance, maintenance reserves, and net operating income." },
      { heading: "Why Your Assumptions Will Make or Break You", content: "The skill is knowing whether your inputs reflect reality. Bad vacancy or maintenance assumptions can flip a profitable deal into a cash drain." },
      { heading: "Flip Pro Forma vs. Rental Pro Forma", content: "Rental pro formas model ongoing cash flow. Flip pro formas model a single transaction: purchase price plus renovation costs vs. sale price." },
      { heading: "The Break-Even Occupancy Rate", content: "The percentage of the year your property needs to be rented just to cover costs. If it's 97%, one missed rent payment puts you underwater." }
    ]
  },
  "cap-rates-cash-on-cash": {
    title: "Cap Rates & Cash-on-Cash Returns: The Real Story",
    subtitle: "Two numbers that tell you completely different things about the same deal",
    category: "Financial Metrics",
    readTime: "6 min",
    difficulty: "Beginner",
    keywords: ["cap rate real estate", "cash on cash return", "real estate ROI", "property investment returns", "capitalization rate formula"],
    sections: [
      { heading: "The Metric That Ignores Your Wallet", content: "Cap rate doesn't care how you pay. Formula: NOI / Property Value. Perfect for comparing properties of wildly different sizes and prices." },
      { heading: "The Cap Rate Spectrum", content: "3-4% in premium areas (appreciation play), 5-6% in solid neighborhoods, 7-8% sweet spot, 9-10% higher risk, 11%+ distressed areas." },
      { heading: "Cash-on-Cash: What YOUR Money Earns", content: "Annual Pre-Tax Cash Flow / Total Cash Invested. A 7% cap rate deal can deliver 14% CoC return with smart financing." },
      { heading: "The Inverse Dance", content: "When investors pile into a market, prices rise and cap rates compress. Rapidly compressing cap rates are a warning sign." },
      { heading: "Yield on Cost", content: "For value-add investors: projected NOI after improvements / total cost. How professionals find deals in competitive markets." }
    ]
  },
  "flip-vs-rent": {
    title: "Flip vs. Rent: The Strategy Decision That Changes Everything",
    subtitle: "One makes you money fast. The other makes you money forever. Pick wrong and neither works.",
    category: "Strategy",
    readTime: "7 min",
    difficulty: "Beginner",
    keywords: ["flip or rent property", "real estate strategy", "house flipping vs rental", "buy and hold vs flip", "real estate investment strategy"],
    sections: [
      { heading: "The Adrenaline Play: Flipping", content: "Buy, improve, sell within 3-6 months. A single flip can net $30K-$80K. But profit depends on renovation costs, timeline, and sale price — three variables you can't fully control." },
      { heading: "The Wealth Engine: Renting", content: "Three simultaneous income streams: monthly cash flow, appreciation, and equity buildup. Over 20 years, one rental can generate more wealth than a dozen flips." },
      { heading: "Head-to-Head Comparison", content: "Time to profit, risk level, income type, capital needed, market sensitivity, and tax treatment all differ dramatically between strategies." },
      { heading: "When the Market Picks for You", content: "Flip in hot markets, buy rentals in cold ones. Rising markets inflate flip margins; uncertain markets favor rental patience." },
      { heading: "The BRRRR Strategy", content: "Buy, Rehab, Rent, Refinance, Repeat — combines flipping's value-add with rental's long-term wealth while recycling investment capital." }
    ]
  },
  "due-diligence": {
    title: "Due Diligence: The $500 That Saves You $50,000",
    subtitle: "Why the smartest investors spend money BEFORE they make money",
    category: "Process",
    readTime: "6 min",
    difficulty: "Beginner",
    keywords: ["real estate due diligence", "property inspection", "title search real estate", "home inspection investment", "real estate appraisal"],
    sections: [
      { heading: "The Inspection That Pays for Itself 100x Over", content: "A $300-$500 inspection vs. a $30,000+ foundation repair. Every one of these is common in investment properties priced below market." },
      { heading: "Due Diligence Types", content: "Property inspection catches structural/mechanical issues. Title search reveals liens and disputes. Appraisal validates market value. Market study estimates realistic rent and sale prices." },
      { heading: "Title Searches: The Invisible Landmines", content: "Unpaid tax liens, mechanic's liens, easements, boundary disputes — all transfer to YOU when you buy." },
      { heading: "Comparable Sales Analysis", content: "Analyzing closed sales within a half-mile that match your property's characteristics. Adjusting for differences in condition, size, and lot." },
      { heading: "The Skip-and-Pray Strategy", content: "Properties priced low often have problems. The seller knows. They priced it to attract buyers who won't look closely." }
    ]
  },
  "ltv-financing": {
    title: "LTV & Financing: The Double-Edged Sword of Leverage",
    subtitle: "How borrowing money can make you rich — or bankrupt you overnight",
    category: "Financing",
    readTime: "6 min",
    difficulty: "Intermediate",
    keywords: ["loan to value ratio", "real estate leverage", "LTV mortgage", "real estate financing", "investment property loan"],
    sections: [
      { heading: "Leverage: The Amplifier", content: "80% LTV means a 10% property appreciation gives you 50% return on your investment. But a 10% drop cuts your equity in half." },
      { heading: "The Danger Zone", content: "Interest rates accelerate above 90% LTV. Tiny equity, massive payments, one bad month from trouble." },
      { heading: "The Math That Changes Strategy", content: "Two investors, same property: 30% down at 6.5% vs 10% down at 9% = $563/month difference, $6,756/year extra cost." },
      { heading: "Matching Financing to Strategy", content: "Flips optimize for total loan cost over hold period. Rentals optimize for monthly cash flow with lower rates." },
      { heading: "The Refinancing Power Move", content: "Buy with higher leverage, improve the property, refinance at better terms based on the new appraised value." }
    ]
  },
  "market-conditions": {
    title: "Reading Market Conditions Like a Pro",
    subtitle: "The cyclical patterns that determine when to buy, when to sell, and when to wait",
    category: "Strategy",
    readTime: "6 min",
    difficulty: "Intermediate",
    keywords: ["real estate market cycle", "property market conditions", "when to buy real estate", "real estate timing", "housing market analysis"],
    sections: [
      { heading: "The Four Seasons of Real Estate", content: "Recovery, Expansion, Hyper-Supply, Recession — markets follow 7-18 year cycles. The biggest mistake is buying at peak expansion." },
      { heading: "Strategy Performance by Market", content: "Hot markets favor quick flips but compress margins. Cold markets offer cheap entry but higher vacancy risk. Recovery periods offer the best buying." },
      { heading: "It's Not About National Headlines", content: "Focus on local indicators: Days on Market, Months of Inventory, Rental Vacancy Rate, and Job Growth." },
      { heading: "The Contrarian Edge", content: "During 2009-2012 recovery, investors who bought at 50 cents on the dollar built generational wealth. Direction matters more than timing precision." },
      { heading: "Building Permits as Leading Indicator", content: "A surge in permits means new supply in 12-18 months. A drop means future supply constraints that push prices up." }
    ]
  },
  "rehab-budgets": {
    title: "Rehab Budgets: Where Deals Go to Die (or Thrive)",
    subtitle: "How to plan renovations that actually add value — and avoid the money pit",
    category: "Operations",
    readTime: "6 min",
    difficulty: "Intermediate",
    keywords: ["rehab budget real estate", "renovation costs investment property", "house flip renovation", "contractor management", "property renovation planning"],
    sections: [
      { heading: "The Budget That Always Lies", content: "Your initial rehab budget is wrong. Always. Add a 15-20% contingency buffer for hidden water damage, outdated wiring, and plumbing surprises." },
      { heading: "Common Renovation Cost Ranges", content: "Kitchen $10K-$40K+, Bathroom $5K-$20K, Roof $8K-$25K, HVAC $5K-$15K, Cosmetic $3K-$8K, Paint+Flooring $2K-$6K." },
      { heading: "Picking Your Contractor", content: "Budget, Standard, and Premium tiers. A premium contractor who finishes 6 weeks earlier might actually be cheaper due to reduced holding costs." },
      { heading: "The No-Rehab Flip", content: "Target properties where the previous owner already improved but needs to sell quickly. Smaller margins, zero construction risk." },
      { heading: "Cash vs. Finance Decision", content: "Paying cash for rehab keeps your loan smaller. Financing preserves cash reserves. Never finance rehab above 90% LTV." }
    ]
  },
  "common-mistakes": {
    title: "The 5 Mistakes That Bankrupt New Investors",
    subtitle: "Every one of these looks reasonable until it costs you everything",
    category: "Risk Management",
    readTime: "7 min",
    difficulty: "Beginner",
    keywords: ["real estate investment mistakes", "beginner investor errors", "real estate bankruptcy", "property investment risks", "overleveraging real estate"],
    sections: [
      { heading: "The Fantasy Rent Number", content: "Rental rates should be based on what similar properties are actually renting for RIGHT NOW — not aspirational listings sitting vacant for 3 months." },
      { heading: "The Invisible Expenses", content: "Beyond mortgage+taxes+insurance: maintenance reserves, management fees, capex reserves, landscaping, pest control, legal, accounting." },
      { heading: "The Leverage Trap", content: "70% LTV survives a 20% drop. 90% LTV goes underwater with just a 10% drop. 95% LTV is destroyed by a 5% decline." },
      { heading: "Speed Over Safety", content: "Urgency is almost always manufactured. The properties that look like the best deals are often priced low because they have problems." },
      { heading: "Running on Empty", content: "Without cash reserves, any common scenario forces a distressed sale. Keep 3-6 months of expenses per property in reserve." }
    ]
  },
  "one-percent-rule": {
    title: "The 1% Rule and Other Quick Screening Filters",
    subtitle: "How to evaluate 50 properties in an hour without a spreadsheet",
    category: "Advanced Strategy",
    readTime: "5 min",
    difficulty: "Intermediate",
    keywords: ["1 percent rule real estate", "property screening filters", "quick property analysis", "50 percent rule", "real estate rules of thumb"],
    sections: [
      { heading: "Why You Need a Filter", content: "You can't build a detailed pro forma for every property. Quick filters eliminate properties that have no chance of working." },
      { heading: "The Quick-Filter Toolkit", content: "1% Rule (rent ≥ 1% of price), 50% Rule (half of rent goes to expenses), 70% Rule for flips (≤70% of ARV minus repairs), 2% Rule (unusually strong if rent exceeds 2%)." },
      { heading: "When Rules of Thumb Fail", content: "Expensive coastal cities rarely pass the 1% test but still cash flow. Cheap rural markets always pass but have high vacancy." },
      { heading: "Building Your Personal Filter Stack", content: "Layer filters: price range, neighborhoods, property types, bed/bath counts. Goal is to eliminate 90% of listings quickly." }
    ]
  },
  "survive-market-crash": {
    title: "How to Survive (and Profit From) a Market Crash",
    subtitle: "What separates investors who go bankrupt from those who build empires during downturns",
    category: "Advanced Strategy",
    readTime: "7 min",
    difficulty: "Advanced",
    keywords: ["survive real estate crash", "real estate downturn strategy", "recession proof investing", "buy during market crash", "real estate market crash"],
    sections: [
      { heading: "The Crash Is Coming", content: "Since 1900, significant downturns roughly every 15-20 years. The question isn't whether but whether you're positioned to survive it." },
      { heading: "The Bankruptcy Cascade", content: "Market drops → values below loans → rents soften → cash flow negative → reserves drain → forced sales at losses." },
      { heading: "The Crash-Proof Portfolio", content: "Low leverage (70-80% LTV), strong cash reserves (6+ months per property), positive cash flow even if rent drops 10%." },
      { heading: "Profiting During Panic", content: "During downturns, prices drop 30-50% below replacement cost. Properties that never cash flow at peak suddenly generate 12%+ cap rates." },
      { heading: "Recession Indicators", content: "Inverted yield curve, rising delinquency rates, construction exceeding absorption, rapidly compressing cap rates." }
    ]
  },
  "hidden-costs": {
    title: "The Hidden Costs Nobody Tells You About",
    subtitle: "14 expenses that don't show up in the listing — but definitely show up on your bank statement",
    category: "Financial Metrics",
    readTime: "6 min",
    difficulty: "Intermediate",
    keywords: ["hidden costs real estate", "true cost property investment", "real estate expenses", "investment property costs", "landlord expenses"],
    sections: [
      { heading: "The Costs You See and the 10 You Don't", content: "Below the obvious costs lurk expenses representing 30-40% of gross rental income. Missing even a few flips a profitable deal into a money pit." },
      { heading: "The Full Expense Stack", content: "Maintenance, capital expenditures, property management, vacancy loss, closing costs, legal/accounting, pest control, landscaping." },
      { heading: "The Expense That Eats Flippers Alive", content: "Holding costs: mortgage interest, taxes, insurance, utilities per month. A flip stretching 3 extra months costs $5,700+ straight from profit." },
      { heading: "The Self-Management Illusion", content: "Midnight plumbing emergencies, tenant showings, eviction research. Budget 5% of rent as self-management fee minimum." },
      { heading: "Tax Implications", content: "Rental depreciation and interest deductions are good. Flips taxed as ordinary income (30%+) vs. capital gains (15-20%) is bad." }
    ]
  },
  "portfolio-strategy": {
    title: "Building a Real Estate Portfolio: From One Property to Ten",
    subtitle: "The compounding strategy that turns a single deal into generational wealth",
    category: "Advanced Strategy",
    readTime: "8 min",
    difficulty: "Advanced",
    keywords: ["real estate portfolio strategy", "multiple investment properties", "scaling real estate", "BRRRR strategy", "real estate wealth building"],
    sections: [
      { heading: "The Portfolio Mindset Shift", content: "Deal-by-deal vs. systems thinking. How does each property fit the portfolio? Does it diversify risk? Does it fund the next acquisition?" },
      { heading: "The Wealth Compounding Cycle", content: "Acquire → Improve → Refinance → Repeat. Each cycle pulls equity out and redeploys into the next property." },
      { heading: "Diversification", content: "Mix property types, locations, strategies, and price points. When one market segment struggles, others carry the portfolio." },
      { heading: "The Cash Flow Tipping Point", content: "At 3-4 stabilized rentals, combined cash flow covers personal expenses. Financial independence from your day job." },
      { heading: "Capital Recycling", content: "Selling underperformers and redeploying equity into better markets. Don't fall in love with properties — fall in love with returns." }
    ]
  },
  "tenant-management": {
    title: "Tenant Management: The Human Side of Real Estate",
    subtitle: "Good tenants make you money. Bad tenants make you question your life choices.",
    category: "Operations",
    readTime: "6 min",
    difficulty: "Intermediate",
    keywords: ["tenant management", "landlord tips", "tenant screening", "rental property management", "dealing with tenants"],
    sections: [
      { heading: "The Screening Mistake That Costs Thousands", content: "A bad tenant costs 10x more than a month of vacancy. Between unpaid rent, damage, and legal fees — one bad placement costs $10K-$20K." },
      { heading: "The Communication Playbook", content: "Friendly but firm, responsive but boundaried. Respond within 24 hours. Document everything. Address late payments immediately." },
      { heading: "The Maintenance Balance", content: "Clean, safe, functional — not luxury. Maintain big-ticket items preventatively. A $200 HVAC tune-up prevents a $10,000 replacement." },
      { heading: "When to Raise Rent", content: "Keep good tenants at slightly below-market rent. Turnover costs 1-2 months vacancy plus $500-2,000 in repairs. Raise 2-3% annually, stay 5-10% below market." }
    ]
  }
};

const FAQ_DATA = [
  { question: "Is Dealbreak free to play?", answer: "Yes. The full game is free to play with no signup required. Optional premium boosts are available for players who want extra cash or time, but they're never required to win." },
  { question: "Will this teach me real estate investing?", answer: "Dealbreak teaches the analytical framework that professional investors use — pro forma modeling, cap rate analysis, due diligence, and risk assessment. While it's a simulation and not financial advice, the skills transfer directly to evaluating real deals." },
  { question: "How long does a game take?", answer: "A typical game takes 20-40 minutes. You manage a 52-month timeline, evaluating properties, running numbers, and executing deals. Each playthrough is different thanks to randomized properties, market conditions, and events." },
  { question: "What strategies can I use?", answer: "You can flip properties (buy, renovate, sell for profit) or rent them out (buy, hold, collect monthly income). Each strategy has different risk-reward profiles, and the best players learn to mix both depending on market conditions and their financial position." }
];

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "dealbreaksimulator.com";
  return `${proto}://${host}`;
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
      return {
        title: article.title + " | " + SITE_NAME,
        description: article.subtitle + ". Learn real estate investing concepts with Dealbreak's free educational guides.",
        ogType: "article",
        canonical: baseUrl + "/learn/" + slug,
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.subtitle,
            "url": baseUrl + "/learn/" + slug,
            "author": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
            "publisher": { "@type": "Organization", "name": "Dealbreak", "url": baseUrl },
            "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl },
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
            "articleBody": article.sections.map(s => s.heading + ": " + s.content).join(" ")
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
        ]
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
    const heroAsset = resolveHashedAsset('Gemini_hero', '.webp');
    if (heroAsset) {
      preloads.push(`<link rel="preload" as="image" type="image/webp" href="/assets/${heroAsset}" fetchpriority="high" />`);
    }
    html = html.replace('</head>', `    ${preloads.join('\n    ')}\n  </head>`);
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

export function generateSitemap(baseUrl: string): string {
  const urls = [
    { loc: "/", priority: "1.0", changefreq: "weekly" },
    { loc: "/learn", priority: "0.9", changefreq: "weekly" },
    { loc: "/game", priority: "0.8", changefreq: "monthly" },
    ...Object.keys(ARTICLE_DATA).map(slug => ({
      loc: `/learn/${slug}`,
      priority: "0.8",
      changefreq: "monthly" as const
    })),
    { loc: "/what-is-dealbreak-simulator", priority: "0.9", changefreq: "monthly" },
    { loc: "/tools", priority: "0.9", changefreq: "weekly" },
    { loc: "/tools/flip-or-rent", priority: "0.9", changefreq: "monthly" },
    { loc: "/tools/deal-scorecard", priority: "0.9", changefreq: "monthly" },
    { loc: "/terms", priority: "0.3", changefreq: "yearly" },
    { loc: "/privacy", priority: "0.3", changefreq: "yearly" },
  ];

  const today = new Date().toISOString().split("T")[0];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${baseUrl}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
