# ============================================================
# GUIDE D'INSTALLATION - SPOTIFY CLONE
# ============================================================

## 📋 Prérequis

- Node.js >= 18
- npm ou yarn
- Android Studio (pour le SDK Android)
- Un projet Supabase (gratuit sur https://supabase.com)
- Git

## 🚀 Installation rapide

### 1. Cloner le projet
```bash
cd spotify-clone
```

### 2. Installer les dépendances
```bash
npm install
# ou
yarn install
```

### 3. Configurer Supabase

1. Crée un projet sur https://supabase.com
2. Va dans **SQL Editor** et exécute le fichier `supabase/migrations/001_initial_schema.sql`
3. Va dans **Storage** et crée deux buckets :
   - `audio-files` (privé) — pour les fichiers MP3
   - `album-covers` (public) — pour les pochettes d'album
4. Ouvre `src/services/supabase.ts` et remplace :
   ```ts
   export const SUPABASE_URL = 'https://TON_PROJET.supabase.co';
   export const SUPABASE_ANON_KEY = 'TA_CLE_ANON';
   ```

### 4. Ajouter de la musique

Dans le dashboard Supabase > Storage > `audio-files` :
- Crée un dossier `musiques/`
- Upload tes fichiers MP3
- Dans la table `tracks`, ajoute des entrées :
  ```sql
  INSERT INTO tracks (title, artist, album, audio_url, duration)
  VALUES ('Mon Titre', 'Mon Artiste', 'Mon Album', 'musiques/mon-titre.mp3', 180);
  ```

### 5. Lancer l'app

```bash
# Terminal 1 - Metro Bundler
npm start

# Terminal 2 - Build Android
npm run android
```

## 📁 Structure du projet

```
spotify-clone/
├── android/              # Projet Android natif
├── src/
│   ├── types/           # Types TypeScript
│   ├── services/        # Supabase, Auth, Player, Download
│   ├── store/           # Zustand stores
│   ├── navigation/      # React Navigation
│   ├── screens/         # Écrans (Login, Home, Player...)
│   └── components/      # Composants réutilisables
├── supabase/
│   └── migrations/      # Schéma DB SQL
├── package.json
├── tsconfig.json
├── App.tsx
└── index.js
```

## 🔧 Commandes utiles

```bash
npm start              # Metro Bundler
npm run android        # Build & run Android
npm run lint           # ESLint
npm test               # Tests Jest
cd android && ./gradlew clean  # Nettoyer le build
```

## 📱 Permissions Android

- `INTERNET` — Accès réseau
- `ACCESS_NETWORK_STATE` — Détection connexion (mode offline)
- `FOREGROUND_SERVICE` — Notification lecteur
- `WAKE_LOCK` — Empêche le mode veille
- `POST_NOTIFICATIONS` — Notifications Android 13+

## 🐛 Dépannage

### Erreur de build Android
```bash
cd android && ./gradlew clean && cd ..
npm start -- --reset-cache
npm run android
```

### Erreur Supabase
Vérifie que :
1. Les buckets Storage existent
2. Les policies RLS sont activées
3. Les credentials sont corrects dans `src/services/supabase.ts`

### Player ne fonctionne pas
```bash
# Rebuild les modules natifs
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## 📝 Notes

- Le mode offline télécharge les fichiers MP3 localement
- Les covers d'album sont optionnelles
- La base de données est gérée par Supabase (PostgreSQL)
- L'authentification utilise Supabase Auth