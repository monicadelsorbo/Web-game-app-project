/*
 * Orchestratore della partita (route /play, protetta).
 * Le 4 fasi (setup, planning, execution, result) sono gestite da uno stato interno `phase`, NON da route diverse
 * Quando monti la pagina, parte in setup; un effetto carica la mappa dal server. 
 * L'utente avvia la partita (startGame) → si passa a planning: si accende il timer e la guardia d'uscita. 
 * L'utente costruisce il percorso e invia (a mano o per scadenza del timer) → si passa a execution, dove si vede l'esito. 
 * Da lì si va a result, e playAgain riporta a setup. Ogni cambio di phase ri-renderizza GamePage, che rivaluta la catena di if e mostra la schermata nuova.
 */
import { useState, useEffect, useRef, useContext } from "react";
import { Alert } from "react-bootstrap";
import { useNavigate } from "react-router";
import PropTypes from "prop-types";

import DifficultySelect from "./DifficultySelect.jsx";
import SetupView from "./SetupView.jsx";
import PlanningView from "./PlanningView.jsx";
import ExecutionView from "./ExecutionView.jsx";
import GateAnimation from "./GateAnimation.jsx";
import TimeUpAnimation from "./TimeUpAnimation.jsx";
import TutorialOverlay from "./TutorialOverlay.jsx";

import API from "../../API.js";
import { useMusic } from "../../contexts/MusicContext.js";

import PhaseContext from "../../contexts/PhaseContext.js";
import TimerContext from "../../contexts/TimerContext.js";
import GuardContext from "../../contexts/GuardContext.js";

const PLANNING_SECONDS = 90;

