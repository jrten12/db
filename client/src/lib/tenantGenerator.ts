// Tenant personality types and message generators
// These types are internal and never shown to the player

export type TenantPersonalityType = 
  | 'corporate_brain'
  | 'retired_micromanager'
  | 'anxious_professional'
  | 'new_money'
  | 'law_curious'
  | 'lonely_caller'
  | 'control_seeker'
  | 'passive_aggressive'
  | 'chaos_magnet';

// Property class based on monthly rent - affects tenant personality distribution
export type PropertyClass = 'budget' | 'working' | 'middle' | 'upscale' | 'luxury';

/**
 * Determine property class from monthly rent
 * Budget: < $1,800/mo - entry-level, often older properties
 * Working: $1,800 - $2,500/mo - working class housing
 * Middle: $2,500 - $4,000/mo - middle class housing  
 * Upscale: $4,000 - $6,500/mo - upper-middle class
 * Luxury: $6,500+/mo - premium properties
 */
export function getPropertyClass(monthlyRent: number): PropertyClass {
  if (monthlyRent < 1800) return 'budget';
  if (monthlyRent < 2500) return 'working';
  if (monthlyRent < 4000) return 'middle';
  if (monthlyRent < 6500) return 'upscale';
  return 'luxury';
}

// Personality distribution by property class
// Budget/working = more casual, direct communication
// Upscale/luxury = more refined but occasionally demanding
const PERSONALITY_WEIGHTS: Record<PropertyClass, Record<TenantPersonalityType, number>> = {
  budget: {
    corporate_brain: 1,
    retired_micromanager: 2,
    anxious_professional: 1,
    new_money: 0,
    law_curious: 1,
    lonely_caller: 3,
    control_seeker: 1,
    passive_aggressive: 3,
    chaos_magnet: 4,
  },
  working: {
    corporate_brain: 2,
    retired_micromanager: 2,
    anxious_professional: 2,
    new_money: 0,
    law_curious: 1,
    lonely_caller: 2,
    control_seeker: 2,
    passive_aggressive: 2,
    chaos_magnet: 3,
  },
  middle: {
    corporate_brain: 3,
    retired_micromanager: 2,
    anxious_professional: 3,
    new_money: 1,
    law_curious: 2,
    lonely_caller: 2,
    control_seeker: 2,
    passive_aggressive: 2,
    chaos_magnet: 1,
  },
  upscale: {
    corporate_brain: 4,
    retired_micromanager: 2,
    anxious_professional: 2,
    new_money: 3,
    law_curious: 3,
    lonely_caller: 1,
    control_seeker: 3,
    passive_aggressive: 1,
    chaos_magnet: 0,
  },
  luxury: {
    corporate_brain: 4,
    retired_micromanager: 1,
    anxious_professional: 1,
    new_money: 4,
    law_curious: 4,
    lonely_caller: 1,
    control_seeker: 3,
    passive_aggressive: 1,
    chaos_magnet: 0,
  },
};

interface PersonalityConfig {
  speechPatterns: string[];
  portraitPrompt: string; // For image generation
}

