/**
 * Cruza la lista extendida de artistas con public.artists en Supabase e inserta faltantes.
 * Misma convención de slug que sync-timeline-artists.mjs + artistSlug en artists-timeline.
 *
 * Uso: node scripts/sync-user-list-artists.mjs
 * Requiere: .env.local → NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (o SECRET)
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
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

const SLUG_CANONICAL = {
  'the-freestylers': 'freestylers',
  icey: 'dj-icey',
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
  'bambaataa',
  'curtis mayfield',
  'james brown',
  'bob james',
  'billy squier',
  'booker t',
  'chic',
  'cameo',
  'dennis coffey',
  'incredible bongo',
  'isley',
  'klf',
  'mandrill',
  'mfsb',
  'parliament',
  'funkadelic',
  'lyn collins',
  'liquid liquid',
  'jimmy castor',
  'sly & the family',
  'war',
  'winstons',
  'malcolm mclaren',
  'meat beat',
]

const RAW_NAMES = `2 INDABUSH
30HZ
4HERO
601
808 STATE
A GUY CALLED GERALD
A.SKILLZ
ACEN
ADAM F
ADAM FREELAND
AFGHAN HEADSPIN
AFRIKA BAMBAATAA
AFRIKA BAMBAATAA & THE SOULSONIC FORCE
AGENT K
AK SPORTS
ALE BAQUERO
ALL GOOD FUNK ALLIANCE
ALTERN-8
ANNIE NIGHTINGALE
ANUSCHKA
APOLLO 440
AQUASKY
ART OF NOISE
ATOMIC HOOLIGAN
B-LIVE
BABE RUTH
BACKDRAFT
BAD LEGS
BADBOE
BAOBINGA
BASSBIN TWINS
BEAT ASSASSINS
BEATMAN & LUDMILLA
BILLY SQUIER
BLIM
BLANILLA
BOB JAMES
BODYSNATCHERS
BOMB THE BASS
BOMBSTRIKES
BOOKER T. & THE M.G.'S
BOWSER
BRAINKILLER
BREAKNECK
BROTHERS BUD
BROWSERS
BUBBLE COUPLE
BURGULAR TOM
CALVERTRON
CAMEO
CHAMPA
CHEMICAL ALLY
CHIC
CHRIS CARTER
COLOMBO
COLDCUT
CRIMINAL ELEMENT ORCHESTRA
CTRL-Z
CUDE
CURTIS MAYFIELD
CUT LA ROC
DARK GLOBE
DE LA SOUL
DEEJAY PUNK-ROC
DEEKLINE
DEEKLINE & ED SOLO
DENHAM AUDIO
DENNIS COFFEY
DIGITAL BASE
DJ BABY ANNE
DJ COSWORTH
DJ DREW
DJ FIXX
DJ HERO
DJ ICEY
DJ K
DJ KEEPER
DJ KILLER
DJ KOOL HERC
DJ NITRO
DJ QUEST
DJ SANTANA
DJ ZINC
DMITRI KO
DOMINIC B
DRUMATTIC TWINS
DUB ELEMENTS
DUB PISTOLS
DYLAN RHYMES
EARL GREY
EGYPTIAN LOVER
ELEMENTAL
ELOQUIN
ELITE FORCE
ESCENA ANDALUZA
EVAC
EVIL NINE
FAR TOO LOUD
FAST EDDIE
FATBOY SLIM
FATHER FUNK
FEATURECAST
FM-3
FORME
FORT KNOX FIVE
FOUL PLAY
FRANXIS'90
FREAKY JALAPENO
FREESTYLERS
FREQ NASTY
FRIENDLY
FUNKADELIC
FUTURE FUNK SQUAD
GENERAL MIDI
GOLDIE
GRANDMASTER FLASH
GRANDMASTER FLASH & THE FURIOUS FIVE
GRANDMASTER FLOWERS
GROOVE DORIAN
GUAU
HASHIM
HEDFLUX
HERBIE HANCOCK
HUDA HUDIA
HYPER
HYPERION BLACK HOLE
HYBRID
ICEY
ILS
INFINITI
J BREAK
JAMES BROWN
JAN B
JDS
JEM HAYNES
JIMMY CASTOR BUNCH
JIMMY JOSLIN
JONZUN CREW
JORDI SLATE
KAYLAB
KEITH MACKENZIE
KICK & HI-FI
KID BLUE
KOMA & BONES
KOOL & THE GANG
KRAFTY KUTS
KULTUR
KULMAN
KURTIS BLOW
LADY WAKS
LEE COOMBS
LEFT/RIGHT
LE DUKE
LIQUID LIQUID
LOVEBUG STARSKI
LTJ BUKEM
LUNAR SHIFT
LYN COLLINS
MAFIA KISS
MALCOLM MCLAREN
MAN
MANDRILL
MANTRONIX
MARKY STAR
MARTEN HØRGER
MARTIN FLEX
MBREAKS
MEAT BEAT MANIFESTO
MEAT KATIE
MFSB
MISS MONUMENT
MOH
MONDAY CLUB
MONK
N-JOI
N.W.A.
NAPT
NEWCLEUS
NICK THAYER
NOSK
OBLONG
OLIVIA ROSE
OMEGA
ONDAMIKE
ORBITAL
PARKER
PARLIAMENT
PAVANE
PEO DE PITTE
PENDULUM
PERFECT KOMBO
PETER PAUL
PHILLY BLUNT
PLAZA DE FUNK
PLUMP DJS
PROPELLERHEADS
PUBLIC ENEMY
PYRAMID
RABBIT IN THE MOON
RASCO
REDLIGHT
REBEL MC / CONGO NATTY
RENEGADE SOUNDWAVE
RENNIE PILGREM
REQUEST LINE
RHADES
RICO TUBBS
RICO TUBBS & WILL BAILEY
RIPSNORTER
ROGUE ELEMENT
RULER
RUN-D.M.C.
S'EXPRESS
SCISSORKICKS
SHADE K
SHAKEDOWN
SHUT UP AND DANCE
SIMON FINNIGAN
SL2
SLY & THE FAMILY STONE
SLYDE
SLYNK
SLYK
SMASH HI-FI
SOUL OF MAN
SONZ OF MECHA
SPECIMEN A
SPLITLOOP
STANTON WARRIORS
STEREO 8
STEREO:TYPE
SUPERSTYLE DELUXE
THE BEASTIE BOYS
THE BREAKFASTAZ
THE CHEMICAL BROTHERS
THE CRYSTAL METHOD
THE FREESTYLE PROFESSORS
THE INCREDIBLE BONGO BAND
THE ISLEY BROTHERS
THE KLF
THE PRODIGY
THE RAGGA TWINS
THE REBELS
THE SCRATCH PERVERTS
THE WINSTONS
TIPPER
TOM REAL
TOMY
TYREE
UTFO
VENT
WALLY
WAR
WAVEWHORE
WBBL
WHODINI
WILL BAILEY
YO SPEED
YOKIZ
ZONK'T`

function inferCategory(name) {
  const n = name.toLowerCase()
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
    n.includes('booker t') ||
    n.includes('bob james') ||
    n.includes('billy squier') ||
    n.includes('cameo') ||
    n.includes('chic') ||
    n.includes('dennis coffey') ||
    n.includes('jimmy castor') ||
    n.includes('liquid liquid') ||
    n.includes('malcolm mclaren') ||
    n.includes('mandrill') ||
    n.includes('mantronix') ||
    n.includes('meat beat') ||
    n.includes('sly & the family') ||
    (n === 'war' || n.startsWith('war '))
  ) {
    return 'pioneer'
  }
  if (US_NAME_SNIPPETS.some((s) => n.includes(s))) return 'us_artist'
  return 'current'
}

function inferCountry(name, category) {
  const n = name.toLowerCase()
  if (category === 'andalusian') return 'ES'
  if (category === 'us_artist') return 'USA'
  if (/marten|hørger|ørger/i.test(n)) return 'DE'
  if (
    /jordi slate|ale baquero|rhades|pavane|peo de pitte|franxis|kulman|kultur|champa|cude|le duke|vent|wally|zonk|anuschka|escena andaluza|plaza de funk/i.test(
      name,
    )
  )
    return 'ES'
  if (US_NAME_SNIPPETS.some((s) => n.includes(s))) return 'USA'
  if (category === 'pioneer' && (n.includes('james brown') || n.includes('booker'))) return 'USA'
  return 'UK'
}

function buildBioEn(name, period) {
  return `Listed in the Optimal Breaks extended artist roster (${period}). Starter profile; editorial depth can grow over time.`
}

function buildBioEs(name, period) {
  return `Incluido en el listado extendido de artistas de Optimal Breaks (${period}). Ficha inicial; el texto puede ampliarse con el tiempo.`
}

function stylesForCategory(category) {
  if (category === 'us_artist') return ['Hip Hop', 'Breaks']
  if (category === 'pioneer') return ['Funk', 'Soul', 'Breaks']
  if (category === 'andalusian') return ['Breakbeat', 'Electronic']
  return ['Breakbeat', 'Electronic']
}

const PERIOD = '1990s–present'

function buildRows() {
  const lines = RAW_NAMES.split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const bySlug = new Map()
  for (const name of lines) {
    const raw = artistSlug(name)
    if (!raw) continue
    const slug = canonSlug(raw)
    if (!bySlug.has(slug)) {
      bySlug.set(slug, { name, slug })
    }
  }

  let sortBase = 550
  const rows = []
  for (const { name, slug } of bySlug.values()) {
    sortBase += 1
    const category = inferCategory(name)
    const country = inferCountry(name, category)
    const nameDisplay = name.toUpperCase().replace(/\s+/g, ' ')
    rows.push({
      slug,
      name,
      name_display: nameDisplay,
      country,
      bio_en: buildBioEn(name, PERIOD),
      bio_es: buildBioEs(name, PERIOD),
      category,
      styles: stylesForCategory(category),
      era: PERIOD,
      essential_tracks: [],
      recommended_mixes: [],
      related_artists: [],
      website: null,
      socials: {},
      is_featured: false,
      sort_order: sortBase,
      real_name: null,
      labels_founded: [],
      key_releases: [],
      image_url: null,
    })
  }
  rows.sort((a, b) => a.slug.localeCompare(b.slug))
  return rows
}

async function main() {
  loadEnvLocal()
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim()
  if (!url || !key) {
    console.error(
      'Falta NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (o SUPABASE_SECRET_KEY).',
    )
    process.exit(1)
  }

  const allRows = buildRows()
  const sb = createClient(url, key, { auth: { persistSession: false } })

  const pageSize = 1000
  let from = 0
  const existingSlugs = []
  while (true) {
    const { data, error } = await sb
      .from('artists')
      .select('slug')
      .order('slug')
      .range(from, from + pageSize - 1)
    if (error) {
      console.error('Error leyendo artists:', error.message)
      process.exit(1)
    }
    if (!data?.length) break
    existingSlugs.push(...data.map((r) => r.slug))
    if (data.length < pageSize) break
    from += pageSize
  }

  const have = new Set(existingSlugs)
  const missing = allRows.filter((r) => !have.has(r.slug))

  console.log('Nombres en lista (líneas):', RAW_NAMES.split('\n').filter((l) => l.trim()).length)
  console.log('Slugs únicos tras canon:', allRows.length)
  console.log('Ya en Supabase:', allRows.length - missing.length)
  console.log('Faltan insertar:', missing.length)

  if (missing.length === 0) {
    console.log('Nada que hacer.')
    return
  }

  console.log('Slugs nuevos:', missing.map((m) => m.slug).join(', '))

  const chunk = 80
  let ok = 0
  for (let i = 0; i < missing.length; i += chunk) {
    const part = missing.slice(i, i + chunk)
    const { error } = await sb.from('artists').insert(part)
    if (error) {
      console.error('Error insertando lote:', error.message, error)
      process.exit(1)
    }
    ok += part.length
    console.log(`Insertados ${ok}/${missing.length}…`)
  }

  console.log('Listo:', missing.length, 'artistas nuevos en Supabase.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
