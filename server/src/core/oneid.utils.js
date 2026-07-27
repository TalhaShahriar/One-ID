/**
 * OneID Generation and Validation Utilities
 */

/**
 * Generates a unique secure citizen ID format: BD-YYYY-XXXXXXXX
 * where YYYY is current year and XXXXXXXX is 8 random uppercase alphanumeric chars (A-Z, 0-9).
 * Automatically resolves and prevents collisions via recursive verification against database.
 * @param {object} prisma - Prisma Client instance
 * @returns {Promise<string>} Unique verified OneID
 */
export async function generateOneId(prisma) {
  const currentYear = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let attemptOneId = '';

  while (!isUnique) {
    let randomPart = '';
    for (let i = 0; i < 8; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attemptOneId = `BD-${currentYear}-${randomPart}`;

    const existing = await prisma.user.findUnique({
      where: { oneid: attemptOneId }
    });

    if (!existing) {
      isUnique = true;
    }
  }

  return attemptOneId;
}

/**
 * Normalizes and formats a raw string to match the upper-cased BD-YYYY-XXXXXXXX structure.
 * @param {string} raw - Raw unformatted OneID input
 * @returns {string} Formatted OneID
 */
export function formatOneId(raw) {
  if (!raw) return '';
  let cleaned = raw.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  
  // Ensure it starts with BD-
  if (!cleaned.startsWith('BD-') && cleaned.length >= 2) {
    if (cleaned.startsWith('BD')) {
      cleaned = 'BD-' + cleaned.slice(2);
    } else {
      cleaned = 'BD-' + cleaned;
    }
  }
  
  // Insert hyphen before the final 8 characters if not present
  const parts = cleaned.split('-');
  if (parts.length === 2 && parts[1].length > 4) {
    // E.g. BD-2026XYZ12345 -> BD-2026-XYZ12345
    const secondPart = parts[1];
    cleaned = `BD-${secondPart.slice(0, 4)}-${secondPart.slice(4)}`;
  }

  return cleaned;
}

/**
 * Evaluates validation format matching /^BD-\d{4}-[A-Z0-9]{8}$/
 * @param {string} str - Candidate OneID string
 * @returns {boolean} True if exactly matches Regex specifications
 */
export function validateOneIdFormat(str) {
  if (!str) return false;
  const regex = /^BD-\d{4}-[A-Z0-9]{8}$/;
  return regex.test(str);
}
