import { Op, fn, col, where as condition } from "sequelize";
import { Affectation, Campus, Cours, CoursComposante, Creneau, Enseignement, EnseignementGroupe, EnvoiEdt, Salle, Users } from "../../models/index.js";
import { avecDescendants } from "../planning/groupes.js";
import { appliquerRamadan } from "../planning/ramadan.js";

/**
 * Version publiée de l'emploi du temps (décision du 21 octobre 2026) : les étudiants voient ce que
 * l'administration a publié, pas le planning en cours de travail. Chaque « Publier et envoyer »
 * garde, par classe et par mois, les séances telles qu'elles étaient (EnvoiEdt.seances, une
 * « ligne » par séance). Un changement en masse (génération, import, préparation) reste donc
 * invisible jusqu'à la publication suivante. Un changement ponctuel qui prévient déjà les
 * étudiants (séance déplacée ou annulée à la main, imprévu, report confirmé) est publié aussitôt :
 * publierSeance() met à jour la ligne de cette séance dans les mois publiés.
 */

// « à reprogrammer » (R-1) : publiée à sa date d'origine, l'étudiant la voit « reportée · date à venir »
const STATUTS_PUBLIABLES = ["planifie", "confirme", "reporte", "realise", "annule", "a_reprogrammer"];
// Statuts annoncés aux étudiants : entre la séance et sa ligne, c'est la version publiée qui l'emporte
const STATUTS_ANNONCES = ["annule", "a_reprogrammer"];
const hhmm = (h) => String(h ?? "").slice(0, 5);
const moisDe = (date) => String(date).slice(0, 7);

/** Ce qu'il faut charger d'une séance pour en écrire la ligne. */
export const INCLUDES_LIGNE = [
    { model: Cours, as: "cours", attributes: ["nom_cours", "type_cours"] },
    { model: Creneau, as: "creneau" },
    { model: Salle, as: "salle" },
    { model: Users, as: "enseignant", attributes: ["nom", "prenom"] },
    { model: Enseignement, as: "enseignement", attributes: ["id_enseignement"], include: [{ model: CoursComposante, as: "composante", attributes: ["type", "modalite"] }] },
];

/** La ligne publiée d'une séance (horaires du Ramadan déjà appliqués) : ce qu'en voient les étudiants. */
export const ligneDe = (s) => ({
    id: s.id_affectation,
    date: String(s.date_seance).slice(0, 10),
    debut: hhmm(s.creneau.heure_debut),
    fin: hhmm(s.creneau.heure_fin),
    cours: s.cours?.nom_cours ?? "Séance",
    type: s.enseignement?.composante?.type ?? s.cours?.type_cours ?? null,
    salle: s.enseignement?.composante?.modalite === "distanciel" ? "Distanciel" : s.salle?.nom_salle ?? null,
    enseignant: s.enseignant ? `${s.enseignant.prenom} ${s.enseignant.nom}` : null,
    // De quoi rétablir la séance telle que publiée, même si elle a bougé depuis
    id_creneau: s.id_creneau,
    id_salle: s.id_salle ?? null,
    id_user_enseignant: s.id_user_enseignant,
    statut: s.statut,
});

const trier = (lignes) => lignes.sort((x, y) => `${x.date}${x.debut}${x.id}`.localeCompare(`${y.date}${y.debut}${y.id}`));

/**
 * Publie aussitôt une séance changée ponctuellement : sa ligne est retirée des mois publiés où elle
 * figurait, puis réécrite, telle qu'elle est maintenant, dans le mois publié de chaque classe qui
 * la suit. Une séance supprimée disparaît simplement. Les mois jamais publiés ne sont pas touchés.
 */
export const publierSeance = async (idAffectation) => {
    const id = Number(idAffectation);
    if (!id) return;
    const seance = await Affectation.findByPk(id, { include: INCLUDES_LIGNE });
    const contenant = await EnvoiEdt.findAll({ where: condition(fn("JSON_CONTAINS", col("seances"), JSON.stringify({ id })), 1) });

    let cibles = [];
    let ligne = null;
    if (seance && seance.creneau && STATUTS_PUBLIABLES.includes(seance.statut)) {
        await appliquerRamadan([seance]);
        ligne = ligneDe(seance);
        // Les classes qui suivent la séance : son groupe, ses sous-groupes, et ceux des groupes réunis par l'enseignement
        const reunis = seance.id_enseignement ? (await EnseignementGroupe.findAll({ where: { id_enseignement: seance.id_enseignement }, attributes: ["id_groupe"] })).map((l) => l.id_groupe) : [];
        const classes = await avecDescendants([...new Set([seance.id_groupe, ...reunis])]);
        cibles = await EnvoiEdt.findAll({ where: { id_groupe: classes, mois: moisDe(ligne.date) } });
    }

    const parId = new Map([...contenant, ...cibles].map((e) => [e.id_envoi, e]));
    const idsCibles = new Set(cibles.map((e) => e.id_envoi));
    for (const envoi of parId.values()) {
        const lignes = (envoi.seances ?? []).filter((l) => l.id !== id);
        if (ligne && idsCibles.has(envoi.id_envoi)) lignes.push(ligne);
        await envoi.update({ seances: trier(lignes) });
    }
};

