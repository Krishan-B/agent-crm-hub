
-- Step 1: Create a function to get the current user's role to avoid infinite recursion in RLS.
-- This function is defined with SECURITY DEFINER to run with the permissions of the user who defined it,
-- allowing it to bypass RLS on the profiles table for the role check.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- Bypasses RLS to get the role of the currently authenticated user.
  -- This is safe because it only queries the row for the user making the request.
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop all existing, overly permissive policies on all tables.
-- It's safer to drop and recreate than to alter.

-- Drop policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Drop policies for login_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.login_sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.login_sessions;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.login_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.login_sessions;

-- Drop policies for leads
DROP POLICY IF EXISTS "Authenticated users can view leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;

-- Drop policies for lead_activities
DROP POLICY IF EXISTS "Authenticated users can view activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Authenticated users can insert activities" ON public.lead_activities;
DROP POLICY IF EXISTS "Authenticated users can update activities" ON public.lead_activities;

-- Drop policies for transactions
DROP POLICY IF EXISTS "Authenticated users can view transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON public.transactions;

-- Drop policies for kyc_documents
DROP POLICY IF EXISTS "Authenticated users can view kyc documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Authenticated users can insert kyc documents" ON public.kyc_documents;
DROP POLICY IF EXISTS "Authenticated users can update kyc documents" ON public.kyc_documents;

-- Step 3: Create new, secure RLS policies.

-- Policies for 'profiles' table
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins can insert new profiles" ON public.profiles FOR INSERT WITH CHECK (public.get_current_user_role() = 'admin');
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE USING (public.get_current_user_role() = 'admin');

-- Policies for 'login_sessions' table
CREATE POLICY "Users can manage their own sessions" ON public.login_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.login_sessions FOR SELECT USING (public.get_current_user_role() = 'admin');

-- Policies for 'leads' table
CREATE POLICY "Admins can manage all leads" ON public.leads FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can view their assigned leads" ON public.leads FOR SELECT USING (assigned_agent_id = auth.uid());
CREATE POLICY "Agents and Admins can insert new leads" ON public.leads FOR INSERT WITH CHECK (public.get_current_user_role() IN ('agent', 'admin'));
CREATE POLICY "Agents can update their assigned leads" ON public.leads FOR UPDATE USING (assigned_agent_id = auth.uid()) WITH CHECK (assigned_agent_id = auth.uid());

-- Policies for 'lead_activities' table
CREATE POLICY "Admins can manage all lead activities" ON public.lead_activities FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can view activities for their leads" ON public.lead_activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
);
CREATE POLICY "Agents can insert activities for their leads" ON public.lead_activities FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
  AND created_by = auth.uid()
);
CREATE POLICY "Agents can update their own activities" ON public.lead_activities FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());


-- Policies for 'transactions' table
CREATE POLICY "Admins can manage all transactions" ON public.transactions FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can view transactions for their leads" ON public.transactions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
);

-- Policies for 'kyc_documents' table
CREATE POLICY "Admins can manage all kyc documents" ON public.kyc_documents FOR ALL USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Agents can manage kyc documents for their leads" ON public.kyc_documents FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = lead_id AND assigned_agent_id = auth.uid()
  )
);

-- Step 4: Drop and recreate storage policies for the 'kyc-documents' bucket.
-- Drop old policies
DROP POLICY IF EXISTS "Authenticated users can upload KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete KYC documents" ON storage.objects;

-- Create a helper function to check if a user has access to a lead, for use in storage policies.
CREATE OR REPLACE FUNCTION public.can_access_lead(p_lead_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.get_current_user_role() = 'admin' THEN
    RETURN TRUE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.leads
    WHERE id = p_lead_id AND assigned_agent_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new policies for storage
-- Assumes file path is in the format: "{lead_id}/{file_name}"
-- Users can only operate on files inside a folder named with a lead_id they have access to.

CREATE POLICY "Users can manage KYC docs for assigned leads" ON storage.objects
FOR ALL
USING (
  bucket_id = 'kyc-documents' AND
  public.can_access_lead((storage.foldername(name))[1]::uuid)
)
WITH CHECK (
  bucket_id = 'kyc-documents' AND
  public.can_access_lead((storage.foldername(name))[1]::uuid)
);

