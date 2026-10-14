/*
 * Schermata a tutto schermo mostrata allo scadere del tempo, prima dell'esecuzione.
 * Scorre dentro, mostra "Tempo scaduto", poi scorre via e chiama onDone (-> esecuzione).
 */
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import "./GateAnimation.css";

function TimeUpAnimation(props) {
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        const t1 = setTimeout(() => setExiting(true), 1600);  // resta visibile ~1.6s, poi scorre via
        const t2 = setTimeout(() => props.onDone(), 2100);    // a scorrimento finito -> esecuzione
        return () => { clearTimeout(t1); clearTimeout(t2); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`gate gate-timeup ${exiting ? "gate-exit" : ""}`}>
            <div className="gate-inner">
                <div className="gate-timeup-text">Tempo scaduto</div>
            </div>
        </div>
    );
}

TimeUpAnimation.propTypes = {
    onDone: PropTypes.func.isRequired,
};

export default TimeUpAnimation;
