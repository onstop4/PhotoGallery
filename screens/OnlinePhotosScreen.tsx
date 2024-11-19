import { Button, StyleSheet, Text, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext, OnlinePhotoStore } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useSQLiteContext } from "expo-sqlite";
import ParamList from "helpers/paramlists";
import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { supabase } from "helpers/supabase";

type OnlinePhotosScreenProps = NativeStackScreenProps<ParamList, "OnlinePhotosScreen">;

function OnlinePhotosScreen({ navigation }: OnlinePhotosScreenProps) {
    const [session, setSession] = useState<Session | undefined>();
    const [store, setStore] = useStoreContext();
    const [photoItems, setPhotoItems] = useState<PhotoItem[]>([]);

    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    useFocusEffect(() => {
        if (!(store instanceof OnlinePhotoStore)) {
            (async () => {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    console.log("Error getting session:", error.message);
                    return;
                }
                if (data.session) {
                    const newStore = new OnlinePhotoStore(data.session)
                    setStore(newStore);
                    newStore.getAll().then(photoItems => setPhotoItems(photoItems));
                }
            })();
        } else if (store.modified) {
            store.modified = false;
            store.getAll().then(photoItems => setPhotoItems(photoItems));
        }

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
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            aspect: [4, 3],
                            quality: 1,
                            allowsMultipleSelection: true
                        });

                        if (!result.canceled) {
                            const date = new Date();
                            await store.addNewPhotos(result.assets.map(asset => ({ originUri: asset.uri, dateTaken: date })));
                            setPhotoItems(await store.getAll());
                        }
                    }} title="Add existing photos" />
                </Menu>


        })
    });

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button title="Add existing photos" onPress={() => navigation.navigate("SelectPhotosScreen")} />
            <PhotoGrid photoItems={photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
        </View>
    );
}

export default OnlinePhotosScreen;