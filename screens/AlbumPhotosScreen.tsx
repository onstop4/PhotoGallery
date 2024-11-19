import { Button, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Store, PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";
import ParamList from "helpers/paramlists";
import { AlbumPhotoStore, areAlbumsEqual, LocalAlbumPhotoStore, OnlineAlbumPhotoStore } from "helpers/albums";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "helpers/supabase";

type AlbumPhotosScreenProps = NativeStackScreenProps<ParamList, "AlbumPhotosScreen">;

function AlbumPhotosScreen({ navigation, route }: AlbumPhotosScreenProps) {
    const db = useSQLiteContext();
    const firstTime = useRef(true);
    const [store, setStore] = useStoreContext();
    const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
    const [selectionMade, setSelectionMade] = useState<PhotoItem[]>([]);

    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    const album = route.params.album;

    useFocusEffect(() => {
        (async () => {
            let currentStore = store;
            if (firstTime.current) {
                navigation.setOptions({ title: album.name })
                if (album.onlineStatus) {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session)
                        currentStore = new OnlineAlbumPhotoStore(album, session);
                    else {
                        console.log("User attempted to access online album even though they are not signed in.");
                        return;
                    }
                } else
                    currentStore = new LocalAlbumPhotoStore(album, db);

                setStore(currentStore);
                firstTime.current = false;
            }
            setPhotoItems(await currentStore.getAll());
        })()
    });

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
            <PhotoGrid photoItems={photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
        </View>
    );


}

export default AlbumPhotosScreen;