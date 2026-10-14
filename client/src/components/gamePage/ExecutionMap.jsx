import PropTypes from "prop-types";
import { iconFor } from "../../icons.js";
import "./ExecutionMap.css";

function ExecutionMap(props) {
    const { stations, tracts, steps, step } = props;

    const byId = {};
    stations.forEach((s) => { byId[s.id] = s; });

    const seg = (st) => {
        const a = byId[st.from.id], b = byId[st.to.id];
        return {
            x1: a.pos_x, y1: a.pos_y, x2: b.pos_x, y2: b.pos_y,
            len: Math.hypot(b.pos_x - a.pos_x, b.pos_y - a.pos_y)
        };
    };

    const current = steps[step];
    const departureId = steps.length ? steps[0].from.id : null;
    const arrivalId = steps.length ? steps[steps.length - 1].to.id : null;

    return (
        <div className="exec-map">
            <svg viewBox="0 0 1000 605"
                style={{ width: "100%", height: "auto", display: "block", background: "transparent" }}>
                {tracts.map((t) => {
                    const a = byId[t.a.id], b = byId[t.b.id];
                    if (!a || !b) return null;
                    return <line key={t.id} x1={a.pos_x} y1={a.pos_y} x2={b.pos_x} y2={b.pos_y}
                        stroke="#3d494d" strokeWidth="5" strokeLinecap="round" />;
                })}
                {steps.slice(0, step).map((st, i) => {
                    const s = seg(st);
                    return <line key={`done-${i}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                        stroke="#56ddff" strokeWidth="8" strokeLinecap="round" />;
                })}
                {current && (() => {
                    const s = seg(current);
                    return (
                        <line key={`cur-${step}`} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
                            stroke="#56ddff" strokeWidth="8" strokeLinecap="round"
                            style={{
                                strokeDasharray: s.len, strokeDashoffset: s.len,
                                animation: "exec-draw 900ms linear forwards"
                            }} />
                    );
                })()}
                {stations.map((s) => {
                    const isDep = s.id === departureId;
                    const isArr = s.id === arrivalId;
                    const isSpecial = isDep || isArr;
                    const r = 29;
                    const clipR = r - 2;
                    const ring = isDep ? "#FFD23F" : isArr ? "#22E0A0" : "#000";
                    const strokeW = isSpecial ? 6 : 3;
                    const badgeLabel = isDep ? "START" : isArr ? "END" : null;
                    const badgeW = isDep ? 58 : 46;
                    return (
                        <g key={s.id}>
                            {isSpecial && (
                                <circle cx={s.pos_x} cy={s.pos_y} r={r + 6} fill="none"
                                    stroke={ring} strokeWidth="3" opacity="0.45" />
                            )}

                            <circle cx={s.pos_x} cy={s.pos_y} r={r} fill="#fff" stroke={ring} strokeWidth={strokeW} />

                            <clipPath id={`exec-clip-${s.id}`}>
                                <circle cx={s.pos_x} cy={s.pos_y} r={clipR} />
                            </clipPath>
                            <image href={iconFor(s)} x={s.pos_x - clipR} y={s.pos_y - clipR}
                                width={clipR * 2} height={clipR * 2}
                                clipPath={`url(#exec-clip-${s.id})`} preserveAspectRatio="xMidYMid slice" />

                            <circle cx={s.pos_x} cy={s.pos_y} r={r} fill="none" stroke={ring} strokeWidth={strokeW} />

                            {badgeLabel && (
                                <g>
                                    <animateTransform attributeName="transform" type="translate"
                                        values="0 0; 0 -7; 0 0" dur="0.8s" repeatCount="indefinite" />
                                    <rect x={s.pos_x - badgeW / 2} y={s.pos_y - r - 38} width={badgeW} height={20} rx={4}
                                        fill={ring} stroke="#000" strokeWidth="2" />
                                    <text x={s.pos_x} y={s.pos_y - r - 23} textAnchor="middle"
                                        fontSize="12" fontWeight="800" fill="#000">
                                        {badgeLabel}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

ExecutionMap.propTypes = {
    stations: PropTypes.array.isRequired,
    tracts: PropTypes.array.isRequired,
    steps: PropTypes.array.isRequired,
    step: PropTypes.number.isRequired,
};

export default ExecutionMap;