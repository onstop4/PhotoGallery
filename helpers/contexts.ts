import { copyAsync, deleteAsync, documentDirectory, EncodingType, getInfoAsync, readAsStringAsync } from "expo-file-system";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useState } from "react";
import { generateRandomString } from "./generateRandomString";
import { Session } from "@supabase/supabase-js";
import { supabase } from "helpers/supabase";
import { duration, shouldRefresh } from "helpers/shouldRefresh";
import { decode } from "base64-arraybuffer";
import * as Crypto from 'expo-crypto';

type PhotoToAdd = {
    originUri: string,
    dateTaken: Date
}

type PhotoItem = {
    id: number;
    uri: string;
    dateTaken: Date;
};

type PhotoItemResult = { index: number, photoItem: PhotoItem };

abstract class Store {

    photoItems: PhotoItem[] = [];

    abstract refresh(): Promise<Store>;

    mapRows(rows: any[]): PhotoItem[] {
        return rows.map((row: any) => ({ id: Number(row.id), uri: row.uri, dateTaken: new Date(row.date_taken) }));
    }

    getById(id: number): PhotoItemResult | null {
        const array = this.photoItems
        const index = array.findIndex(photoItem => photoItem.id == id);
        return index > -1 ? { index, photoItem: array[index] } : null;
    }

    getByIndex(index: number) {
        const array = this.photoItems;
        return (index >= 0 && index < array.length) ? array[index] : null;
    }

    abstract addNewPhotos(photos: PhotoToAdd[] | PhotoItem[]): Promise<Store>

    abstract deletePhotos(photoItems: PhotoItem[]): Promise<Store>
}

class DummyPhotoStore extends Store {
    async refresh(): Promise<DummyPhotoStore> {
        return new DummyPhotoStore();
    }

    async addNewPhotos(photos: PhotoToAdd[] | PhotoItem[]): Promise<DummyPhotoStore> {
        throw new Error("Do not use.");
    }

    deletePhotos(photoItems: PhotoItem[]): Promise<DummyPhotoStore> {
        throw new Error("Method not implemented.");
    }
}

class LocalPhotoStore extends Store {
    db: SQLiteDatabase

    constructor(db: SQLiteDatabase, photoItems: PhotoItem[] = []) {
        super();
        this.db = db;
        this.photoItems = photoItems;
    }

    async refresh(): Promise<LocalPhotoStore> {
        const rows = await this.db.getAllAsync('select Photo.id as id, Photo.uri as uri, Photo.date_taken as date_taken from Photo order by date_taken desc, id desc');
        return new LocalPhotoStore(this.db, super.mapRows(rows));
    }

    async addNewPhotos(photos: PhotoToAdd[]): Promise<LocalPhotoStore> {
        await this.db.withExclusiveTransactionAsync(async () => {
            const statement = await this.db.prepareAsync('insert into Photo (uri, date_taken) values ($uri, $dateTaken)');
            for (const photo of photos) {
                const oldUri = photo.originUri;
                const dateTakenIso = photo.dateTaken.toISOString();
                let newUri;
                do {
                    newUri = documentDirectory + generateRandomString();
                } while ((await getInfoAsync(newUri)).exists);
                try {
                    copyAsync({ from: oldUri, to: newUri });
                    statement.executeAsync({ $uri: newUri, $dateTaken: dateTakenIso });
                } catch (e) {
                    console.log('Could not copy photo or store it in database:', e);
                }
            }
        })

        return await this.refresh();
    }

    async deletePhotos(photoItems: PhotoItem[]): Promise<LocalPhotoStore> {
        await this.db.withExclusiveTransactionAsync(async () => {
            try {
                const params = { $ids: photoItems.map(photoItem => photoItem.id).join(", ") };
                const files = await this.db.getAllAsync('select Photo.id as id, Photo.uri as uri from Photo where Photo.id in ($ids)', params);
                await this.db.runAsync('delete from Photo where Photo.id in ($ids)', params);
                for (const row of files) {
                    const item: any = row;
                    try {
                        await deleteAsync(item.uri);
                    } catch (e) {
                        console.log(`Removed photo ${item.id} from database but could not delete its file (${item.uri}).`)
                    }
                }
            } catch (e) {
                console.log('Could not delete selected photos from database:', e);
            }
        })

        return await this.refresh();
    }
}