const personalityConfigs: Record<TenantPersonalityType, PersonalityConfig> = {
  corporate_brain: {
    speechPatterns: [
      "Hey can we sync on the garbage disposal? making weird noises",
      "circling back on that fridge thing from tuesday",
      "Just wanted to flag - ceiling fan wobbling a bit. lmk if u need me to submit a ticket or something",
      "Any eta on the dryer situation? running low on clean clothes lol",
      "fyi smoke detector chirping again. replaced batteries twice now",
      "Quick one - faucet in bathroom still dripping. not urgent but wanted to keep you looped in",
      "hey! all good here just wanted to touch base. place is great 👍",
      "wanted to loop you in — neighbor's dog barks from 6-8am every day. escalation worthy?",
      "running a cost-benefit on whether to renew. will circle back after i run the numbers",
      "heads up, water bill was 40% higher this month. might be a leak somewhere in the pipeline",
      "do we have an SLA for maintenance requests? just trying to set expectations internally",
      "quick pulse check - are we aligned on the parking situation or do we need to regroup",
    ],
    portraitPrompt: "Professional headshot of a 35-45 year old person wearing business casual attire, warm smile, modern office background, soft lighting, high quality photo",
  },
  retired_micromanager: {
    speechPatterns: [
      "Hot water takes 47 seconds to warm up. That seems long.",
      "Mail came at 2:47 today. Usually its 1:15. Just fyi",
      "Hallway light flickered 23 times since tuesday. Keeping count.",
      "Water pressure is down. I measured it.",
      "Someone parking over the line again. I have photos if you need",
      "HVAC cycled at 3hrs 52min today instead of the usual 4hr. Something to look at maybe",
      "Draft by the window. Measured it - 0.3 degrees cooler than rest of room",
      "Garage door closes in 14 seconds now. Was 12 seconds last month. Documented.",
      "Noticed the lawn service missed a 3ft strip along the east fence. Again.",
      "Counted 4 ants near the kitchen baseboard at 7:12am. None by noon. Monitoring.",
      "Recycling was picked up 22 minutes late today. Third time this quarter.",
    ],
    portraitPrompt: "Friendly portrait of a 60-70 year old person with reading glasses, neat appearance, comfortable home setting, natural lighting, high quality photo",
  },
  anxious_professional: {
    speechPatterns: [
      "hey sorry to bother u but is the outlet supposed to buzz?? probably nothing right",
      "theres a water stain on the ceiling... should i be worried or am i overthinking",
      "ok this is prob nothing but weird smell near the kitchen?? maybe im imagining it idk",
      "heard scratching in the wall last night. its prob just the building right?? RIGHT",
      "is the pilot light supposed to be orange bc i googled it and now im spiraling",
      "sorry to text late. co detector beeped once. just once. im fine right",
      "dishwasher making a weird thunk sound. is that normal or",
      "the floor creaks when its cold out. is that foundation or just... floors being floors",
      "saw a tiny crack in the bathroom tile. googled it. now im thinking black mold. help",
      "power went out for 0.5 seconds. everything turned back on. should i be concerned??",
      "is renters insurance supposed to cover meteor strikes? asking for.. planning purposes",
    ],
    portraitPrompt: "Portrait of a 28-38 year old professional person looking slightly concerned but friendly, casual smart attire, apartment interior background, soft lighting, high quality photo",
  },
  new_money: {
    speechPatterns: [
      "is there like a premium maintenance option? id pay extra for faster service",
      "gym equipment downstairs is kinda dated tbh",
      "the unit in 3B has a better view. any chance of switching? happy to pay difference",
      "hosting a dinner saturday - can someone clean the hallway? ill cover it",
      "the parking spot is way too tight for my car. getting anxious about it",
      "my last building had concierge 24/7. just saying",
      "walls are kinda thin for what im paying. any upgrades available?",
      "can we get the hallway repainted? the color is giving 2015",
      "my interior designer says the fixtures are builder-grade. any chance of an upgrade?",
      "just installed a ring doorbell — do i need permission for that? already done btw",
      "the neighbors wifi name is 'FBI Surveillance Van'. should i be concerned or is that a joke",
    ],
    portraitPrompt: "Portrait of a 30-45 year old person with stylish appearance, confident expression, modern apartment with city view background, professional lighting, high quality photo",
  },
  law_curious: {
    speechPatterns: [
      "quick q - lease says 'reasonable' response time. whats that mean exactly",
      "exit sign looks dim. we compliant on that?",
      "read somewhere landlords have 48hrs to address mold. where we at on that",
      "talked to a lawyer friend (not about this!) but they mentioned habitability stuff. can we chat",
      "deposit charged twice to my card. sure its a mistake but screenshotted it jic",
      "fire extinguisher expired. just documenting that i mentioned it",
      "5% rent increase seems high. is that negotiable or",
      "just reviewing my lease — does 'normal wear and tear' include scuff marks? asking preemptively",
      "neighbor is running a business from their unit. pretty sure thats a zoning thing",
      "the late fee clause seems unenforceable based on what ive read. not threatening anything just noting",
      "question — are you required to provide receipts for maintenance charges? just curious legally",
    ],
    portraitPrompt: "Portrait of a 35-50 year old person with thoughtful expression, casual attire, reading or near bookshelves, natural indoor lighting, high quality photo",
  },
  lonely_caller: {
    speechPatterns: [
      "Hi! Closet doorknob is loose. Not urgent! Just thought id say hi. I mean let u know",
      "Hallway light out. I could change it but thought id check in! hows ur week?",
      "Faucet still dripping a tiny bit. Kinda soothing actually lol. Anyway hi!",
      "Everything fine here! Paint chipping a bit by window. No rush. Stay warm!",
      "vent whistles when its windy. Almost musical haha. Hope ur doing well!",
      "Thermostat flickering. Still works tho! Just wanted to say hi really",
      "Cabinet hinge squeaky. I kinda like it but thought u should know. Have a good one!",
      "Happy Tuesday!! Nothing wrong just wanted to check if you got my last message. The one about nothing being wrong",
      "Made cookies today! Would drop some off but dont know where u live lol. Anyway the porch light is out",
      "Beautiful sunset from the living room tonight. Thought you should know. Also the door sticks a little",
      "Do you ever just think about how nice this building is? Anyway the garbage disposal smells weird",
    ],
    portraitPrompt: "Warm portrait of a 45-65 year old person with gentle expression, comfortable home clothes, cozy living room background, warm lighting, high quality photo",
  },
  control_seeker: {
    speechPatterns: [
      "need exact time for maintenance tomorrow. i have a schedule",
      "who approved the new shrubs?? they block my light",
      "package room locked at 6:43am. theres supposed to be a schedule",
      "cleaning crew changed their pattern. why wasnt i told",
      "need 48hrs notice before any visits. also knock twice pls",
      "laundry hours changed. my whole routine is off now. who decided this",
      "id like a meeting about building policies. i have thoughts",
      "the thermostat should be set to exactly 71. not 70. not 72. 71. please confirm",
      "somebody moved the recycling bins 6 inches to the left. was this authorized",
      "id like a copy of the emergency protocol. and the non-emergency protocol. both please",
      "maintenance came at 2:15 not 2:00. i had to reorganize my afternoon",
    ],
    portraitPrompt: "Portrait of a 40-55 year old person with direct gaze and organized appearance, tidy home office background, clean lighting, high quality photo",
  },
  passive_aggressive: {
    speechPatterns: [
      "no worries on the AC. sleeping with windows open now. its fine. really",
      "leaks still going but i put a bucket. its zen actually. the dripping",
      "locks still broken but im using a chair. very diy lol",
      "oven still out but ive discovered cold meals! every cloud right",
      "saw other units got new appliances. thats nice for them",
      "heat still spotty. bought a space heater. added to my electric bill but its fine",
      "been 3 weeks on the garbage disposal but honestly ive gotten used to the smell",
      "love how the rent goes up but the hallway paint keeps peeling. consistency is key i guess",
      "door still sticks. figured id just lose weight so i can squeeze through easier 😊",
      "ceiling fan wobbles but it adds excitement. like a little adventure every time i turn it on",
      "told my friend about the maintenance wait times. they thought i was joking. i wasnt",
    ],
    portraitPrompt: "Portrait of a 30-50 year old person with polite but slightly strained smile, casual attire, apartment living room background, soft lighting, high quality photo",
  },
  chaos_magnet: {
    speechPatterns: [
      "toilet overflowed AGAIN. i wasnt even doing anything weird i swear",
      "so uh. ceiling is dripping. waters coming from ABOVE the ceiling?? how",
      "microwave sparked. it was empty. i just opened the door and it sparked at me",
      "remember the sticky door? ya it wont open now. im stuck inside lol",
      "smoke detector going off. i was making TOAST. on the lowest setting. this place hates me",
      "somethings living in my walls. i heard it sneeze. DO MICE SNEEZE",
      "fridge died right after i did a costco run. of course it did",
      "garbage disposal ate a spoon and now it sounds like a helicopter. im sorry",
      "locked myself out. again. the locksmith knows me by name now. is that bad",
      "bathroom door handle came off in my hand. im just holding it. what do i do",
      "somehow the shower knob came off and now its just... water. no off switch. pls help",
      "bird got in through the bathroom vent. weve reached an understanding but id prefer it left",
    ],
    portraitPrompt: "Portrait of a 25-45 year old person with slightly exasperated but good-humored expression, slightly messy casual appearance, lived-in apartment background, natural lighting, high quality photo",
  },
};

