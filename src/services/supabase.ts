import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// ⚠️ REMPLACEZ avec vos propres credentials
// Obtenez-les sur https://app.supabase.com
// ============================================

export const SUPABASE_URL = 'https://VOTRE_PROJET.supabase.co';
export const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_PUBLIQUE';

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