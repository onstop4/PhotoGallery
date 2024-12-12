import { PhotoItem, } from "helpers/contexts";
import { useState } from "react";
import { StyleSheet, Image, View, TouchableOpacity, ScrollView } from "react-native";
import { Checkbox, Text } from "react-native-paper";

type action = (photoItem: PhotoItem) => void;

const Photo = ({ photoItem, action, deselectAction }: { photoItem: PhotoItem, action: action, deselectAction?: action }) => {
    const [selected, setSelected] = useState(false);

    return <TouchableOpacity onPress={() => {
        if (deselectAction) {
            if (selected) {
                deselectAction(photoItem)
                setSelected(false);
            } else {
                action(photoItem);
                setSelected(true);
            }
        } else
            action(photoItem)
    }}>
        <>
            {deselectAction &&
                // I chose the Android style of checkboxes because in the iOS
                // style, unchecked checkboxes just appear as empty space.
                <Checkbox.Android style={styles.checkbox} status={selected ? "checked" : "unchecked"} />}
            <Image style={styles.photo} source={{ uri: photoItem.uri }} />
        </>
    </TouchableOpacity>
}

const PhotoGrid = ({ photoItems, action, deselectAction }: { photoItems: PhotoItem[], action: action, deselectAction?: action }) => {
    const result = photoItems.map((photoItem, index) => <Photo key={index} photoItem={photoItem} action={action} deselectAction={deselectAction} />);
    return <View style={{ width: "100%", flex: 1, paddingTop: 10, paddingHorizontal: 8 }}>
        {result.length > 0
            ? <ScrollView contentContainerStyle={styles.grid}>
                {result}
            </ScrollView>
            : <Text>No photos here.</Text>
        }
    </View>
}

export default PhotoGrid;

const styles = StyleSheet.create({
    grid: {
        flex: 1,
        flexWrap: "wrap",
        flexDirection: "row"
    },
    photo: {
        width: 90,
        height: 90,
        margin: 2,
        backgroundColor: "grey",
    },
    checkbox: {
        position: "absolute",
        top: 0,
        left: 0
    }
});
