/**
 * Extraction du texte des supports (services/ia/extraction.js). Les fichiers d'exemple sont
 * fabriqués par tests/helpers/supports.js : aucun binaire dans le dépôt.
 */
import { extraireSupport, lirePlage, MOTS_MAX } from "../../services/ia/extraction.js";
import { DOCX, PDF, PPTX, creerDocx, creerPdf, creerPptx, phrase } from "../helpers/supports.js";

describe("PDF", () => {
    const pdf = creerPdf([
        ["Chapitre 1 : les reseaux", phrase("protocole TCP"), phrase("routage IP")],
        ["Chapitre 2 : la securite", phrase("chiffrement symetrique"), phrase("hachage")],
    ]);

    test("une unité par page, citée « page n », lignes conservées", async () => {
        const resultat = await extraireSupport({ contenu: pdf, type: PDF });
        expect(resultat).toMatchObject({ format: "pdf", total: 2 });
        expect(resultat.unites.map((u) => u.repere)).toEqual(["page 1", "page 2"]);
        expect(resultat.unites[0].texte).toMatch(/^Chapitre 1 : les reseaux\n/);
        expect(resultat.unites[1].texte).toContain("chiffrement symetrique");
        expect(resultat.mots).toBeGreaterThan(30);
    });

    test("plage de pages : seule la page demandée", async () => {
        const resultat = await extraireSupport({ contenu: pdf, type: PDF }, { plage: "2" });
        expect(resultat.unites.map((u) => u.repere)).toEqual(["page 2"]);
    });

    test("PDF sans texte (scanné) : refusé avec une explication", async () => {
        await expect(extraireSupport({ contenu: creerPdf([[], []]), type: PDF })).rejects.toMatchObject({ status: 422, message: expect.stringMatching(/scanné/) });
    });

    test("PDF endommagé : refusé", async () => {
        await expect(extraireSupport({ contenu: Buffer.from("%PDF-1.4\nn'importe quoi"), type: PDF })).rejects.toMatchObject({ status: 422 });
    });

    test("trop long : une plage est demandée", async () => {
        // 40 lignes de 17 mots par page, toutes dans la page (pdfjs ignore le texte hors de la page)
        const lignes = Array.from({ length: 40 }, () => phrase("modele OSI"));
        const long = creerPdf(Array.from({ length: Math.ceil(MOTS_MAX / (40 * 17)) + 1 }, () => lignes));
        await expect(extraireSupport({ contenu: long, type: PDF })).rejects.toMatchObject({ status: 413, message: expect.stringMatching(/plage de pages/) });
    });
});

describe("Word (.docx)", () => {
    test("texte en parties d'environ 400 mots, coupées entre deux paragraphes", async () => {
        const paragraphes = Array.from({ length: 60 }, (_, i) => `Paragraphe ${i + 1}. ${phrase("cycle de vie du logiciel")}`);
        const resultat = await extraireSupport({ contenu: await creerDocx(paragraphes), type: DOCX });
        expect(resultat.format).toBe("docx");
        expect(resultat.unites.length).toBeGreaterThan(1);
        expect(resultat.unites[0].repere).toBe("partie 1");
        expect(resultat.unites[0].texte.startsWith("Paragraphe 1.")).toBe(true);
        // Aucun paragraphe coupé en deux
        expect(resultat.unites.map((u) => u.texte).join("\n").split("\n")).toHaveLength(60);
    });
});

describe("PowerPoint (.pptx)", () => {
    test("une unité par diapositive dans l'ordre numérique, notes comprises, entités décodées", async () => {
        const diapositives = Array.from({ length: 11 }, (_, i) => [`Diapositive ${i + 1}`, `${phrase("modele relationnel")} &amp; SQL`]);
        const pptx = await creerPptx(diapositives, { 2: ["2", "Insister sur les |jointures externes"] });
        const resultat = await extraireSupport({ contenu: pptx, type: PPTX });
        expect(resultat.format).toBe("pptx");
        // slide10 et slide11 après slide2 (tri numérique, pas alphabétique)
        expect(resultat.unites.map((u) => u.numero)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
        expect(resultat.unites[0].texte).toContain("& SQL");
        expect(resultat.unites[1].texte).toMatch(/Notes : Insister sur les jointures externes$/);
        expect(resultat.unites[1].texte).not.toMatch(/Notes : 2/);
    });

    test("plage de diapositives", async () => {
        const pptx = await creerPptx(Array.from({ length: 5 }, (_, i) => [`Titre ${i + 1}`, phrase("index B-arbre"), phrase("normalisation")]));
        const resultat = await extraireSupport({ contenu: pptx, type: PPTX }, { plage: "2-3, 5" });
        expect(resultat.unites.map((u) => u.repere)).toEqual(["diapositive 2", "diapositive 3", "diapositive 5"]);
    });
});

describe("Contrôles du fichier", () => {
    test("type non pris en charge ; ancien format Office expliqué", async () => {
        await expect(extraireSupport({ contenu: Buffer.from("x"), type: "image/png" })).rejects.toMatchObject({ status: 415 });
        await expect(extraireSupport({ contenu: Buffer.from("x"), type: "application/msword", nom: "cours.doc" })).rejects.toThrow(/\.docx/);
    });

    test("contenu qui ne correspond pas au type annoncé", async () => {
        await expect(extraireSupport({ contenu: await creerDocx(["x"]), type: PDF })).rejects.toMatchObject({ status: 415 });
        await expect(extraireSupport({ contenu: creerPdf([["x"]]), type: PPTX })).rejects.toMatchObject({ status: 415 });
    });

    test("fichier vide ou trop lourd", async () => {
        await expect(extraireSupport({ contenu: Buffer.alloc(0), type: PDF })).rejects.toMatchObject({ status: 400 });
        await expect(extraireSupport({ contenu: Buffer.alloc(21 * 1024 * 1024), type: PDF })).rejects.toMatchObject({ status: 413 });
    });
});

describe("lirePlage", () => {
    test("plages, valeurs seules et listes", () => {
        expect(lirePlage("", 10)).toBeNull();
        expect([...lirePlage("3-5, 8", 10)]).toEqual([3, 4, 5, 8]);
        expect([...lirePlage("2 ; 4", 10)]).toEqual([2, 4]);
    });

    test("plage invalide ou hors du document : refusée", () => {
        expect(() => lirePlage("deux", 10)).toThrow(/invalide/);
        expect(() => lirePlage("5-3", 10)).toThrow(/hors du document/);
        expect(() => lirePlage("9-12", 10)).toThrow(/1 à 10/);
    });
});
