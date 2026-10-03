import { campusCodeFromBatiment } from "../../utils/campus.js";
import { evenementsCalendrierMaroc } from "../../utils/feriesMaroc.js";
import { normaliserTypeSalle, TYPES_SALLE } from "../../config/referentiel.js";
import { PARAMETRES_PLANNING } from "../../config/parametresPlanning.js";

describe("campusCodeFromBatiment (migration de Salles.batiment)", () => {
    test.each([
        ["Gandhi", "G"],
        ["Ghandi", "G"],
        ["Bâtiment Gandhi", "G"],
        ["  gandhi ", "G"],
        ["Stendhal", "ST"],
        ["Campus Stendhal", "ST"],
        ["", "G"],
        [null, "G"],
        ["Bâtiment A", "A"],
        ["Bâtiment Lab", "LAB"],
    ])("« %s » → %s", (batiment, code) => {
        expect(campusCodeFromBatiment(batiment)).toBe(code);
    });
});

describe("normaliserTypeSalle", () => {
    test("ramène les anciens libellés vers la liste fermée", () => {
        expect(normaliserTypeSalle("Laboratoire informatique")).toBe("Labo informatique");
        expect(normaliserTypeSalle("amphi")).toBe("Amphithéâtre");
        expect(normaliserTypeSalle("Salle TD")).toBe("Salle TD");
    });

    test("laisse intacte une valeur inconnue (refusée ensuite par la validation)", () => {
        expect(normaliserTypeSalle("Piscine")).toBe("Piscine");
        expect(TYPES_SALLE).not.toContain("Piscine");
    });
});

describe("evenementsCalendrierMaroc (année 2026-2027)", () => {
    const evenements = evenementsCalendrierMaroc("2026-09-01", "2027-07-15");
    const trouver = (titre, date) => evenements.find((e) => e.titre === titre && e.date_debut === date);

    test("fériés civils confirmés, dont la Fête de l'Unité (31 octobre)", () => {
        const unite = trouver("Fête de l'Unité", "2026-10-31");
        expect(unite).toMatchObject({ type_evenement: "ferie", date_confirmee: true, bloque_affectations: true });
        expect(trouver("Marche Verte", "2026-11-06")).toBeDefined();
        expect(trouver("Fête du Travail", "2027-05-01")).toBeDefined();
    });

    test("fêtes religieuses en dates estimées, à confirmer", () => {
        const fitr = trouver("Aïd al-Fitr", "2027-03-10");
        expect(fitr).toMatchObject({ date_fin: "2027-03-11", date_confirmee: false, bloque_affectations: true });
        expect(trouver("Aïd al-Adha", "2027-05-17")).toBeDefined();
    });

    test("Ramadan : non bloquant, active la grille réduite", () => {
        const ramadan = evenements.find((e) => e.type_evenement === "ramadan");
        expect(ramadan).toMatchObject({ date_debut: "2027-02-08", bloque_affectations: false, date_confirmee: false });
    });

    test("rien hors des bornes de l'année", () => {
        expect(evenements.every((e) => e.date_fin >= "2026-09-01" && e.date_debut <= "2027-07-15")).toBe(true);
        expect(trouver("Fête du Trône", "2027-07-30")).toBeUndefined();
    });
});

describe("PARAMETRES_PLANNING", () => {
    test("chaque valeur par défaut passe sa propre validation", () => {
        for (const [cle, { defaut, valider }] of Object.entries(PARAMETRES_PLANNING)) {
            expect([cle, valider(defaut)]).toEqual([cle, true]);
        }
    });

    test("la pause du vendredi refuse une fin avant le début", () => {
        const { valider } = PARAMETRES_PLANNING.pause_vendredi;
        expect(valider({ active: true, debut: "14:30", fin: "12:30" })).toBe(false);
    });
});
