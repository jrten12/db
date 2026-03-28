export const PASSIVE_INCOME_THRESHOLDS = [250, 500, 1000, 1500, 2000, 3000, 5000] as const;

export type MilestoneTier = typeof PASSIVE_INCOME_THRESHOLDS[number];

export interface MilestoneConfig {
  threshold: number;
  label: string;
  yearlyEquivalent: string;
  color: string;
  glowColor: string;
  particleColor: string;
  ringColor: string;
  bgGradient: string;
  intensity: number;
  messages: string[];
}

export const MILESTONE_CONFIGS: Record<number, MilestoneConfig> = {
  250: {
    threshold: 250,
    label: '$250/mo',
    yearlyEquivalent: '$3,000/yr',
    color: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.4)',
    particleColor: '#cbd5e1',
    ringColor: 'rgba(148, 163, 184, 0.3)',
    bgGradient: 'linear-gradient(135deg, rgba(148,163,184,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(148,163,184,0.05) 100%)',
    intensity: 1,
    messages: [
      "Your properties now earn more than your Netflix, Spotify, and gym membership combined.",
      "Fun fact: 78% of millionaires cite real estate as their #1 wealth builder. Welcome to the club.",
      "Passive income unlocked. Your money works while you doom-scroll.",
      "That's $3,000 a year for doing absolutely nothing. Well, almost nothing.",
      "You just out-earned a savings account with $50,000 in it. Buildings beat banks.",
      "Somewhere, a financial advisor just felt a disturbance in the force.",
      "First taste of passive income. It only gets more addicting from here.",
      "A medieval peasant worked 14 hours a day for less. Congrats, you've surpassed feudalism.",
      "Your buildings are earning money while you read this message.",
      "That's a phone bill. Covered. Every month. Forever.",
      "Most people's first passive income stream? A savings account earning $4/month. You're already lapping them.",
    ],
  },
  500: {
    threshold: 500,
    label: '$500/mo',
    yearlyEquivalent: '$6,000/yr',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    particleColor: '#34d399',
    ringColor: 'rgba(16, 185, 129, 0.3)',
    bgGradient: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(16,185,129,0.05) 100%)',
    intensity: 2,
    messages: [
      "That covers a car payment. A nice one.",
      "You're now earning more per month doing nothing than most side hustles pay.",
      "$500/mo passive. Your future self just high-fived you.",
      "Half a grand. Monthly. From buildings you own. This is how generational wealth starts.",
      "The average American saves $583/month. Your buildings now match that. Without trying.",
      "At this rate, your properties will buy you a vacation every year. Automatically.",
      "You now earn more passively than 73% of Etsy shops earn actively.",
      "That's groceries for a family of four. Covered by your tenants.",
      "Dave Ramsey would nod approvingly. Then tell you to pay off the mortgage faster.",
      "Five hundred dollars doesn't sound like much until you realize it shows up every single month without asking.",
      "Your tenants are building your wealth one rent check at a time. They have no idea.",
      "This is the income level where people start using the word 'portfolio' unironically.",
    ],
  },
  1000: {
    threshold: 1000,
    label: '$1,000/mo',
    yearlyEquivalent: '$12,000/yr',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.45)',
    particleColor: '#facc15',
    ringColor: 'rgba(234, 179, 8, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(234,179,8,0.05) 100%)',
    intensity: 3,
    messages: [
      "One thousand a month. While you sleep.",
      "That's rent in most American cities. Your rentals are paying YOUR rent.",
      "Most people will never hit $1K/mo passive. You just did it in a simulator. Now do it for real.",
      "$12,000 a year. That's a used car. Every year. Free.",
      "You've crossed the line from 'investor' to 'portfolio manager.' Update your LinkedIn.",
      "The IRS would like to know your location. (Just kidding. Kind of.)",
      "At $1K/month, you're out-earning a part-time minimum wage job. Except you don't have to show up.",
      "Warren Buffett started with a paper route. You started with a simulator. Same energy.",
      "One thousand dollars a month. Zero alarm clocks required.",
      "That's more than the median monthly Social Security check. And you're not even retired.",
      "Rent checks hit different when they're coming TO you instead of FROM you.",
      "Your money is officially making money. This is the compound interest your math teacher warned you about.",
    ],
  },
  1500: {
    threshold: 1500,
    label: '$1,500/mo',
    yearlyEquivalent: '$18,000/yr',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    particleColor: '#fbbf24',
    ringColor: 'rgba(245, 158, 11, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(245,158,11,0.05) 100%)',
    intensity: 4,
    messages: [
      "You could lease a BMW with this. Don't, but you could.",
      "Your passive income now exceeds the median American's monthly savings rate. By a lot.",
      "This is the part where normal people would quit their job. Don't. Yet.",
      "$18,000 a year. Passive. That's a down payment on another property. Every. Single. Year.",
      "You're earning more from rent than most people earn from their 401k match.",
      "At this rate, you could fund a college savings plan with just your cash flow.",
      "Fifteen hundred a month. Your portfolio just entered the chat.",
      "If passive income was a video game, you just beat the first boss.",
      "Your tenants collectively pay more than some people's salaries. Let that marinate.",
      "The average American has $400 in emergency savings. You're making 4x that. Monthly. Passively.",
      "Robert Kiyosaki would write a chapter about you. A short one, but still.",
    ],
  },
  2000: {
    threshold: 2000,
    label: '$2,000/mo',
    yearlyEquivalent: '$24,000/yr',
    color: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.45)',
    particleColor: '#22d3ee',
    ringColor: 'rgba(6, 182, 212, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(6,182,212,0.05) 100%)',
    intensity: 5,
    messages: [
      "Two grand a month for breathing. This is the dream.",
      "You now out-earn a part-time job. Without pants.",
      "At this rate you'll hit $24K/year passive. That's a salary.",
      "Your buildings just promoted you to 'person who doesn't need this job.'",
      "$2,000/month. That's a mortgage payment covered by other people's mortgage payments.",
      "You've achieved what most real estate books promise on page 1 and deliver on page never.",
      "The passive income you're generating could support a person in 47 countries. Comfortably.",
      "Two thousand dollars. Monthly. The math checks out and it's beautiful.",
      "You could hire an assistant with this money. To manage the properties that make this money. Inception.",
      "At $24K/year, your properties earn more than the median income in Mississippi.",
      "Your accountant is going to love you. Or hate you. Depends on how you feel about depreciation schedules.",
      "Financial freedom isn't a number. But if it was, $2K/mo passive would be in the conversation.",
    ],
  },
  3000: {
    threshold: 3000,
    label: '$3,000/mo',
    yearlyEquivalent: '$36,000/yr',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    particleColor: '#c084fc',
    ringColor: 'rgba(168, 85, 247, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(15,23,42,0.98) 50%, rgba(168,85,247,0.05) 100%)',
    intensity: 6,
    messages: [
      "Three thousand a month. Passive. Let that sink in.",
      "You could fund a small army of interns with this cash flow.",
      "$36,000 a year. Your portfolio just became a small business.",
      "You're generating more passive income than the median U.S. per capita income.",
      "At this level, the IRS has definitely entered the chat.",
      "Three grand a month. That's first-class tickets to anywhere, funded by tenants.",
      "Your rental income could now cover a second mortgage. So you could buy more rentals. It's rentals all the way down.",
      "You've crossed into territory where people start using the phrase 'cash flow positive' at dinner parties.",
      "If your properties were a company, they'd have better margins than most restaurants.",
      "Three thousand dollars a month while you sleep. Your pillow is basically a money printer.",
      "At $36K/year passive, you're in the top 3% of real estate investors. In a simulator, but still.",
    ],
  },
  5000: {
    threshold: 5000,
    label: '$5,000/mo',
    yearlyEquivalent: '$60,000/yr',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.45)',
    particleColor: '#f472b6',
    ringColor: 'rgba(236, 72, 153, 0.35)',
    bgGradient: 'linear-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(168,85,247,0.06) 25%, rgba(6,182,212,0.06) 50%, rgba(234,179,8,0.06) 75%, rgba(16,185,129,0.06) 100%)',
    intensity: 7,
    messages: [
      "Five thousand dollars a month. From buildings.",
      "You've built a machine that prints money. Legally.",
      "The IRS has entered the chat. And brought friends.",
      "$60,000 a year. Passive. That's the median U.S. household income. From rent checks.",
      "You could retire on this. In a simulator. But the math transfers.",
      "Five grand a month. Your portfolio generates more than most people earn working 40 hours a week.",
      "At this level, you don't have a side hustle. You have an empire.",
      "Your tenants are collectively paying you a full salary. And they don't even get benefits.",
      "Congratulations. You've achieved what 99% of real estate investors only dream about.",
      "Five thousand. Monthly. Passive. Each of those words carries weight.",
      "If this were real, you'd be shopping for a boat right now. Don't buy a boat.",
      "You've proven the concept. Now go do it with real buildings. We believe in you.",
    ],
  },
};

export function getRandomMilestoneMessage(threshold: number): string {
  const config = MILESTONE_CONFIGS[threshold];
  if (!config) return "Passive income milestone reached!";
  const messages = config.messages;
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getMilestoneConfig(threshold: number): MilestoneConfig | undefined {
  return MILESTONE_CONFIGS[threshold];
}
