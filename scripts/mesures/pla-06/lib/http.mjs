/**
 * Client HTTP du générateur de charge PLA-06 : node:http (fetch peut ignorer l'en-tête Host, C-12),
 * connexions gardées ouvertes, délai de 10 s. Chaque réponse rend son statut, sa durée et, au
 * besoin, son corps JSON ; un refus de connexion ou un délai dépassé est noté, jamais levé.
 */
import http from "node:http";

const agent = new http.Agent({ keepAlive: true, maxSockets: 512 });
export const DELAI_MS = 10_000;

/**
 * Requête vers le serveur de banc. `hote` est le nom d'hôte de l'école (en-tête Host) ; `ip` l'adresse
 * propre à l'utilisateur virtuel (X-Forwarded-For). Rend { statut, ms, corps, entetes, refus, delaiDepasse }.
 */
export const requete = (base, { methode = "GET", chemin, hote, ip, jeton, corps, lireCorps = false }) =>
    new Promise((resoudre) => {
        const url = new URL(chemin, base);
        const donnees = corps ? JSON.stringify(corps) : null;
        const entetes = { Host: hote ?? url.host, Accept: "application/json" };
        if (ip) entetes["X-Forwarded-For"] = ip;
        if (jeton) entetes.Authorization = `Bearer ${jeton}`;
        if (donnees) Object.assign(entetes, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(donnees), "X-Client": "mobile" });
        const debut = process.hrtime.bigint();
        const fin = (r) => resoudre({ ms: Number(process.hrtime.bigint() - debut) / 1e6, statut: null, corps: null, entetes: {}, refus: false, delaiDepasse: false, ...r });
        const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: methode, headers: entetes, agent }, (res) => {
            const morceaux = [];
            res.on("data", (m) => lireCorps && morceaux.push(m));
            res.on("end", () => {
                let lu = null;
                if (lireCorps && morceaux.length) {
                    try {
                        lu = JSON.parse(Buffer.concat(morceaux).toString("utf8"));
                    } catch {
                        lu = null;
                    }
                }
                fin({ statut: res.statusCode, corps: lu, entetes: res.headers });
            });
        });
        req.setTimeout(DELAI_MS, () => {
            req.destroy();
            fin({ delaiDepasse: true });
        });
        req.on("error", (erreur) => fin({ refus: !req.destroyed || erreur.code === "ECONNREFUSED" }));
        if (donnees) req.write(donnees);
        req.end();
    });

/** Adresse propre à l'utilisateur u de l'école k (limites de connexion par adresse, C-3). */
export const ipVirtuelle = (k, u) => `10.${k % 256}.${Math.floor(u / 250) % 256}.${(u % 250) + 1}`;

/** Attend ms millisecondes. */
export const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
