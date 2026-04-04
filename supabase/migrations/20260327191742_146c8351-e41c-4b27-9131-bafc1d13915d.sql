-- Drop old duplicate policies that are now covered by admin-aware ones
DROP POLICY IF EXISTS "Users can view org members" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own org" ON public.organizations;
DROP POLICY IF EXISTS "Users can view org subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view org payment events" ON public.payment_events;
DROP POLICY IF EXISTS "Users can view own org reports" ON public.generated_reports;