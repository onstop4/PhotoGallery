import { Album } from "helpers/albums";
import { Text, TouchableOpacity, View } from "react-native";
import { List } from "react-native-paper";

function formatPhotoQuantity(quantity: number) {
    return `${quantity} photo${quantity == 1 ? '' : 's'}`
}

const AlbumList = ({ albums, action }: { albums: Album[], action: (album: Album) => void }) => {
    // Keys for online albums are negative to prevent from conflicting with the ids of local albums.
    const result = albums.map(album => <TouchableOpacity key={album.onlineStatus ? -album.id - 1 : album.id} onPress={() => action(album)}>
        <List.Item title={album.name} description={formatPhotoQuantity(album.photoQuantity)} />
    </TouchableOpacity>);
    return <View>{result.length > 0 ? result : <Text>No albums here.</Text>}</View>
}

export default AlbumList;