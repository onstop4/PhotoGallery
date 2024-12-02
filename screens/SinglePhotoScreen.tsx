import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PhotoItemResult, useStoreContext } from "helpers/contexts";
import RootStackParamList from "helpers/paramlists";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, PanResponder, StyleSheet, Text, View } from "react-native";
import { IconButton } from "react-native-paper";

type SinglePhotoScreenProps = NativeStackScreenProps<RootStackParamList, "SinglePhotoScreen">;

function SinglePhotoScreen({ route, navigation }: SinglePhotoScreenProps) {
    const { id } = route.params;
    const [store, setStore] = useStoreContext();
    const [found, setFound] = useState<PhotoItemResult>(store.getById(id));

    const pan = useRef(new Animated.ValueXY()).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dx !== 0)
                    attemptChangePhoto(gestureState.dx > 0); false

                Animated.spring(
                    pan,
                    { toValue: { x: 0, y: 0 }, useNativeDriver: true },
                ).start();
            },
        }),
    ).current;

    function attemptChangePhoto(directionIsRight: boolean) {
        setFound(found => {
            if (!found)
                return found;
            const index = directionIsRight ? found.index - 1 : found.index + 1;
            const photoItem = store.getByIndex(index);
            if (!photoItem)
                return found;
            return { index, photoItem };
        });
    }

    useEffect(() => {
        if (found)
            navigation.setOptions({ title: found.photoItem.dateTaken.toLocaleDateString("en-US") });
        else
            console.log("Something went wrong in SinglePhotoScreen. \"found\" is undefined.");
    }, [found]);

    useFocusEffect(() => navigation.setOptions({
        headerRight: () =>
            <IconButton
                icon="delete"
                size={30}
                onPressOut={async () => {
                    if (found) {
                        const newStore = await store.deletePhotos([found.photoItem]);
                        setStore(newStore);
                        const storeLength = newStore.photoItems.length;
                        // If there are no PhotoItems left, then user will go back to
                        // previous screen.
                        if (storeLength === 0) {
                            navigation.goBack();
                            return;
                        }
                        // If there are any more PhotoItems to the right of the one that was
                        // just deleted, then the user will be shown the next one. Otherwise,
                        // the user will be shown the one to the left.
                        const newIndex = storeLength <= found.index ? storeLength - 1 : found.index;
                        const newPhotoItem = newStore.getByIndex(newIndex);
                        if (!newPhotoItem)
                            console.log(`Something went wrong in SinglePhotoScreen. Requested index ${newIndex} when length is ${storeLength}.`);
                        else
                            setFound({ index: newIndex, photoItem: newPhotoItem });
                    }
                }} />
    }))

    return <>
        {found &&
            <Animated.View style={[styles.singlePhotoContainer, { transform: [{ translateX: pan.x }] }]} {...panResponder.panHandlers}>
                <Image style={styles.singlePhotoItself} source={{ uri: found.photoItem.uri }} resizeMode="contain" />
            </Animated.View>
        }
    </>

}

export default SinglePhotoScreen;

const styles = StyleSheet.create({
    singlePhotoContainer: {
        width: '100%',
        height: '100%',
    },
    singlePhotoItself: {
        width: '100%',
        height: '100%',
    },
});

