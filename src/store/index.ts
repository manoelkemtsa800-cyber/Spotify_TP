import {create} from 'zustand';
import TrackPlayer, {Track as TPTrack} from 'react-native-track-player';
import * as auth from '../services/authService';
import * as music from '../services/musicService';
import * as player from '../services/playerService';
import * as download from '../services/downloadService';
import type {User, Track, Playlist, UserLikedTrack, DownloadedTrack, RepeatMode, QueueItem} from '../types';
import {supabase, STORAGE_AUDIO_BUCKET} from '../services/supabase';
import RNFS from 'react-native-fs';
import RNFetchBlob from 'react-native-blob-util';

const DOWNLOADS_DIR = `${RNFS.DocumentDirectoryPath}/spotify-downloads`;

// ==================== AUTH STORE ====================

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  isGuest: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,
  isGuest: false,

  initialize: async () => {
    try {
      const user = await auth.getCurrentUser();
      set({user, loading: false, initialized: true});
    } catch {
      set({user: null, loading: false, initialized: true});
    }
  },

  signIn: async (email, password) => {
    set({loading: true});
    const {user, error} = await auth.signIn(email, password);
    set({user, loading: false, isGuest: false});
    return !!user && !error;
  },

  signUp: async (email, password, name) => {
    set({loading: true});
    const {user, error} = await auth.signUp(email, password, name);
    set({user, loading: false, isGuest: false});
    return !!user && !error;
  },

  signOut: async () => {
    set({loading: true});
    await auth.signOut();
    set({user: null, loading: false, isGuest: false});
  },

  continueAsGuest: () => {
    set({user: null, isGuest: true, initialized: true});
  },
}));

// ==================== MUSIC STORE ====================

interface MusicState {
  allTracks: Track[];
  popularTracks: Track[];
  searchResults: Track[];
  searchQuery: string;
  isSearching: boolean;
  playlists: Playlist[];
  currentPlaylist: Playlist | null;
  playlistsLoading: boolean;
  likedTracks: Track[];
  likedLoading: boolean;

  fetchAllTracks: () => Promise<void>;
  fetchPopularTracks: () => Promise<void>;
  searchTracks: (query: string) => Promise<void>;
  fetchUserPlaylists: (userId: string) => Promise<void>;
  fetchPlaylistById: (playlistId: string) => Promise<void>;
  createPlaylist: (userId: string, name: string, description?: string, isPublic?: boolean) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  fetchLikedTracks: (userId: string) => Promise<void>;
  likeTrack: (userId: string, trackId: string) => Promise<void>;
  unlikeTrack: (userId: string, trackId: string) => Promise<void>;
  toggleLike: (userId: string, track: Track) => Promise<boolean>;
  isTrackLiked: (userId: string, trackId: string) => Promise<boolean>;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  allTracks: [],
  popularTracks: [],
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  playlists: [],
  currentPlaylist: null,
  playlistsLoading: false,
  likedTracks: [],
  likedLoading: false,

  fetchAllTracks: async () => {
    const tracks = await music.getTracks();
    set({allTracks: tracks});
  },

  fetchPopularTracks: async () => {
    const tracks = await music.getPopularTracks(10);
    set({popularTracks: tracks});
  },

  searchTracks: async (query: string) => {
    set({isSearching: true, searchQuery: query});
    const results = await music.searchTracks(query);
    set({searchResults: results, isSearching: false});
  },

  fetchUserPlaylists: async (userId: string) => {
    set({playlistsLoading: true});
    const playlists = await music.getUserPlaylists(userId);
    set({playlists, playlistsLoading: false});
  },

  fetchPlaylistById: async (playlistId: string) => {
    const playlist = await music.getPlaylistById(playlistId);
    set({currentPlaylist: playlist});
  },

  createPlaylist: async (userId, name, description, isPublic = true) => {
    const playlist = await music.createPlaylist(userId, name, description, isPublic);
    if (playlist) {
      const {playlists} = get();
      set({playlists: [...playlists, playlist]});
    }
  },

