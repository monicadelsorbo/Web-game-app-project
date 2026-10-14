const STARTING_COINS = 20; //numero di monete iniziali per ogni partita (se vinta)

/*
 * Costruisce il grafo della rete a partire da stazioni e tratte.
 * Ritorna:
 *  - stationById: Map id -> stazione
 *  - tractById:   Map id -> { id, a, b, lineId }
 *  - adj:         Map idStazione -> [ { tractId, other, lineId } ]   (adiacenze)
 *  - interchange: Set degli id delle stazioni di interscambio (su >= 2 linee)
 */
export function buildGraph(stations, tracts) {
    const stationById = new Map(); // id stazione -> oggetto stazione
    const adj = new Map(); // id stazione -> lista di archi (adiacenze)
    const linesOfStation = new Map(); // id stazione -> set di linee che passano per quella stazione
    for (const s of stations) {
        stationById.set(s.id, s);
        adj.set(s.id, []);
        linesOfStation.set(s.id, new Set());
    }


    // Per ogni tratta salva il suo id in tractById, insieme a i suoi estremi e la linea di cui fa parte
    // Siccome la tratta è bidirezionale, aggiunge un arco a entrambi gli estremi stazione
    // Segna quella linea nell'insieme delle linee di entrambe le stazioni
    const tractById = new Map();
    for (const t of tracts) {
        tractById.set(t.id, { id: t.id, a: t.station_a_id, b: t.station_b_id, lineId: t.line_id });
        adj.get(t.station_a_id).push({ tractId: t.id, other: t.station_b_id, lineId: t.line_id });
        adj.get(t.station_b_id).push({ tractId: t.id, other: t.station_a_id, lineId: t.line_id });
        linesOfStation.get(t.station_a_id).add(t.line_id);
        linesOfStation.get(t.station_b_id).add(t.line_id);
    }

    // Definisce le stazioni di interscambio, cioè quelle il cui insieme di linee che la passano è >= 2
    const interchange = new Set();
    for (const [stationId, lines] of linesOfStation)
        if (lines.size >= 2) interchange.add(stationId);

    return { stationById, tractById, adj, interchange };
}

// BFS (visita in ampiezza): distanza in numero di tratte da startId verso tutte le stazioni.
export function bfsDistances(adj, startId) {
    const dist = new Map([[startId, 0]]);
    const queue = [startId];
    while (queue.length > 0) {
        const current = queue.shift();
        for (const edge of adj.get(current)) {
            if (!dist.has(edge.other)) {
                dist.set(edge.other, dist.get(current) + 1);
                queue.push(edge.other);
            }
        }
    }
    return dist;
}

// Sceglie partenza e arrivo casuali con distanza (in tratte) compresa in [minD, maxD].
// Le fasce realizzano le difficoltà: facile 3-4, medio 5-6, difficile 7+.
export function pickStartEnd(stations, adj, minD = 3, maxD = Infinity) {
    const ids = stations.map((s) => s.id);
    for (let attempt = 0; attempt < 500; attempt++) {
        const departureId = ids[Math.floor(Math.random() * ids.length)];
        const dist = bfsDistances(adj, departureId);
        const candidates = [...dist.entries()]
            .filter(([, d]) => d >= minD && d <= maxD)
            .map(([id]) => id);
        if (candidates.length > 0) {
            const arrivalId = candidates[Math.floor(Math.random() * candidates.length)];
            return { departureId, arrivalId };
        }
    }
    return null; // non dovrebbe mai accadere su una rete connessa
}

/*
 * Valida il percorso inviato (sequenza ordinata di id di tratte).
 * Regole: tratte esistenti e non ripetute; sequenza contigua; inizio = partenza e
 * fine = arrivo; cambio di linea consentito solo nelle stazioni di interscambio.
 */
export function validateRoute(tractIds, departureId, arrivalId, tractById, interchange) {
    if (!Array.isArray(tractIds) || tractIds.length === 0) return false;

    const used = new Set();
    let current = departureId;
    let previousLine = null;

    for (const id of tractIds) {
        const t = tractById.get(id);
        if (!t) return false;                 // tratta inesistente
        if (used.has(id)) return false;       // tratta gia' usata

        let next;
        if (t.a === current) next = t.b;
        else if (t.b === current) next = t.a;
        else return false;                    // non contigua alla stazione corrente

        if (previousLine !== null && t.lineId !== previousLine) {
            if (!interchange.has(current)) return false; // cambio linea fuori da un interscambio
        }

        used.add(id);
        previousLine = t.lineId;
        current = next;
    }

    return current === arrivalId;             // deve terminare nell'arrivo assegnato
}

/*
 * Esegue la partita (percorso gia' validato): per ogni tratta estrae un evento casuale,
 * aggiorna le monete e registra la tappa. Il punteggio finale e' normalizzato a >= 0.
 */
export function runExecution(tractIds, departureId, tractById, stationById, events) {
    let coins = STARTING_COINS;
    let current = departureId;
    const steps = [];

    for (const id of tractIds) {
        const t = tractById.get(id);
        const next = t.a === current ? t.b : t.a;
        const ev = events[Math.floor(Math.random() * events.length)];
        coins += ev.effect;
        steps.push({
            from: { id: current, name: stationById.get(current).name },
            to: { id: next, name: stationById.get(next).name },
            event: { description: ev.description, effect: ev.effect },
            coinsAfter: coins,
        });
        current = next;
    }

    return { steps, finalScore: Math.max(0, coins) };
}
