// Crea le tabelle del db e inserisce i dati iniziali: utenti, rete (linee, stazioni, tratte)

import sqlite3 from "sqlite3";
import crypto from "crypto";

const db = new sqlite3.Database("database.db", (err) => { if (err) throw err; });

const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (err) { err ? reject(err) : resolve(this); });
    });

// Crea un utente con password hashata
function makeUser(email, name, password, avatar) {
    const salt = crypto.randomBytes(16).toString("hex");
    // genera n byte casuali e li restituisce come buffer (sequenza di byte) che vengono poi trasformati in esadecimale.
    const hash = crypto.scryptSync(password, salt, 32).toString("hex");
    // versione sincrona di scrypt: calcola l'hash della password (usando il salt) e restituisce subito un Buffer di keylen byte.
    return { email, name, hash, salt, avatar };
}

// Linee (id, nome, colore)
const LINES = [
    { id: 1, name: "Linea Oro", color: "#FFD23F" },
    { id: 2, name: "Linea Rubino", color: "#FF3B5C" },
    { id: 3, name: "Linea Zaffiro", color: "#2EA6FF" },
    { id: 4, name: "Linea Smeraldo", color: "#22E0A0" },
    { id: 5, name: "Linea Ametista", color: "#C46BFF" },
];

// Stazioni (id, nome, oggetto rubato, coordinate sulla mappa)
const STATIONS = [
    { id: 1, name: "Versailles", loot: "Un candelabro d'oro della Galleria degli Specchi", x: 70, y: 540 },
    { id: 2, name: "Torre Eiffel", loot: "Un tratto della scala originale del 1889", x: 215, y: 430 },
    { id: 3, name: "Arco di Trionfo", loot: "Un frammento dell'altorilievo 'La Marseillaise' di Rude", x: 185, y: 150 },
    { id: 4, name: "Les Invalides", loot: "Il bicorno di Napoleone", x: 335, y: 470 },
    { id: 5, name: "Musée d'Orsay", loot: "'Notte stellata sul Rodano' di Van Gogh", x: 390, y: 335 },
    { id: 6, name: "Museo del Louvre", loot: "La Gioconda", x: 545, y: 300 },
    { id: 7, name: "Opéra Garnier", loot: "Il grande lampadario dell'Opéra", x: 430, y: 165 },
    { id: 8, name: "Sacré-Cœur", loot: "Un reliquiario dorato", x: 630, y: 95 },
    { id: 9, name: "Centre Pompidou", loot: "Un quadro di Kandinsky", x: 710, y: 255 },
    { id: 10, name: "Île de la Cité", loot: "La Corona di Spine", x: 565, y: 415 },
    { id: 11, name: "Panthéon", loot: "Il Pendolo di Foucault", x: 665, y: 510 },
    { id: 12, name: "Montparnasse", loot: "Una scultura di Bourdelle", x: 410, y: 565 },
    { id: 13, name: "Place d'Italie", loot: "Un arazzo della Manifattura dei Gobelins", x: 810, y: 545 },
    { id: 14, name: "Cité des Sciences", loot: "Un campione di roccia lunare", x: 910, y: 160 },
];

// Per ogni linea, la SEQUENZA ordinata di stazioni (per id). Le tratte si ricavano da qui.
// Rete "allungata": diametro 9 tratte, così esistono percorsi facili (3-4), medi (5-6) e difficili (7+).
// 14 stazioni, 5 linee, 6 stazioni di interscambio (<= metà delle stazioni).
const LINE_SEQUENCES = {
    1: [1, 2, 4, 12, 10, 11, 13], // Versailles–Eiffel–Invalides–Montparnasse–Île de la Cité–Panthéon–Place d'Italie
    2: [2, 5, 6, 9, 14],          // Eiffel–Orsay–Louvre–Pompidou–Cité des Sciences
    3: [5, 7, 8],                 // Orsay–Opéra–Sacré-Cœur
    4: [3, 7, 6],                 // Arco di Trionfo–Opéra–Louvre
    5: [8, 9],                    // Sacré-Cœur–Pompidou
};

