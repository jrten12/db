import type { Request } from "express";

interface PageMeta {
  title: string;
  description: string;
  ogType: string;
  canonical: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_NAME = "Dealbreak: Real Estate Simulator";
const BASE_DESCRIPTION = "$80,000. 12 months. Three profitable deals or you're out. Master real estate investing through realistic pro forma analysis in this immersive property simulation game.";

const ARTICLE_DATA: Record<string, { title: string; subtitle: string; category: string; readTime: string; sections: { heading: string; content: string }[] }> = {
  "what-is-a-pro-forma": {
    title: "What Is a Pro Forma in Real Estate?",
    subtitle: "The financial blueprint behind every investment decision",
    category: "Fundamentals",
    readTime: "5 min",
    sections: [
      { heading: "The Investor's Crystal Ball", content: "A pro forma is a forward-looking financial model that projects the expected income, expenses, and returns of a real estate investment." },
      { heading: "What Goes Into a Pro Forma", content: "A complete pro forma includes rental income estimates, vacancy rates, property taxes, insurance, maintenance reserves, and Net Operating Income calculations." },
      { heading: "Why Assumptions Matter More Than Numbers", content: "The quality of assumptions separates good investors from bad ones — realistic vacancy rates, maintenance costs, and market research are critical." },
      { heading: "Pro Forma for Flips vs. Rentals", content: "Rental pro formas model ongoing cash flow while flip pro formas model one-time purchase-renovate-sell transactions." }
    ]
  },
  "cap-rates-cash-on-cash": {
    title: "Understanding Cap Rates & Cash-on-Cash Returns",
    subtitle: "The two metrics every real estate investor must know",
    category: "Financial Metrics",
    readTime: "6 min",
    sections: [
      { heading: "Cap Rate: Measuring Property Performance", content: "Cap Rate = Net Operating Income ÷ Property Value. It measures income relative to value, independent of financing." },
      { heading: "Cash-on-Cash Return: What Your Money Earns", content: "Cash-on-Cash = Annual Pre-Tax Cash Flow ÷ Total Cash Invested. It measures the actual return on your personal investment." },
      { heading: "What's a 'Good' Return?", content: "Experienced investors typically target 6-10% cap rates for residential rentals and 8-12% Cash-on-Cash returns." },
      { heading: "The Relationship Between Cap Rate and Price", content: "Cap rates and prices move inversely — hot markets compress cap rates while cold markets expand them." }
    ]
  },
  "flip-vs-rent": {
    title: "Flip vs. Rent: Choosing Your Strategy",
    subtitle: "Two paths to profit with very different risk profiles",
    category: "Strategy",
    readTime: "6 min",
    sections: [
      { heading: "The Flip Strategy", content: "Buy, improve, and sell for quick profit — high reward but concentrated risk from renovation costs, timeline, and market conditions." },
      { heading: "The Rental Strategy", content: "Buy and hold for monthly rent income, mortgage paydown, and long-term appreciation — slower but steadier returns." },
      { heading: "When to Flip", content: "Flipping works best in rising markets with undervalued properties that need cosmetic improvements." },
      { heading: "When to Rent", content: "Renting works best when rental income comfortably exceeds expenses and market conditions are uncertain." }
    ]
  },
  "due-diligence": {
    title: "Due Diligence: Why Inspections Matter",
    subtitle: "The research that separates successful investors from costly mistakes",
    category: "Process",
    readTime: "5 min",
    sections: [
      { heading: "What Is Due Diligence?", content: "Property inspections, title searches, appraisals, and market studies conducted before committing to a purchase." },
      { heading: "The Cost of Skipping Inspections", content: "Hidden issues like cracked foundations, failing roofs, and termite damage can cost tens of thousands to repair." },
      { heading: "Title Searches and Hidden Liens", content: "Title searches reveal unpaid tax liens, mechanic's liens, easements, and boundary disputes." },
      { heading: "Market Studies and Comparable Analysis", content: "Comparable sales and rental listings validate your financial assumptions about income and sale prices." }
    ]
  },
  "ltv-financing": {
    title: "How LTV & Financing Affects Your Deal",
    subtitle: "Understanding leverage and why your loan terms change everything",
    category: "Financing",
    readTime: "6 min",
    sections: [
      { heading: "What Is Loan-to-Value (LTV)?", content: "LTV represents how much of a property's value you're borrowing versus paying with cash — it directly affects interest rates and risk." },
      { heading: "The Leverage Trade-off", content: "High LTV amplifies returns but increases monthly payments and risk of being underwater." },
      { heading: "How Interest Rates Scale with Risk", content: "Rates increase as LTV rises, with dramatic jumps above 90% LTV in the danger zone." },
      { heading: "Financing Strategy for Different Deals", content: "Flips optimize for total loan cost over hold period; rentals optimize for monthly cash flow with lower rates." }
    ]
  },
  "market-conditions": {
    title: "Reading Market Conditions",
    subtitle: "How economic cycles affect property values and investment timing",
    category: "Strategy",
    readTime: "5 min",
    sections: [
      { heading: "The Real Estate Cycle", content: "Markets cycle through recovery, expansion, hyper-supply, and recession — understanding the cycle shapes your strategy." },
      { heading: "How Market Conditions Affect Your Deals", content: "Strong markets mean quick sales but higher prices; weak markets offer buying opportunities but slower sales." },
      { heading: "Timing Isn't Everything — But It Matters", content: "Market conditions should inform strategy choice, pricing assumptions, and risk tolerance." },
      { heading: "Local Markets vs. National Trends", content: "Real estate is fundamentally local — focus on local supply, demand, and employment dynamics." }
    ]
  },
  "rehab-budgets": {
    title: "Rehab Budgets & Contractor Management",
    subtitle: "Planning renovations that add value without breaking the bank",
    category: "Operations",
    readTime: "5 min",
    sections: [
      { heading: "Setting a Realistic Rehab Budget", content: "Estimate costs carefully and add 15-20% contingency for surprises — kitchen, bathroom, roof, and HVAC are major items." },
      { heading: "Choosing the Right Contractor", content: "Budget, standard, and premium contractors offer different cost-timeline-quality trade-offs." },
      { heading: "The No-Rehab Option", content: "Move-in-ready properties avoid construction risk but cost more upfront with lower profit margins." },
      { heading: "Financing Your Renovation", content: "Finance rehab to preserve cash reserves or pay cash to reduce loan payments — depends on your financial position." }
    ]
  },
  "common-mistakes": {
    title: "Avoiding Common Investment Mistakes",
    subtitle: "Learn from others' expensive lessons before making your own",
    category: "Risk Management",
    readTime: "6 min",
    sections: [
      { heading: "Overestimating Rental Income", content: "Use comparable properties for rental estimates and always factor in 5-8% vacancy as a baseline." },
      { heading: "Underestimating Expenses", content: "Beyond mortgage and taxes, include maintenance reserves, capital expenditures, management fees, and miscellaneous costs." },
      { heading: "Over-Leveraging", content: "High LTV amplifies losses in downturns — conservative leverage (70-80% LTV) provides critical buffers." },
      { heading: "Skipping Due Diligence to Save Time", content: "Inspection fees are trivial compared to surprise repair costs — good deals withstand scrutiny." },
      { heading: "Ignoring Cash Reserves", content: "Maintain 3-6 months of expenses per property to weather unexpected repairs, vacancies, and market shifts." }
    ]
  }
};

const FAQ_DATA = [
  { question: "Is Dealbreak free to play?", answer: "Yes. The full game is free to play with no signup required. Optional premium boosts are available for players who want extra cash or time, but they're never required to win." },
  { question: "Will this teach me real estate investing?", answer: "Dealbreak teaches the analytical framework that professional investors use — pro forma modeling, cap rate analysis, due diligence, and risk assessment. While it's a simulation and not financial advice, the skills transfer directly to evaluating real deals." },
  { question: "How long does a game take?", answer: "A typical game takes 20-40 minutes. You manage a 12-month timeline, evaluating properties, running numbers, and executing deals. Each playthrough is different thanks to randomized properties, market conditions, and events." },
  { question: "What strategies can I use?", answer: "You can flip properties (buy, renovate, sell for profit) or rent them out (buy, hold, collect monthly income). Each strategy has different risk-reward profiles, and the best players learn to mix both depending on market conditions and their financial position." }
];

function getBaseUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "dealbreak.replit.app";
  return `${proto}://${host}`;
}