function GamePage(props) {
    // di norma si parte dalla scelta difficoltà; nella prima partita guidata si salta e si va al sopralluogo
    const [phase, setPhase] = useState(() => props.tutorialPending ? "setup" : "difficulty");
    const [difficulty, setDifficulty] = useState("facile"); // difficoltà scelta per la partita
    const [mapData, setMapData] = useState(null);   // rete completa per il Setup
    const [game, setGame] = useState(null);         // dati della partita (Pianificazione)
    const [selected, setSelected] = useState([]);   // id delle tratte scelte, in ordine
    const [result, setResult] = useState(null);     // esito calcolato dal server
    const [error, setError] = useState("");
    const [expired, setExpired] = useState(false);
    // tutorial guidato (solo prima partita): null = niente; 1..5 = passo corrente
    const [tutorialStep, setTutorialStep] = useState(null);
    const [tutorialGame, setTutorialGame] = useState(false); // true se la partita in corso è quella guidata (timer senza suono)

    const submittedRef = useRef(false);             // impedisce un doppio invio
    const gameIdRef = useRef(null);                 // id della partita corrente, tenuto in un ref per la pulizia allo smontaggio

    //Qui GamePage "si aggancia" a tre Context e ne estrae le funzioni di aggiornamento. 
    //Servono a comunicare con NavHeader (che non è figlia di GamePage): l'etichetta della fase, il timer, e se attivare la guardia d'uscita. 
    const { setPhaseLabel } = useContext(PhaseContext);
    const { setTimer } = useContext(TimerContext);
    const { setGuardActive, tryExit } = useContext(GuardContext);
    const { playGame, stopGame, stopAll, playLevelUp, stopTime } = useMusic();
    const navigate = useNavigate();

    // Scorciatoie da tastiera in pianificazione: Invio = Scappa adesso, Esc = esci.
    useEffect(() => {
        if (phase !== "planning" || tutorialStep !== null) return; // durante il tutorial niente scorciatoie
        const onKey = (e) => {
            if (e.key === "Enter") { if (selected.length > 0) submit(); }
            else if (e.key === "Escape") tryExit(() => navigate("/")); // chiede conferma se c'è la partita in corso
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, selected, tutorialStep, tryExit]);

    // Musica di fondo: suona nelle fasi di gioco e prosegue durante l'esecuzione di una vittoria.
    // Si ferma quando appare la scheda finale (al "Fine" parte la vittoria, che spegne il sottofondo),
    // alla sconfitta, o uscendo dalla pagina. L'on/off agisce come muto.
    useEffect(() => {
        const bgPhases = ["difficulty", "setup", "intro", "planning"];
        if (bgPhases.includes(phase) || (phase === "execution" && result && result.valid)) playGame();
        else stopGame();
    }, [phase, result, playGame, stopGame]);

    // Uscendo dalla pagina, ferma tutta la musica.
    useEffect(() => {
        return () => stopAll();
    }, [stopAll]);

    // Appena si esce dalla pianificazione (esecuzione, tempo scaduto, ecc.), zittisci la musica del timer:
    // così il suono degli ultimi 10s non prosegue durante l'esecuzione.
    useEffect(() => {
        if (phase !== "planning") stopTime();
    }, [phase, stopTime]);

    useEffect(() => {
        // Attiva la conferma d'uscita. la partita si perde solo se esci in PIANIFICAZIONE (non ancora inviata)
        setGuardActive(phase === "planning"); //La guardia è accesa solo in fase di pianificazione
        return () => setGuardActive(false);//Funzione di pulizia che parte alla rieseguzione o allo smontaggio
    }, [phase, setGuardActive]);


    useEffect(() => { gameIdRef.current = game ? game.gameId : null; }, [game]);

    // uscendo da /play: se c'è una partita 'planning' non inviata, la abbandona (la cancella)
    useEffect(() => {
        return () => {
            if (gameIdRef.current && !submittedRef.current) { //Se la partita essite e il percorso non è stato inviato allora pulisci la riga della partita
                API.abandonGame(gameIdRef.current).catch(() => { });
            }
        };
    }, []);

    // in pianificazione accendo il timer nell'header; altrove lo spengo
    useEffect(() => {
        if (phase === "planning" && tutorialStep === null) //In pianificazione (e non durante il tutorial) accende il timer; allo scadere alza la bandierina expired
            // la partita guidata mostra il timer ma SENZA suono (non ha un limite di tempo vero)
            setTimer({ seconds: PLANNING_SECONDS, onExpire: () => setExpired(true), silent: tutorialGame });
        else
            setTimer(null); //In ogni altra fase, e durante il tutorial, il timer è spento
        return () => setTimer(null);
    }, [phase, tutorialStep, tutorialGame, setTimer]); //setTimer arriva dal TimerContext

    // quando il timer scade, invia il percorso (con le tratte aggiornate di adesso)
    useEffect(() => {
        if (expired) submit(true);   // true: passa dall'animazione "Tempo scaduto"
    }, [expired]);

    useEffect(() => {
        const labels = {
            setup: "Sopralluogo",
            planning: "Pianificazione",
            execution: "Esecuzione",
            result: "Risultato",
        };
        setPhaseLabel(labels[phase] || "");
        return () => setPhaseLabel("");   // pulisci quando esci dal gioco
    }, [phase, setPhaseLabel]);
    //labels è un dizionario che traduce il nome tecnico della fase nell'etichetta da mostrare. labels[phase] prende quella giusta 
    // La manda all'header via context. La pulizia la svuota all'uscita. Rigira ad ogni cambio di fase.

    // Setup: carica la mappa completa al primo montaggio.
    useEffect(() => {
        API.getMap()
            .then(setMapData)
            .catch(() => setError("Errore nel caricamento della mappa"));
    }, []);

    // id delle due tratte suggerite dal tutorial: Versailles(1)-Torre Eiffel(2) e Torre Eiffel(2)-Les Invalides(4).
    // La terza tratta (Les Invalides(4)-Montparnasse(12)) la aggiunge l'utente da solo per vincere.
    const findTractId = (s1, s2) => {
        const t = game && game.tracts.find((t) => (t.a.id === s1 && t.b.id === s2) || (t.a.id === s2 && t.b.id === s1));
        return t ? t.id : null;
    };
    const firstTractId = findTractId(1, 2);
    const secondTractId = findTractId(2, 4);
    const tractName = (id) => {
        const t = game && game.tracts.find((t) => t.id === id);
        return t ? `${t.a.name} — ${t.b.name}` : "";
    };

    // Avanzamento automatico del tutorial in base alle mosse dell'utente:
    // passo 3 -> 4 quando aggiunge la prima tratta suggerita; 4 -> 5 quando aggiunge la seconda.
    useEffect(() => {
        if (tutorialStep === 3 && firstTractId && selected.includes(firstTractId)) setTutorialStep(4);
        else if (tutorialStep === 4 && secondTractId && selected.includes(secondTractId)) setTutorialStep(5);
    }, [selected, tutorialStep, firstTractId, secondTractId]);



    // Avvia una nuova partita: il server assegna partenza/arrivo e avvia il timer.
    // Scelta della difficoltà -> vai al sopralluogo (Setup).
    const chooseDifficulty = (d) => {
        setDifficulty(d);
        setPhase("setup");
    };

    // Avvia la sequenza: prima l'animazione "Sei pronto? 3,2,1, VIA!".
    const startGame = () => {
        setError("");
        setSelected([]);
        submittedRef.current = false;
        setExpired(false);
        setPhase("intro");
    };

    // Finita l'animazione, crea la partita (qui parte il timer lato server) ed entra in pianificazione,
    // così il cronometro del server e quello del client (90s) partono insieme.
    const beginPlanning = () => {
        const isTutorial = props.tutorialPending;   // prima partita: partita guidata fissa
        API.newGame(isTutorial ? "facile" : difficulty, isTutorial)   // il server genera partenza/arrivo (o quella fissa del tutorial)
            .then((g) => { //g contiene gameId, partenza, arrivo e le tratte per la mappa di pianificazione
                setGame(g);
                setTutorialGame(isTutorial);          // ricorda se è la partita guidata (timer muto)
                if (isTutorial) setTutorialStep(1);   // avvia le schede del tutorial (timer fermo)
                setPhase("planning");
            })
            .catch(() => setError("Errore nell'avvio della partita"));
    };

    //Aggiunge una tratta alla lista, solo se non c'è già (!selected.includes(id)). [...selected, id] crea un nuovo array con le tratte precedenti più quella nuova.
    const addTract = (id) => {
        if (!selected.includes(id)) setSelected([...selected, id]);
    };
    const removeLast = () => setSelected(selected.slice(0, -1)); // toglie l'ultima
    const resetRoute = () => setSelected([]); // svuota

    // Invio del percorso (manuale o automatico allo scadere del timer).
    const submit = (viaTimer) => {
        if (submittedRef.current) return;   // già inviato
        submittedRef.current = true;
        stopTime();                         // ferma subito la musica degli ultimi 10s (così non sfora nell'esecuzione)
        const byTimer = viaTimer === true;  // true solo se chiamato dallo scadere del timer
        if (byTimer) setPhase("timeup");    // mostra l'animazione "Tempo scaduto"
        API.submitRoute(game.gameId, selected)
            .then((res) => {
                setResult(res);
                if (res.valid && res.leveledUp) {
                    if (props.onLevelUp) props.onLevelUp(); // badge/notifica nel profilo
                    playLevelUp();                          // musichetta di livello, prima dell'esecuzione
                }
                if (!byTimer) setPhase("execution");   // invio manuale: vai subito all'esecuzione
            })
            .catch(() => setError("Errore nell'invio del percorso"));
    };

    const playAgain = () => {
        setGame(null);
        setSelected([]);
        setResult(null);
        submittedRef.current = false;
        setExpired(false);
        setTutorialGame(false);   // le partite successive hanno il timer normale (con suono)
        setPhase("difficulty");   // nuova partita: si ricomincia dalla scelta della difficoltà
    };

    // Rimuove la tratta in posizione index (le altre si ricompattano).
    const removeAt = (index) => setSelected(selected.filter((_, i) => i !== index));

    // Sposta una tratta da una posizione all'altra (per il drag & drop).
    const moveTract = (from, to) => {
        const next = [...selected]; //fa una copia dell'array
        const [moved] = next.splice(from, 1);  // toglie dall'array 1 elemento a partire dalla posizione from e mette quell'elemento in moved
        next.splice(to, 0, moved);             // reinserisce moved nella posizione 'to'
        setSelected(next);
    };

    if (error) return <Alert variant="danger">{error}</Alert>;

    if (phase === "difficulty")
        return <DifficultySelect onChoose={chooseDifficulty} />;

    if (phase === "setup")
        //Gli passa due props: mapData (la mappa da disegnare) e onStart (la funzione startGame, da chiamare quando l'utente vuole iniziare).
        return <SetupView mapData={mapData} onStart={startGame} />;

    if (phase === "intro")
        //animazione "Sei pronto? 3,2,1, VIA!"; al termine crea la partita ed entra in pianificazione
        return <GateAnimation onDone={beginPlanning} />;

    if (phase === "planning")
        //Gli passa i dati della partita (game), le tratte scelte finora (selected) e un gruppo di funzioni (callback) per modificarle: onAdd (aggiungi), onRemoveAt (togli a una posizione), onMove (sposta), onReset (azzera) e onSubmit (invia).
        //tutorialStep guida l'illuminazione dei pannelli; l'overlay mostra le schede del tutorial.
        return (
            <>
                <PlanningView game={game} selected={selected}
                    onAdd={addTract} onRemoveAt={removeAt} onMove={moveTract}
                    onReset={resetRoute} onSubmit={submit} tutorialStep={tutorialStep} />
                {tutorialStep !== null &&
                    <TutorialOverlay step={tutorialStep}
                        firstName={tractName(firstTractId)}
                        secondName={tractName(secondTractId)}
                        onContinue={() => setTutorialStep((s) => s + 1)}
                        onFinish={() => { setTutorialStep(null); if (props.onTutorialDone) props.onTutorialDone(); }}
                        onSkip={() => { setTutorialStep(null); if (props.onTutorialDone) props.onTutorialDone(); }} />}
            </>
        );

    if (phase === "timeup")
        //animazione "Tempo scaduto"; al termine si passa all'esecuzione (il risultato è già arrivato dal server)
        return <TimeUpAnimation onDone={() => setPhase("execution")} />;

    return <ExecutionView result={result} stations={game.stations} tracts={game.tracts}
        departure={game.departure} onPlayAgain={playAgain} />;
}

GamePage.propTypes = {
    onLevelUp: PropTypes.func,
    tutorialPending: PropTypes.bool,
    onTutorialDone: PropTypes.func,
};

export default GamePage;