-- Allow users to update their own org's reports (for moving to folders)
CREATE POLICY "Users can update own org reports"
ON public.generated_reports
FOR UPDATE
TO authenticated
USING (org_id = get_user_org_id())
WITH CHECK (org_id = get_user_org_id());

-- Allow users to delete their own org's folders
CREATE POLICY "Users can delete org folders"
ON public.report_folders
FOR DELETE
TO authenticated
USING (org_id = get_user_org_id());