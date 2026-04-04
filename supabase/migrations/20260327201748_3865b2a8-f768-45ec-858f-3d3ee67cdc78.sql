
-- Add new columns to generated_reports
ALTER TABLE generated_reports
  ADD COLUMN IF NOT EXISTS report_type        text DEFAULT 'relatorio_tecnico',
  ADD COLUMN IF NOT EXISTS report_number      text,
  ADD COLUMN IF NOT EXISTS report_date        date,
  ADD COLUMN IF NOT EXISTS report_location    text,
  ADD COLUMN IF NOT EXISTS responsible_name   text,
  ADD COLUMN IF NOT EXISTS responsible_role   text,
  ADD COLUMN IF NOT EXISTS client_company     text,
  ADD COLUMN IF NOT EXISTS client_contact     text,
  ADD COLUMN IF NOT EXISTS weather_condition  text,
  ADD COLUMN IF NOT EXISTS access_condition   text,
  ADD COLUMN IF NOT EXISTS site_condition     text,
  ADD COLUMN IF NOT EXISTS team_members       jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS occurrences        text,
  ADD COLUMN IF NOT EXISTS materials          jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS images             jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS folder_id          uuid,
  ADD COLUMN IF NOT EXISTS status             text DEFAULT 'concluido';

-- Create report_folders table
CREATE TABLE IF NOT EXISTS report_folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name       text NOT NULL,
  color      text DEFAULT '#1A56DB',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE report_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can manage folders"
  ON report_folders FOR ALL
  USING (org_id = get_user_org_id());

-- Foreign key for folder_id
ALTER TABLE generated_reports
  ADD CONSTRAINT fk_report_folder
  FOREIGN KEY (folder_id) REFERENCES report_folders(id) ON DELETE SET NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_reports_folder ON generated_reports(folder_id);
CREATE INDEX IF NOT EXISTS idx_reports_type   ON generated_reports(org_id, report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date   ON generated_reports(org_id, report_date DESC);
