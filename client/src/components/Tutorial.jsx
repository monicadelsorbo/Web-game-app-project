/*
 * Mini tutorial mostrato una volta ai nuovi utenti, subito dopo la registrazione.
 * Spiega in breve le fasi del gioco. Si chiude col pulsante.
 */
import PropTypes from "prop-types";
import "./Tutorial.css";

function Tutorial(props) {
    return (
        <div className="tut-overlay">
            <div className="tut-card">
                <h2 className="tut-title">Benvenuto, ladro!</h2>
                <p className="tut-sub">Ecco come funziona il colpo:</p>
                <ol className="tut-steps">
                    <li><strong>Scegli la difficoltà</strong> e studia la mappa della metro nel sopralluogo.</li>
                    <li><strong>90 secondi</strong> per costruire il percorso: aggiungi le tratte giuste dalla partenza all'arrivo, cambiando linea solo nelle stazioni di interscambio.</li>
                    <li><strong>Scappa col bottino!</strong> Lungo il tragitto eventi casuali ti fanno guadagnare o perdere monete. Più la partita è difficile, più sali di livello.</li>
                </ol>
                <p className="tut-tip">Suggerimento: in pianificazione puoi premere <kbd>Invio</kbd> per scappare ed <kbd>Esc</kbd> per uscire.</p>
                <button className="tut-btn" onClick={props.onClose}>Ho capito, si comincia!</button>
            </div>
        </div>
    );
}

Tutorial.propTypes = {
    onClose: PropTypes.func.isRequired,
};

export default Tutorial;
