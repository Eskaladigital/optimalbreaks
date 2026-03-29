/**
 * OPTIMAL BREAKS — Agente: por cada artista (o query): SerpAPI → OpenAI → UPSERT events
 *
 * Flujo: NO acumula todo y luego una IA gigante. Es cadena
 *   [artista A] → buscar → modelo → guardar filas
 *   [artista B] → buscar → modelo → guardar filas
 *   … y opcionalmente lo mismo por cada búsqueda "keywords".
 *
 *   node scripts/descubrir-eventos-breakbeat.mjs
 *   node scripts/descubrir-eventos-breakbeat.mjs --per-artist-max 20 --artist-limit 50
 *   node scripts/descubrir-eventos-breakbeat.mjs --max 20   # alias de --per-artist-max
 *   node scripts/descubrir-eventos-breakbeat.mjs --max-total 100   # parar tras N upserts OK
 *   node scripts/descubrir-eventos-breakbeat.mjs --keywords-only
 *   node scripts/descubrir-eventos-breakbeat.mjs --also-keywords
 *   node scripts/descubrir-eventos-breakbeat.mjs --dry-run
 *
 * Requiere OPENAI_API_KEY. SerpAPI recomendada. Supabase SERVICE_ROLE salvo --keywords-only + solo keywords.
 *
 * Índice: node scripts/guia-base-datos.mjs run events-discover [--flags]
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SYSTEM_PROMPT_PATH = join(__dirname, 'prompts', 'eventos-breakbeat-descubrir-system.txt')

const VALID_EVENT_TYPES = new Set(['festival', 'club_night', 'past_iconic', 'upcoming'])

const EVENT_ROW_DEFAULTS = {
  stages: [],
  schedule: [],
  socials: {},
  tags: [],
  promoter_organization_id: null,
  image_url: null,
  capacity: null,
  age_restriction: null,
  doors_open: null,
  doors_close: null,
  address: null,
  coords: null,
  tickets_url: null,
}

const KEYWORD_QUERIES = [
  { q: 'breakbeat festival 2026 Spain', gl: 'es' },
  { q: 'breakbeat festival 2026 UK', gl: 'gb' },
  { q: 'nu skool breaks festival 2026 Europe', gl: 'de' },
  { q: 'breakbeat festival 2026 USA', gl: 'us' },
  { q: 'breakbeat jungle festival 2026 Australia', gl: 'au' },
  { q: 'breaks jungle festival 2026 worldwide', gl: '' },
  { q: 'Raveart festival 2026', gl: 'es' },
]

const OPERATIVE_CATEGORIES = ['current', 'uk_legend', 'us_artist', 'andalusian', 'crew']

function parseEnvText(text) {
  const out = {}
  let t0 = text
  if (t0.charCodeAt(0) === 0xfeff) t0 = t0.slice(1)
  for (const line of t0.split('\n')) {
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
    out[k] = v
  }
  return out
}

function loadEnv() {
  const base = existsSync(join(ROOT, '.env'))
    ? parseEnvText(readFileSync(join(ROOT, '.env'), 'utf8'))
    : {}
  const local = existsSync(join(ROOT, '.env.local'))
    ? parseEnvText(readFileSync(join(ROOT, '.env.local'), 'utf8'))
    : {}
  const merged = { ...base, ...local }
  for (const [k, v] of Object.entries(merged)) {
    if (process.env[k] === undefined) process.env[k] = v
  }
}

function loadSystemPrompt() {
  if (!existsSync(SYSTEM_PROMPT_PATH)) {
    console.error('Falta prompt:', SYSTEM_PROMPT_PATH)
    process.exit(1)
  }
  return readFileSync(SYSTEM_PROMPT_PATH, 'utf8').trim()
}

async function fetchSerpContext(query, apiKey, gl = '') {
  const url = new URL('https://serpapi.com/search.json')
  url.searchParams.set('engine', 'google')
  url.searchParams.set('q', query)
  url.searchParams.set('num', '10')
  if (gl) url.searchParams.set('gl', gl)
  url.searchParams.set('api_key', apiKey)
  const res = await fetch(url.toString())
  if (!res.ok) return ''
  const data = await res.json()
  const bits = []
  if (data.organic_results && Array.isArray(data.organic_results)) {
    for (const r of data.organic_results.slice(0, 10)) {
      if (r.title) bits.push(`Title: ${r.title}`)
      if (r.snippet) bits.push(`Snippet: ${r.snippet}`)
      if (r.link) bits.push(`URL: ${r.link}`)
      bits.push('---')
    }
  }
  return bits.join('\n').slice(0, 9000)
}

async function fetchOperativeArtists(sb, limit) {
  const { data, error } = await sb
    .from('artists')
    .select('name, name_display, slug, category')
    .in('category', OPERATIVE_CATEGORIES)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)
  return data || []
}

async function openAiJson({ system, user }) {
  const key = process.env.OPENAI_API_KEY?.trim()
  if (!key) throw new Error('Falta OPENAI_API_KEY')
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-5.4'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI ${res.status}: ${err}`)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Respuesta OpenAI vacía')
  let raw = content.trim()
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  return JSON.parse(raw)
}

function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

function uniqueStrings(arr) {
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

function normalizeEvent(raw, idx) {
  let slug = slugify(raw.slug)
  if (!slug) slug = slugify(raw.name) || `evento-descubierto-${idx}`
  const et = String(raw.event_type || 'upcoming').toLowerCase()
  const event_type = VALID_EVENT_TYPES.has(et) ? et : 'upcoming'

  let date_start =
    raw.date_start == null || raw.date_start === ''
      ? null
      : String(raw.date_start).slice(0, 10)
  if (date_start && !/^\d{4}-\d{2}-\d{2}$/.test(date_start)) date_start = null

  let date_end =
    raw.date_end == null || raw.date_end === ''
      ? null
      : String(raw.date_end).slice(0, 10)
  if (date_end && !/^\d{4}-\d{2}-\d{2}$/.test(date_end)) date_end = null

  const website =
    typeof raw.website === 'string' && raw.website.trim().startsWith('https://')
      ? raw.website.trim()
      : null

  const tags = uniqueStrings(raw.tags)
  const lineup = uniqueStrings(raw.lineup)

  return {
    ...EVENT_ROW_DEFAULTS,
    slug,
    name: String(raw.name || slug).trim() || slug,
    description_en: String(raw.description_en || '').trim(),
    description_es: String(raw.description_es || '').trim(),
    event_type,
    date_start,
    date_end,
    location: String(raw.location || '').trim() || 'TBA',
    city: String(raw.city || '').trim() || 'TBA',
    country: String(raw.country || '').trim() || '',
    venue: raw.venue ? String(raw.venue).trim() : null,
    website,
    lineup,
    tags,
    is_featured: false,
  }
}

function validateRow(row) {
  if (!row.slug) return 'slug'
  if (!row.name) return 'name'
  if (!row.description_en) return 'description_en'
  if (!row.description_es) return 'description_es'
  return null
}

function normalizeBatch(parsed, seenSlugsGlobal) {
  const rawList = Array.isArray(parsed.events) ? parsed.events : []
  const out = []
  for (let i = 0; i < rawList.length; i++) {
    const row = normalizeEvent(rawList[i], i)
    const base = row.slug
    let s = base
    let n = 0
    while (seenSlugsGlobal.has(s)) {
      n++
      s = `${base}-${n}`
    }
    row.slug = s
    seenSlugsGlobal.add(s)
    const bad = validateRow(row)
    if (bad) {
      console.warn('[discover] Omitido (falta', bad, '):', rawList[i]?.name)
      continue
    }
    out.push(row)
  }
  return out
}

async function upsertRows(sb, rows, skipSupabaseUpsert, accumulated) {
  let ok = 0
  let fail = 0
  for (const row of rows) {
    if (skipSupabaseUpsert) {
      accumulated.push(row)
      ok++
      continue
    }
    const { error } = await sb.from('events').upsert(row, { onConflict: 'slug' })
    if (error) {
      console.error('[discover] Error', row.slug, error.message)
      fail++
    } else {
      console.log('[discover] OK', row.slug)
      ok++
      accumulated.push(row)
    }
  }
  return { ok, fail }
}

function parseArgs(argv) {
  let perArtistMax = 15
  const ip = argv.indexOf('--per-artist-max')
  if (ip !== -1 && argv[ip + 1]) {
    const n = parseInt(argv[ip + 1], 10)
    if (Number.isFinite(n) && n > 0 && n <= 30) perArtistMax = n
  } else {
    const imx = argv.indexOf('--max')
    if (imx !== -1 && argv[imx + 1]) {
      const n = parseInt(argv[imx + 1], 10)
      if (Number.isFinite(n) && n > 0 && n <= 30) perArtistMax = n
    }
  }
  let artistLimit = 36
  const ia = argv.indexOf('--artist-limit')
  if (ia !== -1 && argv[ia + 1]) {
    const n = parseInt(argv[ia + 1], 10)
    if (Number.isFinite(n) && n > 0 && n <= 80) artistLimit = n
  }
  let maxTotal = 0
  const im = argv.indexOf('--max-total')
  if (im !== -1 && argv[im + 1]) {
    const n = parseInt(argv[im + 1], 10)
    if (Number.isFinite(n) && n > 0) maxTotal = n
  }
  let openAiDelayMs = parseInt(process.env.EVENTS_DISCOVER_OPENAI_DELAY_MS || '1800', 10)
  const id = argv.indexOf('--openai-delay-ms')
  if (id !== -1 && argv[id + 1]) {
    const n = parseInt(argv[id + 1], 10)
    if (Number.isFinite(n) && n >= 500) openAiDelayMs = n
  }
  return {
    perArtistMax,
    artistLimit,
    maxTotal,
    openAiDelayMs,
    keywordsOnly: argv.includes('--keywords-only'),
    alsoKeywords: argv.includes('--also-keywords'),
    dryRun: argv.includes('--dry-run'),
    noSearch: argv.includes('--no-search'),
    jsonOnly: argv.includes('--json-only'),
  }
}

async function main() {
  loadEnv()
  const argv = process.argv.slice(2)
  const opts = parseArgs(argv)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim()
  const serpKey = process.env.SERPAPI_API_KEY?.trim()

  const needSb =
    !opts.keywordsOnly ||
    !opts.dryRun ||
    opts.jsonOnly ||
    (!opts.noSearch && !opts.keywordsOnly)

  if (!opts.keywordsOnly && (!url || !serviceKey)) {
    throw new Error(
      'Hace falta NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (artistas en BD). Usa --keywords-only para solo queries genéricas.',
    )
  }

  if (!opts.dryRun && !opts.jsonOnly && (!url || !serviceKey)) {
    throw new Error('Falta Supabase para UPSERT.')
  }

  const sb =
    url && serviceKey
      ? createClient(url, serviceKey, { auth: { persistSession: false } })
      : null

  const system = loadSystemPrompt()
  const accumulated = []
  const seenSlugsGlobal = new Set()
  let totalOk = 0
  let totalFail = 0

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  async function maybeStop() {
    if (opts.maxTotal > 0 && totalOk >= opts.maxTotal) {
      console.log('[discover] Límite --max-total alcanzado:', totalOk)
      return true
    }
    return false
  }

  async function runOpenAiAndSave(userBlock, labelLog) {
    console.log('[discover] OpenAI ←', labelLog)
    let parsed
    try {
      parsed = await openAiJson({ system, user: userBlock })
    } catch (e) {
      console.warn('[discover] OpenAI fallo:', labelLog, e.message)
      return
    }
    const batch = normalizeBatch(parsed, seenSlugsGlobal)
    console.log('[discover]', labelLog, '→', batch.length, 'filas válidas')
    if (batch.length === 0) return

    const rowsToWrite =
      opts.maxTotal > 0 ? batch.slice(0, Math.max(0, opts.maxTotal - totalOk)) : batch

    const skipDb = opts.dryRun || opts.jsonOnly
    const { ok, fail } = await upsertRows(sb, rowsToWrite, skipDb, accumulated)
    totalOk += ok
    totalFail += fail
    await sleep(opts.openAiDelayMs)
  }

  // ——— Por artista (uno por uno) ———
  if (!opts.keywordsOnly) {
    let artists = []
    try {
      artists = await fetchOperativeArtists(sb, opts.artistLimit)
    } catch (e) {
      console.warn('[discover] Artistas:', e.message)
    }
    console.log('[discover] Artistas a procesar:', artists.length)

    if (artists.length === 0) {
      console.warn('[discover] 0 artistas; prueba --keywords-only o revisa categorías en BD.')
    }

    for (const a of artists) {
      if (await maybeStop()) break
      const label = String(a.name_display || a.name || '').trim()
      if (!label) continue
      const safe = label.replace(/"/g, '')
      let snippet = ''
      if (!opts.noSearch && serpKey) {
        const q = `"${safe}" 2026 (festival OR club OR tour OR gig OR "DJ set" OR live)`
        console.log('[discover] SerpAPI:', safe)
        snippet = await fetchSerpContext(q, serpKey, '')
        await sleep(650)
      } else {
        snippet = '(Sin búsqueda web en esta tanda.)'
      }

      const user = `TANDA INDIVIDUAL (un solo artista ancla).

Artista en catálogo Optimal Breaks: "${safe}" (slug: ${a.slug}, category: ${a.category}).

Devuelve como mucho ${opts.perArtistMax} eventos en "events". Solo eventos de 2026 donde, según el contexto, este artista participa, pincha o está anunciado. Si el contexto no menciona ningún evento concreto, devuelve "events": [].

CONTEXTO:
---
${snippet || '(vacío)'}
---

Responde solo JSON con clave "events".`

      await runOpenAiAndSave(user, `artista:${safe}`)
    }
  }

  // ——— Keywords: una query → OpenAI → guardar (uno por uno) ———
  if (opts.keywordsOnly || opts.alsoKeywords) {
    for (const item of KEYWORD_QUERIES) {
      if (await maybeStop()) break
      let snippet = ''
      if (!opts.noSearch && serpKey) {
        console.log('[discover] SerpAPI (keyword):', item.q, item.gl || '')
        snippet = await fetchSerpContext(item.q, serpKey, item.gl || '')
        await sleep(800)
      } else {
        snippet = '(Sin búsqueda web.)'
      }

      const user = `TANDA POR BÚSQUEDA GENÉRICA (no hay artista ancla único).

Query: ${item.q}${item.gl ? ` [gl=${item.gl}]` : ''}.

Devuelve como mucho ${opts.perArtistMax} eventos breakbeat/breaks/jungle relacionado para 2026 que aparezcan razonablemente en el contexto.

CONTEXTO:
---
${snippet}
---

Responde solo JSON con clave "events".`

      await runOpenAiAndSave(user, `keyword:${item.q}`)
    }
  }

  console.log(
    `[discover] Resumen: ${totalOk} filas OK (acumulado guardado/dry-run), ${totalFail} errores UPSERT`,
  )

  if (opts.dryRun) {
    process.stdout.write(JSON.stringify({ events: accumulated }, null, 2) + '\n')
    return
  }

  if (opts.jsonOnly) {
    const dir = join(ROOT, 'data', 'events')
    mkdirSync(dir, { recursive: true })
    const name = `discovered-${new Date().toISOString().slice(0, 10)}.json`
    const p = join(dir, name)
    writeFileSync(p, JSON.stringify({ events: accumulated }, null, 2) + '\n', 'utf8')
    console.log('JSON guardado:', p)
  }
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
