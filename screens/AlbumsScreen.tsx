import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Session } from "@supabase/supabase-js";
import AlbumList from "components/AlbumList";
import { useSQLiteContext } from "expo-sqlite";
import { Album, useAlbumStoreContext } from "helpers/albums";
import ParamList from "helpers/paramlists";
import { supabase } from "helpers/supabase";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, List, Menu, Modal, Portal, RadioButton, Text, TextInput } from "react-native-paper";

type AlbumsScreenProps = NativeStackScreenProps<ParamList, "AlbumsScreen">;

function AlbumsScreen({ navigation }: AlbumsScreenProps) {
    const db = useSQLiteContext();
    const albumStore = useAlbumStoreContext();
    const [localAlbums, setLocalAlbums] = useState<Album[]>([]);
    const [onlineAlbums, setOnlineAlbums] = useState<Album[]>([]);
    const [menuVisible, setMenuVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const [albumNameField, setAlbumNameField] = useState("");
    const [albumOnlineStatusField, setAlbumOnlineStatusField] = useState<"local" | "public" | "private">("local");

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const [session, setSession] = useState<Session | null>(null)

    // useEffect(() => {
    //     supabase.auth.getSession().then(({ data: { session }, error }) => {
    //         setSession(session)
    //         resetAlbums();
    //     })

    supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
    })
    // }, [])

    async function resetAlbums() {
        setLocalAlbums(await albumStore.getAllLocal(db));
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setOnlineAlbums(await albumStore.getAllOnline(session));
    }

    // useFocusEffect(useCallback(() => {
    //     resetAlbums();
    // }, []));

    useEffect(() => { resetAlbums() }, [session])

    useFocusEffect(() => { resetAlbums() });

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
                {localAlbums.length > 0 && <List.Section>
                    <List.Subheader>Local albums</List.Subheader>
                    <AlbumList albums={localAlbums} action={(album) => navigation.navigate("AlbumPhotosScreen", { album })} />
                </List.Section>}
                {onlineAlbums.length > 0 && <List.Section>
                    <List.Subheader>Online albums</List.Subheader>
                    <AlbumList albums={onlineAlbums} action={(album) => navigation.navigate("AlbumPhotosScreen", { album })} />
                </List.Section>}
            </View>
        </ScrollView>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <TextInput value={albumNameField} onChangeText={setAlbumNameField} placeholder="Album name" />
            <RadioButton.Item label="Local" value="local" status={albumOnlineStatusField == "local" ? "checked" : "unchecked"} onPress={() => setAlbumOnlineStatusField("local")} />
            <RadioButton.Item label="Online and public" value="" status={albumOnlineStatusField == "public" ? "checked" : "unchecked"} onPress={() => setAlbumOnlineStatusField("public")} />
            <RadioButton.Item label="Online and private" value="" status={albumOnlineStatusField == "private" ? "checked" : "unchecked"} onPress={() => setAlbumOnlineStatusField("private")} />
            <Button onPress={async () => {
                if (session && albumOnlineStatusField != "local")
                    await albumStore.createOnlineAlbum(session, albumNameField, albumOnlineStatusField);
                else
                    await albumStore.createLocalAlbum(db, albumNameField);
                setAlbumNameField("");
                hideModal();
                await resetAlbums();
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