import PropTypes from "prop-types";
import { useEffect } from "react";
import { Link } from "react-router";
import { useMusic } from "../../contexts/MusicContext.js";
import "./ResultView.css";

function ResultView(props) {
    const { won, score, newRecord, onPlayAgain } = props;
    const { playGameOver, playVictory, playButton } = useMusic();

    // All'apertura della scheda di esito: musichetta di vittoria o di sconfitta.
    useEffect(() => {
        if (won) playVictory(); else playGameOver();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`exec-overlay ${won ? "exec-overlay-won" : ""}`}>
            {won && Array.from({ length: 14 }).map((_, i) => (
                <i key={i} className="bi bi-coin exec-coin-fall"
                    style={{
                        left: `${(i * 7 + 4) % 100}%`,
                        animationDelay: `${(i % 7) * 0.35}s`,
                        animationDuration: `${2 + (i % 4) * 0.6}s`
                    }} />
            ))}
            <div className={`exec-result ${won ? "exec-won" : "exec-lost"}`}>
                {won ? (
                    <>
                        <h2>Hai vinto!</h2>
                        {newRecord && <div className="exec-record">Nuovo record!</div>}
                        <div className="exec-result-score">{score}</div>
                        <p>monete di bottino</p>
                    </>
                ) : (
                    <>
                        <h2>Colpo fallito</h2>
                        <p>Percorso non valido o tempo scaduto: perdi tutto il bottino.</p>
                    </>
                )}
                <div className="exec-result-actions">
                    <button className="exec-btn exec-btn-cyan" onClick={() => { playButton(); onPlayAgain(); }}>Gioca ancora</button>
                    <Link to="/" className="exec-btn exec-btn-grey">Home</Link>
                </div>
            </div>
        </div>
    );
}

ResultView.propTypes = {
    won: PropTypes.bool.isRequired,
    score: PropTypes.number,
    newRecord: PropTypes.bool,
    onPlayAgain: PropTypes.func.isRequired,
};

export default ResultView;