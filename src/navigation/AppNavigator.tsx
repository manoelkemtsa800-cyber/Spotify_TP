import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import {useAuthStore} from '../store';
import type {RootStackParamList, MainTabParamList} from '../types';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import LibraryScreen from '../screens/LibraryScreen';
import LikedScreen from '../screens/LikedScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PlaylistDetailScreen from '../screens/PlaylistDetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ==================== AUTH STACK ====================
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: '#121212'},
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// ==================== MAIN TABS ====================
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#282828',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#888888',
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600'},
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;
          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Search':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'Library':
              iconName = focused ? 'library' : 'library-outline';
              break;
            case 'Liked':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'Downloads':
              iconName = focused ? 'download' : 'download-outline';
              break;
            default:
              iconName = 'help-outline';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{title: 'Accueil'}} />
      <Tab.Screen name="Search" component={SearchScreen} options={{title: 'Rechercher'}} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{title: 'Bibliothèque'}} />
      <Tab.Screen name="Liked" component={LikedScreen} options={{title: 'Favoris'}} />
      <Tab.Screen name="Downloads" component={DownloadsScreen} options={{title: 'Téléchargements'}} />
    </Tab.Navigator>
  );
}

// ==================== ROOT NAVIGATOR ====================
function AppNavigator() {
  const {user, initialized} = useAuthStore();

  if (!initialized) {
    return null; // ou un splash screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: '#121212'},
        }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Player"
              component={PlayerScreen}
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal',
              }}
            />
            <Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;