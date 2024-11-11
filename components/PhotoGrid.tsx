import { FC } from "react";
import { StyleSheet, Image, View } from "react-native";

// Adapted from https://medium.com/@kalebjdavenport/how-to-create-a-grid-layout-in-react-native-7948f1a6f949.

type PhotoItem = {
    id: string;
    url: string;
    dateTaken: Date;
};

interface PhotoGridProp {
    photoItems: PhotoItem[];
}

const Photo: FC<PhotoItem> = ({ id, url, dateTaken }) => {
    return <Image style={styles.photo} source={{ uri: url }}></Image>
}

const PhotoGrid: FC<PhotoGridProp> = ({ photoItems }) => {
    return <View style={styles.grid}>
        {photoItems.map(photoData => <Photo key={photoData.id} {...photoData} />)}
    </View>
}

export default PhotoGrid;

const styles = StyleSheet.create({
    grid: {
        marginHorizontal: "auto",
        width: 400,
        flexDirection: "row",
        flexWrap: "wrap"
    },
    photo: {
        flex: 1,
        minWidth: 100,
        maxWidth: 100,
        height: 100,
        justifyContent: "center",
        alignItems: "center",

        // // my visual styles; not important for grid
        // padding: 10,
        // backgroundColor: "rgba(249, 180, 45, 0.25)",
        // borderWidth: 1.5,
        // borderColor: "#fff"
    }
});
