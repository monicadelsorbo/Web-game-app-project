/*
 * Gestore della musica del gioco.
 * - musica.mp3: sottofondo della partita, in LOOP (riparte da capo quando finisce).
 * - gameOver.mp3 / victory.mp3 / levelUp.mp3: musichette che si sentono UNA volta.
 * - buttonPress.mp3: suono dei tasti (effetto, può sovrapporsi).
 * On/off agisce come muto (istantaneo); il volume vale per tutte le tracce.
 */
import PropTypes from "prop-types";
import { useState, useRef, useEffect, useCallback } from "react";
import MusicContext from "../contexts/MusicContext.js";

function MusicProvider(props) {
    const [musicOn, setMusicOn] = useState(true); // musica attiva/disattiva (muto)
    const [volume, setVolume] = useState(0.5);     // volume 0..1

    const gameRef = useRef(null);     // sottofondo della partita (loop)
    const gameOverRef = useRef(null); // sconfitta (una volta)
    const victoryRef = useRef(null);  // vittoria (una volta)
    const levelUpRef = useRef(null);  // salita di livello (una volta)
    const buttonRef = useRef(null);   // suono dei tasti
    const timeRef = useRef(null);     // musica degli ultimi 10 secondi
    const coinRef = useRef(null);     // suono moneta guadagnata
    const catRef = useRef(null);      // suono dell'evento gatto
    const volRef = useRef(volume);    // copia aggiornata del volume per le funzioni "stabili"

    // crea gli oggetti audio una sola volta (init "pigro", così sono pronti subito)
    if (!gameRef.current) {
        gameRef.current = new Audio("/musica.mp3");
        gameRef.current.loop = true;   // lo sfondo riparte da capo quando finisce
        gameOverRef.current = new Audio("/gameOver.mp3");
        victoryRef.current = new Audio("/victory.mp3");
        levelUpRef.current = new Audio("/levelUp.mp3");
        buttonRef.current = new Audio("/buttonPress.mp3");
        timeRef.current = new Audio("/time.mp3");
        coinRef.current = new Audio("/coin.mp3");
        catRef.current = new Audio("/cat.mp3");
        [gameRef, gameOverRef, victoryRef, levelUpRef, buttonRef, timeRef, coinRef, catRef].forEach((r) => { r.current.volume = volRef.current; });
    }

    const allRefs = [gameRef, gameOverRef, victoryRef, levelUpRef, buttonRef, timeRef, coinRef, catRef];

    // alla rimozione del provider, ferma tutta la musica
    useEffect(() => {
        return () => allRefs.forEach((r) => r.current && r.current.pause());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // on/off = muto/non-muto su tutte le tracce: istantaneo, niente riavvii
    useEffect(() => {
        allRefs.forEach((r) => { if (r.current) r.current.muted = !musicOn; });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [musicOn]);

    // applica il volume a tutte le tracce in tempo reale
    useEffect(() => {
        volRef.current = volume;
        allRefs.forEach((r) => { if (r.current) r.current.volume = volume; });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [volume]);

    // ferma tutte le tracce musicali (tranne il suono dei tasti)
    const stopCues = () => [gameRef, gameOverRef, victoryRef, levelUpRef].forEach((r) => r.current && r.current.pause());
    // ferma solo le musichette di fine partita (non il sottofondo): usata per il level up, che suona "sopra" lo sfondo
    const stopEndCues = () => [gameOverRef, victoryRef].forEach((r) => r.current && r.current.pause());

    // avvia una musichetta una sola volta (da capo)
    const playOnce = (ref) => {
        if (!ref.current) return;
        ref.current.currentTime = 0;
        ref.current.volume = volRef.current;
        ref.current.play().catch(() => { });
    };

    const stopGame = useCallback(() => { if (gameRef.current) gameRef.current.pause(); }, []);
    const playGame = useCallback(() => {
        [gameOverRef, victoryRef].forEach((r) => r.current && r.current.pause()); // lascia suonare il level up sopra
        if (!gameRef.current) return;
        gameRef.current.volume = volRef.current;
        gameRef.current.play().catch(() => { }); // ignora il blocco autoplay del browser
    }, []);
    const stopAll = useCallback(() => allRefs.forEach((r) => r.current && r.current.pause()), []); // eslint-disable-line react-hooks/exhaustive-deps
    const playGameOver = useCallback(() => { stopCues(); playOnce(gameOverRef); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const playVictory = useCallback(() => { stopCues(); playOnce(victoryRef); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const playLevelUp = useCallback(() => { stopEndCues(); playOnce(levelUpRef); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const playButton = useCallback(() => playOnce(buttonRef), []); // eslint-disable-line react-hooks/exhaustive-deps
    const playTime = useCallback(() => playOnce(timeRef), []); // eslint-disable-line react-hooks/exhaustive-deps
    const stopTime = useCallback(() => { if (timeRef.current) { timeRef.current.pause(); timeRef.current.currentTime = 0; } }, []); // ferma e riavvolge (così non "sfora")
    const playCoin = useCallback(() => playOnce(coinRef), []); // eslint-disable-line react-hooks/exhaustive-deps
    const playCat = useCallback(() => playOnce(catRef), []); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        musicOn, setMusicOn, volume, setVolume,
        playGame, stopGame, stopAll, playGameOver, playVictory, playLevelUp, playButton,
        playTime, stopTime, playCoin, playCat,
    };

    return <MusicContext.Provider value={value}>{props.children}</MusicContext.Provider>;
}

MusicProvider.propTypes = {
    children: PropTypes.node,
};

export default MusicProvider;
