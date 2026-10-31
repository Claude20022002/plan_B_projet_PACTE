import { UniqueConstraintError } from "sequelize";
import { Appartenir, Sondage, SondageChoix, SondageParticipation, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { aujourdhui } from "../planning/affectationRules.js";
import { avecDescendants } from "../planning/groupes.js";
import { identite } from "../etablissement/identite.js";
import { creerNotificationsMultiples } from "../../utils/notificationHelper.js";
import { classeAutorisee } from "./droits.js";
import { SEUIL_ANONYMAT, sondageOuvert, verifierSondage } from "../../../shared/sondages.js";

/**
 * Sondage de l'enseignant à sa classe (plan multi-établissements, fichier 14, lot EC-9 ;
 * conception-ec9-groupe-b.md, règles S-1 à S-11). Une question, 2 à 6 choix ; les étudiants de la
 * classe répondent une fois, anonymement : le choix incrémente un compteur, la participation dit
 * seulement « a répondu ». Les droits sont ceux de l'espace de cours (services/cours/droits.js).
 */

export const MESSAGE_SONDAGES_FERMES = "Les sondages ne sont pas ouverts pour cet établissement";

// Motifs de refus de shared/sondages.js (règle S-3)
const MOTIFS = {
    question: "La question compte de 3 à 300 caractères",
    nombreChoix: "Un sondage a de 2 à 6 choix",
    choix: "Chaque choix compte de 1 à 100 caractères",
    doublon: "Deux choix sont identiques",
    date: "Date de fin invalide : AAAA-MM-JJ, aujourd'hui ou plus tard",
};

/** Interrupteur de l'école (S-1) : lu sur sa ligne, éteint par défaut. */
const sondagesActifs = async () => (await identite()).sondages_actifs === true;

const exigerActifs = async () => {
    if (!(await sondagesActifs())) throw new ErreurMetier(MESSAGE_SONDAGES_FERMES, 403, "SONDAGES_FERMES");
};

const AVEC_CHOIX = { include: [{ model: SondageChoix, as: "choix" }], order: [[{ model: SondageChoix, as: "choix" }, "rang", "ASC"]] };

/** Sondage et classe, si l'utilisateur la voit (ou la gère) ; 404 sinon, sans dire pourquoi (S-2). */
const sondageAutorise = async (user, id, { gerer = false } = {}) => {
    const sondage = await Sondage.findByPk(Number(id) || 0, AVEC_CHOIX);
    if (!sondage) throw new ErreurMetier("Sondage introuvable", 404);
    try {
        return { sondage, ...(await classeAutorisee(user, sondage.id_cours, sondage.id_groupe, { gerer })) };
    } catch (erreur) {
        if (erreur.status === 404) throw new ErreurMetier("Sondage introuvable", 404);
        throw erreur;
    }
};

/** Étudiants actifs de la classe : son groupe et ses sous-groupes (S-7 effectif, S-10 notification). */
const etudiantsDeLaClasse = async (idGroupe) => {
    const liens = await Appartenir.findAll({ where: { id_groupe: await avecDescendants([idGroupe]) }, attributes: ["id_user_etudiant"] });
    if (!liens.length) return [];
    const ids = [...new Set(liens.map((l) => l.id_user_etudiant))];
    return (await Users.findAll({ where: { id_user: ids, role: "etudiant", actif: true }, attributes: ["id_user"] })).map((u) => u.id_user);
};

const enTete = (sondage, jour) => ({
    id_sondage: sondage.id_sondage,
    question: sondage.question,
    ferme_le: sondage.ferme_le,
    clos_le: sondage.clos_le,
    ouvert: sondageOuvert(sondage, jour),
    createdAt: sondage.createdAt,
});

/** Vue de qui gère la classe : compteurs, sauf sous le seuil d'anonymat (S-7). */
const vueEnseignant = (sondage, effectif, jour) => {
    const total = sondage.choix.reduce((somme, c) => somme + c.reponses, 0);
    const visible = total >= SEUIL_ANONYMAT;
    return {
        ...enTete(sondage, jour),
        choix: sondage.choix.map((c) => ({ id_choix: c.id_choix, libelle: c.libelle, reponses: visible ? c.reponses : null })),
        reponses: total,
        effectif,
        a_repondu: false,
    };
};

/** Vue de l'étudiant : ni compteurs ni effectif (S-8). */
const vueEtudiant = (sondage, aRepondu, jour) => ({
    ...enTete(sondage, jour),
    choix: sondage.choix.map((c) => ({ id_choix: c.id_choix, libelle: c.libelle })),
    a_repondu: aRepondu,
});

/** Sondages d'une classe : tous pour qui la gère, les seuls ouverts pour l'étudiant. */
export const lireSondages = async (user, idCours, idGroupe) => {
    const { cours, groupe, gere } = await classeAutorisee(user, idCours, idGroupe);
    if (!(await sondagesActifs())) return { actif: false, gere, sondages: [] };
    const jour = aujourdhui();
    const sondages = await Sondage.findAll({
        where: { id_cours: cours.id_cours, id_groupe: groupe.id_groupe },
        include: AVEC_CHOIX.include,
        order: [["createdAt", "DESC"], ["id_sondage", "DESC"], ...AVEC_CHOIX.order],
    });
    if (gere) {
        const effectif = (await etudiantsDeLaClasse(groupe.id_groupe)).length;
        return { actif: true, gere, sondages: sondages.map((s) => vueEnseignant(s, effectif, jour)) };
    }
    const ouverts = sondages.filter((s) => sondageOuvert(s, jour));
    const repondus = ouverts.length
        ? new Set((await SondageParticipation.findAll({ where: { id_user: user.id_user, id_sondage: ouverts.map((s) => s.id_sondage) } })).map((p) => p.id_sondage))
        : new Set();
    return { actif: true, gere, sondages: ouverts.map((s) => vueEtudiant(s, repondus.has(s.id_sondage), jour)) };
};

/** Crée le sondage et prévient les étudiants de la classe (S-3, S-10). */
export const creerSondage = async (user, idCours, idGroupe, corps = {}) => {
    await exigerActifs();
    const { cours, groupe } = await classeAutorisee(user, idCours, idGroupe, { gerer: true });
    const jour = aujourdhui();
    const { motif, sondage: contenu } = verifierSondage(corps, jour);
    if (motif) throw new ErreurMetier(MOTIFS[motif], 400, "SONDAGE_INVALIDE");

    const id = await Sondage.sequelize.transaction(async (transaction) => {
        const sondage = await Sondage.create(
            { id_cours: cours.id_cours, id_groupe: groupe.id_groupe, question: contenu.question, ferme_le: contenu.ferme_le, id_user_auteur: user.id_user },
            { transaction }
        );
        await SondageChoix.bulkCreate(contenu.choix.map((libelle, rang) => ({ id_sondage: sondage.id_sondage, rang, libelle })), { transaction });
        return sondage.id_sondage;
    });

    const etudiants = await etudiantsDeLaClasse(groupe.id_groupe);
    if (etudiants.length) {
        await creerNotificationsMultiples({
            id_users: etudiants,
            titre: "Nouveau sondage",
            message: `${cours.nom_cours} : ${contenu.question}`,
            type_notification: "info",
            lien: `/mes-cours/${cours.id_cours}/${groupe.id_groupe}`,
        });
    }
    return vueEnseignant(await Sondage.findByPk(id, AVEC_CHOIX), etudiants.length, jour);
};

/** Une réponse par étudiant, définitive et anonyme (S-5, S-6). */
export const repondre = async (user, id, idChoix) => {
    await exigerActifs();
    const { sondage } = await sondageAutorise(user, id);
    if (user.role !== "etudiant") throw new ErreurMetier("Seuls les étudiants de la classe répondent à un sondage", 403);
    if (!sondageOuvert(sondage, aujourdhui())) throw new ErreurMetier("Ce sondage est fermé", 409, "SONDAGE_FERME");
    const choix = sondage.choix.find((c) => c.id_choix === Number(idChoix));
    if (!choix) throw new ErreurMetier("Ce choix n'appartient pas au sondage", 400, "SONDAGE_INVALIDE");

    try {
        // La clé (sondage, étudiant) refuse une deuxième réponse, même envoyée en même temps : rien n'est alors compté
        await Sondage.sequelize.transaction(async (transaction) => {
            await SondageParticipation.create({ id_sondage: sondage.id_sondage, id_user: user.id_user }, { transaction });
            await SondageChoix.increment("reponses", { by: 1, where: { id_choix: choix.id_choix }, transaction });
        });
    } catch (erreur) {
        if (erreur instanceof UniqueConstraintError) throw new ErreurMetier("Vous avez déjà répondu à ce sondage", 409, "SONDAGE_DEJA_REPONDU");
        throw erreur;
    }
};

/** Clôture par qui gère la classe ; un sondage clos ne se rouvre pas (S-4). */
export const clore = async (user, id) => {
    await exigerActifs();
    const { sondage, groupe } = await sondageAutorise(user, id, { gerer: true });
    if (!sondage.clos_le) await sondage.update({ clos_le: new Date() });
    return vueEnseignant(sondage, (await etudiantsDeLaClasse(groupe.id_groupe)).length, aujourdhui());
};

/** Suppression, avec ses choix et ses participations (S-9, clés en cascade). */
export const supprimer = async (user, id) => {
    await exigerActifs();
    const { sondage } = await sondageAutorise(user, id, { gerer: true });
    await sondage.destroy();
};
