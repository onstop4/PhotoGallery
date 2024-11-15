import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import { PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import RootStackParamList from "helpers/paramlists";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

type SinglePhotoScreenProps = NativeStackScreenProps<RootStackParamList, "SinglePhotoScreen">;

function SinglePhotoScreen({ route, navigation }: SinglePhotoScreenProps) {
    const db = useSQLiteContext();
    const { id } = route.params;
    const [store, setStore] = useStoreContext();
    const [photoItem, setPhotoItem] = useState<PhotoItem | undefined>(undefined);

    useEffect(() => {
        (async () => {
            const photoItem = await store.getById(db, id);
            if (!photoItem)
                throw new Error("Something went wrong in SinglePhotoScreen.");

            setPhotoItem(photoItem);

            navigation.setOptions({ title: photoItem.dateTaken.toLocaleDateString("en-US") })
        }
        )();
    })

    return <View style={styles.singlePhotoContainer}>
        {photoItem && <Image style={styles.singlePhotoItself} source={{ uri: photoItem.uri }} />}
    </View>
}

export default SinglePhotoScreen;

const styles = StyleSheet.create({
    singlePhotoContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        height: '100%',
        width: '100%',
        overflow: 'hidden',
    },
    singlePhotoItself: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});