class OnlinePhotoStore extends Store {
    session: Session | null;
    timeObtained: Date | undefined

    constructor(session: Session | null, photoItems: PhotoItem[] = []) {
        super();
        this.session = session;
        this.photoItems = photoItems;
    }

    async refresh(): Promise<OnlinePhotoStore> {
        if (this.session) {
            const { data, error, status } = await supabase.from('photo')
                .select('id, uri, date_taken')
                .order('date_taken', { ascending: false });
            if (error) {
                console.log("error in OnlinePhotoStore.refresh:", error)
                console.log("status in OnlinePhotoStore.refresh:", status)
                return this;
            }
            const resultingUrls = await supabase.storage.from("photos").createSignedUrls(data.map(item => item.uri), duration);
            if (resultingUrls.error) {
                console.log("error in OnlinePhotoStore.refresh:", error)
                console.log("status in OnlinePhotoStore.refresh:", status)
                return this;
            }
            this.timeObtained = new Date();
            const photoItems = data.map((item, index) => {
                const resultingUrl = resultingUrls.data[index];
                let uri;
                if (resultingUrl.error) {
                    console.log(`Couldn't get signed url for ${resultingUrl.path}: ${resultingUrl.error}`);
                    uri = "";
                } else
                    uri = resultingUrl.signedUrl;
                return { id: item.id, uri: uri, dateTaken: new Date(item.date_taken) };
            })
            return new OnlinePhotoStore(this.session, photoItems);

        }

        return this;
    }

    async addNewPhotos(photos: PhotoItem[]): Promise<OnlinePhotoStore> {
        if (!this.session)
            throw new Error("Cannot add photos when there is session is null.");

        const toInsert = []

        for (const photo of photos) {
            let fileContents;
            let fileContentsAsBase64;
            try {
                fileContentsAsBase64 = await readAsStringAsync(photo.uri, { encoding: EncodingType.Base64 });
                fileContents = decode(fileContentsAsBase64);
            } catch (e) {
                console.log(`Could not read file ${photo.uri}:`, e);
                continue;
            }
            const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, fileContentsAsBase64);
            const newFilename = `${this.session.user.id}/${digest}`;
            const { data, error } = await supabase.storage.from('photos').upload(newFilename, fileContents, { contentType: "image/jpeg" });
            if (error)
                console.log(`Could not upload file ${photo.uri} to Supabase as ${newFilename}:`, error.message);
            else
                toInsert.push({ user_id: this.session.user.id, uri: data.path, date_taken: photo.dateTaken });
        }

        if (toInsert.length > 0) {
            const { data, error, status } = await supabase.from("photo").insert(toInsert).select();
            if (error) {
                console.log("error in OnlinePhotoStore.addNewPhotos:", error.message);
                console.log("status in OnlinePhotoStore.addNewPhotos:", status);
            }

            return await this.refresh();
        } else console.log("nothing to insert");
        return this;
    }

    async deletePhotos(photoItems: PhotoItem[]): Promise<OnlinePhotoStore> {
        if (!this.session)
            throw new Error("Cannot add photos when there is session is null.");

        const { data, error, status } = await supabase.from("photo").delete().in('id', photoItems.map(photoItem => photoItem.id)).select("uri");
        if (error) {
            console.log("error in OnlinePhotoStore.deletePhotos:", error.message);
            console.log("status in OnlinePhotoStore.deletePhotos:", status);
        } else {
            const result = await supabase.storage.from("photos").remove(data.map(item => item.uri));
            if (result.error)
                console.log("error in OnlinePhotoStore.deletePhotos:", error);
        }

        return this.refresh();
    }
}

const PhotoStoreContext = createContext<undefined | [Store, React.Dispatch<React.SetStateAction<Store>>]>(undefined);

function useStoreContext() {
    const found = useContext(PhotoStoreContext);
    if (found)
        return found;
    throw new Error("Store is undefined.");
}

export { PhotoItem, PhotoItemResult, Store, LocalPhotoStore, OnlinePhotoStore, PhotoStoreContext, useStoreContext, DummyPhotoStore, PhotoToAdd };