import { useNavigation } from "@react-navigation/native";
import { PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import { FC, useContext, useState } from "react";
import { StyleSheet, Image, View, TouchableOpacity, Text, FlatList } from "react-native";

// Adapted from https://medium.com/@kalebjdavenport/how-to-create-a-grid-layout-in-react-native-7948f1a6f949.

type action = (photoItem: PhotoItem) => void;

const Photo = ({ photoItem, action, deselectAction }: { photoItem: PhotoItem, action: action, deselectAction?: action }) => {
    const [selected, setSelected] = useState(false);

    return <TouchableOpacity onPress={() => {
        if (deselectAction) {
            if (selected) {
                deselectAction(photoItem)
                setSelected(true);
            } else {
                action(photoItem);
                setSelected(false);
            }
        } else
            action(photoItem)
    }}>
        <View>
            <Image style={styles.photo} source={{ uri: photoItem.uri }} />
        </View>
    </TouchableOpacity>
}

const PhotoGrid = ({ photoItems, action, deselectAction }: { photoItems: PhotoItem[], action: action, deselectAction?: action }) => {
    return photoItems.length > 0 ? <View style={styles.grid}>
        <FlatList data={photoItems} keyExtractor={item => item.id.toString()} renderItem={({ item }) => {
            return <Photo key={item.id} photoItem={item} action={action} deselectAction={deselectAction} />;
        }}
            numColumns={4} />
    </View> : <Text>No photos here.</Text>
}

export default PhotoGrid;

const styles = StyleSheet.create({
    grid: {
        flex: 4, // the number of columns you want to devide the screen into
        marginHorizontal: "auto",
    },
    photo: {
        flex: 1,
        maxWidth: "25%",
        alignItems: "center",

        padding: 50,
        backgroundColor: "rgba(249, 180, 45, 0.25)",
        borderWidth: 1.5,
        borderColor: "#fff"
    }
});
