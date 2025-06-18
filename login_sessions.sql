-- Enable Row Level Security (RLS) policies for the login_sessions table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Admins can see all login sessions" ON login_sessions FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Users can see their own login sessions" ON login_sessions FOR SELECT USING (user_id = auth.uid());

CREATE TABLE login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    session_duration INTEGER, -- in seconds
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
