/*
 * Sfondo decorativo: linee della metro tenui con un segmento luminoso che "viaggia"
 * lungo ogni linea (effetto treni in movimento). Sta dietro a tutto il contenuto.
 */
import "./MetroBackground.css";

const LINES = [
    "0,120 200,120 350,260 600,260 800,120 1000,180",
    "0,420 250,420 400,300 650,500 1000,460",
    "120,0 300,200 300,420 500,600",
    "1000,80 760,300 760,520 500,520",
];

function MetroBackground() {
    return (
        <svg className="metro-bg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g className="metro-base">
                {LINES.map((pts, i) => <polyline key={i} points={pts} />)}
            </g>
            {LINES.map((pts, i) => (
                <polyline key={i} className={`metro-spark s${i + 1}`} points={pts} />
            ))}
        </svg>
    );
}

export default MetroBackground;
