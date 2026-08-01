import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@gradio/client';

// Prevent @gradio/client bugs (like invalid endpoints) from crashing the server
process.on('unhandledRejection', (reason, promise) => {
  console.warn('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Free Virtual Try-On powered by Hugging Face Spaces (IDM-VTON / Nymbo).
 *
 * Uses the @gradio/client to call open-source try-on models hosted on
 * Hugging Face — completely FREE, no API key required.
 *
 * Trade-offs vs paid APIs:
 *  - Free, unlimited usage
 *  - May be slower (15-60s) depending on Space queue
 *  - Space may occasionally be sleeping/unavailable
 */

// List of free HF Spaces to try (in order of preference).
// If one is down, we try the next.
const HF_SPACES = [
  'yisol/IDM-VTON',
  'kadirnar/IDM-VTON',
  'LPDoctor/IDM-VTON',
  'WildCodeSchool/IDM-VTON',
  'Nymbo/Virtual-Try-On',
];

/**
 * Convert a base64 data URI to a Blob for the Gradio client.
 */
function base64ToBlob(base64DataUri) {
  const matches = base64DataUri.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 data URI');

  const mimeType = matches[1];
  const base64 = matches[2];
  const buffer = Buffer.from(base64, 'base64');

  return new Blob([buffer], { type: mimeType });
}

/**
 * Read a local image file and return it as a Blob.
 */
function fileToBlob(filePath) {
  const absolutePath = path.resolve(__dirname, filePath);
  const buffer = fs.readFileSync(absolutePath);
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return new Blob([buffer], { type: mime });
}

/**
 * Attempt virtual try-on using a single HF Space.
 * Returns the output image URL on success, or throws on failure.
 */
async function tryOnWithSpace(spaceName, personBlob, garmentBlob) {
  console.log(`[tryon] Connecting to HF Space: ${spaceName}...`);

  const client = await Client.connect(spaceName, {
    hf_token: process.env.HF_TOKEN || undefined,
  });

  console.log(`[tryon] Connected. Submitting prediction...`);

  // Most IDM-VTON based spaces use /tryon endpoint with these params.
  // We try the common parameter patterns.
  let result;

  try {
    // Pattern 1: Nymbo-style (dict with person_img, garm_img, garment_des)
    result = await client.predict('/tryon', {
      dict: { background: personBlob, layers: [], composite: personBlob },
      garm_img: garmentBlob,
      garment_des: 'school uniform shirt',
      is_checked: true,
      is_checked_crop: false,
      denoise_steps: 30,
      seed: 42,
    });
  } catch (err1) {
    console.log(`[tryon] Pattern 1 failed for ${spaceName}: ${err1.message}`);
    try {
      // Pattern 2: Simpler positional args
      result = await client.predict('/tryon', [
        personBlob,     // person image
        garmentBlob,    // garment image
        'school uniform shirt', // description
      ]);
    } catch (err2) {
      throw new Error(`All API patterns failed for ${spaceName}. Last error: ${err2.message}`);
    }
  }

  // Extract the output image URL from the result
  if (!result || !result.data) {
    throw new Error(`No output data from ${spaceName}`);
  }

  const output = result.data;
  console.log(`[tryon] Got result from ${spaceName}:`, typeof output, Array.isArray(output) ? output.length : '');

  // The output is typically an array where the first element is the image
  // It can be a URL string, an object with .url, or an object with .path
  let imageUrl = null;

  if (Array.isArray(output)) {
    const first = output[0];
    if (typeof first === 'string') {
      imageUrl = first;
    } else if (first && typeof first === 'object') {
      imageUrl = first.url || first.path || first.data;
    }
  } else if (typeof output === 'string') {
    imageUrl = output;
  } else if (output && typeof output === 'object') {
    imageUrl = output.url || output.path || output.data;
  }

  if (!imageUrl) {
    throw new Error(`Could not extract image URL from ${spaceName} output`);
  }

  return imageUrl;
}

/**
 * Try virtual try-on across multiple HF Spaces until one succeeds.
 */
async function tryOnWithFallback(personBlob, garmentBlob) {
  const errors = [];

  for (const space of HF_SPACES) {
    try {
      const imageUrl = await tryOnWithSpace(space, personBlob, garmentBlob);
      return { imageUrl, space };
    } catch (err) {
      console.warn(`[tryon] Space ${space} failed: ${err.message}`);
      errors.push(`${space}: ${err.message}`);
    }
  }

  throw new Error(`All HF Spaces failed:\n${errors.join('\n')}`);
}

/**
 * POST /api/fashn-tryon
 *
 * Body:
 *   garmentImage: string — base64 data URI or public URL of the garment
 *
 * Response:
 *   { boyPreviewUrl: string, girlPreviewUrl: string }
 *
 * 100% FREE — uses Hugging Face Spaces (no API key needed)
 */
router.post('/fashn-tryon', async (req, res) => {
  console.log('[tryon] Received incoming request to /api/fashn-tryon');
  const { garmentImage } = req.body;
  if (!garmentImage) {
    console.warn('[tryon] Error: garmentImage is missing from body.');
    return res.status(400).json({ error: 'garmentImage is required (base64 or URL).' });
  }

  // Convert garment to Blob
  let garmentBlob;
  try {
    if (garmentImage.startsWith('data:')) {
      garmentBlob = base64ToBlob(garmentImage);
    } else {
      // It's a URL — fetch it first
      const resp = await fetch(garmentImage);
      garmentBlob = await resp.blob();
    }
  } catch (err) {
    console.error(`[tryon] Error processing garment image: ${err.message}`);
    return res.status(400).json({ error: `Failed to process garment image: ${err.message}` });
  }

  // Read character model images from assets
  const boyModelPath = path.join(__dirname, '..', 'src', 'assets', 'student-boy.png');
  const girlModelPath = path.join(__dirname, '..', 'src', 'assets', 'student-girl.png');

  let boyBlob, girlBlob;
  try {
    boyBlob = fileToBlob(boyModelPath);
    girlBlob = fileToBlob(girlModelPath);
  } catch (err) {
    console.error(`[tryon] Error reading local assets: ${err.message}`);
    return res.status(500).json({
      error: `Could not read character model images: ${err.message}`,
    });
  }

  console.log('[tryon] Starting FREE virtual try-on (Hugging Face Spaces)...');

  try {
    // Run both boy and girl try-ons in parallel using allSettled to prevent unhandled rejections
    const [boyResult, girlResult] = await Promise.allSettled([
      tryOnWithFallback(boyBlob, garmentBlob),
      tryOnWithFallback(girlBlob, garmentBlob),
    ]);

    if (boyResult.status === 'rejected') {
      throw new Error(`Boy model failed: ${boyResult.reason.message}`);
    }
    if (girlResult.status === 'rejected') {
      throw new Error(`Girl model failed: ${girlResult.reason.message}`);
    }

    console.log(`[tryon] Boy done via ${boyResult.value.space}`);
    console.log(`[tryon] Girl done via ${girlResult.value.space}`);

    return res.json({
      boyPreviewUrl: boyResult.value.imageUrl,
      girlPreviewUrl: girlResult.value.imageUrl,
    });
  } catch (err) {
    console.error('[tryon] Error:', err.message);
    return res.status(502).json({
      error: `Virtual try-on failed: ${err.message}. The AI model may be temporarily busy — please try again in a moment.`,
    });
  }
});

export default router;
