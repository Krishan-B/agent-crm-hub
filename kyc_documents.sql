-- Enable Row Level Security (RLS) policies for the kyc_documents table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Admins can see all KYC documents" ON kyc_documents FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Agents can see KYC documents for their assigned leads" ON kyc_documents FOR SELECT TO agent_role
--   USING (lead_id IN (SELECT id FROM leads WHERE assigned_agent_id = auth.uid()));

CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    document_type ENUM('government_id', 'proof_of_address', 'selfie_with_id', 'other') NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT
);
