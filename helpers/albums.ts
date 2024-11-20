import { SQLiteDatabase } from "expo-sqlite";
import { PhotoItem, PhotoToAdd, Store } from "./contexts";
import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { cacheDirectory, EncodingType, getInfoAsync, makeDirectoryAsync, readAsStringAsync, writeAsStringAsync } from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { duration } from "./shouldRefresh";

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
    db: SQLiteDatabase

    constructor(album: Album, db: SQLiteDatabase, photoItems: PhotoItem[] = []) {
        super(album);
        this.db = db;
        this.photoItems = photoItems;
    }

    async refresh(): Promise<Store> {
        const statement = await this.db.prepareAsync('select Photo.id as id, Photo.uri as uri, Photo.date_taken as date_taken from Photo inner join AlbumPhoto on Photo.id = AlbumPhoto.photo_id where AlbumPhoto.album_id = $albumId order by date_taken desc, id desc');
        const result = await statement.executeAsync({ $albumId: this.album.id });
        const rows = await result.getAllAsync();
        return new LocalAlbumPhotoStore(this.album, this.db, this.mapRows(rows));
    }

    async addNewPhotos(photos: PhotoItem[]): Promise<Store> {
        await this.db.withExclusiveTransactionAsync(async () => {
            try {
                const statement = await this.db.prepareAsync('insert into AlbumPhoto (photo_id, album_id) values ($photoId, $albumId)');
                for (const photoItem of photos) {
                    await statement.executeAsync({ $photoId: photoItem.id, $albumId: this.album.id });
                }
            } catch (e) {
                console.log('Could not add photos to album:', e)
            }
        })
        return await this.refresh();
    }
}

class OnlineAlbumPhotoStore extends AlbumPhotoStore {
    session: Session
    timeObtained: Date | undefined

    constructor(album: Album, session: Session, photoItems: PhotoItem[] = []) {
        super(album);
        this.session = session;
        this.photoItems = photoItems;
    }

    async refresh(): Promise<Store> {
        if (this.session) {
            const { data, error, status } = await supabase.from('photo')
                .select('id, uri, date_taken, album!inner(id)')
                .eq('album.id', this.album.id)
                .order('date_taken', { ascending: false });
            if (error) {
                console.log("error in OnlineAlbumPhotoStore.refresh:", error)
                console.log("status in OnlineAlbumPhotoStore.refresh:", status)
            } else {
                const resultingUrls = await supabase.storage.from("photos").createSignedUrls(data.map(item => item.uri), duration);
                if (resultingUrls.error) {
                    console.log("error in OnlinePhotoStore.refresh:", error)
                    console.log("status in OnlinePhotoStore.refresh:", status)
                    return this;
                }
                this.timeObtained = new Date();
                const photoItems = data.flatMap((item, index) => {
                    const resultingUrl = resultingUrls.data[index];
                    if (resultingUrl.error) {
                        console.log(`Couldn't get signed url for ${resultingUrl.path}: ${resultingUrl.error}`);
                        return [];
                    }
                    const uri = resultingUrl.signedUrl;
                    return { id: item.id, uri: uri, dateTaken: item.date_taken };
                })
                return new OnlineAlbumPhotoStore(this.album, this.session, photoItems);
            }
        }

        return this;
    }

    async addNewPhotos(photos: PhotoItem[]): Promise<Store> {
        if (photos.length > 0) {
            const toInsert = photos.map(({ id }) => ({ photo_id: id, album_id: this.album.id }));
            await supabase.from("albumphoto").insert(toInsert);
            return await this.refresh();
        } else console.log("nothing to insert");
        return this;
    }
}

class AlbumStore {
    localAlbums: Album[]
    onlineAlbums: Album[]

    constructor(localAlbums: Album[] = [], onlineAlbums: Album[] = []) {
        this.localAlbums = localAlbums;
        this.onlineAlbums = onlineAlbums;
    }

    async refreshLocal(db: SQLiteDatabase): Promise<AlbumStore> {
        const rows = (await db.getAllAsync('select Album.id as id, Album.name as name, count(AlbumPhoto.photo_id) as photo_quantity from Album left join AlbumPhoto on Album.id = AlbumPhoto.album_id group by Album.id, Album.name order by Album.name'));
        const albums = rows.map((row: any) => ({ id: row.id, name: row.name, photoQuantity: row.photo_quantity }));
        return new AlbumStore(albums, this.onlineAlbums);
    }

    async refreshOnline(session: Session | null): Promise<AlbumStore> {
        let onlineAlbums: Album[] = [];

        if (session) {
            const { data, error, status } = await supabase.from('album')
                .select('id, name, is_public, albumphoto(count)')
                .order('name', { ascending: true });
            if (error) {
                console.log("error in refreshOnline:", error)
                console.log("status in refreshOnline:", status)
            } else {
                onlineAlbums = data.map(({ id, name, is_public, albumphoto: [{ count }] }) => ({ id: id, name: name, onlineStatus: is_public ? "public" : "private", photoQuantity: count }));
            }
        }

        return new AlbumStore(this.localAlbums, onlineAlbums);
    }

    async createLocalAlbum(db: SQLiteDatabase, name: string) {
        const statement = await db.prepareAsync("insert into Album (name) values ($albumName)");
        await statement.executeAsync({ $albumName: name });
        return await this.refreshLocal(db);
    }

    async createOnlineAlbum(session: Session, name: string, onlineStatus: undefined | OnlineStatus) {
        const { error } = await supabase.from('album').insert({ user_id: session.user.id, name: name, is_public: onlineStatus == "public" });
        if (error)
            console.log("error in createOnlineAlbum:", error.message)
        return await this.refreshOnline(session);
    }
}

const AlbumStoreContext = createContext<undefined | [AlbumStore, React.Dispatch<React.SetStateAction<AlbumStore>>]>(undefined);

function useAlbumStoreContext() {
    const found = useContext(AlbumStoreContext);
    if (found)
        return found;
    throw new Error("Album store is undefined.");

}

export { Album, AlbumPhotoStore, LocalAlbumPhotoStore, OnlineAlbumPhotoStore, AlbumStore, AlbumStoreContext, useAlbumStoreContext };