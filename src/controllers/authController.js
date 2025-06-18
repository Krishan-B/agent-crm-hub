const supabase = require('../config/supabaseClient');
// We might need the admin client for some operations if we were creating users here,
// but for login, password reset, and getting user, the normal client is fine.

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      return res.status(401).json({ message: error.message || 'Invalid credentials' });
    }

    if (data && data.user && data.session) {
      // Optionally, you could fetch the user profile from your public 'users' table here
      // to return more detailed user information along with the session.
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !userProfile) {
         console.error('Login successful but error fetching user profile:', profileError?.message);
         // Decide if this is a critical error. For now, return session and basic user.
         // Or, you could return an error if profile is mandatory.
         return res.status(500).json({ message: 'Login successful but failed to retrieve user profile.' });
      }

      res.json({
        message: 'Login successful',
        user: userProfile, // Return full profile from 'users' table
        session: data.session,
      });

    } else {
      return res.status(401).json({ message: 'Invalid credentials or unexpected response' });
    }
  } catch (error) {
    console.error('Server error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address' });
  }

  try {
    // Supabase handles sending the reset email.
    // Ensure your Supabase project has email templates configured.
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      // redirectTo: 'YOUR_FRONTEND_PASSWORD_RESET_URL' // Important: URL where user resets password
    });

    if (error) {
      // Do not reveal if an email is registered or not for security reasons
      // Log the error for server admins
      console.error('Forgot password error:', error.message);
      // Send a generic success message to the user
      return res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });
    }

    res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Server error during forgot password:', error);
    // Log the error for server admins
    // Send a generic success message to the user
    res.status(200).json({ message: 'If an account with this email exists, a password reset link has been sent.' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public (typically requires a token from the email link, handled by Supabase client)
const resetPassword = async (req, res) => {
  const { accessToken, newPassword } = req.body; // Supabase client handles the token from URL

  if (!accessToken || !newPassword) { // Or however Supabase client expects the reset token
    return res.status(400).json({ message: 'Access token and new password are required.' });
  }

  // The actual password reset from a link is usually done client-side using Supabase JS library
  // by redirecting the user to a page that then calls supabase.auth.updateUser()
  // However, if you must do it server-side with an access token obtained by client:
  // This assumes the client has exchanged the code from the email for a session/access token.
  // Then it calls this endpoint with that access token and the new password.

  // First, set the session for the user using the access token
  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: '' // Refresh token might not be available or needed for this specific flow
  });

  if (sessionError || !sessionData.user) {
    console.error('Reset password session error:', sessionError?.message);
    return res.status(400).json({ message: sessionError?.message || 'Invalid or expired access token.' });
  }

  // Now update the user's password
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    console.error('Reset password error:', error.message);
    return res.status(400).json({ message: error.message || 'Failed to reset password.' });
  }

  res.status(200).json({ message: 'Password has been reset successfully.' });
};


// @desc    Get current user details
// @route   GET /api/auth/me
// @access  Private (requires protect middleware)
const getMe = async (req, res) => {
  // req.user is populated by the 'protect' middleware
  // and it already contains the profile from the public 'users' table
  if (req.user) {
    res.status(200).json(req.user);
  } else {
    // This case should ideally be caught by the protect middleware itself
    res.status(401).json({ message: 'Not authorized, user data not found.' });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    // Supabase client-side handles logout by removing the token.
    // Server-side, you can invalidate the token if Supabase supports it,
    // but typically it's stateless. For Supabase, supabase.auth.signOut() is client-side.
    // This endpoint can simply confirm the action.
    const { error } = await supabase.auth.signOut(); // This will sign out the current session if one was set server-side (e.g. via service_role key)
                                                    // If using Bearer tokens, it effectively does nothing to the token itself, client needs to discard it.

    if (error) {
        console.error('Supabase signout error:', error.message);
        return res.status(500).json({ message: 'Error signing out from Supabase session.' });
    }
    res.status(200).json({ message: 'User logged out successfully. Please discard the token on client-side.' });
};


module.exports = {
  loginUser,
  forgotPassword,
  resetPassword,
  getMe,
  logoutUser,
};
