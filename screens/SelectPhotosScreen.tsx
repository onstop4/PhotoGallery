import { Button, StyleSheet, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext, useOnlineStoreContext, OnlinePhotoStore } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu, Text } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";
import ParamList from "helpers/paramlists";
import { useFocusEffect } from "@react-navigation/native";
import { AlbumPhotoStore, useAlbumStoreContext } from "helpers/albums";
import { supabase } from "helpers/supabase";

type SelectPhotosScreenProps = NativeStackScreenProps<ParamList, "SelectPhotosScreen">;

function SelectPhotosScreen({ navigation, route }: SelectPhotosScreenProps) {
    const db = useSQLiteContext();
    const [store, setStore] = useStoreContext();
    const [onlineStore, setOnlineStore] = useOnlineStoreContext();
    const [albumStore, setAlbumStore] = useAlbumStoreContext();
    const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
    const [selectedPhotoItems, setSelectedPhotoItems] = useState<PhotoItem[]>([]);
    const [buttonDisabled, setButtonDisabled] = useState(false);

    useFocusEffect(useCallback(() => {
        (async () => {
            if (store instanceof AlbumPhotoStore && store.album.onlineStatus)
                setPhotoItems(onlineStore.photoItems);
            else
                setPhotoItems((await new LocalPhotoStore(db).refresh()).photoItems);
        })();
    }, []));

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button title="Done" onPress={() => {
                setButtonDisabled(true);
                (async () => {
                    const newStore = await store.addNewPhotos(selectedPhotoItems);
                    setStore(newStore);
                    if (store instanceof OnlinePhotoStore)
                        setOnlineStore(newStore as OnlinePhotoStore);

                    if (store instanceof AlbumPhotoStore && store.album.onlineStatus) {
                        const { data, error } = await supabase.auth.getSession()
                        if (error)
                            console.log("Cannot modify online album:", error.message);
                        else if (!data.session)
                            console.log("User is modify to access online album when they are not signed in.");
                        else
                            setAlbumStore(await albumStore.refreshOnline(data.session));
                    } else if (store instanceof AlbumPhotoStore)
                        setAlbumStore(await albumStore.refreshLocal(db));

                    navigation.goBack();
                })()
            }} disabled={buttonDisabled} />
            <PhotoGrid photoItems={photoItems}
                action={(photoItem: PhotoItem) => setSelectedPhotoItems([...selectedPhotoItems, photoItem])}
                deselectAction={(photoItem: PhotoItem) => setSelectedPhotoItems(selectedPhotoItems.filter((otherPhotoItem: PhotoItem) => photoItem.id != otherPhotoItem.id))} />
        </View>
    );
}

export default SelectPhotosScreen;