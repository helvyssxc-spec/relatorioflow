-- Security definer function to check if user is admin by email
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND email = 'helvyssxc@gmail.com'
  )
$$;

-- Allow admin to view ALL profiles
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id() OR id = auth.uid());

-- Allow admin to view ALL organizations
CREATE POLICY "Admin can view all orgs" ON public.organizations
  FOR SELECT TO authenticated
  USING (is_admin() OR id = get_user_org_id());

-- Allow admin to update ALL organizations (for plan changes etc)
CREATE POLICY "Admin can update all orgs" ON public.organizations
  FOR UPDATE TO authenticated
  USING (is_admin());

-- Allow admin to view ALL subscriptions
CREATE POLICY "Admin can view all subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id());

-- Allow admin to update ALL subscriptions
CREATE POLICY "Admin can update all subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (is_admin());

-- Allow admin to view ALL payment events
CREATE POLICY "Admin can view all payment events" ON public.payment_events
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id());

-- Allow admin to view ALL generated reports (for metrics)
CREATE POLICY "Admin can view all reports" ON public.generated_reports
  FOR SELECT TO authenticated
  USING (is_admin() OR org_id = get_user_org_id());