// Eventi (descrizione, effetto da -4 a +4)
const EVENTS = [
    ["Viaggio liscio nell'ombra, nessuno ti nota", 0],
    ["Due innamorati si baciano sul binario: ti distrai", -1],
    ["Un gatto troppo carino reclama una carezza", -1],
    ["Perdi il cappello a tesa larga nella corsa", -1],
    ["Un mimo ti blocca il passaggio: minuti persi", -1],
    ["Acquazzone parigino, i tombini straripano", -2],
    ["Un borseggiatore ti alleggerisce il bottino", -2],
    ["Un flic spunta all'improvviso: fuggi a fatica", -3],
    ["Posto di blocco della gendarmeria", -4],
    ["Sciopero della metro: banchina deserta, fili via", 2],
    ["Un artista di strada ti copre con la sua musica", 1],
    ["Un bouquiniste della Senna ti svela una scorciatoia", 2],
    ["Una venditrice di crêpes ti nasconde dai flic", 2],
    ["Un baule dimenticato pieno di gioielli", 4],
    ["Un carretto di macarons ti rimette in forze", 3],
    ["Ti addormenti profondamente per troppa stanchezza", -4],
    ["I flash dei turisti accecano le guardie", 2],
    ["Tornello bloccato: lo scavalchi goffamente perdendo secondi", -1],
    ["Un turista ti chiede indicazioni e ti fa perdere tempo", -1],
    ["Una danza bretone attira la folla e ti copre", 1],
    ["Un cane dell'unità cinofila fiuta la tua borsa", -3],
    ["Un topo enorme attraversa con un croissant: tutto normale", 0],
    ["Inciampi nelle scale della metro", -1],
    ["Trovi un carrello della manutenzione e ci salti su", 4],
    ["Controllore pignolo: devi seminarlo per le scale", -2],
    ["Un picchetto di manifestanti blocca l'uscita", -3],
    ["Il treno sfreccia e copre il rumore dei tuoi passi", 2],
    ["Allarme pacco sospetto: la folla blocca gli agenti", 3],
    ["Trovi una vecchia mappa dei tunnel di servizio", 4],
    ["L'odore di pane di una boulangerie confonde i cani", 2],
];


// Utenti "riempitivi" per popolare la classifica (tanti giocatori con punteggi vari)
const FILLER_NAMES = ["Spettro", "Lupo", "Volpe", "Sciacallo", "Falco", "Pantera", "Corvo", "Serpente",
    "Scorpione", "Ombra", "Fulmine", "Vipera", "Predone", "Briccone", "Manolesta", "Spadino", "Lampo",
    "Grimaldello", "Maschera", "Soffio"];
const FILLER_USERS = FILLER_NAMES.map((nm, i) =>
    makeUser(`ladro${i + 1}@paris.fr`, nm, "password", `/Avatars/avatar${(i % 3) + 1}.png`));

// Utenti già registrati
const USERS = [
    makeUser("marie.dubois@paris.fr", "Marie Dubois", "password", "/Avatars/avatar3.png"),
    makeUser("arsene.lupin@paris.fr", "Arsène Lupin", "password", "/Avatars/avatar1.png"),
    makeUser("vidocq@paris.fr", "Eugène Vidocq", "password", "/Avatars/avatar2.png"),
    makeUser("josephine.balsamo@paris.fr", "Joséphine Balsamo", "password", "/Avatars/avatar1.png"), // 0 partite -> livello 0
    makeUser("fantomas@paris.fr", "Fantômas", "password", "/Avatars/avatar2.png"),     // -> livello 11
    makeUser("belphegor@paris.fr", "Belphégor", "password", "/Avatars/avatar3.png"),   // -> livello 12
    makeUser("cartouche@paris.fr", "Cartouche", "password", "/Avatars/avatar1.png"),   // -> livello 4
    makeUser("mandrin@paris.fr", "Louis Mandrin", "password", "/Avatars/avatar2.png"), // -> livello 19
    makeUser("rocambole@paris.fr", "Rocambole", "password", "/Avatars/avatar3.png"),   // -> livello 20 (massimo)
    ...FILLER_USERS,
];

// Partite già giocate
// Genera `count` partite vinte per un utente con una certa difficoltà (per popolare i livelli).
function wonGames(userId, difficulty, count, baseScore) {
    const arr = [];
    for (let i = 0; i < count; i++) {
        const day = String((i % 27) + 1).padStart(2, "0");
        arr.push([userId, 1, 13, "won", baseScore + (i % 6), `2026-05-${day}T12:00:00.000Z`, difficulty]);
    }
    return arr;
}

// Una partita vinta per ogni utente riempitivo, con punteggi vari (id utente = 10 + indice, perché prima ci sono 9 utenti).
const FILLER_GAMES = FILLER_USERS.map((_, i) => {
    const uid = 10 + i;
    const diff = ["facile", "medio", "difficile"][i % 3];
    const score = 8 + ((i * 7) % 27); // punteggi vari (8..34)
    const day = String((i % 27) + 1).padStart(2, "0");
    return [uid, 1, 13, "won", score, `2026-05-${day}T15:00:00.000Z`, diff];
});

