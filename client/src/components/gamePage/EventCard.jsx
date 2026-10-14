import PropTypes from "prop-types";
import { useEffect } from "react";
import { useMusic } from "../../contexts/MusicContext.js";
import "./EventCard.css";

function EventCard(props) {
    const { current, step, total, revealed, isLast, onNext } = props;
    const { playCoin, playCat } = useMusic();

    // Quando l'evento della tappa viene rivelato: suono "gatto" per l'evento del gatto,
    // altrimenti suono "moneta" se hai guadagnato monete.
    useEffect(() => {
        if (!revealed || !current) return;
        const desc = (current.event.description || "").toLowerCase();
        if (desc.includes("gatto")) playCat();
        else if (current.event.effect > 0) playCoin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revealed, step]);

    return (
        <div className="exec-side">
            {revealed ? (
                <div className="exec-card" key={step}>
                    <div className="exec-card-step">Tappa {step + 1} di {total}</div>
                    <div className="exec-card-route">{current.from.name} → {current.to.name}</div>
                    <div className="exec-card-desc">{current.event.description}</div>
                    <div className={`exec-card-effect ${current.event.effect >= 0 ? "gain" : "loss"}`}>
                        {current.event.effect >= 0 ? "+" : ""}{current.event.effect} monete
                    </div>
                </div>
            ) : (
                <div className="exec-card exec-card-waiting">In viaggio…</div>
            )}
            {revealed && (
                <button className="exec-next" onClick={onNext}>
                    {isLast ? "Fine »" : "Avanti »"}
                </button>
            )}
        </div>
    );
}

EventCard.propTypes = {
    current: PropTypes.object,
    step: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    revealed: PropTypes.bool.isRequired,
    isLast: PropTypes.bool.isRequired,
    onNext: PropTypes.func.isRequired,
};

export default EventCard;