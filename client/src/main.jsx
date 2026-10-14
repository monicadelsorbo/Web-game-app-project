import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import App from "./App.jsx";


//Il codice React entra nella pagina attraverso un container node del DOM. 
//Costruisce un componente radice e lo aggancia al container DOM.
//L'elemento radice è l'elemento che contiene tutti gli altri elementi.

const router = createBrowserRouter([{ path: "/*", element: <App /> }]); //Avvolgere il componente <App/> in un browserRouter  per ambienti multipagina
// Il pattern /* significa "qualunque percorso" → quindi per ogni URL React mostra <App>. Lo smistamento fine (/, /login, /play…) lo fa poi App con le sue <Routes> interne.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
