import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import {
    Affectation,
    Appartenir,
    Cours,
    CoursComposante,
    Creneau,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Filiere,
    Groupe,
    HistoriqueAffectation,
    Periode,
    RetourSeance,
    RetourSeanceParticipation,
    Salle,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { STATUTS_ACTIFS, aujourdhui, minutes } from "./affectationRules.js";
import { avecAncetres } from "./groupes.js";
import { appliquerRamadan, horairesSurPlage } from "./ramadan.js";
import { filieresDuResponsable } from "./droits.js";

/**
 * Suivi du réalisé (phase P7) et retours de séance (innovation I7).
 * Une séance devient « réalisée » quand son enseignant la marque, ou d'office une fois passée si
 * elle était confirmée (et non reportée). Les heures réalisées alimentent l'avancement des
 * modules, la charge des enseignants et l'export mensuel des vacataires (paie hors périmètre).
 */

const FUSEAU = process.env.APP_TIMEZONE || "Africa/Casablanca";
const heureCourante = () => new Date().toLocaleTimeString("en-GB", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit" });
const heures = (creneau) => (minutes(creneau.heure_fin) - minutes(creneau.heure_debut)) / 60;
const arrondi = (n) => Math.round(n * 10) / 10;
// Tolérance avant de signaler un module en retard sur son rythme
const TOLERANCE_RETARD_HEURES = 3;
const MIN_RETOURS_VISIBLES = 5;
const DELAI_RETOUR_JOURS = 7;

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

/** L'enseignant (ou l'administration) marque une séance faite, une fois l'heure de fin passée. */
export const realiserSeance = async ({ id, user }) =>
    sequelize.transaction(async (transaction) => {
        const seance = await Affectation.findByPk(id, { include: [{ model: Creneau, as: "creneau" }], transaction, lock: transaction.LOCK.UPDATE });
        if (!seance) throw new ErreurMetier("Affectation non trouvée", 404);
        if (user.role !== "admin" && seance.id_user_enseignant !== user.id_user) throw new ErreurMetier("Seul l'enseignant de la séance peut la marquer réalisée", 403);
        if (!["planifie", "confirme", "reporte"].includes(seance.statut)) throw new ErreurMetier(`Une séance ${seance.statut} ne peut pas être marquée réalisée`, 400);
        if (!estPassee(seance)) throw new ErreurMetier("La séance n'est pas encore terminée", 400);
        const avant = seance.statut;
        await seance.update({ statut: "realise", realisee_le: new Date() }, { transaction });
        await HistoriqueAffectation.create(
            { id_affectation: seance.id_affectation, id_user: user.id_user, action: "modification", anciens_donnees: { statut: avant }, nouveaux_donnees: { statut: "realise" } },
            { transaction }
        );
        return seance;
    });

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
    return seances;
};

/** Heures réalisées par enseignant sur un mois. */
export const suiviEnseignants = async ({ mois }) => {
    const seances = await realiseesDuMois(mois);
    const parUser = new Map();
    for (const s of seances) {
        for (const idUser of new Set([s.id_user_enseignant, ...(s.enseignement?.services ?? []).map((x) => x.id_user)])) {
            parUser.set(idUser, (parUser.get(idUser) || 0) + heures(s.creneau));
        }
    }
    const enseignants = await Enseignant.findAll({ where: { id_user: [...parUser.keys()] }, include: [{ model: Users, as: "user", attributes: ["nom", "prenom"] }] });
    return enseignants
        .map((e) => ({ id_user: e.id_user, nom: e.user.nom, prenom: e.user.prenom, statut: e.statut, entreprise: e.entreprise, heures_realisees: arrondi(parUser.get(e.id_user)) }))
        .sort((a, b) => a.nom.localeCompare(b.nom));
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

/** Export CSV (séparateur « ; ») des heures réalisées par les vacataires sur un mois, une ligne par séance. */
export const exportVacataires = async ({ mois }) => {
    const seances = await realiseesDuMois(mois);
    const vacataires = await Enseignant.findAll({ where: { statut: "vacataire" }, include: [{ model: Users, as: "user", attributes: ["nom", "prenom", "email"] }] });
    const parId = new Map(vacataires.map((v) => [v.id_user, v]));
    const lignes = [["nom", "prenom", "email", "entreprise", "date", "debut", "fin", "heures", "module", "groupe", "salle"]];
    for (const s of seances) {
        for (const idUser of new Set([s.id_user_enseignant, ...(s.enseignement?.services ?? []).map((x) => x.id_user)])) {
            const v = parId.get(idUser);
            if (!v) continue;
            lignes.push([v.user.nom, v.user.prenom, v.user.email, v.entreprise, s.date_seance, String(s.creneau.heure_debut).slice(0, 5), String(s.creneau.heure_fin).slice(0, 5), String(arrondi(heures(s.creneau))).replace(".", ","), `${s.cours?.code_cours} ${s.cours?.nom_cours}`, s.groupe?.nom_groupe, s.salle?.nom_salle ?? "distanciel"]);
        }
    }
    // BOM : Excel ouvre le fichier en UTF-8 (accents)
    return `${String.fromCharCode(0xfeff)}${lignes.map((l) => l.map(champCsv).join(";")).join("\r\n")}\r\n`;
};

// ==================== RETOURS DE SÉANCE (I7) ====================

/** Groupes d'un étudiant et groupes qui les contiennent (une séance de promotion le concerne). */
const groupesDeLEtudiant = async (idUser) => {
    const appartenances = await Appartenir.findAll({ where: { id_user_etudiant: idUser }, attributes: ["id_groupe"] });
    return new Set(await avecAncetres(appartenances.map((a) => a.id_groupe)));
};

const ilYA = (jours) => {
    const d = new Date(`${aujourdhui()}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - jours);
    return d.toISOString().slice(0, 10);
};

/** Séances réalisées des 7 derniers jours de l'étudiant auxquelles il n'a pas encore répondu. */
export const retoursADonner = async ({ user }) => {
    const groupes = await groupesDeLEtudiant(user.id_user);
    const seances = await Affectation.findAll({
        where: { statut: "realise", id_groupe: [...groupes], date_seance: { [Op.between]: [ilYA(DELAI_RETOUR_JOURS), aujourdhui()] } },
        include: [
            { model: Creneau, as: "creneau" },
            { model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] },
            { model: Users, as: "enseignant", attributes: ["nom", "prenom"] },
        ],
        order: [["date_seance", "DESC"]],
    });
    const dejaFaits = new Set((await RetourSeanceParticipation.findAll({ where: { id_user: user.id_user, id_affectation: seances.map((s) => s.id_affectation) } })).map((p) => p.id_affectation));
    return seances.filter((s) => !dejaFaits.has(s.id_affectation));
};

/** Dépose un retour anonyme : une fois par séance, dans les 7 jours, pour une séance de ses groupes. */
export const deposerRetour = async ({ id_affectation, user, note, mot }) => {
    if (!Number.isInteger(note) || note < 1 || note > 5) throw new ErreurMetier("La note va de 1 à 5", 400);
    const motPropre = String(mot || "").trim().slice(0, 40) || null;
    const seance = await Affectation.findByPk(id_affectation);
    if (!seance) throw new ErreurMetier("Séance introuvable", 404);
    if (!(await groupesDeLEtudiant(user.id_user)).has(seance.id_groupe)) throw new ErreurMetier("Cette séance ne concerne pas vos groupes", 403);
    if (seance.statut !== "realise") throw new ErreurMetier("Le retour s'ouvre une fois la séance réalisée", 400);
    if (seance.date_seance < ilYA(DELAI_RETOUR_JOURS)) throw new ErreurMetier(`Le retour est possible pendant ${DELAI_RETOUR_JOURS} jours après la séance`, 400);
    return sequelize.transaction(async (transaction) => {
        const [, cree] = await RetourSeanceParticipation.findOrCreate({ where: { id_affectation, id_user: user.id_user }, transaction });
        if (!cree) throw new ErreurMetier("Vous avez déjà donné votre retour sur cette séance", 409);
        await RetourSeance.create({ id_affectation, note, mot: motPropre, jour: aujourdhui() }, { transaction });
        return { message: "Merci pour votre retour" };
    });
};

/**
 * Tendance par module pour un enseignant : moyenne, nombre et mots fréquents, seulement quand
 * au moins 5 réponses existent (en dessous, une réponse pourrait être reconnue).
 */
export const retoursEnseignant = async ({ id_user }) => {
    const seances = await Affectation.findAll({
        where: { id_user_enseignant: id_user, statut: "realise" },
        attributes: ["id_affectation", "id_cours"],
        include: [{ model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] }],
    });
    const retours = await RetourSeance.findAll({ where: { id_affectation: seances.map((s) => s.id_affectation) } });
    const coursDe = new Map(seances.map((s) => [s.id_affectation, s.cours]));
    const parModule = new Map();
    for (const r of retours) {
        const cours = coursDe.get(r.id_affectation);
        const m = parModule.get(cours.id_cours) || { module: cours, notes: [], mots: new Map() };
        m.notes.push(r.note);
        if (r.mot) {
            const cle = r.mot.toLowerCase();
            m.mots.set(cle, (m.mots.get(cle) || 0) + 1);
        }
        parModule.set(cours.id_cours, m);
    }
    return [...parModule.values()].map((m) =>
        m.notes.length < MIN_RETOURS_VISIBLES
            ? { module: m.module, nombre: m.notes.length, visible: false }
            : {
                  module: m.module,
                  nombre: m.notes.length,
                  visible: true,
                  moyenne: arrondi(m.notes.reduce((t, n) => t + n, 0) / m.notes.length),
                  repartition: [1, 2, 3, 4, 5].map((n) => m.notes.filter((x) => x === n).length),
                  // Un mot n'apparaît que s'il revient au moins deux fois (jamais une réponse isolée)
                  mots: [...m.mots.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([mot, n]) => ({ mot, nombre: n })),
              }
    );
};
