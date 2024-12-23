import { Button, StyleSheet, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext, OnlinePhotoStore } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu, Text } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import ParamList from "helpers/paramlists";
import { useFocusEffect } from "@react-navigation/native";
import { AlbumPhotoStore, useAlbumStoreContext } from "helpers/albums";
import { supabase } from "helpers/supabase";
import trySQLiteContext from "helpers/sqlite";

type SelectToDeletePhotosScreenProps = NativeStackScreenProps<ParamList, "SelectToDeletePhotosScreen">;

function SelectToDeletePhotosScreen({ navigation, route }: SelectToDeletePhotosScreenProps) {
    const db = trySQLiteContext();
    const [store, setStore] = useStoreContext();
    const [albumStore, setAlbumStore] = useAlbumStoreContext();
    const [selectedPhotoItems, setSelectedPhotoItems] = useState<PhotoItem[]>([]);
    const [buttonDisabled, setButtonDisabled] = useState(false);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
            <Button title="Done" onPress={() => {
                setButtonDisabled(true);
                (async () => {
                    const newStore = await store.deletePhotos(selectedPhotoItems);
                    setStore(newStore);

                    if (store instanceof AlbumPhotoStore && store.album.onlineStatus) {
                        const { data, error } = await supabase.auth.getSession()
                        if (error)
                            console.log("Cannot modify online album:", error.message);
                        else if (!data.session)
                            console.log("User is modify to access online album when they are not signed in.");
                        else
                            setAlbumStore(await albumStore.refreshOnline());
                    } else if (store instanceof AlbumPhotoStore && db)
                        setAlbumStore(await albumStore.refreshLocal(db));

                    navigation.goBack();
                })()
            }} disabled={buttonDisabled} />
            <PhotoGrid photoItems={store.photoItems}
                action={(photoItem: PhotoItem) => setSelectedPhotoItems([...selectedPhotoItems, photoItem])}
                deselectAction={(photoItem: PhotoItem) => setSelectedPhotoItems(selectedPhotoItems.filter((otherPhotoItem: PhotoItem) => photoItem.id != otherPhotoItem.id))} />
        </View>
    );
}

export default SelectToDeletePhotosScreen;