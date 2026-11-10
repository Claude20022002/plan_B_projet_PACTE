/**
 * Tâches périodiques du serveur (server.js), lancées sur chaque école du banc (P-18, C-2, M8) :
 * ce que ferait un serveur de plusieurs écoles avec le code d'aujourd'hui. Chaque tâche passe par
 * `passage` (une seule à la fois dans le processus, verrou MySQL) dans le contexte de l'école.
 * Le rappel d'appel tourne chaque minute sur toutes les écoles ; un tour encore en cours à la
 * minute suivante fait sauter le tour (comme demarrerRappelsAppel) : ce sont des rappels manqués.
 */
const { dansEtablissement } = await import("/app/contexte/etablissement.js");
const { passage } = await import("/app/services/taches/periodiques.js");
const { marquerRealisees } = await import("/app/services/planning/suivi.js");
const { passerDesactivations } = await import("/app/services/desactivation/programmation.js");
const { purgerJournal } = await import("/app/services/journalSecurite.js");
const { purgerCompteursDebit } = await import("/app/middleware/rateLimiterMiddleware.js");
const { purgerGenerations } = await import("/app/services/ia/quiz.js");
const { purgerStudio } = await import("/app/services/studio/iaGeneration.js");
const { rappelerAppels } = await import("/app/services/presences/rappelAppel.js");

/** Tâches lancées au démarrage puis chaque heure ou chaque jour (server.js). */
const TACHES_LONGUES = [
    ["suivi-realise", marquerRealisees],
    ["desactivations", passerDesactivations],
    ["purge-journal", purgerJournal],
    ["purge-limiteurs", purgerCompteursDebit],
    ["purge-quiz-ia", purgerGenerations],
    ["purge-studio-quiz", purgerStudio],
];

/** Statistiques M8, lues par la route /banc/taches. */
export const statsTaches = { tours: [], tours_sautes: 0, erreurs: 0, tour_en_cours: null };

/** Un tour : les tâches données, école après école ; rend sa durée et ses erreurs. */
const tour = async (nom, ecoles, taches) => {
    const debut = Date.now();
    let erreurs = 0;
    for (const ecole of ecoles.values()) {
        await ecole.occuper(() =>
            dansEtablissement(ecole.contexte, async () => {
                for (const [nomTache, tache] of taches) {
                    const issue = await passage(nomTache, () => tache());
                    if (issue?.erreur) erreurs += 1;
                }
            })
        );
    }
    const bilan = { nom, debut: new Date(debut).toISOString(), duree_ms: Date.now() - debut, ecoles: ecoles.size, erreurs };
    statsTaches.tours.push(bilan);
    statsTaches.erreurs += erreurs;
    return bilan;
};

/**
 * Démarre les tâches : les longues tout de suite puis chaque heure, le rappel d'appel chaque
 * minute. Rend une fonction qui arrête les minuteries.
 */
export const demarrerTaches = (ecoles) => {
    const longues = () => tour("longues", ecoles, TACHES_LONGUES).catch(() => {});
    longues();
    const heure = setInterval(longues, 60 * 60 * 1000);
    const minute = setInterval(async () => {
        if (statsTaches.tour_en_cours) {
            statsTaches.tours_sautes += 1;
            return;
        }
        statsTaches.tour_en_cours = new Date().toISOString();
        try {
            await tour("rappel-appel", ecoles, [["rappel-appel", rappelerAppels]]);
        } catch {
            statsTaches.erreurs += 1;
        } finally {
            statsTaches.tour_en_cours = null;
        }
    }, 60 * 1000);
    return () => {
        clearInterval(heure);
        clearInterval(minute);
    };
};
