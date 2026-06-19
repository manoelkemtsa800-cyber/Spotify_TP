import React, {useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useAuthStore, useMusicStore, usePlayerStore} from '../store';
import type {Track} from '../types';
import TrackRow from '../components/TrackRow';
import MiniPlayer from '../components/MiniPlayer';
import GuestRestricted from '../components/GuestRestricted';

const LikedScreen = () => {
  const {user, isGuest} = useAuthStore();
  const {likedTracks, likedLoading, fetchLikedTracks} = useMusicStore();
  const {queueAndPlay, currentTrack, miniPlayerVisible} = usePlayerStore();

  useEffect(() => {
    if (user) fetchLikedTracks(user.id);
  }, [user]);

  if (isGuest) {
    return (
      <GuestRestricted
        icon="heart-outline"
        message="Connecte-toi pour aimer des titres et retrouver tes favoris ici."
      />
    );
  }

  const handlePlayTrack = (track: Track, index: number) => {
    queueAndPlay(likedTracks, index);
  };

  const handlePlayAll = () => {
    if (likedTracks.length > 0) queueAndPlay(likedTracks, 0);
  };

  const handleUnlike = async (trackId: string) => {
    if (!user) return;
    const {unlikeTrack} = useMusicStore.getState();
    await unlikeTrack(user.id, trackId);
  };

  if (likedLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Icon name="heart" size={28} color="#1DB954" />
          <Text style={styles.headerTitle}>Titres likés</Text>
        </View>
        <Text style={styles.trackCount}>{likedTracks.length} titres</Text>
        <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
          <Icon name="play" size={20} color="#fff" />
          <Text style={styles.playAllText}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={likedTracks}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({item, index}) => (
          <TrackRow
            track={item}
            index={index + 1}
            onPress={() => handlePlayTrack(item, index)}
            onLike={() => handleUnlike(item.id)}
            isLiked={true}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="heart-outline" size={60} color="#888" />
            <Text style={styles.emptyText}>Aucun titre liké</Text>
            <Text style={styles.emptySubtext}>
              Appuyez sur le cœur à côté d'un titre pour l'ajouter ici
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
  header: {paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16},
  headerTop: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  headerTitle: {fontSize: 28, fontWeight: 'bold', color: '#fff', marginLeft: 12},
  trackCount: {fontSize: 14, color: '#888', marginBottom: 12},
  playAllButton: {
    backgroundColor: '#1DB954',
    borderRadius: 25,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  playAllText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  list: {paddingHorizontal: 8},
  emptyContainer: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 16},
  emptySubtext: {fontSize: 14, color: '#888', marginTop: 8, textAlign: 'center', paddingHorizontal: 30},
});

export default LikedScreen;