/*
 * Overlay del tutorial guidato (prima partita).
 * Mostra uno sfondo scuro e una scheda "coach" con il passo corrente.
 * L'elemento da illuminare viene alzato sopra lo sfondo da PlanningView (classe tut-lit).
 */
import PropTypes from "prop-types";
import "./TutorialOverlay.css";

const STEPS = {
    1: { title: "Partenza e Arrivo", text: "Qui trovi la tua missione: la stazione di partenza e quella di arrivo. Devi costruire un percorso che le colleghi.", button: "Continua" },
    2: { title: "Dove sono sulla mappa", text: "Eccole sulla mappa: la partenza (Versailles) e l'arrivo (Montparnasse).", button: "Continua" },
    3: { title: "Scegli le tratte", text: "Dall'elenco \"Tutte le tratte\" aggiungi la tratta suggerita qui sotto.", button: null },
    4: { title: "Prima tratta aggiunta!", text: "La tratta è comparsa nel tuo percorso. Ora aggiungi la seconda tratta suggerita.", button: null },
    5: { title: "Ora tocca a te!", text: "Le tratte si possono riordinare trascinandole (drag & drop). Mancano solo gli ultimi metri: chiudi il tutorial, aggiungi da solo l'ultima tratta fino a Montparnasse e premi «Scappa adesso!» per vincere.", button: "Ho capito, gioco!" },
};

function TutorialOverlay(props) {
    const s = STEPS[props.step];
    if (!s) return null;
    return (
        <>
            <div className="tut-backdrop" />
            <div className="tut-coach">
                <div className="tut-coach-step">Tutorial · {props.step}/5</div>
                <h3 className="tut-coach-title">{s.title}</h3>
                <p className="tut-coach-text">{s.text}</p>
                {props.step === 3 && props.firstName &&
                    <div className="tut-coach-hint"><i className="bi bi-plus-circle-fill" /> {props.firstName}</div>}
                {props.step === 4 && props.secondName &&
                    <div className="tut-coach-hint"><i className="bi bi-plus-circle-fill" /> {props.secondName}</div>}
                <div className="tut-coach-actions">
                    {s.button
                        ? <button className="tut-coach-btn" onClick={props.step === 5 ? props.onFinish : props.onContinue}>{s.button}</button>
                        : <span className="tut-coach-wait">In attesa della tua mossa…</span>}
                    <button className="tut-coach-skip" onClick={props.onSkip}>Salta tutorial</button>
                </div>
            </div>
        </>
    );
}

TutorialOverlay.propTypes = {
    step: PropTypes.number,
    firstName: PropTypes.string,
    secondName: PropTypes.string,
    onContinue: PropTypes.func,
    onFinish: PropTypes.func,
    onSkip: PropTypes.func,
};

export default TutorialOverlay;
