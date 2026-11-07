import { SONDAGE, repartition, sondageOuvert, verifierSondage } from "../../../shared/sondages.js";

// Sondage de l'enseignant à sa classe (lot EC-9, règles S-3, S-4 et S-7)
const JOUR = "2026-11-02";
const valide = { question: "Quel jour pour le rattrapage ?", choix: ["Mercredi", "Samedi"] };

describe("contenu d'un sondage (S-3)", () => {
    test("accepté, nettoyé : espaces retirés, date vide → null", () => {
        expect(verifierSondage({ question: "  Le rythme vous convient-il ?  ", choix: [" Oui ", "Non"], ferme_le: "" }, JOUR)).toEqual({
            sondage: { question: "Le rythme vous convient-il ?", choix: ["Oui", "Non"], ferme_le: null },
        });
    });

    test("date de fin aujourd'hui ou plus tard : acceptée", () => {
        expect(verifierSondage({ ...valide, ferme_le: JOUR }, JOUR).sondage.ferme_le).toBe(JOUR);
        expect(verifierSondage({ ...valide, ferme_le: "2026-12-01" }, JOUR).sondage.ferme_le).toBe("2026-12-01");
    });

    test.each([
        ["question absente", { choix: valide.choix }, "question"],
        ["question trop courte", { ...valide, question: " ok " }, "question"],
        ["question trop longue", { ...valide, question: "a".repeat(SONDAGE.questionMax + 1) }, "question"],
        ["un seul choix", { ...valide, choix: ["Oui"] }, "nombreChoix"],
        ["sept choix", { ...valide, choix: ["1", "2", "3", "4", "5", "6", "7"] }, "nombreChoix"],
        ["choix qui n'est pas une liste", { ...valide, choix: "Oui, Non" }, "nombreChoix"],
        ["choix vide", { ...valide, choix: ["Oui", "  "] }, "choix"],
        ["choix trop long", { ...valide, choix: ["Oui", "a".repeat(SONDAGE.libelleMax + 1)] }, "choix"],
        ["choix qui n'est pas un texte", { ...valide, choix: ["Oui", 2] }, "choix"],
        ["doublon aux capitales près", { ...valide, choix: ["Oui", " oui"] }, "doublon"],
        ["date passée", { ...valide, ferme_le: "2026-11-01" }, "date"],
        ["date qui n'existe pas", { ...valide, ferme_le: "2026-02-30" }, "date"],
        ["date mal formée", { ...valide, ferme_le: "02/11/2026" }, "date"],
    ])("refusé : %s", (_, sondage, motif) => {
        expect(verifierSondage(sondage, JOUR)).toEqual({ motif });
    });
});

describe("sondage ouvert (S-4)", () => {
    test("sans date de fin : ouvert tant qu'il n'est pas clos", () => {
        expect(sondageOuvert({ ferme_le: null, clos_le: null }, JOUR)).toBe(true);
        expect(sondageOuvert({ ferme_le: null, clos_le: "2026-11-01T10:00:00.000Z" }, JOUR)).toBe(false);
    });

    test("ouvert le jour de la date de fin, fermé le lendemain", () => {
        expect(sondageOuvert({ ferme_le: JOUR, clos_le: null }, JOUR)).toBe(true);
        expect(sondageOuvert({ ferme_le: "2026-11-01", clos_le: null }, JOUR)).toBe(false);
    });
});

describe("répartition (S-7)", () => {
    test("parts arrondies, dans l'ordre des choix", () => {
        expect(repartition([{ reponses: 2 }, { reponses: 1 }])).toEqual([67, 33]);
    });

    test("inconnue sous le seuil (compteurs absents) ou sans réponse : null", () => {
        expect(repartition([{ reponses: null }, { reponses: null }])).toBeNull();
        expect(repartition([{ reponses: 0 }, { reponses: 0 }])).toBeNull();
        expect(repartition([])).toBeNull();
    });
});
