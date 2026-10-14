/*
 * Home con le istruzioni del gioco (route "/").
 * Tutti vedono le regole. Gli anonimi NON vedono la mappa: vedono solo le
 * istruzioni e l'invito ad accedere. I loggati vedono i bottoni di gioco.
 */

//Riceve da App due props: user e LoggedIn

import PropTypes from "prop-types";
import { useRef, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router";
import { useMusic } from "../contexts/MusicContext.js";
import "./HomePage.css";

function HomePage(props) {
    const rulesRef = useRef(null); // riferimento alla sezione delle regole, per lo scroll e lo scroll-reveal
    const [rulesRevealed, setRulesRevealed] = useState(false); // true quando le regole entrano nello schermo
    const { playButton } = useMusic();

    // Scorre dolcemente fino alle regole del gioco.
    const scrollToRules = () => {
        rulesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Scroll-reveal: rivela le schede regola quando la sezione entra nello schermo.
    useEffect(() => {
        const el = rulesRef.current;
        if (!el) return;
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                setRulesRevealed(true);
                obs.disconnect();
            }
        }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div className="home">
            <section className="hero">
                <div className="hero-img">
                    <img src="/hero.png" alt="Il ladro in fuga sulla metro" />
                </div>
                <div className="hero-text">
                    <h1 className="hero-title">
                        Il colpo del <span className="accent">secolo</span> ti aspetta.
                    </h1>
                    <p className="hero-sub">
                        Hai svaligiato un museo di Parigi. Attraversa la metro notturna,
                        pianifica la fuga con le giuste linee della metro e porta a casa il bottino più grande.
                    </p>
                    <div className="hero-buttons">
                        {props.loggedIn ? (
                            <>
                                <Button as={Link} to="/play" className="btn-hero btn-hero-green" onClick={playButton}>
                                    Nuova partita
                                </Button>
                                <Button as={Link} to="/leaderboard" className="btn-hero btn-hero-cyan">
                                    Classifica
                                </Button>
                            </>
                        ) : (
                            <Button as={Link} to="/login" className="btn-hero btn-hero-cyan btn-accedi">
                                Accedi per giocare
                            </Button>
                        )}
                    </div>
                </div>
            </section>

            {/*REGOLE*/}
            <section className={`rules ${rulesRevealed ? "rules-revealed" : ""}`} ref={rulesRef}>
                {/* la scritta è cliccabile: al click scorre fino alle regole */}
                <button type="button" className="rules-bubble" onClick={scrollToRules}>
                    LE REGOLE DEL GIOCO
                </button>
                <div className="rules-grid">
                    <div className="rule-card rule-card-1">
                        <div className="rule-icon"><i className="bi bi-train-lightrail-front" /></div>
                        <h3>1. Scegli il percorso sulla mappa</h3>
                        <p>Scansiona a  mente la mappa. Quando sei pronto inizia la partita e scegli accuratamente le tracce per raggiungere la stazione di arrivo.</p>
                    </div>
                    <div className="rule-card rule-card-2">
                        <div className="rule-icon"><i className="bi bi-stopwatch" /></div>
                        <h3>2. 90 secondi per il piano</h3>
                        <p>Hai soltanto 90 secondi per decidere il percorso!</p>
                    </div>
                    <div className="rule-card rule-card-3">
                        <div className="rule-icon"><i className="bi bi-piggy-bank" /></div>
                        <h3>3. Scappa col bottino</h3>
                        <p>Se il percorso è corretto riceverai 20 monete. Lungo il tragitto eventi casuali ti fanno guadagnare o perdere monete.</p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="home-footer">
                <span className="home-footer-brand">ULTIMA CORSA</span>
                <span className="home-footer-text">Il colpo del secolo · Progetto Applicazioni Web I</span>
            </footer>
        </div>
    );
}

HomePage.propTypes = {
    loggedIn: PropTypes.bool,
    user: PropTypes.object,
};

export default HomePage;
