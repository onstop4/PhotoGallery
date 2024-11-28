import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Store, PhotoItem, PhotoStoreContext, useStoreContext, DummyPhotoStore } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import ParamList from "helpers/paramlists";
import { AlbumPhotoStore, LocalAlbumPhotoStore, OnlineAlbumPhotoStore, useAlbumStoreContext } from "helpers/albums";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "helpers/supabase";
import trySQLiteContext from "helpers/sqlite";

type AlbumPhotosScreenProps = NativeStackScreenProps<ParamList, "AlbumPhotosScreen">;

function areEqual(store1: AlbumPhotoStore, store2: AlbumPhotoStore) {
    const album1 = store1.album;
    const album2 = store2.album;
    return album1.id == album2.id && Boolean(album1.onlineStatus) == Boolean(album2.onlineStatus) && store1.photoItems == store2.photoItems;
}

function AlbumPhotosScreen({ navigation, route }: AlbumPhotosScreenProps) {
    const db = trySQLiteContext();
    const [store, setStore] = useStoreContext();
    const [albumStore, setAlbumStore] = useAlbumStoreContext();
    const [storeToCompare, setStoreToCompare] = useState<AlbumPhotoStore>();

    const [menuVisible, setMenuVisible] = useState(false);
    const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    const onIconPress = (e: any) => {
        const { nativeEvent } = e;
        setMenuAnchor({ x: nativeEvent.pageX, y: nativeEvent.pageY });
        // Ensures that the anchor location is set before the menu
        // is opened.
        setTimeout(() => openMenu());
    }

    useFocusEffect(() => {
        if (!(store instanceof AlbumPhotoStore && storeToCompare && areEqual(store, storeToCompare))) {
            (async () => {
                const album = route.params.album;
                navigation.setOptions({ title: album.name });
                let newStore = new DummyPhotoStore();
                if (album.onlineStatus) {
                    const { data, error } = await supabase.auth.getSession()
                    if (error)
                        console.log("Cannot get online album:", error.message);
                    else if (!data.session)
                        console.log("User is attempting to access online album when they are not signed in.");
                    else
                        newStore = await new OnlineAlbumPhotoStore(album, data.session).refresh();
                } else if (db)
                    newStore = await new LocalAlbumPhotoStore(album, db).refresh();

                setStore(newStore);
                setStoreToCompare(newStore as AlbumPhotoStore);
            })();
        }

        navigation.setOptions({
            headerRight: () => <IconButton
                icon="dots-vertical"
                size={30}
                onPressOut={onIconPress}
            />
        })
    })

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={menuAnchor}
                anchorPosition="bottom">
                <Menu.Item onPress={() => {
                    closeMenu();
                    setTimeout(() => navigation.navigate("SelectToAddPhotosScreen"))
                }} title="Add existing photos" />
                <Menu.Item onPress={() => {
                    closeMenu();
                    setTimeout(() => navigation.navigate("SelectToDeletePhotosScreen"));
                }} title="Remove photos" />
                <Menu.Item onPress={async () => {
                    closeMenu();
                    if (store instanceof AlbumPhotoStore) {
                        const album = store.album;
                        if (album.onlineStatus)
                            setAlbumStore(await albumStore.deleteOnlineAlbum(album));
                        else if (db)
                            setAlbumStore(await albumStore.deleteLocalAlbum(db, album));
                    }
                    setTimeout(() => navigation.goBack());
                }} title="Delete album" />
            </Menu>
            <PhotoGrid photoItems={store.photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
        </View>
    );
}

export default AlbumPhotosScreen;