import fs from "node:fs";
import path from "node:path";
import { generateImageBuffer } from "../server/replit_integrations/image/client";

const OUTPUT_DIR = "attached_assets/generated_images/properties";

interface PropertyImageSet {
  name: string;
  slug: string;
  style: string;
  views: {
    front: string;
    side: string;
    back: string;
  };
}

const properties: PropertyImageSet[] = [
  {
    name: "Oakwood Cottage",
    slug: "oakwood_cottage",
    style: "charming 1200 sqft single-story cottage, light gray wood siding with white trim, covered front porch with white columns, dark shingled gabled roof, mature oak trees in yard, green lawn, classic American cottage style",
    views: {
      front: "front elevation view showing full facade, porch, and entrance",
      side: "side angle view showing depth of house, side windows, and part of backyard",
      back: "backyard view showing rear of house, back door, patio area, and fence"
    }
  },
  {
    name: "Riverside Ranch",
    slug: "riverside_ranch",
    style: "1600 sqft mid-century ranch home, tan brick exterior with brown wood accents, long low roofline, attached two-car garage, large front windows, mature landscaping, suburban setting",
    views: {
      front: "front elevation showing brick facade, garage, and manicured lawn",
      side: "side angle showing the long ranch profile and side yard",
      back: "backyard view with covered patio, sliding glass doors, and back lawn"
    }
  },
  {
    name: "Maplewood Colonial",
    slug: "maplewood_colonial",
    style: "1450 sqft two-story colonial home, white painted wood siding, black shutters, red front door, symmetrical windows, peaked roof with dormer, classic colonial American architecture",
    views: {
      front: "front elevation showing symmetric facade, columns, and front steps",
      side: "side angle showing two stories, chimney, and side entrance",
      back: "backyard view showing rear windows, deck, and landscaped yard"
    }
  },
  {
    name: "Downtown Loft",
    slug: "downtown_loft",
    style: "1800 sqft modern urban loft building, red brick industrial building converted to loft, large factory-style windows, metal fire escape, urban streetscape, modern industrial aesthetic",
    views: {
      front: "front street view showing brick facade and large windows",
      side: "side angle showing building depth and alley view",
      back: "rear courtyard view showing back entrance and parking area"
    }
  },
  {
    name: "Elmwood Bungalow",
    slug: "elmwood_bungalow",
    style: "1350 sqft craftsman bungalow, weathered green wood siding showing age, wide front porch with tapered columns, low-pitched roof with exposed rafters, overgrown yard needing work, fixer-upper appearance",
    views: {
      front: "front elevation showing craftsman porch and aged exterior",
      side: "side angle showing foundation and side windows needing repair",
      back: "backyard showing detached garage and overgrown landscaping"
    }
  },
  {
    name: "Hillside Retreat",
    slug: "hillside_retreat",
    style: "1500 sqft split-level home on hillside, natural wood and stone exterior, large windows facing view, multi-level deck, wooded hillside setting, contemporary mountain home style",
    views: {
      front: "front approach showing split-level entrance and natural materials",
      side: "side view showing hillside slope and multiple levels",
      back: "rear view with expansive deck overlooking wooded valley"
    }
  },
  {
    name: "Westside Manor",
    slug: "westside_manor",
    style: "2000 sqft upscale traditional home, cream stucco exterior with stone accents, arched entryway, tile roof, manicured hedges, circular driveway, elegant suburban estate style",
    views: {
      front: "front elevation showing grand entrance, stone columns, and landscaping",
      side: "side angle showing pool area fence and side gardens",
      back: "backyard with pool, covered lanai, and outdoor kitchen"
    }
  }
];

const issueImages = [
  { slug: "mold", prompt: "Close-up inspection photo of black mold growth on interior drywall corner, toxic mold patches with fuzzy texture, moisture damage, home inspection documentation" },
  { slug: "foundation_crack", prompt: "Close-up inspection photo of concrete foundation crack with water seepage, structural settlement crack in basement wall, moisture stains" },
  { slug: "roof_damage", prompt: "Close-up inspection photo of damaged roof shingles, missing shingles exposing rotted wood decking, water damage visible from attic" },
  { slug: "plumbing", prompt: "Close-up inspection photo of corroded galvanized plumbing pipes, rusty pipe joints with mineral buildup, leaking connection" },
  { slug: "termite", prompt: "Close-up inspection photo of termite damage to wood framing, honeycomb pattern damage, sawdust debris, structural wood deterioration" },
  { slug: "hvac", prompt: "Close-up inspection photo of old rusty HVAC furnace system, aged heating unit with corrosion, outdated equipment needing replacement" },
  { slug: "water_damage", prompt: "Close-up inspection photo of water damage on ceiling, brown water stains on drywall, peeling paint from moisture leak" },
  { slug: "electrical", prompt: "Close-up inspection photo of outdated electrical panel with old wiring, knob and tube wiring visible, fire hazard" }
];

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generatePropertyImages() {
  await ensureDir(OUTPUT_DIR);
  await ensureDir(`${OUTPUT_DIR}/issues`);

  console.log("Generating property images using OpenAI GPT API...\n");

  for (const property of properties) {
    const propertyDir = `${OUTPUT_DIR}/${property.slug}`;
    await ensureDir(propertyDir);

    console.log(`\n=== ${property.name} ===`);

    for (const [view, viewDesc] of Object.entries(property.views)) {
      const filename = `${propertyDir}/${view}.png`;
      
      if (fs.existsSync(filename)) {
        console.log(`  [skip] ${view} already exists`);
        continue;
      }

      const prompt = `Professional real estate photograph of a ${property.style}. ${viewDesc}. Sunny day, high quality architectural photography, photorealistic, no text or watermarks.`;
      
      console.log(`  [generating] ${view}...`);
      
      try {
        const buffer = await generateImageBuffer(prompt, "1024x1024");
        fs.writeFileSync(filename, buffer);
        console.log(`  [saved] ${filename}`);
      } catch (error) {
        console.error(`  [error] Failed to generate ${view}:`, error);
      }
    }
  }

  console.log("\n\n=== Issue Images ===");
  
  for (const issue of issueImages) {
    const filename = `${OUTPUT_DIR}/issues/${issue.slug}.png`;
    
    if (fs.existsSync(filename)) {
      console.log(`  [skip] ${issue.slug} already exists`);
      continue;
    }

    console.log(`  [generating] ${issue.slug}...`);
    
    try {
      const buffer = await generateImageBuffer(issue.prompt, "1024x1024");
      fs.writeFileSync(filename, buffer);
      console.log(`  [saved] ${filename}`);
    } catch (error) {
      console.error(`  [error] Failed to generate ${issue.slug}:`, error);
    }
  }

  console.log("\n\nDone!");
}

generatePropertyImages().catch(console.error);
