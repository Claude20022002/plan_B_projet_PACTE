/**
 * Client du service de génération Timefold (`solver/`), joignable seulement par Planner.
 * SOLVER_URL : http://solver:8080 dans docker-compose, http://localhost:8080 en local.
 * SOLVER_TOKEN : jeton partagé (32 caractères au moins), envoyé dans X-Solver-Token ; le
 * service refuse tout appel sans lui.
 */

const base = () => (process.env.SOLVER_URL || "http://localhost:8080").replace(/\/$/, "");
const DELAI_MS = 15_000;

export class SolveurIndisponible extends Error {
    constructor(message) {
        super(message);
        this.status = 503;
    }
}

const appeler = async (chemin, options = {}) => {
    let reponse;
    try {
        reponse = await fetch(`${base()}${chemin}`, {
            ...options,
            signal: AbortSignal.timeout(DELAI_MS),
            headers: { "Content-Type": "application/json", "X-Solver-Token": process.env.SOLVER_TOKEN || "", ...(options.headers || {}) },
        });
    } catch (error) {
        // Détail technique dans les journaux du serveur seulement (adresse interne du service)
        console.error(`[solveur] ${base()}${chemin} : ${error.cause?.code || error.name}`);
        throw new SolveurIndisponible("Service de génération injoignable : vérifiez qu'il est démarré");
    }
    const corps = await reponse.json().catch(() => ({}));
    if (!reponse.ok) {
        console.error(`[solveur] ${chemin} : HTTP ${reponse.status} ${corps.erreur ?? ""}`);
        const message =
            reponse.status === 401 || reponse.status === 503
                ? "Service de génération mal configuré (jeton SOLVER_TOKEN)"
                : reponse.status === 429
                  ? "Service de génération occupé : réessayez dans quelques minutes"
                  : `Service de génération : erreur ${reponse.status}`;
        throw new SolveurIndisponible(message);
    }
    return corps;
};

/** Lance un calcul ; renvoie { id, dureeSecondes }. */
export const lancerCalcul = (probleme) => appeler("/timetables", { method: "POST", body: JSON.stringify(probleme) });

/** État du calcul : statut (SOLVING_ACTIVE, NOT_SOLVING, ECHEC…), score, leçons placées, violations. */
export const etatCalcul = (id) => appeler(`/timetables/${encodeURIComponent(id)}`);

export const arreterCalcul = (id) => appeler(`/timetables/${encodeURIComponent(id)}`, { method: "DELETE" });

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
        if (etat.statut === "ECHEC") throw new Error("Le calcul a échoué");
        if (etat.statut === "NOT_SOLVING" && etat.score) return etat;
        if (Date.now() > limite) {
            await arreterCalcul(id).catch(() => {});
            await attendre(intervalleMs);
            return etatCalcul(id);
        }
        await attendre(intervalleMs);
    }
};
