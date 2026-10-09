import { Op } from "sequelize";
import { Affectation, Appartenir, Cours, CoursComposante, Creneau, Enseignement, EnseignementGroupe, Evenement, Filiere, Groupe, Salle, SessionExamen, SessionExamenGroupe, SessionExamenSalle, Users } from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { ancetres } from "./groupes.js";
import { appliquerRamadan } from "./ramadan.js";

/**
 * Emploi du temps de l'étudiant connecté (application mobile, phase D2) : les séances de ses
 * groupes ET de leurs groupes parents (le CM de la promotion d'un étudiant de TD), y compris
 * celles mutualisées avec d'autres groupes. Les séances annulées restent visibles : le panneau
 * les affiche comme telles. Rien d'autre que ce que l'étudiant voit sur le web.
 */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const JOURS_MAX = 62;

/** Date réelle au format AAAA-MM-JJ (pas de 31 février : la date relue doit être la même). */
const dateValide = (v) => typeof v === "string" && DATE.test(v) && !Number.isNaN(Date.parse(v)) && new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v;

const ajouterJours = (iso, n) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

// Événements internes au personnel : pas dans l'agenda des étudiants
const TYPES_EVENEMENT_ETUDIANT = ["vacances", "examen", "ferie", "ramadan", "stage", "autre"];

/**
 * Événements du calendrier qui concernent l'étudiant (vacances, jours fériés, examens, stage…) :
 * ceux de l'établissement, du campus de sa filière, de sa filière, de son niveau ou de ses groupes.
 */
const evenementsDeLEtudiant = async (groupes, debut, fin) => {
    const filieres = [...new Set(groupes.map((g) => g.id_filiere))];
    const campus = (await Filiere.findAll({ where: { id_filiere: filieres }, attributes: ["id_campus_prefere"] })).map((f) => f.id_campus_prefere).filter(Boolean);
    const niveaux = [...new Set(groupes.map((g) => g.niveau).filter(Boolean))];
    const evenements = await Evenement.findAll({
        where: {
            date_debut: { [Op.lte]: fin },
            date_fin: { [Op.gte]: debut },
            type_evenement: TYPES_EVENEMENT_ETUDIANT,
            [Op.or]: [
                { portee: "etablissement" },
                ...(campus.length ? [{ portee: "campus", id_cible: campus }] : []),
                { portee: "filiere", id_cible: filieres },
                ...(niveaux.length ? [{ portee: "niveau", id_cible: filieres, niveau: niveaux }] : []),
                { portee: "groupe", id_cible: groupes.map((g) => g.id_groupe) },
            ],
        },
        order: [["date_debut", "ASC"]],
    });
    return evenements.map((e) => ({
        id: e.id_evenement,
        titre: e.titre,
        type: e.type_evenement,
        date_debut: e.date_debut,
        date_fin: e.date_fin,
        heure_debut: e.heure_debut ?? null,
        heure_fin: e.heure_fin ?? null,
        date_confirmee: e.date_confirmee,
    }));
};

/** Examens publiés de ses groupes (et de leurs parents) sur la période. */
const examensDeLEtudiant = async (ids, debut, fin) => {
    const liens = await SessionExamenGroupe.findAll({ where: { id_groupe: ids }, attributes: ["id_session"] });
    if (!liens.length) return [];
    const examens = await SessionExamen.findAll({
        where: { id_session: [...new Set(liens.map((l) => l.id_session))], statut: "publiee", date: { [Op.between]: [debut, fin] } },
        include: [
            { model: Cours, as: "cours", attributes: ["code_cours", "nom_cours"] },
            { model: SessionExamenSalle, as: "salles", include: [{ model: Salle, as: "salle", attributes: ["nom_salle"] }] },
        ],
        order: [["date", "ASC"], ["heure_debut", "ASC"]],
    });
    return examens.map((x) => ({
        id: x.id_session,
        titre: x.titre,
        date: x.date,
        heure_debut: x.heure_debut,
        heure_fin: x.heure_fin,
        cours: x.cours ? { code: x.cours.code_cours, nom: x.cours.nom_cours } : null,
        salles: (x.salles ?? []).map((s) => s.salle?.nom_salle).filter(Boolean),
    }));
};

