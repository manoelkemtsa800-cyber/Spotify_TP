import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList, Track} from '../types';
import {useAuthStore, useMusicStore, usePlayerStore, useDownloadStore} from '../store';
import TrackRow from '../components/TrackRow';
import MiniPlayer from '../components/MiniPlayer';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavProp>();
  const {user, isGuest} = useAuthStore();
  const {
    allTracks,
    popularTracks,
    playlists,
    tracksLoading,
    fetchAllTracks,
    fetchPopularTracks,
    fetchUserPlaylists,
  } = useMusicStore();
  const {playTrack, queueTracks, currentTrack, isPlaying, miniPlayerVisible} = usePlayerStore();
  const {downloadTrack, isDownloaded, downloading} = useDownloadStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    await Promise.all([
      fetchAllTracks(),
      fetchPopularTracks(),
      user ? fetchUserPlaylists(user.id) : Promise.resolve(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePlayTrack = (track: Track, tracks: Track[], index: number) => {
    queueTracks(tracks, index);
  };

  const handleDownload = async (track: Track) => {
    if (isDownloaded(track.id)) {
      Alert.alert('Info', 'Cette musique est déjà téléchargée');
      return;
    }
    const success = await downloadTrack(track);
    if (success) {
      Alert.alert('Succès', 'Musique téléchargée pour le mode hors ligne');
    } else {
      Alert.alert('Erreur', 'Impossible de télécharger la musique');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const getGreetingColor = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '#1DB954';
    if (hour < 18) return '#1ED760';
    return '#169B45';
  };

  if (tracksLoading && allTracks.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DB954']}
            tintColor="#1DB954"
          />
        }
        contentContainerStyle={{paddingBottom: miniPlayerVisible ? 140 : 80}}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, {color: getGreetingColor()}]}>
              {getGreeting()}
            </Text>
            {user && <Text style={styles.username}>{user.display_name}</Text>}
          </View>
        </View>

        {/* Raccourcis Playlists */}
        {playlists.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vos playlists</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={styles.playlistCard}
                  onPress={() =>
                    navigation.navigate('PlaylistDetail', {playlistId: playlist.id})
                  }>
                  <Image
                    source={{
                      uri:
                        playlist.cover_url ||
                        'https://via.placeholder.com/150/1DB954/FFFFFF?text=Playlist',
                    }}
                    style={styles.playlistImage}
                  />
                  <Text style={styles.playlistName} numberOfLines={2}>
                    {playlist.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Populaire */}
        {popularTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Populaire</Text>
            {popularTracks.slice(0, 5).map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index + 1}
                onPress={() => handlePlayTrack(track, popularTracks, index)}
                onDownload={isGuest ? undefined : () => handleDownload(track)}
                isDownloaded={isDownloaded(track.id)}
                downloadProgress={downloading[track.id] || 0}
              />
            ))}
          </View>
        )}

        {/* Tous les titres */}
        {allTracks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tous les titres</Text>
            {allTracks.map((track, index) => (
              <TrackRow
                key={track.id}
                track={track}
                index={index + 1}
                onPress={() => handlePlayTrack(track, allTracks, index)}
                onDownload={isGuest ? undefined : () => handleDownload(track)}
                isDownloaded={isDownloaded(track.id)}
                downloadProgress={downloading[track.id] || 0}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {allTracks.length === 0 && popularTracks.length === 0 && (
          <View style={styles.emptyContainer}>
            <Icon name="musical-notes-outline" size={60} color="#888" />
            <Text style={styles.emptyText}>Aucune musique</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez des musiques dans Supabase pour les voir ici
            </Text>
          </View>
        )}
      </ScrollView>

      {currentTrack && <MiniPlayer />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212'},
  scrollView: {flex: 1},
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {color: '#888', marginTop: 16, fontSize: 16},
  header: {paddingHorizontal: 16, paddingTop: 60, paddingBottom: 20},
  greeting: {fontSize: 28, fontWeight: 'bold'},
  username: {fontSize: 16, color: '#888', marginTop: 4},
  section: {paddingHorizontal: 16, marginTop: 24},
  sectionTitle: {fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 12},
  playlistCard: {
    width: 150,
    marginRight: 12,
    alignItems: 'center',
  },
  playlistImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: 150,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 16},
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
});

export default HomeScreen;