-- ============================================================
-- SCHÉMA SUPABASE POUR SPOTIFY CLONE
-- ============================================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- https://app.supabase.com/project/_/sql
-- ============================================================

-- 1. TABLE DES PROFILS UTILISATEURS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Utilisateur',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. TABLE DES MUSIQUES
CREATE TABLE IF NOT EXISTS tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT NOT NULL DEFAULT 'Single',
  album_cover_url TEXT,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plays INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title);
CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album);

-- 3. TABLE DES PLAYLISTS
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists(is_public);

-- 4. TABLE DES PLAYLIST_TRACKS
CREATE TABLE IF NOT EXISTS playlist_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track ON playlist_tracks(track_id);

-- 5. TABLE DES TITRES LIKÉS
CREATE TABLE IF NOT EXISTS user_liked_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_liked_tracks_user ON user_liked_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_tracks_track ON user_liked_tracks(track_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_liked_tracks ENABLE ROW LEVEL SECURITY;

-- PROFILES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- TRACKS
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
CREATE POLICY "Tracks are viewable by everyone"
  ON tracks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert tracks" ON tracks;
CREATE POLICY "Authenticated users can insert tracks"
  ON tracks FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own tracks" ON tracks;
CREATE POLICY "Users can update own tracks"
  ON tracks FOR UPDATE USING (auth.uid() = user_id);

-- PLAYLISTS
DROP POLICY IF EXISTS "Public playlists are viewable" ON playlists;
CREATE POLICY "Public playlists are viewable"
  ON playlists FOR SELECT USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create playlists" ON playlists;
CREATE POLICY "Users can create playlists"
  ON playlists FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own playlists" ON playlists;
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own playlists" ON playlists;
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE USING (auth.uid() = user_id);

-- PLAYLIST_TRACKS
DROP POLICY IF EXISTS "Playlist tracks viewable" ON playlist_tracks;
CREATE POLICY "Playlist tracks viewable"
  ON playlist_tracks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Playlist owners can add tracks" ON playlist_tracks;
CREATE POLICY "Playlist owners can add tracks"
  ON playlist_tracks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Playlist owners can remove tracks" ON playlist_tracks;
CREATE POLICY "Playlist owners can remove tracks"
  ON playlist_tracks FOR DELETE USING (
    EXISTS (SELECT 1 FROM playlists WHERE playlists.id = playlist_tracks.playlist_id AND playlists.user_id = auth.uid())
  );

-- USER_LIKED_TRACKS
DROP POLICY IF EXISTS "Users can view own liked tracks" ON user_liked_tracks;
CREATE POLICY "Users can view own liked tracks"
  ON user_liked_tracks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can like tracks" ON user_liked_tracks;
CREATE POLICY "Users can like tracks"
  ON user_liked_tracks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike tracks" ON user_liked_tracks;
CREATE POLICY "Users can unlike tracks"
  ON user_liked_tracks FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- FONCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION increment_track_plays(track_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE tracks SET plays = plays + 1 WHERE id = track_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- BUCKETS STORAGE (à créer manuellement dans le dashboard)
-- ============================================================
-- Bucket: audio-files (privé)
-- Bucket: album-covers (public)
-- ============================================================

-- Données de démonstration (optionnel)
-- INSERT INTO tracks (title, artist, album, audio_url, duration)
-- VALUES ('Démo 1', 'Artiste 1', 'Album 1', 'demo/track1.mp3', 180);
