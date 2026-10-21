import { creneauxDansLeVolume, debutDeploiement, heuresDe } from "../../services/generation/timefold/volume.js";

// Dates et volumes du déploiement (recette du 20 octobre : M-2 séances dans le passé, M-1 volumes dépassés)

describe("debutDeploiement", () => {
    test("une période à venir commence à sa date", () => {
        expect(debutDeploiement("2026-11-02", "2026-10-20")).toBe("2026-11-02");
    });

    test("une période commencée ne reçoit rien avant demain, aujourd'hui compris", () => {
        expect(debutDeploiement("2026-09-14", "2026-10-20")).toBe("2026-10-21");
        expect(debutDeploiement("2026-10-20", "2026-10-20")).toBe("2026-10-21");
    });

    test("demain est correct en fin de mois et d'année", () => {
        expect(debutDeploiement("2026-01-05", "2026-12-31")).toBe("2027-01-01");
    });
});

describe("creneauxDansLeVolume", () => {
    // Matin de 3 h 15 : 9 h → 10 h 45 (1 h 45) puis 11 h → 12 h 30 (1 h 30)
    const matin = [
        { heure_debut: "09:00", heure_fin: "10:45" },
        { heure_debut: "11:00", heure_fin: "12:30" },
    ];

    test("une demi-journée entière quand le volume restant la contient", () => {
        expect(creneauxDansLeVolume(matin, 21)).toHaveLength(2);
        expect(creneauxDansLeVolume(matin, 3.25)).toHaveLength(2);
    });

    test("la dernière séance est raccourcie au lieu de dépasser le volume", () => {
        const retenus = creneauxDansLeVolume(matin, 2.25);
        expect(retenus).toEqual([matin[0]]);
        expect(heuresDe(retenus)).toBeLessThanOrEqual(2.25);
    });

    test("rien quand le reste est plus court que le premier créneau", () => {
        expect(creneauxDansLeVolume(matin, 1.5)).toEqual([]);
        expect(creneauxDansLeVolume(matin, 0)).toEqual([]);
    });

    test("jamais plus que le volume, quel que soit le reste", () => {
        for (let reste = 0; reste <= 8; reste += 0.25) {
            expect(heuresDe(creneauxDansLeVolume(matin, reste))).toBeLessThanOrEqual(reste + 1e-6);
        }
    });
});
