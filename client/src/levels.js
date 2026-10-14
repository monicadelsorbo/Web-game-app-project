// Sistema di livelli basato sul numero di partite vinte.
// Livello n richiede (4*n - 2) vittorie: liv.1 = 2, liv.2 = 6, ... liv.20 = 78. Livello massimo: 20.

export const MAX_LEVEL = 20;

// Titolo mostrato per ogni livello (indice = livello, da 0 a 20). Modificabili a piacere.
const LEVEL_NAMES = [
    "Recluta",                    // 0  (meno di 2 vittorie)
    "Borseggiatore",              // 1
    "Topo d'appartamento",        // 2
    "Scassinatore",               // 3
    "Ladro di strada",            // 4
    "Volpe dei vicoli",           // 5
    "Maestro del travestimento",  // 6
    "Falsario provetto",          // 7
    "Re dello scasso",            // 8
    "Spia notturna",              // 9
    "Il maestro del furto",       // 10
    "Fantasma della metro",       // 11
    "Gentiluomo ladro",           // 12
    "Ombra di Parigi",            // 13
    "Signore della notte",        // 14
    "Genio del colpo",            // 15
    "Stratega della fuga",        // 16
    "Leggenda dei tetti",         // 17
    "Mente criminale",            // 18
    "Re dei ladri",               // 19
    "Maestro assoluto",           // 20
];

// Vittorie necessarie per raggiungere un certo livello.
function winsForLevel(level) {
    return 4 * level - 2;
}

// Dato il numero di vittorie, restituisce livello, nome e avanzamento verso il livello successivo.
export function levelInfo(wins) {
    const w = wins || 0;

    // livello = il più grande n tale che (4n - 2) <= vittorie, limitato a [0, MAX_LEVEL]
    let level = Math.floor((w + 2) / 4);
    if (level < 0) level = 0;
    if (level > MAX_LEVEL) level = MAX_LEVEL;

    const name = LEVEL_NAMES[level];

    if (level >= MAX_LEVEL) {
        // livello massimo: barra piena, niente prossimo livello
        return { level, name, wins: w, nextThreshold: winsForLevel(MAX_LEVEL), progress: 1, isMax: true };
    }

    const nextThreshold = winsForLevel(level + 1);    // vittorie necessarie per il prossimo livello
    const progress = Math.min(1, w / nextThreshold);  // barra = vittorie / soglia del prossimo livello
    return { level, name, wins: w, nextThreshold, progress, isMax: false };
}
