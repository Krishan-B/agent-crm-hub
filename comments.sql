-- Enable Row Level Security (RLS) policies for the comments table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Admins can see all comments" ON comments FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Agents can see comments for their assigned leads" ON comments FOR SELECT TO agent_role
--   USING (lead_id IN (SELECT id FROM leads WHERE assigned_agent_id = auth.uid()));
-- CREATE POLICY "Authors can manage their own comments (within time limit for edits)" ON comments FOR ALL TO agent_role
--  USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid()); -- Additional logic for edit time limit would be in application layer or more complex RLS

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id),
    author_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    category VARCHAR(100),
    is_internal BOOLEAN DEFAULT FALSE,
    parent_comment_id UUID REFERENCES comments(id),
    mentioned_users JSON, -- Consider if a separate table for mentions is better for querying
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Removed ON UPDATE CURRENT_TIMESTAMP
    edited_at TIMESTAMP -- This will be set by a specific trigger on UPDATE
);

-- Add a trigger to update updated_at timestamp
-- Note: This assumes the function update_updated_at_column is created (e.g., in users.sql or a shared utility script)
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a trigger to update edited_at timestamp specifically on update operations
CREATE OR REPLACE FUNCTION update_edited_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.edited_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comments_edited_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_edited_at_column();
