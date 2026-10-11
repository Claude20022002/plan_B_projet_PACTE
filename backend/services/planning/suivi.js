import { Op } from "sequelize";
import {
    Affectation,
    Cours,
    CoursComposante,
    Creneau,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Filiere,
    Groupe,
    Periode,
    Salle,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { STATUTS_ACTIFS, aujourdhui, minutes } from "./affectationRules.js";
import { appliquerRamadan, horairesSurPlage } from "./ramadan.js";
import { filieresDuResponsable } from "./droits.js";
import { NOTE_APPEL, etatsDesSeances } from "./visaSeances.js";

/**
 * Suivi du réalisé (phase P7). Une séance devient « réalisée » d'office une fois passée, si elle
 * était planifiée ou confirmée (et non reportée) : l'enseignant n'a rien à marquer. Les heures
 * réalisées alimentent l'avancement des modules, la charge des enseignants et l'export mensuel
 * des vacataires (paie hors périmètre).
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const heureCourante = () => new Date().toLocaleTimeString("en-GB", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" });
const heures = (creneau) => (minutes(creneau.heure_fin) - minutes(creneau.heure_debut)) / 60;
const arrondi = (n) => Math.round(n * 10) / 10;
// Tolérance avant de signaler un module en retard sur son rythme
const TOLERANCE_RETARD_HEURES = 3;

const estPassee = (seance) => {
    const date = String(seance.date_seance).slice(0, 10);
    if (date < aujourdhui()) return true;
    return date === aujourdhui() && String(seance.creneau?.heure_fin ?? "23:59").slice(0, 5) <= heureCourante();
};

/**
 * Marque réalisées les séances planifiées ou confirmées déjà passées (tâche périodique) et retourne
 * leur nombre. Une séance planifiée est tenue pour confirmée : l'enseignant n'a rien à confirmer, il
 * demande un report s'il ne peut pas la tenir.
 */
export const marquerRealisees = async () => {
    const candidates = await Affectation.findAll({
        where: { statut: ["planifie", "confirme"], date_seance: { [Op.lte]: aujourdhui() } },
        include: [{ model: Creneau, as: "creneau" }],
    });
    const passees = candidates.filter(estPassee);
    if (!passees.length) return 0;
    await Affectation.update({ statut: "realise", realisee_le: new Date() }, { where: { id_affectation: passees.map((s) => s.id_affectation) } });
    return passees.length;
};

/**
 * Avancement des enseignements d'une période : heures prévues, planifiées, réalisées, reste,
 * et retard face au rythme attendu (heures prévues × semaines écoulées / semaines de cours).
 * Un responsable de filière ne voit que ses filières.
 */
export const suiviModules = async ({ id_periode, id_filiere = null, user }) => {
    const periode = await Periode.findByPk(id_periode);
    if (!periode) throw new ErreurMetier("Période introuvable", 404);
    let filieres = id_filiere ? [Number(id_filiere)] : null;
    if (user.role !== "admin") {
        const siennes = await filieresDuResponsable(user.id_user);
        filieres = filieres ? filieres.filter((f) => siennes.includes(f)) : siennes;
    }
    const enseignements = await Enseignement.findAll({
        where: { id_periode },
        include: [
            {
                model: CoursComposante,
                as: "composante",
                required: true,
                include: [{ model: Cours, as: "cours", required: true, where: filieres ? { id_filiere: filieres } : {}, include: [{ model: Filiere, as: "filiere", attributes: ["id_filiere", "code_filiere"] }] }],
            },
            { model: Groupe, as: "groupes", attributes: ["id_groupe", "nom_groupe"], through: { attributes: [] } },
        ],
    });
    // Lignes brutes et créneaux à part : une année compte des milliers de séances, dont seules
    // la durée et le statut servent (des instances Sequelize coûteraient plus que la requête)
    const seances = await Affectation.findAll({
        where: { id_enseignement: enseignements.map((e) => e.id_enseignement), statut: STATUTS_ACTIFS },
        attributes: ["id_enseignement", "statut", "date_seance", "id_creneau"],
        raw: true,
    });
    const creneaux = new Map((await Creneau.findAll({ where: { id_creneau: [...new Set(seances.map((s) => s.id_creneau))] } })).map((c) => [c.id_creneau, c]));
    let premiere = null;
    let derniere = null;
    for (const s of seances) {
        const date = String(s.date_seance).slice(0, 10);
        if (!premiere || date < premiere) premiere = date;
        if (!derniere || date > derniere) derniere = date;
    }
    const horaires = await horairesSurPlage(premiere, derniere);
    // Heures planifiées et réalisées par enseignement, en une passe sur les séances
    const totaux = new Map();
    for (const s of seances) {
        const duree = heures(horaires(creneaux.get(s.id_creneau), String(s.date_seance).slice(0, 10)));
        const total = totaux.get(s.id_enseignement) ?? { planifiees: 0, realisees: 0 };
        total.planifiees += duree;
        if (s.statut === "realise") total.realisees += duree;
        totaux.set(s.id_enseignement, total);
    }

    const today = aujourdhui();
    const debut = new Date(`${periode.date_debut}T12:00:00Z`);
    const semainesEcoulees = Math.max(0, Math.min(periode.nb_semaines || 16, Math.floor((new Date(`${today}T12:00:00Z`) - debut) / (7 * 24 * 3600 * 1000))));
    const partAttendue = today < periode.date_debut ? 0 : semainesEcoulees / (periode.nb_semaines || 16);

    return enseignements
        .map((e) => {
            const { planifiees, realisees } = totaux.get(e.id_enseignement) ?? { planifiees: 0, realisees: 0 };
            const attendues = e.heures_prevues * partAttendue;
            return {
                id_enseignement: e.id_enseignement,
                module: { id_cours: e.composante.cours.id_cours, code_cours: e.composante.cours.code_cours, nom_cours: e.composante.cours.nom_cours, filiere: e.composante.cours.filiere?.code_filiere },
                type: e.composante.type,
                groupes: e.groupes.map((g) => g.nom_groupe),
                heures_prevues: e.heures_prevues,
                heures_planifiees: arrondi(planifiees),
                heures_realisees: arrondi(realisees),
                reste: arrondi(Math.max(0, e.heures_prevues - realisees)),
                heures_attendues: arrondi(attendues),
                // Non planifié : il manque des séances pour couvrir le volume prévu
                non_planifie: arrondi(Math.max(0, e.heures_prevues - planifiees)),
                en_retard: attendues - realisees > TOLERANCE_RETARD_HEURES,
            };
        })
        .sort((a, b) => Number(b.en_retard) - Number(a.en_retard) || (a.module.filiere || "").localeCompare(b.module.filiere || "") || a.module.nom_cours.localeCompare(b.module.nom_cours));
};

/** Séances réalisées d'un mois, avec leurs enseignants (titulaire et co-enseignants). */
const realiseesDuMois = async (mois) => {
    if (!/^\d{4}-\d{2}$/.test(String(mois || ""))) throw new ErreurMetier("Mois attendu au format AAAA-MM", 400);
    const [annee, m] = mois.split("-").map(Number);
    const fin = new Date(Date.UTC(annee, m, 0)).toISOString().slice(0, 10);
    const seances = await Affectation.findAll({
        where: { statut: "realise", date_seance: { [Op.between]: [`${mois}-01`, fin] } },
        include: [
            { model: Creneau, as: "creneau" },
            { model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] },
            { model: Groupe, as: "groupe", attributes: ["nom_groupe"] },
            { model: Salle, as: "salle", attributes: ["nom_salle"] },
            { model: Enseignement, as: "enseignement", include: [{ model: EnseignementEnseignant, as: "services", where: { role: "co_enseignant", statut_service: "accepte" }, required: false }] },
        ],
        order: [["date_seance", "ASC"]],
    });
    await appliquerRamadan(seances);
    // État pour la paie (R-11) : appel validé, à vérifier, confirmée ou écartée par l'administration
    const etats = await etatsDesSeances(seances.map((s) => s.id_affectation));
    for (const s of seances) s.paie = etats.get(s.id_affectation);
    return seances;
};

