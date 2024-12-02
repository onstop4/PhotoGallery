import { Album } from "helpers/albums";
import { TouchableOpacity, View } from "react-native";
import { List, Text } from "react-native-paper";

function formatAlbumInfo(album: Album): string {
    let info = `${album.photoQuantity} photo`;
    if (album.photoQuantity !== 1)
        info += 's';
    if (album.onlineStatus)
        info += ` (${album.onlineStatus})`
    return info;
}

const AlbumList = ({ albums, action }: { albums: Album[], action: (album: Album) => void }) => {
    // Keys for online albums are negative to prevent from conflicting with the ids of local albums.
    const result = albums.map(album => <TouchableOpacity key={album.onlineStatus ? -album.id - 1 : album.id} onPress={() => action(album)}>
        <List.Item title={album.name} description={formatAlbumInfo(album)} />
    </TouchableOpacity>);
    return <View>{result.length > 0 ? result : <Text>No albums here.</Text>}</View>
}

export default AlbumList;