import { DUREE_CALCUL, aCorriger, dureeAutomatique, resume } from "../../services/generation/timefold/rapport.js";

// Rapport de génération lisible (recette du 20 octobre, M-3) et durée du calcul choisie par le serveur (R-4)

describe("dureeAutomatique", () => {
    test("bornée, et plus longue pour un problème plus grand", () => {
        expect(dureeAutomatique(4)).toBe(DUREE_CALCUL.min);
        expect(dureeAutomatique(200)).toBe(100);
        expect(dureeAutomatique(5000)).toBe(DUREE_CALCUL.max);
    });
});

describe("resume", () => {
    test("des chiffres positifs, aucun conflit à l'arrivée", () => {
        const enseignements = [{ complet: true }, { complet: false }, { complet: true }];
        expect(resume({ enseignements, exclus: [{}], creees: 42 })).toEqual({ seances_creees: 42, enseignements_complets: 2, enseignements_incomplets: 1, enseignements_exclus: 1, conflits: 0 });
    });
});

describe("aCorriger", () => {
    test("chaque point dit quoi faire et mène à l'écran qui le corrige", () => {
        const points = aCorriger({
            avertissements: [
                { type: "plafond_hebdomadaire", id_user: 7, enseignant: "Nadia Sefrioui", plafond_heures: 20, heures_semaine: 27.5, seances: 9 },
                { type: "disponibilites_insuffisantes", id_user: 8, enseignant: "Adil Benkirane", seances: 6, creneaux_libres: 4 },
            ],
            exclus: [{ id_enseignement: 3, module: "Réseaux", type: "TD", raison: "sans_enseignant" }],
            enseignements: [{ id_enseignement: 4, module: "Python", type: "CM", complet: false, heures_prevues: 21, heures_planifiees: 17.5, sautees: [{ raisons: ["evenement"] }, { raisons: ["conflit_salle", "evenement"] }] }],
            leconsEnConflit: ["Python", "Python", "Big Data"],
        });
        expect(points.map((p) => p.type)).toEqual(["plafond_hebdomadaire", "disponibilites_insuffisantes", "sans_enseignant", "incomplet", "semaine_type"]);
        expect(points[0]).toMatchObject({ lien: "/gestion/enseignants?enseignant=7", texte: expect.stringContaining("27.5 h par semaine pour un plafond de 20 h") });
        expect(points[2]).toMatchObject({ lien: "/gestion/enseignements?enseignement=3", texte: expect.stringContaining("aucun enseignant") });
        expect(points[3].texte).toBe("Python (CM) : 3.5 h non planifiées sur 21 h (jour bloqué (férié, vacances ou événement), salle déjà prise).");
        expect(points[4].texte).toContain("2 modules");
        // Ni jargon ni nombre négatif
        expect(points.map((p) => p.texte).join(" ")).not.toMatch(/règle(s)? dure|−|séance\(s\)/);
    });

    test("rien à corriger : liste vide", () => {
        expect(aCorriger({ enseignements: [{ complet: true }] })).toEqual([]);
    });
});
