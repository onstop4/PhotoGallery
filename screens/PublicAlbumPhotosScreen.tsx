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
import isMobile from "helpers/isMobile";
import { PublicAlbumPhotoStore } from "helpers/albums";

type PublicAlbumPhotosProps = NativeStackScreenProps<ParamList, "PublicAlbumPhotosScreen">;

function PublicAlbumPhotosScreen({ navigation, route }: PublicAlbumPhotosProps) {
    const [store, setStore] = useStoreContext();
    const [unsuccessful, setUnsuccessful] = useState(false);

    const accessKey = route.params.accessKey;

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase.rpc('get_album_name_by_access_key', {
                p_access_key: accessKey
            });

            if (error) {
                console.error('Error fetching album name:', error.message);
                setStore(new DummyPhotoStore());
            } else {
                navigation.setOptions({ headerTitle: data });
                setStore(await new PublicAlbumPhotoStore(accessKey).refresh());
            }
        })();
    }, []);

    return <>
        {unsuccessful
            ? <Text>Could not get information about this album.Please go back and make sure that you entered the correct access key.</Text>
            : <PhotoGrid photoItems={store.photoItems} action={(photoItem: PhotoItem) => navigation.navigate("SinglePhotoScreen", { id: photoItem.id })} ></PhotoGrid>
        }
    </>;
}

export default PublicAlbumPhotosScreen;