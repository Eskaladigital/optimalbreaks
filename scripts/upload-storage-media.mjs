/**
 * Sube un archivo local al bucket público `media` (Supabase Storage).
 *
 * Índice agente: scripts/guia-base-datos.mjs → run media-upload -- <archivo> <ruta-bucket>
 *
 * Uso:
 *   node scripts/upload-storage-media.mjs <archivo-local> <ruta-en-bucket>
 *   node scripts/upload-storage-media.mjs --url <https://...> <ruta-en-bucket>
 *
 * Ejemplo (tras descargar o exportar una portada):
 *   node scripts/upload-storage-media.mjs ./cover.jpg events/raveart-summer-festival-2025/cover.webp
 *
 * Ejemplo (descarga y sube sin archivo local):
 *   node scripts/upload-storage-media.mjs --url https://example.com/x.jpg artists/foo/cover.jpg
 *
 * Credenciales (.env.local): NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY
 *
 * Las fotos de la galería de terceros (p. ej. Raveart) pueden estar sujetas a derechos de autor;
 * usa material con permiso o fotos propias antes de subir.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

function loadEnvLocal() {
  const p = join(ROOT, '.env.local')
  if (!existsSync(p)) return
  let text = readFileSync(p, 'utf8')
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)
  for (const line of text.split('\n')) {
    let t = line.trim()
    if (t.startsWith('export ')) t = t.slice(7).trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (process.env[k] === undefined) process.env[k] = v
  }
}

function mimeForPath(p) {
  const lower = p.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.avif')) return 'image/avif'
  return 'application/octet-stream'
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim() || ''

const argv = process.argv.slice(2)
const fromUrl = argv[0] === '--url'
let buf
let contentTypeHint = 'image/jpeg'

if (fromUrl) {
  const imageUrl = argv[1]
  const objectPath = argv[2]
  if (!imageUrl || !objectPath || !/^https:\/\//i.test(imageUrl)) {
    console.error('Uso: node scripts/upload-storage-media.mjs --url <https://...> <ruta-en-bucket>')
    process.exit(1)
  }
  if (!url || !key) {
    console.error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en .env.local',
    )
    process.exit(1)
  }
  const normalized = objectPath.replace(/^\/+/, '')
  console.log('Descargando:', imageUrl)
  const res = await fetch(imageUrl, {
    headers: {
      'User-Agent': 'OptimalBreaksMediaMirror/1.0 (archivo propio; CC donde aplique)',
    },
  })
  if (!res.ok) {
    console.error('HTTP', res.status, res.statusText)
    process.exit(1)
  }
  buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type')
  if (ct && ct.startsWith('image/')) contentTypeHint = ct.split(';')[0].trim()
  else contentTypeHint = mimeForPath(normalized)

  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await client.storage.from('media').upload(normalized, buf, {
    contentType: contentTypeHint,
    upsert: true,
  })
  if (error) {
    console.error('Error al subir:', error.message)
    process.exit(1)
  }
  const publicUrl = `${url.replace(/\/$/, '')}/storage/v1/object/public/media/${normalized}`
  console.log('OK:', data?.path || normalized)
  console.log('URL pública:', publicUrl)
  console.log('SQL ejemplo: UPDATE public.artists SET image_url = ' + JSON.stringify(publicUrl) + " WHERE slug = '…';")
  process.exit(0)
}

const localPath = argv[0]
const objectPath = argv[1]
if (!localPath || !objectPath) {
  console.error('Uso: node scripts/upload-storage-media.mjs <archivo-local> <ruta-en-bucket>')
  console.error('  o: node scripts/upload-storage-media.mjs --url <https://...> <ruta-en-bucket>')
  process.exit(1)
}
if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en .env.local')
  process.exit(1)
}

const abs = resolve(process.cwd(), localPath)
if (!existsSync(abs)) {
  console.error('No existe el archivo:', abs)
  process.exit(1)
}

const normalized = objectPath.replace(/^\/+/, '')
buf = readFileSync(abs)
const client = createClient(url, key, { auth: { persistSession: false } })

const { data, error } = await client.storage.from('media').upload(normalized, buf, {
  contentType: mimeForPath(abs),
  upsert: true,
})

if (error) {
  console.error('Error al subir:', error.message)
  process.exit(1)
}

const publicUrl = `${url.replace(/\/$/, '')}/storage/v1/object/public/media/${normalized}`
console.log('OK:', data?.path || normalized)
console.log('URL pública:', publicUrl)
console.log('SQL ejemplo: UPDATE public.events SET image_url = ' + JSON.stringify(publicUrl) + " WHERE slug = '…';")
