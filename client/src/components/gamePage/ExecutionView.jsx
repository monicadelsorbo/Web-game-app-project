//Riceve 5 props da GamePage:
// - result: l'esito calcolato dal server (validità, punteggio finale, i steps cioè i passi del percorso, eventuale nuovo record).
// - stations, tracts → i dati per disegnare la mappa.
// - departure → la stazione di partenza (con il bottino rubato).
// - onPlayAgain → la callback per rigiocare.
import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import ExecutionMap from "./ExecutionMap.jsx";
import EventCard from "./EventCard.jsx";
import ResultView from "./ResultView.jsx";
import "./ExecutionView.css";

const STARTING_COINS = 20;
const LINE_MS = 900;

function ExecutionView(props) {
    const { result, stations, tracts, departure, onPlayAgain } = props;
    const steps = result.steps || [];
    const [step, setStep] = useState(0); //indice del passo corrente
    const [revealed, setRevealed] = useState(false); //indica se l'evento del passo è stato rivelato (per l'animazione)
    const [finished, setFinished] = useState(false); //indica se siamo arrivati alla fine

    useEffect(() => {
        if (result.valid) {
            setRevealed(false); // all'inizio del passo l'evento è nascosto.
            const id = setTimeout(() => setRevealed(true), LINE_MS); //dopo 900 ms (il tempo per "percorrere" la tratta sulla mappa) rivela l'evento.
            return () => clearTimeout(id);
        }
    }, [step, result.valid]);

    if (!result.valid) {
        return <ResultView won={false} onPlayAgain={onPlayAgain} />;
    }

    const current = steps[step];
    const coinsBefore = step > 0 ? steps[step - 1].coinsAfter : STARTING_COINS;
    const coins = revealed ? current.coinsAfter : coinsBefore;
    const isLast = step >= steps.length - 1;
    const handleNext = () => { if (isLast) setFinished(true); else setStep(step + 1); };//se siamo all'ultimo passo, segna finished = true (mostra il risultato finale); altrimenti passa al passo successivo (step + 1).

    return (
        <div className="exec">
            <div className="exec-topbar">
                {departure && ( //mostra il bottino solo se departure esiste e poi il contatore delle monete
                    <span className="exec-loot">
                        Sei riuscito a rubare <strong>{departure.loot}</strong> a <strong>{departure.name}</strong>!
                    </span>
                )}
                <div className="exec-coins"><i className="bi bi-coin" /> {coins}</div>
            </div>

            <div className="exec-grid">
                {/*steps è il percorso completo, step è il numero del passo a cui siamo*/}
                <ExecutionMap stations={stations} tracts={tracts} steps={steps} step={step} />
                <EventCard current={current} step={step} total={steps.length}
                    revealed={revealed} isLast={isLast} onNext={handleNext} />
            </div>

            {finished && ( //mostra la ResultView di vittoria solo quando finished è true
                <ResultView won={true} score={result.finalScore}
                    newRecord={result.newRecord} onPlayAgain={onPlayAgain} />
            )}
        </div>
    );
}

ExecutionView.propTypes = {
    result: PropTypes.object.isRequired,
    stations: PropTypes.array.isRequired,
    tracts: PropTypes.array.isRequired,
    departure: PropTypes.object,
    onPlayAgain: PropTypes.func.isRequired,
};

export default ExecutionView;