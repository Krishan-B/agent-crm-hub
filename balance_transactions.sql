-- Enable Row Level Security (RLS) policies for the balance_transactions table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Admins can see all balance transactions" ON balance_transactions FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Agents can see transactions for their assigned leads" ON balance_transactions FOR SELECT TO agent_role
--   USING (lead_id IN (SELECT id FROM leads WHERE assigned_agent_id = auth.uid()));

CREATE TABLE balance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    transaction_type ENUM('deposit', 'bonus', 'adjustment', 'promotion', 'withdrawal') NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    previous_balance DECIMAL(15,2) NOT NULL,
    new_balance DECIMAL(15,2) NOT NULL,
    reference_number VARCHAR(100),
    notes TEXT,
    processed_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'
);
