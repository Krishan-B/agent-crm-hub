const { supabase, supabaseAdmin } = require('../config/supabaseClient');

// @desc    Get current balance and bonus amount for a lead
// @route   GET /api/leads/:leadId/balance
// @access  Private (Admin or Agent assigned to the lead)
const getCurrentBalance = async (req, res) => {
  const leadId = req.params.leadId;
  const authenticatedUser = req.user;

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_agent_id, balance, bonus_amount')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      if (leadError && leadError.code === 'PGRST116') {
        return res.status(404).json({ message: 'Lead not found.' });
      }
      console.error(`Error fetching lead balance for ${leadId}:`, leadError?.message);
      return res.status(500).json({ message: 'Failed to fetch lead details for balance.' });
    }

    if (authenticatedUser.role === 'agent' && lead.assigned_agent_id !== authenticatedUser.id) {
      return res.status(403).json({ message: 'Forbidden: Agent not assigned to this lead.' });
    }

    res.status(200).json({
      lead_id: lead.id,
      balance: lead.balance,
      bonus_amount: lead.bonus_amount,
    });

  } catch (error) {
    console.error(`Server error fetching balance for lead ${leadId}:`, error);
    res.status(500).json({ message: 'Server error fetching lead balance.' });
  }
};

// @desc    Add balance or bonus to a lead's account
// @route   POST /api/leads/:leadId/balance
// @access  Private (Admin or Agent assigned to the lead)
const addBalanceOrBonus = async (req, res) => {
  const leadId = req.params.leadId;
  const authenticatedUser = req.user;
  const {
    amount,
    transaction_type,
    reference_number,
    notes
  } = req.body;

  if (amount === undefined || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount: Must be a positive number.' });
  }
  const parsedAmount = parseFloat(amount.toFixed(2));

  const validTransactionTypes = ['deposit', 'bonus', 'adjustment', 'promotion', 'withdrawal'];
  if (!transaction_type || !validTransactionTypes.includes(transaction_type)) {
    return res.status(400).json({ message: `Invalid transaction_type. Must be one of: ${validTransactionTypes.join(', ')}` });
  }
  if (transaction_type === 'withdrawal') {
     return res.status(400).json({ message: 'Withdrawal type not supported via this endpoint. Please use a specific withdrawal function.' });
  }
  if (transaction_type === 'adjustment' && !notes) {
    return res.status(400).json({ message: 'Notes are required for adjustment transactions.' });
  }

  try {
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_agent_id, balance, bonus_amount')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      if (leadError && leadError.code === 'PGRST116') {
        return res.status(404).json({ message: 'Lead not found.' });
      }
      console.error(`Error fetching lead ${leadId} for balance update:`, leadError?.message);
      return res.status(500).json({ message: 'Failed to fetch lead details.' });
    }

    if (authenticatedUser.role === 'agent' && lead.assigned_agent_id !== authenticatedUser.id) {
      return res.status(403).json({ message: 'Forbidden: Agent not assigned to this lead.' });
    }

    let approval_status = 'approved';
    if ((transaction_type === 'deposit' || transaction_type === 'adjustment') && parsedAmount > 1000) {
        approval_status = 'pending';
    }

    let newLeadBalance = parseFloat(lead.balance);
    let newLeadBonusAmount = parseFloat(lead.bonus_amount);
    const previousLeadBalance = newLeadBalance;

    const leadsTableUpdate = {};

    if (transaction_type === 'bonus') {
      newLeadBonusAmount += parsedAmount;
      leadsTableUpdate.bonus_amount = newLeadBonusAmount.toFixed(2);
    } else {
      newLeadBalance += parsedAmount;
      leadsTableUpdate.balance = newLeadBalance.toFixed(2);
    }

    const transactionData = {
      lead_id: leadId,
      transaction_type,
      amount: parsedAmount,
      previous_balance: previousLeadBalance,
      new_balance: newLeadBalance.toFixed(2),
      reference_number,
      notes,
      processed_by: authenticatedUser.id,
      approval_status,
    };

    const { data: transactionRecord, error: transactionError } = await supabase
      .from('balance_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating balance transaction record:', transactionError.message);
      return res.status(500).json({ message: `Failed to create transaction record: ${transactionError.message}` });
    }

    let updatedLeadData = null;
    if (approval_status === 'approved') {
        const { data: updatedLead, error: leadUpdateError } = await supabase
          .from('leads')
          .update(leadsTableUpdate)
          .eq('id', leadId)
          .select('id, balance, bonus_amount')
          .single();

        if (leadUpdateError) {
          console.error('Error updating lead balance:', leadUpdateError.message);
          return res.status(500).json({
            message: 'Transaction logged, but failed to update lead balance. Please contact support.',
            transaction_id: transactionRecord.id
          });
        }
        updatedLeadData = updatedLead;
    } else {
        updatedLeadData = { id: lead.id, balance: lead.balance, bonus_amount: lead.bonus_amount };
    }

    res.status(201).json({
      message: `Transaction created with status: ${approval_status}.`,
      transaction: transactionRecord,
      updated_lead_summary: updatedLeadData
    });

  } catch (error) {
    console.error(`Server error adding balance for lead ${leadId}:`, error);
    res.status(500).json({ message: 'Server error adding balance/bonus.' });
  }
};

// @desc    Get transaction history for a lead
// @route   GET /api/leads/:leadId/transactions
// @access  Private (Admin or Agent assigned to the lead)
const getTransactionHistory = async (req, res) => {
  const leadId = req.params.leadId;
  const authenticatedUser = req.user;

  // Pagination parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;

  try {
    // 1. Verify lead exists and check access permission
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, assigned_agent_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      if (leadError && leadError.code === 'PGRST116') {
        return res.status(404).json({ message: 'Lead not found.' });
      }
      console.error(`Error fetching lead ${leadId} for transaction history:`, leadError?.message);
      return res.status(500).json({ message: 'Failed to fetch lead details.' });
    }

    if (authenticatedUser.role === 'agent' && lead.assigned_agent_id !== authenticatedUser.id) {
      return res.status(403).json({ message: 'Forbidden: Agent not assigned to this lead.' });
    }

    // 2. Fetch transaction history for the lead with pagination
    const { data: transactions, error: transactionsError, count } = await supabase
      .from('balance_transactions')
      .select('*', { count: 'exact' }) // Fetch all columns and total count
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false }) // Show most recent first
      .range(offset, offset + limit - 1);

    if (transactionsError) {
      console.error(`Error fetching transaction history for lead ${leadId}:`, transactionsError.message);
      return res.status(500).json({ message: 'Failed to fetch transaction history.' });
    }

    res.status(200).json({
      transactions: transactions || [],
      pagination: {
        currentPage: page,
        totalPages: Math.ceil((count || 0) / limit),
        totalTransactions: count || 0,
        limit,
      },
    });

  } catch (error) {
    console.error(`Server error fetching transaction history for lead ${leadId}:`, error);
    res.status(500).json({ message: 'Server error fetching transaction history.' });
  }
};

module.exports = {
  getCurrentBalance,
  addBalanceOrBonus,
  getTransactionHistory, // Add this
};
