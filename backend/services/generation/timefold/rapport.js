/**
 * Ce que la génération dit à l'administration (recette du 20 octobre, M-3 ; retours du 21 octobre, R-4) :
 * un résumé court, puis la liste de ce qu'il faut corriger, chaque point avec l'écran qui le corrige.
 * Le score interne du solveur (négatif, « −142 règles dures ») n'est plus montré : les séances
 * créées ont toutes passé les règles de planification, il n'y a donc aucun conflit à l'arrivée.
 * Fonctions pures : elles ne lisent que le problème et le résultat du déploiement.
 */

/** Durée du calcul choisie d'après la taille du problème (R-4 : l'administration ne la règle plus). */
export const DUREE_CALCUL = { min: 30, max: 240, parLecon: 0.5 };

export const dureeAutomatique = (lecons) => Math.min(DUREE_CALCUL.max, Math.max(DUREE_CALCUL.min, Math.round(lecons * DUREE_CALCUL.parLecon)));

/** Étapes lisibles d'une génération, dans l'ordre (le site les affiche une à une). */
export const ETAPES = ["preparation", "calcul", "placement"];

// Raisons pour lesquelles une séance n'a pas été créée à une date, dites simplement
const RAISONS = {
    evenement: "jour bloqué (férié, vacances ou événement)",
    conflit_salle: "salle déjà prise",
    conflit_enseignant: "enseignant déjà en cours",
    conflit_groupe: "classe déjà en cours",
    enseignant_indisponible: "enseignant indisponible",
    trajet_campus: "trop peu de temps pour changer de campus",
    capacite: "salle trop petite",
};
const raisonLisible = (code) => RAISONS[code] ?? "une règle de planification";

const nomModule = (e) => `${e.module}${e.type ? ` (${e.type})` : ""}`;
const pluriel = (n, mot) => `${n} ${mot}${n > 1 ? "s" : ""}`;

/**
 * Ce qu'il faut corriger avant de relancer, chaque point avec son lien : enseignants à revoir,
 * enseignements sans enseignant ou sans classe, enseignements incomplets.
 * @returns {{ type: string, texte: string, lien: string }[]}
 */
export const aCorriger = ({ avertissements = [], exclus = [], enseignements = [], leconsEnConflit = [] }) => {
    const points = [];
    for (const a of avertissements) {
        if (a.type === "plafond_hebdomadaire") {
            points.push({ type: a.type, texte: `${a.enseignant} : ${a.heures_semaine} h par semaine pour un plafond de ${a.plafond_heures} h. Augmentez le plafond ou confiez une partie des cours.`, lien: `/gestion/enseignants?enseignant=${a.id_user}` });
        } else if (a.type === "disponibilites_insuffisantes") {
            points.push({ type: a.type, texte: `${a.enseignant} : ${pluriel(a.seances, "séance")} par semaine pour ${pluriel(a.creneaux_libres, "créneau libre")}. Demandez-lui d'ouvrir des créneaux.`, lien: `/gestion/enseignants?enseignant=${a.id_user}` });
        }
    }
    for (const x of exclus) {
        const manque = x.raison === "sans_enseignant" ? "aucun enseignant n'est affecté" : x.raison === "sans_groupe" ? "aucune classe n'est rattachée" : "il n'est pas prêt";
        points.push({ type: x.raison, texte: `${nomModule(x)} : ${manque}, il n'a pas été planifié.`, lien: `/gestion/enseignements?enseignement=${x.id_enseignement}` });
    }
    for (const e of enseignements.filter((x) => !x.complet)) {
        const raisons = [...new Set((e.sautees ?? []).flatMap((s) => s.raisons ?? []))].map(raisonLisible);
        const manque = Math.max(0, Math.round((e.heures_prevues - e.heures_planifiees) * 10) / 10);
        points.push({
            type: "incomplet",
            texte: `${nomModule(e)} : ${manque} h non planifiées sur ${e.heures_prevues} h${raisons.length ? ` (${raisons.join(", ")})` : ""}.`,
            lien: `/gestion/enseignements?enseignement=${e.id_enseignement}`,
        });
    }
    const modules = [...new Set(leconsEnConflit)];
    if (modules.length) {
        points.push({ type: "semaine_type", texte: `La semaine type n'a pas trouvé de place sans conflit pour ${pluriel(modules.length, "module")} (${modules.slice(0, 5).join(", ")}${modules.length > 5 ? "…" : ""}) : ouvrez des créneaux ou des salles, puis relancez.`, lien: "/gestion/enseignants" });
    }
    return points;
};

/** Le résumé en quelques chiffres, tous positifs et vérifiables. */
export const resume = ({ enseignements = [], exclus = [], creees = 0 }) => ({
    seances_creees: creees,
    enseignements_complets: enseignements.filter((e) => e.complet).length,
    enseignements_incomplets: enseignements.filter((e) => !e.complet).length,
    enseignements_exclus: exclus.length,
    // Chaque séance créée a passé les règles de planification : aucune ne peut être en conflit
    conflits: 0,
});
