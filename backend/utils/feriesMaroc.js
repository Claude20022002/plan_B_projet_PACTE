/**
 * Jours fériés du Maroc, pour pré-remplir le calendrier d'une année universitaire.
 *
 * - Fériés civils : date fixe, insérés comme confirmés.
 * - Fêtes religieuses : calendrier lunaire, date officielle annoncée par le ministère des
 *   Habous quelques jours avant. Insérées NON confirmées (date_confirmee = false) :
 *   l'administration confirme ou décale, et les séances du jour sont alors replanifiées.
 * - Ramadan : pas férié, mais active la grille horaire « ramadan » (horaires réduits).
 *
 * Sources : calendrier 2026-2027 publié (wafir.ma, octobre 2026) ; 2028 = estimation astronomique.
 * La Fête de l'Unité (31 octobre) existe depuis le décret royal de novembre 2025.
 */

export const FERIES_FIXES = [
    { mois: 1, jour: 1, titre: "Nouvel An" },
    { mois: 1, jour: 11, titre: "Manifeste de l'Indépendance" },
    { mois: 1, jour: 14, titre: "Nouvel An amazigh (Id Yennayer)" },
    { mois: 5, jour: 1, titre: "Fête du Travail" },
    { mois: 7, jour: 30, titre: "Fête du Trône" },
    { mois: 8, jour: 14, titre: "Allégeance Oued Eddahab" },
    { mois: 8, jour: 20, titre: "Révolution du Roi et du Peuple" },
    { mois: 8, jour: 21, titre: "Fête de la Jeunesse" },
    { mois: 10, jour: 31, titre: "Fête de l'Unité" },
    { mois: 11, jour: 6, titre: "Marche Verte" },
    { mois: 11, jour: 18, titre: "Fête de l'Indépendance" },
];

// Dates estimées (à confirmer par observation du croissant)
export const FETES_LUNAIRES = [
    { titre: "Aïd al-Fitr", date_debut: "2026-03-20", date_fin: "2026-03-21" },
    { titre: "Aïd al-Adha", date_debut: "2026-05-27", date_fin: "2026-05-28" },
    { titre: "Nouvel An de l'Hégire (1er Moharram)", date_debut: "2026-06-17", date_fin: "2026-06-17" },
    { titre: "Aïd al-Mawlid", date_debut: "2026-08-25", date_fin: "2026-08-26" },
    { titre: "Aïd al-Fitr", date_debut: "2027-03-10", date_fin: "2027-03-11" },
    { titre: "Aïd al-Adha", date_debut: "2027-05-17", date_fin: "2027-05-18" },
    { titre: "Nouvel An de l'Hégire (1er Moharram)", date_debut: "2027-06-06", date_fin: "2027-06-06" },
    { titre: "Aïd al-Mawlid", date_debut: "2027-08-14", date_fin: "2027-08-15" },
    { titre: "Aïd al-Fitr", date_debut: "2028-02-27", date_fin: "2028-02-28" },
    { titre: "Aïd al-Adha", date_debut: "2028-05-05", date_fin: "2028-05-06" },
    { titre: "Nouvel An de l'Hégire (1er Moharram)", date_debut: "2028-05-25", date_fin: "2028-05-25" },
    { titre: "Aïd al-Mawlid", date_debut: "2028-08-03", date_fin: "2028-08-04" },
];

export const RAMADANS = [
    { date_debut: "2026-02-18", date_fin: "2026-03-19" },
    { date_debut: "2027-02-08", date_fin: "2027-03-09" },
    { date_debut: "2028-01-28", date_fin: "2028-02-26" },
];

const pad = (n) => String(n).padStart(2, "0");
const chevauche = (debut, fin, from, to) => debut <= to && fin >= from;

/**
 * Événements de calendrier compris dans [dateDebut, dateFin] (chaînes YYYY-MM-DD).
 * Retourne des objets prêts pour Evenement.create (sans id_user_createur).
 */
export const evenementsCalendrierMaroc = (dateDebut, dateFin) => {
    const evenements = [];
    const anneeDebut = Number(dateDebut.slice(0, 4));
    const anneeFin = Number(dateFin.slice(0, 4));

    for (let annee = anneeDebut; annee <= anneeFin; annee += 1) {
        for (const { mois, jour, titre } of FERIES_FIXES) {
            const date = `${annee}-${pad(mois)}-${pad(jour)}`;
            if (date >= dateDebut && date <= dateFin) {
                evenements.push({
                    titre,
                    date_debut: date,
                    date_fin: date,
                    type_evenement: "ferie",
                    bloque_affectations: true,
                    date_confirmee: true,
                    portee: "etablissement",
                });
            }
        }
    }

    for (const fete of FETES_LUNAIRES) {
        if (chevauche(fete.date_debut, fete.date_fin, dateDebut, dateFin)) {
            evenements.push({
                ...fete,
                description: "Date estimée : à confirmer selon l'annonce officielle",
                type_evenement: "ferie",
                bloque_affectations: true,
                date_confirmee: false,
                portee: "etablissement",
            });
        }
    }

    for (const ramadan of RAMADANS) {
        if (chevauche(ramadan.date_debut, ramadan.date_fin, dateDebut, dateFin)) {
            evenements.push({
                titre: "Ramadan",
                ...ramadan,
                description: "Grille horaire « ramadan » (horaires réduits). Dates estimées.",
                type_evenement: "ramadan",
                bloque_affectations: false,
                date_confirmee: false,
                portee: "etablissement",
            });
        }
    }

    return evenements.sort((a, b) => a.date_debut.localeCompare(b.date_debut));
};
