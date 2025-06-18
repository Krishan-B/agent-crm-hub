-- Enable Row Level Security (RLS) policies for the users table
-- Ensure that appropriate RLS policies are defined here
-- For example:
-- CREATE POLICY "Admins can see all users" ON users FOR SELECT TO admin_role USING (true);
-- CREATE POLICY "Users can see their own data" ON users FOR SELECT USING (auth.uid() = id);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('admin', 'agent') NOT NULL,
    department VARCHAR(100),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Removed ON UPDATE CURRENT_TIMESTAMP as it's not standard SQL and Supabase handles this with triggers if needed.
    last_login TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Add a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
