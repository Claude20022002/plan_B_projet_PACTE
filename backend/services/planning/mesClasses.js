import { Op } from "sequelize";
import { Affectation, Appartenir, Cours, CoursComposante, Creneau, Enseignement, EnseignementEnseignant, Groupe, Salle } from "../../models/index.js";
import { STATUTS_ACTIFS, aujourdhui, minutes } from "./affectationRules.js";
import { descendants } from "./groupes.js";
import { peutGererFiliere } from "./droits.js";
import { horairesSurPlage } from "./ramadan.js";

/**
 * Classes d'un enseignant : les couples (module, groupe) qu'il enseigne réellement, d'après
 *  - ses services (enseignements qui lui sont confiés, sauf refusés) ;
 *  - son emploi du temps (séances dont il est l'enseignant, remplacements compris).
 * Sert à choisir la bonne classe (devoirs, quiz) et à refuser une classe qui n'est pas la sienne.
 * Un enseignant d'un groupe (par exemple la promotion en cours magistral) a aussi pour classe
 * chacun de ses sous-groupes (TD, TP).
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const heureCourante = () => new Date().toLocaleTimeString("en-GB", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" });
// Séances prises en compte : celles du semestre passé récent et à venir
const JOURS_AVANT = 120;
const JOURS_APRES = 180;

const decaler = (date, jours) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
};

/**
 * @returns {Promise<{ id_cours, code_cours, nom_cours, id_filiere, id_groupe, nom_groupe, type_groupe,
 *   effectif, sources: string[], en_cours: boolean, prochaine_seance: object|null }[]>}
 *   séance en cours d'abord, puis par prochaine séance, puis par module et groupe
 */