/** Titulaire et co-enseignants d'une séance : chacun est compté pour toute sa durée. */
const enseignantsDe = (seance) => [...new Set([seance.id_user_enseignant, ...(seance.enseignement?.services ?? []).map((x) => x.id_user)])];

/**
 * Heures par enseignant sur un mois. `heures_realisees` ne compte plus les séances écartées par
 * l'administration ; `heures_a_verifier` en est la part sans appel validé ni décision (R-11).
 */
export const suiviEnseignants = async ({ mois }) => {
    const seances = await realiseesDuMois(mois);
    const parUser = new Map();
    for (const s of seances) {
        for (const idUser of enseignantsDe(s)) {
            const total = parUser.get(idUser) ?? { realisees: 0, aVerifier: 0, ecartees: 0, seancesAVerifier: 0 };
            if (s.paie.compte) total.realisees += heures(s.creneau);
            else total.ecartees += heures(s.creneau);
            if (s.paie.etat === "a_verifier") {
                total.aVerifier += heures(s.creneau);
                total.seancesAVerifier += 1;
            }
            parUser.set(idUser, total);
        }
    }
    const enseignants = await Enseignant.findAll({ where: { id_user: [...parUser.keys()] }, include: [{ model: Users, as: "user", attributes: ["nom", "prenom"] }] });
    return enseignants
        .map((e) => {
            const total = parUser.get(e.id_user);
            return { id_user: e.id_user, nom: e.user.nom, prenom: e.user.prenom, statut: e.statut, entreprise: e.entreprise, heures_realisees: arrondi(total.realisees), heures_a_verifier: arrondi(total.aVerifier), heures_ecartees: arrondi(total.ecartees), seances_a_verifier: total.seancesAVerifier };
        })
        .sort((a, b) => a.nom.localeCompare(b.nom));
};

