export const DAY_ORDER = {
    lundi: 1,
    mardi: 2,
    mercredi: 3,
    jeudi: 4,
    vendredi: 5,
    samedi: 6,
    dimanche: 0,
};

export const toMinutes = (value) => {
    if (value instanceof Date) {
        return value.getHours() * 60 + value.getMinutes();
    }

    const normalized = typeof value === "string" && value.includes("T")
        ? new Date(value).toTimeString().slice(0, 8)
        : String(value || "00:00");

    const [hours = "0", minutes = "0"] = normalized.split(":");
    return Number(hours) * 60 + Number(minutes);
};

export const durationHours = (start, end) => {
    return Math.max(0, (toMinutes(end) - toMinutes(start)) / 60);
};

export const normalizeDate = (value) => new Date(value).toISOString().split("T")[0];

export const dateInRange = (date, start, end) => {
    return date >= start && date <= end;
};

export const generateDatesForDay = (dateDebut, dateFin, dayName, blockedEvents = []) => {
    const dates = [];
    const cursor = new Date(dateDebut);
    const end = new Date(dateFin);
    const targetDay = DAY_ORDER[String(dayName).toLowerCase()] ?? 1;

    while (cursor <= end) {
        if (cursor.getDay() === targetDay) {
            const date = normalizeDate(cursor);
            const blocked = blockedEvents.some((event) => (
                event.bloque_affectations &&
                dateInRange(date, event.date_debut, event.date_fin)
            ));

            if (!blocked) {
                dates.push(date);
            }
        }

        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
};

export const buildChronologicalSlots = (creneaux, dateDebut, dateFin, events = []) => {
    const slots = [];

    for (const creneau of creneaux) {
        const dates = generateDatesForDay(dateDebut, dateFin, creneau.jour_semaine, events);

        for (const date of dates) {
            slots.push({
                id: `${date}:${creneau.id_creneau}`,
                date,
                id_creneau: creneau.id_creneau,
                jour_semaine: creneau.jour_semaine,
                heure_debut: creneau.heure_debut,
                heure_fin: creneau.heure_fin,
                debutMinutes: toMinutes(creneau.heure_debut),
                finMinutes: toMinutes(creneau.heure_fin),
                dureeHeures: creneau.duree_minutes
                    ? Number(creneau.duree_minutes) / 60
                    : durationHours(creneau.heure_debut, creneau.heure_fin),
            });
        }
    }

    return slots.sort((a, b) => (
        a.date === b.date
            ? a.debutMinutes - b.debutMinutes
            : a.date.localeCompare(b.date)
    ));
};
