/*
 * Classifica generale (route /leaderboard, protetta).
 * I primi 3 sono mostrati come un podio (con la coppa sul 1° posto),
 * dal 4° al 10° posto come elenco. Evidenzia la riga dell'utente corrente.
 */

//Riceve da App la prop user (l'utente loggato), per evidenziare la propria posizione.
import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import { Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router";
import API from "../API.js";
import "./Leaderboard.css";

function Leaderboard(props) {
    const [rows, setRows] = useState(null); // le righe della classifica
    const [error, setError] = useState(""); // eventuale errore di caricamento
    const mineRef = useRef(null);           // riga "La tua posizione" nel flusso della pagina
    const [mineVisible, setMineVisible] = useState(false); // true se quella riga è visibile a schermo

    // Carica la classifica al primo montaggio (array di {name, bestScore}, già ordinato dal server).
    useEffect(() => {
        API.getLeaderboard()
            .then(setRows)
            .catch(() => setError("Errore nel caricamento della classifica"));
    }, []);

    // Osserva la riga "La tua posizione": quando entra nello schermo, nascondo la copia in sovraimpressione.
    useEffect(() => {
        const el = mineRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => setMineVisible(entry.isIntersecting), { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [rows]);

    if (error) return <Alert variant="danger">{error}</Alert>;
    if (!rows) return <Spinner animation="border" />; //finché i dati non arrivano, mostra la rotellina

    // true se la riga è quella dell'utente loggato
    const isMe = (r) => r && props.user && r.name === props.user.name;
    // posizione dell'utente nella classifica (-1 se non è in classifica)
    const myIndex = props.user ? rows.findIndex((r) => r.name === props.user.name) : -1;
    const isTop3 = myIndex >= 0 && myIndex <= 2; // sul podio: niente sovraimpressione

    // contenuto della riga "La tua posizione" (riusato sia nel flusso sia in sovraimpressione)
    const myPosition = myIndex >= 0 ? (
        <div className="board-row-low is-me">
            <span className="board-badge-low">{myIndex + 1}</span>
            <span className="board-name">{rows[myIndex].name}</span>
            <span className="board-loot"><i className="bi bi-coin" /> {rows[myIndex].bestScore}</span>
        </div>
    ) : (
        <p className="board-mine-empty">Non sei ancora in classifica: vinci una partita per entrare!</p>
    );

    // Podio: 2° a sinistra, 1° al centro (più alto, con la coppa), 3° a destra.
    const podium = [
        { rank: 2, player: rows[1] },
        { rank: 1, player: rows[0] },
        { rank: 3, player: rows[2] },
    ];

    return (
        <div className="board">
            <h1 className="board-title">Classifica</h1>

            {rows.length === 0 ? (
                <p className="board-empty">Nessuna partita giocata ancora.</p>
            ) : (
                <div className="podium">
                    {podium.map(({ rank, player }) => (
                        <div key={rank} className={`podium-col podium-${rank} ${isMe(player) ? "is-me" : ""}`}>
                            <div className="podium-player">
                                {rank === 1 && <i className="bi bi-trophy-fill podium-cup" />}
                                <span className="podium-name">{player ? player.name : "—"}</span>
                                <span className="podium-score"><i className="bi bi-coin" /> {player ? player.bestScore : "—"}</span>
                            </div>
                            <div className="podium-block">{rank}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Dal 4° al 10° posto */}
            <div className="board-panel-low">
                {[4, 5, 6, 7, 8, 9, 10].map((rank) => {
                    const r = rows[rank - 1];
                    return (
                        <div key={rank} className={`board-row-low ${isMe(r) ? "is-me" : ""}`}>
                            <span className="board-badge-low">{rank}</span>
                            <span className={`board-name ${r ? "" : "board-name-empty"}`}>
                                {r ? r.name : `Posto ${rank}`}
                            </span>
                            {r && <span className="board-loot"><i className="bi bi-coin" /> {r.bestScore}</span>}
                        </div>
                    );
                })}
            </div>

            {/* La tua posizione, al suo posto nel flusso (anche oltre il 10°). */}
            <div className="board-mine" ref={mineRef}>
                <span className="board-mine-label">La tua posizione</span>
                {myPosition}
            </div>

            {/* Stessa riga in sovraimpressione in basso, finché quella sopra non è visibile */}
            {!isTop3 && !mineVisible && (
                <div className="board-mine-float">
                    <span className="board-mine-label">La tua posizione</span>
                    {myPosition}
                </div>
            )}

            <div className="board-actions">
                <Link to="/" className="board-home-btn">
                    <i className="bi bi-house-door-fill" /> Torna alla home
                </Link>
            </div>
        </div>
    );
}

Leaderboard.propTypes = {
    user: PropTypes.object,
};

export default Leaderboard;
