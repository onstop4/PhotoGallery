import isMobile from "helpers/isMobile";
import { Alert } from "react-native";

// Based on https://stackoverflow.com/a/72554509.

const webAlert = (title: string, message?: string) => window.alert(message ? `${title} ${message}` : title);

const alert = isMobile ? Alert.alert : webAlert;

export default alert;
