// DAO per la rete e le partite del gioco

import db from "./db.js";

// Tutte le stazioni (con coordinate e oggetto rubato).
export const listStations = () =>
    new Promise((resolve, reject) => {
        db.all("SELECT id, name, loot, pos_x, pos_y FROM stations", [], (err, rows) =>
            err ? reject(err) : resolve(rows)); //rows è un array
    });

// Tutte le linee (con colore).
export const listLines = () =>
    new Promise((resolve, reject) => {
        db.all("SELECT id, name, color FROM lines", [], (err, rows) =>
            err ? reject(err) : resolve(rows));
    });

// Tutte le tratte (con la linea di appartenenza).
export const listTracts = () =>
    new Promise((resolve, reject) => {
        db.all("SELECT id, line_id, station_a_id, station_b_id FROM tracts", [], (err, rows) =>
            err ? reject(err) : resolve(rows));
    });

// Tutti gli eventi (descrizione + effetto).
export const listEvents = () =>
    new Promise((resolve, reject) => {
        db.all("SELECT id, description, effect FROM events", [], (err, rows) =>
            err ? reject(err) : resolve(rows));
    });

// Crea una nuova partita in stato 'planning'. Ritorna l'id della partita creata.
export const createGame = (userId, departureId, arrivalId, createdAt, difficulty, tutorial = 0) =>
    new Promise((resolve, reject) => {
        const sql = "INSERT INTO games (user_id, departure_id, arrival_id, status, score, created_at, difficulty, tutorial) VALUES (?, ?, ?, 'planning', 0, ?, ?, ?)";
        db.run(sql, [userId, departureId, arrivalId, createdAt, difficulty, tutorial], function (err) {
            err ? reject(err) : resolve(this.lastID); //this.lastID è l'id che il db ha assegnato all'ultima riga inserita, ovvero la partita appena creata
        });
    });

// Recupera una partita dato il suo id (serve per validare l'invio del percorso).
export const getGame = (gameId) =>
    new Promise((resolve, reject) => {
        db.get("SELECT * FROM games WHERE id = ?", [gameId], (err, row) =>
            err ? reject(err) : resolve(row)); //row è una riga sola
    });

// Conclude una partita salvandone esito e punteggio.
export const finishGame = (gameId, status, score) =>
    new Promise((resolve, reject) => {
        db.run("UPDATE games SET status = ?, score = ? WHERE id = ?", [status, score, gameId], function (err) {
            err ? reject(err) : resolve(this.changes); //db.run() non ritorna righe. this.changes contiene il numero di righe modificate
        });
    });

// Classifica: miglior punteggio per ogni utente che ha giocato almeno una partita conclusa.
export const getLeaderboard = () =>
    new Promise((resolve, reject) => {
        const sql = `SELECT u.name AS name, MAX(g.score) AS bestScore
                     FROM games g JOIN users u ON u.id = g.user_id
                     WHERE g.status IN ('won')
                     GROUP BY g.user_id
                     ORDER BY bestScore DESC, u.name ASC`;
        db.all(sql, [], (err, rows) => err ? reject(err) : resolve(rows));
    });

// Statistiche del singolo giocatore (per la scheda profilo).
export const getUserStats = (userId) =>
    new Promise((resolve, reject) => {
        // wins = vittorie PESATE per difficoltà: facile 1, medio 2, difficile 3 (usato anche per il livello).
        const sql = `SELECT
                        IFNULL(SUM(CASE WHEN status IN ('won','lost') THEN 1 ELSE 0 END), 0) AS gamesPlayed,
                        IFNULL(SUM(CASE WHEN status = 'won'
                            THEN (CASE difficulty WHEN 'difficile' THEN 3 WHEN 'medio' THEN 2 ELSE 1 END)
                            ELSE 0 END), 0) AS wins,
                        IFNULL(MAX(CASE WHEN status = 'won'  THEN score ELSE 0 END), 0) AS bestScore
                     FROM games WHERE user_id = ?`;
        db.get(sql, [userId], (err, row) => err ? reject(err) : resolve(row));
    });

// Cancella una partita non ancora giocata (solo status 'planning'), es. se abbandonata.
export const deleteGame = (gameId) =>
    new Promise((resolve, reject) => {
        db.run("DELETE FROM games WHERE id = ? AND status = 'planning'", [gameId], function (err) {
            err ? reject(err) : resolve(this.changes);
        });
    });