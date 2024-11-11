import * as React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PhotoGrid from './components/PhotoGrid';

function LocalPhotosScreen() {
  let photoItems = [
    {
      id: '1',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/800px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg',
      dateTaken: new Date()
    },
    {
      id: '2',
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Blueberries.jpg',
      dateTaken: new Date()
    },
    {
      id: '3',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/800px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg',
      dateTaken: new Date()
    },
    {
      id: '4',
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Blueberries.jpg',
      dateTaken: new Date()
    }, {
      id: '5',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/800px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg',
      dateTaken: new Date()
    },
    {
      id: '6',
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Blueberries.jpg',
      dateTaken: new Date()
    }, {
      id: '7',
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg/800px-Orange_tabby_cat_sitting_on_fallen_leaves-Hisashi-01A.jpg',
      dateTaken: new Date()
    },
    {
      id: '8',
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Blueberries.jpg',
      dateTaken: new Date()
    }, {
      id: '9',
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/15/Blueberries.jpg',
      dateTaken: new Date()
    }
  ];

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <PhotoGrid photoItems={photoItems}></PhotoGrid>
    </View>
  );
}

function MainTabs() {
  const Tabs = createBottomTabNavigator();

  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Local Photos" component={LocalPhotosScreen} />
    </Tabs.Navigator>
  );
}

function App() {
  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer >
  );
}

export default App;