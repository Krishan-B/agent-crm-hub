-- Enable Row Level Security (RLS) policies for the leads table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Agents can see their assigned leads" ON leads FOR SELECT TO agent_role USING (assigned_agent_id = auth.uid());
-- CREATE POLICY "Admins can see all leads" ON leads FOR SELECT TO admin_role USING (true);

CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cfd_user_id VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    country VARCHAR(100),
    date_of_birth DATE,
    registration_date TIMESTAMP NOT NULL,
    assigned_agent_id UUID REFERENCES users(id),
    status ENUM('new', 'contacted', 'kyc_pending', 'kyc_approved', 'kyc_rejected', 'active', 'inactive') DEFAULT 'new',
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    source VARCHAR(100) DEFAULT 'cfd_platform',
    balance DECIMAL(15,2) DEFAULT 0.00,
    bonus_amount DECIMAL(15,2) DEFAULT 0.00,
    kyc_status ENUM('pending', 'submitted', 'approved', 'rejected') DEFAULT 'pending',
    kyc_approved_by UUID REFERENCES users(id),
    kyc_approved_at TIMESTAMP,
    kyc_rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Removed ON UPDATE CURRENT_TIMESTAMP
    last_contact_at TIMESTAMP,
    tags JSON
);

-- Add a trigger to update updated_at timestamp
-- Note: This assumes the function update_updated_at_column is created (e.g., in users.sql or a shared utility script)
CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
