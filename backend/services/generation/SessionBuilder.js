export class SessionBuilder {
    static build(data, options = {}) {
        const maxSessionHours = Number(options.maxSessionHours || 4);
        const preferredSessionHours = this.resolvePreferredSessionHours(data.slots, maxSessionHours);
        const sessions = [];

        for (const groupe of data.groupes) {
            const cours = data.coursParGroupe.get(groupe.id_groupe) || [];

            for (const course of cours) {
                let remaining = Number(course.volume_horaire) || 0;
                let index = 1;

                while (remaining > 0) {
                    const durationHours = Math.min(preferredSessionHours, remaining);
                    sessions.push({
                        id: `${course.id_cours}:${groupe.id_groupe}:${index}`,
                        index,
                        course,
                        group: groupe,
                        durationHours,
                        expectedCapacity: Number(groupe.effectif) || 0,
                        typeCours: String(course.type_cours || "").toLowerCase(),
                    });
                    remaining -= durationHours;
                    index += 1;
                }
            }
        }

        return sessions;
    }

    static resolvePreferredSessionHours(slots, maxSessionHours) {
        const frequencies = new Map();

        for (const slot of slots) {
            if (slot.dureeHeures <= 0 || slot.dureeHeures > maxSessionHours) {
                continue;
            }
            const key = slot.dureeHeures.toFixed(2);
            frequencies.set(key, (frequencies.get(key) || 0) + 1);
        }

        const [duration] = [...frequencies.entries()]
            .sort((a, b) => b[1] - a[1])[0] || [String(maxSessionHours)];

        return Number(duration);
    }
}
