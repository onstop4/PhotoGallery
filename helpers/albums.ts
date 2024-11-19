import { SQLiteDatabase } from "expo-sqlite";
import { PhotoItem, PhotoToAdd, Store } from "./contexts";
import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { cacheDirectory, EncodingType, getInfoAsync, makeDirectoryAsync, readAsStringAsync, writeAsStringAsync } from "expo-file-system";
import { decode } from "base64-arraybuffer";

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

    constructor(album: Album, db: SQLiteDatabase) {
        super(album);
        this.db = db;
    }

    async refresh(): Promise<void> {
        const statement = await this.db.prepareAsync('select Photo.id as id, Photo.uri as uri, Photo.date_taken as date_taken from Photo inner join AlbumPhoto on Photo.id = AlbumPhoto.photo_id where AlbumPhoto.album_id = $albumId order by date_taken desc, id desc');
        const result = await statement.executeAsync({ $albumId: this.album.id });
        const rows = await result.getAllAsync();
        this.photoItems = this.mapRows(rows);
    }

    async addNewPhotos(photos: PhotoItem[]): Promise<void> {
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
        await this.refresh();
    }
}

class OnlineAlbumPhotoStore extends AlbumPhotoStore {
    session: Session

    constructor(album: Album, session: Session) {
        super(album);
        this.session = session;
    }

    async checkCache(uri: string) {
        const tempPhotoDirectory = cacheDirectory + "onlinePhotos/";
        if (!(uri.startsWith("file://") && (await getInfoAsync(tempPhotoDirectory)).exists && (await getInfoAsync(uri)).exists)) {
            if (!(await getInfoAsync(tempPhotoDirectory)).exists)
                await makeDirectoryAsync(tempPhotoDirectory, { intermediates: true });

            let filename = uri.split("/").pop();
            if (!filename)
                throw new Error("");

            const onlineFilename = this.session.user.id + "/" + filename;

            const { data, error } = await supabase.storage.from("photos").download(onlineFilename);
            if (error) {
                console.log(`Couldn't download ${onlineFilename}:`, error.message);
                throw new Error("");
            }
            uri = cacheDirectory + filename;
            await writeAsStringAsync(uri, await data.text());
        }
        return uri;
    }

    async refresh(): Promise<void> {
        if (this.session) {
            const { data, error, status } = await supabase.from('photo')
                .select('id, uri, date_taken, album!inner(id)')
                .eq('album.id', this.album.id)
                .order('date_taken', { ascending: false });
            if (error) {
                console.log("error in OnlineAlbumPhotoStore.refresh:", error)
                console.log("status in OnlineAlbumPhotoStore.refresh:", status)
            } else {
                const photoItems: PhotoItem[] = [];
                const settled = (await Promise.allSettled(data.map(async ({ id, uri, date_taken }) => ({ id, dateTaken: date_taken, uri: await this.checkCache(uri) }))))
                for (const s of settled)
                    if (s.status == "fulfilled")
                        photoItems.push(s.value)
                this.photoItems = photoItems;
                return;
            }
        }

        this.photoItems = [];
    }

    async getById(id: number): Promise<PhotoItem | null> {
        const photoItem = await super.getById(id);
        if (photoItem)
            photoItem.uri = await this.checkCache(photoItem.uri);
        return photoItem;
    }

    async getByIndex(index: number): Promise<PhotoItem | null> {
        const photoItem = await super.getByIndex(index);
        if (photoItem)
            photoItem.uri = await this.checkCache(photoItem.uri);
        return photoItem;
    }

    async addNewPhotos(photos: PhotoItem[]): Promise<void> {
        const toInsert = []

        for (const photo of photos) {
            let fileContents;
            try {
                const fileContentsAsBase64 = await readAsStringAsync(photo.uri, { encoding: EncodingType.Base64 });
                fileContents = decode(fileContentsAsBase64);
            } catch (e) {
                console.log(`Could not read file ${photo.uri}:`, e);
                continue;
            }
            const newFilename = `${this.session.user.id}/${photo.id}`;
            const { data, error } = await supabase.storage.from('photos').upload(newFilename, fileContents, { contentType: "image/jpeg" });
            if (error)
                console.log(`Could not upload file ${photo.uri} to Supabase as ${newFilename}:`, error.message);
            else
                toInsert.push({ user_id: this.session.user.id, uri: data.path, date_taken: photo.dateTaken });
        }

        if (toInsert.length > 0) {
            const { data, error, status } = await supabase.from("photo").insert(toInsert).select();
            if (error) {
                console.log("error in OnlineAlbumPhotoStore.addNewPhotos:", error.message);
                console.log("status in OnlineAlbumPhotoStore.addNewPhotos:", status);
            } else {
                const toInsert = data.map(({ id }) => ({ photo_id: id, album_id: this.album.id }));
                await supabase.from("albumphoto").insert(toInsert);
            }

            await this.refresh();
        } else console.log("nothing to insert");
    }
}

class AlbumStore {
    localAlbums: Album[] | undefined
    onlineAlbums: Album[] | undefined

    async refreshLocal(db: SQLiteDatabase): Promise<void> {
        const rows = (await db.getAllAsync('select Album.id as id, Album.name as name, count(AlbumPhoto.photo_id) as photo_quantity from Album left join AlbumPhoto on Album.id = AlbumPhoto.album_id group by Album.id, Album.name order by Album.name'));
        const albums = rows.map((row: any) => ({ id: row.id, name: row.name, photoQuantity: row.photo_quantity }));
        this.localAlbums = albums;
    }

    async refreshOnline(session: Session | null): Promise<void> {
        if (session) {
            const { data, error, status } = await supabase.from('album')
                .select('id, name, is_public, albumphoto(count)')
                .order('name', { ascending: true });
            if (error) {
                console.log("error in refreshOnline:", error)
                console.log("status in refreshOnline:", status)
            } else {
                this.onlineAlbums = data.map(({ id, name, is_public, albumphoto: [{ count }] }) => ({ id: id, name: name, onlineStatus: is_public ? "public" : "private", photoQuantity: count }));
                return;
            }
        }

        this.onlineAlbums = [];
    }

    async getAllLocal(db: SQLiteDatabase): Promise<Album[]> {
        if (!this.localAlbums)
            await this.refreshLocal(db);
        return this.localAlbums as Album[];
    }

    async getAllOnline(session: Session | null): Promise<Album[]> {
        if (!this.onlineAlbums)
            await this.refreshOnline(session);

        return this.onlineAlbums as Album[];
    }

    async createLocalAlbum(db: SQLiteDatabase, name: string): Promise<void> {
        const statement = await db.prepareAsync("insert into Album (name) values ($albumName)");
        await statement.executeAsync({ $albumName: name });
        await this.refreshLocal(db);
    }

    async createOnlineAlbum(session: Session, name: string, onlineStatus: undefined | OnlineStatus): Promise<void> {
        const { error } = await supabase.from('album').insert({ user_id: session.user.id, name: name, is_public: onlineStatus == "public" });
        if (error)
            console.log("error in createOnlineAlbum:", error.message)
        await this.refreshOnline(session);
    }
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

export { Album, AlbumPhotoStore, LocalAlbumPhotoStore, OnlineAlbumPhotoStore, AlbumStore, AlbumStoreContext, useAlbumStoreContext, areAlbumsEqual };