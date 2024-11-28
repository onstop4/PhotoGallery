import isMobile from "helpers/isMobile";

function trySQLiteContext() {
    return isMobile ? require("expo-sqlite").useSQLiteContext() : null;
}

export default trySQLiteContext;