-- =============================================
-- EVENTS — campos extendidos
-- stages, schedule, tickets, socials, tags, etc.
-- =============================================

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tickets_url TEXT,
  ADD COLUMN IF NOT EXISTS socials JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS capacity INTEGER,
  ADD COLUMN IF NOT EXISTS age_restriction TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS doors_open TIME,
  ADD COLUMN IF NOT EXISTS doors_close TIME,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS coords JSONB;

COMMENT ON COLUMN public.events.stages IS
  'JSON array: [{"name":"Stage Retro","description_en":"...","description_es":"...","lineup":["DJ A","DJ B"]}]';
COMMENT ON COLUMN public.events.schedule IS
  'JSON array: [{"time":"16:00","artist":"DJ A","stage":"Stage Retro","duration_min":60}]';
COMMENT ON COLUMN public.events.coords IS
  '{"lat":37.88,"lng":-4.78} — para mapa estático o enlace Google Maps';
