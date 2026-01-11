import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Property data with their characteristics
const properties = [
  {
    name: 'Oakwood Cottage',
    type: 'cottage',
    style: 'cozy suburban cottage with warm wood tones, comfortable furniture, natural light',
    condition: 'good',
    neighborhood: 'suburban'
  },
  {
    name: 'Riverside Ranch',
    type: 'ranch',
    style: 'spacious ranch-style home with open floor plan, modern finishes, waterfront views',
    condition: 'good',
    neighborhood: 'suburban'
  },
  {
    name: 'Maplewood Colonial',
    type: 'colonial',
    style: 'traditional colonial home with classic architecture, elegant details, family-oriented spaces',
    condition: 'good',
    neighborhood: 'suburban'
  },
  {
    name: 'Downtown Loft',
    type: 'loft',
    style: 'industrial modern loft with exposed brick, high ceilings, urban contemporary design',
    condition: 'excellent',
    neighborhood: 'urban'
  },
  {
    name: 'Elmwood Bungalow',
    type: 'bungalow',
    style: 'charming craftsman bungalow with hardwood floors, built-in shelving, vintage character',
    condition: 'fair',
    neighborhood: 'suburban'
  },
  {
    name: 'Hillside Retreat',
    type: 'house',
    style: 'scenic hillside home with large windows, mountain views, peaceful atmosphere',
    condition: 'good',
    neighborhood: 'suburban'
  },
  {
    name: 'Westside Manor',
    type: 'manor',
    style: 'upscale luxury home with high-end finishes, marble countertops, premium appliances',
    condition: 'excellent',
    neighborhood: 'upscale'
  },
  {
    name: 'South Street Twin',
    type: 'twin',
    style: 'Philadelphia-style twin house with traditional layout, updated features, urban character',
    condition: 'fair',
    neighborhood: 'urban'
  },
  {
    name: 'Fishtown Row House',
    type: 'row house',
    style: 'trendy Fishtown row house with exposed brick, modern renovations, hip neighborhood vibe',
    condition: 'good',
    neighborhood: 'urban'
  },
  {
    name: 'Port Richmond Duplex',
    type: 'duplex',
    style: 'working-class duplex with practical layout, vinyl flooring, basic appliances',
    condition: 'fair',
    neighborhood: 'urban'
  },
  {
    name: 'Kensington Row',
    type: 'row house',
    style: 'value-area row house needing updates, worn finishes, basic fixtures',
    condition: 'fixer-upper',
    neighborhood: 'urban'
  },
  {
    name: 'Northern Liberties Loft',
    type: 'loft',
    style: 'hot market loft with modern industrial design, stainless steel appliances, concrete floors',
    condition: 'excellent',
    neighborhood: 'urban'
  },
  {
    name: 'Graduate Hospital Studio',
    type: 'studio',
    style: 'compact studio apartment for young professionals, efficient layout, contemporary finishes',
    condition: 'good',
    neighborhood: 'urban'
  },
  {
    name: 'Queen Village Townhouse',
    type: 'townhouse',
    style: 'historic district townhouse with period details, hardwood floors, classic charm',
    condition: 'good',
    neighborhood: 'urban'
  },
  {
    name: 'Rittenhouse Square Condo',
    type: 'condo',
    style: 'luxury condo in prestigious area with floor-to-ceiling windows, designer finishes, city views',
    condition: 'excellent',
    neighborhood: 'luxury urban'
  },
  {
    name: 'Fairmount Duplex',
    type: 'duplex',
    style: 'family-friendly duplex with spacious rooms, practical layout, updated kitchen',
    condition: 'good',
    neighborhood: 'urban'
  },
  {
    name: 'Society Hill Apartment',
    type: 'apartment',
    style: 'prestigious historic apartment with elegant details, high ceilings, crown molding',
    condition: 'excellent',
    neighborhood: 'luxury urban'
  },
  {
    name: 'Old City Brownstone',
    type: 'brownstone',
    style: 'historic Philadelphia brownstone with original features, brick walls, vintage appeal',
    condition: 'good',
    neighborhood: 'urban'
  },
];

const rooms = [
  { name: 'kitchen', prompt: 'kitchen area' },
  { name: 'living_room', prompt: 'living room' },
  { name: 'bedroom', prompt: 'bedroom' },
];

async function generateImage(propertyName: string, propertyStyle: string, condition: string, room: string, roomPrompt: string): Promise<Buffer> {
  const conditionDescriptions = {
    'excellent': 'pristine, move-in ready, newly renovated',
    'good': 'well-maintained, minor wear, good condition',
    'fair': 'showing age, needs updates, some dated fixtures',
    'fixer-upper': 'needs significant work, worn finishes, dated appliances and fixtures'
  };

  const conditionDesc = conditionDescriptions[condition as keyof typeof conditionDescriptions] || 'average condition';

  const prompt = `A realistic interior photo of a ${roomPrompt} in a ${propertyStyle}. The space is ${conditionDesc}. Photorealistic style, good natural lighting, real estate photography. No people, no text overlays.`;

  console.log(`Generating ${room} for ${propertyName}...`);
  console.log(`Prompt: ${prompt}`);

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    const imageUrl = response.data[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL returned');
    }

    // Download the image
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer;
  } catch (error) {
    console.error(`Error generating image for ${propertyName} - ${room}:`, error);
    throw error;
  }
}

async function generateAllImages() {
  const baseDir = path.join(__dirname, '../attached_assets/generated_images/properties');

  // Check if OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('ERROR: OPENAI_API_KEY environment variable is not set!');
    console.log('\nPlease set your OpenAI API key:');
    console.log('export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  console.log(`Starting image generation for ${properties.length} properties...`);
  console.log(`Base directory: ${baseDir}\n`);

  let totalGenerated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const property of properties) {
    const propertyDirName = property.name.toLowerCase().replace(/ /g, '_');
    const propertyDir = path.join(baseDir, propertyDirName);

    // Create property directory if it doesn't exist
    if (!fs.existsSync(propertyDir)) {
      fs.mkdirSync(propertyDir, { recursive: true });
    }

    console.log(`\n=== Processing: ${property.name} ===`);

    for (const room of rooms) {
      const filePath = path.join(propertyDir, `${room.name}.png`);

      // Skip if image already exists
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${room.name}.png already exists, skipping...`);
        totalSkipped++;
        continue;
      }

      try {
        const imageBuffer = await generateImage(
          property.name,
          property.style,
          property.condition,
          room.name,
          room.prompt
        );

        fs.writeFileSync(filePath, imageBuffer);
        console.log(`  ✓ Generated ${room.name}.png`);
        totalGenerated++;

        // Rate limiting: wait 1 second between requests to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`  ✗ Failed to generate ${room.name}.png:`, error);
        totalErrors++;
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total images generated: ${totalGenerated}`);
  console.log(`Total images skipped (already exist): ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);
  console.log(`\nExpected total: ${properties.length * rooms.length} images`);
}

// Run the script
generateAllImages().catch(console.error);
