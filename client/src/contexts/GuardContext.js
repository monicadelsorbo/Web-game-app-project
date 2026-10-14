import React from "react";

const GuardContext = React.createContext({
    guardActive: false,
    setGuardActive: () => { },
});
export default GuardContext;