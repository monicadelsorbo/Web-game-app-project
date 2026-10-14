/*
 * Elenco di TUTTE le tratte (coppie di stazioni). Ogni tratta è selezionabile
 * una sola volta: quelle già usate appaiono spente e non ri-cliccabili.
 */

//RIceve tre props da PlanningView:
//tracts: array di tratte da mostrare
//selectedIds: lista degli id di tratte già aggiunte al percorso
//onAdd: callback da chiamare quando si clicca "Aggiungi" (passandogli l'id della tratta).
import PropTypes from "prop-types";
import { useMusic } from "../../contexts/MusicContext.js";
import "./TractList.css";

function TractList(props) {
    const { tracts, selectedIds, onAdd } = props;
    const { playButton } = useMusic();
    const available = tracts.filter((t) => !selectedIds.includes(t.id)); //filtra solo le tratte non ancora usate
    return (
        <div className="tract-list">
            {available.length === 0 &&
                <span className="route-empty">Nessuna tratta disponibile.</span>}
            {available.map((t) => ( //trasforma ogni tratta in un pezzo di interfaccia (una riga).
                <div key={t.id} className="tract-row">
                    <span className="tract-text">{t.a.name} — {t.b.name}</span>
                    <button className="tract-add" onClick={() => { playButton(); onAdd(t.id); }}>Aggiungi</button>
                </div>
            ))}
        </div>
    );
}

TractList.propTypes = {
    tracts: PropTypes.array.isRequired,
    selectedIds: PropTypes.array.isRequired,
    onAdd: PropTypes.func.isRequired,
};

export default TractList;