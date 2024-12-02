import { Button, StyleSheet, Text, View } from "react-native";
import PhotoGrid from "components/PhotoGrid";
import { useCallback, useContext, useEffect, useState } from "react";
import { Store, LocalPhotoStore, PhotoItem, PhotoStoreContext, useStoreContext, OnlinePhotoStore, DummyPhotoStore } from "helpers/contexts";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Divider, IconButton, Menu } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import ParamList from "helpers/paramlists";
import { useFocusEffect } from "@react-navigation/native";
import { Session } from "@supabase/supabase-js";
import { supabase } from "helpers/supabase";
import { PublicAlbumPhotoStore } from "helpers/albums";
import alert from "helpers/alert";

type PublicAlbumPhotosProps = NativeStackScreenProps<ParamList, "PublicAlbumPhotosScreen">;

function PublicAlbumPhotosScreen({ navigation, route }: PublicAlbumPhotosProps) {
    const [store, setStore] = useStoreContext();

    const accessKey = route.params.accessKey;

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase.rpc('get_album_name_by_access_key', {
                p_access_key: accessKey
            });

            if (error) {
                setStore(new DummyPhotoStore());
                console.log('Error fetching album:', error.message);
                // Ensures that alert only occurs after store has been updated to prevent old PhotoItems from getting stuck on screen.
                setTimeout(() => alert("Error fetching album.", "Please go back and check that you entered the correct access key."));
            } else {
                setStore(await new PublicAlbumPhotoStore(accessKey).refresh());
                navigation.setOptions({ headerTitle: data });
            }
        })();
    }, []);

    return <PhotoGrid photoItems={store.photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
}

export default PublicAlbumPhotosScreen;