/*
 * Pagina di scelta della difficoltà, mostrata prima del Setup.
 * Al click su una difficoltà chiama onChoose(difficolta) e si passa al Setup.
 * Le schede si inclinano in 3D seguendo il mouse.
 */
import PropTypes from "prop-types";
import { useMusic } from "../../contexts/MusicContext.js";
import "./DifficultySelect.css";

function DifficultySelect(props) {
    const { playButton } = useMusic();

    // suono del tasto + scelta della difficoltà
    const choose = (d) => {
        playButton();
        props.onChoose(d);
    };

    // inclina la scheda in base alla posizione del mouse
    const tilt = (e) => {
        const el = e.currentTarget;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(600px) rotateY(${px * 16}deg) rotateX(${-py * 16}deg) translateY(-6px)`;
    };
    const resetTilt = (e) => { e.currentTarget.style.transform = ""; };

    return (
        <div className="diff">
            <h2 className="diff-title">Scegli la difficoltà della partita</h2>
            <p className="diff-sub">Più lungo è il percorso, più difficile è il colpo — e più vale per il tuo livello.</p>
            <div className="diff-buttons">
                <button className="diff-btn diff-facile" onMouseMove={tilt} onMouseLeave={resetTilt} onClick={() => choose("facile")}>
                    <span className="diff-btn-label">Facile</span>
                </button>
                <button className="diff-btn diff-medio" onMouseMove={tilt} onMouseLeave={resetTilt} onClick={() => choose("medio")}>
                    <span className="diff-btn-label">Medio</span>
                </button>
                <button className="diff-btn diff-difficile" onMouseMove={tilt} onMouseLeave={resetTilt} onClick={() => choose("difficile")}>
                    <span className="diff-btn-label">Difficile</span>
                </button>
            </div>
        </div>
    );
}

DifficultySelect.propTypes = {
    onChoose: PropTypes.func.isRequired,
};

export default DifficultySelect;
