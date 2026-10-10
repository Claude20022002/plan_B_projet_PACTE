/**
 * Fabriques de supports de cours pour les tests (aucun binaire dans le dépôt) : PDF écrit à la
 * main (Helvetica, ASCII), Word et PowerPoint assemblés avec JSZip.
 */
import JSZip from "jszip";

export const PDF = "application/pdf";
export const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

// Phrase de cours répétée pour dépasser le minimum de mots
export const phrase = (sujet) => `Le ${sujet} est une notion importante du cours que les etudiants doivent comprendre et savoir appliquer`;

/** PDF minimal valide : une page par entrée, chaque ligne de texte en Helvetica (ASCII). */
export const creerPdf = (pages) => {
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

export const creerDocx = async (paragraphes) => {
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

export const creerPptx = async (diapositives, notes = {}) => {
    const zip = new JSZip();
    zip.file("[Content_Types].xml", '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>');
    diapositives.forEach((lignes, i) => zip.file(`ppt/slides/slide${i + 1}.xml`, xmlDiapositive(lignes)));
    for (const [n, lignes] of Object.entries(notes)) zip.file(`ppt/notesSlides/notesSlide${n}.xml`, xmlDiapositive(lignes));
    return zip.generateAsync({ type: "nodebuffer" });
};

