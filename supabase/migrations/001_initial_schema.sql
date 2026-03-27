-- ============================================
-- OPTIMAL BREAKS — Database Schema
-- Run in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ARTISTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.artists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_display TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  bio_en TEXT NOT NULL DEFAULT '',
  bio_es TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'current'
    CHECK (category IN ('pioneer', 'uk_legend', 'us_artist', 'andalusian', 'current', 'crew')),
  styles TEXT[] DEFAULT '{}',
  era TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  essential_tracks TEXT[] DEFAULT '{}',
  recommended_mixes TEXT[] DEFAULT '{}',
  related_artists TEXT[] DEFAULT '{}',
  website TEXT,
  socials JSONB DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_artists_slug ON public.artists(slug);
CREATE INDEX idx_artists_category ON public.artists(category);
CREATE INDEX idx_artists_featured ON public.artists(is_featured) WHERE is_featured = TRUE;

-- =============================================
-- LABELS
-- =============================================
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  founded_year INTEGER,
  description_en TEXT NOT NULL DEFAULT '',
  description_es TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  website TEXT,
  key_artists TEXT[] DEFAULT '{}',
  key_releases TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_labels_slug ON public.labels(slug);

-- =============================================
-- EVENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  description_es TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL DEFAULT 'upcoming'
    CHECK (event_type IN ('festival', 'club_night', 'past_iconic', 'upcoming')),
  date_start DATE,
  date_end DATE,
  location TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  venue TEXT,
  image_url TEXT,
  website TEXT,
  lineup TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_events_slug ON public.events(slug);
CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_date ON public.events(date_start);

-- =============================================
-- BLOG POSTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  title_es TEXT NOT NULL DEFAULT '',
  excerpt_en TEXT NOT NULL DEFAULT '',
  excerpt_es TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL DEFAULT '',
  content_es TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'article'
    CHECK (category IN ('article', 'ranking', 'retrospective', 'interview', 'review', 'opinion')),
  tags TEXT[] DEFAULT '{}',
  image_url TEXT,
  author TEXT NOT NULL DEFAULT 'Optimal Breaks',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_blog_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_published ON public.blog_posts(is_published, published_at DESC);

-- =============================================
-- SCENES
-- =============================================
CREATE TABLE IF NOT EXISTS public.scenes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  name_es TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  region TEXT,
  description_en TEXT NOT NULL DEFAULT '',
  description_es TEXT NOT NULL DEFAULT '',
  key_artists TEXT[] DEFAULT '{}',
  key_labels TEXT[] DEFAULT '{}',
  key_venues TEXT[] DEFAULT '{}',
  era TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_scenes_slug ON public.scenes(slug);

-- =============================================
-- MIXES
-- =============================================
CREATE TABLE IF NOT EXISTS public.mixes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  artist_name TEXT NOT NULL DEFAULT '',
  artist_id UUID REFERENCES public.artists(id),
  description_en TEXT NOT NULL DEFAULT '',
  description_es TEXT NOT NULL DEFAULT '',
  mix_type TEXT NOT NULL DEFAULT 'youtube_session'
    CHECK (mix_type IN ('essential_mix', 'classic_set', 'radio_show', 'youtube_session', 'podcast')),
  year INTEGER,
  duration_minutes INTEGER,
  embed_url TEXT,
  platform TEXT NOT NULL DEFAULT 'youtube'
    CHECK (platform IN ('soundcloud', 'youtube', 'mixcloud', 'other')),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_mixes_slug ON public.mixes(slug);

-- =============================================
-- HISTORY ENTRIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.history_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  slug TEXT UNIQUE NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  title_es TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL DEFAULT '',
  content_es TEXT NOT NULL DEFAULT '',
  section TEXT NOT NULL DEFAULT 'origins'
    CHECK (section IN ('origins', 'uk_breakbeat', 'us_breaks', 'andalusian', 'australian', 'rise_decline_revival', 'digital_era')),
  year_start INTEGER NOT NULL,
  year_end INTEGER,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_history_section ON public.history_entries(section);
CREATE INDEX idx_history_sort ON public.history_entries(sort_order);

-- =============================================
-- ROW LEVEL SECURITY (public read)
-- =============================================
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.history_entries ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Public read labels" ON public.labels FOR SELECT USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read blog_posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Public read scenes" ON public.scenes FOR SELECT USING (true);
CREATE POLICY "Public read mixes" ON public.mixes FOR SELECT USING (true);
CREATE POLICY "Public read history" ON public.history_entries FOR SELECT USING (true);
