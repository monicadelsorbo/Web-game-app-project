/*
 * Form di login (route "/login").
 * Valida i dati PRIMA di chiamare il server (campi non vuoti + email valida).
 */

//Riceve una prop da App: loggedIn
import PropTypes from "prop-types";
import { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useNavigate, Link } from "react-router";
import "./Auth.css";

function LoginForm(props) {
    // Uno stato per ogni campo del form (componenti controllati).
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false); // mostra la password mentre l'occhio è premuto

    // Messaggio di errore mostrato sotto al titolo.
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    // Validazione lato client prima di chiamare il server: ritorna un messaggio d'errore, o "" se tutto ok.
    const validate = () => {
        if (username.trim() === "" || password === "") //Controllo campi non vuoti
            return "Inserisci email e password.";
        // Controllo essenziale del formato email: qualcosa@qualcosa.qualcosa
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(username))
            return "L'email non è in un formato valido.";
        return "";
    };

    const handleSubmit = (event) => {
        event.preventDefault();          //  impedisce il comportamento di default del browser, che all'invio di un form ricaricherebbe la pagina
        const error = validate();
        if (error) {
            setErrorMessage(error);
            return;                      // form non inviato finché i dati non sono validi
        }
        setErrorMessage("");
        // props.login ritorna una Promise: se il server rifiuta (401), entriamo nel catch.
        props.login({ username, password })
            .then(() => navigate("/"))   // login ok: torniamo alla home
            .catch(() => setErrorMessage("Email o password errati."));
    };

    return (
        <div className="login">
            <div className="login-card">
                <div className="login-ribbon">ULTIMA CORSA</div>
                <p className="login-subtitle">Inserisci le credenziali.</p>

                {errorMessage && (
                    <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible> {/* dismissible è una prop booleana dell'Alert che aggiunge una "X" di chiusura nell'angolo, così l'utente può far sparire il messaggio cliccandoci sopra.*/}
                        {errorMessage}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label className="login-label" htmlFor="email">Email</label>
                        <div className="login-input-wrap">
                            <i className="bi bi-envelope-fill login-input-icon" />
                            <Form.Control
                                id="email" //identificativo del campo
                                type="email" //Tipo di campo
                                autoComplete="username" //suggerimento al browser: campo identificativo di login
                                className="login-input"
                                placeholder="racer@example.com" //testo mostrato quando il campo è vuoto
                                value={username} //il campo mostra sempre ciò che c'è nello stato username (componente controllato)
                                onChange={(event) => setUsername(event.target.value)}  // a ogni tasto premuto, leggi quello che l'utente ha scritto (event.target.value) e aggiorni lo stato username
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="password">Password</label>
                        <div className="login-input-wrap">
                            <i className="bi bi-key-fill login-input-icon" />
                            <Form.Control
                                id="password"
                                type={showPwd ? "text" : "password"}
                                autoComplete="current-password" //suggerimento al browser: password esistente
                                className="login-input login-input-pwd"
                                placeholder="••••••••"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                            {/* occhio: tieni premuto per vedere la password */}
                            <button type="button" className="login-eye"
                                onMouseDown={() => setShowPwd(true)}
                                onMouseUp={() => setShowPwd(false)}
                                onMouseLeave={() => setShowPwd(false)}
                                onTouchStart={() => setShowPwd(true)}
                                onTouchEnd={() => setShowPwd(false)}
                                aria-label="Mostra la password (tieni premuto)">
                                <i className={`bi ${showPwd ? "bi-eye-slash-fill" : "bi-eye-fill"}`} />
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="login-btn">ACCEDI</Button> {/*type="submit" fa sì che il click sul bottone attivi l'handleSubmit del form.*/}
                </Form>

                <p className="login-switch">
                    Non hai un account? <Link to="/register">Registrati</Link>
                </p>
            </div>
        </div>
    );
}

LoginForm.propTypes = {
    login: PropTypes.func.isRequired, //è obbligatoria
};


/*
 * Form di registrazione (route "/register").
 * Chiede email, password e conferma password; valida lato client prima di registrare.
 */
function RegisterForm(props) {
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");  // nome mostrato nel profilo (deve essere unico)
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");   // password ripetuta per sicurezza
    const [showPwd, setShowPwd] = useState(false);        // occhio per il campo password
    const [showConfirm, setShowConfirm] = useState(false); // occhio per il campo conferma
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const validate = () => {
        if (email.trim() === "" || username.trim() === "" || password === "" || confirm === "")
            return "Compila tutti i campi.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email))
            return "L'email non è in un formato valido.";
        if (password.length < 6)
            return "La password deve avere almeno 6 caratteri.";
        if (password !== confirm)
            return "Le due password non coincidono.";
        return "";
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const error = validate();
        if (error) {
            setErrorMessage(error);
            return;
        }
        setErrorMessage("");
        // Il server registra e fa il login automatico; props.register ritorna una Promise.
        props.register({ email, username, password })
            .then(() => navigate("/"))
            .catch((err) => setErrorMessage(err.message || "Registrazione non riuscita."));
    };

    return (
        <div className="login">
            <div className="login-card">
                <div className="login-ribbon">ULTIMA CORSA</div>
                <p className="login-subtitle">Crea il tuo account.</p>

                {errorMessage && (
                    <Alert variant="danger" onClose={() => setErrorMessage("")} dismissible>
                        {errorMessage}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit} className="login-form">
                    <div className="login-field">
                        <label className="login-label" htmlFor="reg-email">Email</label>
                        <div className="login-input-wrap">
                            <i className="bi bi-envelope-fill login-input-icon" />
                            <Form.Control
                                id="reg-email"
                                type="email"
                                autoComplete="username"
                                className="login-input"
                                placeholder="racer@example.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="reg-username">Username</label>
                        <div className="login-input-wrap">
                            <i className="bi bi-person-fill login-input-icon" />
                            <Form.Control
                                id="reg-username"
                                type="text"
                                autoComplete="nickname"
                                className="login-input"
                                placeholder="Il tuo nome da ladro"
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="reg-password">Password</label>
                        <div className="login-input-wrap">
                            <i className="bi bi-key-fill login-input-icon" />
                            <Form.Control
                                id="reg-password"
                                type={showPwd ? "text" : "password"}
                                autoComplete="new-password"
                                className="login-input login-input-pwd"
                                placeholder="Almeno 6 caratteri"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                            />
                            <button type="button" className="login-eye"
                                onMouseDown={() => setShowPwd(true)}
                                onMouseUp={() => setShowPwd(false)}
                                onMouseLeave={() => setShowPwd(false)}
                                onTouchStart={() => setShowPwd(true)}
                                onTouchEnd={() => setShowPwd(false)}
                                aria-label="Mostra la password (tieni premuto)">
                                <i className={`bi ${showPwd ? "bi-eye-slash-fill" : "bi-eye-fill"}`} />
                            </button>
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="reg-confirm">Ripeti password</label>
                        <div className="login-input-wrap">
                            <i className="bi bi-key-fill login-input-icon" />
                            <Form.Control
                                id="reg-confirm"
                                type={showConfirm ? "text" : "password"}
                                autoComplete="new-password"
                                className="login-input login-input-pwd"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={(event) => setConfirm(event.target.value)}
                            />
                            <button type="button" className="login-eye"
                                onMouseDown={() => setShowConfirm(true)}
                                onMouseUp={() => setShowConfirm(false)}
                                onMouseLeave={() => setShowConfirm(false)}
                                onTouchStart={() => setShowConfirm(true)}
                                onTouchEnd={() => setShowConfirm(false)}
                                aria-label="Mostra la password (tieni premuto)">
                                <i className={`bi ${showConfirm ? "bi-eye-slash-fill" : "bi-eye-fill"}`} />
                            </button>
                        </div>
                    </div>

                    <Button type="submit" className="login-btn">REGISTRATI</Button>
                </Form>

                <p className="login-switch">
                    Hai già un account? <Link to="/login">Accedi</Link>
                </p>
            </div>
        </div>
    );
}

RegisterForm.propTypes = {
    register: PropTypes.func.isRequired,
};

export { LoginForm, RegisterForm };