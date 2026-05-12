export class DomainBuilder {
    constructor(data, options = {}) {
        this.data = data;
        this.options = options;
    }

    build(sessions, matrix) {
        const domains = new Map();

        for (const session of sessions) {
            const candidates = [];
            const rooms = this.compatibleRooms(session);

            for (const slot of this.data.slots) {
                if (!this.slotAllowed(session, slot)) {
                    continue;
                }

                for (const room of rooms) {
                    for (const teacher of this.data.enseignants) {
                        const candidate = {
                            id: `${session.id}:${slot.id}:${room.id_salle}:${teacher.id_user}`,
                            session,
                            slot,
                            room,
                            teacher,
                        };

                        if (matrix.canAssign(candidate)) {
                            candidate.score = this.scoreCandidate(candidate);
                            candidates.push(candidate);
                        }
                    }
                }
            }

            candidates.sort((a, b) => b.score - a.score);
            domains.set(session.id, candidates);
        }

        return domains;
    }

    compatibleRooms(session) {
        return this.data.salles.filter((room) => {
            if (!room.disponible || Number(room.capacite) < session.expectedCapacity) {
                return false;
            }

            const roomType = String(room.type_salle || room.nom_salle || "").toLowerCase();
            if (["cm", "cours magistral"].includes(session.typeCours)) {
                return roomType.includes("amphi") || roomType.includes("salle");
            }
            if (["tp", "travaux pratiques"].includes(session.typeCours)) {
                return roomType.includes("tp") || roomType.includes("info") || roomType.includes("labo");
            }
            return true;
        });
    }

    slotAllowed(session, slot) {
        if (slot.dureeHeures <= 0) {
            return false;
        }

        if (this.options.maxSessionHours && slot.dureeHeures > Number(this.options.maxSessionHours)) {
            return false;
        }

        return slot.dureeHeures <= session.durationHours + 0.01;
    }

    scoreCandidate(candidate) {
        const { session, slot, room } = candidate;
        let score = 100;

        const roomWaste = Math.max(0, Number(room.capacite) - session.expectedCapacity);
        score -= Math.min(25, roomWaste / 4);

        if (slot.debutMinutes < 8 * 60 || slot.debutMinutes >= 18 * 60) {
            score -= 10;
        }

        const roomType = String(room.type_salle || room.nom_salle || "").toLowerCase();
        if (["cm", "cours magistral"].includes(session.typeCours) && roomType.includes("amphi")) {
            score += 8;
        }
        if (["tp", "travaux pratiques"].includes(session.typeCours) && (roomType.includes("info") || roomType.includes("tp"))) {
            score += 8;
        }

        return score;
    }
}
