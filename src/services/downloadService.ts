import RNFS from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';
import {supabase, STORAGE_AUDIO_BUCKET} from './supabase';
import type {Track, DownloadedTrack} from '../types';

const DOWNLOADS_DIR = `${RNFS.DocumentDirectoryPath}/spotify-downloads`;

/**
 * Initialise le dossier de téléchargement
 */
export async function initDownloadsFolder(): Promise<void> {
  const exists = await RNFS.exists(DOWNLOADS_DIR);
  if (!exists) {
    await RNFS.mkdir(DOWNLOADS_DIR);
  }
}

/**
 * Télécharge une track pour le mode hors ligne
 */
export async function downloadTrack(
  track: Track,
  onProgress?: (percent: number) => void,
): Promise<DownloadedTrack | null> {
  try {
    await initDownloadsFolder();

    const localPath = `${DOWNLOADS_DIR}/${track.id}.mp3`;

    // Déjà téléchargé ?
    const exists = await RNFS.exists(localPath);
    if (exists) {
      const downloads = await getDownloadedTracks();
      return downloads.find((d) => d.track_id === track.id) || null;
    }

    // URL du fichier audio
    let audioUrl = track.audio_url;
    if (!audioUrl.startsWith('http') && !audioUrl.startsWith('file://')) {
      const {data} = await supabase.storage
        .from(STORAGE_AUDIO_BUCKET)
        .createSignedUrl(audioUrl, 3600);
      if (data?.signedUrl) {
        audioUrl = data.signedUrl;
      } else {
        console.error('❌ Impossible de générer URL signée');
        return null;
      }
    }

    // Téléchargement avec progression
    await RNFetchBlob.config({
      path: localPath,
      fileCache: false,
    })
      .fetch('GET', audioUrl)
      .progress({interval: 1000}, (received, total) => {
        const percent = total > 0 ? Math.round((received / total) * 100) : 0;
        if (onProgress) onProgress(percent);
      });

    // Mettre à jour les métadonnées
    const downloads = await getDownloadedTracks();
    const newDownload: DownloadedTrack = {
      track_id: track.id,
      local_path: localPath,
      downloaded_at: new Date().toISOString(),
      track,
    };

    await RNFS.writeFile(
      `${DOWNLOADS_DIR}/metadata.json`,
      JSON.stringify([...downloads, newDownload], null, 2),
      'utf8',
    );

    return newDownload;
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    return null;
  }
}

/**
 * Récupère toutes les tracks téléchargées
 */
export async function getDownloadedTracks(): Promise<DownloadedTrack[]> {
  try {
    const exists = await RNFS.exists(`${DOWNLOADS_DIR}/metadata.json`);
    if (!exists) return [];

    const content = await RNFS.readFile(
      `${DOWNLOADS_DIR}/metadata.json`,
      'utf8',
    );
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Vérifie si une track est téléchargée
 */
export async function isTrackDownloaded(trackId: string): Promise<boolean> {
  const downloads = await getDownloadedTracks();
  return downloads.some((d) => d.track_id === trackId);
}

/**
 * Supprime une track téléchargée
 */
export async function deleteDownloadedTrack(trackId: string): Promise<boolean> {
  try {
    const downloads = await getDownloadedTracks();
    const download = downloads.find((d) => d.track_id === trackId);

    if (download) {
      const fileExists = await RNFS.exists(download.local_path);
      if (fileExists) {
        await RNFS.unlink(download.local_path);
      }

      const updated = downloads.filter((d) => d.track_id !== trackId);
      await RNFS.writeFile(
        `${DOWNLOADS_DIR}/metadata.json`,
        JSON.stringify(updated, null, 2),
        'utf8',
      );
    }
    return true;
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return false;
  }
}

/**
 * Espace utilisé par les téléchargements (en MB)
 */
export async function getDownloadsSize(): Promise<number> {
  try {
    const stat = await RNFS.stat(DOWNLOADS_DIR);
    return stat.size / (1024 * 1024);
  } catch {
    return 0;
  }
}

/**
 * Supprime tous les téléchargements
 */
export async function clearAllDownloads(): Promise<boolean> {
  try {
    await RNFS.unlink(DOWNLOADS_DIR);
    await initDownloadsFolder();
    return true;
  } catch {
    return false;
  }
}

/**
 * Récupère le chemin local d'une track
 */
export async function getLocalPath(trackId: string): Promise<string | null> {
  const downloads = await getDownloadedTracks();
  const download = downloads.find((d) => d.track_id === trackId);
  return download?.local_path || null;
}

export default {
  initDownloadsFolder,
  downloadTrack,
  getDownloadedTracks,
  isTrackDownloaded,
  deleteDownloadedTrack,
  getDownloadsSize,
  clearAllDownloads,
  getLocalPath,
};