export const mesClasses = async (user, { jour = aujourdhui(), heure = heureCourante() } = {}) => {
    if (user?.role !== "enseignant") return [];

    // 1. Services : enseignement → module (composante) et groupes
    const services = await EnseignementEnseignant.findAll({
        where: { id_user: user.id_user, statut_service: { [Op.ne]: "refuse" } },
        attributes: ["id_enseignement"],
        include: [
            {
                model: Enseignement,
                as: "enseignement",
                attributes: ["id_enseignement"],
                include: [
                    { model: CoursComposante, as: "composante", attributes: ["id_cours"] },
                    { model: Groupe, as: "groupes", attributes: ["id_groupe"], through: { attributes: [] } },
                ],
            },
        ],
    });
    // 2. Emploi du temps : séances de l'enseignant
    const seances = await Affectation.findAll({
        where: { id_user_enseignant: user.id_user, statut: STATUTS_ACTIFS, date_seance: { [Op.between]: [decaler(jour, -JOURS_AVANT), decaler(jour, JOURS_APRES)] } },
        attributes: ["id_affectation", "id_cours", "id_groupe", "date_seance", "statut", "id_creneau", "id_salle"],
        include: [
            { model: Creneau, as: "creneau" },
            { model: Salle, as: "salle", attributes: ["nom_salle"] },
        ],
        order: [["date_seance", "ASC"]],
    });

    // Couples (module, groupe) et leur provenance
    const couples = new Map();
    const ajouter = (idCours, idGroupe, source) => {
        if (!idCours || !idGroupe) return;
        const cle = `${idCours}:${idGroupe}`;
        const couple = couples.get(cle) ?? { id_cours: idCours, id_groupe: idGroupe, sources: new Set() };
        couple.sources.add(source);
        couples.set(cle, couple);
    };
    for (const s of services) for (const g of s.enseignement?.groupes ?? []) ajouter(s.enseignement.composante?.id_cours, g.id_groupe, "service");
    for (const s of seances) ajouter(s.id_cours, s.id_groupe, "emploi_du_temps");
    if (!couples.size) return [];

    // Prochaine séance (ou séance en cours) par couple, aux horaires du jour (Ramadan compris)
    const horaires = await horairesSurPlage(jour, decaler(jour, JOURS_APRES));
    const prochaine = new Map();
    for (const s of seances) {
        const date = String(s.date_seance).slice(0, 10);
        if (date < jour) continue;
        const creneau = horaires(s.creneau, date);
        const fin = String(creneau?.heure_fin ?? "23:59").slice(0, 5);
        if (date === jour && fin <= heure) continue;
        const cle = `${s.id_cours}:${s.id_groupe}`;
        if (prochaine.has(cle)) continue;
        const debut = String(creneau?.heure_debut ?? "00:00").slice(0, 5);
        prochaine.set(cle, {
            id_affectation: s.id_affectation,
            date,
            heure_debut: debut,
            heure_fin: fin,
            salle: s.salle?.nom_salle ?? null,
            en_cours: date === jour && minutes(debut) <= minutes(heure),
        });
    }

    const [cours, groupes] = await Promise.all([
        Cours.findAll({ where: { id_cours: [...new Set([...couples.values()].map((c) => c.id_cours))] }, attributes: ["id_cours", "code_cours", "nom_cours", "id_filiere"], raw: true }),
        Groupe.findAll({ where: { id_groupe: [...new Set([...couples.values()].map((c) => c.id_groupe))] }, attributes: ["id_groupe", "nom_groupe", "type_groupe", "id_filiere"], raw: true }),
    ]);
    const coursParId = new Map(cours.map((c) => [c.id_cours, c]));
    const groupeParId = new Map(groupes.map((g) => [g.id_groupe, g]));

    // Effectif : étudiants du groupe et de ses sous-groupes (inscrits dans leur groupe le plus fin)
    const familles = await Groupe.findAll({ where: { id_filiere: [...new Set(groupes.map((g) => g.id_filiere))] }, attributes: ["id_groupe", "id_groupe_parent", "id_filiere"], raw: true });
    const inscrits = await Appartenir.count({ where: { id_groupe: familles.map((g) => g.id_groupe) }, group: ["id_groupe"] });
    const parGroupe = new Map(inscrits.map((l) => [l.id_groupe, Number(l.count)]));
    const effectif = (groupe) => [groupe, ...descendants(groupe, familles)].reduce((t, g) => t + (parGroupe.get(g.id_groupe) ?? 0), 0);

    return [...couples.values()]
        .filter((c) => coursParId.has(c.id_cours) && groupeParId.has(c.id_groupe))
        .map((c) => {
            const cle = `${c.id_cours}:${c.id_groupe}`;
            const coursDe = coursParId.get(c.id_cours);
            const groupe = groupeParId.get(c.id_groupe);
            const seance = prochaine.get(cle) ?? null;
            return {
                id_cours: c.id_cours,
                code_cours: coursDe.code_cours,
                nom_cours: coursDe.nom_cours,
                id_filiere: coursDe.id_filiere,
                id_groupe: c.id_groupe,
                nom_groupe: groupe.nom_groupe,
                type_groupe: groupe.type_groupe,
                effectif: effectif(familles.find((g) => g.id_groupe === c.id_groupe) ?? groupe),
                sources: [...c.sources].sort(),
                en_cours: Boolean(seance?.en_cours),
                prochaine_seance: seance,
            };
        })
        .sort(
            (a, b) =>
                Number(b.en_cours) - Number(a.en_cours) ||
                (a.prochaine_seance ? 0 : 1) - (b.prochaine_seance ? 0 : 1) ||
                `${a.prochaine_seance?.date ?? ""} ${a.prochaine_seance?.heure_debut ?? ""}`.localeCompare(`${b.prochaine_seance?.date ?? ""} ${b.prochaine_seance?.heure_debut ?? ""}`) ||
                a.nom_cours.localeCompare(b.nom_cours) ||
                a.nom_groupe.localeCompare(b.nom_groupe)
        );
};

/**
 * L'enseignant peut-il s'adresser à ce groupe dans ce module ? Oui s'il s'agit de l'une de ses
 * classes ou d'un sous-groupe de l'une d'elles, ou s'il est responsable de la filière du module.
 * idGroupe nul (tout le module) : seulement si ses classes couvrent tous les groupes du module.
 * @param {{ classes?: object[], groupesDuModule?: number[] }} options valeurs déjà connues de l'appelant
 */
export const peutViserClasse = async (user, cours, idGroupe, { classes, groupesDuModule } = {}) => {
    if (user?.role !== "enseignant") return false;
    if (await peutGererFiliere(user, cours.id_filiere)) return true;
    const siennes = (classes ?? (await mesClasses(user))).filter((c) => c.id_cours === cours.id_cours).map((c) => c.id_groupe);
    if (!siennes.length) return false;
    const familles = await Groupe.findAll({ where: { id_filiere: cours.id_filiere }, attributes: ["id_groupe", "id_groupe_parent", "id_filiere"], raw: true });
    const parId = new Map(familles.map((g) => [g.id_groupe, g]));
    // Ses classes et leurs sous-groupes
    const couverts = new Set(siennes.flatMap((id) => (parId.has(id) ? [id, ...descendants(parId.get(id), familles).map((g) => g.id_groupe)] : [id])));
    if (idGroupe !== null && idGroupe !== undefined) return couverts.has(Number(idGroupe));
    return (groupesDuModule ?? []).length > 0 && groupesDuModule.every((id) => couverts.has(id));
};
