import sequelize from "../../config/db.js";
import {
    AnneeUniversitaire,
    Affectation,
    Cours,
    CoursComposante,
    Enseignement,
    EnseignementGroupe,
    Groupe,
    Periode,
} from "../../models/index.js";
import { anneeDepuisNiveau, periodeDuSemestre } from "../../config/referentiel.js";
import { contientParentEtEnfant } from "./groupes.js";

/** « 2025/2026 », « 2025-2026 » → « 2025-2026 » (les deux écritures existent dans les données). */
const normaliserAnnee = (valeur) => String(valeur || "").replace("/", "-").trim();

export class ErreurMetier extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

/**
 * Crée, pour une période, les enseignements manquants à partir de la maquette :
 * chaque composante d'un module du semestre (impair en S1, pair en S2) est attribuée à
 * chaque groupe de l'année d'études et du type qu'elle vise (promotion, TD ou TP).
 * Ne touche jamais à un enseignement existant : la mutualisation faite à la main est conservée.
 */
export const genererEnseignements = async ({ id_periode, id_filiere = null }) => {
    const periode = await Periode.findByPk(id_periode, { include: [{ model: AnneeUniversitaire, as: "annee" }] });
    if (!periode) throw new ErreurMetier("Période introuvable", 404);
    const anneeScolaire = normaliserAnnee(periode.annee.libelle);

    const cours = await Cours.findAll({
        where: id_filiere ? { id_filiere } : {},
        include: [{ model: CoursComposante, as: "composantes" }],
    });
    const coursDeLaPeriode = cours.filter((c) => periodeDuSemestre(c.semestre) === periode.code);

    const groupes = (await Groupe.findAll({ where: id_filiere ? { id_filiere } : {} })).filter(
        (g) => normaliserAnnee(g.annee_scolaire) === anneeScolaire
    );

    // Groupes déjà couverts par un enseignement de chaque composante sur cette période
    const existants = await Enseignement.findAll({
        where: { id_periode },
        include: [{ model: Groupe, as: "groupes", attributes: ["id_groupe"], through: { attributes: [] } }],
    });
    const couverts = new Set(
        existants.flatMap((e) => e.groupes.map((g) => `${e.id_composante}|${g.id_groupe}`))
    );

    const rapport = { crees: 0, existants: 0, sans_groupe: [], annee_scolaire: anneeScolaire };
    await sequelize.transaction(async (transaction) => {
        for (const module of coursDeLaPeriode) {
            const annee = anneeDepuisNiveau(module.niveau);
            for (const composante of module.composantes) {
                const cibles = groupes.filter(
                    (g) =>
                        g.id_filiere === module.id_filiere &&
                        g.type_groupe === composante.niveau_groupe &&
                        (annee === null || (g.annee ?? anneeDepuisNiveau(g.niveau)) === annee)
                );
                if (cibles.length === 0) {
                    rapport.sans_groupe.push({
                        id_cours: module.id_cours,
                        code_cours: module.code_cours,
                        nom_cours: module.nom_cours,
                        type: composante.type,
                        niveau_groupe: composante.niveau_groupe,
                    });
                    continue;
                }
                for (const groupe of cibles) {
                    if (couverts.has(`${composante.id_composante}|${groupe.id_groupe}`)) {
                        rapport.existants += 1;
                        continue;
                    }
                    const enseignement = await Enseignement.create(
                        { id_composante: composante.id_composante, id_periode, heures_prevues: composante.volume_heures },
                        { transaction }
                    );
                    await EnseignementGroupe.create(
                        { id_enseignement: enseignement.id_enseignement, id_groupe: groupe.id_groupe },
                        { transaction }
                    );
                    couverts.add(`${composante.id_composante}|${groupe.id_groupe}`);
                    rapport.crees += 1;
                }
            }
        }
    });
    return rapport;
};

const chargerAvecGroupes = (ids, transaction) =>
    Enseignement.findAll({
        where: { id_enseignement: ids },
        include: [
            { model: Groupe, as: "groupes", through: { attributes: [] } },
            { model: CoursComposante, as: "composante" },
        ],
        order: [["id_enseignement", "ASC"]],
        transaction,
    });

