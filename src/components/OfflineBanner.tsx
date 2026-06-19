import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNetworkStatus} from '../hooks/useNetworkStatus';

/**
 * Bandeau discret affiché en haut de l'écran quand l'appareil est hors ligne.
 * Purement indicatif : ne modifie aucun comportement de l'app.
 */
const OfflineBanner = () => {
  const {isOffline} = useNetworkStatus();
  const slideAnim = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -40,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline]);

  return (
    <Animated.View
      style={[styles.banner, {transform: [{translateY: slideAnim}]}]}
      pointerEvents="none">
      <Icon name="cloud-offline" size={14} color="#fff" />
      <Text style={styles.text}>Hors ligne</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#B3541E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    zIndex: 999,
  },
  text: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default OfflineBanner;
