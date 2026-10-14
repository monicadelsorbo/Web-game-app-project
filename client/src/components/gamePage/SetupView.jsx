//Riceve due props da gamePage: mapData (l'oggetto con la mappa completa, che gamePage ha caricato dal server) e onStart (la funzione da chiamare per iniziare la partita, che è startgame di GamePage)
//Passa 4 props a NetworkMap (il componente che disegna la mappa della metro): stations (prese da mapData.stations), tract, lines e showLines
import PropTypes from "prop-types";
import { Button, Spinner } from "react-bootstrap";
import NetworkMap from "./NetworkMap.jsx";

import "./SetupView.css";

function SetupView(props) {
    const { mapData, onStart } = props;
    if (!mapData) return <Spinner animation="border" />;
    return (
        <div className="setup">
            <h2 className="setup-title">Pronto per il colpo?</h2>
            <p className="setup-sub">Studia la rete: linee, stazioni e coincidenze. Quando sei pronto, si comincia.</p>
            <div className="setup-map">
                <NetworkMap stations={mapData.stations} tracts={mapData.tracts}
                    lines={mapData.lines} showLines={true} />
            </div>
            <div className="setup-actions">
                <Button className="setup-btn" size="lg" onClick={onStart}>Sono pronto, inizia</Button>
            </div>
        </div>
    );
}

SetupView.propTypes = {
    mapData: PropTypes.object,
    onStart: PropTypes.func.isRequired,
};

export default SetupView;