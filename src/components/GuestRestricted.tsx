import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {useAuthStore} from '../store';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
  icon: string;
  message: string;
}

/**
 * Affiché à la place du contenu réel quand un invité visite un écran
 * réservé aux utilisateurs connectés (Favoris, Téléchargements, Playlists).
 */
const GuestRestricted = ({icon, message}: Props) => {
  const navigation = useNavigation<NavProp>();
  const {signOut} = useAuthStore();

  const handleCreateAccount = async () => {
    await signOut(); // remet isGuest à false, renvoie vers Login
  };

  return (
    <View style={styles.container}>
      <Icon name={icon} size={60} color="#888" />
      <Text style={styles.title}>Fonctionnalité réservée</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={handleCreateAccount}>
        <Text style={styles.buttonText}>Créer un compte / Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  message: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#1DB954',
    borderRadius: 25,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 24,
  },
  buttonText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
});

export default GuestRestricted;
