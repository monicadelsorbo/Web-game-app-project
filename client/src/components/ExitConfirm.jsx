// Pop-up di conferma che appare quando provi a uscire durante
//Riceve due props da navHeader : onLeave e onStay
import PropTypes from "prop-types";
import "./ExitConfirm.css";

function ExitConfirm(props) {
    const { onLeave, onStay } = props;
    return (
        <div className="exit-overlay">
            <div className="exit-card">
                <h3>Sei sicuro di voler uscire?</h3>
                <p>Perderai la partita in corso.</p>
                <div className="exit-actions">
                    <button className="exit-btn exit-btn-leave" onClick={onLeave}>Esci</button>
                    <button className="exit-btn exit-btn-stay" onClick={onStay}>Riprendi gioco</button>
                </div>
            </div>
        </div>
    );
}

ExitConfirm.propTypes = {
    onLeave: PropTypes.func.isRequired,
    onStay: PropTypes.func.isRequired,
};

export default ExitConfirm;