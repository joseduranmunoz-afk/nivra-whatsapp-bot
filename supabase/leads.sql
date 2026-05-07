-- Ejecutar en Supabase > SQL Editor
CREATE TABLE IF NOT EXISTS leads (
  id            BIGSERIAL PRIMARY KEY,
  phone         TEXT NOT NULL,
  tag           TEXT,
  name          TEXT,
  company       TEXT,
  email         TEXT,
  contact_role  TEXT,
  company_size  TEXT,
  main_interest TEXT,
  lead_status   TEXT,
  preferred_schedule TEXT,
  captured_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index para búsqueda por teléfono y tag
CREATE INDEX IF NOT EXISTS leads_phone_idx ON leads(phone);
CREATE INDEX IF NOT EXISTS leads_tag_idx ON leads(tag);
CREATE INDEX IF NOT EXISTS leads_captured_at_idx ON leads(captured_at DESC);

-- RLS desactivado (acceso solo con service key del servidor)
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
