import crypto from 'crypto';

/**
 * Extracts browser headers to generate a standard mock SHA-256 device fingerprint.
 * @param {import('express').Request} req - Express request object 
 * @returns {string} SHA-256 fingerprint hex string
 */
export function extractFingerprint(req) {
  const ua = req.headers['user-agent'] || '';
  const lang = req.headers['accept-language'] || '';
  const encoding = req.headers['accept-encoding'] || '';
  const combined = `${ua}|${lang}|${encoding}`;
  
  return crypto.createHash('sha256').update(combined).digest('hex');
}
