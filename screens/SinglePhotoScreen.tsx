import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import { PhotoItem, PhotoItemResult, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import RootStackParamList from "helpers/paramlists";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { IconButton } from "react-native-paper";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

type SinglePhotoScreenProps = NativeStackScreenProps<RootStackParamList, "SinglePhotoScreen">;

function SinglePhotoScreen({ route, navigation }: SinglePhotoScreenProps) {
    const db = useSQLiteContext();
    const { id } = route.params;
    const [store, setStore] = useStoreContext();
    const [found, setFound] = useState<PhotoItemResult | undefined>(undefined);

    function updateFound(result: PhotoItemResult) {
        setFound(result);
        navigation.setOptions({ title: result.photoItem.dateTaken.toLocaleDateString("en-US") })
    }

    const translationX = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value }
        ],
    }));

    const pan = Gesture.Pan()
        .minDistance(1)
        .onUpdate(event => {
            translationX.value = event.translationX;
        })
        .onEnd(event => {
            const x = event.translationX;
            translationX.value = 0;
            attemptChangePhoto(x > 0);
        })
        .runOnJS(true);

    function attemptChangePhoto(directionIsRight: boolean) {
        if (!found)
            return;

        const nextIndex = directionIsRight ? found.index - 1 : found.index + 1;
        const nextPhotoItem = store.getByIndex(nextIndex);
        if (nextPhotoItem)
            updateFound({ index: nextIndex, photoItem: nextPhotoItem });
    }

    useEffect(() => {
        (async () => {
            const result = store.getById(id);
            if (!result)
                throw new Error("Something went wrong in SinglePhotoScreen.");

            updateFound(result);
        }
        )();
    }, []);

    useFocusEffect(() => navigation.setOptions({
        headerRight: () =>
            <IconButton
                icon="delete-outline"
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
                            updateFound({ index: newIndex, photoItem: newPhotoItem });
                    }
                }} />
    }))

    return <>
        {found &&
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.singlePhotoContainer, animatedStyles]}>
                    <Image style={styles.singlePhotoItself} source={{ uri: found.photoItem.uri }} />
                </Animated.View>
            </GestureDetector>
        }
    </>

}

export default SinglePhotoScreen;

const styles = StyleSheet.create({
    singlePhotoContainer: {},
    singlePhotoItself: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
});

