/*
 * Timer da 90 secondi, che allo scadere chiama onExpire (una sola volta).
 */

//Riceve seconds (i secondi iniziali) e onExpire (cosa fare a tempo zero), entrambi obbligatori, da NavHeader, che a sua volta li prende dal TimerContext.
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { useMusic } from "../contexts/MusicContext.js";
import "./CountdownTimer.css";

function CountdownTimer(props) {
    const [remaining, setRemaining] = useState(props.seconds); // i secondi rimasti, inizializzato a props.seconds (90). È lo stato che cambia ogni secondo e fa ridisegnare il numero.
    const { playTime, stopTime } = useMusic();

    // Scala di 1 ogni secondo.
    useEffect(() => {
        if (remaining <= 0) return;
        const id = setTimeout(() => setRemaining(remaining => remaining - 1), 1000); // programma di scalare di 1 dopo 1 secondo
        //setTimeout è una funzione del browser che ha questa firma: const id = setTimeout(funzioneDaEseguire, millisecondiDiAttesa);
        return () => clearTimeout(id);  //cancella il timeout programmato.
    }, [remaining]); //l'effetto si riesegue ogni volta che remaining cambia

    // Allo scadere, chiama onExpire una sola volta.
    useEffect(() => {
        if (remaining === 0) {
            props.onExpire();
        }
    }, [remaining]);

    // Negli ultimi 10 secondi parte la musica del tempo; si ferma quando il timer sparisce.
    // Nella partita guidata (silent) il suono è disattivato: non c'è un limite di tempo vero.
    useEffect(() => {
        if (remaining === 10 && !props.silent) playTime();
    }, [remaining, playTime, props.silent]);
    useEffect(() => {
        return () => stopTime();
    }, [stopTime]);

    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0"); //remaining è un numero di secondi (es. 90). Per ottenere i minuti lo divido per 60 e arrotondo per difetto
    //padStart: "01" (se la stringa è più corta di 2 caratteri, aggiunge degli "0" davanti finché non arriva a 2)
    const seconds = String(remaining % 60).padStart(2, "0");
    const urgent = remaining <= 10; //Stile allarme (rosso + lampeggio) solo negli ultimi 10 secondi

    return (
        <div className={`timer ${urgent ? "timer-urgent" : ""}`}>
            {minutes}:{seconds}
        </div>
    );
}

CountdownTimer.propTypes = {
    seconds: PropTypes.number.isRequired,
    onExpire: PropTypes.func.isRequired,
    silent: PropTypes.bool,
};

export default CountdownTimer;