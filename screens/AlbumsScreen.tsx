import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Session } from "@supabase/supabase-js";
import AlbumList from "components/AlbumList";
import { Album, AlbumStore, useAlbumStoreContext } from "helpers/albums";
import ParamList from "helpers/paramlists";
import trySQLiteContext from "helpers/sqlite";
import { supabase } from "helpers/supabase";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, List, Menu, Modal, Portal, RadioButton, Text, TextInput } from "react-native-paper";

type AlbumsScreenProps = NativeStackScreenProps<ParamList, "AlbumsScreen">;

function AlbumsScreen({ navigation }: AlbumsScreenProps) {
    const db = trySQLiteContext();
    const [menuVisible, setMenuVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [albumStore, setAlbumStore] = useAlbumStoreContext();
    const [session, setSession] = useState<Session | null>(null);

    const [albumNameField, setAlbumNameField] = useState("");
    const [albumOnlineStatusField, setAlbumOnlineStatusField] = useState<"local" | "public" | "private">("local");

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
        })

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
    }, [])

    useEffect(() => {
        (async () => {
            let albumStore = await new AlbumStore();

            if (db)
                setAlbumStore(await albumStore.refreshLocal(db));

            if (session)
                setAlbumStore(await albumStore.refreshOnline());
        })();
    }, [session]);

    useFocusEffect(() => {
        navigation.setOptions({
            headerRight: () =>
                <Menu
                    visible={menuVisible}
                    onDismiss={closeMenu}
                    anchor={<IconButton
                        icon="dots-vertical"
                        size={30}
                        onPress={openMenu}
                    />}
                    anchorPosition="bottom">
                    <Menu.Item onPress={() => {
                        showModal();
                    }} title="Create new album" />
                </Menu>

        })
    })

    return (<>
        <ScrollView>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {albumStore?.localAlbums.length > 0 && <List.Section>
                    <List.Subheader>Local albums</List.Subheader>
                    <AlbumList albums={albumStore.localAlbums} action={(album) => navigation.navigate("AlbumPhotosScreen", { album })} />
                </List.Section>}
                {albumStore?.onlineAlbums.length > 0 && <List.Section>
                    <List.Subheader>Online albums</List.Subheader>
                    <AlbumList albums={albumStore.onlineAlbums} action={(album) => navigation.navigate("AlbumPhotosScreen", { album })} />
                </List.Section>}
                {albumStore?.localAlbums.length === 0 && albumStore?.onlineAlbums.length === 0 && <Text>You don't have any albums.</Text>}
            </View>
        </ScrollView>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <TextInput value={albumNameField} onChangeText={setAlbumNameField} placeholder="Album name" />
            {db && <RadioButton.Item label="Local" value="local" status={albumOnlineStatusField == "local" ? "checked" : "unchecked"} onPress={() => setAlbumOnlineStatusField("local")} />}
            {session && <>
                <RadioButton.Item label="Online and public" value="public" status={albumOnlineStatusField == "public" ? "checked" : "unchecked"} onPress={() => setAlbumOnlineStatusField("public")} />
                <RadioButton.Item label="Online and private" value="private" status={albumOnlineStatusField == "private" ? "checked" : "unchecked"} onPress={() => setAlbumOnlineStatusField("private")} />
            </>}
            <Button onPress={async () => {
                if (session && albumOnlineStatusField != "local")
                    setAlbumStore(await albumStore?.createOnlineAlbum(session, albumNameField, albumOnlineStatusField));
                else if (db)
                    setAlbumStore(await albumStore?.createLocalAlbum(db, albumNameField));
                setAlbumNameField("");
                hideModal();
            }}><Text>Okay</Text></Button>
            <Button onPress={() => {
                setAlbumNameField("");
                hideModal();
            }}><Text>Cancel</Text></Button>
        </Modal>
    </>
    );
}

export default AlbumsScreen;

const styles = StyleSheet.create({
    modalContainer: { backgroundColor: 'white', padding: 20 }
});