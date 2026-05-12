export class LocalSearchOptimizer {
    static optimize(assignments, domains, matrix, options = {}) {
        if (options.optimize === false) {
            return assignments;
        }

        const optimized = [...assignments];

        for (let index = 0; index < optimized.length; index += 1) {
            const current = optimized[index];
            const alternatives = (domains.get(current.session.id) || [])
                .filter((candidate) => (
                    candidate.slot.id === current.slot.id &&
                    candidate.teacher.id_user === current.teacher.id_user &&
                    candidate.room.id_salle !== current.room.id_salle &&
                    candidate.score > current.score
                ));

            matrix.unassign(current);

            const better = alternatives.find((candidate) => matrix.canAssign(candidate));
            if (better) {
                matrix.assign(better);
                optimized[index] = better;
            } else {
                matrix.assign(current);
            }
        }

        return optimized;
    }
}
