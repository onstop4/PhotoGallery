import { StyleSheet, Text, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MainTabsParamList from "helpers/paramlists/maintabs";
import { Button, Divider, IconButton, Menu } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";

type LocalPhotosScreenProps = NativeStackScreenProps<MainTabsParamList, "LocalPhotosScreen">;

function LocalPhotosScreen({ navigation }: LocalPhotosScreenProps) {
    const db = useSQLiteContext();
    const [store, setStore] = useStoreContext();
    const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);

    const [visible, setVisible] = useState(false);

    const openMenu = () => setVisible(true);

    const closeMenu = () => setVisible(false);

    useEffect(() => {
        if (!(store instanceof LocalPhotoStore))
            (async () => {
                const newStore = new LocalPhotoStore()
                setStore(newStore);
                setPhotoItems(await newStore.getAll(db));
            })();
        // else
        //     (async () => {
        //         await store.refresh(db);
        //         setPhotoItems(await store.getAll(db));
        //     })();
        navigation.setOptions({
            headerRight: () => {
                return <Menu
                    visible={visible}
                    onDismiss={closeMenu}
                    anchor={<IconButton
                        icon="dots-vertical"
                        size={30}
                        onPress={openMenu}
                    />}
                    anchorPosition="bottom">
                    <Menu.Item onPress={async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            aspect: [4, 3],
                            quality: 1,
                            allowsMultipleSelection: true
                        });

                        if (!result.canceled) {
                            await store.addNewPhotos(db, result.assets.map(asset => asset.uri), new Date());
                            setPhotoItems(await store.getAll(db));
                        }
                    }} title="Add existing photo" />
                </Menu>
            }

        })
    });

    const photoData: Array<[PhotoItem, () => void]> = photoItems.map(photoItem => [photoItem, () => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })])


    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <PhotoGrid photoData={photoData} ></PhotoGrid>
        </View>
    );
}

export default LocalPhotosScreen;