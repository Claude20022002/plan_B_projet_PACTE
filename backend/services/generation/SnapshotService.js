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

export class SnapshotService {
    async createSession(params) {
        return GenerationSession.create({
            label: params.label || `Generation ${params.dateDebut} - ${params.dateFin}`,
            date_debut: params.dateDebut,
            date_fin: params.dateFin,
            status: "running",
            progress: 5,
            last_message: "Generation demarree",
            config: params,
            id_user_admin: params.idUserAdmin,
        });
    }

    async failSession(session, error) {
        if (!session) return;
        await session.update({
            status: "failed",
            progress: 100,
            last_message: error.message,
        });
    }

    async commitGeneration({ session, assignments, score, conflicts, failedSessions, durationMs, params }) {
        return sequelize.transaction(async (transaction) => {
            const previousSnapshots = await PlanningSnapshot.findAll({
                where: {
                    date_debut: params.dateDebut,
                    date_fin: params.dateFin,
                    is_active: true,
                },
                transaction,
            });

            const previousSnapshotIds = previousSnapshots.map((snapshot) => snapshot.id_snapshot);

            if (previousSnapshotIds.length) {
                await PlanningSnapshot.update(
                    { is_active: false },
                    {
                        where: { id_snapshot: { [Op.in]: previousSnapshotIds } },
                        transaction,
                    }
                );

                await Affectation.update(
                    { statut: "annule" },
                    {
                        where: {
                            id_snapshot: { [Op.in]: previousSnapshotIds },
                            is_generated: true,
                        },
                        transaction,
                    }
                );
            }

            const snapshot = await PlanningSnapshot.create({
                label: params.label || `Auto ${new Date().toISOString().slice(0, 19).replace("T", " ")}`,
                date_debut: params.dateDebut,
                date_fin: params.dateFin,
                is_active: true,
                score_total: score.total,
                score_detail: score.breakdown,
                nb_affectations: assignments.length,
                nb_conflits: conflicts.length,
                id_generation_session: session.id_generation_session,
                id_user_admin: params.idUserAdmin,
            }, { transaction });

            const created = [];
            for (const assignment of assignments) {
                const affectation = await Affectation.create({
                    date_seance: assignment.slot.date,
                    statut: "planifie",
                    id_cours: assignment.session.course.id_cours,
                    id_groupe: assignment.session.group.id_groupe,
                    id_user_enseignant: assignment.teacher.id_user,
                    id_salle: assignment.room.id_salle,
                    id_creneau: assignment.slot.id_creneau,
                    id_user_admin: params.idUserAdmin,
                    id_snapshot: snapshot.id_snapshot,
                    id_generation_session: session.id_generation_session,
                    is_generated: true,
                    score_contrib: assignment.score || null,
                }, { transaction });

                created.push({ affectation, assignment });
            }

            await session.update({
                status: "completed",
                progress: 100,
                last_message: "Generation terminee",
                score_total: score.total,
                score_detail: score.breakdown,
                nb_assignees: assignments.length,
                nb_conflits: conflicts.length,
                nb_non_placees: failedSessions.length,
                duration_ms: durationMs,
            }, { transaction });

            return { snapshot, created };
        });
    }

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
