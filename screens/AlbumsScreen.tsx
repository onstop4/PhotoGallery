import { useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import AlbumList from "components/AlbumList";
import { useSQLiteContext } from "expo-sqlite";
import { Album, useAlbumStoreContext } from "helpers/albums";
import ParamList from "helpers/paramlists";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, Menu, Modal, Portal, Text, TextInput } from "react-native-paper";

type AlbumsScreenProps = NativeStackScreenProps<ParamList, "AlbumsScreen">;

function AlbumsScreen({ navigation }: AlbumsScreenProps) {
    const db = useSQLiteContext();
    const albumStore = useAlbumStoreContext();
    const [albums, setAlbums] = useState<undefined | Album[]>(undefined);

    const [menuVisible, setMenuVisible] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const [albumNameField, setAlbumNameField] = useState("");

    const openMenu = () => setMenuVisible(true);

    const closeMenu = () => setMenuVisible(false);

    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    useFocusEffect(() => {
        (async () => setAlbums(await albumStore.getAll(db)))();

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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {albums && <AlbumList albums={albums} action={(album) => navigation.navigate("AlbumPhotosScreen", { album })} />}
        </View>
        <Modal visible={modalVisible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <TextInput value={albumNameField} onChangeText={setAlbumNameField} placeholder="Album name" />
            <Button onPress={async () => {
                await albumStore.createAlbum(db, albumNameField);
                setAlbumNameField("");
                hideModal();
                setAlbums(await albumStore.getAll(db));
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