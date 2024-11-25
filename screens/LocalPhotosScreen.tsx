import { Button, StyleSheet, Text, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";
import ParamList from "helpers/paramlists";
import { useFocusEffect } from "@react-navigation/native";

type LocalPhotosScreenProps = NativeStackScreenProps<ParamList, "LocalPhotosScreen">;

function LocalPhotosScreen({ navigation }: LocalPhotosScreenProps) {
    const db = useSQLiteContext();
    const [store, setStore] = useStoreContext();

    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    useFocusEffect(() => {
        if (!(store instanceof LocalPhotoStore))
            new LocalPhotoStore(db).refresh().then(store => setStore(store));
    });

    useFocusEffect(() =>
        navigation.setOptions({
            headerRight: () =>
                <Menu
                    visible={menuVisible}
                    onDismiss={closeMenu}
                    anchor={<IconButton
                        icon="dots-vertical"
                        size={30}
                        onPress={openMenu}
                    />}
                    anchorPosition="bottom">
                    <Menu.Item onPress={async () => {
                        closeMenu();
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            aspect: [4, 3],
                            quality: 1,
                            allowsMultipleSelection: true
                        });

                        if (!result.canceled) {
                            const date = new Date();
                            try {
                                await store.addNewPhotos(result.assets.map(asset => ({ originUri: asset.uri, dateTaken: date })));
                                setStore(await store.refresh());
                            } catch (e) {
                                console.log("Couldn't add photos: ", e);
                            }
                        }
                    }} title="Add existing photos" />
                    <Menu.Item onPress={() => {
                        closeMenu();
                        // Ensures that menu is closed before navigating
                        // to prevent it from getting stuck on the screen.
                        setTimeout(() => navigation.navigate("CameraScreen"));
                    }} title="Take photo" />
                </Menu>
        }))

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <PhotoGrid photoItems={store.photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
        </View>
    );
}

export default LocalPhotosScreen;