  deletePlaylist: async (playlistId: string) => {
    const success = await music.deletePlaylist(playlistId);
    if (success) {
      const {playlists} = get();
      set({playlists: playlists.filter((p) => p.id !== playlistId)});
    }
  },

  fetchLikedTracks: async (userId: string) => {
    set({likedLoading: true});
    const liked = await music.getLikedTracks(userId);
    const tracks = liked.map((lt) => lt.track).filter(Boolean) as Track[];
    set({likedTracks: tracks, likedLoading: false});
  },

  likeTrack: async (userId, trackId) => {
    const success = await music.likeTrack(userId, trackId);
    if (success) {
      const {likedTracks, allTracks} = get();
      const track = allTracks.find((t) => t.id === trackId);
      if (track) set({likedTracks: [...likedTracks, track]});
    }
  },

  unlikeTrack: async (userId, trackId) => {
    const success = await music.unlikeTrack(userId, trackId);
    if (success) {
      const {likedTracks} = get();
      set({likedTracks: likedTracks.filter((t) => t.id !== trackId)});
    }
  },

  toggleLike: async (userId, track) => {
    const {likedTracks} = get();
    const isAlreadyLiked = likedTracks.some((t) => t.id === track.id);

    if (isAlreadyLiked) {
      await get().unlikeTrack(userId, track.id);
      return false;
    } else {
      await get().likeTrack(userId, track.id);
      return true;
    }
  },

  isTrackLiked: async (userId, trackId) => {
    return await music.isTrackLiked(userId, trackId);
  },
}));

// ==================== PLAYER STORE ====================

interface PlayerStoreState {
  isPlaying: boolean;
  isBuffering: boolean;
  currentPosition: number;
  currentDuration: number;
  currentQueue: Track[];
  currentTrack: Track | null;
  currentTrackIndex: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  miniPlayerVisible: boolean;

  queueAndPlay: (tracks: Track[], startIndex?: number) => Promise<void>;
  playTrack: (track: Track, queue?: Track[], startIndex?: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setMiniPlayerVisible: (visible: boolean) => void;
  updateProgress: (position: number, duration: number) => void;
}

export const usePlayerStore = create<PlayerStoreState>((set, get) => ({
  isPlaying: false,
  isBuffering: false,
  currentPosition: 0,
  currentDuration: 0,
  currentQueue: [],
  currentTrackIndex: 0,
  currentTrack: null,
  isShuffle: false,
  repeatMode: 'off',
  miniPlayerVisible: false,

  queueAndPlay: async (tracks, startIndex = 0) => {
    if (tracks.length === 0) return;

    const tpTracks: TPTrack[] = await Promise.all(
      tracks.map(async (track) => {
        let url = track.audio_url;

        // Fichier local (mode offline)
        if (track.localPath) {
          url = track.localPath;
        } else if (!url.startsWith('file://') && !url.startsWith('http')) {
          // URL Supabase Storage
          const {data} = await supabase.storage
            .from(STORAGE_AUDIO_BUCKET)
            .createSignedUrl(url, 3600);
          if (data?.signedUrl) url = data.signedUrl;
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
      }),
    );

    await TrackPlayer.reset();
    await TrackPlayer.add(tpTracks);
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();

   set({
     currentQueue: tracks,
     currentTrackIndex: startIndex,
     currentTrack: tracks[startIndex] || null,
     isPlaying: true,
     miniPlayerVisible: true,
   });
  },

  playTrack: async (track, queue, startIndex = 0) => {
    const tracksToPlay = queue || [track];
    const index = startIndex !== undefined ? startIndex : tracksToPlay.findIndex((t) => t.id === track.id);
    await get().queueAndPlay(tracksToPlay, index >= 0 ? index : 0);
  },

  togglePlay: async () => {
    const {isPlaying} = get();
    if (isPlaying) {
      await TrackPlayer.pause();
      set({isPlaying: false});
    } else {
      await TrackPlayer.play();
      set({isPlaying: true});
    }
  },

  skipToNext: async () => {
    const {currentQueue, currentTrackIndex, repeatMode, isShuffle} = get();
    if (currentQueue.length === 0) return;

    if (repeatMode === 'one') {
      await TrackPlayer.seekTo(0);
      await TrackPlayer.play();
      return;
    }

    let nextIndex: number;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * currentQueue.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % currentQueue.length;
      if (nextIndex === 0 && repeatMode === 'off') {
        await TrackPlayer.pause();
        set({isPlaying: false});
        return;
      }
    }

    await TrackPlayer.skipToNext();
    set({currentTrackIndex: nextIndex});
  },

  skipToPrevious: async () => {
    const {currentPosition, currentTrackIndex, currentQueue} = get();
    if (currentQueue.length === 0) return;

    if (currentPosition > 3) {
      await TrackPlayer.seekTo(0);
      return;
    }

    const prevIndex = (currentTrackIndex - 1 + currentQueue.length) % currentQueue.length;
    await TrackPlayer.skipToPrevious();
    set({currentTrackIndex: prevIndex});
  },

  seekTo: async (seconds) => {
    await TrackPlayer.seekTo(seconds);
    set({currentPosition: seconds});
  },

  toggleShuffle: () => {
    set((state) => ({isShuffle: !state.isShuffle}));
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: RepeatMode[] = [RepeatMode.OFF, RepeatMode.ONE, RepeatMode.ALL];
      const currentIndex = modes.indexOf(state.repeatMode);
      const nextMode = modes[(currentIndex + 1) % modes.length];
      return {repeatMode: nextMode};
    });
  },

  setMiniPlayerVisible: (visible) => set({miniPlayerVisible: visible}),

  updateProgress: (position, duration) => {
    set({currentPosition: position, currentDuration: duration});
  },
}));

