/* Pagina mostrata per qualunque URL non riconosciuto */
import { Link } from "react-router";
import "./NotFound.css";

function NotFound() {
    return (
        <div className="notfound">
            <div className="notfound-code">404</div>
            <h2 className="notfound-title">Vicolo cieco</h2>
            <p className="notfound-sub">Questa pagina non esiste: il colpo è andato a vuoto.</p>
            <Link to="/" className="notfound-btn">Torna alla home</Link>
        </div>
    );
}

export default NotFound;
