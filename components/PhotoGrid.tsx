import { useNavigation } from "@react-navigation/native";
import { PhotoItem, PhotoStoreContext, useStoreContext } from "helpers/contexts";
import { FC, useContext } from "react";
import { StyleSheet, Image, View, TouchableOpacity, Text, FlatList } from "react-native";

// Adapted from https://medium.com/@kalebjdavenport/how-to-create-a-grid-layout-in-react-native-7948f1a6f949.

const Photo = ({ photoItem, action }: { photoItem: PhotoItem, action: () => void }) => {
    return <TouchableOpacity onPress={action}>
        <Image style={styles.photo} source={{ uri: photoItem.uri }} />
    </TouchableOpacity>
}

const PhotoGrid = ({ photoData }: { photoData: Array<[PhotoItem, () => void]> }) => {
    return photoData.length > 0 ? <View style={styles.grid}>
        <FlatList data={photoData} keyExtractor={item => item[0].id.toString()} renderItem={({ item }) => {
            const [photoItem, action] = item; // Deconstructing the tuple
            return <Photo key={photoItem.id} photoItem={photoItem} action={action} />;
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
