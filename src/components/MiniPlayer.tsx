import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {usePlayerStore} from '../store';

type MiniPlayerNavProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;

const MiniPlayer = () => {
  const navigation = useNavigation<MiniPlayerNavProp>();
  const {
    currentTrack,
    currentQueue,
    currentTrackIndex,
    isPlaying,
    currentPosition,
    currentDuration,
    togglePlay,
    skipToNext,
    miniPlayerVisible,
  } = usePlayerStore();

  if (!currentTrack || !miniPlayerVisible) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openPlayer = () => {
    navigation.navigate('Player', {trackId: currentTrack.id});
  };

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      {currentDuration > 0 && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {width: `${(currentPosition / currentDuration) * 100}%`},
            ]}
          />
        </View>
      )}

      <TouchableOpacity style={styles.content} onPress={openPlayer} activeOpacity={0.9}>
        <Image
          source={{
            uri: currentTrack.album_cover_url || 'https://via.placeholder.com/40/282828/FFFFFF?text=♪',
          }}
          style={styles.cover}
        />
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <Text style={styles.artist} numberOfLines={1}>
            {currentTrack.artist}
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={skipToNext}>
            <Icon name="play-skip-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={togglePlay}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={skipToNext}>
            <Icon name="play-skip-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#282828',
    borderTopWidth: 1,
    borderTopColor: '#333',
    zIndex: 10,
  },
  progressBar: {
    height: 2,
    backgroundColor: '#333',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cover: {
    width: 40,
    height: 40,
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    color: '#888',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 4,
  },
});

export default MiniPlayer;