import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LocalPhotosScreen from 'screens/LocalPhotosScreen';
import SinglePhotoScreen from 'screens/SinglePhotoScreen';
import { SQLiteProvider, useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import RootStackParamList from 'helpers/paramlists/rootstack';
import { DummyPhotoStore, LocalPhotoStore, PhotoStoreContext, Store } from 'helpers/contexts';
import MainTabsParamList from 'helpers/paramlists/maintabs';
import { IconButton, PaperProvider } from 'react-native-paper';

function MainTabs() {
  const Tabs = createBottomTabNavigator<MainTabsParamList>();

  return (
    <Tabs.Navigator screenOptions={{ headerShown: true, tabBarIconStyle: { display: 'none' } }}>
      <Tabs.Screen name="LocalPhotosScreen" component={LocalPhotosScreen} options={{ headerTitle: "Local Photos" }} />
    </Tabs.Navigator>
  );
}

function App() {
  const Stack = createNativeStackNavigator<RootStackParamList>();

  const initialStore: [Store, React.Dispatch<React.SetStateAction<Store>>] = React.useState(new DummyPhotoStore());

  return (
    <PaperProvider>
      <SQLiteProvider databaseName="local.db" onInit={migrateDbIfNeeded}>
        <PhotoStoreContext.Provider value={initialStore}>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
              <Stack.Screen name="SinglePhotoScreen" component={SinglePhotoScreen} />
            </Stack.Navigator>
          </NavigationContainer >
        </PhotoStoreContext.Provider>
      </SQLiteProvider>
    </PaperProvider>
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
CREATE TABLE Photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uri TEXT NOT NULL,
  date_taken TEXT NOT NULL
);

CREATE TABLE Albums (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE AlbumPhotos (
  photo_id INTEGER NOT NULL,
  album_id INTEGER NOT NULL,
  PRIMARY KEY (photo_id, album_id),
  FOREIGN KEY (photo_id) REFERENCES Photos(id) ON DELETE CASCADE,
  FOREIGN KEY (album_id) REFERENCES Albums(id) ON DELETE CASCADE
);

`);
    currentDbVersion = 1;
  }
  // if (currentDbVersion === 1) {
  //   Add more migrations
  // }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
