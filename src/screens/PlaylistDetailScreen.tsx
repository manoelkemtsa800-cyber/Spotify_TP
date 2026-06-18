import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {useMusicStore, usePlayerStore, useDownloadStore} from '../store';
import type {Track, PlaylistTrack} from '../types';
import TrackRow from '../components/TrackRow';
import MiniPlayer from '../components/MiniPlayer';

type PlaylistDetailNavProp = NativeStackNavigationProp<RootStackParamList, 'PlaylistDetail'>;

const PlaylistDetailScreen = () => {
  const navigation = useNavigation<PlaylistDetailNavProp>();
  const route = useRoute();
  const {playlistId} = route.params as {playlistId: string};
  const {currentPlaylist, fetchPlaylistById, allTracks, fetchAllTracks, deletePlaylist} = useMusicStore();
  const {queueAndPlay, currentTrack, miniPlayerVisible} = usePlayerStore();
  const {downloadTrack, isDownloaded} = useDownloadStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllTracks();
    fetchPlaylistById(playlistId);
    setLoading(false);
  }, [playlistId]);

  const handlePlayTrack = (track: Track, index: number) => {
    const tracks = currentPlaylist?.tracks?.map(pt => pt.track).filter(Boolean) as Track[] || [];
    queueAndPlay(tracks, index);
  };

  const handlePlayAll = () => {
    const tracks = currentPlaylist?.tracks?.map(pt => pt.track).filter(Boolean) as Track[] || [];
    if (tracks.length > 0) queueAndPlay(tracks, 0);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la playlist',
      `Êtes-vous sûr de vouloir supprimer "${currentPlaylist?.name}" ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlistId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleDownload = async (track: Track) => {
    await downloadTrack(track);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (!currentPlaylist) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFoundText}>Playlist introuvable</Text>
      </View>
    );
  }

  const tracks = currentPlaylist.tracks?.map(pt => pt.track).filter(Boolean) as Track[] || [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{currentPlaylist.name}</Text>
          <Text style={styles.headerSubtitle}>{tracks.length} titres</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Icon name="trash-outline" size={24} color="#E91E63" />
        </TouchableOpacity>
      </View>

      {/* Cover */}
      <View style={styles.coverContainer}>
        <Image
          source={{uri: currentPlaylist.cover_url || 'https://via.placeholder.com/200/1DB954/FFFFFF?text=Playlist'}}
          style={styles.cover}
        />
        <TouchableOpacity style={styles.playButton} onPress={handlePlayAll}>
          <Icon name="play" size={30} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Description */}
      {currentPlaylist.description && (
        <Text style={styles.description}>{currentPlaylist.description}</Text>
      )}

      {/* Tracks */}
      <FlatList
        data={tracks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({item, index}) => (
          <TrackRow
            track={item}
            index={index + 1}
            onPress={() => handlePlayTrack(item, index)}
            onDownload={() => handleDownload(item)}
            isDownloaded={isDownloaded(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="list-outline" size={60} color="#888" />
            <Text style={styles.emptyText}>Aucune musique dans cette playlist</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez des musiques depuis l'écran d'accueil
            </Text>
          </View>
        }
      />

      {currentTrack && <MiniPlayer />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212'},
  loadingContainer: {flex: 1, backgroundColor: '#121212', justifyContent: 'center', alignItems: 'center'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {padding: 8},
  headerInfo: {flex: 1, marginLeft: 12},
  headerTitle: {fontSize: 22, fontWeight: 'bold', color: '#fff'},
  headerSubtitle: {fontSize: 14, color: '#888', marginTop: 4},
  deleteButton: {padding: 8},
  coverContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  cover: {
    width: 200,
    height: 200,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  playButton: {
    position: 'absolute',
    bottom: 10,
    right: '50%',
    marginRight: -110,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  description: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  list: {paddingHorizontal: 8},
  emptyContainer: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 16},
  emptySubtext: {fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 30},
  notFoundText: {fontSize: 18, color: '#888', textAlign: 'center', marginTop: 100},
});

export default PlaylistDetailScreen;