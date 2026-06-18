import React, {useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDownloadStore, usePlayerStore} from '../store';
import type {DownloadedTrack, Track} from '../types';
import TrackRow from '../components/TrackRow';
import MiniPlayer from '../components/MiniPlayer';

const DownloadsScreen = () => {
  const {downloads, loadDownloads, removeDownload, clearAllDownloads} = useDownloadStore();
  const {queueAndPlay, currentTrack, miniPlayerVisible} = usePlayerStore();

  useEffect(() => {
    loadDownloads();
  }, []);

  const handlePlayTrack = (track: Track, index: number, tracks: Track[]) => {
    queueAndPlay(tracks, index);
  };

  const handlePlayAll = () => {
    const tracks = downloads.map((d) => d.track);
    if (tracks.length > 0) queueAndPlay(tracks, 0);
  };

  const handleDelete = (download: DownloadedTrack) => {
    Alert.alert(
      'Supprimer le téléchargement',
      `Supprimer "${download.track.title}" ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await removeDownload(download.track_id);
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Supprimer tous les téléchargements',
      'Êtes-vous sûr de vouloir supprimer toutes les musiques téléchargées ?',
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: () => clearAllDownloads(),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Téléchargements</Text>
        {downloads.length > 0 && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
              <Icon name="play" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Icon name="trash-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.count}>{downloads.length} titre{downloads.length > 1 ? 's' : ''} téléchargé{downloads.length > 1 ? 's' : ''}</Text>

      <FlatList
        data={downloads}
        keyExtractor={(item) => item.track_id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({item, index}) => (
          <View style={styles.downloadItem}>
            <TrackRow
              track={item.track}
              index={index + 1}
              onPress={() => handlePlayTrack(item.track, index, downloads.map(d => d.track))}
            />
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item)}>
              <Icon name="close-circle" size={24} color="#888" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="download-outline" size={60} color="#888" />
            <Text style={styles.emptyText}>Aucun téléchargement</Text>
            <Text style={styles.emptySubtext}>
              Téléchargez des musiques pour les écouter hors ligne
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
  header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16},
  title: {fontSize: 28, fontWeight: 'bold', color: '#fff'},
  headerActions: {flexDirection: 'row', gap: 12},
  playAllButton: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#1DB954', justifyContent: 'center', alignItems: 'center'},
  clearButton: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center'},
  count: {fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 8},
  list: {paddingHorizontal: 8},
  downloadItem: {flexDirection: 'row', alignItems: 'center'},
  deleteButton: {padding: 8},
  emptyContainer: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 16},
  emptySubtext: {fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 30},
});

export default DownloadsScreen;