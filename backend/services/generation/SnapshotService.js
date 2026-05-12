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
            id_institution: params.idInstitution,
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
                    ...(params.idInstitution && { id_institution: params.idInstitution }),
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
                id_institution: params.idInstitution,
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
                    id_institution: params.idInstitution,
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

    async activateSnapshot(snapshotId) {
        return sequelize.transaction(async (transaction) => {
            const snapshot = await PlanningSnapshot.findByPk(snapshotId, { transaction });

            if (!snapshot) {
                throw new Error("Snapshot introuvable");
            }

            const siblingSnapshots = await PlanningSnapshot.findAll({
                where: {
                    date_debut: snapshot.date_debut,
                    date_fin: snapshot.date_fin,
                },
                transaction,
            });

            const siblingIds = siblingSnapshots.map((item) => item.id_snapshot);

            await PlanningSnapshot.update(
                { is_active: false },
                { where: { id_snapshot: { [Op.in]: siblingIds } }, transaction }
            );

            await Affectation.update(
                { statut: "annule" },
                {
                    where: {
                        id_snapshot: { [Op.in]: siblingIds },
                        is_generated: true,
                    },
                    transaction,
                }
            );

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
