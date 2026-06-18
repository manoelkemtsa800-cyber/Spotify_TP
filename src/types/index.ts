export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_cover_url?: string;
  audio_url: string;
  duration: number;
  created_at: string;
  user_id?: string;
  localPath?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  user_id: string;
  is_public: boolean;
  created_at: string;
  tracks?: PlaylistTrack[];
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  track?: Track;
}

export interface UserLikedTrack {
  id: string;
  user_id: string;
  track_id: string;
  liked_at: string;
  track?: Track;
}

export interface DownloadedTrack {
  track_id: string;
  local_path: string;
  downloaded_at: string;
  track: Track;
}

export enum PlayerState {
  IDLE = 'idle',
  PLAYING = 'playing',
  PAUSED = 'paused',
  LOADING = 'loading',
  ERROR = 'error',
}

export enum RepeatMode {
  OFF = 'off',
  ONE = 'one',
  ALL = 'all',
}

export interface QueueItem {
  track: Track;
  source: 'playlist' | 'search' | 'liked' | 'album' | 'local';
  sourceId?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Player: { trackId?: string };
  PlaylistDetail: { playlistId: string };
  SearchDetail: { query: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Library: undefined;
  Liked: undefined;
  Downloads: undefined;
};