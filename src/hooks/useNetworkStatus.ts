import {useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Hook qui retourne l'état de connexion réseau en temps réel.
 * isOffline = true quand l'appareil n'a pas de connexion internet utilisable.
 */
export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
    });

    // Vérification initiale
    NetInfo.fetch().then(state => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);
    });

    return () => unsubscribe();
  }, []);

  return {isOffline};
}
