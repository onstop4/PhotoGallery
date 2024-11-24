import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LocalPhotosScreen from 'screens/LocalPhotosScreen';
import SinglePhotoScreen from 'screens/SinglePhotoScreen';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { DummyPhotoStore, OnlinePhotoStore, OnlinePhotoStoreContext, PhotoStoreContext, Store } from 'helpers/contexts';
import { IconButton, PaperProvider } from 'react-native-paper';
import ParamList from 'helpers/paramlists';
import { AlbumStore, AlbumStoreContext } from 'helpers/albums';
import AlbumsScreen from 'screens/AlbumsScreen';
import AlbumPhotosScreen from 'screens/AlbumPhotosScreen';
import SettingsScreen from 'screens/SettingsScreen';
import SelectPhotosScreen from 'screens/SelectPhotosScreen';
import OnlinePhotosScreen from 'screens/OnlinePhotosScreen';
import CameraScreen from 'screens/CameraScreen';
import { supabase } from 'helpers/supabase';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function MainTabs() {
  const Tabs = createBottomTabNavigator<ParamList>();
  const [session, setSession] = React.useState<Session | null>(null);

  const isMobile = Platform.OS == "android" || Platform.OS == "ios";

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
    <Tabs.Navigator screenOptions={{ headerShown: true, tabBarIconStyle: { display: 'none' } }}>
      {isMobile && <Tabs.Screen name="LocalPhotosScreen" component={LocalPhotosScreen} options={{ headerTitle: "Local Photos" }} />}
      {session && <Tabs.Screen name="OnlinePhotosScreen" component={OnlinePhotosScreen} options={{ headerTitle: "Online photos" }} />}
      {(isMobile || session) && <Tabs.Screen name="AlbumsScreen" component={AlbumsScreen} options={{ headerTitle: "All albums" }} />}
      <Tabs.Screen name="SettingsScreen" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

function App() {
  const Stack = createNativeStackNavigator<ParamList>();

  const initialStore: [Store, React.Dispatch<React.SetStateAction<Store>>] = React.useState(new DummyPhotoStore());
  const albumStore = React.useState(new AlbumStore());
  const onlineStore = React.useState(new OnlinePhotoStore(null));

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      new OnlinePhotoStore(session).refresh().then(store => onlineStore[1](store as OnlinePhotoStore));
    }
    )

    supabase.auth.onAuthStateChange((_event, session) => {
      new OnlinePhotoStore(session).refresh().then(store => onlineStore[1](store as OnlinePhotoStore));
    })
  }, [])

  return (
    <GestureHandlerRootView>
      <PaperProvider>
        <SQLiteProvider databaseName="local.db" onInit={migrateDbIfNeeded}>
          <AlbumStoreContext.Provider value={albumStore}>
            <OnlinePhotoStoreContext.Provider value={onlineStore}>
              <PhotoStoreContext.Provider value={initialStore}>
                <NavigationContainer>
                  <Stack.Navigator>
                    <Stack.Group>
                      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
                      <Stack.Screen name="SinglePhotoScreen" component={SinglePhotoScreen} />
                      <Stack.Screen name="AlbumPhotosScreen" component={AlbumPhotosScreen} />
                    </Stack.Group>
                    <Stack.Group screenOptions={{ presentation: "modal" }}>
                      <Stack.Screen name="SelectPhotosScreen" component={SelectPhotosScreen} />
                      <Stack.Screen name="CameraScreen" component={CameraScreen} />
                    </Stack.Group>
                  </Stack.Navigator>
                </NavigationContainer>
              </PhotoStoreContext.Provider>
            </OnlinePhotoStoreContext.Provider>
          </AlbumStoreContext.Provider>
        </SQLiteProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
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
