const supabase = require('../config/supabaseClient');

const protect = async (req, res, next) => {
  let token;

  // Check for Authorization header and Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify the token with Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error) {
        // console.error('Supabase auth error:', error.message);
        // Differentiate between no user found for token (expired/invalid) vs other errors
        if (error.message === 'invalid JWT' || error.message.includes('expired')) {
             return res.status(401).json({ message: 'Not authorized, token failed or expired' });
        }
        // For other errors, it might be a Supabase service issue
        return res.status(500).json({ message: 'Server error during authentication' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Not authorized, no user found for this token' });
      }

      // Attach user to request object (you can customize what you attach)
      // req.user = user;

      // More detailed user profile might be needed from your public 'users' table
      // If your public.users table's id is the same as auth.users.id:
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError.message);
        return res.status(500).json({ message: 'Error fetching user profile' });
      }

      if (!userProfile) {
          return res.status(401).json({ message: 'Not authorized, user profile not found' });
      }

      // Attach the user profile from your 'users' table
      req.user = userProfile;


      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to restrict access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user ? req.user.role : 'unknown'} is not authorized to access this route` });
    }
    next();
  };
};

module.exports = { protect, authorize };
