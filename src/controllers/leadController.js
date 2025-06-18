const { supabase } = require('../config/supabaseClient');

// @desc    Create a new lead
// @route   POST /api/leads
// @access  Private (Authenticated users - specific roles might be refined later)
const createLead = async (req, res) => {
  const {
    cfd_user_id,
    first_name,
    last_name,
    email,
    phone,
    country,
    date_of_birth,
    registration_date,
    assigned_agent_id,
    status,
    priority,
    source,
    balance,
    bonus_amount,
    kyc_status,
    tags
  } = req.body;

  // const authenticatedUser = req.user; // from protect middleware // Not used in this version of createLead

  if (!cfd_user_id || !first_name || !last_name || !email || !registration_date) {
    return res.status(400).json({
      message: 'Please provide cfd_user_id, first_name, last_name, email, and registration_date.'
    });
  }

  const leadData = {
    cfd_user_id,
    first_name,
    last_name,
    email,
    phone,
    country,
    date_of_birth,
    registration_date,
    assigned_agent_id: assigned_agent_id || null,
    status: status || 'new',
    priority: priority || 'normal',
    source: source || 'crm_manual',
    balance: balance || 0.00,
    bonus_amount: bonus_amount || 0.00,
    kyc_status: kyc_status || 'pending',
    tags: tags || [],
  };

  try {
    const { data: existingLead, error: checkError } = await supabase
      .from('leads')
      .select('cfd_user_id')
      .eq('cfd_user_id', cfd_user_id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing lead:', checkError.message);
        return res.status(500).json({ message: 'Error verifying lead uniqueness.' });
    }
    if (existingLead) {
      return res.status(409).json({ message: `Lead with CFD User ID ${cfd_user_id} already exists.` });
    }

    const { data: newLead, error: insertError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating lead:', insertError.message);
      if (insertError.code === '23503') {
         return res.status(400).json({ message: `Invalid data: ${insertError.details || insertError.message}`});
      }
      if (insertError.code === '23505') {
         return res.status(409).json({ message: `Conflict: ${insertError.details || insertError.message}`});
      }
      return res.status(500).json({ message: 'Failed to create lead.' });
    }

    res.status(201).json(newLead);

  } catch (error) {
    console.error('Server error during lead creation:', error);
    res.status(500).json({ message: 'Server error during lead creation.' });
  }
};


// @desc    Get all leads with filtering, sorting, and pagination
// @route   GET /api/leads
// @access  Private (Admins see all, Agents see their assigned leads)
const getLeads = async (req, res) => {
  const authenticatedUser = req.user; // from protect middleware

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const { status, assigned_agent_id } = req.query;
  const sortBy = req.query.sortBy || 'created_at';
  const order = req.query.order === 'asc' ? true : false;

  try {
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (authenticatedUser.role === 'agent') {
      if (assigned_agent_id && assigned_agent_id !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden: Agents can only query their own assigned leads or all their leads if no agent ID is specified." });
      }
      query = query.eq('assigned_agent_id', authenticatedUser.id);
    } else if (authenticatedUser.role === 'admin') {
      if (assigned_agent_id) {
        query = query.eq('assigned_agent_id', assigned_agent_id);
      }
    } else {
        return res.status(403).json({ message: "Forbidden: Unknown user role."});
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order(sortBy, { ascending: order });
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error.message);
      return res.status(500).json({ message: 'Failed to fetch leads.' });
    }

    res.status(200).json({
      leads,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        totalLeads: count,
        limit,
      },
    });

  } catch (error) {
    console.error('Server error fetching leads:', error);
    res.status(500).json({ message: 'Server error fetching leads.' });
  }
};

// @desc    Get a single lead by ID
// @route   GET /api/leads/:id
// @access  Private (Admin can see any, Agent can see if assigned)
const getLeadById = async (req, res) => {
  const leadId = req.params.id;
  const authenticatedUser = req.user; // from protect middleware

  try {
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*') // Select all columns for the single lead
      .eq('id', leadId)
      .single(); // Use single() to get one record or error if not exactly one

    if (error) {
      // Differentiate between "not found" and other errors
      if (error.code === 'PGRST116') { // PostgREST code for "zero rows returned"
        return res.status(404).json({ message: 'Lead not found.' });
      }
      console.error(`Error fetching lead ${leadId}:`, error.message);
      return res.status(500).json({ message: 'Failed to fetch lead.' });
    }

    if (!lead) { // Should be caught by error.code PGRST116 with .single()
        return res.status(404).json({ message: 'Lead not found.' });
    }

    // Access Control:
    // Admin can see any lead.
    // Agent can only see the lead if it's assigned to them.
    if (authenticatedUser.role === 'agent' && lead.assigned_agent_id !== authenticatedUser.id) {
      return res.status(403).json({ message: 'Forbidden: You are not authorized to view this lead.' });
    }

    res.status(200).json(lead);

  } catch (error) {
    // Catch any other unexpected errors
    console.error(`Server error fetching lead ${leadId}:`, error);
    res.status(500).json({ message: 'Server error fetching lead.' });
  }
};

module.exports = {
  createLead,
  getLeads,
  getLeadById, // Add this
};