/** Les lignes publiées, par séance, de plusieurs envois : la plus récente gagne si une séance figure deux fois. */
export const lignesPubliees = (envois) => {
    const parId = new Map();
    for (const envoi of [...envois].sort((a, b) => new Date(a.envoye_le) - new Date(b.envoye_le))) {
        for (const l of envoi.seances ?? []) parId.set(l.id, l);
    }
    return parId;
};

/**
 * Rétablit sur des séances chargées en direct ce qui a été publié : date, créneau, salle,
 * enseignant, et l'annulation ou le report sans date s'ils ont été publiés. Ne garde que les séances
 * publiées. Une annulation non publiée (régénération) laisse la séance telle qu'elle était publiée. Les
 * horaires du Ramadan sont appliqués après.
 */
export const appliquerVersionPubliee = async (seances, lignesParId) => {
    const gardees = seances.filter((s) => lignesParId.has(s.id_affectation));
    const charger = async (Modele, ids, options = {}) => new Map((ids.length ? await Modele.findAll({ where: { [Modele.primaryKeyAttribute]: [...new Set(ids)] }, ...options }) : []).map((x) => [x[Modele.primaryKeyAttribute], x]));
    const lignes = gardees.map((s) => lignesParId.get(s.id_affectation));
    const [creneaux, salles, enseignants] = await Promise.all([
        charger(Creneau, lignes.map((l) => l.id_creneau).filter(Boolean)),
        charger(Salle, lignes.map((l) => l.id_salle).filter(Boolean), { include: [{ model: Campus, as: "campus" }] }),
        charger(Users, lignes.map((l) => l.id_user_enseignant).filter(Boolean), { attributes: ["id_user", "nom", "prenom"] }),
    ]);
    for (const s of gardees) {
        const l = lignesParId.get(s.id_affectation);
        s.setDataValue("date_seance", l.date);
        // Une ligne d'avant ce lot (sans identifiants) ne sait que la date : le reste vient de la séance
        if (l.id_creneau && l.id_creneau !== s.id_creneau && creneaux.has(l.id_creneau)) {
            s.setDataValue("id_creneau", l.id_creneau);
            // Une copie par séance : le Ramadan change les horaires selon la date de chacune
            s.setDataValue("creneau", Creneau.build(creneaux.get(l.id_creneau).get({ plain: true }), { isNewRecord: false }));
        }
        if (l.id_salle !== undefined && l.id_salle !== s.id_salle) {
            s.setDataValue("id_salle", l.id_salle);
            s.setDataValue("salle", salles.get(l.id_salle) ?? null);
        }
        if (l.id_user_enseignant && l.id_user_enseignant !== s.id_user_enseignant && enseignants.has(l.id_user_enseignant)) {
            s.setDataValue("id_user_enseignant", l.id_user_enseignant);
            s.setDataValue("enseignant", enseignants.get(l.id_user_enseignant));
        }
        if (l.statut && (STATUTS_ANNONCES.includes(s.statut) || STATUTS_ANNONCES.includes(l.statut)) && l.statut !== s.statut) s.setDataValue("statut", l.statut);
    }
    await appliquerRamadan(gardees);
    return gardees.sort((a, b) => `${a.date_seance}${hhmm(a.creneau?.heure_debut)}${a.id_affectation}`.localeCompare(`${b.date_seance}${hhmm(b.creneau?.heure_debut)}${b.id_affectation}`));
};

/** Les lignes publiées de classes sur une période (mois touchés seulement). */
export const lignesDesClasses = async (idsGroupes, debut, fin) => {
    const envois = await EnvoiEdt.findAll({ where: { id_groupe: idsGroupes, mois: { [Op.between]: [moisDe(debut), moisDe(fin)] } } });
    const parId = lignesPubliees(envois);
    for (const [id, l] of parId) if (l.date < debut || l.date > fin) parId.delete(id);
    return parId;
};
