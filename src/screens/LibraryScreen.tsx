import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../types';
import {useAuthStore, useMusicStore} from '../store';
import MiniPlayer from '../components/MiniPlayer';
import type {Playlist} from '../types';

type LibraryNavProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const LibraryScreen = () => {
  const navigation = useNavigation<LibraryNavProp>();
  const {user} = useAuthStore();
  const {
    playlists,
    playlistsLoading,
    fetchUserPlaylists,
    createPlaylist,
    deletePlaylist,
  } = useMusicStore();

  const [createModalVisible, setCreateModalVisible] = React.useState(false);
  const [newPlaylistName, setNewPlaylistName] = React.useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = React.useState('');

  useEffect(() => {
    if (user) {
      fetchUserPlaylists(user.id);
    }
  }, [user]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la playlist');
      return;
    }
    if (user) {
      await createPlaylist(user.id, newPlaylistName.trim(), newPlaylistDescription.trim());
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setCreateModalVisible(false);
      fetchUserPlaylists(user.id);
    }
  };

  const handleDeletePlaylist = (playlist: Playlist) => {
    Alert.alert(
      'Supprimer la playlist',
      `Êtes-vous sûr de vouloir supprimer "${playlist.name}" ?`,
      [
        {text: 'Annuler', style: 'cancel'},
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlist.id);
            if (user) fetchUserPlaylists(user.id);
          },
        },
      ],
    );
  };

  const renderPlaylistItem = ({item}: {item: Playlist}) => (
    <TouchableOpacity
      style={styles.playlistItem}
      onPress={() => navigation.navigate('PlaylistDetail', {playlistId: item.id})}
      onLongPress={() => handleDeletePlaylist(item)}>
      <View style={styles.playlistIcon}>
        <Icon name="list" size={24} color="#1DB954" />
      </View>
      <View style={styles.playlistInfo}>
        <Text style={styles.playlistName}>{item.name}</Text>
        <Text style={styles.playlistDescription} numberOfLines={1}>
          {item.description || 'Playlist'}
        </Text>
      </View>
      <Icon name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Bibliothèque</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setCreateModalVisible(true)}>
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Contenu */}
      {playlistsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={renderPlaylistItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="list-outline" size={60} color="#888" />
              <Text style={styles.emptyText}>Aucune playlist</Text>
              <Text style={styles.emptySubtext}>
                Créez votre première playlist en appuyant sur le bouton +
              </Text>
            </View>
          }
          contentContainerStyle={{paddingBottom: 80}}
        />
      )}

      {/* Modal de création */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nom de la playlist"
              placeholderTextColor="#888"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, styles.descriptionInput]}
              placeholder="Description (optionnel)"
              placeholderTextColor="#888"
              value={newPlaylistDescription}
              onChangeText={setNewPlaylistDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreatePlaylist}>
                <Text style={styles.createButtonText}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {fontSize: 28, fontWeight: 'bold', color: '#fff'},
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1DB954',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282828',
  },
  playlistIcon: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#282828',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playlistInfo: {flex: 1},
  playlistName: {fontSize: 16, fontWeight: '600', color: '#fff'},
  playlistDescription: {fontSize: 13, color: '#888', marginTop: 2},
  emptyContainer: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 16},
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#282828',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#121212',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  descriptionInput: {height: 80, textAlignVertical: 'top'},
  modalButtons: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 20},
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {backgroundColor: '#333'},
  cancelButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  createButton: {backgroundColor: '#1DB954'},
  createButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
});

export default LibraryScreen;