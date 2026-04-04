
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Service role inserts notifications via triggers
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify when report is generated
CREATE OR REPLACE FUNCTION public.notify_report_generated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, org_id, type, title, message, metadata)
  VALUES (
    NEW.user_id,
    NEW.org_id,
    'report',
    'Relatório gerado com sucesso',
    'Seu ' || COALESCE(
      CASE NEW.report_type
        WHEN 'diario_de_obra' THEN 'Diário de Obra'
        WHEN 'vistoria' THEN 'Vistoria'
        WHEN 'laudo_tecnico' THEN 'Laudo Técnico'
        WHEN 'relatorio_tecnico' THEN 'Relatório Técnico'
        WHEN 'inspecao' THEN 'Inspeção'
        ELSE 'Relatório'
      END, 'Relatório'
    ) || ' foi gerado.',
    jsonb_build_object('report_id', NEW.id, 'report_type', NEW.report_type)
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_report_generated
AFTER INSERT ON public.generated_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_report_generated();

-- Trigger: notify org owner when invitation is accepted
CREATE OR REPLACE FUNCTION public.notify_invite_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _owner_id uuid;
  _invitee_email text;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    SELECT id INTO _owner_id FROM public.profiles
    WHERE org_id = NEW.org_id AND role = 'owner' LIMIT 1;
    
    IF _owner_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, org_id, type, title, message, metadata)
      VALUES (
        _owner_id,
        NEW.org_id,
        'team',
        'Novo membro na equipe',
        NEW.email || ' aceitou o convite e entrou na equipe.',
        jsonb_build_object('email', NEW.email)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_invite_accepted
AFTER UPDATE ON public.team_invitations
FOR EACH ROW EXECUTE FUNCTION public.notify_invite_accepted();
