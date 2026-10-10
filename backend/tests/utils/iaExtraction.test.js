/**
 * Extraction du texte des supports (services/ia/extraction.js). Les fichiers d'exemple sont
 * fabriqués ici (PDF écrit à la main, Word et PowerPoint assemblés avec JSZip) : aucun binaire
 * dans le dépôt.
 */
import JSZip from "jszip";
import { extraireSupport, lirePlage, MOTS_MAX } from "../../services/ia/extraction.js";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

// Phrase de cours répétée pour dépasser le minimum de mots
const phrase = (sujet) => `Le ${sujet} est une notion importante du cours que les etudiants doivent comprendre et savoir appliquer`;

/** PDF minimal valide : une page par entrée, chaque ligne de texte en Helvetica (ASCII). */
const creerPdf = (pages) => {
    const objets = [];
    const ajouter = (corps) => objets.push(corps) && objets.length;
    ajouter("<< /Type /Catalog /Pages 2 0 R >>");
    ajouter(null); // Pages, rempli plus bas
    const police = ajouter("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const kids = [];
    for (const lignes of pages) {
        const flux = lignes.length ? `BT /F1 11 Tf 14 TL 50 750 Td ${lignes.map((l) => `(${l}) Tj T*`).join(" ")} ET` : "";
        const contenu = ajouter(`<< /Length ${flux.length} >>\nstream\n${flux}\nendstream`);
        kids.push(ajouter(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contenu} 0 R /Resources << /Font << /F1 ${police} 0 R >> >> >>`));
    }
    objets[1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(" ")}] /Count ${kids.length} >>`;
    let sortie = "%PDF-1.4\n";
    const positions = objets.map((corps, i) => {
        const position = sortie.length;
        sortie += `${i + 1} 0 obj\n${corps}\nendobj\n`;
        return position;
    });
    const xref = sortie.length;
    sortie += `xref\n0 ${objets.length + 1}\n0000000000 65535 f \n${positions.map((p) => `${String(p).padStart(10, "0")} 00000 n \n`).join("")}`;
    sortie += `trailer\n<< /Size ${objets.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
    return Buffer.from(sortie, "latin1");
};

const creerDocx = async (paragraphes) => {
    const zip = new JSZip();
    zip.file(
        "[Content_Types].xml",
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'
    );
    zip.file(
        "_rels/.rels",
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
    );
    const corps = paragraphes.map((p) => `<w:p><w:r><w:t xml:space="preserve">${p}</w:t></w:r></w:p>`).join("");
    zip.file("word/document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${corps}</w:body></w:document>`);
    return zip.generateAsync({ type: "nodebuffer" });
};

const xmlDiapositive = (lignes) =>
    `<?xml version="1.0" encoding="UTF-8"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:sp><p:txBody>${lignes
        .map((l) => `<a:p>${l.split("|").map((f) => `<a:r><a:t>${f}</a:t></a:r>`).join("")}</a:p>`)
        .join("")}</p:txBody></p:sp></p:spTree></p:cSld></p:sld>`;

const creerPptx = async (diapositives, notes = {}) => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    diapositives.forEach((lignes, i) => zip.file(`ppt/slides/slide${i + 1}.xml`, xmlDiapositive(lignes)));
    for (const [n, lignes] of Object.entries(notes)) zip.file(`ppt/notesSlides/notesSlide${n}.xml`, xmlDiapositive(lignes));
    return zip.generateAsync({ type: "nodebuffer" });
};

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
        const lignes = Array.from({ length: 60 }, () => phrase("modele OSI"));
        const long = creerPdf(Array.from({ length: Math.ceil(MOTS_MAX / (60 * 17)) + 1 }, () => lignes));
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
