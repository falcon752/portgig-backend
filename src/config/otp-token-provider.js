const { generateRandomNumber } = require("./utils");

/**
 * Token expriration time 12hrs
 * Validation Token expire time 15min
 */
const TOKEN_EXPIRATION = 12 * 60 * 60 * 1000;
const VALIDATION_TOKEN_EXPIRATION = 15 * 60 * 1000;

/**
 * @returns {OTPToken}
 */
function generateToken() {
  return {
    value: generateRandomNumber(6),
    issued_at: Date.now(),
    expires_at: Date.now() + TOKEN_EXPIRATION,
  };
}

/**
 * @returns {OTPToken}
 */
function generateValidationToken() {
  return {
    value: generateRandomNumber(6),
    issued_at: Date.now(),
    expires_at: Date.now() + VALIDATION_TOKEN_EXPIRATION,
  };
}

/**
 * returns true if otp token is valid else false
 * @param {OTPToken} token
 */
function isValidToken(token) {
  if (token && token.expires_at instanceof Date) {
    return token?.expires_at.getTime() >= Date.now();
  }
  return false;
}

module.exports = {
  isValidToken,
  generateToken,
  generateValidationToken,
};

/**
 * @typedef {{
 * value: string;
 * expiresAt: string;
 * issuedAt: string;
 * }} OTPToken
 */
