import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useMusicStore, usePlayerStore, useDownloadStore, useAuthStore} from '../store';
import type {Track} from '../types';
import TrackRow from '../components/TrackRow';
import MiniPlayer from '../components/MiniPlayer';

const CATEGORIES = [
  {id: '1', name: 'Pop', color: '#8D67AB', icon: 'musical-notes'},
  {id: '2', name: 'Hip-Hop', color: '#BA5D07', icon: 'mic'},
  {id: '3', name: 'Rock', color: '#E61E32', icon: 'guitar'},
  {id: '4', name: 'Électro', color: '#1E3264', icon: 'radio'},
  {id: '5', name: 'R&B', color: '#477D95', icon: 'headset'},
  {id: '6', name: 'Jazz', color: '#608108', icon: 'saxophone-outline'},
  {id: '7', name: 'Classique', color: '#7D6B91', icon: 'piano-outline'},
  {id: '8', name: 'Podcasts', color: '#006450', icon: 'mic-outline'},
];

const SearchScreen = () => {
  const {isGuest} = useAuthStore();
  const {searchTracks, searchResults, isSearching} = useMusicStore();
  const {queueAndPlay, currentTrack, miniPlayerVisible} = usePlayerStore();
  const {downloadTrack, isDownloaded, downloading} = useDownloadStore();
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Nettoyage du timer quand le composant est démonté
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [debounceTimer]);

  const handleSearch = (text: string) => {
    setQuery(text);

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(async () => {
      if (text.trim().length > 0) {
        await searchTracks(text.trim());
        setHasSearched(true);
      } else {
        setHasSearched(false);
      }
    }, 500);

    setDebounceTimer(timer);
  };

  const handlePlayTrack = (track: Track, index: number) => {
    queueAndPlay(searchResults, index);
  };

  const handleDownload = async (track: Track) => {
    await downloadTrack(track);
  };

  const clearSearch = () => {
    setQuery('');
    setHasSearched(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Artistes, titres ou podcasts"
            placeholderTextColor="#888"
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      )}

      {/* Résultats */}
      {!isSearching && hasSearched && (
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>
            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
          </Text>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: miniPlayerVisible ? 140 : 80}}
            renderItem={({item, index}) => (
              <TrackRow
                track={item}
                index={index + 1}
                onPress={() => handlePlayTrack(item, index)}
                onDownload={isGuest ? undefined : () => handleDownload(item)}
                isDownloaded={isDownloaded(item.id)}
                downloadProgress={downloading[item.id] || 0}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon name="search-outline" size={60} color="#888" />
                <Text style={styles.emptyText}>Aucun résultat trouvé</Text>
                <Text style={styles.emptySubtext}>
                  Essayez avec un autre terme de recherche
                </Text>
              </View>
            }
          />
        </View>
      )}

      {/* Catégories par défaut */}
      {!isSearching && !hasSearched && (
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesGrid}
          renderItem={({item}) => (
            <TouchableOpacity style={[styles.categoryCard, {backgroundColor: item.color}]}>
              <Text style={styles.categoryName}>{item.name}</Text>
              <Icon name={item.icon} size={40} color="rgba(255,255,255,0.7)" style={styles.categoryIcon} />
            </TouchableOpacity>
          )}
        />
      )}

      {currentTrack && <MiniPlayer />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#121212'},
  searchContainer: {paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16},
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {marginRight: 10},
  searchInput: {flex: 1, color: '#fff', fontSize: 16, height: '100%'},
  clearButton: {padding: 5},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  resultsContainer: {flex: 1, paddingHorizontal: 16},
  resultsTitle: {fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12},
  categoriesGrid: {paddingHorizontal: 8, paddingVertical: 8},
  categoryCard: {
    flex: 1,
    margin: 6,
    height: 120,
    borderRadius: 8,
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  categoryName: {color: '#fff', fontSize: 20, fontWeight: 'bold'},
  categoryIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    transform: [{rotate: '25deg'}],
  },
  emptyContainer: {alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 16},
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SearchScreen;