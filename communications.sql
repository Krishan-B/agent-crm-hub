-- Enable Row Level Security (RLS) policies for the communications table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Admins can see all communications" ON communications FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Agents can see communications for their assigned leads" ON communications FOR SELECT TO agent_role
--   USING (lead_id IN (SELECT id FROM leads WHERE assigned_agent_id = auth.uid()));
-- CREATE POLICY "Agents can manage communications they authored" ON communications FOR ALL TO agent_role
--   USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());


CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    type ENUM('email', 'call', 'sms', 'note') NOT NULL,
    direction ENUM('inbound', 'outbound') NOT NULL,
    subject VARCHAR(255),
    content TEXT,
    status ENUM('draft', 'sent', 'delivered', 'failed', 'read') DEFAULT 'sent',
    call_duration INTEGER, -- in seconds, for calls
    call_recording_url VARCHAR(500),
    call_disposition VARCHAR(100),
    scheduled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON
);
