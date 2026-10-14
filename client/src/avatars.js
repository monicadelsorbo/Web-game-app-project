const AVATARS = {
    "Marie Dubois": "/Avatars/avatar3.png",
    "Arsène Lupin": "/Avatars/avatar1.png",
    "Eugène Vidocq": "/Avatars/avatar2.png",
};

// Tutti gli avatar disponibili (in public/Avatars), per il selettore nella pagina profilo.
export const AVATAR_OPTIONS = [
    "/Avatars/avatar1.png",
    "/Avatars/avatar2.png",
    "/Avatars/avatar3.png",
];

// Ritorna il percorso dell'avatar per l'utente dato.
// Priorità: avatar scelto dall'utente (salvato nel db) -> mappa per nome -> avatar di default.
export function avatarFor(user) {
    if (user && user.avatar)
        return user.avatar;
    if (user && AVATARS[user.name])
        return AVATARS[user.name];
    return "/Avatars/avatar1.png"; // avatar di default
}
