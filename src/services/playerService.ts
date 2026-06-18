import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  Track as TPTrack,
} from 'react-native-track-player';
import {supabase, STORAGE_AUDIO_BUCKET} from './supabase';
import type {Track as AppTrack} from '../types';

// ==================== INITIALISATION ====================

export async function setupPlayer(): Promise<boolean> {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 1024 * 512, // 512MB cache
    });

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          TrackPlayer.AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.Stop,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      progressUpdateEventInterval: 1,
    });

    return true;
  } catch (error) {
    console.error('❌ Erreur setup player:', error);
    return false;
  }
}

// ==================== SERVICE BACKGROUND ====================

export async function playbackService(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) =>
    TrackPlayer.seekTo(event.position),
  );
}

// ==================== CONTRÔLES ====================

export async function addTracks(tracks: TPTrack[]): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
}

export async function playTracks(tracks: TPTrack[], startIndex: number = 0): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
  await TrackPlayer.skip(startIndex);
  await TrackPlayer.play();
}

export async function play(): Promise<void> {
  await TrackPlayer.play();
}

export async function pause(): Promise<void> {
  await TrackPlayer.pause();
}

export async function stop(): Promise<void> {
  await TrackPlayer.stop();
}

export async function skipToNext(): Promise<void> {
  await TrackPlayer.skipToNext();
}

export async function skipToPrevious(): Promise<void> {
  await TrackPlayer.skipToPrevious();
}

export async function seekTo(seconds: number): Promise<void> {
  await TrackPlayer.seekTo(seconds);
}

export async function togglePlayback(): Promise<void> {
  const state = await TrackPlayer.getPlaybackState();
  if (state.state === State.Playing) {
    await TrackPlayer.pause();
  } else {
    await TrackPlayer.play();
  }
}

export async function setRepeatMode(mode: RepeatMode): Promise<void> {
  await TrackPlayer.setRepeatMode(mode);
}

export async function setShuffle(enabled: boolean): Promise<void> {
  // Shuffle géré côté app (Zustand)
}

// ==================== GETTERS ====================

export async function getCurrentTrackIndex(): Promise<number | null> {
  return await TrackPlayer.getActiveTrackIndex();
}

export async function getQueue(): Promise<TPTrack[]> {
  return await TrackPlayer.getQueue();
}

export async function getPlaybackState(): Promise<State> {
  const state = await TrackPlayer.getPlaybackState();
  return state.state;
}

// ==================== CONVERSION ====================

export async function convertToTPTrack(track: AppTrack): Promise<TPTrack> {
  let url = track.audio_url;

  // Fichier local (mode offline)
  if (track.localPath) {
    return {
      id: track.id,
      url: track.localPath,
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.album_cover_url || undefined,
      duration: track.duration,
    };
  }

  // URL Supabase Storage (relative)
  if (!url.startsWith('http') && !url.startsWith('file://')) {
    const {data} = await supabase.storage
      .from(STORAGE_AUDIO_BUCKET)
      .createSignedUrl(url, 3600);
    if (data?.signedUrl) {
      url = data.signedUrl;
    }
  }

  return {
    id: track.id,
    url,
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: track.album_cover_url || undefined,
    duration: track.duration,
  };
}

export default {
  setupPlayer,
  playbackService,
  addTracks,
  playTracks,
  play,
  pause,
  stop,
  skipToNext,
  skipToPrevious,
  seekTo,
  togglePlayback,
  setRepeatMode,
  setShuffle,
  getCurrentTrackIndex,
  getQueue,
  getPlaybackState,
  convertToTPTrack,
};