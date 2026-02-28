export interface LearnArticle {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  category: string;
  readTime: string;
  sections: { heading: string; content: string }[];
  relatedSlugs: string[];
  gameConnection: string;
}

export const LEARN_ARTICLES: LearnArticle[] = [
  {
    slug: "what-is-a-pro-forma",
    title: "What Is a Pro Forma in Real Estate?",
    subtitle: "The financial blueprint behind every investment decision",
    icon: "📊",
    category: "Fundamentals",
    readTime: "5 min",
    sections: [
      {
        heading: "The Investor's Crystal Ball",
        content: "A pro forma is a forward-looking financial model that projects the expected income, expenses, and returns of a real estate investment. Think of it as a detailed \"what if\" analysis — before you commit a single dollar, you map out every cost and revenue stream to see whether a deal actually makes financial sense. Professional investors never buy a property without one."
      },
      {
        heading: "What Goes Into a Pro Forma",
        content: "A complete pro forma includes several key components. On the income side, you estimate rental income based on comparable properties in the area, factoring in a realistic vacancy rate (typically 5-10% for residential properties). On the expense side, you account for property taxes, insurance, maintenance reserves, property management fees, and any homeowner association dues. The difference between income and expenses gives you your Net Operating Income (NOI) — the single most important number in real estate investing."
      },
      {
        heading: "Why Assumptions Matter More Than Numbers",
        content: "Here's what separates good investors from bad ones: the quality of their assumptions. Anyone can plug numbers into a spreadsheet. The skill lies in knowing whether those numbers reflect reality. If you assume 3% vacancy but the neighborhood actually runs at 8%, your projected returns will be wildly optimistic. If you underestimate maintenance costs, you'll face cash flow surprises. A pro forma is only as good as the research behind it — which is why due diligence is so critical before committing to a deal."
      },
      {
        heading: "Pro Forma for Flips vs. Rentals",
        content: "The pro forma looks different depending on your strategy. For a rental property, you're modeling ongoing cash flow — monthly rent minus monthly expenses, projected over years. For a flip, you're modeling a one-time transaction: purchase price plus renovation costs versus the expected sale price. Each strategy has different risk profiles and requires different assumptions. Flips are sensitive to renovation costs and market timing. Rentals are sensitive to vacancy rates and long-term expense growth."
      }
    ],
    relatedSlugs: ["cap-rates-cash-on-cash", "flip-vs-rent", "due-diligence"],
    gameConnection: "In Dealbreak, you build a pro forma for every property before deciding to buy. The game challenges you to make realistic assumptions — and then shows you what happens when reality doesn't match your projections."
  },
  {
    slug: "cap-rates-cash-on-cash",
    title: "Understanding Cap Rates & Cash-on-Cash Returns",
    subtitle: "The two metrics every real estate investor must know",
    icon: "📈",
    category: "Financial Metrics",
    readTime: "6 min",
    sections: [
      {
        heading: "Cap Rate: Measuring Property Performance",
        content: "The capitalization rate (cap rate) measures a property's income relative to its value, independent of how you finance it. The formula is simple: Cap Rate = Net Operating Income ÷ Property Value. A property generating $12,000 in annual NOI with a value of $150,000 has an 8% cap rate. Cap rates let you compare properties of different sizes and prices on an apples-to-apples basis. Generally, higher cap rates suggest higher returns but also higher risk — a property in a rough neighborhood might have a 12% cap rate, while a luxury condo downtown might only offer 4%."
      },
      {
        heading: "Cash-on-Cash Return: What Your Money Earns",
        content: "While cap rate ignores financing, Cash-on-Cash (CoC) return measures the actual return on the cash you personally invest. The formula: CoC = Annual Pre-Tax Cash Flow ÷ Total Cash Invested. If you put $40,000 down on a property and it generates $4,800 in annual cash flow after all expenses and mortgage payments, your CoC return is 12%. This metric matters because most investors use leverage (loans) to buy property. A deal with a modest cap rate can still deliver strong CoC returns if you finance it well."
      },
      {
        heading: "What's a 'Good' Return?",
        content: "There's no universal answer, but experienced investors typically look for cap rates between 6-10% for residential rentals. Below 5% is generally considered low-return (unless you're banking on appreciation). Above 10% often signals higher risk or a distressed property. For Cash-on-Cash returns, many investors target 8-12% as a healthy range. Remember: these are guidelines, not rules. A 5% cap rate in a rapidly appreciating market might outperform an 8% cap rate in a declining one when you factor in property value growth."
      },
      {
        heading: "The Relationship Between Cap Rate and Price",
        content: "Cap rates and property prices move inversely. When investors compete for properties in a hot market, prices get bid up, which pushes cap rates down. In a cold market, properties sit longer, prices soften, and cap rates rise. Understanding this relationship helps you gauge whether a market is overheated or presenting opportunities. If cap rates in an area have compressed from 8% to 4% over a few years, it might mean properties are overpriced relative to their income — a warning sign for rental investors."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "ltv-financing", "market-conditions"],
    gameConnection: "Dealbreak calculates your cap rate and cash-on-cash return in real time as you adjust your pro forma inputs. The results panel shows whether your projections meet typical investment benchmarks."
  },
  {
    slug: "flip-vs-rent",
    title: "Flip vs. Rent: Choosing Your Strategy",
    subtitle: "Two paths to profit with very different risk profiles",
    icon: "🔄",
    category: "Strategy",
    readTime: "6 min",
    sections: [
      {
        heading: "The Flip Strategy",
        content: "Flipping means buying a property, improving it, and selling it for a profit — ideally within a few months. The appeal is obvious: a single successful flip can generate tens of thousands of dollars in profit relatively quickly. But flipping comes with concentrated risk. Your profit depends on three variables you can't fully control: renovation costs (contractors are notoriously unpredictable), timeline (every extra month costs you in holding costs like loan interest and taxes), and sale price (which depends on market conditions at the time you list)."
      },
      {
        heading: "The Rental Strategy",
        content: "Renting means buying a property and holding it long-term, collecting monthly rent from tenants. The returns are slower but steadier. A good rental property generates positive monthly cash flow while your tenant effectively pays down your mortgage. Over time, you benefit from three wealth-building forces: cash flow (monthly income after expenses), appreciation (the property's value increasing over time), and equity buildup (your loan balance decreasing with each payment). The trade-off is that your capital is tied up for years, and you take on landlord responsibilities."
      },
      {
        heading: "When to Flip",
        content: "Flipping works best in rising markets where you can reasonably expect sale prices to hold or increase during your renovation period. It works when you can identify undervalued properties with clear improvement potential — cosmetic fixers are ideal because the renovation is straightforward and relatively predictable. Flipping is riskier in declining or uncertain markets because you could finish your renovation only to find that comparable sales have dropped. Time is your enemy in a flip — every day you hold the property costs money."
      },
      {
        heading: "When to Rent",
        content: "Renting works best when a property's rental income comfortably exceeds its expenses, creating reliable monthly cash flow. It's a better strategy when market conditions are uncertain because you can wait out downturns while collecting rent. Renting also provides tax advantages — you can deduct mortgage interest, property taxes, insurance, and depreciation from your rental income. The key risk factors for rentals are vacancy (periods with no tenant), maintenance costs, and problem tenants. Finding good tenants and maintaining the property well are essential skills for long-term rental success."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "rehab-budgets", "market-conditions"],
    gameConnection: "In Dealbreak, you choose between flip and rent strategies for each property you buy. The game models realistic timelines, costs, and outcomes for both — including surprise expenses, market shifts, and tenant issues."
  },
  {
    slug: "due-diligence",
    title: "Due Diligence: Why Inspections Matter",
    subtitle: "The research that separates successful investors from costly mistakes",
    icon: "🔍",
    category: "Process",
    readTime: "5 min",
    sections: [
      {
        heading: "What Is Due Diligence?",
        content: "Due diligence is the investigation process you conduct before committing to a purchase. In real estate, this typically includes a property inspection (to identify physical issues), a title search (to verify legal ownership and uncover liens), an appraisal (to confirm the property's market value), and a market study (to understand rental rates and comparable sales in the area). Each type of investigation costs money and time, but skipping them is a gamble that experienced investors rarely take."
      },
      {
        heading: "The Cost of Skipping Inspections",
        content: "When you skip due diligence, you're essentially buying blind. That bargain property might have a cracked foundation ($30,000+ to repair), a failing roof ($15,000+), knob-and-tube wiring ($20,000+ to replace), or termite damage that compromises structural integrity. These aren't hypothetical scenarios — they're common issues in investment properties, especially those priced below market. The inspection fee (typically $300-500 for a residential property) is trivial compared to the cost of discovering a major problem after you've closed."
      },
      {
        heading: "Title Searches and Hidden Liens",
        content: "A title search examines the property's legal history to ensure the seller actually has the right to sell it and that no hidden claims exist against the property. Common issues uncovered in title searches include unpaid tax liens, mechanic's liens from unpaid contractor work, easements that limit what you can do with the property, and boundary disputes with neighbors. Title insurance protects you from claims that arise after purchase, but the search itself is what reveals known issues before you close."
      },
      {
        heading: "Market Studies and Comparable Analysis",
        content: "A market study helps you validate your financial assumptions. By examining recent sales of similar properties (\"comps\") and current rental listings in the area, you can estimate realistic sale prices and rental rates. Without this research, you're guessing — and optimistic guesses are the number one cause of failed real estate investments. A thorough market study also reveals trends: is the neighborhood improving or declining? Are rents rising or stagnating? Is there new construction that could increase competition? This context shapes your entire investment thesis."
      }
    ],
    relatedSlugs: ["what-is-a-pro-forma", "common-mistakes", "rehab-budgets"],
    gameConnection: "Dealbreak lets you choose which investigations to conduct — or skip — for each property. Skipping due diligence saves time and money upfront but can lead to surprise repair costs and bad assumptions that tank your deal."
  },
  {
    slug: "ltv-financing",
    title: "How LTV & Financing Affects Your Deal",
    subtitle: "Understanding leverage and why your loan terms change everything",
    icon: "🏦",
    category: "Financing",
    readTime: "6 min",
    sections: [
      {
        heading: "What Is Loan-to-Value (LTV)?",
        content: "Loan-to-Value ratio represents how much of a property's value you're borrowing versus how much you're paying with your own cash. An 80% LTV on a $200,000 property means you're borrowing $160,000 and putting $40,000 down. LTV is one of the most important numbers in real estate investing because it directly affects your interest rate, monthly payments, and risk exposure. Lenders use LTV to gauge their risk — the more you borrow relative to the property's value, the riskier the loan is for them."
      },
      {
        heading: "The Leverage Trade-off",
        content: "Leverage is a double-edged sword. With a high LTV (say 90%), you're putting less cash in, which means your Cash-on-Cash returns can be amplified if the deal goes well. But you're also making higher monthly payments, paying more interest, and leaving almost no equity cushion. If the property value drops even 10%, you're underwater — owing more than the property is worth. With a low LTV (say 60%), you're putting more cash in, which lowers your CoC returns but gives you lower payments, better interest rates, and a substantial equity buffer against market declines."
      },
      {
        heading: "How Interest Rates Scale with Risk",
        content: "Lenders don't offer the same interest rate regardless of LTV. Rates typically increase as LTV rises, with a dramatic jump in the \"danger zone\" above 90% LTV. At 70% LTV, you might get a 6.5% rate. At 80%, maybe 7%. At 90%, it could jump to 8.5%. At 95%, you might be looking at 10%+ with additional fees. This pricing reflects the lender's risk — and it should also make you think carefully about how much leverage you're taking on. Every percentage point of interest compounds over the life of the loan."
      },
      {
        heading: "Financing Strategy for Different Deals",
        content: "Your financing strategy should match your investment strategy. For flips, you want to minimize holding costs, so consider the total cost of the loan (interest + fees) over your expected hold period — sometimes a higher rate with lower fees is cheaper for a 4-month flip than a lower rate with high origination costs. For rentals, you're optimizing for monthly cash flow, so a lower rate matters more even if it means a larger down payment. Also consider whether you can finance renovation costs as part of the loan — this preserves your cash but increases your monthly payment and total interest."
      }
    ],
    relatedSlugs: ["cap-rates-cash-on-cash", "what-is-a-pro-forma", "common-mistakes"],
    gameConnection: "In Dealbreak, a single LTV slider drives your interest rate, loan fees, and monthly payment. Push it too high into the danger zone and watch your costs skyrocket — a lesson many real investors learn the hard way."
  },
  {
    slug: "market-conditions",
    title: "Reading Market Conditions",
    subtitle: "How economic cycles affect property values and investment timing",
    icon: "📉",
    category: "Strategy",
    readTime: "5 min",
    sections: [
      {
        heading: "The Real Estate Cycle",
        content: "Real estate markets move in cycles that repeat over years and decades: recovery, expansion, hyper-supply, and recession. During recovery, prices are low and opportunities are abundant for investors willing to buy when others are fearful. During expansion, prices rise steadily and both flips and rentals perform well. Hyper-supply brings too many properties onto the market, competition increases, and prices plateau. Recession follows with falling prices, rising vacancies, and financial pressure on overleveraged investors. Understanding where you are in the cycle fundamentally shapes your strategy."
      },
      {
        heading: "How Market Conditions Affect Your Deals",
        content: "In a strong market, flip properties sell quickly at premium prices — but purchase prices are also higher, squeezing your margins. Rental properties in good markets attract quality tenants and experience low vacancy, but cap rates are typically compressed (lower returns relative to price). In a weak market, purchase prices are lower (better buying opportunities) but flip properties take longer to sell, and rental vacancy rates increase. The best investors learn to profit in any market by adjusting their strategy and expectations accordingly."
      },
      {
        heading: "Timing Isn't Everything — But It Matters",
        content: "You can't perfectly time the market, and waiting for the \"perfect\" moment often means missing good opportunities. However, being aware of market direction helps you make smarter decisions. Buying a flip property at the peak of a market cycle is risky because prices may decline during your renovation period. Starting a rental in a recovering market can be excellent because you lock in low prices while rents trend upward. The key insight is that market conditions should inform your strategy choice, your pricing assumptions, and your risk tolerance — not whether you invest at all."
      },
      {
        heading: "Local Markets vs. National Trends",
        content: "Real estate is fundamentally local. National headlines about housing markets may not reflect what's happening in your specific neighborhood. A city experiencing job growth and population influx may have a booming market even during a national slowdown. Conversely, a town losing its major employer may be in recession while the national market thrives. Successful investors focus on local supply and demand dynamics: How many properties are for sale? How long do they sit on market? What are rental vacancy rates? Are new employers or developments coming to the area? These local factors matter more than national statistics."
      }
    ],
    relatedSlugs: ["flip-vs-rent", "cap-rates-cash-on-cash", "common-mistakes"],
    gameConnection: "Dealbreak simulates a dynamic market that shifts between five conditions — from terrible to excellent — every few months. Your flip sale prices and rental property values fluctuate with the market, teaching you to factor market risk into every deal."
  },
  {
    slug: "rehab-budgets",
    title: "Rehab Budgets & Contractor Management",
    subtitle: "Planning renovations that add value without breaking the bank",
    icon: "🔨",
    category: "Operations",
    readTime: "5 min",
    sections: [
      {
        heading: "Setting a Realistic Rehab Budget",
        content: "Renovation budgets are where many new investors get burned. The rule of thumb is to estimate your costs carefully, then add a 15-20% contingency buffer for surprises. Common renovation costs vary widely: a kitchen remodel can run $10,000-$40,000+, a bathroom renovation $5,000-$20,000, a new roof $8,000-$25,000, and HVAC replacement $5,000-$15,000. When evaluating a property, get contractor estimates before you buy whenever possible. The difference between a profitable flip and a money pit often comes down to accurate renovation cost estimates."
      },
      {
        heading: "Choosing the Right Contractor",
        content: "You generally have three tiers of contractor to choose from: budget contractors who are cheapest but slower and less reliable, standard contractors who offer a balance of cost, quality, and timeline, and premium contractors who are expensive but fast and professional. The right choice depends on your strategy. For a flip where time is money (you're paying holding costs every month), a faster, more expensive contractor might actually be cheaper overall. For a rental where you're not in a rush, a budget contractor can save you thousands if you can accept a longer timeline."
      },
      {
        heading: "The No-Rehab Option",
        content: "Not every property needs renovation. Some investors specifically seek move-in-ready properties to avoid construction risk entirely. The trade-off is that these properties typically cost more upfront because the previous owner already invested in improvements. For rentals, a clean, functional property can go straight to tenant placement. For flips, a no-rehab approach only works if you're buying significantly below market value — otherwise, there's no margin for profit. The absence of rehab risk can be worth the reduced potential upside, especially for newer investors."
      },
      {
        heading: "Financing Your Renovation",
        content: "You can either pay for renovations with cash reserves or include rehab costs in your loan. Financing rehab preserves your cash (important for maintaining reserves and pursuing other deals) but increases your loan amount, monthly payments, and total interest. Paying cash for rehab keeps your loan smaller but reduces your liquid capital — and running out of cash is one of the fastest paths to trouble in real estate investing. The best approach depends on your overall financial position and how many deals you're juggling simultaneously."
      }
    ],
    relatedSlugs: ["flip-vs-rent", "due-diligence", "common-mistakes"],
    gameConnection: "In Dealbreak, you set your rehab budget with a slider and choose from different contractor tiers. Skip rehab on a flip and watch your sale price suffer. Choose a cheap contractor and risk timeline delays that eat into your returns."
  },
  {
    slug: "common-mistakes",
    title: "Avoiding Common Investment Mistakes",
    subtitle: "Learn from others' expensive lessons before making your own",
    icon: "⚠️",
    category: "Risk Management",
    readTime: "6 min",
    sections: [
      {
        heading: "Overestimating Rental Income",
        content: "The most common mistake new investors make is assuming their property will rent for top-of-market rates with minimal vacancy. Reality is less forgiving. Rental rates should be based on comparable properties in the immediate area, not the nicest listing you can find. And vacancy happens — even in strong markets, expect at least 5-8% vacancy as a baseline to account for tenant turnover, repairs between tenants, and seasonal fluctuations. Building your pro forma around optimistic assumptions is a recipe for negative cash flow and financial stress."
      },
      {
        heading: "Underestimating Expenses",
        content: "New investors often forget to account for all expenses. Beyond the obvious costs (mortgage payment, taxes, insurance), there are maintenance reserves (typically 1-2% of property value annually), property management fees (8-12% of rent if you hire a manager), capital expenditure reserves (for eventual roof, HVAC, and appliance replacements), and miscellaneous costs like landscaping, pest control, and legal fees. A deal that looks profitable when you only consider mortgage, taxes, and insurance can quickly turn negative when you include everything."
      },
      {
        heading: "Over-Leveraging",
        content: "High leverage (90%+ LTV) amplifies both gains and losses. When the market is rising, leveraged investors feel like geniuses. When it turns, they're the first to face trouble. At 95% LTV, a mere 5% decline in property value wipes out your entire equity. Meanwhile, the high monthly payments from the large loan make it harder to maintain positive cash flow if rents soften or expenses spike. Conservative leverage (70-80% LTV) might feel less exciting, but it provides a critical buffer against market downturns and unexpected costs. Many investors who went bankrupt during the 2008 crisis had one thing in common: too much leverage."
      },
      {
        heading: "Skipping Due Diligence to Save Time",
        content: "When you find a property that seems like a great deal, the temptation is to move fast and skip inspections to save time and money. This is almost always a mistake. The few hundred dollars and couple of weeks spent on due diligence can save you tens of thousands in surprise repairs. A thorough inspection might reveal foundation issues, a failing septic system, or environmental hazards that completely change the economics of the deal. The best deals can withstand scrutiny — if a deal only works when you don't look too closely, it's not actually a good deal."
      },
      {
        heading: "Ignoring Cash Reserves",
        content: "Running out of cash is the number one way investors lose properties. Unexpected repairs happen. Tenants stop paying and evictions take months. Market conditions shift and your flip takes longer to sell. Without adequate cash reserves, any of these common scenarios can force you into a distressed sale or worse. Experienced investors maintain a cash cushion of at least 3-6 months of expenses per property. It's not exciting, and it means doing fewer deals — but it's the difference between weathering a storm and going under."
      }
    ],
    relatedSlugs: ["ltv-financing", "due-diligence", "cap-rates-cash-on-cash"],
    gameConnection: "Dealbreak is designed to teach these lessons through experience. Skip inspections and face surprise costs. Over-leverage and watch your cash evaporate. The game's bankruptcy system makes the consequences of these mistakes viscerally real."
  }
];

export function getArticleBySlug(slug: string): LearnArticle | undefined {
  return LEARN_ARTICLES.find(a => a.slug === slug);
}
