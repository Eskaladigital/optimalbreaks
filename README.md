# OPTIMAL BREAKS — The Breakbeat Bible

> Archive, magazine, guide, agenda and scene memory. A project dedicated to preserving and celebrating breakbeat culture worldwide.

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4) ![Supabase](https://img.shields.io/badge/Supabase-2.45-3ECF8E)

---

## What is Optimal Breaks?

Optimal Breaks is a bilingual (ES/EN) web platform dedicated to the history, artists, labels, events, scenes and culture of breakbeat music — from the Bronx in the 1970s to the present day.

The site features an interactive DJ deck with real audio playback and scratch capability, a fanzine/club aesthetic inspired by xerox culture and rave flyers, and a full editorial structure covering every aspect of breakbeat worldwide.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4 + custom CSS variables
- **Database**: Supabase (PostgreSQL)
- **i18n**: Custom middleware with `/es` and `/en` prefixed routes + hreflang tags
- **Audio**: Web Audio API with scratch simulation
- **Fonts**: Unbounded, Courier Prime, Permanent Marker, Special Elite, Darker Grotesque

---

## Project Structure

```
OptimalBreaks/
├── public/
│   └── music/                  # MP3 tracks for the DJ deck
├── src/
│   ├── app/
│   │   ├── globals.css         # Global styles, animations, grain overlay
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── [lang]/
│   │       ├── layout.tsx      # Lang layout: Header + Footer + hreflang
│   │       ├── page.tsx        # HOME — hero, deck, marquee, timeline, artists, events, CTA
│   │       ├── history/        # Full breakbeat history by era
│   │       ├── artists/        # Artist directory with filters
│   │       │   └── [slug]/     # Individual artist pages
│   │       ├── labels/         # Record label directory
│   │       │   └── [slug]/     # Individual label pages
│   │       ├── events/         # Event calendar + iconic past events
│   │       │   └── [slug]/     # Individual event pages
│   │       ├── scenes/         # Breakbeat by region/country
│   │       │   └── [slug]/     # Individual scene pages
│   │       ├── blog/           # Articles, rankings, retrospectives
│   │       │   └── [slug]/     # Individual blog posts
│   │       ├── mixes/          # Essential mixes, classic sets, radio shows
│   │       └── about/          # About, contact, collaborate
│   ├── components/
│   │   ├── Header.tsx          # Sticky nav with language switch + mobile menu
│   │   ├── Footer.tsx          # Fanzine-style footer
│   │   ├── DjDeck.tsx          # Interactive DJ controller with audio + scratch
│   │   ├── Marquee.tsx         # Tape strip with infinite scroll
│   │   ├── Timeline.tsx        # Dark section timeline
│   │   ├── ArtistCard.tsx      # Ransom-note style artist card
│   │   └── EventFlyer.tsx      # Event flyer with tape decoration
│   ├── dictionaries/
│   │   ├── en.json             # English translations
│   │   └── es.json             # Spanish translations
│   ├── lib/
│   │   ├── dictionaries.ts     # Dictionary loader
│   │   ├── i18n-config.ts      # i18n configuration (es, en)
│   │   └── supabase.ts         # Supabase client
│   ├── types/
│   │   └── database.ts         # Full DB types: artists, labels, events, blog, scenes, mixes, history
│   └── middleware.ts           # i18n redirect middleware
├── music/                      # Source MP3 files (copy to public/music)
├── propuesta12-fanzine-club.html  # Design reference
├── Historia del break.txt      # Research content
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── next.config.js
└── postcss.config.js
```

---

## Design Aesthetic

**Fanzine Club Edition** — inspired by xerox zines, rave flyers and record shop culture:

- Paper texture background with grain overlay
- Yellow highlighter marks on headings
- Warning stripe danger bars
- Adhesive tape decorations
- Ransom-note style cards
- Cut-out label system (genre tags)
- DJ deck with spinning vinyl, tonearms, VU meters and knobs
- Red/yellow/acid/UV accent palette on cream paper

---

## DJ Deck Features

The hero section includes a fully interactive DJ controller:

- **Audio playback** — plays real MP3 tracks from `/public/music/`
- **Scratch** — drag either platter up/down to scrub through the audio; vinyl rotates with your finger/mouse
- **6 tracks** — switch between them with ◄ ► buttons
- **Crossfader** — adjusts volume balance
- **Play/Pause** — main button + individual deck toggles
- **Progress bar** — clickable to seek
- **VU meters** — animate based on playback state
- **Tonearms** — move when playing/stopped
- **Touch support** — works on mobile
- **Auto-advance** — next track plays when current one ends

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Copy music to public folder

```bash
mkdir public/music
cp music/* public/music/
```

On Windows:
```cmd
mkdir public\music
copy music\* public\music\
```

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/en` or `/es` based on your browser language.

---

## Sections

| Section | Route | Description |
|---------|-------|-------------|
| Home | `/[lang]` | Hero with DJ deck, timeline, featured artists, events, CTA |
| History | `/[lang]/history` | Origins, UK, US, Andalusia, Australia, decline, digital era |
| Artists | `/[lang]/artists` | Filterable directory: pioneers, UK, US, Andalusian, current |
| Labels | `/[lang]/labels` | Record labels that shaped the sound |
| Events | `/[lang]/events` | Festivals, club nights, iconic past events, upcoming |
| Scenes | `/[lang]/scenes` | Breakbeat by territory: UK, US, Spain, Australia, Russia, LatAm |
| Blog | `/[lang]/blog` | Articles, rankings, retrospectives, reviews, interviews |
| Mixes | `/[lang]/mixes` | Essential mixes, classic sets, radio shows, YouTube sessions |
| About | `/[lang]/about` | Project manifesto, contact, collaborate, submit |

---

## Database Schema

Supabase tables defined in `src/types/database.ts`:

- **artists** — name, bio (EN/ES), category, styles, era, essential tracks, socials
- **labels** — name, country, founded year, description (EN/ES), key artists/releases
- **events** — name, type, dates, location, lineup, description (EN/ES)
- **blog_posts** — title, content, excerpt (EN/ES), category, tags, author
- **scenes** — name (EN/ES), country, region, key artists/labels/venues, era
- **mixes** — title, artist, type, year, duration, embed URL, platform
- **history_entries** — title, content (EN/ES), section, year range, sort order

---

## Roadmap

- [ ] Connect Supabase — populate all sections with real data
- [ ] Admin panel — CRUD for artists, labels, events, blog posts
- [ ] Search functionality
- [ ] SoundCloud/YouTube/Mixcloud embeds in mixes section
- [ ] Sitemap.xml + robots.txt for SEO
- [ ] OG images per section
- [ ] RSS feed for blog
- [ ] Newsletter subscription
- [ ] Community submissions (suggest artist, submit event)
- [ ] Dark mode toggle

---

## License

All rights reserved © 2026 Optimal Breaks. Made with breaks and noise from Murcia, Spain.