// ==================== DOWNLOADS STORE ====================

interface DownloadState {
  downloads: DownloadedTrack[];
  downloading: Record<string, number>;
  loading: boolean;

  initDownloadsFolder: () => Promise<void>;
  loadDownloads: () => Promise<void>;
  downloadTrack: (track: Track) => Promise<boolean>;
  removeDownload: (trackId: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  isDownloaded: (trackId: string) => boolean;
}

export const useDownloadStore = create<DownloadState>((set, get) => ({
  downloads: [],
  downloading: {},
  loading: false,

  initDownloadsFolder: async () => {
    const exists = await RNFS.exists(DOWNLOADS_DIR);
    if (!exists) await RNFS.mkdir(DOWNLOADS_DIR);
  },

  loadDownloads: async () => {
    await get().initDownloadsFolder();
    const dls = await download.getDownloadedTracks();
    set({downloads: dls});
  },

  downloadTrack: async (track) => {
    const {downloads} = get();
    if (downloads.find((d) => d.track_id === track.id)) return true;

    set((state) => ({downloading: {...state.downloading, [track.id]: 0}}));

    const result = await download.downloadTrack(track, (percent) => {
      set((state) => ({downloading: {...state.downloading, [track.id]: percent}}));
    });

    if (result) {
      const updated = [...downloads, result];
      set({downloads: updated, downloading: {...get().downloading, [track.id]: 100}});

      setTimeout(() => {
        set((state) => {
          const dl = {...state.downloading};
          delete dl[track.id];
          return {downloading: dl};
        });
      }, 2000);
      return true;
    }

    set((state) => {
      const dl = {...state.downloading};
      delete dl[track.id];
      return {downloading: dl};
    });
    return false;
  },

  removeDownload: async (trackId) => {
    await download.deleteDownloadedTrack(trackId);
    set((state) => ({
      downloads: state.downloads.filter((d) => d.track_id !== trackId),
    }));
  },

  clearAllDownloads: async () => {
    await download.clearAllDownloads();
    set({downloads: []});
  },

  isDownloaded: (trackId) => {
    const {downloads} = get();
    return downloads.some((d) => d.track_id === trackId);
  },
}));
