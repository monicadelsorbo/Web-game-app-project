import sqlite3 from "sqlite3";

// Apre (o crea) il file del database SQlite nella cartella del server.
const db = new sqlite3.Database("database.db", (err) => {
    if (err) throw err;
})

export default db;