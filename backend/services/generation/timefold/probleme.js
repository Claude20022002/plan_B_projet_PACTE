import { Op } from "sequelize";
import {
    Affectation,
    Users,
    AnneeUniversitaire,
    Cours,
    CoursComposante,
    Creneau,
    Disponibilite,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    Filiere,
    Groupe,
    Periode,
    Salle,
    TrajetCampus,
} from "../../../models/index.js";
import { ErreurMetier } from "../../planning/enseignements.js";
import { STATUTS_ACTIFS } from "../../planning/affectationRules.js";
import { groupesLies, ligneesDe } from "../../planning/groupes.js";
import { lireParametres } from "../../planning/referentiel.js";

/**
 * Construit le problème de la semaine type envoyé au solveur Timefold (phase E).
 * Chaque enseignement de la période donne une ou plusieurs leçons (séances par semaine) dont
 * l'enseignant et les groupes sont connus ; le solveur choisit seulement créneau et salle.
 * Les occupations déjà en place (séances saisies à la main, autres filières) sont envoyées
 * épinglées : le solveur les contourne sans les déplacer.
 */

const JOURS = { lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7 };
const APRES_MIDI = 12 * 60 + 30;
const minutes = (h) => {
    const [a, b] = String(h).split(":").map(Number);
    return a * 60 + (b || 0);
};
const demi = (c) => (minutes(c.heure_debut) < APRES_MIDI ? "matin" : "apres_midi");

/** Créneaux d'une grille avec leur créneau suivant dans la même demi-journée. */
const construireCreneaux = (creneaux) =>
    creneaux.map((c) => {
        const suivant = creneaux.find(
            (x) => x.jour_semaine === c.jour_semaine && x.regime === c.regime && x.rang === c.rang + 1 && demi(x) === demi(c) && minutes(x.heure_debut) - minutes(c.heure_fin) <= 30
        );
        return {
            id: c.id_creneau,
            jour: JOURS[c.jour_semaine],
            debut: minutes(c.heure_debut),
            fin: minutes(c.heure_fin),
            rang: c.rang,
            regime: c.regime,
            suivantId: suivant?.id_creneau ?? null,
            finAvecSuivant: suivant ? minutes(suivant.heure_fin) : null,
        };
    });

/**
 * @param {object} options id_periode, id_filieres (toutes si vide), dureeSecondes
 * @returns {{ probleme, index, exclus, periode }}
 */
