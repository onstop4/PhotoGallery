import { Button, StyleSheet, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu, Text } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";
import ParamList from "helpers/paramlists";
import { useFocusEffect } from "@react-navigation/native";

type SelectPhotosScreenProps = NativeStackScreenProps<ParamList, "SelectPhotosScreen">;

function SelectPhotosScreen({ navigation, route }: SelectPhotosScreenProps) {
    const db = useSQLiteContext();
    const [store, setStore] = useStoreContext();
    const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);
    const [selectedPhotoItems, setSelectedPhotoItems] = useState<PhotoItem[]>([]);

    useFocusEffect(useCallback(() => {
        (async () => {
            setPhotoItems(await new LocalPhotoStore(db).getAll());
        })();
    }, []));

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button title="Done" onPress={() => (async () => {
                await store.addNewPhotos(selectedPhotoItems);
                store.modified = true;
                navigation.goBack();
            })()} />
            <PhotoGrid photoItems={photoItems}
                action={(photoItem: PhotoItem) => setSelectedPhotoItems([...selectedPhotoItems, photoItem])}
                deselectAction={(photoItem: PhotoItem) => setSelectedPhotoItems(selectedPhotoItems.filter((otherPhotoItem: PhotoItem) => photoItem.id != otherPhotoItem.id))} />
        </View>
    );
}

export default SelectPhotosScreen;