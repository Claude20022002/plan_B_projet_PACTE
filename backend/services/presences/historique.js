import { Op } from "sequelize";
import { Affectation, AppelSeance, Appartenir, Creneau, Presence, Salle, Users } from "../../models/index.js";
import { classeAutorisee } from "../cours/droits.js";
import { avecDescendants } from "../planning/groupes.js";
import { aujourdhui } from "../planning/affectationRules.js";
import { journaliser } from "../journalSecurite.js";

/**
 * Historique de l'appel d'une classe (docs/plans/espace-de-cours.md, lot E-6), pour l'enseignant de
 * la classe et l'administration : les séances et leur bilan, le taux de présence de chaque étudiant,
 * l'export en CSV. Seules les séances dont l'appel est fermé comptent dans les taux : un appel non
 * fait ne rend personne absent.
 */

const heure = (h) => String(h ?? "").slice(0, 5);

/** Séances passées ou du jour de la classe, les plus récentes d'abord, avec leur appel et leurs présences. */
const seancesDeLaClasse = async (cours, groupe) => {
    const seances = await Affectation.findAll({
        where: { id_cours: cours.id_cours, id_groupe: groupe.id_groupe, statut: { [Op.ne]: "annule" }, date_seance: { [Op.lte]: aujourdhui() } },
        attributes: ["id_affectation", "date_seance", "statut"],
        include: [
            { model: Creneau, as: "creneau", attributes: ["heure_debut", "heure_fin"] },
            { model: Salle, as: "salle", attributes: ["nom_salle"] },
        ],
        order: [["date_seance", "DESC"], [{ model: Creneau, as: "creneau" }, "heure_debut", "DESC"]],
    });
    const ids = seances.map((s) => s.id_affectation);
    const [appels, presences] = ids.length
        ? await Promise.all([AppelSeance.findAll({ where: { id_affectation: ids }, attributes: ["id_affectation", "ferme_le"], raw: true }), Presence.findAll({ where: { id_affectation: ids }, attributes: ["id_affectation", "id_user", "statut"], raw: true })])
        : [[], []];
    return { seances, appels: new Map(appels.map((a) => [a.id_affectation, a])), presences };
};

/** Étudiants de la classe : le groupe et ses sous-groupes, comptes actifs. */
const etudiantsDeLaClasse = async (groupe) => {
    const groupes = await avecDescendants([groupe.id_groupe]);
    const ids = [...new Set((await Appartenir.findAll({ where: { id_groupe: groupes }, attributes: ["id_user_etudiant"], raw: true })).map((a) => a.id_user_etudiant))];
    return ids.length ? Users.findAll({ where: { id_user: ids, actif: true, role: "etudiant" }, attributes: ["id_user", "nom", "prenom"], order: [["nom", "ASC"], ["prenom", "ASC"]] }) : [];
};

export const appelsDeLaClasse = async (user, idCours, idGroupe) => {
    const { cours, groupe } = await classeAutorisee(user, idCours, idGroupe, { gerer: true });
    const [{ seances, appels, presences }, etudiants] = await Promise.all([seancesDeLaClasse(cours, groupe), etudiantsDeLaClasse(groupe)]);
    return seances.map((s) => {
        const appel = appels.get(s.id_affectation);
        const lignes = presences.filter((p) => p.id_affectation === s.id_affectation);
        const presents = lignes.filter((p) => p.statut !== "retard").length;
        const retards = lignes.length - presents;
        return {
            id_affectation: s.id_affectation,
            date: String(s.date_seance).slice(0, 10),
            heure_debut: heure(s.creneau?.heure_debut),
            heure_fin: heure(s.creneau?.heure_fin),
            salle: s.salle?.nom_salle ?? null,
            appel: !appel ? "a_faire" : appel.ferme_le ? "ferme" : "ouvert",
            presents,
            retards,
            absents: appel ? Math.max(0, etudiants.length - lignes.length) : null,
            attendus: etudiants.length,
        };
    });
};

/** Bilan par étudiant sur les appels fermés ; les plus absents d'abord. */
const bilan = async (user, idCours, idGroupe) => {
    const { cours, groupe } = await classeAutorisee(user, idCours, idGroupe, { gerer: true });
    const [{ seances, appels, presences }, etudiants] = await Promise.all([seancesDeLaClasse(cours, groupe), etudiantsDeLaClasse(groupe)]);
    const comptees = seances.filter((s) => appels.get(s.id_affectation)?.ferme_le).reverse();
    const idsComptes = new Set(comptees.map((s) => s.id_affectation));
    const statutDe = new Map(presences.filter((p) => idsComptes.has(p.id_affectation)).map((p) => [`${p.id_affectation}:${p.id_user}`, p.statut]));
    const lignes = etudiants.map((e) => {
        const statuts = comptees.map((s) => statutDe.get(`${s.id_affectation}:${e.id_user}`) ?? "absent");
        const presents = statuts.filter((x) => x === "present").length;
        const retards = statuts.filter((x) => x === "retard").length;
        const total = statuts.length;
        return { id_user: e.id_user, nom: e.nom, prenom: e.prenom, presents, retards, absences: total - presents - retards, seances: total, taux: total ? Math.round(((presents + retards) / total) * 100) : null, statuts };
    });
    lignes.sort((a, b) => (a.taux ?? 101) - (b.taux ?? 101) || a.nom.localeCompare(b.nom, "fr"));
    return { cours, groupe, comptees, lignes };
};

export const elevesDeLaClasse = async (user, idCours, idGroupe) => {
    const { comptees, lignes } = await bilan(user, idCours, idGroupe);
    return { seances_comptees: comptees.length, etudiants: lignes.map(({ statuts, ...l }) => l) };
};

const LETTRE = { present: "P", retard: "R", absent: "A" };
// Une cellule ne commence jamais par = + - @ (formule exécutée par le tableur)
const cellule = (v) => {
    const texte = String(v ?? "");
    const sur = /^[=+\-@\t\r]/.test(texte) ? `'${texte}` : texte;
    return /[";\n]/.test(sur) ? `"${sur.replace(/"/g, '""')}"` : sur;
};

/** Export CSV (séparateur « ; », lisible par Excel en français) : une ligne par étudiant, une colonne par séance. */
export const exporterPresences = async (user, idCours, idGroupe, contexte) => {
    const { cours, groupe, comptees, lignes } = await bilan(user, idCours, idGroupe);
    const entete = ["Nom", "Prénom", "Présences", "Retards", "Absences", "Taux (%)", ...comptees.map((s) => `${String(s.date_seance).slice(0, 10)} ${heure(s.creneau?.heure_debut)}`)];
    const corps = lignes.map((l) => [l.nom, l.prenom, l.presents, l.retards, l.absences, l.taux ?? "", ...l.statuts.map((x) => LETTRE[x])]);
    await journaliser(contexte, { evenement: "presences_exportees", user, details: { id_cours: cours.id_cours, id_groupe: groupe.id_groupe, etudiants: lignes.length } });
    return {
        nom: `presences-${cours.code_cours}-${groupe.nom_groupe}.csv`.replace(/[^\w.-]+/g, "_"),
        contenu: `\uFEFF${[entete, ...corps].map((ligne) => ligne.map(cellule).join(";")).join("\r\n")}\r\n`,
    };
};