export const seancesDeLEtudiant = async (idUser, { du, au, aujourdhui }) => {
    const invalide = () => new ErreurMetier("Période invalide (du et au au format AAAA-MM-JJ)", 400);
    // Une chaîne seulement (?du=a&du=b donnerait un tableau), validée avant tout calcul
    const debut = du ?? aujourdhui;
    if (!dateValide(debut)) throw invalide();
    const fin = au ?? ajouterJours(debut, 14);
    if (!dateValide(fin) || fin < debut) throw invalide();
    if ((new Date(fin) - new Date(debut)) / 864e5 > JOURS_MAX) throw new ErreurMetier(`Période trop longue (${JOURS_MAX} jours au plus)`, 400);

    const appartenances = await Appartenir.findAll({ where: { id_user_etudiant: idUser }, include: [{ model: Groupe, as: "groupe" }] });
    const directs = appartenances.map((a) => a.groupe).filter(Boolean);
    if (!directs.length) return { du: debut, au: fin, groupes: [], seances: [], evenements: [], examens: [] };

    // Groupes de l'étudiant et leurs ancêtres (TP → TD → promotion), dans leurs filières
    const tous = await Groupe.findAll({ where: { id_filiere: [...new Set(directs.map((g) => g.id_filiere))] } });
    const parId = new Map(tous.map((g) => [g.id_groupe, g]));
    const ids = [...new Set(directs.flatMap((g) => [g.id_groupe, ...ancetres(g, parId).map((a) => a.id_groupe)]))];

    // Enseignements mutualisés qui réunissent l'un de ces groupes
    const mutualises = (await EnseignementGroupe.findAll({ where: { id_groupe: ids }, attributes: ["id_enseignement"] })).map((e) => e.id_enseignement);

    // Deux lectures dans les index (groupe + date, enseignement + date) plutôt qu'un OR, qui fait
    // parcourir à MySQL toutes les séances de l'école sur la période ; puis les séances par clé
    const plage = { date_seance: { [Op.between]: [debut, fin] } };
    const [parGroupe, parMutualisation] = await Promise.all([
        Affectation.findAll({ where: { ...plage, id_groupe: ids }, attributes: ["id_affectation"], raw: true }),
        mutualises.length ? Affectation.findAll({ where: { ...plage, id_enseignement: mutualises }, attributes: ["id_affectation"], raw: true }) : [],
    ]);
    const idsSeances = [...new Set([...parGroupe, ...parMutualisation].map((s) => s.id_affectation))];

    const seances = !idsSeances.length ? [] : await Affectation.findAll({
        where: { id_affectation: idsSeances },
        include: [
            { model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours", "type_cours", "id_filiere"] },
            { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe", "id_filiere"] },
            // Le nom de l'enseignant seulement (ni email ni téléphone)
            { model: Users, as: "enseignant", attributes: ["id_user", "nom", "prenom"] },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
            { model: Creneau, as: "creneauInitial", attributes: ["heure_debut", "heure_fin"], required: false },
            { model: Enseignement, as: "enseignement", attributes: ["id_enseignement"], include: [{ model: CoursComposante, as: "composante", attributes: ["type", "modalite", "mention"] }] },
        ],
        order: [
            ["date_seance", "ASC"],
            [{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"],
            // Séances simultanées (groupes différents) : ordre stable
            ["id_affectation", "ASC"],
        ],
    });
    await appliquerRamadan(seances);
    const [evenements, examens] = await Promise.all([evenementsDeLEtudiant(ids.map((id) => parId.get(id)).filter(Boolean), debut, fin), examensDeLEtudiant(ids, debut, fin)]);

    return {
        du: debut,
        au: fin,
        groupes: directs.map((g) => ({ id_groupe: g.id_groupe, nom_groupe: g.nom_groupe })),
        // Seulement les champs lus par le web et l'application (shared/session.js) : ni commentaire
        // interne, ni identifiants de génération, ni dates techniques (≈ 3 fois moins lourd)
        seances: seances.map((s) => {
            const json = s.toJSON();
            const { salle, cours, groupe, enseignant, creneau, creneauInitial } = json;
            const composante = json.enseignement?.composante;
            return {
                id_affectation: json.id_affectation,
                date_seance: json.date_seance,
                date_seance_initiale: json.date_seance_initiale ?? null,
                statut: json.statut,
                id_user_enseignant: json.id_user_enseignant,
                cours: cours ? { code_cours: cours.code_cours, nom_cours: cours.nom_cours, type_cours: cours.type_cours, id_filiere: cours.id_filiere } : null,
                groupe: groupe ? { nom_groupe: groupe.nom_groupe, id_filiere: groupe.id_filiere } : null,
                enseignant: enseignant ? { id_user: enseignant.id_user, nom: enseignant.nom, prenom: enseignant.prenom } : null,
                salle: salle ? { id_salle: salle.id_salle, nom_salle: salle.nom_salle, etage: salle.etage ?? null, type_salle: salle.type_salle, batiment: salle.batiment ?? null, campus: salle.campus ? { code: salle.campus.code, nom: salle.campus.nom } : null } : null,
                creneau: creneau ? { heure_debut: creneau.heure_debut, heure_fin: creneau.heure_fin } : null,
                creneauInitial: creneauInitial ? { heure_debut: creneauInitial.heure_debut, heure_fin: creneauInitial.heure_fin } : null,
                enseignement: composante ? { composante: { type: composante.type, modalite: composante.modalite, mention: composante.mention } } : null,
            };
        }),
        evenements,
        examens,
    };
};
