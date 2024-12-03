import React, { useEffect, useState } from 'react'
import { StyleSheet, View, AppState, Button, Text } from 'react-native'
import { supabase } from 'helpers/supabase';
import { TextInput } from 'react-native-paper';
import { Session } from '@supabase/supabase-js';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ParamList from 'helpers/paramlists';

type PublicAlbumInputScreenProps = NativeStackScreenProps<ParamList, "PublicAlbumInputScreen">;

export default function PublicAlbumInputScreen({ navigation }: PublicAlbumInputScreenProps) {
    const [accessKey, setAccessKey] = useState("");

    return (
        <View style={styles.container}>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <TextInput
                    label="Public album access key"
                    onChangeText={(text) => setAccessKey(text)}
                    value={accessKey}
                    autoCapitalize={'none'}
                />
            </View>
            <View style={[styles.verticallySpaced, styles.mt20]}>
                <Button title="View photos" onPress={() => { setAccessKey(""); navigation.navigate("PublicAlbumPhotosScreen", { accessKey: accessKey }); }} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginTop: 40,
        padding: 12,
    },
    verticallySpaced: {
        paddingTop: 4,
        paddingBottom: 4,
        alignSelf: 'stretch',
    },
    mt20: {
        marginTop: 20,
    },
})