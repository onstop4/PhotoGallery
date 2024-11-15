import { SQLiteDatabase } from "expo-sqlite";
import { PhotoItem, Store } from "./contexts";
import { createContext, useContext } from "react";

type OnlineStatus = "public" | "private"

type Album = {
    id: number,
    name: string,
    photoQuantity: number,
    onlineStatus?: OnlineStatus
}

abstract class AlbumPhotoStore extends Store {
    album: Album

    constructor(album: Album) {
        super()
        this.album = album;
    }
}

class LocalAlbumPhotoStore extends AlbumPhotoStore {
    async refresh(db: SQLiteDatabase): Promise<void> {
        const statement = await db.prepareAsync('select Photo.id as id, Photo.uri as uri, Photo.date_taken as date_taken from Photo inner join AlbumPhoto on Photo.id = AlbumPhoto.photo_id where AlbumPhoto.album_id = $albumId order by date_taken desc, id desc');
        const result = await statement.executeAsync({ $albumId: this.album.id });
        const rows = await result.getAllAsync();
        this.photoItems = this.mapRows(rows);
    }

    async addNewPhotos(db: SQLiteDatabase, photos: PhotoItem[]): Promise<void> {
        await db.withExclusiveTransactionAsync(async () => {
            try {
                const statement = await db.prepareAsync('insert into AlbumPhoto (photo_id, album_id) values ($photoId, $albumId)');
                for (const photoItem of photos) {
                    await statement.executeAsync({ $photoId: photoItem.id, $albumId: this.album.id });
                }
            } catch (e) {
                console.log('Could not add photos to album:', e)
            }
        })
        await this.refresh(db);
    }

}

async function getAlbums(db: SQLiteDatabase): Promise<Album[]> {
    const rows = (await db.getAllAsync('select Album.id as id, Album.name as name, count(AlbumPhoto.id) as photo_quantity from Album left join AlbumPhoto on Album.id = AlbumPhoto.album_id group by Album.id, Album.name order by Album.name'));
    const albums = rows.map((row: any) => ({ id: row.id, name: row.name, photoQuantity: row.photo_quantity }));
    return albums;
}


class AlbumStore {
    albums: Album[] | undefined

    async refresh(db: SQLiteDatabase): Promise<void> {
        const rows = (await db.getAllAsync('select Album.id as id, Album.name as name, count(AlbumPhoto.photo_id) as photo_quantity from Album left join AlbumPhoto on Album.id = AlbumPhoto.album_id group by Album.id, Album.name order by Album.name'));
        const albums = rows.map((row: any) => ({ id: row.id, name: row.name, photoQuantity: row.photo_quantity }));
        this.albums = albums;
    }

    async getAll(db: SQLiteDatabase): Promise<Album[]> {
        if (!this.albums)
            await this.refresh(db);

        return this.albums as Album[];
    }

    async createAlbum(db: SQLiteDatabase, name: string, onlineStatus: undefined | OnlineStatus = undefined): Promise<void> {
        const statement = await db.prepareAsync("insert into Album (name) values ($albumName)");
        await statement.executeAsync({ $albumName: name });
        await this.refresh(db);
    }
}

function getPhotoStoreFromAlbum(album: Album) {
    return new LocalAlbumPhotoStore(album);
}

const AlbumStoreContext = createContext<undefined | AlbumStore>(undefined);

function useAlbumStoreContext() {
    const found = useContext(AlbumStoreContext);
    if (found)
        return found;
    throw new Error("Album store is undefined.");

}

function areAlbumsEqual(album1: Album, album2: Album) {
    return album1.id == album2.id && Boolean(album1.onlineStatus) == Boolean(album2.onlineStatus)
}

export { Album, AlbumPhotoStore, LocalAlbumPhotoStore, getAlbums, AlbumStore, AlbumStoreContext, useAlbumStoreContext, getPhotoStoreFromAlbum, areAlbumsEqual };