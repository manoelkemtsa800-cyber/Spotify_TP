import React, {useEffect} from 'react';
import {StyleSheet, View, ActivityIndicator, Text} from 'react-native';
import 'react-native-gesture-handler';
import TrackPlayer from 'react-native-track-player';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useAuthStore} from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import OfflineBanner from './src/components/OfflineBanner';

// Service de playback en arrière-plan
TrackPlayer.registerPlaybackService(() => require('./src/services/playerService').playbackService);

const App = () => {
  const {initialize, loading, initialized} = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
        // Setup TrackPlayer
        await TrackPlayer.setupPlayer();
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior:
              TrackPlayer.AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
          },
          capabilities: [
            TrackPlayer.Capability.Play,
            TrackPlayer.Capability.Pause,
            TrackPlayer.Capability.SkipToNext,
            TrackPlayer.Capability.SkipToPrevious,
            TrackPlayer.Capability.Stop,
            TrackPlayer.Capability.SeekTo,
          ],
          compactCapabilities: [
            TrackPlayer.Capability.Play,
            TrackPlayer.Capability.Pause,
            TrackPlayer.Capability.SkipToNext,
          ],
          progressUpdateEventInterval: 1,
        });
      } catch (error) {
        console.error('❌ Erreur init:', error);
      }
    };
    init();
  }, []);

  if (!initialized || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1DB954" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <OfflineBanner />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 16,
  },
});

export default App;