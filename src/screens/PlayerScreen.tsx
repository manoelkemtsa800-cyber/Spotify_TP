import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, PanResponder, LayoutChangeEvent} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation, useRoute} from '@react-navigation/native';
import TrackPlayer, {State, usePlaybackState, useProgress} from 'react-native-track-player';
import {useMusicStore, usePlayerStore, useDownloadStore, useAuthStore} from '../store';
import {supabase, STORAGE_AUDIO_BUCKET, STORAGE_COVER_BUCKET} from '../services/supabase';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';

type PlayerNavProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

const PlayerScreen = () => {
  const navigation = useNavigation<PlayerNavProp>();
  const route = useRoute();
  const {currentTrack, currentQueue, currentTrackIndex, isPlaying, togglePlay, skipToNext, skipToPrevious, repeatMode, isShuffle, toggleShuffle, toggleRepeat, currentPosition, currentDuration, seekTo, updateProgress} = usePlayerStore();
  const {likedTracks, toggleLike, isTrackLiked, likeTrack, unlikeTrack} = useMusicStore();
  const {downloadTrack, removeDownload, isDownloaded, downloading} = useDownloadStore();
  const playbackState = usePlaybackState();
  const progress = useProgress();
  const [isLiked, setIsLiked] = useState(false);
  const [isDownloadedState, setIsDownloadedState] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const progressBarWidth = useRef(0);

  useEffect(() => {
    updateProgress(progress.position, progress.duration);
  }, [progress]);

  useEffect(() => {
    if (currentTrack) {
      const {user} = useAuthStore.getState();
      if (user) {
        isTrackLiked(user.id, currentTrack.id).then(setIsLiked);
      }
      const downloaded = isDownloaded(currentTrack.id);
      setIsDownloadedState(downloaded);
    }
  }, [currentTrack]);

  const handleLike = async () => {
    const {user} = useAuthStore.getState();
    if (!user || !currentTrack) return;
    
    if (isLiked) {
      await unlikeTrack(user.id, currentTrack.id);
    } else {
      await likeTrack(user.id, currentTrack.id);
    }
    setIsLiked(!isLiked);
  };

  const handleDownload = async () => {
    if (!currentTrack) return;
    if (isDownloadedState) {
      await removeDownload(currentTrack.id);
      setIsDownloadedState(false);
    } else {
      const success = await downloadTrack(currentTrack);
      if (success) setIsDownloadedState(true);
    }
  };

  const progressPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsSeeking(true);
        const x = evt.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / progressBarWidth.current));
        setSeekPosition(ratio);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / progressBarWidth.current));
        setSeekPosition(ratio);
      },
      onPanResponderRelease: (evt) => {
        const x = evt.nativeEvent.locationX;
        const ratio = Math.max(0, Math.min(1, x / progressBarWidth.current));
        const {currentDuration} = usePlayerStore.getState();
        seekTo(ratio * currentDuration);
        setIsSeeking(false);
      },
    }),
  ).current;

  const getProgressRatio = () => {
    if (isSeeking) return seekPosition;
    return currentDuration > 0 ? currentPosition / currentDuration : 0;
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) {
    return (
      <View style={styles.container}>
        <Text style={styles.noTrackText}>Aucune musique en lecture</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>En lecture</Text>
          <Text style={styles.headerSubtitle}>Depuis la file d'attente</Text>
        </View>
        <View style={{width: 30}} />
      </View>

      {/* Cover Art */}
      <View style={styles.coverContainer}>
        <Image
          source={{uri: currentTrack.album_cover_url || 'https://via.placeholder.com/300/1DB954/FFFFFF?text=Music'}}
          style={styles.cover}
        />
      </View>

      {/* Track Info */}
      <View style={styles.trackInfo}>
        <Text style={styles.trackTitle} numberOfLines={1}>
          {currentTrack.title}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {currentTrack.artist}
        </Text>
      </View>

      {/* Progress Bar Interactive */}
      <View style={styles.progressContainer}>
        <Text style={styles.timeText}>
          {formatTime(isSeeking ? seekPosition * currentDuration : currentPosition)}
        </Text>
        <View
          style={styles.progressBar}
          onLayout={(e: LayoutChangeEvent) => {
            progressBarWidth.current = e.nativeEvent.layout.width;
          }}
          {...progressPanResponder.panHandlers}>
          <View
            style={[
              styles.progressFill,
              {width: `${getProgressRatio() * 100}%`},
            ]}
          />
          <View
            style={[
              styles.progressThumb,
              {left: `${getProgressRatio() * 100}%`},
            ]}
          />
        </View>
        <Text style={styles.timeText}>{formatTime(currentDuration)}</Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleShuffle}>
          <Icon
            name="shuffle"
            size={24}
            color={isShuffle ? '#1DB954' : '#888'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={skipToPrevious}>
          <Icon name="play-skip-back" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
          <Icon
            name={playbackState.playbackState === State.Playing ? 'pause' : 'play'}
            size={40}
            color="#fff"
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={skipToNext}>
          <Icon name="play-skip-forward" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlButton, styles.repeatButton]} onPress={toggleRepeat}>
          <Icon
            name="repeat"
            size={24}
            color={repeatMode !== 'off' ? '#1DB954' : '#888'}
          />
          {repeatMode === 'one' && (
            <View style={styles.repeatOneBadge}>
              <Text style={styles.repeatOneText}>1</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={24}
            color={isLiked ? '#1DB954' : '#888'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
          {downloading[currentTrack.id] ? (
            <Text style={styles.downloadProgress}>{downloading[currentTrack.id]}%</Text>
          ) : (
            <Icon
              name={isDownloadedState ? 'download' : 'download-outline'}
              size={24}
              color={isDownloadedState ? '#1DB954' : '#888'}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="ellipsis-horizontal" size={24} color="#888" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888',
    marginLeft: 16,
  },
  coverContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cover: {
    width: 300,
    height: 300,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  trackTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  trackArtist: {
    fontSize: 16,
    color: '#888',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 12,
    color: '#888',
    minWidth: 40,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    gap: 20,
  },
  controlButton: {
    padding: 10,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  repeatButton: {
    position: 'relative',
  },
  repeatOneBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#1DB954',
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repeatOneText: {
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    marginLeft: -7,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  actionButton: {
    padding: 10,
  },
  noTrackText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    padding: 10,
  },
  downloadProgress: {
    fontSize: 12,
    color: '#1DB954',
  },
});

export default PlayerScreen;