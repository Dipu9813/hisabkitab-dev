/**
 * Business ID utilities
 * Generates short, unique business IDs for easy sharing
 */

/**
 * Generates a short 6-character business ID using base36 encoding
 * Format: XXXXXX (6 alphanumeric characters, uppercase)
 * @returns {string} - 6-character business ID
 */
function generateShortBusinessId() {
  // Use crypto.randomBytes for better randomness if available, otherwise Math.random
  let randomSource;
  try {
    const crypto = require("crypto");
    randomSource = () => crypto.randomBytes(4).toString("hex");
  } catch (e) {
    randomSource = () => Math.random().toString(36).substring(2);
  }

  // Generate multiple random components
  const part1 = randomSource().substring(0, 3);
  const part2 = randomSource().substring(0, 3);
  const timestamp = Date.now().toString(36).substring(-2);

  // Combine and filter to alphanumeric only
  const combined = (part1 + part2 + timestamp).replace(/[^a-z0-9]/gi, "");

  // Take first 6 characters and convert to uppercase
  let shortId = combined.substring(0, 6).toUpperCase();

  // Ensure we have exactly 6 characters, pad with more random if needed
  while (shortId.length < 6) {
    const padding = randomSource().replace(/[^a-z0-9]/gi, "");
    shortId += padding;
  }

  return shortId.substring(0, 6);
}

/**
 * Validates a business ID format
 * @param {string} businessId - The business ID to validate
 * @returns {boolean} - True if valid format
 */
function isValidBusinessId(businessId) {
  if (!businessId || typeof businessId !== "string") {
    return false;
  }

  // Check if it's exactly 6 characters and alphanumeric
  const regex = /^[A-Z0-9]{6}$/;
  return regex.test(businessId.toUpperCase());
}

/**
 * Normalizes business ID to uppercase
 * @param {string} businessId - The business ID to normalize
 * @returns {string} - Normalized business ID
 */
function normalizeBusinessId(businessId) {
  if (!businessId || typeof businessId !== "string") {
    return "";
  }
  return businessId.toUpperCase().trim();
}

module.exports = {
  generateShortBusinessId,
  isValidBusinessId,
  normalizeBusinessId,
};
