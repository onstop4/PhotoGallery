import * as React from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LocalPhotosScreen from 'screens/LocalPhotosScreen';
import SinglePhotoScreen from 'screens/SinglePhotoScreen';
import { type SQLiteDatabase } from 'expo-sqlite';
import { DummyPhotoStore, PhotoStoreContext, Store } from 'helpers/contexts';
import { PaperProvider } from 'react-native-paper';
import ParamList from 'helpers/paramlists';
import { AlbumStore, AlbumStoreContext } from 'helpers/albums';
import AlbumsScreen from 'screens/AlbumsScreen';
import AlbumPhotosScreen from 'screens/AlbumPhotosScreen';
import SettingsScreen from 'screens/SettingsScreen';
import SelectToAddPhotosScreen from 'screens/SelectToAddPhotosScreen';
import OnlinePhotosScreen from 'screens/OnlinePhotosScreen';
import CameraScreen from 'screens/CameraScreen';
import { supabase } from 'helpers/supabase';
import { Session } from '@supabase/supabase-js';
import SelectToDeletePhotosScreen from 'screens/SelectToDeletePhotosScreen';
import isMobile from 'helpers/isMobile';
import PublicAlbumInputScreen from 'screens/PublicAlbumInputScreen';
import PublicAlbumPhotosScreen from 'screens/PublicAlbumPhotosScreen';
import { useColorScheme } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

function MainTabs() {
  const Tabs = createBottomTabNavigator<ParamList>();
  const [session, setSession] = React.useState<Session | null>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    }
    )

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })
  }, [])

  return (
    <Tabs.Navigator screenOptions={{ headerShown: true }}>
      {isMobile && <Tabs.Screen name="LocalPhotosScreen" component={LocalPhotosScreen} options={{ headerTitle: "Local photos", tabBarLabel: "Local photos", tabBarIcon: ({ size, color }) => <MaterialCommunityIcons name="file-image" size={size} color={color} /> }} />}
      {session && <Tabs.Screen name="OnlinePhotosScreen" component={OnlinePhotosScreen} options={{ headerTitle: "Online photos", tabBarLabel: "Online photos", tabBarIcon: ({ size, color }) => <FontAwesome name="image" size={size} color={color} /> }} />}
      {(isMobile || session) && <Tabs.Screen name="AlbumsScreen" component={AlbumsScreen} options={{ headerTitle: "Your albums", tabBarLabel: "Your albums", tabBarIcon: ({ size, color }) => <Ionicons name="albums-sharp" size={size} color={color} /> }} />}
      {session && <Tabs.Screen name="PublicAlbumInputScreen" component={PublicAlbumInputScreen} options={{ headerTitle: "Access a public album", tabBarLabel: "Public albums", tabBarIcon: ({ size, color }) => <MaterialIcons name="public" size={size} color={color} /> }} />}
      <Tabs.Screen name="SettingsScreen" component={SettingsScreen} options={{ headerTitle: "Settings", tabBarLabel: "Settings", tabBarIcon: ({ size, color }) => <Fontisto name="player-settings" size={size} color={color} /> }} />
    </Tabs.Navigator>
  );
}

function App() {
  const Stack = createNativeStackNavigator<ParamList>();

  const initialStore: [Store, React.Dispatch<React.SetStateAction<Store>>] = React.useState(new DummyPhotoStore());
  const albumStore = React.useState(new AlbumStore());

  const colorScheme = useColorScheme();

  const common = <AlbumStoreContext.Provider value={albumStore}>
    <PhotoStoreContext.Provider value={initialStore}>
      <NavigationContainer theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack.Navigator>
          <Stack.Group>
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="SinglePhotoScreen" component={SinglePhotoScreen} options={{ headerTitle: "" }} />
            <Stack.Screen name="AlbumPhotosScreen" component={AlbumPhotosScreen} options={{ headerTitle: "" }} />
            <Stack.Screen name="PublicAlbumPhotosScreen" component={PublicAlbumPhotosScreen} options={{ headerTitle: "" }} />
          </Stack.Group>
          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen name="SelectToAddPhotosScreen" component={SelectToAddPhotosScreen} options={{ headerTitle: "Select photos to add" }} />
            <Stack.Screen name="SelectToDeletePhotosScreen" component={SelectToDeletePhotosScreen} options={{ headerTitle: "Select photos to delete" }} />
            <Stack.Screen name="CameraScreen" component={CameraScreen} options={{ headerTitle: "Camera" }} />
          </Stack.Group>
        </Stack.Navigator>
      </NavigationContainer>
    </PhotoStoreContext.Provider>
  </AlbumStoreContext.Provider>;

  if (isMobile) {
    const { SQLiteProvider } = require('expo-sqlite');

    return <PaperProvider>
      <SQLiteProvider databaseName="local.db" onInit={migrateDbIfNeeded}>
        {common}
      </SQLiteProvider>
    </PaperProvider>
  }

  return <PaperProvider>
    {common}
  </PaperProvider>
}

export default App;

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let currentDbVersion = (await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  ))?.user_version || 0;
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }
  if (currentDbVersion === 0) {
    await db.execAsync(`
PRAGMA journal_mode = 'wal';
CREATE TABLE Photo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uri TEXT NOT NULL,
  date_taken TEXT NOT NULL
);

CREATE TABLE Album (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE AlbumPhoto (
  photo_id INTEGER NOT NULL,
  album_id INTEGER NOT NULL,
  PRIMARY KEY (photo_id, album_id),
  FOREIGN KEY (photo_id) REFERENCES Photo(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE CASCADE
);

`);
    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
