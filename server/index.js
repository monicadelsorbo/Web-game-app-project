import express from "express";
import morgan from "morgan";
import cors from "cors";
import { param, body, validationResult } from "express-validator";
import UserDao from "./dao-users.js";
import * as gameDao from "./dao-game.js";
import * as gameLogic from "./game-logic.js";

const userDao = new UserDao();

// Limite di tempo della Pianificazione (90s) + un piccolo margine (2s) per i ritardi di rete.
const TIME_LIMIT_MS = 90 * 1000;
const EPSILON_MS = 2 * 1000;

// Fasce di distanza (in tratte) per difficoltà, peso della vittoria per il livello,
// e formula del livello (uguale a quella del client: livello n richiede 4n-2 vittorie pesate).
const DIFFICULTY_RANGE = { facile: [3, 4], medio: [5, 6], difficile: [7, Infinity] };
const DIFFICULTY_WEIGHT = { facile: 1, medio: 2, difficile: 3 };
const levelFromWins = (w) => Math.min(20, Math.floor((w + 2) / 4));

// Mescola un array (Fisher-Yates) senza modificare l'originale: l'elenco tratte è mostrato in ordine casuale.
const shuffled = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const app = express();
app.use(morgan("dev"));
app.use(express.json());   // permette di leggere il body JSON delle richieste

const corsOptions = {
  origin: "http://localhost:5173",  // l'origine del client autorizzato (Vite)
  credentials: true,                // permette l'invio del cookie di sessione tra le due origini
};
app.use(cors(corsOptions));


import passport from "passport";
import LocalStrategy from "passport-local";

// Si dice a passport come verificare le credenziali, passando una funzione verify
// Strategia locale: cerca nel DB un utente con email/password corrispondenti.
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUserByCredentials(username, password);
  if (!user)
    return callback(null, false, "Incorrect username or password");
  return callback(null, user); //utente valido
}));

// Salva l'utente nella sessione.
passport.serializeUser(function (user, callback) {
  callback(null, user);
});

// Ricostruisce req.user dai dati di sessione.
passport.deserializeUser(function (user, callback) {
  return callback(null, user);
});

import session from "express-session";

app.use(session({
  secret: "una-frase-segreta", // firma il cookie di sessione
  resave: false, //non risalva una sessione se non è cambiata
  saveUninitialized: false, //non crea sessioni vuote per chi non si è loggato
}));
app.use(passport.authenticate("session")); // aggancia Passport alla sessione

// `express-session` gestisce la sessione e il cookie; `passport.authenticate("session")` fa sì
// che, se esiste una sessione valida, Passport popoli `req.user` automaticamente.

// Middleware che protegge le route: 401 se non autenticato 
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) //req.isAuthenticated() (fornita da Passport) è true se c'è una sessione valida.
    return next();
  return res.status(401).json({ error: "Not authorized" });
};


const errorFormatter = ({ msg }) => msg; //Estrae il messaggio di errore da un oggetto

const onValidationErrors = (result, res) => {
  const errors = result.formatWith(errorFormatter);
  return res.status(422).json({ validationErrors: errors.mapped() });
};


// POST /api/sessions  -> login
app.post("/api/sessions", function (req, res, next) {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err); //passa l'errore al gestore degli errori.
    if (!user) return res.status(401).json({ error: info }); //Credenziali errate
    req.login(user, (err) => { //Funzione di passport che apre la sessione e fa partire il cookie    
      if (err) return next(err);
      return res.status(201).json(req.user);  // 201 Created: sessione creata
    });
  })(req, res, next);
});

// GET /api/sessions/current  -> verifica se l'utente è loggato
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated())
    res.status(200).json(req.user);
  else
    res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/sessions/current  -> logout
app.delete("/api/sessions/current", (req, res) => {
  req.logout(() => {
    res.end(); //chiude la risposta senza body (status 200 di default)
  });
});

