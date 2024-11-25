import { Button, StyleSheet, Text, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useState } from "react";
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
    const [store, setStore] = useStoreContext();

    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    function refreshStore(session: Session | null) {
        new OnlinePhotoStore(session).refresh().then(store => setStore(store));
    }

    useEffect(() => {
        supabase.auth.onAuthStateChange((_event, session) => {
            refreshStore(session);
        })
    }, [])

    useFocusEffect(() => {
        if (!(store instanceof OnlinePhotoStore))
            supabase.auth.getSession().then(({ data: { session } }) => {
                refreshStore(session);
            })

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
                    <Menu.Item onPress={() => { closeMenu(); setTimeout(() => navigation.navigate("SelectToAddPhotosScreen")); }} title="Add existing photos" />
                    <Menu.Item onPress={() => { closeMenu(); setTimeout(() => navigation.navigate("SelectToDeletePhotosScreen")); }} title="Delete photos" />
                </Menu>
        })
    })

    return (
        <PhotoGrid photoItems={store.photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
    );
}

export default OnlinePhotosScreen;