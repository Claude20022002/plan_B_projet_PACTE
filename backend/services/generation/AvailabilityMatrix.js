export class AvailabilityMatrix {
    constructor({ slots, teacherAvailability = new Map(), requireTeacherAvailability = true }) {
        this.slotIndex = new Map(slots.map((slot, index) => [slot.id, index]));
        this.roomBusy = new Map();
        this.teacherBusy = new Map();
        this.groupBusy = new Map();
        this.teacherAvailability = teacherAvailability;
        this.requireTeacherAvailability = requireTeacherAvailability;
        this.assignments = [];
    }

    slotMask(slotId) {
        const index = this.slotIndex.get(slotId);
        if (index === undefined) {
            throw new Error(`Slot inconnu: ${slotId}`);
        }
        return 1n << BigInt(index);
    }

    getBusy(map, id) {
        return map.get(id) || 0n;
    }

    isTeacherAvailable(teacherId, slotId) {
        if (!this.requireTeacherAvailability) {
            return true;
        }

        const availability = this.teacherAvailability.get(teacherId);
        if (availability === undefined) {
            return false;
        }

        return (availability & this.slotMask(slotId)) !== 0n;
    }

    canAssign(candidate) {
        const mask = this.slotMask(candidate.slot.id);

        if ((this.getBusy(this.roomBusy, candidate.room.id_salle) & mask) !== 0n) {
            return false;
        }

        if ((this.getBusy(this.teacherBusy, candidate.teacher.id_user) & mask) !== 0n) {
            return false;
        }

        if ((this.getBusy(this.groupBusy, candidate.session.group.id_groupe) & mask) !== 0n) {
            return false;
        }

        return this.isTeacherAvailable(candidate.teacher.id_user, candidate.slot.id);
    }

    assign(candidate) {
        const mask = this.slotMask(candidate.slot.id);
        const roomId = candidate.room.id_salle;
        const teacherId = candidate.teacher.id_user;
        const groupId = candidate.session.group.id_groupe;

        this.roomBusy.set(roomId, this.getBusy(this.roomBusy, roomId) | mask);
        this.teacherBusy.set(teacherId, this.getBusy(this.teacherBusy, teacherId) | mask);
        this.groupBusy.set(groupId, this.getBusy(this.groupBusy, groupId) | mask);
        this.assignments.push(candidate);
    }

    unassign(candidate) {
        const mask = this.slotMask(candidate.slot.id);
        const roomId = candidate.room.id_salle;
        const teacherId = candidate.teacher.id_user;
        const groupId = candidate.session.group.id_groupe;

        this.roomBusy.set(roomId, this.getBusy(this.roomBusy, roomId) & ~mask);
        this.teacherBusy.set(teacherId, this.getBusy(this.teacherBusy, teacherId) & ~mask);
        this.groupBusy.set(groupId, this.getBusy(this.groupBusy, groupId) & ~mask);

        const index = this.assignments.findIndex((assignment) => assignment.id === candidate.id);
        if (index >= 0) {
            this.assignments.splice(index, 1);
        }
    }

    seedExisting(affectations, slotsByDateAndCreneau) {
        for (const affectation of affectations) {
            const slot = slotsByDateAndCreneau.get(`${affectation.date_seance}:${affectation.id_creneau}`);
            if (!slot) {
                continue;
            }

            const candidate = {
                id: `existing:${affectation.id_affectation}`,
                slot,
                room: { id_salle: affectation.id_salle },
                teacher: { id_user: affectation.id_user_enseignant },
                session: { group: { id_groupe: affectation.id_groupe } },
            };
            this.assign(candidate);
        }
    }
}
