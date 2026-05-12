export class RepairSolver {
    static solve(failedSessions, domains, matrix, options = {}) {
        const startedAt = Date.now();
        const maxDepth = Number(options.maxDepth || 200);
        const timeoutMs = Number(options.timeoutMs || 30000);
        const placed = [];

        const search = (remaining, depth) => {
            if (!remaining.length) {
                return true;
            }
            if (depth > maxDepth || Date.now() - startedAt > timeoutMs) {
                return false;
            }

            const ordered = [...remaining].sort((a, b) => {
                return this.countFeasible(a, domains, matrix) - this.countFeasible(b, domains, matrix);
            });
            const session = ordered[0];
            const rest = ordered.slice(1);
            const candidates = (domains.get(session.id) || [])
                .filter((candidate) => matrix.canAssign(candidate))
                .sort((a, b) => this.forwardScore(b, rest, domains, matrix) - this.forwardScore(a, rest, domains, matrix));

            for (const candidate of candidates) {
                matrix.assign(candidate);
                placed.push(candidate);

                if (rest.every((next) => this.countFeasible(next, domains, matrix) > 0) && search(rest, depth + 1)) {
                    return true;
                }

                placed.pop();
                matrix.unassign(candidate);
            }

            return false;
        };

        const solved = search(failedSessions, 0);
        return { solved, placed };
    }

    static countFeasible(session, domains, matrix) {
        return (domains.get(session.id) || []).reduce((count, candidate) => (
            matrix.canAssign(candidate) ? count + 1 : count
        ), 0);
    }

    static forwardScore(candidate, remaining, domains, matrix) {
        matrix.assign(candidate);
        const score = remaining.reduce((sum, session) => sum + this.countFeasible(session, domains, matrix), 0);
        matrix.unassign(candidate);
        return score;
    }
}
