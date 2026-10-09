import { champCsv } from "../../services/planning/suivi.js";

// Injection CSV (OWASP) : une cellule ne doit jamais devenir une formule à l'ouverture dans Excel
describe("champCsv", () => {
    test.each([
        ["=HYPERLINK(\"http://x\",\"clic\")", `"'=HYPERLINK(""http://x"",""clic"")"`],
        ["+33 6 00", "'+33 6 00"],
        ["-1+1", "'-1+1"],
        ["@SUM(A1)", "'@SUM(A1)"],
        ["\tcmd", "'\tcmd"],
    ])("formule neutralisée : %s", (valeur, attendu) => {
        expect(champCsv(valeur)).toBe(attendu);
    });

    test("valeurs ordinaires inchangées, séparateurs et guillemets échappés", () => {
        expect(champCsv("Dupont")).toBe("Dupont");
        expect(champCsv("1,5")).toBe("1,5");
        expect(champCsv(null)).toBe("");
        expect(champCsv("Salle A; bâtiment B")).toBe('"Salle A; bâtiment B"');
        expect(champCsv('Le "grand" amphi')).toBe('"Le ""grand"" amphi"');
        expect(champCsv("ligne 1\nligne 2")).toBe('"ligne 1\nligne 2"');
    });
});
