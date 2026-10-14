const SERVER_URL = "http://localhost:3001/api";

/** Esegue il login. Vuole { username, password }. */
const logIn = async (credentials) => {
    return await fetch(SERVER_URL + "/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // invia/riceve il cookie di sessione
        body: JSON.stringify(credentials),
    }).then(handleInvalidResponse).then(res => res.json());
};

/** Verifica se l'utente è ancora loggato; ritorna le info dell'utente. */
const getUserInfo = async () => {
    return await fetch(SERVER_URL + "/sessions/current", {
        credentials: "include",
    }).then(handleInvalidResponse).then(res => res.json());
};

/** Esegue il logout (distrugge la sessione corrente). */
const logOut = async () => {
    return await fetch(SERVER_URL + "/sessions/current", {
        method: "DELETE",
        credentials: "include",
    }).then(handleInvalidResponse);
};

/** Gestione centralizzata delle risposte non valide. */
function handleInvalidResponse(response) {
    if (!response.ok) throw Error(response.statusText);
    return response;
}

/** Rete completa per la fase di Setup. */
const getMap = async () => {
    return await fetch(SERVER_URL + "/map", { credentials: "include" })
        .then(handleInvalidResponse).then(res => res.json());
};

/** Inizia una nuova partita con la difficoltà scelta (o una partita guidata fissa se tutorial=true). */
const newGame = async (difficulty, tutorial = false) => {
    return await fetch(SERVER_URL + "/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ difficulty, tutorial }),
    }).then(handleInvalidResponse).then(res => res.json());
};

/** Invia il percorso costruito (sequenza ordinata di id di tratte). */
const submitRoute = async (gameId, tractIds) => {
    return await fetch(SERVER_URL + `/games/${gameId}/route`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tractIds }),
    }).then(handleInvalidResponse).then(res => res.json());
};

/** Classifica generale (miglior punteggio per utente). */
const getLeaderboard = async () => {
    return await fetch(SERVER_URL + "/leaderboard", { credentials: "include" })
        .then(handleInvalidResponse).then(res => res.json());
};

/** Statistiche del giocatore loggato (per la scheda profilo). */
const getProfileStats = async () => {
    return await fetch(SERVER_URL + "/profile", { credentials: "include" })
        .then(handleInvalidResponse).then(res => res.json());
};

/** Abbandona una partita non ancora inviata (la rimuove dal db). */
const abandonGame = async (gameId) => {
    return await fetch(SERVER_URL + `/games/${gameId}`, {
        method: "DELETE",
        credentials: "include",
    }).then(handleInvalidResponse);
};

/** Registra un nuovo utente. Vuole { email, username, password }. Il server fa il login automatico.
 *  In caso di errore lancia un Error col messaggio del server (es. "Username già in uso"). */
const register = async (credentials) => {
    const response = await fetch(SERVER_URL + "/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(credentials),
    });
    if (!response.ok) {
        let message = "Registrazione non riuscita";
        try { const data = await response.json(); if (data.error) message = data.error; } catch { /* ignora */ }
        throw new Error(message);
    }
    return response.json();
};

/** Cambia l'immagine profilo dell'utente loggato. Vuole il percorso dell'avatar. */
const setAvatar = async (avatar) => {
    return await fetch(SERVER_URL + "/profile/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ avatar }),
    }).then(handleInvalidResponse).then(res => res.json());
};

const API = { logIn, getUserInfo, logOut, getMap, newGame, submitRoute, getLeaderboard, getProfileStats, abandonGame, register, setAvatar };
export default API;
