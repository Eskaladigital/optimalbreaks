/**
 * OPTIMAL BREAKS — Sincronizar artistas de la cronología /artists (ARTIST_ERAS) con Supabase
 *
 * Índice agente: scripts/guia-base-datos.mjs → run timeline | run timeline-sql
 *
 * Lee src/lib/artists-timeline.ts, genera filas para slugs que aún no existen en public.artists
 * e inserta vía @supabase/supabase-js (service role / secret key).
 *
 * Uso:
 *   npm run db:timeline
 *   node scripts/sync-timeline-artists.mjs
 *   node scripts/sync-timeline-artists.mjs --sql   → regenera 009_artists_from_artist_eras_timeline.sql
 *
 * Credenciales: .env.local — NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const TS_PATH = join(ROOT, 'src', 'lib', 'artists-timeline.ts')
const SQL_OUT = join(ROOT, 'supabase', 'migrations', '009_artists_from_artist_eras_timeline.sql')

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

function artistSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Misma ruta que en la web: evita duplicar fila si el timeline usa variante del nombre. */
const SLUG_CANONICAL = {
  'the-freestylers': 'freestylers',
}

function canonSlug(raw) {
  return SLUG_CANONICAL[raw] || raw
}

const US_NAME_SNIPPETS = [
  'n.w.a',
  'run-d',
  'public enemy',
  'grandmaster',
  'kool herc',
  'afrika',
  'icey',
  'herbie hancock',
  'beastie',
  'kurtis',
  'lovebug',
  'egyptian',
  'hashim',
  'newcleus',
  'mantronix',
  'tyree',
  'fast eddie',
  'de la soul',
  'whodini',
  'utfo',
  'jonzun',
]

