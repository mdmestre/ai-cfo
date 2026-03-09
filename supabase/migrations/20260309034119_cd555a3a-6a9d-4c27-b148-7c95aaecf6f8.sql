-- Drop existing overly-permissive storage policies
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their company receipts" ON storage.objects;

-- Create company-scoped INSERT policy
CREATE POLICY "company_receipts_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

-- Create company-scoped SELECT policy
CREATE POLICY "company_receipts_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );

-- Create company-scoped DELETE policy
CREATE POLICY "company_receipts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] IN (
      SELECT company_id::text FROM public.memberships
      WHERE user_id = auth.uid()
    )
  );