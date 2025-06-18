const { supabaseAdmin, supabase } = require('../config/supabaseClient');
const { v4: uuidv4 } = require('uuid');

// @desc    Create a new user (Agent)
// @route   POST /api/users
// @access  Private/Admin
const createUser = async (req, res) => {
  // ... (previous createUser code remains here) ...
  if (!supabaseAdmin) {
    return res.status(500).json({ message: 'Admin client not configured. Cannot create user.' });
  }

  const { firstName, lastName, email, phone, department, team } = req.body; // 'team' might be part of 'department'
  const adminUserId = req.user.id; // Admin user performing the creation

  if (!firstName || !lastName || !email || !phone) {
    return res.status(400).json({ message: 'Please provide first name, last name, email, and phone' });
  }
  try {
    const { data: authUserInvite, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { redirectTo: process.env.FRONTEND_AGENT_SETUP_URL }
    );

    if (inviteError) {
        console.warn(`Supabase invite error for ${email}: ${inviteError.message}. Attempting user creation with temporary password.`);
        const temporaryPassword = uuidv4();
        const { data: authUserCreate, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: temporaryPassword,
            email_confirm: true,
            user_metadata: {
                full_name: `${firstName} ${lastName}`,
            }
        });

        if (createError) {
            console.error('Supabase admin createUser error:', createError.message);
            return res.status(400).json({ message: createError.message || 'Failed to create user in Auth.' });
        }
        console.log(`User ${email} created with temporary password: ${temporaryPassword} by admin ${adminUserId}. This password needs to be communicated securely.`);
        const authUser = authUserCreate.user;

        const { data: newUser, error: dbError } = await supabase
          .from('users')
          .insert([
            {
              id: authUser.id,
              first_name: firstName,
              last_name: lastName,
              email: authUser.email,
              phone: phone,
              role: 'agent',
              department: department || team,
              status: 'active',
              created_by: adminUserId,
            },
          ])
          .select()
          .single();

        if (dbError) {
          console.error('Database error after creating auth user:', dbError.message);
          return res.status(500).json({ message: 'User created in Auth, but failed to save details to database.' });
        }
        return res.status(201).json({ message: 'User created with temporary password. Please communicate it securely.', user: newUser });
    }

    const authUser = authUserInvite.user;
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert([
        {
          id: authUser.id,
          first_name: firstName,
          last_name: lastName,
          email: authUser.email,
          phone: phone,
          role: 'agent',
          department: department || team,
          status: 'active',
          created_by: adminUserId,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database error after inviting auth user:', dbError.message);
      return res.status(500).json({ message: 'User invited, but failed to save details to database.' });
    }
    res.status(201).json({ message: 'User invitation sent successfully. User details saved.', user: newUser });
  } catch (error) {
    console.error('Server error during user creation:', error);
    res.status(500).json({ message: 'Server error during user creation.' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    // Admins can get all users. RLS policies on 'users' table should allow this for admin role.
    // If RLS restricts admin, supabaseAdmin client would be needed here.
    // For now, assuming RLS is set up for admin to read all from 'users' table.
    const { data: users, error } = await supabase
      .from('users')
      .select('*'); // Select all columns

    if (error) {
      console.error('Error fetching users:', error.message);
      return res.status(500).json({ message: 'Failed to fetch users.' });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Server error fetching users:', error);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin can get any, Agent can get their own)
const getUserById = async (req, res) => {
  const requestedUserId = req.params.id;
  const authenticatedUser = req.user; // From protect middleware

  try {
    // Admin can access any user's details
    // Agent can only access their own details
    if (authenticatedUser.role !== 'admin' && authenticatedUser.id !== requestedUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own profile.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*') // Select all columns
      .eq('id', requestedUserId)
      .single();

    if (error) {
      console.error(`Error fetching user ${requestedUserId}:`, error.message);
      // Differentiate between "not found" and other errors
      if (error.code === POSTGREST_ERROR_CODE_NO_ROWS) { // PostgREST code for "zero rows returned"
        return res.status(404).json({ message: 'User not found.' });
      }
      return res.status(500).json({ message: 'Failed to fetch user.' });
    }

    if (!user) { // Should be caught by error.code PGRST116 with .single()
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(`Server error fetching user ${requestedUserId}:`, error);
    res.status(500).json({ message: 'Server error fetching user.' });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  // Other user controller methods will go here (update, delete)
};
