/*
 * Componente radice dell'app: tiene lo stato di autenticazione e quello condiviso,
 * fornisce i Context (fase, timer, guardia d'uscita), definisce le route e mostra la barra e i messaggi.
 */
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import { useEffect, useState } from "react"; //hook per rendere il componente reattivo
import { Container } from "react-bootstrap";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router";

import NavHeader from "./components/NavHeader.jsx";
import HomePage from "./components/HomePage.jsx";
import NotFound from "./components/NotFound.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import { LoginForm, RegisterForm } from "./components/Auth.jsx";
import GamePage from "./components/gamePage/GamePage.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import MetroBackground from "./components/MetroBackground.jsx";
import MusicProvider from "./components/MusicProvider.jsx";
import AudioControls from "./components/AudioControls.jsx";
import Tutorial from "./components/Tutorial.jsx";
import IntroVideo from "./components/IntroVideo.jsx";
import ExitConfirm from "./components/ExitConfirm.jsx";

import PhaseContext from "./contexts/PhaseContext.js";
import TimerContext from "./contexts/TimerContext.js";
import GuardContext from "./contexts/GuardContext.js";

import API from "./API.js";

function App() {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [phaseLabel, setPhaseLabel] = useState("");
  const [timer, setTimer] = useState(null);//timer è un oggetto della forma { seconds, onExpire }, che vive nello stato di App eviene condiviso a tutti tramite il TimerContext
  const [guardActive, setGuardActive] = useState(false);
  const [exitPending, setExitPending] = useState(null); // azione di uscita in attesa di conferma (partita in corso)
  // notifica "nuovo livello": null = niente, 0 = appena salito (badge + scritta), 1 = profilo visto una volta (solo scritta)
  const [levelUpVisits, setLevelUpVisits] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false); // tutorial di benvenuto per i nuovi registrati
  const [gameTutorialPending, setGameTutorialPending] = useState(false); // tutorial guidato alla prima partita
  const [authChecked, setAuthChecked] = useState(false);   // true quando il controllo della sessione è finito
  const [introDone, setIntroDone] = useState(false);       // true quando il video intro è finito/saltato

  useEffect(() => {
    API.getUserInfo()
      .then(user => { setLoggedIn(true); setUser(user); setAuthChecked(true); })
      .catch(() => { setLoggedIn(false); setUser(null); setAuthChecked(true); });
  }, []); //Side effect che viene eseguito solo al primo montaggio del componente (non ci sono dipendenze, [])
  //API.getUserInfo() è una promise che recupera la sessione attiva.

  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials);
    setUser(user);
    setLoggedIn(true);
  }; //Event handler del login. Riceve credentials ({username, password}). Se il login riesce, ottiene l'oggetto user e aggiorna lo stato (setUser, setLoggedIn)

  const handleRegister = async (credentials) => {
    const user = await API.register(credentials);  // il server registra e fa il login automatico
    setUser(user);
    setLoggedIn(true);
    setShowTutorial(true);          // tutorial di benvenuto
    setGameTutorialPending(true);   // alla prima partita parte il tutorial guidato
  }; //Event handler della registrazione. Riceve { email, password }. Se va a buon fine, ottiene l'utente e aggiorna lo stato.

  const handleLogout = async () => {
    await API.logOut();
    navigate("/");
    setLoggedIn(false);
    setUser(null);
  }; //Event handler del logout. Chiama API.logOut(), resetta lo stato e reindirizza alla home
  //App lo passa alla NavHeader come prop logout

  const handleLevelUp = () => setLevelUpVisits(0); // una vittoria ha fatto salire di livello: mostra badge + scritta
  // visita al profilo: 0 -> 1 (sparisce il badge, resta la scritta), 1 -> null (sparisce la scritta)
  const onProfileViewed = () => setLevelUpVisits((v) => (v === 0 ? 1 : null));

  // Tenta un'uscita: se c'è una partita in corso (guardActive) chiede conferma, altrimenti esegue subito.
  // Usata sia dai link della barra sia dalla scorciatoia Esc, così la scheda di conferma compare in entrambi i casi.
  const tryExit = (action) => {
    if (guardActive) setExitPending(() => action);   // memorizza l'azione e mostra la scheda
    else action();
  };
  // se la guardia si spegne (partita finita/inviata), chiude l'eventuale scheda di uscita ancora aperta
  useEffect(() => {
    if (!guardActive) setExitPending(null);
  }, [guardActive]);

  const location = useLocation(); //hook che dà l'oggetto che descrive la rotta corrente (in che URL ti trovi in questo momento), per poter cambiare l'url/componenti senza ricaricare la pagina
  const hideNav = location.pathname === "/login" || location.pathname === "/register"; //nascondi la barra su login e registrazione

  const navigate = useNavigate();

  return (
    <MusicProvider>
    {/* Context per la guardia d'uscita: dice se c'è una partita in corso */}
    <GuardContext.Provider value={{ guardActive, setGuardActive, tryExit }}>
      {/* Context per il timer mostrato nell'header */}
      <TimerContext.Provider value={{ timer, setTimer }}>
        {/* Context per la fase di gioco: gestisce lo stato attuale del gioco */}
        <PhaseContext.Provider value={{ phaseLabel, setPhaseLabel }}>
          {/* sfondo con le linee della metro, non nelle pagine di login/registrazione */}
          {!hideNav && <MetroBackground />}
          {/* video introduttivo: solo per anonimi, all'apertura, sulla home */}
          {authChecked && !loggedIn && !introDone && location.pathname === "/" &&
            <IntroVideo onFinish={() => setIntroDone(true)} />}
          <div className="min-vh-100 d-flex flex-column app-content">
            {!hideNav && <NavHeader user={user} loggedIn={loggedIn} logout={handleLogout} levelUpBadge={levelUpVisits === 0} />} {/* mostra la navHeader solo se non sei nel login*/}
            <Container fluid className="flex-grow-1 d-flex flex-column py-3">
              {/* transizione: una dissolvenza a ogni cambio pagina (key = percorso) */}
              <div className="page-fade" key={location.pathname}>
              <Routes>{/*Guarda l'URL corrente e mostra una sola route, quella il cui path combacia */}
                <Route path="/" element={
                  <HomePage loggedIn={loggedIn} user={user} />} />  {/*alla HomePage passa loggedIn e user (così la home sa cosa mostrare). */}
                <Route path="/login" element={
                  loggedIn ? <Navigate replace to="/" /> : <LoginForm login={handleLogin} />
                } /> {/* se sei gia loggato ti sposta alla home, altrimenti mostra il forn a cui passi handleLogin come callback*/}
                <Route path="/register" element={
                  loggedIn ? <Navigate replace to="/" /> : <RegisterForm register={handleRegister} />
                } /> {/* registrazione: se gia loggato vai alla home, altrimenti mostra il form */}
                <Route path="/profile" element={
                  loggedIn ? <ProfilePage user={user} setUser={setUser} levelUpVisits={levelUpVisits} onProfileViewed={onProfileViewed} /> : <Navigate replace to="/" />
                } />
                <Route path="/play" element={
                  loggedIn ? <GamePage onLevelUp={handleLevelUp} tutorialPending={gameTutorialPending} onTutorialDone={() => setGameTutorialPending(false)} /> : <Navigate replace to="/" />
                } />
                <Route path="/leaderboard" element={
                  loggedIn ? <Leaderboard user={user} /> : <Navigate replace to="/" />
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
            </Container>
            {/* comando musica: mostrato solo nella pagina partita */}
            {location.pathname === "/play" && <AudioControls />}
            {/* tutorial mostrato ai nuovi registrati */}
            {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
            {/* scheda di conferma uscita: compare quando si tenta di lasciare una partita in corso (link o tasto Esc) */}
            {exitPending && (
              <ExitConfirm
                onLeave={() => { const a = exitPending; setExitPending(null); a(); }}
                onStay={() => setExitPending(null)} />
            )}
          </div>
        </PhaseContext.Provider>
      </TimerContext.Provider>
    </GuardContext.Provider>
    </MusicProvider>
  );
}

export default App;
