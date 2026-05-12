export class GreedyScheduler {
    static run(sessions, domains, matrix) {
        const orderedSessions = [...sessions].sort((a, b) => {
            const domainA = domains.get(a.id)?.length || 0;
            const domainB = domains.get(b.id)?.length || 0;
            if (domainA !== domainB) return domainA - domainB;
            return b.durationHours - a.durationHours;
        });

        const placed = [];
        const failed = [];

        for (const session of orderedSessions) {
            const candidates = domains.get(session.id) || [];
            const candidate = candidates.find((option) => matrix.canAssign(option));

            if (candidate) {
                matrix.assign(candidate);
                placed.push(candidate);
            } else {
                failed.push(session);
            }
        }

        return { placed, failed, complete: failed.length === 0 };
    }
}