function getPageMeta(url: string, req: Request): PageMeta {
  const baseUrl = getBaseUrl(req);
  const path = url.split("?")[0].split("#")[0];

  if (path === "/" || path === "") {
    return {
      title: SITE_NAME,
      description: BASE_DESCRIPTION,
      ogType: "website",
      canonical: baseUrl + "/",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "Dealbreak: Real Estate Simulator",
          "url": baseUrl,
          "description": "An educational real estate investment simulation game that teaches pro forma analysis, cap rates, financing, and deal evaluation through interactive gameplay.",
          "applicationCategory": "GameApplication",
          "genre": ["Simulation", "Educational"],
          "operatingSystem": "Web Browser",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
          "author": { "@type": "Organization", "name": "Infarill LLC & LVI Properties, LLC" },
          "screenshot": baseUrl + "/opengraph.jpg",
          "featureList": ["Pro Forma Financial Analysis", "Cap Rate & Cash-on-Cash Calculations", "Flip vs Rent Strategy", "Due Diligence Simulation", "Market Conditions Modeling", "Rehab Budget Planning", "Tenant Management"]
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
            "author": { "@type": "Organization", "name": "Infarill LLC & LVI Properties, LLC" },
            "publisher": { "@type": "Organization", "name": "Infarill LLC & LVI Properties, LLC" },
            "isPartOf": { "@type": "WebSite", "name": SITE_NAME, "url": baseUrl },
            "articleSection": article.category,
            "timeRequired": "PT" + parseInt(article.readTime) + "M",
            "educationalLevel": "Beginner",
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
  const baseUrl = getBaseUrl(req);

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
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${escapeAttr(meta.title)}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*" \/>/,
    `<meta name="twitter:description" content="${escapeAttr(meta.description)}" />`
  );

  const canonicalTag = `<link rel="canonical" href="${escapeAttr(meta.canonical)}" />`;
  html = html.replace("</head>", `    ${canonicalTag}\n  </head>`);

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