export const construireProbleme = async ({ id_periode, id_filieres = [], dureeSecondes = 60 }) => {
    const periode = await Periode.findByPk(id_periode, { include: [{ model: AnneeUniversitaire, as: "annee" }] });
    if (!periode) throw new ErreurMetier("Période introuvable", 404);

    const enseignements = await Enseignement.findAll({
        where: { id_periode },
        include: [
            {
                model: CoursComposante,
                as: "composante",
                required: true,
                include: [{ model: Cours, as: "cours", required: true, where: id_filieres.length ? { id_filiere: id_filieres } : {}, include: [{ model: Filiere, as: "filiere" }] }],
            },
            { model: Groupe, as: "groupes", through: { attributes: [] } },
            { model: EnseignementEnseignant, as: "services", where: { statut_service: { [Op.ne]: "refuse" } }, required: false },
        ],
        order: [["id_enseignement", "ASC"]],
    });

    // Séances déjà posées à la main sur la période : l'enseignement est laissé tel quel
    const manuelles = await Affectation.findAll({
        where: { id_enseignement: enseignements.map((e) => e.id_enseignement), statut: STATUTS_ACTIFS, is_generated: false, date_seance: { [Op.between]: [periode.date_debut, periode.date_fin] } },
        attributes: ["id_enseignement"],
    });
    const dejaPlanifies = new Set(manuelles.map((m) => m.id_enseignement));

    const exclus = [];
    const lecons = [];
    const index = {};
    const enseignantsUtilises = new Set();
    const groupesUtilises = new Set();
    const regimes = new Set();

    for (const e of enseignements) {
        const composante = e.composante;
        const cours = composante.cours;
        const principal = e.services.find((s) => s.role === "principal" && s.statut_service === "accepte");
        if (dejaPlanifies.has(e.id_enseignement)) {
            exclus.push({ id_enseignement: e.id_enseignement, module: cours.nom_cours, type: composante.type, raison: "deja_planifie" });
            continue;
        }
        if (!principal) {
            exclus.push({ id_enseignement: e.id_enseignement, module: cours.nom_cours, type: composante.type, raison: "sans_enseignant" });
            continue;
        }
        if (!e.groupes.length) {
            exclus.push({ id_enseignement: e.id_enseignement, module: cours.nom_cours, type: composante.type, raison: "sans_groupe" });
            continue;
        }
        const enseignants = [...new Set([principal.id_user, ...e.services.filter((s) => s.role === "co_enseignant" && s.statut_service === "accepte").map((s) => s.id_user)])];
        const directs = e.groupes.map((g) => g.id_groupe);
        const occupes = [...new Set((await Promise.all(directs.map((id) => groupesLies(id)))).flat())];
        // Groupes les plus fins concernés : la journée vue par les étudiants (heures, trous, campus)
        const feuilles = [...new Set((await Promise.all(directs.map((id) => ligneesDe(id)))).flat().map((l) => l.feuille))];
        const regime = cours.filiere?.regime ?? "initiale";
        regimes.add(regime);
        const nombre = Math.max(1, Math.min(6, composante.seances_par_semaine || 1));
        for (let n = 1; n <= nombre; n += 1) {
            const id = `e${e.id_enseignement}-${n}`;
            lecons.push({
                id,
                enseignementId: e.id_enseignement,
                coursId: cours.id_cours,
                type: composante.type,
                regime,
                longueur: Math.max(1, Math.min(2, composante.creneaux_par_seance || 2)),
                enseignants,
                groupes: occupes,
                groupesDirects: directs,
                feuilles,
                effectif: e.groupes.reduce((t, g) => t + (g.effectif || 0), 0),
                typeSalleRequis: composante.type_salle_requis || null,
                equipementsRequis: composante.equipements_requis || [],
                distanciel: composante.modalite === "distanciel",
                campusPrefere: cours.filiere?.id_campus_prefere ?? null,
                epinglee: false,
            });
            index[id] = { id_enseignement: e.id_enseignement, id_cours: cours.id_cours, id_groupe: directs[0], id_user_enseignant: principal.id_user, heures_prevues: e.heures_prevues, semaine_debut: composante.semaine_debut, semaine_fin: composante.semaine_fin, seances_par_semaine: nombre, longueur: Math.max(1, Math.min(2, composante.creneaux_par_seance || 2)), module: cours.nom_cours, type: composante.type, distanciel: composante.modalite === "distanciel" };
            enseignants.forEach((x) => enseignantsUtilises.add(x));
            directs.forEach((x) => groupesUtilises.add(x));
        }
    }

    // Grille : créneaux « normaux » des régimes concernés (la variante Ramadan s'applique au déploiement)
    const creneauxBase = await Creneau.findAll({ where: { regime: [...regimes], variante: "normale", rang: { [Op.ne]: null } }, order: [["jour_semaine", "ASC"], ["rang", "ASC"]] });
    const creneaux = construireCreneaux(creneauxBase);

    const salles = (await Salle.findAll({ where: { disponible: true } })).map((s) => ({
        id: s.id_salle,
        nom: s.nom_salle,
        capacite: s.capacite,
        type: s.type_salle,
        equipements: s.equipements || [],
        campusId: s.id_campus,
    }));

    // Occupations hors génération (séances manuelles, autres filières) : leçons épinglées, une par motif hebdomadaire
    const autres = await Affectation.findAll({
        where: {
            statut: STATUTS_ACTIFS,
            date_seance: { [Op.between]: [periode.date_debut, periode.date_fin] },
            [Op.or]: [{ is_generated: false }, { id_enseignement: null }, { id_enseignement: { [Op.notIn]: lecons.length ? lecons.map((l) => l.enseignementId) : [0] } }],
        },
        include: [{ model: Creneau, as: "creneau" }],
    });
    const motifs = new Map();
    // Seuls les créneaux de la grille envoyée comptent (une autre grille ne peut pas chevaucher la semaine type)
    const idsCreneaux = new Set(creneaux.map((c) => c.id));
    const cleDe = (a) => `${a.id_creneau}|${a.id_salle}|${a.id_user_enseignant}|${a.id_groupe}`;
    // Une séance ponctuelle n'immobilise pas la semaine type : le déploiement saute simplement sa date.
    // Seuls les motifs qui reviennent (au moins deux dates) sont épinglés.
    const dates = new Map();
    for (const a of autres) dates.set(cleDe(a), (dates.get(cleDe(a)) ?? new Set()).add(a.date_seance));
    for (const a of autres.filter((x) => x.creneau && idsCreneaux.has(x.id_creneau) && dates.get(cleDe(x)).size >= 2)) {
        const cle = cleDe(a);
        if (motifs.has(cle)) continue;
        const occupes = await groupesLies(a.id_groupe);
        motifs.set(cle, {
            id: `occ-${a.id_affectation}`,
            enseignementId: a.id_enseignement ?? -a.id_affectation,
            coursId: a.id_cours,
            type: "occupation",
            regime: a.creneau.regime,
            longueur: 1,
            enseignants: [a.id_user_enseignant],
            groupes: occupes,
            groupesDirects: [a.id_groupe],
            feuilles: (await ligneesDe(a.id_groupe)).map((l) => l.feuille),
            effectif: 0,
            distanciel: !a.id_salle,
            epinglee: true,
            creneau: { id: a.id_creneau },
            salle: a.id_salle ? { id: a.id_salle } : null,
        });
    }

    // Disponibilités : vacataires en opt-in, indisponibilités couvrant toute la période, vœux
    const enseignantsInfos = await Enseignant.findAll({
        where: { id_user: [...enseignantsUtilises] },
        attributes: ["id_user", "statut"],
        include: [{ model: Users, as: "user", attributes: ["nom", "prenom"] }],
    });
    const declarations = await Disponibilite.findAll({
        where: { id_user_enseignant: [...enseignantsUtilises], date_debut: { [Op.lte]: periode.date_fin }, date_fin: { [Op.gte]: periode.date_debut } },
    });
    const voeux = [];
    for (const e of enseignantsInfos) {
        const siennes = declarations.filter((d) => d.id_user_enseignant === e.id_user);
        const disponibles = new Set(siennes.filter((d) => d.disponible).map((d) => d.id_creneau));
        for (const c of creneaux) {
            // Une indisponibilité ponctuelle ne bloque pas la semaine type : le déploiement saute la date
            const bloquante = siennes.some((d) => !d.disponible && d.id_creneau === c.id && d.date_debut <= periode.date_debut && d.date_fin >= periode.date_fin);
            if (bloquante || (e.statut === "vacataire" && !disponibles.has(c.id))) {
                voeux.push({ enseignantId: e.id_user, creneauId: c.id, type: "INDISPONIBLE" });
                continue;
            }
            const preference = siennes.find((d) => d.disponible && d.id_creneau === c.id && d.preference !== "neutre")?.preference;
            if (preference) voeux.push({ enseignantId: e.id_user, creneauId: c.id, type: preference === "eviter" ? "EVITER" : "PREFERE" });
        }
    }

    // Disponibilités insuffisantes : plus de séances à donner que de créneaux libres dans la semaine.
    // Aucun calcul ne peut le résoudre ; c'est signalé avant tout, pour relancer l'enseignant.
    const avertissements = [];
    for (const e of enseignantsInfos) {
        const bloques = new Set(voeux.filter((v) => v.enseignantId === e.id_user && v.type === "INDISPONIBLE").map((v) => v.creneauId));
        if (!bloques.size) continue;
        const siennes = lecons.filter((l) => l.enseignants.includes(e.id_user));
        const libres = (longueur) => creneaux.filter((c) => !bloques.has(c.id) && (longueur === 1 || (c.suivantId && !bloques.has(c.suivantId)))).length;
        const besoin = siennes.length;
        const possibles = libres(Math.max(...siennes.map((l) => l.longueur)));
        if (besoin > possibles) {
            avertissements.push({
                type: "disponibilites_insuffisantes",
                id_user: e.id_user,
                enseignant: `${e.user?.prenom ?? ""} ${e.user?.nom ?? ""}`.trim(),
                statut: e.statut,
                seances: besoin,
                creneaux_libres: possibles,
            });
        }
    }

    const parametres = await lireParametres();
    const trajets = Object.fromEntries((await TrajetCampus.findAll()).map((t) => [`${Math.min(t.id_campus_a, t.id_campus_b)}-${Math.max(t.id_campus_a, t.id_campus_b)}`, t.minutes]));

    return {
        periode,
        index,
        exclus,
        avertissements,
        probleme: {
            dureeSecondes,
            creneaux,
            salles,
            voeux,
            ressources: [
                ...[...groupesUtilises].map((id) => ({ nature: "GROUPE", id })),
                ...[...enseignantsUtilises].map((id) => ({ nature: "ENSEIGNANT", id })),
            ],
            parametres: {
                maxMinutesJourGroupe: parametres.max_heures_jour_groupe.valeur * 60,
                maxMinutesJourEnseignant: parametres.max_heures_jour_enseignant.valeur * 60,
                samediApresMidi: Boolean(parametres.samedi_apres_midi_initiale.valeur),
                trajetDefautMinutes: parametres.trajet_inter_campus_defaut_minutes.valeur,
                trajets,
            },
            lecons: [...lecons, ...motifs.values()],
        },
    };
};
