import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Store, PhotoItem, PhotoStoreContext, useStoreContext, DummyPhotoStore } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";
import ParamList from "helpers/paramlists";
import { AlbumPhotoStore, LocalAlbumPhotoStore, OnlineAlbumPhotoStore } from "helpers/albums";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "helpers/supabase";

type AlbumPhotosScreenProps = NativeStackScreenProps<ParamList, "AlbumPhotosScreen">;

function areEqual(store1: AlbumPhotoStore, store2: AlbumPhotoStore) {
    const album1 = store1.album;
    const album2 = store2.album;
    return album1.id == album2.id && Boolean(album1.onlineStatus) == Boolean(album2.onlineStatus) && store1.photoItems == store2.photoItems;
}

function AlbumPhotosScreen({ navigation, route }: AlbumPhotosScreenProps) {
    const db = useSQLiteContext();
    const [store, setStore] = useStoreContext();
    const [storeToCompare, setStoreToCompare] = useState<AlbumPhotoStore>();

    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    useFocusEffect(() => {
        if (!(store instanceof AlbumPhotoStore && storeToCompare && areEqual(store, storeToCompare))) {
            (async () => {
                const album = route.params.album;
                navigation.setOptions({ title: album.name });
                if (album.onlineStatus) {
                    const { data, error } = await supabase.auth.getSession()
                    if (error) {
                        console.log("Cannot get online album:", error.message);
                        setStore(new DummyPhotoStore());
                    } else if (!data.session) {
                        console.log("User is attempting to access online album when they are not signed in.");
                        setStore(new DummyPhotoStore());
                    } else {
                        const newStore = await new OnlineAlbumPhotoStore(album, data.session).refresh();
                        setStore(newStore);
                        setStoreToCompare(newStore as AlbumPhotoStore);
                    }
                } else
                    setStore(await new LocalAlbumPhotoStore(album, db).refresh());
            })();
        }
    })

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {/* <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={<IconButton
                    icon="dots-vertical"
                    size={30}
                    onPress={openMenu}
                />}
                anchorPosition="bottom">
                <Menu.Item onPress={() => {
                    navigation.navigate("AddToAlbumModalScreen",
                        {
                            action: (photoItems: PhotoItem[]) => {
                                (async () => {
                                    await resetStore();
                                    await store.addNewPhotos(db, photoItems);
                                    setPhotoItems(await store.getAll(db));
                                })();
                            }
                        })
                }} title="Add existing photos" />
            </Menu> */}
            <Button title="Add existing photos" onPress={() => navigation.navigate("SelectPhotosScreen")} />
            <PhotoGrid photoItems={store.photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
        </View>
    );


}

export default AlbumPhotosScreen;