/**
 * Virtual Try-On Service (FREE)
 *
 * Calls our backend proxy at /api/fashn-tryon which uses
 * free Hugging Face Spaces for AI virtual try-on.
 * No API key required — completely free for all users.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Convert a File or Blob to a base64 data URI string.
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Generate AI virtual try-on previews for both boy and girl characters.
 * 100% FREE — powered by open-source AI models on Hugging Face.
 *
 * @param {string} garmentBase64OrUrl — base64 data URI or public URL of the garment image
 * @returns {{ boyPreviewUrl: string, girlPreviewUrl: string }}
 */
export async function generateTryOn(garmentBase64OrUrl) {
  const response = await fetch(`${API_BASE}/api/fashn-tryon`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ garmentImage: garmentBase64OrUrl }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return response.json();
}

/**
 * High-level helper: accepts a File object, converts to base64, and calls try-on.
 *
 * @param {File} file — the garment image file
 * @returns {{ boyPreviewUrl: string, girlPreviewUrl: string }}
 */
export async function generateTryOnFromFile(file) {
  const base64 = await fileToBase64(file);
  return generateTryOn(base64);
}
