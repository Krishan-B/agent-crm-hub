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
    const { data: users, error } = await supabase
      .from('users')
      .select('*');

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
  const authenticatedUser = req.user;

  try {
    if (authenticatedUser.role !== 'admin' && authenticatedUser.id !== requestedUserId) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own profile.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', requestedUserId)
      .single();

    if (error) {
      console.error(`Error fetching user ${requestedUserId}:`, error.message);
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'User not found.' });
      }
      return res.status(500).json({ message: 'Failed to fetch user.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(`Server error fetching user ${requestedUserId}:`, error);
    res.status(500).json({ message: 'Server error fetching user.' });
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin can update any, Agent can update their own with restrictions)
const updateUser = async (req, res) => {
  const requestedUserId = req.params.id;
  const authenticatedUser = req.user;
  const updates = req.body;

  const agentAllowedUpdates = ['firstName', 'lastName', 'phone'];
  const adminAllowedUpdates = ['firstName', 'lastName', 'phone', 'department', 'status', 'role', 'email'];

  let userToUpdate;

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', requestedUserId)
      .single();

    if (fetchError || !existingUser) {
      return res.status(404).json({ message: 'User not found to update.' });
    }
    userToUpdate = existingUser;

    const userDataToUpdate = {};

    if (authenticatedUser.role === 'admin') {
      for (const key of Object.keys(updates)) {
        if (adminAllowedUpdates.includes(key)) {
          if (key === 'email' && updates.email !== userToUpdate.email) {
            if (!supabaseAdmin) return res.status(500).json({ message: 'Admin client not available for auth update.'});
            const { data: authUpdateData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
              requestedUserId,
              { email: updates.email, email_confirm: true }
            );
            if (authError) {
              return res.status(400).json({ message: `Failed to update email in Auth: ${authError.message}` });
            }
            userDataToUpdate.email = authUpdateData.user.email;
          } else if (key === 'role' && updates.role !== userToUpdate.role) {
            userDataToUpdate.role = updates.role;
          }
          else if (key !== 'email') {
            userDataToUpdate[key] = updates[key];
          }
        }
      }
    } else if (authenticatedUser.id === requestedUserId) {
      for (const key of Object.keys(updates)) {
        if (agentAllowedUpdates.includes(key)) {
          userDataToUpdate[key] = updates[key];
        } else if (adminAllowedUpdates.includes(key)) {
             return res.status(403).json({ message: `Forbidden: You cannot update '${key}' for your profile.`});
        }
      }
// Removed redundant check for email updates in the agent branch.
      if (updates.role || updates.status || updates.department ) {
         return res.status(403).json({ message: 'Forbidden: You cannot change your role, status, or department.' });
      }
    } else {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to update this user.' });
    }

    if (Object.keys(userDataToUpdate).length === 0) {
        return res.status(400).json({ message: 'No valid fields provided for update or no changes detected.' });
    }

    if (Object.keys(userDataToUpdate).length > 0) {
        const { data: updatedUser, error: dbUpdateError } = await supabase
          .from('users')
          .update(userDataToUpdate)
          .eq('id', requestedUserId)
          .select()
          .single();

        if (dbUpdateError) {
          console.error(`Error updating user ${requestedUserId} in DB:`, dbUpdateError.message);
          return res.status(500).json({ message: 'Failed to update user details in database.' });
        }
         res.status(200).json(updatedUser);
    } else {
        res.status(200).json(userToUpdate);
    }

  } catch (error) {
    console.error(`Server error updating user ${requestedUserId}:`, error);
    res.status(500).json({ message: 'Server error updating user.' });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  const userIdToDelete = req.params.id;
  const adminMakingRequest = req.user;

  if (!supabaseAdmin) {
    return res.status(500).json({ message: 'Admin client not configured. Cannot delete user.' });
  }

  if (userIdToDelete === adminMakingRequest.id) {
    return res.status(400).json({ message: 'Admins cannot delete their own account via this endpoint.' });
  }

  try {
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

    if (authDeleteError) {
      if (authDeleteError.message && authDeleteError.message.toLowerCase().includes('not found')) {
         console.warn(`User ${userIdToDelete} not found in Supabase Auth. Proceeding to check local DB.`);
      } else {
        console.error(`Error deleting user ${userIdToDelete} from Supabase Auth:`, authDeleteError.message);
        return res.status(500).json({ message: `Failed to delete user from authentication system: ${authDeleteError.message}` });
      }
    }

    const { error: dbDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userIdToDelete);

    if (dbDeleteError) {
      console.error(`Error deleting user ${userIdToDelete} from database:`, dbDeleteError.message);
      return res.status(500).json({ message: `User deleted from Auth (if existed), but failed to delete from database: ${dbDeleteError.message}` });
    }

    res.status(200).json({ message: 'User deleted successfully from Auth and database.' });

  } catch (error) {
    console.error(`Server error deleting user ${userIdToDelete}:`, error);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
};

// @desc    Get login sessions for a specific user
// @route   GET /api/users/:id/sessions
// @access  Private/Admin
const getUserLoginSessions = async (req, res) => {
  const userId = req.params.id;
  // Admin authorization is handled by the route middleware authorize('admin')

  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    // First, check if the user exists to provide a better error message
    const { data: userExists, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle to not error if user not found

    if (userError) {
        console.error(`Error checking user existence for sessions ${userId}:`, userError.message);
        return res.status(500).json({ message: 'Error verifying user before fetching sessions.' });
    }
    if (!userExists) {
        return res.status(404).json({ message: 'User not found. Cannot fetch login sessions.' });
    }

    // Fetch login sessions for the user with pagination
    const { data: sessions, error: sessionsError, count } = await supabase
      .from('login_sessions')
      .select('*', { count: 'exact' }) // Fetch all columns and total count
      .eq('user_id', userId)
      .order('login_time', { ascending: false }) // Show most recent first
      .range(offset, offset + limit - 1);

    if (sessionsError) {
      console.error(`Error fetching login sessions for user ${userId}:`, sessionsError.message);
      return res.status(500).json({ message: 'Failed to fetch login sessions.' });
    }

    res.status(200).json({
      sessions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalSessions: count,
        limit,
      },
    });

  } catch (error) {
    console.error(`Server error fetching login sessions for user ${userId}:`, error);
    res.status(500).json({ message: 'Server error fetching login sessions.' });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserLoginSessions,
};