// [user_id, departure_id, arrival_id, status, score, created_at, difficulty]
const GAMES = [
    [1, 1, 14, "won", 14, "2026-06-15T22:10:00.000Z", "facile"],
    [2, 3, 11, "won", 11, "2026-06-16T01:30:00.000Z", "medio"],
    [2, 8, 12, "won", 19, "2026-06-16T02:05:00.000Z", "difficile"],
    [2, 1, 13, "lost", 0, "2026-06-16T02:40:00.000Z", "difficile"],
    [3, 14, 1, "won", 17, "2026-06-14T23:15:00.000Z", "medio"],
    [3, 8, 13, "won", 9, "2026-06-15T00:50:00.000Z", "facile"],
    // utenti a vari livelli (vittorie pesate: facile 1, medio 2, difficile 3)
    ...wonGames(5, "difficile", 14, 20),  // 14*3 = 42  -> livello 11
    ...wonGames(6, "difficile", 16, 22),  // 16*3 = 48  -> livello 12
    ...wonGames(7, "facile", 14, 12),     // 14*1 = 14  -> livello 4
    ...wonGames(8, "difficile", 25, 25),  // 25*3 = 75  -> livello 19
    ...wonGames(9, "difficile", 26, 28),  // 26*3 = 78  -> livello 20 (massimo)
    ...FILLER_GAMES,
];


async function main() {
    // Cancella le tabelle (ordine inverso alle dipendenze) per poter rilanciare lo script.
    await run("DROP TABLE IF EXISTS games");
    await run("DROP TABLE IF EXISTS tracts");
    await run("DROP TABLE IF EXISTS stations");
    await run("DROP TABLE IF EXISTS lines");
    await run("DROP TABLE IF EXISTS events");
    await run("DROP TABLE IF EXISTS users");


    // Creazione tabelle
    await run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        avatar TEXT )`);
    await run(`CREATE TABLE lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT NOT NULL )`);
    await run(`CREATE TABLE stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        loot TEXT,
        pos_x REAL NOT NULL,
        pos_y REAL NOT NULL )`);
    await run(`CREATE TABLE tracts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        line_id INTEGER NOT NULL,
        station_a_id INTEGER NOT NULL,
        station_b_id INTEGER NOT NULL,
        FOREIGN KEY (line_id) REFERENCES lines(id),
        FOREIGN KEY (station_a_id) REFERENCES stations(id),
        FOREIGN KEY (station_b_id) REFERENCES stations(id),
        UNIQUE (station_a_id, station_b_id) )`);
    await run(`CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        effect INTEGER NOT NULL )`);
    await run(`CREATE TABLE games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        departure_id INTEGER NOT NULL,
        arrival_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        score INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        difficulty TEXT NOT NULL DEFAULT 'facile',
        tutorial INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (departure_id) REFERENCES stations(id),
        FOREIGN KEY (arrival_id) REFERENCES stations(id) )`);

    // Inserimento linee
    for (const l of LINES)
        await run("INSERT INTO lines (id, name, color) VALUES (?, ?, ?)", [l.id, l.name, l.color]);

    // Inserimento stazioni
    for (const s of STATIONS)
        await run("INSERT INTO stations (id, name, loot, pos_x, pos_y) VALUES (?, ?, ?, ?, ?)",
            [s.id, s.name, s.loot, s.x, s.y]);

    // Inserimento tratte: per ogni linea, ogni coppia consecutiva della sequenza e' una tratta.
    for (const lineId of Object.keys(LINE_SEQUENCES)) { // restituisce le chiavi dell'oggetto come array di stringhe
        const seq = LINE_SEQUENCES[lineId];
        for (let i = 0; i < seq.length - 1; i++) // Genera 33 tratte
            await run("INSERT INTO tracts (line_id, station_a_id, station_b_id) VALUES (?, ?, ?)",
                [Number(lineId), seq[i], seq[i + 1]]); //Converte poi la stringa in un numero
    }

    // Inserimento eventi
    for (const [description, effect] of EVENTS)
        await run("INSERT INTO events (description, effect) VALUES (?, ?)", [description, effect]);

    // Inserimento utenti
    for (const u of USERS)
        await run("INSERT INTO users (email, name, hash, salt, avatar) VALUES (?, ?, ?, ?, ?)",
            [u.email, u.name, u.hash, u.salt, u.avatar]);

    // Inserimento partite gia' giocate
    for (const g of GAMES)
        await run("INSERT INTO games (user_id, departure_id, arrival_id, status, score, created_at, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)", g);

    db.close((err) => {
        if (err) throw err;
        console.log("Database inizializzato.");
    });
}

main().catch((err) => { console.error(err); db.close(); });
