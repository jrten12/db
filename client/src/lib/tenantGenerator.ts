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

interface PersonalityConfig {
  speechPatterns: string[];
  portraitPrompt: string; // For image generation
}

const personalityConfigs: Record<TenantPersonalityType, PersonalityConfig> = {
  corporate_brain: {
    speechPatterns: [
      "Hi, just wanted to level-set expectations around the noise situation.",
      "Can we align on what 'quiet enjoyment' means operationally?",
      "I'm flagging a potential risk vector with the heating.",
      "Let's get ahead of this plumbing issue.",
      "This may require a process to resolve properly.",
      "Circling back on the maintenance request from last week.",
      "Just want to sync on the timeline for repairs.",
    ],
    portraitPrompt: "Professional headshot of a 35-45 year old person wearing business casual attire, warm smile, modern office background, soft lighting, high quality photo",
  },
  retired_micromanager: {
    speechPatterns: [
      "I've lived in six homes and this one runs a bit loose.",
      "I wake up early and notice things others might miss.",
      "People don't close doors like they used to.",
      "I don't complain often. But I do document.",
      "Someone should be accountable for this.",
      "I've been timing how long the water takes to heat up.",
      "The hallway light has been flickering since Tuesday at 3pm.",
    ],
    portraitPrompt: "Friendly portrait of a 60-70 year old person with reading glasses, neat appearance, comfortable home setting, natural lighting, high quality photo",
  },
  anxious_professional: {
    speechPatterns: [
      "I don't want to sound paranoid, but...",
      "This is probably nothing, but it's been distracting me.",
      "I just need to know if this noise is normal?",
      "I can't focus when the environment keeps shifting.",
      "I have a big presentation this week, and the AC is making sounds.",
      "Sorry to bother you, is there supposed to be a smell?",
      "Quick question - should the outlet be making that noise?",
    ],
    portraitPrompt: "Portrait of a 28-38 year old professional person looking slightly concerned but friendly, casual smart attire, apartment interior background, soft lighting, high quality photo",
  },
  new_money: {
    speechPatterns: [
      "This isn't quite what I'm used to.",
      "In my last place, this kind of thing wouldn't happen.",
      "I'm paying a lot for this apartment.",
      "I didn't expect to hear the neighbors this much.",
      "I don't want this to become a thing, but...",
      "Is there a premium maintenance option?",
      "The parking situation is not what was described.",
    ],
    portraitPrompt: "Portrait of a 30-45 year old person with stylish appearance, confident expression, modern apartment with city view background, professional lighting, high quality photo",
  },
  law_curious: {
    speechPatterns: [
      "I'm not threatening anything, just asking.",
      "I looked up the building code on this.",
      "I spoke to someone who knows about tenant rights.",
      "I don't want to escalate this prematurely.",
      "I'm just asking where responsibility begins here.",
      "The lease mentions 'reasonable' - what does that mean exactly?",
      "Is there a formal process for filing complaints?",
    ],
    portraitPrompt: "Portrait of a 35-50 year old person with thoughtful expression, casual attire, reading or near bookshelves, natural indoor lighting, high quality photo",
  },
  lonely_caller: {
    speechPatterns: [
      "Sorry to bother you again.",
      "I wasn't sure who else to mention this to.",
      "I just wanted someone to know about the sound.",
      "It's quiet now, but earlier it was strange.",
      "You probably get calls like this all the time.",
      "Hope your day is going well! Quick question...",
      "Not urgent at all, but when you have a moment...",
    ],
    portraitPrompt: "Warm portrait of a 45-65 year old person with gentle expression, comfortable home clothes, cozy living room background, warm lighting, high quality photo",
  },
  control_seeker: {
    speechPatterns: [
      "I need to understand who's allowed to be in common areas.",
      "I don't like surprises with the building schedule.",
      "I've noticed a pattern with the noise.",
      "Things were better before the new neighbors moved in.",
      "I need this addressed soon.",
      "Who approved the parking changes?",
      "Can I get advance notice for maintenance visits?",
    ],
    portraitPrompt: "Portrait of a 40-55 year old person with direct gaze and organized appearance, tidy home office background, clean lighting, high quality photo",
  },
  passive_aggressive: {
    speechPatterns: [
      "I'll just adjust on my end if nothing can be done.",
      "I can adapt. I always do.",
      "I don't want special treatment or anything.",
      "I'm flexible, unlike some people.",
      "No worries if you can't fix it. I'll manage somehow.",
      "I'm sure you're doing your best with the budget you have.",
      "It's fine. Really. I'll figure something out.",
    ],
    portraitPrompt: "Portrait of a 30-50 year old person with polite but slightly strained smile, casual attire, apartment living room background, soft lighting, high quality photo",
  },
  chaos_magnet: {
    speechPatterns: [
      "This always happens to me, I swear.",
      "Every place I live has this exact issue.",
      "I seem to attract problems.",
      "I knew something like this would come up eventually.",
      "It's fine. I'll deal with it like I always do.",
      "You won't believe what happened now.",
      "Add it to the list, I guess.",
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

export function getRandomPersonalityType(): TenantPersonalityType {
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
  return types[Math.floor(Math.random() * types.length)];
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
