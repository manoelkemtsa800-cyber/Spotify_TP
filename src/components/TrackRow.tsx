import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import type {Track} from '../types';

interface TrackRowProps {
  track: Track;
  index: number;
  onPress: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  onDownload?: () => void;
  isDownloaded?: boolean;
  downloadProgress?: number;
}

const TrackRow: React.FC<TrackRowProps> = ({
  track,
  index,
  onPress,
  onLike,
  isLiked,
  onDownload,
  isDownloaded,
  downloadProgress = 0,
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {/* Cover / Numéro */}
      <View style={styles.coverContainer}>
        <Image
          source={{uri: track.album_cover_url || 'https://via.placeholder.com/50/282828/FFFFFF?text=♪'}}
          style={styles.cover}
        />
        <Text style={styles.index}>{index}</Text>
      </View>

      {/* Infos */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist} — {track.album}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {/* Download */}
        {onDownload && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDownload();
            }}>
            {downloadProgress > 0 && downloadProgress < 100 ? (
              <View style={styles.progressCircle}>
                <Text style={styles.progressText}>{downloadProgress}%</Text>
              </View>
            ) : isDownloaded ? (
              <Icon name="checkmark-circle" size={20} color="#1DB954" />
            ) : (
              <Icon name="download-outline" size={20} color="#888" />
            )}
          </TouchableOpacity>
        )}

        {/* Like */}
        {onLike && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onLike();
            }}>
            <Icon
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#1DB954' : '#888'}
            />
          </TouchableOpacity>
        )}

        {/* Duration */}
        <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  coverContainer: {
    position: 'relative',
    marginRight: 12,
  },
  cover: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  index: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 2,
    color: '#fff',
    fontSize: 10,
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 2,
  },
  artist: {
    fontSize: 13,
    color: '#888',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  progressCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 8,
    color: '#fff',
  },
  duration: {
    fontSize: 13,
    color: '#888',
    minWidth: 35,
    textAlign: 'right',
  },
});

export default TrackRow;