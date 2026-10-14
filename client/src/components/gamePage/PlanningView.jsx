//Riceve props da GamePage:
//game: l'oggetto partita che contiene partenza, arrivo, tratte totali e id.
//selected: un array di id che rappresenta il percorso scelto finora.
//onAdd, onRemoveAt, onMove: funzioni per modificare il percorso (aggiungere/rimuovere/spostare tratte).
//onReset: resetta il percorso.
//onSubmit: invia il percorso al server.
import PropTypes from "prop-types";
import { useMusic } from "../../contexts/MusicContext.js";
import NetworkMap from "./NetworkMap.jsx";
import RouteBuilder from "./RouteBuilder.jsx";
import TractList from "./TractList.jsx";

import "./PlanningView.css";

function PlanningView(props) {
    const { game, selected, onAdd, onRemoveAt, onMove, onReset, onSubmit, tutorialStep } = props;
    const { playButton } = useMusic();

    const tractById = {};
    game.tracts.forEach((t) => { tractById[t.id] = t; }); //costruisce un dizionario (un oggetto) che mappa id → tratta.
    const selectedTracts = selected.map((id) => tractById[id]); //trasforma l'array di id selected in un array di oggetti tratte (per poterli passare a RouteBuilder)

    // tutorial: al passo 2 illumino la mappa, negli altri passi il pannello del percorso
    const litMap = tutorialStep === 2;
    const litRoute = tutorialStep != null && tutorialStep !== 2;

    return (
        <div className="plan">
            <div className="plan-grid">
                <div className="plan-left">
                    <div className={`panel panel-map ${litMap ? "tut-lit" : ""}`}>
                        <div className="panel-body">
                            <div className="map-wrap">
                                <NetworkMap stations={game.stations} showLines={false} />
                                {tutorialStep === 2 && (
                                    <>
                                        {/* frecce sulla partenza (Versailles) e l'arrivo (Montparnasse): posizioni in % del viewBox 1000x605 */}
                                        <div className="tut-arrow tut-arrow-dep" style={{ left: "7%", top: "89.3%" }}>
                                            <i className="bi bi-arrow-down-circle-fill" />
                                            <span className="tut-arrow-label">Partenza</span>
                                        </div>
                                        <div className="tut-arrow tut-arrow-arr" style={{ left: "41%", top: "93.4%" }}>
                                            <i className="bi bi-arrow-down-circle-fill" />
                                            <span className="tut-arrow-label">Arrivo</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button className="escape-btn" onClick={() => { playButton(); onSubmit(); }} disabled={selected.length === 0}>
                        {/* disabilita il bottone quando non hai ancora scelto nessuna tratta*/}
                        Scappa adesso!
                    </button>
                </div>

                <div className={`panel panel-route ${litRoute ? "tut-lit" : ""}`}>
                    <div className="panel-body">
                        <RouteBuilder selectedTracts={selectedTracts}
                            departureName={game.departure.name} arrivalName={game.arrival.name}
                            onReset={onReset} onRemoveAt={onRemoveAt} onMove={onMove} />
                        <h6 className="plan-subtitle">Tutte le tratte</h6>
                        <div className="tract-scroll">
                            <TractList tracts={game.tracts} selectedIds={selected} onAdd={onAdd} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

PlanningView.propTypes = {
    game: PropTypes.object.isRequired,
    selected: PropTypes.array.isRequired,
    onAdd: PropTypes.func.isRequired,
    onRemoveAt: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    tutorialStep: PropTypes.number,
};

export default PlanningView;