ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS pagbank_order_id text,
  ADD COLUMN IF NOT EXISTS pagbank_card_token text,
  ADD COLUMN IF NOT EXISTS pagbank_charge_id text,
  ADD COLUMN IF NOT EXISTS card_last_digits text,
  ADD COLUMN IF NOT EXISTS card_brand text;

CREATE POLICY "Users can insert org subscriptions" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (org_id = get_user_org_id());

CREATE POLICY "Users can update org subscriptions" ON public.subscriptions
  FOR UPDATE TO authenticated USING (org_id = get_user_org_id());

CREATE POLICY "Anon can insert payment events" ON public.payment_events
  FOR INSERT TO anon WITH CHECK (true);