/**
 * Mutualise plusieurs enseignements en un seul (ex. l'anglais du tronc commun pour trois
 * promotions) : mêmes période et type de composante, groupes réunis sur le premier,
 * séances déjà planifiées rattachées à lui, volume = le plus grand des volumes.
 */
export const fusionnerEnseignements = async (ids) => {
    const uniques = [...new Set(ids.map(Number))];
    if (uniques.length < 2) throw new ErreurMetier("Sélectionnez au moins deux enseignements à mutualiser");

    return sequelize.transaction(async (transaction) => {
        const enseignements = await chargerAvecGroupes(uniques, transaction);
        if (enseignements.length !== uniques.length) throw new ErreurMetier("Enseignement introuvable", 404);
        if (new Set(enseignements.map((e) => e.id_periode ?? "aucune")).size > 1) {
            throw new ErreurMetier("Les enseignements à mutualiser doivent être sur la même période");
        }
        if (new Set(enseignements.map((e) => e.composante.type)).size > 1) {
            throw new ErreurMetier("Seules des composantes du même type (CM, TD, TP…) peuvent être mutualisées");
        }

        const groupes = [...new Map(enseignements.flatMap((e) => e.groupes).map((g) => [g.id_groupe, g])).values()];
        const tousLesGroupes = await Groupe.findAll({
            where: { id_filiere: [...new Set(groupes.map((g) => g.id_filiere))] },
            transaction,
        });
        if (contientParentEtEnfant(groupes, tousLesGroupes)) {
            throw new ErreurMetier("Un groupe et l'un de ses sous-groupes ne peuvent pas suivre le même enseignement");
        }

        const [cible, ...autres] = enseignements;
        const idsAutres = autres.map((e) => e.id_enseignement);
        for (const groupe of groupes) {
            await EnseignementGroupe.findOrCreate({
                where: { id_enseignement: cible.id_enseignement, id_groupe: groupe.id_groupe },
                transaction,
            });
        }
        await Affectation.update({ id_enseignement: cible.id_enseignement }, { where: { id_enseignement: idsAutres }, transaction });
        await cible.update({ heures_prevues: Math.max(...enseignements.map((e) => e.heures_prevues)) }, { transaction });
        await Enseignement.destroy({ where: { id_enseignement: idsAutres }, transaction });
        return cible.id_enseignement;
    });
};

/**
 * Défait une mutualisation : un enseignement par groupe, chacun gardant le volume prévu.
 * Les séances déjà planifiées suivent leur groupe.
 */
export const scinderEnseignement = async (id) =>
    sequelize.transaction(async (transaction) => {
        const [enseignement] = await chargerAvecGroupes([id], transaction);
        if (!enseignement) throw new ErreurMetier("Enseignement introuvable", 404);
        if (enseignement.groupes.length < 2) throw new ErreurMetier("Cet enseignement ne concerne qu'un groupe");

        const [garde, ...detaches] = [...enseignement.groupes].sort((a, b) => a.id_groupe - b.id_groupe);
        const crees = [enseignement.id_enseignement];
        for (const groupe of detaches) {
            const nouveau = await Enseignement.create(
                {
                    id_composante: enseignement.id_composante,
                    id_periode: enseignement.id_periode,
                    libelle: enseignement.libelle,
                    heures_prevues: enseignement.heures_prevues,
                },
                { transaction }
            );
            await EnseignementGroupe.destroy({
                where: { id_enseignement: enseignement.id_enseignement, id_groupe: groupe.id_groupe },
                transaction,
            });
            await EnseignementGroupe.create({ id_enseignement: nouveau.id_enseignement, id_groupe: groupe.id_groupe }, { transaction });
            await Affectation.update(
                { id_enseignement: nouveau.id_enseignement },
                { where: { id_enseignement: enseignement.id_enseignement, id_groupe: groupe.id_groupe }, transaction }
            );
            crees.push(nouveau.id_enseignement);
        }
        void garde;
        return crees;
    });

/** Effectif total d'un enseignement (somme de ses groupes) : sert au contrôle de capacité. */
export const effectifEnseignement = (enseignement) =>
    (enseignement.groupes || []).reduce((total, g) => total + (Number(g.effectif) || 0), 0);
