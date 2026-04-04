
-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.profiles(id),
  ticket_number  serial,
  subject        text NOT NULL,
  category       text NOT NULL DEFAULT 'duvida',
  status         text NOT NULL DEFAULT 'aberto',
  priority       text NOT NULL DEFAULT 'normal',
  archived       boolean DEFAULT false,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  resolved_at    timestamptz
);

-- Support messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id    uuid NOT NULL REFERENCES public.profiles(id),
  sender_role  text NOT NULL DEFAULT 'user',
  content      text NOT NULL,
  read_at      timestamptz,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user sees own tickets" ON public.support_tickets FOR ALL
  USING (org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "admin sees all tickets" ON public.support_tickets FOR ALL
  USING (public.is_admin());

CREATE POLICY "user sees own ticket messages" ON public.support_messages FOR ALL
  USING (ticket_id IN (
    SELECT id FROM public.support_tickets
    WHERE org_id IN (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  ));

CREATE POLICY "admin sees all messages" ON public.support_messages FOR ALL
  USING (public.is_admin());

-- Indexes for support
CREATE INDEX IF NOT EXISTS idx_tickets_org ON public.support_tickets(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_ticket ON public.support_messages(ticket_id, created_at ASC);

-- Trigger: update ticket timestamp on new message
CREATE OR REPLACE FUNCTION public.update_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_tickets SET updated_at = now() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.support_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_ticket_timestamp();

-- Performance indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_reports_org_date ON public.generated_reports(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_org_type ON public.generated_reports(org_id, report_type);
CREATE INDEX IF NOT EXISTS idx_reports_folder ON public.generated_reports(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC) WHERE read = false;

-- Cleanup functions
CREATE OR REPLACE FUNCTION public.cleanup_old_reports()
RETURNS void AS $$
BEGIN
  DELETE FROM public.generated_reports
  WHERE org_id IN (SELECT id FROM public.organizations WHERE plan = 'starter')
  AND created_at < now() - interval '30 days';

  DELETE FROM public.generated_reports
  WHERE org_id IN (SELECT id FROM public.organizations WHERE plan = 'pro')
  AND created_at < now() - interval '6 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications WHERE read = true AND created_at < now() - interval '30 days';
  DELETE FROM public.notifications WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.archive_old_tickets()
RETURNS void AS $$
BEGIN
  UPDATE public.support_tickets SET archived = true
  WHERE status IN ('resolvido', 'fechado')
  AND updated_at < now() - interval '6 months'
  AND archived = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
