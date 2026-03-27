-- ============================================
-- OPTIMAL BREAKS — User System Schema
-- Run after 002_seed_data.sql
-- ============================================

-- =============================================
-- USER PROFILES
-- Links to Supabase auth.users
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  country TEXT DEFAULT '',
  favorite_genre TEXT DEFAULT '',
  -- Stats (denormalized for fast reads)
  total_favorites INTEGER DEFAULT 0,
  total_events_attended INTEGER DEFAULT 0,
  total_events_wishlist INTEGER DEFAULT 0
);

CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FAVORITE ARTISTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.favorite_artists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

CREATE INDEX idx_fav_artists_user ON public.favorite_artists(user_id);
CREATE INDEX idx_fav_artists_artist ON public.favorite_artists(artist_id);

-- =============================================
-- FAVORITE LABELS
-- =============================================
CREATE TABLE IF NOT EXISTS public.favorite_labels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  label_id UUID REFERENCES public.labels(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, label_id)
);

CREATE INDEX idx_fav_labels_user ON public.favorite_labels(user_id);

-- =============================================
-- ARTIST SIGHTINGS (seen live: where, when)
-- =============================================
CREATE TABLE IF NOT EXISTS public.artist_sightings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  artist_id UUID REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  seen_at DATE NOT NULL,
  venue TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  event_name TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

CREATE INDEX idx_sightings_user ON public.artist_sightings(user_id);
CREATE INDEX idx_sightings_artist ON public.artist_sightings(artist_id);
CREATE INDEX idx_sightings_date ON public.artist_sightings(seen_at DESC);

-- =============================================
-- EVENT ATTENDANCE (attended / wishlist)
-- =============================================
CREATE TABLE IF NOT EXISTS public.event_attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'wishlist'
    CHECK (status IN ('wishlist', 'attending', 'attended')),
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_attendance_user ON public.event_attendance(user_id);
CREATE INDEX idx_attendance_event ON public.event_attendance(event_id);
CREATE INDEX idx_attendance_status ON public.event_attendance(status);

-- =============================================
-- EVENT RATINGS (only for attended events)
-- =============================================
CREATE TABLE IF NOT EXISTS public.event_ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT DEFAULT '',
  UNIQUE(user_id, event_id)
);

CREATE INDEX idx_ratings_user ON public.event_ratings(user_id);
CREATE INDEX idx_ratings_event ON public.event_ratings(event_id);

-- =============================================
-- SAVED MIXES
-- =============================================
CREATE TABLE IF NOT EXISTS public.saved_mixes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mix_id UUID REFERENCES public.mixes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mix_id)
);

CREATE INDEX idx_saved_mixes_user ON public.saved_mixes(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_mixes ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read all profiles, only edit their own
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Favorites: users can read their own, insert/delete their own
CREATE POLICY "Users read own favorites" ON public.favorite_artists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorite_artists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorite_artists FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users read own fav labels" ON public.favorite_labels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own fav labels" ON public.favorite_labels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own fav labels" ON public.favorite_labels FOR DELETE USING (auth.uid() = user_id);

-- Sightings: users manage their own
CREATE POLICY "Users read own sightings" ON public.artist_sightings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sightings" ON public.artist_sightings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sightings" ON public.artist_sightings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own sightings" ON public.artist_sightings FOR DELETE USING (auth.uid() = user_id);

-- Attendance: users manage their own
CREATE POLICY "Users read own attendance" ON public.event_attendance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own attendance" ON public.event_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own attendance" ON public.event_attendance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own attendance" ON public.event_attendance FOR DELETE USING (auth.uid() = user_id);

-- Ratings: users manage their own, public can read all
CREATE POLICY "Public read ratings" ON public.event_ratings FOR SELECT USING (true);
CREATE POLICY "Users insert own ratings" ON public.event_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own ratings" ON public.event_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own ratings" ON public.event_ratings FOR DELETE USING (auth.uid() = user_id);

-- Saved mixes: users manage their own
CREATE POLICY "Users read own saved mixes" ON public.saved_mixes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own saved mixes" ON public.saved_mixes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own saved mixes" ON public.saved_mixes FOR DELETE USING (auth.uid() = user_id);

-- Update updated_at on profile changes
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
