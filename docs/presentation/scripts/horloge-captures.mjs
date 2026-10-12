// Horloge décalée pour le serveur de captures : « maintenant » vaut HORLOGE au démarrage, puis avance normalement.
// Usage : HORLOGE=2026-10-12T13:40:00Z node --import ../docs/presentation/scripts/horloge-captures.mjs server.js (depuis backend/)
const Reelle = Date;
const decalage = new Reelle(process.env.HORLOGE).getTime() - Reelle.now();
globalThis.Date = class extends Reelle {
    constructor(...args) {
        if (args.length === 0) super(Reelle.now() + decalage);
        else super(...args);
    }
    static now() {
        return Reelle.now() + decalage;
    }
};
