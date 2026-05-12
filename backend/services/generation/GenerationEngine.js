import sequelize from "../../config/db.js";
import { Op } from "sequelize";
import { Affectation } from "../../models/index.js";
import { AvailabilityMatrix } from "./AvailabilityMatrix.js";
import { DataLoader } from "./DataLoader.js";
import { DomainBuilder } from "./DomainBuilder.js";
import { GreedyScheduler } from "./GreedyScheduler.js";
import { RepairSolver } from "./RepairSolver.js";
import { ScoreCalculator } from "./ScoreCalculator.js";
import { SessionBuilder } from "./SessionBuilder.js";

export class GenerationEngine {
    constructor() {
        this.loader = new DataLoader();
    }

    async generate(params) {
        const startedAt = Date.now();
        const data = await this.loader.load(params);

        if (params.ecraserAffectations) {
            await this.deleteExistingAffectations(params, data);
            data.affectationsExistantes = data.affectationsExistantes.filter((affectation) => {
                const selectedCourse = !params.coursIds?.length || params.coursIds.includes(affectation.id_cours);
                const selectedGroup = !params.groupeIds?.length || params.groupeIds.includes(affectation.id_groupe);
                return !(selectedCourse && selectedGroup);
            });
        }

        const slotsByDateAndCreneau = new Map(data.slots.map((slot) => [`${slot.date}:${slot.id_creneau}`, slot]));
        const teacherAvailability = this.buildTeacherAvailability(data, slotsByDateAndCreneau, params);
        const matrix = new AvailabilityMatrix({
            slots: data.slots,
            teacherAvailability,
            requireTeacherAvailability: params.requireTeacherAvailability !== false,
        });

        matrix.seedExisting(data.affectationsExistantes, slotsByDateAndCreneau);

        const sessions = SessionBuilder.build(data, params);
        const domains = new DomainBuilder(data, params).build(sessions, matrix);
        const greedy = GreedyScheduler.run(sessions, domains, matrix);

        let repair = { solved: true, placed: [] };
        if (greedy.failed.length) {
            repair = RepairSolver.solve(greedy.failed, domains, matrix, params);
        }

        const assignments = [...greedy.placed, ...repair.placed];
        const hardConflicts = this.detectHardConflicts(assignments);
        const score = ScoreCalculator.calculate(assignments, sessions, hardConflicts);

        const created = await this.commitAssignments(assignments, params.idUserAdmin);

        const failedSessionIds = new Set(greedy.failed.map((session) => session.id));
        for (const assignment of repair.placed) {
            failedSessionIds.delete(assignment.session.id);
        }

        return this.formatResult({
            created,
            assignments,
            failedSessions: sessions.filter((session) => !assignments.some((assignment) => assignment.session.id === session.id)),
            score,
            hardConflicts,
            durationMs: Date.now() - startedAt,
        });
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
            },
        });
    }

    async commitAssignments(assignments, idUserAdmin) {
        return sequelize.transaction(async (transaction) => {
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
                    id_user_admin: idUserAdmin,
                }, { transaction });

                created.push({ affectation, assignment });
            }

            return created;
        });
    }

    formatResult({ created, assignments, failedSessions, score, hardConflicts, durationMs }) {
        return {
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
