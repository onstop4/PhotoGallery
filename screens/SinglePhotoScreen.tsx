import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import { PhotoItem, PhotoItemResult, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import RootStackParamList from "helpers/paramlists";
import { useContext, useEffect, useLayoutEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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

