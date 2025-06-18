-- Enable Row Level Security (RLS) policies for the appointments table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Admins can see all appointments" ON appointments FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Agents can see appointments for their assigned leads or themselves" ON appointments FOR SELECT TO agent_role
--   USING (lead_id IN (SELECT id FROM leads WHERE assigned_agent_id = auth.uid()) OR agent_id = auth.uid());
-- CREATE POLICY "Agents can manage appointments they created or are assigned to" ON appointments FOR ALL TO agent_role
--  USING (agent_id = auth.uid()) WITH CHECK (agent_id = auth.uid());


CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_type VARCHAR(100),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Removed ON UPDATE CURRENT_TIMESTAMP
);

-- Add a trigger to update updated_at timestamp
-- Note: This assumes the function update_updated_at_column is created (e.g., in users.sql or a shared utility script)
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
