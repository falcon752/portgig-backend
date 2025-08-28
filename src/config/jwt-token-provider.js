const jwt = require("jsonwebtoken");

/**
 * Sign jwt claims
 * @author Proton
 * @param {string} userId
 */
function signJwt(userId, audience = process.env.JWT_AUDIENCE) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId,
    issuer: process.env.JWT_ISSUER,
    audience: audience,
    expiresIn: process.env.JWT_EXPIRATION,
  });
}

/**
 * Sign jwt claims
 * @author Proton
 * @param {string} token
 */
function verifyJws(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {}
  return null;
}

/**
 * Verify Refresh jwt claims
 * @author Proton
 * @param {string} token
 */
function verifyRefreshJws(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {}
  return null;
}

/**
 * Parse jws to jwt claims
 * @author Proton
 * @param {string} token
 */
function parseJws(token) {
  return jwt.decode(token);
}

/**
 * Refresh jws claims
 * @author Proton
 * @param {string} token
 */
function signRefreshJwt(userId) {
  return jwt.sign({}, process.env.JWT_REFRESH_SECRET, {
    subject: userId,
    issuer: process.env.JWT_ISSUER,
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });
}

function stripBearer(authorization) {
  if (authorization) {
    return authorization.split(" ")[1];
  }
  return "";
}

module.exports = {
  signJwt,
  verifyJws,
  parseJws,
  signRefreshJwt,
  stripBearer,
  verifyRefreshJws,
};
