export class ScoreCalculator {
    static calculate(assignments, sessions, hardConflicts = []) {
        if (hardConflicts.length) {
            return {
                total: 0,
                grade: "INVALID",
                breakdown: {
                    hardConflicts: hardConflicts.length,
                    coveragePct: 0,
                },
            };
        }

        const placedSessionIds = new Set(assignments.map((assignment) => assignment.session.id));
        const coveragePct = sessions.length
            ? Math.round((placedSessionIds.size / sessions.length) * 100)
            : 100;

        const roomScore = this.roomUtilizationScore(assignments);
        const distributionScore = this.distributionScore(assignments);
        const gapScore = this.groupGapScore(assignments);
        const latePenalty = this.latePenalty(assignments);

        const total = Math.max(0, Math.min(100, Math.round(
            coveragePct * 0.45 +
            roomScore * 0.20 +
            distributionScore * 0.15 +
            gapScore * 0.15 -
            latePenalty * 0.05
        )));

        return {
            total,
            grade: total >= 90 ? "A" : total >= 75 ? "B" : total >= 60 ? "C" : "D",
            breakdown: {
                coveragePct,
                roomUtilization: roomScore,
                distribution: distributionScore,
                groupGaps: gapScore,
                latePenalty,
            },
        };
    }

    static roomUtilizationScore(assignments) {
        if (!assignments.length) return 100;
        const ratios = assignments.map((assignment) => {
            const capacity = Number(assignment.room.capacite) || 1;
            const expected = Number(assignment.session.expectedCapacity) || 0;
            return expected / capacity;
        });

        const score = ratios.reduce((sum, ratio) => {
            if (ratio >= 0.6 && ratio <= 0.9) return sum + 100;
            return sum + Math.max(0, 100 - Math.abs(0.75 - ratio) * 100);
        }, 0);

        return Math.round(score / ratios.length);
    }

    static distributionScore(assignments) {
        const perGroup = new Map();
        for (const assignment of assignments) {
            const groupId = assignment.session.group.id_groupe;
            const day = assignment.slot.date;
            if (!perGroup.has(groupId)) perGroup.set(groupId, new Map());
            const groupMap = perGroup.get(groupId);
            groupMap.set(day, (groupMap.get(day) || 0) + assignment.slot.dureeHeures);
        }

        if (!perGroup.size) return 100;

        let total = 0;
        for (const groupMap of perGroup.values()) {
            const values = [...groupMap.values()];
            const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
            const variance = values.reduce((sum, value) => sum + Math.abs(value - avg), 0) / values.length;
            total += Math.max(0, 100 - variance * 15);
        }

        return Math.round(total / perGroup.size);
    }

    static groupGapScore(assignments) {
        const byGroupDay = new Map();
        for (const assignment of assignments) {
            const key = `${assignment.session.group.id_groupe}:${assignment.slot.date}`;
            if (!byGroupDay.has(key)) byGroupDay.set(key, []);
            byGroupDay.get(key).push(assignment.slot);
        }

        if (!byGroupDay.size) return 100;

        let gapHours = 0;
        for (const slots of byGroupDay.values()) {
            slots.sort((a, b) => a.debutMinutes - b.debutMinutes);
            for (let index = 1; index < slots.length; index += 1) {
                const gap = Math.max(0, slots[index].debutMinutes - slots[index - 1].finMinutes) / 60;
                gapHours += gap;
            }
        }

        return Math.max(0, Math.round(100 - gapHours * 5));
    }

    static latePenalty(assignments) {
        return assignments.filter((assignment) => assignment.slot.finMinutes > 18 * 60).length;
    }
}
