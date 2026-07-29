import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'super-secret-random-key-change-this-in-production') {
  throw new Error('[FATAL] JWT_SECRET environment variable is not set or uses the default. Refusing to start.');
}

/**
 * Middleware: authenticate
 * Verifies JWT token from Authorization absolute header 'Bearer <token>'
 * Appends safe user properties to req.user = { userId, id, role, constituency, oneid }
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Authorization credentials missing in context.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Session expired or signature verification failed. Please login again.' });
    }

    // Attach both userId and id to keep old endpoints and new requirements happy
    const userId = decoded.userId || decoded.id;
    req.user = {
      userId: userId,
      id: userId,
      role: decoded.role,
      constituency: decoded.constituency,
      oneid: decoded.oneid
    };
    next();
  });
}

/**
 * Middleware Factory: requireRole
 * Guarantees that the active user possesses one of the required platform roles.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User session context not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    next();
  };
}

// Backwards-compatibility aliases for other routes
export const authenticateJWT = authenticate;
export const authorizeRoles = requireRole;
