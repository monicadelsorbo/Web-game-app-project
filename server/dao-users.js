/* Data Access Object (DAO) per accedere ai dati degli utenti */

import db from "./db.js";
import crypto from "crypto";

// Funzione costruttore 
// Tutte le funzioni ritornano i messaggi di errore come oggetto json { error: <string> }
export default function UserDao() {
    //Entrambi i metodi tornano una Promise perchè leggono dal db (utilizzano la funzione asincrona db.get())

    // Recupera un utente dato il suo id (usato, se serve, in deserializeUser)
    this.getUserById = (id) => {
        return new Promise((resolve, reject) => {
            const query = "SELECT * FROM users WHERE id=?";
            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve({ error: "User not found." });
                } else {
                    resolve({ id: row.id, username: row.email, name: row.name, avatar: row.avatar });
                }
            });
        });
    };

    // Verifica le credenziali: cerca l'utente per email e confronta l'hash della password.
    this.getUserByCredentials = (email, password) => {
        return new Promise((resolve, reject) => {
            const sql = "SELECT * FROM users WHERE email=?";
            db.get(sql, [email], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(false);
                } else {
                    const user = { id: row.id, username: row.email, name: row.name, avatar: row.avatar };

                    // Calcolo dell'hash con scrypt
                    crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                        // confronta due Buffer della stessa lunghezza in tempo costante (per non rivelare informazioni tramite i tempi di confronto: difesa dai "timing attack"). Restituisce true/false. La usiamo per confrontare l'hash ricalcolato con quello salvato.
                        if (err) reject(err);
                        if (!crypto.timingSafeEqual(Buffer.from(row.hash, "hex"), hashedPassword))
                            // Buffer è un oggetto globale di Node. Buffer.from() erve a riconvertire la stringa hex salvata (row.hash) in un Buffer di byte, così timingSafeEqual può confrontare due Buffer (l'hash salvato e quello appena calcolato da scrypt, che è già un Buffer).
                            resolve(false);
                        else
                            resolve(user);
                    });
                }
            });
        });
    };

    // Crea un nuovo utente (registrazione): genera salt + hash della password e inserisce la riga.
    // Ritorna l'utente creato, oppure { error } se l'email è già in uso.
    this.createUser = (email, name, password, avatar = null) => {
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16).toString("hex");
            const hash = crypto.scryptSync(password, salt, 32).toString("hex");
            const sql = "INSERT INTO users (email, name, hash, salt, avatar) VALUES (?, ?, ?, ?, ?)";
            db.run(sql, [email, name, hash, salt, avatar], function (err) {
                if (err) {
                    // violazione del vincolo UNIQUE sull'email -> email già registrata
                    if (err.code === "SQLITE_CONSTRAINT") return resolve({ error: "Email già in uso" });
                    return reject(err);
                }
                resolve({ id: this.lastID, username: email, name, avatar });
            });
        });
    };

    // Aggiorna l'avatar di un utente.
    this.updateAvatar = (userId, avatar) => {
        return new Promise((resolve, reject) => {
            db.run("UPDATE users SET avatar = ? WHERE id = ?", [avatar, userId], function (err) {
                err ? reject(err) : resolve(this.changes);
            });
        });
    };

    // Vero se esiste già un utente con questa email.
    this.emailExists = (email) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT 1 FROM users WHERE email = ?", [email], (err, row) =>
                err ? reject(err) : resolve(!!row));
        });
    };

    // Vero se esiste già un utente con questo username (campo name).
    this.nameExists = (name) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT 1 FROM users WHERE name = ?", [name], (err, row) =>
                err ? reject(err) : resolve(!!row));
        });
    };

}
