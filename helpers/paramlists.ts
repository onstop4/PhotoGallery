import { Album } from "./albums";
import { PhotoItem } from "./contexts";

type ParamList = {
    MainTabs: undefined,
    LocalPhotosScreen: undefined,
    SinglePhotoScreen: { id: number },
    AlbumsScreen: undefined;
    AlbumPhotosScreen: { album: Album },
    AddToAlbumModalScreen: { album: Album }
}

export default ParamList;