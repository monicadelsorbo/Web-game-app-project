/*
Mostra il percorso in costruzione (le tratte scelte, in ordine) e permette di riordinarle col drag & drop e di rimuoverle. 
*/

//Riceve props da PlanningView:
// - selectedTracts: l'array di tratte già scelte (ognuna con dentro a e b)
// - departureName e arrivalName: i nomi di partenza e arrivo (per la scritta "Missione")
// - onReset: callback per azzerare il percorso
// - onRemoveAt(i): callback quando clicchi la X per rimuovere la i-esima tratta
// - onMove(from, to): callback quando sposti (drag & drop) una tratta

import PropTypes from "prop-types";
import { useState, Fragment } from "react";
import { Button } from "react-bootstrap";
import { useMusic } from "../../contexts/MusicContext.js";
import "./RouteBuilder.css";

function RouteBuilder(props) {
    const { selectedTracts, departureName, arrivalName, onReset, onRemoveAt, onMove } = props;
    const { playButton } = useMusic();
    const [dragIndex, setDragIndex] = useState(null);   // tratta trascinata
    const [overIndex, setOverIndex] = useState(null);   // tratta sopra cui sto passando (sono entrambe null quando non si sta trascinando nulla)

    //Usa le API native del browser per il drag & drop
    //Quando inizi a trascinare la tratta in posizione i: 
    // la memorizza in dragIndex, e configura l'oggetto dataTransfer del browser (dice che è uno "spostamento" e ci salva l'indice). 
    // e è l'evento del browser.
    const handleDragStart = (e, i) => {
        setDragIndex(i);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", String(i));
    };

    //Mentre passi sopra la posizione i: e.preventDefault() è obbligatorio, perché di default il browser non permette di 
    // "lasciar cadere" un elemento; chiamandolo, abiliti il drop. Poi memorizza overIndex = i (per mostrare dove finirebbe).
    const handleDragOver = (e, i) => {
        e.preventDefault();      // permette il drop
        setOverIndex(i);         // memorizzo dove andrebbe inserita
    };

    //Quando rilasci sulla posizione i: se stavi trascinando qualcosa (dragIndex !== null) e non lo stai lasciando sulla stessa posizione (dragIndex !== i),
    // chiama onMove(dragIndex, i) → cioè moveTract di GamePage, che sposta davvero la tratta da dragIndex a i. Poi azzera i due stati. 
    const handleDrop = (i) => {
        if (dragIndex !== null && dragIndex !== i) onMove(dragIndex, i);
        setDragIndex(null);
        setOverIndex(null);
    };

    //Se il trascinamento finisce (anche annullato), pulisce gli stati.
    const handleDragEnd = () => { setDragIndex(null); setOverIndex(null); };

    return (
        <div>
            <p className="route-mission">
                <strong>Missione:</strong>{" "}
                <span className="mission-pill mission-dep">{departureName}</span>
                <span className="mission-arrow">→</span>
                <span className="mission-pill mission-arr">{arrivalName}</span>
            </p>

            <div className="route-selected">
                {selectedTracts.length === 0 &&
                    <span className="route-empty">Nessuna tratta scelta.</span>}
                {selectedTracts.map((t, i) => (
                    <Fragment key={i}>{/*Fragment (<></> per esteso) raggruppa più elementi (la "linea di rilascio" + la riga) senza aggiungere un <div> extra nel DOM*/}
                        {dragIndex !== null && overIndex === i && <div className="drop-line" />} {/* mostra una lineetta blu solo mentre trascini (dragIndex !== null) e solo sopra la posizione corrente (overIndex === i)*/}
                        <div className={`route-item ${dragIndex === i ? "route-item-dragging" : ""}`}
                            draggable //Questo atttributo nel div rende la riga "trascinabile", e React/JS capisce che deve chiamare le funzioni che iniziano con handleDrag... 
                            onDragStart={(e) => handleDragStart(e, i)}
                            onDragOver={(e) => handleDragOver(e, i)}
                            onDrop={() => handleDrop(i)}
                            onDragEnd={handleDragEnd}>
                            <span className="route-item-num">{i + 1}</span>
                            <span className="route-item-text">{t.a.name} — {t.b.name}</span>
                            <button className="route-item-x" onClick={() => onRemoveAt(i)}
                                aria-label="Rimuovi tratta">×</button>
                        </div>
                    </Fragment>
                ))}
            </div>

            <div className="route-actions">
                <Button size="sm" variant="outline-danger" onClick={() => { playButton(); onReset(); }}
                    disabled={selectedTracts.length === 0}>Azzera</Button>
            </div>
        </div>
    );
}

RouteBuilder.propTypes = {
    selectedTracts: PropTypes.array.isRequired,
    departureName: PropTypes.string,
    arrivalName: PropTypes.string,
    onReset: PropTypes.func.isRequired,
    onRemoveAt: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
};

export default RouteBuilder;