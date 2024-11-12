import { copyAsync, documentDirectory, getInfoAsync } from "expo-file-system";
import { SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { createContext, useContext, useState } from "react";

type PhotoItem = {
    id: number;
    uri: string;
    dateTaken: Date;
};

// interface Store {
//     getAll(): Promise<PhotoItem[]>;
//     // getById(id: number): Promise<SinglePhotoNavigator>;
// }

class SinglePhotoNavigator {
    array: PhotoItem[];
    index: number;

    private constructor(array: PhotoItem[], index: number) {
        this.array = array;
        this.index = index;
    }

    static getValid(array: PhotoItem[] | undefined, index: number) {
        if (array && 0 <= index && index < array.length)
            return new SinglePhotoNavigator(array, index);
        return null;
    }

    next() {
        const newIndex = this.index++;
        if (0 <= newIndex && newIndex < this.array.length)
            return new SinglePhotoNavigator(this.array, newIndex);
        return null;
    }

    previous() {
        const newIndex = this.index--;
        if (0 <= newIndex && newIndex < this.array.length)
            return new SinglePhotoNavigator(this.array, newIndex);
        return null;
    }

    getCurrentPhotoItem() {
        return [this.index, this.array[this.index]];
    }
}

abstract class Store {
    photoItems: PhotoItem[] | undefined

    abstract refresh(db: SQLiteDatabase | undefined): Promise<void>;

    async getAll(db: SQLiteDatabase | undefined): Promise<PhotoItem[]> {
        if (!this.photoItems)
            await this.refresh(db);

        return this.photoItems as PhotoItem[];
    }

    async getById(db: SQLiteDatabase | undefined, id: number): Promise<PhotoItem | null> {
        const array = await this.getAll(db);
        const index = array.findIndex(photoItem => photoItem.id == id);
        return index > -1 ? array[index] : null;
    }

    async getByIndex(db: SQLiteDatabase | undefined, index: number): Promise<PhotoItem | null> {
        const array = await this.getAll(db);
        return (index >= 0 && index < array.length) ? array[index] : null;
    }

    // async getById(id: number): Promise<SinglePhotoNavigator> {
    //     const array = await this.getAll();
    //     const navigator = SinglePhotoNavigator.getValid(array, array.findIndex(photoItem => photoItem.id == id));
    //     if (!navigator)
    //         throw new Error("Something went wrong with AbstractBaseStore and SinglePhotoNavigator.");
    //     return navigator;
    // }

    abstract addNewPhotos(db: SQLiteDatabase | undefined, uri: string[], dateTaken: Date): Promise<void>
}

class DummyPhotoStore extends Store {
    async refresh(db: undefined): Promise<void> {
        throw new Error("Do not use.");
    }

    async addNewPhotos(db: undefined, uri: string[], dateTaken: Date): Promise<void> {
        throw new Error("Do not use.");

    }
}

function generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

class LocalPhotoStore extends Store {
    async refresh(db: SQLiteDatabase) {
        const rows = await db.getAllAsync('select * from Photos order by date_taken desc, id desc');
        this.photoItems = rows.map((row: any) => ({ id: Number(row.id), uri: row.uri, dateTaken: new Date(row.date_taken) }));
    }

    async addNewPhotos(db: SQLiteDatabase, uris: string[], dateTaken: Date): Promise<void> {
        const dateTakenIso = dateTaken.toISOString();
        await db.withExclusiveTransactionAsync(async () => {
            const statement = await db.prepareAsync('insert into Photos (uri, date_taken) values ($uri, $dateTaken)');
            for (const oldUri of uris) {
                let newUri;
                do {
                    newUri = documentDirectory + generateRandomString(20);
                } while ((await getInfoAsync(newUri)).exists);
                try {
                    copyAsync({ from: oldUri, to: newUri });
                    statement.executeAsync({ $uri: newUri, $dateTaken: dateTakenIso });
                } catch (e) {
                    console.log('Could not copy photo or store it in database:', e);
                }
            }
        })

        await this.refresh(db);
    }
}

const PhotoStoreContext = createContext<undefined | [Store, React.Dispatch<React.SetStateAction<Store>>]>(undefined);

function useStoreContext() {
    const found = useContext(PhotoStoreContext);
    if (found)
        return found;
    throw new Error("Store is undefined.");

}

export { PhotoItem, Store, LocalPhotoStore, PhotoStoreContext, useStoreContext, DummyPhotoStore };