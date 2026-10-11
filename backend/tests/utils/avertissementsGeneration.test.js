import { avertissementsAvantGeneration } from "../../services/generation/timefold/avertissements.js";

// Avertissements donnés avant le calcul de la semaine type : disponibilités insuffisantes et
// plafond hebdomadaire d'un enseignant (que le solveur ne connaît pas)

// Grille : lundi et mardi, deux créneaux le matin (1 h 45 puis 1 h 30), qui se suivent
const creneaux = [
    { id: 1, jour: 1, debut: 540, fin: 645, rang: 1, regime: "initiale", suivantId: 2 },
    { id: 2, jour: 1, debut: 660, fin: 750, rang: 2, regime: "initiale", suivantId: null },
    { id: 3, jour: 2, debut: 540, fin: 645, rang: 1, regime: "initiale", suivantId: 4 },
    { id: 4, jour: 2, debut: 660, fin: 750, rang: 2, regime: "initiale", suivantId: null },
];
const lecon = (id, longueur = 1, enseignants = [10]) => ({ id, longueur, regime: "initiale", enseignants, epinglee: false });
const prof = (plus = {}) => ({ id_user: 10, nom: "Salma Idrissi", statut: "permanent", max_heures_semaine: null, ...plus });

describe("avertissementsAvantGeneration", () => {
    test("rien à signaler sans plafond ni indisponibilité", () => {
        expect(avertissementsAvantGeneration({ enseignants: [prof()], voeux: [], lecons: [lecon("a"), lecon("b")], creneaux })).toEqual([]);
    });

    test("disponibilités insuffisantes : plus de séances que de créneaux libres", () => {
        const voeux = [1, 2, 3].map((creneauId) => ({ enseignantId: 10, creneauId, type: "INDISPONIBLE" }));
        const [avertissement] = avertissementsAvantGeneration({ enseignants: [prof({ statut: "vacataire" })], voeux, lecons: [lecon("a"), lecon("b")], creneaux });
        expect(avertissement).toEqual({ type: "disponibilites_insuffisantes", id_user: 10, enseignant: "Salma Idrissi", statut: "vacataire", seances: 2, creneaux_libres: 1 });
        // Une demi-journée demande deux créneaux libres qui se suivent : le créneau 4 seul ne suffit pas
        const demiJournee = avertissementsAvantGeneration({ enseignants: [prof()], voeux, lecons: [lecon("a", 2)], creneaux });
        expect(demiJournee).toEqual([expect.objectContaining({ type: "disponibilites_insuffisantes", seances: 1, creneaux_libres: 0 })]);
    });

    test("plafond hebdomadaire : signalé quand la semaine type le dépasse à coup sûr", () => {
        // Deux demi-journées de 3 h 15 : 6 h 30 dans la semaine
        const lecons = [lecon("a", 2), lecon("b", 2)];
        expect(avertissementsAvantGeneration({ enseignants: [prof({ max_heures_semaine: 7 })], voeux: [], lecons, creneaux })).toEqual([]);
        expect(avertissementsAvantGeneration({ enseignants: [prof({ max_heures_semaine: 6 })], voeux: [], lecons, creneaux })).toEqual([
            { type: "plafond_hebdomadaire", id_user: 10, enseignant: "Salma Idrissi", statut: "permanent", plafond_heures: 6, heures_semaine: 6.5, seances: 2 },
        ]);
    });

    test("plafond hebdomadaire : compté au plus court, séances déjà en place comprises", () => {
        // Une séance d'un créneau prend au moins 1 h 30 (le plus court de la grille)
        const lecons = [lecon("a"), lecon("b")];
        expect(avertissementsAvantGeneration({ enseignants: [prof({ max_heures_semaine: 3 })], voeux: [], lecons, creneaux })).toEqual([]);
        // Une séance saisie à la main le lundi à 9 h (1 h 45) s'y ajoute : 4 h 45 pour un plafond de 3 h
        const occupations = [{ id: "occ-1", longueur: 1, regime: "initiale", enseignants: [10], epinglee: true, creneau: { id: 1 } }];
        const [avertissement] = avertissementsAvantGeneration({ enseignants: [prof({ max_heures_semaine: 3 })], voeux: [], lecons, occupations, creneaux });
        expect(avertissement).toMatchObject({ type: "plafond_hebdomadaire", heures_semaine: 4.8, seances: 3 });
        // Les séances d'un collègue ne comptent pas
        expect(avertissementsAvantGeneration({ enseignants: [prof({ max_heures_semaine: 3 })], voeux: [], lecons: [lecon("a"), lecon("c", 2, [11])], creneaux })).toEqual([]);
    });
});
