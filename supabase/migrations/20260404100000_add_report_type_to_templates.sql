-- Add report_type and category columns to report_templates if they don't exist yet
ALTER TABLE report_templates
  ADD COLUMN IF NOT EXISTS report_type text,
  ADD COLUMN IF NOT EXISTS category text;
