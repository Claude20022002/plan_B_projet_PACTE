/**
 * Client du service de génération Timefold (`solver/`), joignable seulement par Planner.
 * SOLVER_URL : http://solver:8080 dans docker-compose, http://localhost:8080 en local.
 */

const base = () => (process.env.SOLVER_URL || "http://localhost:8080").replace(/\/$/, "");

export class SolveurIndisponible extends Error {
    constructor(message) {
        super(message);
        this.status = 503;
    }
}

const appeler = async (chemin, options = {}) => {
    let reponse;
    try {
        reponse = await fetch(`${base()}${chemin}`, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    } catch (error) {
        throw new SolveurIndisponible(`Service de génération injoignable (${base()}) : ${error.cause?.code || error.message}`);
    }
    const corps = await reponse.json().catch(() => ({}));
    if (!reponse.ok) throw new SolveurIndisponible(corps.erreur || `Service de génération : erreur ${reponse.status}`);
    return corps;
};

/** Lance un calcul ; renvoie { id, dureeSecondes }. */
export const lancerCalcul = (probleme) => appeler("/timetables", { method: "POST", body: JSON.stringify(probleme) });

/** État du calcul : statut (SOLVING_ACTIVE, NOT_SOLVING, ECHEC…), score, leçons placées, violations. */
export const etatCalcul = (id) => appeler(`/timetables/${id}`);

export const arreterCalcul = (id) => appeler(`/timetables/${id}`, { method: "DELETE" });

const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Attend la fin du calcul en interrogeant le service ; `surProgression` reçoit l'état courant.
 * Le service s'arrête de lui-même (durée maximale, ou plus de progrès) ; au-delà d'une marge,
 * on lui demande d'arrêter et on garde la meilleure solution connue.
 */
export const attendreSolution = async (id, { dureeSecondes = 60, intervalleMs = 2000, surProgression } = {}) => {
    const limite = Date.now() + (dureeSecondes + 30) * 1000;
    for (;;) {
        const etat = await etatCalcul(id);
        if (surProgression) await surProgression(etat);
        if (etat.statut === "ECHEC") throw new Error(etat.erreur || "Le calcul a échoué");
        if (etat.statut === "NOT_SOLVING" && etat.score) return etat;
        if (Date.now() > limite) {
            await arreterCalcul(id).catch(() => {});
            await attendre(intervalleMs);
            return etatCalcul(id);
        }
        await attendre(intervalleMs);
    }
};
