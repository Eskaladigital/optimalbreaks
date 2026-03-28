/**
 * OPTIMAL BREAKS — Agente (OpenAI + búsqueda opcional) → JSON de artista
 *
 * Uso:
 *   node scripts/generar-artista-agente.mjs <slug> "Nombre del artista" [--notes archivo.txt] [--stdout] [--no-search]
 *   npm run db:artist:agent -- krafty-kuts "Krafty Kuts"
 *
 * Requiere OPENAI_API_KEY en .env.local.
 * Opcional: SERPAPI_API_KEY (Google via serpapi.com) para contexto de búsqueda.
 *
 * Escribe por defecto: data/artists/<slug>.json
 * Luego: npm run db:artist -- data/artists/<slug>.json
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, dirname, join } from 'path'
import { fileURLToPath } from 'url'

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
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    if (process.env[k] === undefined) process.env[k] = v
  }
}

const VALID_CATEGORIES = ['pioneer', 'uk_legend', 'us_artist', 'andalusian', 'current', 'crew']

const SYSTEM_PROMPT_PATH = join(__dirname, 'prompts', 'artista-agente-system.txt')

function loadSystemPrompt() {
  if (existsSync(SYSTEM_PROMPT_PATH)) {
    return readFileSync(SYSTEM_PROMPT_PATH, 'utf8').trim()
  }
  console.error('Falta el prompt:', SYSTEM_PROMPT_PATH)
  process.exit(1)
}

async function fetchSerpContext(query, apiKey) {
  if (!apiKey) return ''
  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('q', query)
  url.searchParams.set('num', '10')
  url.searchParams.set('api_key', apiKey)
  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      console.warn('[agente] SerpAPI HTTP', res.status, '(sigue sin contexto web)')
      return ''
    }
    const data = await res.json()
    const bits = []
    if (data.organic_results && Array.isArray(data.organic_results)) {
      for (const r of data.organic_results.slice(0, 8)) {
        if (r.title) bits.push(`Título: ${r.title}`)
        if (r.snippet) bits.push(`Resumen: ${r.snippet}`)
        if (r.link) bits.push(`URL: ${r.link}`)
        bits.push('---')
      }
    }
    if (data.answer_box?.answer) bits.push(`Answer: ${data.answer_box.answer}`)
    const text = bits.join('\n').slice(0, 12000)
    return text || ''
  } catch (e) {
    console.warn('[agente] SerpAPI error:', e.message)
    return ''
  }
}

function buildUserPrompt({ slug, artistName, extraNotes, research }) {
  let s = `Genera el JSON del artista siguiendo el prompt de sistema V2 (redactor Optimal Breaks).

slug (kebab-case): ${slug}
Nombre artístico principal: ${artistName}
`
  if (research) {
    s += `
CONTEXTO DE BÚSQUEDA WEB (puede contener errores; contrasta y no inventes cifras exactas sin soporte):
---
${research}
---
`
  } else {
    s += '\nNo hay contexto web; usa conocimiento fiable hasta tu fecha de corte y sé conservador con datos específicos.\n'
  }
  if (extraNotes) {
    s += `
NOTAS DEL EDITOR (máxima prioridad si hay conflicto con web o modelo):
---
${extraNotes}
---
`
  }
  s += `
CHECKLIST V2 (obligatorio antes de cerrar la respuesta):
- Solo un objeto JSON parseable; sin markdown, sin texto fuera del JSON, sin campos extra.
- Prioridad de fuentes: notas del editor > contexto web > conocimiento general.
- No inventes charts, fechas exactas, premios, sellos, colaboraciones ni URLs sin base razonable.
- slug EXACTO (kebab-case, solo a-z, 0-9, guiones): "${slug}"
- bio_es y bio_en: 12–18 párrafos cada una; separa párrafos con \\n\\n dentro del string JSON.
- Arrays sin duplicados ni strings vacíos; sin placeholders (TBD, N/A, unknown).
- socials y website: solo URLs https presentes en contexto o notas; si no hay evidencia, {} y null.
- image_url: null salvo URL https pública clara y estable en el contexto.
`
  return s
}

function uniqueNonEmptyStrings(arr) {
  if (!Array.isArray(arr)) return []
  const seen = new Set()
  const out = []
  for (const x of arr) {
    const t = String(x ?? '').trim()
    if (!t) continue
    const k = t.toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(t)
  }
  return out
}

function normalizeSocials(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k).trim().toLowerCase()
    const url = String(v ?? '').trim()
    if (!key || !url.startsWith('https://')) continue
    if (!out[key]) out[key] = url
  }
  return out
}

async function openAiJson({ system, user }) {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) {
    console.error('Falta OPENAI_API_KEY en .env.local')
    process.exit(1)
  }
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.28,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('OpenAI error:', res.status, err)
    process.exit(1)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    console.error('Respuesta OpenAI vacía')
    process.exit(1)
  }
  let raw = content.trim()
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  return JSON.parse(raw)
}

function normalizeArtist(obj, expectedSlug) {
  const out = { ...obj }
  out.slug = (out.slug || expectedSlug).toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '') || expectedSlug
  if (!VALID_CATEGORIES.includes(out.category)) out.category = 'current'
  out.name_display = String(out.name_display || out.name || '').toUpperCase()
  out.styles = uniqueNonEmptyStrings(out.styles)
  out.essential_tracks = uniqueNonEmptyStrings(out.essential_tracks)
  out.recommended_mixes = uniqueNonEmptyStrings(out.recommended_mixes)
  out.related_artists = uniqueNonEmptyStrings(out.related_artists)
  out.labels_founded = uniqueNonEmptyStrings(out.labels_founded)
  out.key_releases = Array.isArray(out.key_releases) ? out.key_releases : []
  out.socials = normalizeSocials(out.socials)
  const web = out.website === undefined ? null : out.website
  out.website =
    typeof web === 'string' && web.trim().startsWith('https://') ? web.trim() : null
  const rn = out.real_name
  if (rn === undefined || rn === null) out.real_name = null
  else {
    const t = String(rn).trim()
    out.real_name = t || null
  }
  const img = out.image_url
  out.image_url =
    typeof img === 'string' && img.trim().startsWith('https://') ? img.trim() : null
  if (typeof out.is_featured !== 'boolean') out.is_featured = false
  let so = typeof out.sort_order === 'number' ? out.sort_order : 50
  if (!Number.isFinite(so)) so = 50
  out.sort_order = Math.min(200, Math.max(1, Math.round(so)))
  for (const kr of out.key_releases) {
    if (typeof kr.year !== 'number') kr.year = 2000
    if (kr.note === undefined) kr.note = ''
  }
  return out
}

function validateMinimal(obj) {
  const err = []
  if (!obj.slug) err.push('slug')
  if (!obj.name || !String(obj.name).trim()) err.push('name')
  if (!obj.name_display || !String(obj.name_display).trim()) err.push('name_display')
  if (!obj.bio_en || !String(obj.bio_en).trim()) err.push('bio_en')
  if (!obj.bio_es || !String(obj.bio_es).trim()) err.push('bio_es')
  return err
}

async function main() {
  loadEnvLocal()
  const argv = process.argv.slice(2)
  let noSearch = false
  let stdout = false
  const filtered = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--no-search') noSearch = true
    else if (argv[i] === '--stdout') stdout = true
    else if (argv[i] === '--notes' && argv[i + 1]) {
      filtered.push({ type: 'notes', path: argv[++i] })
    } else filtered.push(argv[i])
  }
  const pos = filtered.filter((x) => typeof x === 'string')
  if (pos.length < 2) {
    console.error(`Uso: node scripts/generar-artista-agente.mjs <slug> "Nombre artista" [--notes ruta.txt] [--stdout] [--no-search]`)
    process.exit(1)
  }
  const slug = pos[0]
  const artistName = pos[1]
  let extraNotes = ''
  const noteArg = filtered.find((x) => x && typeof x === 'object' && x.type === 'notes')
  if (noteArg) {
    const np = resolve(ROOT, noteArg.path)
    if (!existsSync(np)) {
      console.error('No existe archivo de notas:', np)
      process.exit(1)
    }
    extraNotes = readFileSync(np, 'utf8')
  }

  let research = ''
  if (!noSearch) {
    const serpKey = process.env.SERPAPI_API_KEY?.trim()
    if (serpKey) {
      const q = `${artistName} DJ producer breakbeat biography discography`
      console.log('[agente] Buscando contexto (SerpAPI)...')
      research = await fetchSerpContext(q, serpKey)
      if (research) console.log('[agente] Contexto web:', research.length, 'caracteres')
      else console.log('[agente] Sin resultados útiles de SerpAPI')
    } else {
      console.log('[agente] SERPAPI_API_KEY no definida; modo solo modelo.')
    }
  }

  const userPrompt = buildUserPrompt({ slug, artistName, extraNotes, research })
  console.log('[agente] Llamando OpenAI...')
  let parsed
  try {
    parsed = await openAiJson({ system: loadSystemPrompt(), user: userPrompt })
  } catch (e) {
    console.error('JSON inválido del modelo:', e.message)
    process.exit(1)
  }

  const normalized = normalizeArtist(parsed, slug)
  const bad = validateMinimal(normalized)
  if (bad.length) {
    console.error('Faltan campos:', bad.join(', '))
    process.exit(1)
  }

  const jsonOut = JSON.stringify(normalized, null, 2) + '\n'
  if (stdout) {
    process.stdout.write(jsonOut)
    return
  }
  const dir = join(ROOT, 'data', 'artists')
  mkdirSync(dir, { recursive: true })
  const outPath = join(dir, `${normalized.slug}.json`)
  writeFileSync(outPath, jsonOut, 'utf8')
  console.log('Escrito:', outPath)
  console.log('Siguiente paso: npm run db:artist -- data/artists/' + normalized.slug + '.json')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
