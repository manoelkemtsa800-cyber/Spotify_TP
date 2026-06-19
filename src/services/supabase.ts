import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// ⚠️ REMPLACEZ avec vos propres credentials
// Obtenez-les sur https://app.supabase.com
// ============================================

export const SUPABASE_URL = 'https://txxwwmdqfufanbxyltyy.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4eHd3bWRxZnVmYW5ieHlsdHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTI3MDUsImV4cCI6MjA5NzM4ODcwNX0.vA9lk8vO8nhb_HO10kr0CIgAiYM8XufdjvXMDkeV_yY';

// Storage Buckets
export const STORAGE_AUDIO_BUCKET = 'audio-files';
export const STORAGE_COVER_BUCKET = 'album-covers';

// Client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Génère une URL signée pour les fichiers audio (bucket privé)
 */
export async function getSignedAudioUrl(filePath: string): Promise<string | null> {
  const {data, error} = await supabase.storage
    .from(STORAGE_AUDIO_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('❌ Erreur URL audio:', error.message);
    return null;
  }
  return data?.signedUrl || null;
}

/**
 * Génère une URL signée pour les covers d'album (bucket public)
 */
export async function getSignedCoverUrl(filePath: string): Promise<string | null> {
  const {data, error} = await supabase.storage
    .from(STORAGE_COVER_BUCKET)
    .createSignedUrl(filePath, 3600);

  if (error) {
    console.error('❌ Erreur URL cover:', error.message);
    return null;
  }
  return data?.signedUrl || null;
}

export default supabase;