import { Op } from "sequelize";
import {
    Affectation,
    Cours,
    Creneau,
    Disponibilite,
    Evenement,
    Filiere,
    Groupe,
    Salle,
    Users,
} from "../../models/index.js";
import { buildChronologicalSlots } from "./timeUtils.js";

export class DataLoader {
    async load(params) {
        const {
            dateDebut,
            dateFin,
            coursIds = [],
            groupeIds = [],
        } = params;

        const groupes = await Groupe.findAll({
            where: groupeIds.length ? { id_groupe: { [Op.in]: groupeIds } } : {},
            include: [{ model: Filiere, as: "filiere" }],
        });

        if (!groupes.length) {
            throw new Error("Aucun groupe trouve a planifier");
        }

        const coursParGroupe = new Map();
        for (const groupe of groupes) {
            const where = {
                id_filiere: groupe.id_filiere,
                niveau: groupe.niveau,
            };

            if (coursIds.length) {
                where.id_cours = { [Op.in]: coursIds };
            }

            const cours = await Cours.findAll({ where });
            coursParGroupe.set(groupe.id_groupe, cours);
        }

        const totalCours = [...coursParGroupe.values()].reduce((sum, cours) => sum + cours.length, 0);
        if (!totalCours) {
            throw new Error("Aucun cours trouve pour les groupes selectionnes");
        }

        const [creneaux, salles, enseignants] = await Promise.all([
            Creneau.findAll({ order: [["jour_semaine", "ASC"], ["heure_debut", "ASC"]] }),
            Salle.findAll({ where: { disponible: true }, order: [["capacite", "ASC"]] }),
            Users.findAll({ where: { role: "enseignant", actif: true } }),
        ]);

        if (!creneaux.length) throw new Error("Aucun creneau trouve");
        if (!salles.length) throw new Error("Aucune salle disponible");
        if (!enseignants.length) throw new Error("Aucun enseignant disponible");

        const disponibilites = await Disponibilite.findAll({
            where: {
                id_user_enseignant: { [Op.in]: enseignants.map((teacher) => teacher.id_user) },
                date_debut: { [Op.lte]: dateFin },
                date_fin: { [Op.gte]: dateDebut },
            },
        });

        let evenements = [];
        try {
            evenements = await Evenement.findAll({
                where: {
                    date_debut: { [Op.lte]: dateFin },
                    date_fin: { [Op.gte]: dateDebut },
                },
            });
        } catch (error) {
            evenements = [];
        }

        const slots = buildChronologicalSlots(creneaux, dateDebut, dateFin, evenements);
        const affectationsExistantes = await Affectation.findAll({
            where: {
                date_seance: { [Op.between]: [dateDebut, dateFin] },
                statut: { [Op.ne]: "annule" },
            },
        });

        return {
            groupes,
            coursParGroupe,
            creneaux,
            salles,
            enseignants,
            disponibilites,
            evenements,
            slots,
            affectationsExistantes,
        };
    }
}
