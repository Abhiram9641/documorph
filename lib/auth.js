// Simple JWT Authentication
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'documorph-dev-secret';
const JWT_EXPIRY = '30d';

/**
 * Generate a JWT token for a user
 */
export function generateJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

/**
 * Verify JWT middleware
 */
export function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