// POST /api/users  -> registrazione di un nuovo utente, seguita dal login automatico.
app.post("/api/users",
  [
    body("email").isEmail().withMessage("Email non valida"),
    body("password").isLength({ min: 6 }).withMessage("La password deve avere almeno 6 caratteri"),
    body("username").isString().trim().notEmpty().withMessage("Username obbligatorio"),
  ],
  async (req, res, next) => {
    const invalidFields = validationResult(req);
    if (!invalidFields.isEmpty()) return onValidationErrors(invalidFields, res);
    try {
      const email = req.body.email;
      const username = req.body.username.trim();    // nome mostrato nel profilo, deve essere unico
      if (await userDao.emailExists(email)) return res.status(409).json({ error: "Email già in uso" });
      if (await userDao.nameExists(username)) return res.status(409).json({ error: "Username già in uso" });
      const result = await userDao.createUser(email, username, req.body.password);
      if (result.error) return res.status(409).json({ error: result.error });
      req.login(result, (err) => {                 // login automatico: apre la sessione
        if (err) return next(err);
        return res.status(201).json(req.user);
      });
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

// GET /api/map -> rete completa per la fase di Setup (stazioni, linee, tratte con colore).
app.get("/api/map", isLoggedIn, async (req, res) => {
  try {
    const [stations, lines, tracts] = await Promise.all([  //prende un array di Promise e ne crea una sola che si risolve quando tutte e tre hanno finito
      gameDao.listStations(), gameDao.listLines(), gameDao.listTracts(),
    ]);
    res.json({ //Lo status è di default 200 OK
      // Niente 'loot' qui: in Setup non serve.
      stations: stations.map((s) => ({ id: s.id, name: s.name, pos_x: s.pos_x, pos_y: s.pos_y })),
      lines: lines,
      tracts: tracts,
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/games -> inizia una partita: assegna partenza/arrivo (distanza >= 3) e avvia il timer.
app.post("/api/games", isLoggedIn, async (req, res) => {
  try {
    const tutorial = req.body.tutorial === true;
    // difficoltà scelta dal client (default 'facile' se mancante/non valida)
    const difficulty = tutorial ? "facile" : (["facile", "medio", "difficile"].includes(req.body.difficulty) ? req.body.difficulty : "facile");
    const [stations, tracts] = await Promise.all([gameDao.listStations(), gameDao.listTracts()]);
    const graph = gameLogic.buildGraph(stations, tracts);
    let pair;
    if (tutorial) {
      pair = { departureId: 1, arrivalId: 12 }; // prima partita guidata fissa: Versailles -> Montparnasse (3 tratte, tutte Linea Oro)
    } else {
      const [minD, maxD] = DIFFICULTY_RANGE[difficulty];
      pair = gameLogic.pickStartEnd(stations, graph.adj, minD, maxD); // partenza/arrivo nella fascia della difficoltà
      if (!pair) return res.status(500).json({ error: "Impossibile assegnare partenza e arrivo" });
    }

    const createdAt = new Date().toISOString();
    const gameId = await gameDao.createGame(req.user.id, pair.departureId, pair.arrivalId, createdAt, difficulty, tutorial ? 1 : 0);

    const dep = graph.stationById.get(pair.departureId);
    const arr = graph.stationById.get(pair.arrivalId);
    res.status(201).json({
      gameId,
      departure: { id: dep.id, name: dep.name, loot: dep.loot }, // loot solo della partenza
      arrival: { id: arr.id, name: arr.name },
      // Mappa di Pianificazione: solo pallini + nomi (niente linee/colori).
      stations: stations.map((s) => ({ id: s.id, name: s.name, pos_x: s.pos_x, pos_y: s.pos_y })),
      // Elenco tratte come coppie di stazioni, senza linea, in ordine casuale (cambia a ogni partita).
      tracts: shuffled(tracts).map((t) => ({
        id: t.id,
        a: { id: t.station_a_id, name: graph.stationById.get(t.station_a_id).name },
        b: { id: t.station_b_id, name: graph.stationById.get(t.station_b_id).name },
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// DELETE /api/games/:gameId -> abbandona una partita non ancora inviata (solo se 'planning').
app.delete("/api/games/:gameId", isLoggedIn, [param("gameId").isInt()], async (req, res) => {
  const invalidFields = validationResult(req);
  if (!invalidFields.isEmpty()) return onValidationErrors(invalidFields, res);
  try {
    const gameId = Number(req.params.gameId);
    const game = await gameDao.getGame(gameId);
    if (!game || game.user_id !== req.user.id)
      return res.status(404).json({ error: "Game not found" });
    if (game.status !== "planning")
      return res.status(422).json({ error: "Game already played" });
    await gameDao.deleteGame(gameId);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/games/:gameId/route -> invia il percorso, controlla timer, valida ed esegue.
app.post("/api/games/:gameId/route", isLoggedIn,
  [param("gameId").isInt(), body("tractIds").isArray(), body("tractIds.*").isInt()],  //Array di validatori di express-validator
  async (req, res) => {

    const invalidFields = validationResult(req);
    if (!invalidFields.isEmpty()) return onValidationErrors(invalidFields, res);

    try {
      const gameId = Number(req.params.gameId);
      const game = await gameDao.getGame(gameId);
      // La partita deve esistere ed essere dell'utente loggato.
      if (!game || game.user_id !== req.user.id)
        return res.status(404).json({ error: "Game not found" });
      // Deve essere ancora in corso (non gia' conclusa).
      if (game.status !== "planning")
        return res.status(422).json({ error: "Game already played" });

      const tractIds = req.body.tractIds;
      const [stations, tracts, events] = await Promise.all([
        gameDao.listStations(), gameDao.listTracts(), gameDao.listEvents(),
      ]);
      const graph = gameLogic.buildGraph(stations, tracts);

      // Tempo trascorso dall'inizio della Pianificazione.
      const elapsed = Date.now() - Date.parse(game.created_at);
      const inTime = game.tutorial ? true : (elapsed <= TIME_LIMIT_MS + EPSILON_MS); // la partita guidata non ha limite di tempo
      const validShape = gameLogic.validateRoute(tractIds, game.departure_id, game.arrival_id, graph.tractById, graph.interchange);
      const valid = inTime && validShape;

      if (!valid) {
        await gameDao.finishGame(gameId, "lost", 0); // percorso non valido / tempo scaduto -> 0 monete
        return res.json({ valid: false, finalScore: 0, steps: [] });
      }

      const result = gameLogic.runExecution(tractIds, game.departure_id, graph.tractById, graph.stationById, events);
      const stats = await gameDao.getUserStats(req.user.id);   // statistiche PRIMA di registrare questa vittoria
      const newRecord = result.finalScore > stats.bestScore;
      // calcolo se questa vittoria fa salire di livello (le vittorie sono pesate per difficoltà)
      const weight = DIFFICULTY_WEIGHT[game.difficulty] || 1;
      const oldLevel = levelFromWins(stats.wins);
      const newLevel = levelFromWins(stats.wins + weight);
      await gameDao.finishGame(gameId, "won", result.finalScore);
      res.json({
        valid: true, finalScore: result.finalScore, steps: result.steps, newRecord,
        leveledUp: newLevel > oldLevel, newLevel,
      });
    } catch (err) {
      res.status(503).json({ error: "Database error" });
    }
  }
);

// GET /api/leaderboard -> miglior punteggio per utente.
app.get("/api/leaderboard", isLoggedIn, async (req, res) => {
  try {
    const board = await gameDao.getLeaderboard();
    res.json(board);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/profile -> statistiche del giocatore loggato.
app.get("/api/profile", isLoggedIn, async (req, res) => {
  try {
    const stats = await gameDao.getUserStats(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// PUT /api/profile/avatar -> aggiorna l'immagine profilo dell'utente loggato.
app.put("/api/profile/avatar", isLoggedIn,
  [body("avatar").isString().notEmpty()],
  async (req, res) => {
    const invalidFields = validationResult(req);
    if (!invalidFields.isEmpty()) return onValidationErrors(invalidFields, res);
    try {
      await userDao.updateAvatar(req.user.id, req.body.avatar);
      req.user.avatar = req.body.avatar;          // aggiorna anche l'utente in sessione
      req.session.save(() => res.json({ avatar: req.body.avatar }));
    } catch (err) {
      res.status(500).json({ error: "Database error" });
    }
  });

const PORT = 3001;
app.listen(PORT, () => console.log(`Server avviato su http://localhost:${PORT}/`));


