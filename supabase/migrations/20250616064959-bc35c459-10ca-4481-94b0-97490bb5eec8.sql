
-- Create storage policies for KYC documents (skip bucket creation since it exists)
-- Users can upload files for leads they have access to
CREATE POLICY "Users can upload KYC documents for accessible leads" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'kyc-documents' AND
  public.can_access_lead((storage.foldername(name))[1]::uuid)
);

-- Users can view files for leads they have access to
CREATE POLICY "Users can view KYC documents for accessible leads" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'kyc-documents' AND
  public.can_access_lead((storage.foldername(name))[1]::uuid)
);

-- Users can update files for leads they have access to
CREATE POLICY "Users can update KYC documents for accessible leads" ON storage.objects
FOR UPDATE TO authenticated USING (
  bucket_id = 'kyc-documents' AND
  public.can_access_lead((storage.foldername(name))[1]::uuid)
);

-- Users can delete files for leads they have access to (admins only)
CREATE POLICY "Admins can delete KYC documents" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'kyc-documents' AND
  public.get_current_user_role() = 'admin'
);
