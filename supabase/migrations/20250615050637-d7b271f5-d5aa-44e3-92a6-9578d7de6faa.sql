
-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  country TEXT NOT NULL,
  date_of_birth DATE,
  status TEXT NOT NULL DEFAULT 'new',
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_contact DATE,
  assigned_agent_id UUID REFERENCES public.profiles(id),
  kyc_status TEXT DEFAULT 'not_submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_activities table for tracking interactions
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'comment', 'kyc_submit', 'balance_add', 'status_change', etc.
  content TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'deposit', 'bonus', 'withdrawal'
  amount DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  reference TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kyc_documents table
CREATE TABLE public.kyc_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'government_id', 'proof_of_address', 'selfie_with_id'
  file_path TEXT, -- will store path to file in Supabase storage
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for leads (all authenticated users can access)
CREATE POLICY "Authenticated users can view leads" ON public.leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON public.leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON public.leads FOR DELETE TO authenticated USING (true);

-- Create RLS policies for lead_activities
CREATE POLICY "Authenticated users can view activities" ON public.lead_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activities" ON public.lead_activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update activities" ON public.lead_activities FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for transactions
CREATE POLICY "Authenticated users can view transactions" ON public.transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert transactions" ON public.transactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for kyc_documents
CREATE POLICY "Authenticated users can view kyc documents" ON public.kyc_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert kyc documents" ON public.kyc_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update kyc documents" ON public.kyc_documents FOR UPDATE TO authenticated USING (true);

-- Create storage bucket for KYC documents
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

-- Create storage policies for kyc-documents bucket
CREATE POLICY "Authenticated users can upload KYC documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Authenticated users can view KYC documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'kyc-documents');

CREATE POLICY "Authenticated users can update KYC documents" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'kyc-documents');

CREATE POLICY "Authenticated users can delete KYC documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'kyc-documents');

-- Insert some sample data
INSERT INTO public.leads (first_name, last_name, email, phone, country, status, balance, bonus_amount, assigned_agent_id) VALUES
('John', 'Smith', 'john.smith@example.com', '+1-555-0123', 'United States', 'new', 0, 0, (SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1)),
('Emma', 'Johnson', 'emma.johnson@example.com', '+1-555-0124', 'Canada', 'kyc_pending', 1000, 100, (SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1)),
('Michael', 'Brown', 'michael.brown@example.com', '+44-20-7946-0958', 'United Kingdom', 'contacted', 500, 50, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1)),
('Sarah', 'Davis', 'sarah.davis@example.com', '+61-2-9374-4000', 'Australia', 'kyc_approved', 2000, 200, (SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1)),
('David', 'Wilson', 'david.wilson@example.com', '+49-30-12345678', 'Germany', 'active', 5000, 500, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1));

-- Add some sample activities
INSERT INTO public.lead_activities (lead_id, activity_type, content, created_by) VALUES
((SELECT id FROM public.leads WHERE email = 'emma.johnson@example.com'), 'comment', 'Initial contact made via email', (SELECT id FROM public.profiles WHERE role = 'agent' LIMIT 1)),
((SELECT id FROM public.leads WHERE email = 'emma.johnson@example.com'), 'kyc_submit', 'KYC documents submitted', NULL),
((SELECT id FROM public.leads WHERE email = 'john.smith@example.com'), 'registration', 'Lead registered on platform', NULL);

-- Add some sample transactions
INSERT INTO public.transactions (lead_id, type, amount, reference) VALUES
((SELECT id FROM public.leads WHERE email = 'emma.johnson@example.com'), 'deposit', 1000, 'DEP001'),
((SELECT id FROM public.leads WHERE email = 'emma.johnson@example.com'), 'bonus', 100, 'BON001'),
((SELECT id FROM public.leads WHERE email = 'sarah.davis@example.com'), 'deposit', 2000, 'DEP002'),
((SELECT id FROM public.leads WHERE email = 'sarah.davis@example.com'), 'bonus', 200, 'BON002'),
((SELECT id FROM public.leads WHERE email = 'david.wilson@example.com'), 'deposit', 5000, 'DEP003'),
((SELECT id FROM public.leads WHERE email = 'david.wilson@example.com'), 'bonus', 500, 'BON003');

-- Add some sample KYC documents
INSERT INTO public.kyc_documents (lead_id, document_type, status) VALUES
((SELECT id FROM public.leads WHERE email = 'emma.johnson@example.com'), 'government_id', 'approved'),
((SELECT id FROM public.leads WHERE email = 'emma.johnson@example.com'), 'proof_of_address', 'pending'),
((SELECT id FROM public.leads WHERE email = 'emma.johnson@example.com'), 'selfie_with_id', 'pending'),
((SELECT id FROM public.leads WHERE email = 'sarah.davis@example.com'), 'government_id', 'approved'),
((SELECT id FROM public.leads WHERE email = 'sarah.davis@example.com'), 'proof_of_address', 'approved'),
((SELECT id FROM public.leads WHERE email = 'sarah.davis@example.com'), 'selfie_with_id', 'approved');
