import { Platform } from "react-native";

const isMobile = Platform.OS == "android" || Platform.OS == "ios";

export default isMobile;
