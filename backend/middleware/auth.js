const { createUserClient } = require('../config/supabase');

/**
 * Middleware to verify JWT token and attach user to request
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Create user-specific Supabase client
    const supabase = createUserClient(token);

    // Verify token by getting user
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({
        error: 'Invalid or expired token'
      });
    }

    // Attach user and supabase client to request
    req.user = user;
    req.supabase = supabase;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Authentication failed'
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createUserClient(token);
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        req.user = user;
        req.supabase = supabase;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without auth
    next();
  }
}

module.exports = {
  authenticateUser,
  optionalAuth
};
