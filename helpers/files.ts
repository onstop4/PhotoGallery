import { EncodingType, readAsStringAsync } from "expo-file-system";
import { decode } from "base64-arraybuffer";

async function readFile(uri: string) {
    const fileContentsAsBase64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    return decode(fileContentsAsBase64);
}

export { readFile };