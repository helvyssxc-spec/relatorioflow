ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pagbank_subscription_id text;

CREATE INDEX IF NOT EXISTS idx_subscriptions_pagbank_subscription_id
  ON public.subscriptions (pagbank_subscription_id);