/**
 * Séances réalisées d'un mois que l'appel ne suffit pas à retenir : celles à vérifier, et celles
 * déjà confirmées ou écartées (pour pouvoir revenir sur une décision). Les séances dont l'appel
 * est validé, sans décision, n'y figurent pas.
 */
export const seancesAVerifier = async ({ mois }) => {
    const seances = (await realiseesDuMois(mois)).filter((s) => s.paie.etat !== "appel_valide");
    const enseignants = await Enseignant.findAll({ where: { id_user: [...new Set(seances.flatMap(enseignantsDe))] }, include: [{ model: Users, as: "user", attributes: ["nom", "prenom"] }] });
    const parId = new Map(enseignants.map((e) => [e.id_user, { id_user: e.id_user, nom: e.user.nom, prenom: e.user.prenom, statut: e.statut }]));
    return {
        mois,
        note: NOTE_APPEL,
        a_verifier: seances.filter((s) => s.paie.etat === "a_verifier").length,
        seances: seances.map((s) => ({
            id_affectation: s.id_affectation,
            date: s.date_seance,
            debut: String(s.creneau.heure_debut).slice(0, 5),
            fin: String(s.creneau.heure_fin).slice(0, 5),
            heures: arrondi(heures(s.creneau)),
            module: `${s.cours?.code_cours} ${s.cours?.nom_cours}`,
            groupe: s.groupe?.nom_groupe ?? null,
            salle: s.salle?.nom_salle ?? null,
            enseignants: enseignantsDe(s).map((id) => parId.get(id)).filter(Boolean),
            etat: s.paie.etat,
            libelle: s.paie.libelle,
            appel_ouvert: s.paie.appel_ouvert,
            motif: s.paie.motif,
            decide_le: s.paie.decide_le,
        })),
    };
};

/**
 * Cellule CSV. Une valeur qui commence par = + - @ (ou tabulation, retour chariot) serait
 * exécutée comme formule par Excel ou LibreOffice (injection CSV, OWASP) : elle est préfixée
 * d'une apostrophe, lue comme du texte.
 */
export const champCsv = (v) => {
    let texte = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
    return /[;"\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
};

/**
 * Export CSV (séparateur « ; ») des heures réalisées par les vacataires sur un mois, une ligne par
 * séance. Les séances écartées par l'administration n'y sont pas ; la colonne « etat » dit pour
 * chaque autre si elle reste à vérifier (R-11).
 */
export const exportVacataires = async ({ mois }) => {
    const seances = (await realiseesDuMois(mois)).filter((s) => s.paie.compte);
    const vacataires = await Enseignant.findAll({ where: { statut: "vacataire" }, include: [{ model: Users, as: "user", attributes: ["nom", "prenom", "email"] }] });
    const parId = new Map(vacataires.map((v) => [v.id_user, v]));
    const lignes = [["nom", "prenom", "email", "entreprise", "date", "debut", "fin", "heures", "module", "groupe", "salle", "etat"]];
    for (const s of seances) {
        for (const idUser of enseignantsDe(s)) {
            const v = parId.get(idUser);
            if (!v) continue;
            lignes.push([v.user.nom, v.user.prenom, v.user.email, v.entreprise, s.date_seance, String(s.creneau.heure_debut).slice(0, 5), String(s.creneau.heure_fin).slice(0, 5), String(arrondi(heures(s.creneau))).replace(".", ","), `${s.cours?.code_cours} ${s.cours?.nom_cours}`, s.groupe?.nom_groupe, s.salle?.nom_salle ?? "distanciel", s.paie.libelle]);
        }
    }
    // BOM : Excel ouvre le fichier en UTF-8 (accents)
    return `${String.fromCharCode(0xfeff)}${lignes.map((l) => l.map(champCsv).join(";")).join("\r\n")}\r\n`;
};

// ==================== RETOURS DE SÉANCE (I7) ====================
