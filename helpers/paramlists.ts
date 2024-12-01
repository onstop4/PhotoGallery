import { Album } from "./albums";

type ParamList = {
    MainTabs: undefined,
    LocalPhotosScreen: undefined,
    OnlinePhotosScreen: undefined,
    SinglePhotoScreen: { id: number },
    AlbumsScreen: undefined,
    AlbumPhotosScreen: { album: Album },
    SelectToAddPhotosScreen: undefined,
    SelectToDeletePhotosScreen: undefined,
    SettingsScreen: undefined,
    CameraScreen: undefined,
    PublicAlbumInputScreen: undefined,
    PublicAlbumPhotosScreen: { accessKey: string }
}

export default ParamList;