// Diverse name pool - first and last names
const firstNames = [
  "Jordan", "Morgan", "Taylor", "Casey", "Riley", "Alex", "Jamie", "Sam", "Charlie", "Drew",
  "Parker", "Avery", "Quinn", "Reese", "Skyler", "Devon", "Hayden", "Cameron", "Blake", "Logan",
  "Michael", "Sarah", "David", "Emily", "James", "Jennifer", "Robert", "Lisa", "William", "Jessica",
  "Anthony", "Ashley", "Christopher", "Amanda", "Daniel", "Stephanie", "Matthew", "Nicole", "Andrew", "Melissa",
  "Marcus", "Olivia", "Kevin", "Rachel", "Brian", "Lauren", "Eric", "Megan", "Thomas", "Heather",
];

const lastNames = [
  "Chen", "Williams", "Garcia", "Kim", "Johnson", "Patel", "Brown", "Lee", "Miller", "Davis",
  "Wilson", "Moore", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris", "Martin", "Thompson",
  "Robinson", "Clark", "Lewis", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres",
  "Nguyen", "Hill", "Green", "Adams", "Baker", "Nelson", "Carter", "Mitchell", "Perez", "Roberts",
];

export function generateTenantName(): string {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

/**
 * Get a random personality type, optionally weighted by property class
 * If monthlyRent is provided, personality distribution matches tenant demographics
 */
export function getRandomPersonalityType(monthlyRent?: number): TenantPersonalityType {
  const types: TenantPersonalityType[] = [
    'corporate_brain',
    'retired_micromanager',
    'anxious_professional',
    'new_money',
    'law_curious',
    'lonely_caller',
    'control_seeker',
    'passive_aggressive',
    'chaos_magnet',
  ];
  
  // If no rent provided, use equal weights
  if (monthlyRent === undefined) {
    return types[Math.floor(Math.random() * types.length)];
  }
  
  // Use property class-based weights
  const propertyClass = getPropertyClass(monthlyRent);
  const weights = PERSONALITY_WEIGHTS[propertyClass];
  
  // Build weighted array
  const weightedTypes: TenantPersonalityType[] = [];
  for (const type of types) {
    const weight = weights[type] || 0;
    for (let i = 0; i < weight; i++) {
      weightedTypes.push(type);
    }
  }
  
  // If somehow no weighted types (shouldn't happen), fall back to random
  if (weightedTypes.length === 0) {
    return types[Math.floor(Math.random() * types.length)];
  }
  
  return weightedTypes[Math.floor(Math.random() * weightedTypes.length)];
}

export function getSpeechPatterns(personalityType: TenantPersonalityType): string[] {
  return personalityConfigs[personalityType].speechPatterns;
}

export function getPortraitPrompt(personalityType: TenantPersonalityType): string {
  return personalityConfigs[personalityType].portraitPrompt;
}

export function getRandomMessage(speechPatterns: string[]): string {
  return speechPatterns[Math.floor(Math.random() * speechPatterns.length)];
}

export type PaymentEthic = 'perfect' | 'good' | 'occasional' | 'chronic';

export function getRandomPaymentEthic(): PaymentEthic {
  const roll = Math.random() * 100;
  if (roll < 25) return 'perfect';
  if (roll < 65) return 'good';
  if (roll < 85) return 'occasional';
  return 'chronic';
}
