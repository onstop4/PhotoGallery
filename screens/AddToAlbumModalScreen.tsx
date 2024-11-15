import { Button, StyleSheet, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu, Text } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";
import ParamList from "helpers/paramlists";
import { useFocusEffect } from "@react-navigation/native";

type AddToAlbumModalScreenProps = NativeStackScreenProps<ParamList, "AddToAlbumModalScreen">;

function AddToAlbumModalScreen({ navigation, route }: AddToAlbumModalScreenProps) {
    const db = useSQLiteContext();
    const [store, setStore] = useStoreContext();
    const [localStore, setLocalStore] = useState<LocalPhotoStore>(new LocalPhotoStore());
    const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
    const [selectedPhotoItems, setSelectedPhotoItems] = useState<PhotoItem[]>([]);

    useFocusEffect(() => {
        (async () => {
            setPhotoItems(await localStore.getAll(db));
        })();
    });

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button title="Done" onPress={() => (async () => {
                await store.addNewPhotos(db, photoItems);
                setPhotoItems(await store.getAll(db));
                navigation.goBack();
            })()} />
            <PhotoGrid photoItems={photoItems}
                action={(photoItem: PhotoItem) => setSelectedPhotoItems([...selectedPhotoItems, photoItem])}
                deselectAction={(photoItem: PhotoItem) => setSelectedPhotoItems(selectedPhotoItems.filter((otherPhotoItem: PhotoItem) => photoItem.id != otherPhotoItem.id))} />
        </View>
    );
}

export default AddToAlbumModalScreen;