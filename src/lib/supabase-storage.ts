// ============================================
// OPTIMAL BREAKS — Storage bucket `media` (URLs y subida servidor)
// Convención de rutas sugerida: artists/{slug}.webp, events/..., blog/..., etc.
// ============================================

import { createServiceSupabase } from './supabase-admin'

export const MEDIA_BUCKET = 'media' as const

/** URL pública si ya conoces la ruta del objeto dentro del bucket (sin prefijo "media/"). */
export function publicMediaObjectUrl(objectPath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
  if (!base) return null
  const p = objectPath.replace(/^\/+/, '')
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${encodeURI(p)}`
}

export type UploadMediaResult =
  | { ok: true; path: string; publicUrl: string }
  | { ok: false; error: string }

/**
 * Sube un archivo al bucket `media` usando la service role.
 * Solo llamar desde Route Handlers, Server Actions o scripts Node.
 */
export async function uploadPublicMedia(
  objectPath: string,
  body: Buffer | ArrayBuffer | Blob,
  contentType: string,
  options?: { upsert?: boolean }
): Promise<UploadMediaResult> {
  const path = objectPath.replace(/^\/+/, '')
  if (!path) return { ok: false, error: 'Ruta de objeto vacía' }

  try {
    const supabase = createServiceSupabase()
    const { data, error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, body, {
      contentType,
      upsert: options?.upsert ?? false,
    })
    if (error) return { ok: false, error: error.message }

    const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(data.path)
    return { ok: true, path: data.path, publicUrl: pub.publicUrl }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}
