import { Album } from "./albums";

type ParamList = {
    MainTabs: undefined,
    LocalPhotosScreen: undefined,
    OnlinePhotosScreen: undefined,
    SinglePhotoScreen: { id: number },
    AlbumsScreen: undefined;
    AlbumPhotosScreen: { album: Album },
    SelectPhotosScreen: { album: Album } | undefined,
    SettingsScreen: undefined
    CameraScreen: undefined
}

export default ParamList;