import { Button, StyleSheet, Text, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext, OnlinePhotoStore, useOnlineStoreContext } from "helpers/contexts";
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
    const [onlineStore, setOnlineStore] = useOnlineStoreContext();
    const [store, setStore] = useStoreContext();

    const [menuVisible, setMenuVisible] = useState(false);

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    useEffect(() => setStore(onlineStore), []);

    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Button title="Add existing photos" onPress={() => navigation.navigate("SelectPhotosScreen")} />
            <PhotoGrid photoItems={onlineStore.photoItems} action={(photoItem: PhotoItem) => { setStore(onlineStore); navigation.navigate("SinglePhotoScreen", { id: photoItem.id }) }} ></PhotoGrid>
        </View>
    );
}

export default OnlinePhotosScreen;