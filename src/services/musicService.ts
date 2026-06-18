import {supabase} from './supabase';
import type {Track, Playlist, UserLikedTrack} from '../types';

// ==================== TRACKS ====================

export async function getTracks(): Promise<Track[]> {
  const {data, error} = await supabase
    .from('tracks')
    .select('*')
    .order('created_at', {ascending: false});

  if (error) {
    console.error('❌ Erreur tracks:', error);
    return [];
  }
  return data || [];
}

export async function getTrackById(trackId: string): Promise<Track | null> {
  const {data, error} = await supabase
    .from('tracks')
    .select('*')
    .eq('id', trackId)
    .single();

  if (error) return null;
  return data;
}

export async function searchTracks(query: string): Promise<Track[]> {
  if (!query.trim()) return [];

  const {data, error} = await supabase
    .from('tracks')
    .select('*')
    .or(`title.ilike.%${query}%,artist.ilike.%${query}%,album.ilike.%${query}%`)
    .order('created_at', {ascending: false});

  if (error) {
    console.error('❌ Erreur recherche:', error);
    return [];
  }
  return data || [];
}

export async function getTracksByArtist(artist: string): Promise<Track[]> {
  const {data} = await supabase
    .from('tracks')
    .select('*')
    .eq('artist', artist)
    .order('created_at', {ascending: false});
  return data || [];
}

export async function getTracksByAlbum(album: string): Promise<Track[]> {
  const {data} = await supabase
    .from('tracks')
    .select('*')
    .eq('album', album)
    .order('created_at', {ascending: false});
  return data || [];
}

export async function getPopularTracks(limit: number = 10): Promise<Track[]> {
  const {data} = await supabase
    .from('tracks')
    .select('*')
    .order('plays', {ascending: false})
    .limit(limit);
  return data || [];
}

// ==================== PLAYLISTS ====================

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const {data, error} = await supabase
    .from('playlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {ascending: false});

  if (error) return [];
  return data || [];
}

export async function getPublicPlaylists(): Promise<Playlist[]> {
  const {data} = await supabase
    .from('playlists')
    .select('*')
    .eq('is_public', true)
    .order('created_at', {ascending: false});
  return data || [];
}

export async function createPlaylist(
  userId: string,
  name: string,
  description?: string,
  isPublic: boolean = true,
): Promise<Playlist | null> {
  const {data, error} = await supabase
    .from('playlists')
    .insert({
      user_id: userId,
      name,
      description: description || '',
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur création playlist:', error);
    return null;
  }
  return data;
}

export async function getPlaylistById(playlistId: string): Promise<Playlist | null> {
  const {data: playlist, error: playlistError} = await supabase
    .from('playlists')
    .select('*')
    .eq('id', playlistId)
    .single();

  if (playlistError) return null;

  const {data: playlistTracks} = await supabase
    .from('playlist_tracks')
    .select(`*, track:tracks(*)`)
    .eq('playlist_id', playlistId)
    .order('position', {ascending: true});

  if (playlist) {
    playlist.tracks = playlistTracks || [];
  }

  return playlist;
}

export async function addTrackToPlaylist(
  playlistId: string,
  trackId: string,
): Promise<boolean> {
  const {data: lastTrack} = await supabase
    .from('playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', {ascending: false})
    .limit(1)
    .single();

  const position = lastTrack ? lastTrack.position + 1 : 0;

  const {data: existing} = await supabase
    .from('playlist_tracks')
    .select('id')
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId)
    .single();

  if (existing) return true;

  const {error} = await supabase.from('playlist_tracks').insert({
    playlist_id: playlistId,
    track_id: trackId,
    position,
  });

  return !error;
}

export async function removeTrackFromPlaylist(
  playlistId: string,
  trackId: string,
): Promise<boolean> {
  const {error} = await supabase
    .from('playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);
  return !error;
}

export async function deletePlaylist(playlistId: string): Promise<boolean> {
  await supabase.from('playlist_tracks').delete().eq('playlist_id', playlistId);
  const {error} = await supabase.from('playlists').delete().eq('id', playlistId);
  return !error;
}

export async function updatePlaylist(
  playlistId: string,
  updates: {name?: string; description?: string; is_public?: boolean},
): Promise<boolean> {
  const {error} = await supabase
    .from('playlists')
    .update(updates)
    .eq('id', playlistId);
  return !error;
}

// ==================== LIKED TRACKS ====================

export async function getLikedTracks(userId: string): Promise<UserLikedTrack[]> {
  const {data, error} = await supabase
    .from('user_liked_tracks')
    .select(`*, track:tracks(*)`)
    .eq('user_id', userId)
    .order('liked_at', {ascending: false});

  if (error) return [];
  return data || [];
}

export async function likeTrack(userId: string, trackId: string): Promise<boolean> {
  const {error} = await supabase
    .from('user_liked_tracks')
    .insert({user_id: userId, track_id: trackId});
  return !error;
}

export async function unlikeTrack(userId: string, trackId: string): Promise<boolean> {
  const {error} = await supabase
    .from('user_liked_tracks')
    .delete()
    .eq('user_id', userId)
    .eq('track_id', trackId);
  return !error;
}

export async function isTrackLiked(userId: string, trackId: string): Promise<boolean> {
  const {data} = await supabase
    .from('user_liked_tracks')
    .select('id')
    .eq('user_id', userId)
    .eq('track_id', trackId)
    .single();
  return !!data;
}

// ==================== STATS ====================

export async function incrementTrackPlays(trackId: string): Promise<void> {
  await supabase.rpc('increment_track_plays', {track_id: trackId});
}

export default {
  getTracks,
  getTrackById,
  searchTracks,
  getTracksByArtist,
  getTracksByAlbum,
  getPopularTracks,
  getUserPlaylists,
  getPublicPlaylists,
  createPlaylist,
  getPlaylistById,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getLikedTracks,
  likeTrack,
  unlikeTrack,
  isTrackLiked,
  incrementTrackPlays,
};