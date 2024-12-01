import { SQLiteDatabase } from "expo-sqlite";
import { DummyPhotoStore, PhotoItem, PhotoRowInDatabase, PhotoToAdd, Store } from "./contexts";
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
    accessKey?: string
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

    async refresh(): Promise<LocalAlbumPhotoStore> {
        const rows = await this.db.getAllAsync('select Photo.id as id, Photo.uri as uri, Photo.date_taken as date_taken from Photo inner join AlbumPhoto on Photo.id = AlbumPhoto.photo_id where AlbumPhoto.album_id = $albumId order by date_taken desc, id desc', { $albumId: this.album.id });
        return new LocalAlbumPhotoStore(this.album, this.db, this.mapRows(rows as PhotoRowInDatabase[]));
    }

    async addNewPhotos(photos: PhotoItem[]): Promise<LocalAlbumPhotoStore> {
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

    async deletePhotos(photoItems: PhotoItem[]): Promise<LocalAlbumPhotoStore> {
        await this.db.withExclusiveTransactionAsync(async () => {
            try {
                await this.db.runAsync('delete from AlbumPhoto where AlbumPhoto.photo_id in ($ids)', { $ids: photoItems.map(photoItem => photoItem.id).join(", ") });
            } catch (e) {
                console.log('Could not delete selected albumphotos from database.');
            }
        })
        return await this.refresh();
    }
}

async function convertOnlineIntoPhotoItems(data: PhotoRowInDatabase[]): Promise<PhotoItem[]> {
    if (data.length > 0) {
        const resultingUrls = await supabase.storage.from("photos").createSignedUrls(data.map(item => item.uri), duration,);
        if (!resultingUrls.error) {
            const photoItems = data.flatMap((item, index) => {
                const resultingUrl = resultingUrls.data[index];
                if (resultingUrl.error) {
                    console.log(`Couldn't get signed url for ${resultingUrl.path}: ${resultingUrl.error}`);
                    return [];
                }
                const uri = resultingUrl.signedUrl;
                return { id: item.id, uri: uri, dateTaken: new Date(item.date_taken) };
            })
            return photoItems;
        } else
            console.log("error in convertOnlineIntoPhotoItems:", resultingUrls.error)
    }

    return [];
}

class OnlineAlbumPhotoStore extends AlbumPhotoStore {
    session: Session

    constructor(album: Album, session: Session, photoItems: PhotoItem[] = []) {
        super(album);
        this.session = session;
        this.photoItems = photoItems;
    }

    async refresh(): Promise<OnlineAlbumPhotoStore> {
        let photoItems: PhotoItem[] = []

        if (this.session) {
            const { data, error, status } = await supabase.from('photo')
                .select('id, uri, date_taken, album!inner(id)')
                .eq('album.id', this.album.id)
                .order('date_taken', { ascending: false });
            if (error) {
                console.log("error in OnlineAlbumPhotoStore.refresh:", error)
                console.log("status in OnlineAlbumPhotoStore.refresh:", status)
            } else photoItems = await convertOnlineIntoPhotoItems(data);
        }

        return new OnlineAlbumPhotoStore(this.album, this.session, photoItems);
    }

    async addNewPhotos(photos: PhotoItem[]): Promise<OnlineAlbumPhotoStore> {
        if (photos.length > 0) {
            const toInsert = photos.map(({ id }) => ({ photo_id: id, album_id: this.album.id }));
            await supabase.from("albumphoto").insert(toInsert);
            return await this.refresh();
        } else console.log("nothing to insert");
        return this;
    }

    async deletePhotos(photoItems: PhotoItem[]): Promise<OnlineAlbumPhotoStore> {
        const { error, status } = await supabase.from("albumphoto").delete().in('photo_id', photoItems.map(photoItem => photoItem.id));

        if (error) {
            console.log("error in OnlineAlbumPhotoStore.deletePhotos:", error.message);
            console.log("status in OnlineAlbumPhotoStore.deletePhotos:", status);
        }

        return await this.refresh();
    }
}

class PublicAlbumPhotoStore extends DummyPhotoStore {
    accessKey: string;
    photoItems: PhotoItem[];

    constructor(accessKey: string, photoItems: PhotoItem[] = []) {
        super();
        this.accessKey = accessKey;
        this.photoItems = photoItems;
    }

    async refresh(): Promise<PublicAlbumPhotoStore> {
        const { data, error } = await supabase.rpc('get_photos_by_access_key', {
            p_access_key: this.accessKey
        });

        if (!error) {
            const sessionData = await supabase.auth.getSession();
            if (sessionData.data.session) {
                const { error } = await supabase.auth.updateUser({ data: { access_key: this.accessKey } });
                if (error)
                    console.log("Error in PublicAlbumPhotoStore:", error.message);
            }

            return new PublicAlbumPhotoStore(this.accessKey, await convertOnlineIntoPhotoItems(data));
        }

        console.log('Error in PublicAlbumPhotoStore.refresh:', error.message);
        return new PublicAlbumPhotoStore(this.accessKey);
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

    async refreshOnline(): Promise<AlbumStore> {
        let onlineAlbums: Album[] = [];

        const { data, error, status } = await supabase.from('album')
            .select('id, name, is_public, albumphoto(count), access_key')
            .order('name', { ascending: true });
        if (error) {
            console.log("error in AlbumStore.refreshOnline:", error)
            console.log("status in AlbumStore.refreshOnline:", status)
        } else {
            onlineAlbums = data.map(({ id, name, is_public, albumphoto: [{ count }], access_key }) => ({ id: id, name: name, onlineStatus: is_public ? "public" : "private", photoQuantity: count, accessKey: access_key }));
        }

        return new AlbumStore(this.localAlbums, onlineAlbums);
    }

    async createLocalAlbum(db: SQLiteDatabase, name: string): Promise<AlbumStore> {
        const statement = await db.prepareAsync("insert into Album (name) values ($albumName)");
        await statement.executeAsync({ $albumName: name });
        return await this.refreshLocal(db);
    }

    async createOnlineAlbum(session: Session, name: string, onlineStatus: undefined | OnlineStatus): Promise<AlbumStore> {
        const { error } = await supabase.from('album').insert({ user_id: session.user.id, name: name, is_public: onlineStatus == "public" });
        if (error)
            console.log("error in AlbumStore.createOnlineAlbum:", error.message)
        return await this.refreshOnline();
    }

    async deleteLocalAlbum(db: SQLiteDatabase, album: Album): Promise<AlbumStore> {
        await db.runAsync("delete from Album where Album.id = $id", { $id: album.id });
        return await this.refreshLocal(db);
    }

    async deleteOnlineAlbum(album: Album): Promise<AlbumStore> {
        const { error } = await supabase.from('album').delete().eq('id', album.id);
        if (error)
            console.log("error in AlbumStore.deleteOnlineAlbum:", error.message)
        return await this.refreshOnline();
    }
}

const AlbumStoreContext = createContext<undefined | [AlbumStore, React.Dispatch<React.SetStateAction<AlbumStore>>]>(undefined);

function useAlbumStoreContext() {
    const found = useContext(AlbumStoreContext);
    if (found)
        return found;
    throw new Error("Album store is undefined.");

}

export { Album, AlbumPhotoStore, LocalAlbumPhotoStore, OnlineAlbumPhotoStore, PublicAlbumPhotoStore, AlbumStore, AlbumStoreContext, useAlbumStoreContext };