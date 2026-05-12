import { Op } from "sequelize";
import { Affectation } from "../../models/index.js";
import { AvailabilityMatrix } from "./AvailabilityMatrix.js";
import { DataLoader } from "./DataLoader.js";
import { DomainBuilder } from "./DomainBuilder.js";
import { GreedyScheduler } from "./GreedyScheduler.js";
import { LocalSearchOptimizer } from "./LocalSearchOptimizer.js";
import { RepairSolver } from "./RepairSolver.js";
import { ScoreCalculator } from "./ScoreCalculator.js";
import { SessionBuilder } from "./SessionBuilder.js";
import { SnapshotService } from "./SnapshotService.js";

export class GenerationEngine {
    constructor() {
        this.loader = new DataLoader();
        this.snapshots = new SnapshotService();
    }

    async generate(params) {
        const startedAt = Date.now();
        const session = await this.snapshots.createSession(params);

        try {
            const data = await this.loader.load(params);

            if (params.ecraserAffectations) {
                await this.deleteExistingAffectations(params, data);
            }

            data.affectationsExistantes = this.filterBlockingAffectations(data.affectationsExistantes, params, data);

            const slotsByDateAndCreneau = new Map(data.slots.map((slot) => [`${slot.date}:${slot.id_creneau}`, slot]));
            const teacherAvailability = this.buildTeacherAvailability(data, slotsByDateAndCreneau, params);
            const matrix = new AvailabilityMatrix({
                slots: data.slots,
                teacherAvailability,
                requireTeacherAvailability: params.requireTeacherAvailability !== false,
                options: {
                    maxHoursPerDayGroup: params.maxHoursPerDayGroup,
                    maxHoursPerDayCourse: params.maxHoursPerDayCourse,
                    allowSameCourseTwicePerDay: params.allowSameCourseTwicePerDay === true,
                },
            });

            matrix.seedExisting(data.affectationsExistantes, slotsByDateAndCreneau);

            const sessions = SessionBuilder.build(data, params);
            const domains = new DomainBuilder(data, params).build(sessions, matrix);
            const greedy = GreedyScheduler.run(sessions, domains, matrix);

            let repair = { solved: true, placed: [] };
            if (greedy.failed.length) {
                repair = RepairSolver.solve(greedy.failed, domains, matrix, params);
            }

            const assignments = LocalSearchOptimizer.optimize(
                [...greedy.placed, ...repair.placed],
                domains,
                matrix,
                params
            );
            const hardConflicts = this.detectHardConflicts(assignments);
            const score = ScoreCalculator.calculate(assignments, sessions, hardConflicts);
            const failedSessions = sessions.filter((sessionItem) => (
                !assignments.some((assignment) => assignment.session.id === sessionItem.id)
            ));
            const durationMs = Date.now() - startedAt;
            const { snapshot, created } = await this.snapshots.commitGeneration({
                session,
                assignments,
                score,
                conflicts: hardConflicts,
                failedSessions,
                durationMs,
                params,
            });

            return this.formatResult({
                snapshot,
                session,
                created,
                assignments,
                failedSessions,
                score,
                hardConflicts,
                durationMs,
            });
        } catch (error) {
            await this.snapshots.failSession(session, error);
            throw error;
        }
    }

    buildTeacherAvailability(data, slotsByDateAndCreneau, params) {
        const availability = new Map();

        if (params.requireTeacherAvailability === false) {
            for (const teacher of data.enseignants) {
                availability.set(teacher.id_user, (1n << BigInt(data.slots.length)) - 1n);
            }
            return availability;
        }

        for (const dispo of data.disponibilites) {
            if (!dispo.disponible) {
                continue;
            }

            for (const slot of data.slots) {
                if (
                    slot.id_creneau === dispo.id_creneau &&
                    slot.date >= dispo.date_debut &&
                    slot.date <= dispo.date_fin
                ) {
                    const mask = 1n << BigInt(data.slots.indexOf(slot));
                    const current = availability.get(dispo.id_user_enseignant) || 0n;
                    availability.set(dispo.id_user_enseignant, current | mask);
                }
            }
        }

        return availability;
    }

    filterBlockingAffectations(affectations, params, data) {
        const generatedScope = this.buildScope(params, data);

        return affectations.filter((affectation) => {
            if (!affectation.is_generated) {
                return true;
            }

            const inScope =
                generatedScope.courseIds.has(affectation.id_cours) &&
                generatedScope.groupIds.has(affectation.id_groupe);

            return !inScope;
        });
    }

    buildScope(params, data) {
        const courseIds = params.coursIds?.length
            ? params.coursIds
            : [...data.coursParGroupe.values()].flat().map((course) => course.id_cours);
        const groupIds = params.groupeIds?.length
            ? params.groupeIds
            : data.groupes.map((group) => group.id_groupe);

        return {
            courseIds: new Set(courseIds),
            groupIds: new Set(groupIds),
        };
    }

    detectHardConflicts(assignments) {
        const conflicts = [];
        const seen = {
            room: new Map(),
            teacher: new Map(),
            group: new Map(),
        };

        for (const assignment of assignments) {
            const slotKey = assignment.slot.id;
            const checks = [
                ["room", assignment.room.id_salle],
                ["teacher", assignment.teacher.id_user],
                ["group", assignment.session.group.id_groupe],
            ];

            for (const [type, id] of checks) {
                const key = `${id}:${slotKey}`;
                if (seen[type].has(key)) {
                    conflicts.push({ type, assignment: assignment.id, previous: seen[type].get(key) });
                }
                seen[type].set(key, assignment.id);
            }
        }

        return conflicts;
    }

    async deleteExistingAffectations(params, data) {
        const courseIds = params.coursIds?.length
            ? params.coursIds
            : [...data.coursParGroupe.values()].flat().map((course) => course.id_cours);
        const groupIds = params.groupeIds?.length
            ? params.groupeIds
            : data.groupes.map((group) => group.id_groupe);

        await Affectation.destroy({
            where: {
                id_cours: { [Op.in]: courseIds },
                id_groupe: { [Op.in]: groupIds },
                date_seance: { [Op.between]: [params.dateDebut, params.dateFin] },
                is_generated: false,
            },
        });
    }

    formatResult({ snapshot, session, created, assignments, failedSessions, score, hardConflicts, durationMs }) {
        return {
            session: {
                id: session.id_generation_session,
                status: session.status,
            },
            snapshot: {
                id: snapshot.id_snapshot,
                label: snapshot.label,
                is_active: snapshot.is_active,
            },
            affectationsCreees: created.map(({ affectation, assignment }) => ({
                id: affectation.id_affectation,
                cours: assignment.session.course.nom_cours,
                groupe: assignment.session.group.nom_groupe,
                enseignant: `${assignment.teacher.prenom} ${assignment.teacher.nom}`,
                salle: assignment.room.nom_salle,
                date: assignment.slot.date,
                creneau: `${assignment.slot.heure_debut}-${assignment.slot.heure_fin}`,
            })),
            affectationsEchouees: failedSessions.map((session) => ({
                cours: session.course.nom_cours,
                groupe: session.group.nom_groupe,
                date: "N/A",
                creneau: "N/A",
                raison: "Aucun placement faisable apres greedy et backtracking limite",
            })),
            statistiques: {
                totalSeancesPlanifiees: assignments.length,
                totalSeancesEchouees: failedSessions.length,
                conflitsDetectes: hardConflicts.length,
                scoreQualite: score.total,
                grade: score.grade,
                durationMs,
                scoreDetail: score.breakdown,
            },
            score,
            conflits: hardConflicts,
        };
    }
}
