/*
 * Comando della musica (mostrato durante la partita): pulsante on/off + regolazione del volume.
 */
import { useMusic } from "../contexts/MusicContext.js";
import "./AudioControls.css";

function AudioControls() {
    const { musicOn, setMusicOn, volume, setVolume } = useMusic();

    return (
        <div className="audio-controls">
            <button className="audio-btn" onClick={() => setMusicOn((o) => !o)}
                aria-label={musicOn ? "Disattiva musica" : "Attiva musica"}>
                <i className={`bi ${musicOn ? "bi-volume-up-fill" : "bi-volume-mute-fill"}`} />
            </button>
            <input type="range" min="0" max="1" step="0.05" value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="audio-volume" aria-label="Volume musica" />
        </div>
    );
}

export default AudioControls;
