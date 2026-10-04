import { Op } from "sequelize";
import { Affectation, Appartenir, Cours, CoursComposante, Creneau, Enseignement, EnseignementGroupe, Groupe, Salle, Users } from "../../models/index.js";
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
    if (!directs.length) return { du: debut, au: fin, groupes: [], seances: [] };

    // Groupes de l'étudiant et leurs ancêtres (TP → TD → promotion), dans leurs filières
    const tous = await Groupe.findAll({ where: { id_filiere: [...new Set(directs.map((g) => g.id_filiere))] } });
    const parId = new Map(tous.map((g) => [g.id_groupe, g]));
    const ids = [...new Set(directs.flatMap((g) => [g.id_groupe, ...ancetres(g, parId).map((a) => a.id_groupe)]))];

    // Enseignements mutualisés qui réunissent l'un de ces groupes
    const mutualises = (await EnseignementGroupe.findAll({ where: { id_groupe: ids }, attributes: ["id_enseignement"] })).map((e) => e.id_enseignement);

    const seances = await Affectation.findAll({
        where: {
            date_seance: { [Op.between]: [debut, fin] },
            [Op.or]: [{ id_groupe: ids }, ...(mutualises.length ? [{ id_enseignement: mutualises }] : [])],
        },
        include: [
            { model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours", "type_cours", "id_filiere"] },
            { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe", "id_filiere"] },
            // Le nom de l'enseignant seulement (ni email ni téléphone)
            { model: Users, as: "enseignant", attributes: ["id_user", "nom", "prenom"] },
            { model: Salle, as: "salle" },
            { model: Creneau, as: "creneau" },
            { model: Enseignement, as: "enseignement", attributes: ["id_enseignement"], include: [{ model: CoursComposante, as: "composante", attributes: ["type", "modalite", "mention"] }] },
        ],
        order: [
            ["date_seance", "ASC"],
            [{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"],
        ],
    });
    await appliquerRamadan(seances);

    return {
        du: debut,
        au: fin,
        groupes: directs.map((g) => ({ id_groupe: g.id_groupe, nom_groupe: g.nom_groupe })),
        seances: seances.map((s) => {
            const json = s.toJSON();
            const { salle } = json;
            return {
                ...json,
                salle: salle ? { id_salle: salle.id_salle, nom_salle: salle.nom_salle, etage: salle.etage ?? null, type_salle: salle.type_salle, batiment: salle.batiment ?? null, campus: salle.campus ? { code: salle.campus.code, nom: salle.campus.nom } : null } : null,
            };
        }),
    };
};
