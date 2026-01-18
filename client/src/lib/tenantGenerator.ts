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
      "Hey! Quick sync - the garbage disposal is making a sound that's definitely not in the user manual. Can we align on a fix?",
      "Wanted to loop you in - I've created a shared doc tracking the heating issues. Let me know when you have bandwidth to review.",
      "Just flagging: the ceiling fan has a slight wobble. Not urgent, but wanted to get ahead of any potential cascading failures.",
      "Hope your week is going well! Quick ask - any timeline on the dryer? My laundry situation is becoming unsustainable.",
      "Circling back on the fridge issue from last Tuesday. Happy to hop on a call if that's easier!",
      "Touching base on the bathroom faucet. It's now a drip-to-stream situation. Let me know the ETA on a plumber.",
      "Hi! Love the place. Just a minor escalation - the smoke detector has been chirping at 3am. Batteries replaced but no dice.",
    ],
    portraitPrompt: "Professional headshot of a 35-45 year old person wearing business casual attire, warm smile, modern office background, soft lighting, high quality photo",
  },
  retired_micromanager: {
    speechPatterns: [
      "I've been timing the hot water - it takes 47 seconds to warm up. That seems high. In my old place it was 32.",
      "Noticed the mailman came at 2:47pm today instead of the usual 1:15pm. Not complaining, just documenting.",
      "The hallway light has been flickering since Tuesday at 3pm. I've logged 23 flickers so far. Thought you should know.",
      "I measured the water pressure this morning. It's down 12% from last month. I keep detailed records if you need them.",
      "Someone has been parking slightly over the line in spot 7. I've taken photos with timestamps. Let me know if you want them.",
      "The HVAC cycles exactly every 4 hours. That's fine. But today it was 3 hours 52 minutes. Something's off.",
      "Quick note: I've noticed a slight draft near the living room window. 0.3 degrees cooler than the rest of the room.",
    ],
    portraitPrompt: "Friendly portrait of a 60-70 year old person with reading glasses, neat appearance, comfortable home setting, natural lighting, high quality photo",
  },
  anxious_professional: {
    speechPatterns: [
      "Hi! Sorry to bother you - is the outlet in the bedroom supposed to make a tiny buzzing noise? It's probably nothing but I can't stop thinking about it.",
      "Quick question, no rush, but there's a small water stain on the ceiling. Should I be worried? I'm probably overthinking this.",
      "I hate to be that person but there's a weird smell near the kitchen. It's subtle. Maybe I'm imagining it? Let me know if you want me to describe it.",
      "This is embarrassing but I think I heard scratching in the wall last night. It was probably just the building settling, right? RIGHT?",
      "Hey, the pilot light on the water heater looks different than before. More orange? I googled it and now I'm spiraling a little.",
      "Sorry to text so late but the carbon monoxide detector beeped once an hour ago. Just once. I'm probably fine. Unless I'm not?",
      "The dishwasher made a new sound today. Like a thunk-whirr-thunk. Is that its normal vocabulary? Asking for my peace of mind.",
    ],
    portraitPrompt: "Portrait of a 28-38 year old professional person looking slightly concerned but friendly, casual smart attire, apartment interior background, soft lighting, high quality photo",
  },
  new_money: {
    speechPatterns: [
      "Hey - is there a premium maintenance tier? I'd pay extra for same-day service. The AC is making my home office uncomfortable.",
      "Quick note: the gym equipment downstairs is a bit dated. I know that's not really a maintenance thing but thought I'd mention it.",
      "The view from 3B is better than mine. Any chance of switching units? Happy to discuss an adjustment in rent.",
      "I'm hosting a dinner party Saturday. Is there someone who can deep-clean the hallway before then? I'll cover the cost.",
      "The parking situation is stressing me out. I'm driving a new car and that tight spot is giving me anxiety.",
      "Not complaining, but my last building had 24/7 concierge. Is that something we could explore here?",
      "The walls are thinner than I expected for this price point. Is there a sound-dampening upgrade available?",
    ],
    portraitPrompt: "Portrait of a 30-45 year old person with stylish appearance, confident expression, modern apartment with city view background, professional lighting, high quality photo",
  },
  law_curious: {
    speechPatterns: [
      "Hey, quick question about my lease - it says 'reasonable' maintenance response time. What's the legal definition of reasonable here?",
      "I was reading the building code and noticed the emergency exit sign seems dim. Just want to make sure we're compliant.",
      "Not to be dramatic, but the mold situation in the bathroom - I read that landlords have 48 hours to address in this state. Where are we at?",
      "I spoke with a friend who's a lawyer (not about this specifically!) and they mentioned something about habitability standards. Can we chat?",
      "The security deposit was charged to my account twice. I'm sure it's a mistake, but I've screenshotted the bank statement just in case.",
      "I noticed the fire extinguisher expired last month. I'm sure you're on top of it, but wanted a paper trail that I mentioned it.",
      "Question about the lease renewal - the 5% increase seems high. Is that based on market rate or is there flexibility?",
    ],
    portraitPrompt: "Portrait of a 35-50 year old person with thoughtful expression, casual attire, reading or near bookshelves, natural indoor lighting, high quality photo",
  },
  lonely_caller: {
    speechPatterns: [
      "Hi! Hope you're having a good day. The doorknob on the closet is a bit loose. Not urgent at all! Just wanted to chat... I mean, let you know.",
      "Sorry to bother you again! The lightbulb in the hallway went out. I could probably change it myself but thought I'd check in. How's your week going?",
      "Hello! Remember me? The faucet is still dripping a tiny bit. It's kind of soothing actually. But I figured I'd reach out anyway!",
      "Quick hello! Everything is fine here, actually. Just noticed the paint is chipping a little by the window. No rush! Stay warm out there.",
      "Hey there! The vent makes a little whistle when it's windy. It's almost musical. Anyway, hope all is well with you!",
      "Hi again! You probably get texts like this all the time, but the thermostat display is flickering. It still works! Just thought you'd want to know.",
      "Not an emergency! Just saying hi and also the kitchen cabinet hinge is squeaky. I actually kind of like it but wanted to mention it.",
    ],
    portraitPrompt: "Warm portrait of a 45-65 year old person with gentle expression, comfortable home clothes, cozy living room background, warm lighting, high quality photo",
  },
  control_seeker: {
    speechPatterns: [
      "I need to know exactly when maintenance will arrive tomorrow. I have a very specific schedule and surprises don't work for me.",
      "Who authorized the landscaping changes? I wasn't consulted. The new shrubs block my morning light.",
      "The package room was locked when I got there at 6:43am. Is there a schedule I'm not aware of? This needs to be clearer.",
      "I've noticed the cleaning crew changed their pattern. They used to do the third floor first. What's going on?",
      "Can I get 48 hours notice before any maintenance visits? I like to prepare. Also, please knock exactly twice.",
      "The laundry room hours changed without notice. I've adjusted my whole routine around this. Who do I speak to?",
      "I'd like a meeting to discuss the building policies. Some things seem to be done inconsistently and I have suggestions.",
    ],
    portraitPrompt: "Portrait of a 40-55 year old person with direct gaze and organized appearance, tidy home office background, clean lighting, high quality photo",
  },
  passive_aggressive: {
    speechPatterns: [
      "No worries about the AC - I've just been sleeping with the windows open! It's fine. Really. The street noise is almost white noise now.",
      "I'm sure you're super busy! The leak is still there but I put a bucket under it. It's kind of zen, actually. The dripping.",
      "Don't stress about the broken lock. I've been propping a chair against the door. It's very cozy. Very DIY.",
      "The oven still doesn't work but I've discovered so many great cold meal recipes! Every cloud, right?",
      "I noticed other units got new appliances. That's great for them! I'm sure our turn will come eventually. No rush.",
      "The heat is still spotty but I bought a space heater! Added it to my electricity bill, but that's okay. I'll manage.",
      "It's been three weeks since I mentioned the garbage disposal. But honestly, I've gotten used to the smell. Builds character!",
    ],
    portraitPrompt: "Portrait of a 30-50 year old person with polite but slightly strained smile, casual attire, apartment living room background, soft lighting, high quality photo",
  },
  chaos_magnet: {
    speechPatterns: [
      "You're not going to believe this but the toilet overflowed AGAIN. I wasn't even using it weird this time, I swear.",
      "So... funny story. The ceiling is dripping. Not from my apartment - I checked. The water is coming from ABOVE the ceiling. How??",
      "Add this to my file: the microwave just sparked. It was empty. I literally just opened the door and it sparked. At me.",
      "Hey, remember how the door was sticking? Well now it won't open at all. I'm texting from inside. This is fine.",
      "The smoke detector went off while I was making toast. Regular toast. On the lowest setting. This apartment hates me.",
      "Something is living in my walls. I don't know what. But I heard it sneeze. SNEEZE. Do mice sneeze??",
      "The fridge stopped working right after I did a big grocery run. Of course. The universe has a sense of humor.",
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
