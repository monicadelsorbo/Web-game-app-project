/*
 * Barra di navigazione in alto, presente in quasi tutte le pagine.
 * Mostra il titolo (link alla home) e, a destra, il login o il logout.
 */

//Riceve da App tre props: l'utente, il flag di login e la funzione di logout (handleLogout); la barra non possiede lo stato ma chiama logout quando serve
//Le props passate dal padre (app.jsx) si trovano nel componente come parametro props
//A sua volta passa props ai propri figli: a CountdownTimer manda seconds e onExpire (presi dal TimerContext, non dalle proprie props).
//Per uscire usa tryExit (dal GuardContext): se c'è una partita in corso, la scheda di conferma (gestita in App) appare.

import PropTypes from "prop-types";
import { Navbar, Container, Nav, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router";
import { useState, useContext } from "react";

import { avatarFor } from "../avatars.js";

import PhaseContext from "../contexts/PhaseContext.js";
import TimerContext from "../contexts/TimerContext.js";
import GuardContext from "../contexts/GuardContext.js";

import CountdownTimer from "./CountdownTimer.jsx";

import "./NavHeader.css";

function NavHeader(props) {
    const navigate = useNavigate();
    const location = useLocation();   // pagina corrente, per riempire l'icona giusta nel menu
    const { phaseLabel } = useContext(PhaseContext);
    const { tryExit } = useContext(GuardContext); // tryExit chiede conferma se c'è una partita in corso
    const { timer } = useContext(TimerContext);

    const [menuOpen, setMenuOpen] = useState(false); // menu laterale aperto/chiuso

    // Naviga verso una pagina dal menu, chiudendolo (con conferma se c'è una partita in corso).
    const goFromMenu = (path) => {
        setMenuOpen(false);
        tryExit(() => navigate(path));
    };

    // Voci del menu: icona "outline" di default, "fill" quando sei già in quella pagina.
    const menuItems = [
        { path: "/", label: "Home", icon: "house-door" },
        { path: "/leaderboard", label: "Classifica", icon: "trophy" },
        { path: "/profile", label: "Profilo", icon: "person" },
        { path: "/play", label: "Gioco", icon: "dpad" },
    ];

    return (
        <Navbar variant="dark" expand="md" className="navheader">
            <Container fluid>
                {/*PARTE SINISTRA DELLA BARRA*/}
                {/* icona casetta a sinistra del titolo: apre/chiude il menu laterale; cambia colore quando è aperto */}
                <button
                    className={`nav-menu-btn ${menuOpen ? "nav-menu-btn-open" : ""}`}
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="Apri menu">
                    <i className="bi bi-house-door-fill" />
                </button>

                <Navbar.Brand className="navheader-brand" style={{ cursor: "pointer" }} //imposta il cursore a manina così capisce che è cliccabile
                    onClick={() => tryExit(() => navigate("/"))}> {/*al click, esegue tryExit con l'azione "vai alla home" */}
                    Ultima Corsa
                </Navbar.Brand>

                {phaseLabel && <span className="phase-badge">{phaseLabel}</span>} {/*mostra lo spansolo se phaseLabel non è vuoto*/}

                {timer && ( /*mostra il countdown solo se timer non è null; cioè solo durante la pianificazione perché è GamePage ad accendere il timer via TimerContext*/
                    <span className="navheader-timer">
                        <CountdownTimer seconds={timer.seconds} silent={timer.silent}
                            onExpire={() => timer.onExpire()} />
                    </span>
                )}

                {/*PARTE DESTRA DELLA BARRA*/}
                <Nav className="navheader-right ms-auto align-items-center">
                    {props.loggedIn ? ( //se è loggato, mostra il suo nome e un bottone di logout
                        <>
                            <Navbar.Text className="navheader-user me-3 text-light">
                                Ciao, {props.user?.name} {/*prende name dentro user, ma solo se user esiste */}
                            </Navbar.Text>
                            <Button variant="outline-light" className="btn-neo" onClick={() => tryExit(props.logout)}>
                                Esci
                            </Button>
                            <span className="avatar-wrap ms-3">
                                <button className="avatar-btn" onClick={() => tryExit(() => navigate("/profile"))}>
                                    <img src={avatarFor(props.user)} alt="Scheda giocatore" />
                                </button>
                                {/* punto esclamativo: nuovo livello da vedere */}
                                {props.levelUpBadge && <span className="levelup-badge">!</span>}
                            </span>
                        </>
                    ) : (
                        <>
                            <Button variant="outline-light" className="btn-neo" onClick={() => navigate("/login")}>
                                Accedi
                            </Button>
                            <Button variant="outline-light" className="btn-neo ms-2" onClick={() => navigate("/register")}>
                                Registrati
                            </Button>
                        </>
                    )}
                </Nav>

                {/* Menu laterale a sinistra, in sovraimpressione */}
                {menuOpen && (
                    <>
                        <div className="nav-menu-backdrop" onClick={() => setMenuOpen(false)} />
                        <nav className="nav-menu">
                            <div className="nav-menu-title">Menu</div>
                            {menuItems.map((item) => {
                                const active = location.pathname === item.path; // sei in questa pagina?
                                return (
                                    <button key={item.path}
                                        className={`nav-menu-item ${active ? "nav-menu-item-active" : ""}`}
                                        onClick={() => goFromMenu(item.path)}>
                                        {/* icona piena se sei nella pagina, altrimenti col solo bordo */}
                                        <i className={`bi bi-${item.icon}${active ? "-fill" : ""}`} /> {item.label}
                                        {item.path === "/profile" && props.levelUpBadge &&
                                            <span className="levelup-badge levelup-badge-menu">!</span>}
                                    </button>
                                );
                            })}
                        </nav>
                    </>
                )}

            </Container>
        </Navbar>
    );
}

//propTypes serve a dichiarare il tipo che ci si aspetta per ogni prop del componente
//Se riceve un tipo di props sbagliato, stampa un errore in console

NavHeader.propTypes = {
    loggedIn: PropTypes.bool,
    user: PropTypes.object,
    logout: PropTypes.func,
    levelUpBadge: PropTypes.bool,
};

export default NavHeader;
