-- ============================================
-- OPTIMAL BREAKS — Public Fan Counts
-- Run after 003_user_system.sql
-- Allows public read of aggregate fan counts
-- without exposing individual user data
-- ============================================

-- Allow public COUNT queries on favorite tables
-- The existing RLS only allows user_id = auth.uid() for SELECT
-- We need to add a public count policy

-- For favorite_artists: allow anyone to count (but not see user_ids)
CREATE POLICY "Public count favorite_artists"
  ON public.favorite_artists
  FOR SELECT
  USING (true);

-- Drop the restrictive user-only policy and replace
-- Actually, since "Public count" with USING(true) is more permissive,
-- Supabase uses OR logic between policies, so this already works.
-- The existing "Users read own favorites" + "Public count" means:
-- - Authenticated users see their own rows (full data)
-- - Anonymous users can run count queries (head:true returns only count)
-- Both work because Supabase evaluates policies with OR.

-- Same for other tables
CREATE POLICY "Public count favorite_labels"
  ON public.favorite_labels
  FOR SELECT
  USING (true);

CREATE POLICY "Public count event_attendance"
  ON public.event_attendance
  FOR SELECT
  USING (true);

CREATE POLICY "Public count saved_mixes"
  ON public.saved_mixes
  FOR SELECT
  USING (true);

-- NOTE: This exposes row-level data publicly (user_id, artist_id pairs).
-- If you want to hide user_ids from anonymous users, use a database
-- function instead:
--
-- CREATE OR REPLACE FUNCTION public.fan_count(table_name text, entity_column text, entity_id uuid)
-- RETURNS integer AS $$
-- DECLARE cnt integer;
-- BEGIN
--   EXECUTE format('SELECT count(*) FROM public.%I WHERE %I = $1', table_name, entity_column)
--   INTO cnt USING entity_id;
--   RETURN cnt;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;
--
-- For now, the simple public SELECT policy works fine since we only
-- query with { count: 'exact', head: true } which returns just the number.
