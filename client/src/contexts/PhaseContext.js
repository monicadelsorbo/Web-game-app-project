import React from "react";

// Context per l'etichetta della fase corrente (mostrata nell'header).
const PhaseContext = React.createContext({
    phaseLabel: "",
    setPhaseLabel: () => { },
});

export default PhaseContext;