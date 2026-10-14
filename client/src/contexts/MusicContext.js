import React, { useContext } from "react";

// Context per la musica: stato on/off, volume e funzioni per avviare/fermare le tracce.
const MusicContext = React.createContext(null);

// Hook comodo per usare la musica nei componenti.
export function useMusic() {
    return useContext(MusicContext);
}

export default MusicContext;
