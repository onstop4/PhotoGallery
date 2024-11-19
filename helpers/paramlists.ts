import { Album } from "./albums";
import { PhotoItem } from "./contexts";

type ParamList = {
    MainTabs: undefined,
    LocalPhotosScreen: undefined,
    OnlinePhotosScreen: undefined,
    SinglePhotoScreen: { id: number },
    AlbumsScreen: undefined;
    AlbumPhotosScreen: { album: Album },
    SelectPhotosScreen: undefined,
    SettingsScreen: undefined
}

export default ParamList;