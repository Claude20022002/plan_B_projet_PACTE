import sequelize from "../../config/db.js";
import { Op } from "sequelize";
import {
    Affectation,
    Cours,
    Creneau,
    GenerationSession,
    Groupe,
    PlanningSnapshot,
    Salle,
    Users,
} from "../../models/index.js";

/**
 * Versions de planning (snapshots) : chaque génération Timefold en crée une ; on peut les lister,
 * les consulter et en réactiver une pour revenir en arrière.
 */
export class SnapshotService {
    /**
     * Réactive une version : ses séances générées reprennent (statut planifié) et celles des
     * autres versions de la même période pour les mêmes enseignements sont annulées. Une
     * génération ne couvrant que certaines filières ne touche jamais aux autres.
     */
    async activateSnapshot(snapshotId) {
        return sequelize.transaction(async (transaction) => {
            const snapshot = await PlanningSnapshot.findByPk(snapshotId, { transaction });

            if (!snapshot) {
                throw new Error("Snapshot introuvable");
            }

            const siennes = await Affectation.findAll({
                where: { id_snapshot: snapshot.id_snapshot, is_generated: true },
                attributes: ["id_enseignement"],
                transaction,
            });
            const enseignements = [...new Set(siennes.map((a) => a.id_enseignement).filter(Boolean))];

            const siblingSnapshots = await PlanningSnapshot.findAll({
                where: {
                    date_debut: snapshot.date_debut,
                    date_fin: snapshot.date_fin,
                    id_snapshot: { [Op.ne]: snapshot.id_snapshot },
                },
                transaction,
            });
            const siblingIds = siblingSnapshots.map((item) => item.id_snapshot);

            if (siblingIds.length) {
                await Affectation.update(
                    { statut: "annule" },
                    {
                        where: {
                            id_snapshot: { [Op.in]: siblingIds },
                            is_generated: true,
                            ...(enseignements.length ? { id_enseignement: enseignements } : {}),
                        },
                        transaction,
                    }
                );
                // Une version dont toutes les séances sont annulées n'est plus active
                for (const sibling of siblingSnapshots) {
                    const actives = await Affectation.count({ where: { id_snapshot: sibling.id_snapshot, statut: { [Op.ne]: "annule" } }, transaction });
                    if (!actives && sibling.is_active) await sibling.update({ is_active: false }, { transaction });
                }
            }

            await snapshot.update({ is_active: true }, { transaction });
            await Affectation.update(
                { statut: "planifie" },
                {
                    where: {
                        id_snapshot: snapshot.id_snapshot,
                        is_generated: true,
                    },
                    transaction,
                }
            );

            return snapshot;
        });
    }

    async listSnapshots(filters = {}) {
        const where = {};
        if (filters.date_debut && filters.date_fin) {
            where.date_debut = filters.date_debut;
            where.date_fin = filters.date_fin;
        }
        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active === "true" || filters.is_active === true;
        }

        return PlanningSnapshot.findAll({
            where,
            include: [
                {
                    model: GenerationSession,
                    as: "generation_session",
                },
                {
                    model: Users,
                    as: "admin_createur",
                    attributes: { exclude: ["password_hash"] },
                },
            ],
            order: [["createdAt", "DESC"]],
        });
    }

    async getSnapshotResult(snapshotId) {
        const snapshot = await PlanningSnapshot.findByPk(snapshotId, {
            include: [
                {
                    model: Affectation,
                    as: "affectations",
                    include: [
                        { model: Cours, as: "cours" },
                        { model: Groupe, as: "groupe" },
                        { model: Salle, as: "salle" },
                        { model: Creneau, as: "creneau" },
                        {
                            model: Users,
                            as: "enseignant",
                            attributes: { exclude: ["password_hash"] },
                        },
                    ],
                },
            ],
        });

        if (!snapshot) {
            throw new Error("Snapshot introuvable");
        }

        return snapshot;
    }
}
