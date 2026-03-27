-- ============================================
-- OPTIMAL BREAKS — Align slug + harden SECURITY DEFINER
-- Run after 003 if you already applied 002 with old slug.
-- ============================================

-- Match app routes / artists-timeline (was chemical-brothers in early seed)
UPDATE public.artists
SET slug = 'the-chemical-brothers'
WHERE slug = 'chemical-brothers';

-- Prevent search_path hijacking on SECURITY DEFINER helpers
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_updated_at() SET search_path = public;
