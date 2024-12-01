import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useStoreContext } from 'helpers/contexts';
import ParamList from 'helpers/paramlists';
import { useState, useRef } from 'react';
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image
} from 'react-native';

type CameraScreenProps = NativeStackScreenProps<ParamList, "CameraScreen">;

function CameraScreen({ navigation }: CameraScreenProps) {
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const cameraRef = useRef<any>(null);

    const [store, setStore] = useStoreContext();

    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>
                    We need your permission to show the camera
                </Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing((current) => (current === 'back' ? 'front' : 'back'));
    }

    async function takePicture() {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync();
                setPhotoUri(photo.uri);
            } catch (error) {
                console.error('Failed to take picture:', error);
            }
        }
    }

    async function savePhoto() {
        if (photoUri) {
            setStore(await store.addNewPhotos([{ uri: photoUri, dateTaken: new Date() }]))
        }
        navigation.goBack();
    }

    function cancel() {
        navigation.goBack();
    }

    return (
        <View style={styles.container}>
            {photoUri ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: photoUri }} style={styles.preview} />
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setPhotoUri(null)}>
                            <Text style={styles.text}>Take Another</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={savePhoto}>
                            <Text style={styles.text}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={cancel}>
                            <Text style={styles.text}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={toggleCameraFacing}>
                            <Text style={styles.text}>Flip</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={takePicture}>
                            <Text style={styles.text}>Take Photo</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            )}
        </View>
    );
}

export default CameraScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
        margin: 5,
        borderRadius: 5,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    previewContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    preview: {
        flex: 1,
        resizeMode: 'contain',
    },
});