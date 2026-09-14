const jwt = require('jsonwebtoken');
const config = require('../config');

function generateAccessToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpires });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: 'AUTH_REQUIRED', message: 'Authentication required.' });
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'TOKEN_INVALID', message: 'Your session is no longer valid.' });
  }
}

module.exports = { generateAccessToken, verifyAccessToken, requireAuth };