function parseArtistEras(text) {
  const eras = []
  const lines = text.split('\n')
  let i = 0
  while (i < lines.length) {
    const idM = lines[i].match(/^\s*id:\s*'([^']+)'/)
    if (!idM) {
      i += 1
      continue
    }
    const eraId = idM[1]
    let period = eraId
    for (let j = i + 1; j < Math.min(i + 25, lines.length); j += 1) {
      const pm = lines[j].match(/^\s*period:\s*'([^']*)'/)
      if (pm) {
        period = pm[1]
        break
      }
    }
    let namesStart = -1
    for (let k = i; k < Math.min(i + 80, lines.length); k += 1) {
      if (/^\s*names:\s*\[\s*$/.test(lines[k])) {
        namesStart = k + 1
        break
      }
    }
    if (namesStart < 0) {
      i += 1
      continue
    }
    const names = []
    for (let k = namesStart; k < lines.length; k += 1) {
      if (/^\s*\],\s*$/.test(lines[k])) break
      const nm = lines[k].match(/^\s*'((?:\\'|[^'])*)',?\s*$/)
      if (nm) names.push(nm[1].replace(/\\'/g, "'"))
    }
    eras.push({ id: eraId, period, names })
    i = namesStart + names.length + 3
  }
  return eras
}

function inferCategory(name, eraId) {
  const n = name.toLowerCase()
  const year = parseInt(String(eraId).slice(0, 4), 10) || 2000

  if (/escena|andal/i.test(name)) return 'andalusian'
  if (
    n.includes('james brown') ||
    n.includes('funkadelic') ||
    n.includes('parliament') ||
    n.includes('incredible bongo') ||
    n.includes('winstons') ||
    n.includes('lyn collins') ||
    n.includes('mfsb') ||
    n.includes('curtis mayfield') ||
    year < 1980
  ) {
    return 'pioneer'
  }

  if (US_NAME_SNIPPETS.some((s) => n.includes(s))) return 'us_artist'

  if (year >= 1990 && year < 2010) return 'uk_legend'
  if (year >= 1985 && year < 1990 && !US_NAME_SNIPPETS.some((s) => n.includes(s)))
    return 'uk_legend'

  return 'current'
}

function inferCountry(name, category) {
  const n = name.toLowerCase()
  if (category === 'andalusian') return 'ES'
  if (category === 'us_artist') return 'USA'
  if (/marten|hørger|ørger/i.test(n)) return 'DE'
  if (US_NAME_SNIPPETS.some((s) => n.includes(s))) return 'USA'
  if (category === 'pioneer' && (n.includes('james brown') || n.includes('booker'))) return 'USA'
  return 'UK'
}

function buildBioEn(name, period) {
  return `Key name in the Optimal Breaks artist timeline (${period}). This profile is a starter entry linked from the /artists era map; editorial depth can grow over time.`
}

function buildBioEs(name, period) {
  return `Nombre clave en la cronología de artistas de Optimal Breaks (${period}). Esta ficha es una entrada inicial enlazada desde el mapa por lustros de /artistas; el texto puede ampliarse con el tiempo.`
}

function stylesForCategory(category) {
  if (category === 'us_artist') return ['Hip Hop', 'Breaks']
  if (category === 'pioneer') return ['Funk', 'Soul', 'Breaks']
  return ['Breakbeat', 'Electronic']
}

function buildRowsFromTimeline() {
  const text = readFileSync(TS_PATH, 'utf8')
  const eras = parseArtistEras(text)
  if (eras.length < 10) {
    throw new Error(`Parse ARTIST_ERAS: solo ${eras.length} eras`)
  }

  const bySlug = new Map()
  for (const era of eras) {
    for (const name of era.names) {
      const raw = artistSlug(name)
      if (!raw) continue
      const slug = canonSlug(raw)
      if (!bySlug.has(slug)) {
        bySlug.set(slug, { name, period: era.period, eraId: era.id })
      }
    }
  }

  const rows = []
  let sortOrder = 100
  for (const [slug, { name, period, eraId }] of bySlug) {
    sortOrder += 1
    const category = inferCategory(name, eraId)
    const country = inferCountry(name, category)
    const nameDisplay = name.toUpperCase().replace(/\s+/g, ' ')
    rows.push({
      slug,
      name,
      name_display: nameDisplay,
      country,
      bio_en: buildBioEn(name, period),
      bio_es: buildBioEs(name, period),
      category,
      styles: stylesForCategory(category),
      era: period,
      essential_tracks: [],
      recommended_mixes: [],
      related_artists: [],
      website: null,
      socials: {},
      is_featured: false,
      sort_order: sortOrder,
      real_name: null,
      labels_founded: [],
      key_releases: [],
      image_url: null,
    })
  }

  rows.sort((a, b) => a.slug.localeCompare(b.slug))
  return rows
}

function sqlEscape(str) {
  return str.replace(/'/g, "''")
}

function writeSqlFile(rowsToInsert) {
  const valueRows = rowsToInsert.map((row) => {
    const st =
      row.category === 'us_artist'
        ? "ARRAY['Hip Hop', 'Breaks']"
        : row.category === 'pioneer'
          ? "ARRAY['Funk', 'Soul', 'Breaks']"
          : "ARRAY['Breakbeat', 'Electronic']"
    return `(
  '${sqlEscape(row.slug)}',
  '${sqlEscape(row.name)}',
  '${sqlEscape(row.name_display)}',
  '${sqlEscape(row.country)}',
  '${sqlEscape(row.bio_en)}',
  '${sqlEscape(row.bio_es)}',
  '${row.category}',
  ${st},
  '${sqlEscape(row.era)}',
  ARRAY[]::text[],
  ARRAY[]::text[],
  ARRAY[]::text[],
  NULL,
  '{}'::jsonb,
  false,
  ${row.sort_order},
  NULL,
  ARRAY[]::text[],
  '[]'::jsonb,
  NULL
)`
  })

  const header = `-- ============================================
-- OPTIMAL BREAKS — Artistas desde cronología /artists (ARTIST_ERAS)
-- Generado por: node scripts/sync-timeline-artists.mjs --sql
-- También puedes poblar sin SQL: npm run db:timeline
-- ============================================

`

  const sql =
    header +
    `INSERT INTO public.artists (
  slug, name, name_display, country, bio_en, bio_es, category, styles, era,
  essential_tracks, recommended_mixes, related_artists, website, socials,
  is_featured, sort_order, real_name, labels_founded, key_releases, image_url
) VALUES
${valueRows.join(',\n')}
ON CONFLICT (slug) DO NOTHING;
`

  writeFileSync(SQL_OUT, sql, 'utf8')
  console.log('SQL escrito:', SQL_OUT)
}

async function pushToSupabase(allRows) {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim()
  if (!url || !key) {
    console.error(
      'Falta NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY) en .env.local',
    )
    process.exit(1)
  }

  const sb = createClient(url, key, { auth: { persistSession: false } })

  const { data: existing, error: e1 } = await sb.from('artists').select('slug')
  if (e1) {
    console.error('Error leyendo artists:', e1.message)
    process.exit(1)
  }
  const have = new Set((existing || []).map((r) => r.slug))
  const missing = allRows.filter((r) => !have.has(r.slug))

  if (missing.length === 0) {
    console.log('Nada que insertar: todos los slugs del timeline ya existen en la BD.')
    return
  }

  const chunk = 80
  let ok = 0
  for (let i = 0; i < missing.length; i += chunk) {
    const part = missing.slice(i, i + chunk)
    const { error } = await sb.from('artists').insert(part)
    if (error) {
      console.error('Error insertando lote:', error.message)
      process.exit(1)
    }
    ok += part.length
    console.log(`Insertados ${ok}/${missing.length}…`)
  }

  console.log(`Listo: ${missing.length} artistas nuevos en Supabase (total timeline únicos: ${allRows.length}).`)
}

async function main() {
  const writeSql = process.argv.includes('--sql')
  loadEnvLocal()

  const allRows = buildRowsFromTimeline()
  console.log('Slugs únicos en cronología (tras canon):', allRows.length)

  if (writeSql) {
    const skip = new Set([
      'the-prodigy',
      'fatboy-slim',
      'the-chemical-brothers',
      'stanton-warriors',
      'adam-freeland',
      'krafty-kuts',
      'plump-djs',
      'lady-waks',
      'freestylers',
      'dj-icey',
      'soul-of-man',
      'deekline',
      'dj-kool-herc',
      'public-enemy',
      'renegade-soundwave',
      'shut-up-and-dance',
      'altern-8',
      '4hero',
      'goldie',
      'orbital',
      'pendulum',
      'escena-andaluza',
    ])
    const toSql = allRows.filter((r) => !skip.has(r.slug))
    writeSqlFile(toSql)
    console.log('Filas en SQL (sin seed/008):', toSql.length)
    return
  }

  await pushToSupabase(allRows)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
