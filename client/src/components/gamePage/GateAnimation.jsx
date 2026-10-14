/*
 * Schermata a tutto schermo mostrata prima della pianificazione.
 * Scorre da destra, mostra "Sei pronto a giocare?" con il conto 3, 2, 1, VIA!,
 * poi scorre via e chiama onDone (che fa partire la pianificazione).
 */
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import "./GateAnimation.css";

const SEQ = ["3", "2", "1", "VIA!"];
const STEP_MS = 800;   // durata di ogni numero

function GateAnimation(props) {
    const [label, setLabel] = useState(SEQ[0]); // numero/parola mostrata al centro
    const [exiting, setExiting] = useState(false); // true quando la schermata scorre via

    useEffect(() => {
        const timers = [];
        // cambia il numero a ogni intervallo (3 -> 2 -> 1 -> VIA!)
        for (let k = 1; k < SEQ.length; k++)
            timers.push(setTimeout(() => setLabel(SEQ[k]), k * STEP_MS));
        // dopo "VIA!" la schermata scorre via
        timers.push(setTimeout(() => setExiting(true), SEQ.length * STEP_MS));
        // a scorrimento finito, avvisa il genitore (-> pianificazione)
        timers.push(setTimeout(() => props.onDone(), SEQ.length * STEP_MS + 500));
        return () => timers.forEach(clearTimeout); // pulizia: annulla i timeout pendenti
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`gate ${exiting ? "gate-exit" : ""}`}>
            <div className="gate-inner">
                <div className="gate-q">Sei pronto a giocare?</div>
                <div className="gate-count" key={label}>{label}</div>
            </div>
        </div>
    );
}

GateAnimation.propTypes = {
    onDone: PropTypes.func.isRequired,
};

export default GateAnimation;
