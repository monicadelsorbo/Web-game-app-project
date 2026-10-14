// A ogni stazione (per id) il nome del suo file in public/Icone.
const ICONS = {
    1: "Versailles",
    2: "TorreEiffel",
    3: "ArcoDiTrionfo",
    4: "LesInvalides",
    5: "MuseoD'Orsay",
    6: "Louvre",
    7: "OperaGarnier",
    8: "SacreCoeur",
    9: "Pompidou",
    10: "Notre_dame",
    11: "Pantheon",
    12: "MontParnasse",
    13: "PlaceD'Italie",
    14: "MuseoDellaScienza",
};

export function iconFor(station) {
    const name = ICONS[station.id];
    return name ? `/Icone/${name}.png` : "";
}