
//ProfilePage riceve da App due props: user e setUser (per aggiornare l'utente dopo il cambio avatar).
//Usa l'hook useEffect per chiamare una volta sola, al mount, il metodo API.getProfileStats

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router";
import API from "../API.js";
import { avatarFor, AVATAR_OPTIONS } from "../avatars.js";
import { levelInfo } from "../levels.js";
import "./ProfilePage.css";

function ProfilePage(props) {
    const [stats, setStats] = useState(null);       //stats conterrà le statistiche del giocatore
    const [avatarOpen, setAvatarOpen] = useState(false); // finestra di scelta avatar aperta/chiusa
    // mostra la scritta "nuovo livello" solo alla PRIMA visita dopo essere saliti di livello (catturata al montaggio)
    const [showLevelUpText] = useState(() => props.levelUpVisits === 0);

    useEffect(() => {
        API.getProfileStats()
            .then(setStats) //salva le statistiche in stats
            .catch(() => { });
    }, []); //Al montaggio chiama GET /api/profile per avere le statistiche.

    // Segnala ad App che il profilo è stato aperto (fa sparire il badge e, alla 2a visita, la scritta).
    useEffect(() => {
        if (props.onProfileViewed) props.onProfileViewed();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Livello calcolato dalle vittorie; avatar attuale dell'utente.
    const level = levelInfo(stats ? stats.wins : 0);
    const currentAvatar = avatarFor(props.user);

    // Cambia avatar: chiude la finestra, salva sul server e aggiorna l'utente in App (cambia ovunque).
    const chooseAvatar = (path) => {
        setAvatarOpen(false);
        if (path === currentAvatar) return;
        API.setAvatar(path)
            .then(() => props.setUser && props.setUser({ ...props.user, avatar: path }))
            .catch(() => { });
    };

    return (
        <div className="profile">
            <div className="profile-header">
                <div className="profile-bar" />
                <div className="profile-dots" />
                <div className="profile-header-content">
                    <div className="profile-avatar-wrap">
                        <div className="profile-avatar">
                            <img src={currentAvatar} alt="Avatar giocatore" />
                        </div>
                        {/* scritta piccola sotto l'immagine: apre la finestra di scelta */}
                        <button type="button" className="avatar-change-link" onClick={() => setAvatarOpen(true)}>
                            Cambia avatar
                        </button>
                    </div>

                    <div className="profile-info">
                        <span className="profile-status">Livello {level.level} · Stato: Ricercato</span>
                        <h1 className="profile-name">{props.user?.name}</h1>
                        <span className="profile-tagline"><span>{level.name}</span></span>
                    </div>
                </div>
            </div>

            {/* scritta gialla mostrata sopra la barra quando si è appena saliti di livello */}
            {showLevelUpText && (
                <div className="levelup-notice"><i className="bi bi-stars" /> Nuovo livello raggiunto!</div>
            )}

            {/* ===== Avanzamento di livello (dorata al livello massimo) ===== */}
            <div className={`level-panel ${level.isMax ? "level-panel-max" : ""}`}>
                <div className="level-panel-top">
                    <span className="level-current">Livello {level.level}</span>
                    {level.isMax
                        ? <span className="level-next">Livello massimo raggiunto!</span>
                        : <span className="level-next">Livello {level.level + 1}</span>}
                </div>
                <div className="level-bar">
                    <div className="level-bar-fill" style={{ width: `${Math.round(level.progress * 100)}%` }} />
                </div>
                <div className="level-bar-caption">
                    {stats ? `${stats.wins} vittorie` : "—"}
                    {!level.isMax && stats && ` · servono ${level.nextThreshold} vittorie per il livello ${level.level + 1}`}
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-box">
                    <i className="bi bi-gem stat-icon" />
                    <span className="stat-label">Miglior colpo</span>
                    <span className="stat-value">{stats ? stats.bestScore : "—"}</span>
                </div>
                <div className="stat-box">
                    <i className="bi bi-controller stat-icon" />
                    <span className="stat-label">Partite giocate</span>
                    <span className="stat-value">{stats ? stats.gamesPlayed : "—"}</span>
                </div>
                <div className="stat-box">
                    <i className="bi bi-shield-check stat-icon" />
                    <span className="stat-label">Colpi riusciti</span>
                    <span className="stat-value">{stats ? stats.wins : "—"}</span>
                </div>
            </div>

            <div className="profile-actions">
                <Link to="/" className="profile-home-btn">
                    <i className="bi bi-arrow-left" /> Torna alla home
                </Link>
            </div>

            {/* ===== Finestra di scelta avatar ===== */}
            {avatarOpen && (
                <div className="avatar-modal-overlay" onClick={() => setAvatarOpen(false)}>
                    {/* stopPropagation: cliccando dentro la finestra non si chiude */}
                    <div className="avatar-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="avatar-modal-title">Scegli il tuo avatar</h3>
                        <div className="avatar-options">
                            {AVATAR_OPTIONS.map((path) => (
                                <button key={path} type="button"
                                    className={`avatar-option ${path === currentAvatar ? "avatar-option-active" : ""}`}
                                    onClick={() => chooseAvatar(path)}>
                                    <img src={path} alt="Avatar selezionabile" />
                                </button>
                            ))}
                        </div>
                        <button type="button" className="avatar-modal-close" onClick={() => setAvatarOpen(false)}>
                            Chiudi
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}

ProfilePage.propTypes = {
    user: PropTypes.object,
    setUser: PropTypes.func,
    levelUpVisits: PropTypes.number,
    onProfileViewed: PropTypes.func,
};

export default ProfilePage;
