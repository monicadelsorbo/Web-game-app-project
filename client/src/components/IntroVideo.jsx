/*
 * Video introduttivo mostrato all'apertura del sito (solo per utenti anonimi, sulla home).
 * Prima appare una schermata con il pulsante Play: il clic è il "gesto" che permette
 * di avviare il video CON audio (i browser bloccano l'audio in autoplay senza interazione).
 * Effetto "fumetto": dissolvenza dal nero in apertura e dissolvenza al nero in chiusura,
 * poi dal nero si rivela pian piano la homepage sotto.
 * Fasi: "start" (schermata Play) -> "opening" (nero -> video) -> "playing" -> "closing" (video -> nero) -> "revealing".
 */
import PropTypes from "prop-types";
import { useState, useRef } from "react";
import "./IntroVideo.css";

function IntroVideo(props) {
    const [stage, setStage] = useState("start");     // fase corrente
    const finishedRef = useRef(false);               // evita di chiudere due volte
    const videoRef = useRef(null);

    // L'utente avvia il video: essendo un clic, il browser permette l'audio.
    const startPlay = () => {
        const v = videoRef.current;
        if (v) {
            v.muted = false;
            v.currentTime = 0;
            v.play().catch(() => { /* se l'audio venisse bloccato, il video parte comunque */ });
        }
        setStage("opening");
        setTimeout(() => setStage("playing"), 40);   // dissolvenza dal nero
    };

    // chiusura (fine video o "Salta"): sfuma al nero, poi rivela la homepage
    const close = () => {
        if (finishedRef.current) return;
        finishedRef.current = true;
        setStage("closing");                         // il video sfuma verso il nero
        setTimeout(() => {
            setStage("revealing");                   // dal nero alla homepage
            setTimeout(() => props.onFinish(), 950); // a dissolvenza finita, rimuove l'overlay
        }, 1200);
    };

    // il velo è nero ovunque tranne durante la riproduzione (così non lampeggia)
    const veilBlack = stage !== "playing";

    return (
        <div className={`intro-video ${stage === "revealing" ? "intro-revealing" : ""}`}>
            <video ref={videoRef} className="intro-video-el" src="/Video.mp4"
                playsInline preload="auto"
                onEnded={close} />
            {/* velo nero per le dissolvenze in apertura/chiusura e per coprire il video fermo nella schermata iniziale */}
            <div className={`intro-veil ${veilBlack ? "intro-veil-black" : ""}`} />
            {/* schermata iniziale: pulsante Play (necessario per avere l'audio) */}
            {stage === "start" && (
                <div className="intro-start">
                    <h2 className="intro-start-title">Ultima Corsa</h2>
                    <button type="button" className="intro-play-btn" onClick={startPlay}>
                        <i className="bi bi-play-fill" /> Guarda l'intro
                    </button>
                    <button type="button" className="intro-start-skip" onClick={close}>Salta ›</button>
                </div>
            )}
            {/* "Salta" durante la riproduzione */}
            {stage === "playing" &&
                <button type="button" className="intro-skip" onClick={close}>Salta ›</button>}
        </div>
    );
}

IntroVideo.propTypes = {
    onFinish: PropTypes.func.isRequired,
};

export default IntroVideo;
