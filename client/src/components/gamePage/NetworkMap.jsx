/*
 * Mappa della rete disegnata in SVG 
 * SVG è un formato per disegnare grafica "vettoriale" descrivendola con tag XML.
 */

//Riceve le props o da SetupView o da PlanningView
// stations → le stazioni (con coordinate pos_x, pos_y, nome, ecc.).
// showLines → mostrare o no le linee colorate.
// tracts, lines → le tratte e le linee (servono solo se disegni le linee).
// departureId, arrivalId → le stazioni speciali da evidenziare (in questo uso non vengono passate, quindi restano undefined).
import PropTypes from "prop-types";
import { iconFor } from "../../icons.js";
import "./NetworkMap.css";


function NetworkMap(props) {
    const { stations, showLines, tracts, lines, departureId, arrivalId } = props;

    // Mappe di comodo: stazione per id e colore per id-linea.
    const byId = {};
    stations.forEach((s) => { byId[s.id] = s; }); //byId ti dà la stazione dato il suo id;
    const colorOf = {};
    (lines || []).forEach((l) => { colorOf[l.id] = l.color; }); //colorOf ti dà il colore data una linea

    const R = 29;       // raggio dei pallini normali
    const Rbig = 33;    // raggio di partenza/arrivo


    return (
        <svg viewBox="0 0 1000 605" className="network-map">
            {showLines && tracts && tracts.map((t) => { //disegna le linee solo se showLines è vero e ci sono tratte
                const a = byId[t.station_a_id];
                const b = byId[t.station_b_id];
                if (!a || !b) return null;
                return (
                    <line key={t.id} x1={a.pos_x} y1={a.pos_y} x2={b.pos_x} y2={b.pos_y}
                        stroke={colorOf[t.line_id] || "#888"} strokeWidth="6" strokeLinecap="round" /> //strokeLinecap="round" arrotonda le estremità
                );
            })}

            {stations.map((s) => {
                const isDep = s.id === departureId;
                const isArr = s.id === arrivalId;
                const isSpecial = isDep || isArr;
                const r = isSpecial ? Rbig : R;
                const ring = isDep ? "#FFD23F" : isArr ? "#22E0A0" : "#0e1016";
                const strokeW = isSpecial ? 7 : 3; //Spessore del bordo del cerchio dell'immagine
                const clipR = r - 2; //raggio della maschera per l'immagine
                const badgeLabel = isDep ? "START" : isArr ? "END" : null; //etichetta (START / END)
                const badgeW = isDep ? 58 : 46; //larghezza del badge. La targhetta "START" è leggermente più larga perché la parola è più lunga di "END", così il testo ci sta bene dentro.
                const nameGap = isSpecial ? r + 18 : r + 6; //distanza del nome dalla stazione
                return (
                    <g key={s.id}>
                        {isSpecial && (
                            <circle cx={s.pos_x} cy={s.pos_y} r={r + 6} fill="none"
                                stroke={ring} strokeWidth="3" opacity="0.45" />
                        )}
                        <circle cx={s.pos_x} cy={s.pos_y} r={r} fill="#ffffff" stroke={ring} strokeWidth={strokeW} />
                        <clipPath id={`clip-${s.id}`}>
                            <circle cx={s.pos_x} cy={s.pos_y} r={clipR} />
                        </clipPath>
                        <image href={iconFor(s)}
                            x={s.pos_x - clipR} y={s.pos_y - clipR}
                            width={clipR * 2} height={clipR * 2}
                            clipPath={`url(#clip-${s.id})`} preserveAspectRatio="xMidYMid slice" />
                        <circle cx={s.pos_x} cy={s.pos_y} r={r} fill="none" stroke={ring} strokeWidth={strokeW} />
                        <text x={s.pos_x} y={s.pos_y - nameGap} textAnchor="middle" fontSize="13" fontWeight="700"
                            fill="#000000">
                            {s.name}
                        </text>
                        {badgeLabel && (
                            <g>
                                <animateTransform attributeName="transform" type="translate" //Animazione SVG dichiarativa che anima uno spostamento (basta specificare le posizioni iniziali e finali, la duratae il numero di volte)
                                    values="0 0; 0 -7; 0 0" dur="0.8s" repeatCount="indefinite" />
                                <rect x={s.pos_x - badgeW / 2} y={s.pos_y - nameGap - 38} width={badgeW} height={20} rx={4}
                                    fill={ring} stroke="#000" strokeWidth="2" />
                                <text x={s.pos_x} y={s.pos_y - nameGap - 23} textAnchor="middle"
                                    fontSize="12" fontWeight="800" fill="#000">
                                    {badgeLabel}
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

NetworkMap.propTypes = {
    stations: PropTypes.array.isRequired,
    showLines: PropTypes.bool,
    tracts: PropTypes.array,
    lines: PropTypes.array,
    departureId: PropTypes.number,
    arrivalId: PropTypes.number,
};

export default NetworkMap;
