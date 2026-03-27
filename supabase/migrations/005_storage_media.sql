-- ============================================
-- OPTIMAL BREAKS — Supabase Storage: imágenes de contenido
-- Bucket público `media` para artistas, eventos, blog, sellos, escenas, mixes.
-- Tras aplicar: sube archivos (Dashboard → Storage o API con service role)
-- y guarda en image_url la URL pública:
--   {SUPABASE_URL}/storage/v1/object/public/media/{ruta}
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública de objetos en `media` (URLs /object/public/...)
DROP POLICY IF EXISTS "media_select_public" ON storage.objects;
CREATE POLICY "media_select_public"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'media');

-- Sin política INSERT/UPDATE/DELETE para anon/authenticated: solo el service role
-- (o subidas desde el panel de Supabase) pueden escribir. Así los usuarios del
-- dashboard del sitio no rellenan el bucket sin control.
