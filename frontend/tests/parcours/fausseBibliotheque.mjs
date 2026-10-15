/**
 * Fausse Bibliothèque des parcours (espace de cours, docs/plans/espace-de-cours.md) : un petit
 * serveur HTTP qui répond aux routes de StudyLib que Planner appelle, avec des documents gardés en
 * mémoire. Comme la vraie, elle exige le jeton de l'utilisateur (dépôt, lecture, publication,
 * retrait) et un jeton de service pour un lien ; elle sert aussi le fichier « signé ».
 * Elle ne vérifie pas les signatures (le vrai contrôle est testé dans StudyLib et dans Planner).
 */
import http from "node:http";
import crypto from "node:crypto";

const repondre = (res, statut, donnees, type = "application/json") => {
  res.writeHead(statut, { "Content-Type": type });
  res.end(type === "application/json" ? JSON.stringify(donnees) : donnees);
};

// Charge utile d'un jeton (sans vérifier la signature : faux service)
const charge = (req) => {
  try {
    return JSON.parse(Buffer.from(String(req.headers.authorization ?? "").split(".")[1] ?? "", "base64url").toString("utf8"));
  } catch {
    return {};
  }
};

/** Démarre la fausse Bibliothèque sur `port` ; rend { documents } (id → document). */
export const demarrerFausseBibliotheque = (port) =>
  new Promise((resolve) => {
    const documents = new Map();
    const serveur = http.createServer((req, res) => {
      const morceaux = [];
      req.on("data", (m) => morceaux.push(m));
      req.on("end", () => {
        const adresse = new URL(req.url, "http://faux");
        const jeton = charge(req);
        const corps = Buffer.concat(morceaux);

        if (req.method === "POST" && adresse.pathname === "/api/classe/documents") {
          if (!jeton.sub) return repondre(res, 401, { message: "Unauthenticated." });
          const texte = corps.toString("latin1");
          const titre = /name="title"\r\n\r\n([^\r]*)/.exec(texte)?.[1] ?? "Document";
          const id = crypto.randomUUID();
          documents.set(id, { id, title: Buffer.from(titre, "latin1").toString("utf8"), visibility: "class", owner: jeton.sub, mime_type: "application/pdf", file_size: corps.length, module: { code: adresse.searchParams.get("module") } });
          return repondre(res, 201, { data: documents.get(id) });
        }
        const [, id, publier] = /^\/api\/classe\/documents\/([0-9a-f-]{36})(\/publier)?$/.exec(adresse.pathname) ?? [];
        if (id) {
          const doc = documents.get(id);
          if (!doc || !(doc.visibility === "school" || doc.owner === jeton.sub)) return repondre(res, 404, { message: "Not Found" });
          if (req.method === "DELETE") {
            documents.delete(id);
            res.writeHead(204).end();
            return undefined;
          }
          if (req.method === "PATCH" && publier) doc.visibility = "school";
          return repondre(res, 200, { data: doc });
        }
        const [, idLien] = /^\/api\/interne\/documents\/([0-9a-f-]{36})\/lien$/.exec(adresse.pathname) ?? [];
        if (idLien) {
          if (jeton.aud !== "studylib-interne" || jeton.doc !== idLien || !documents.has(idLien)) return repondre(res, 401, { message: "Unauthenticated." });
          return repondre(res, 200, { url: `http://127.0.0.1:${port}/fichiers/${idLien}`, expires_in: 300 });
        }
        const [, idFichier] = /^\/fichiers\/([0-9a-f-]{36})$/.exec(adresse.pathname) ?? [];
        if (idFichier && documents.has(idFichier)) return repondre(res, 200, `Support : ${documents.get(idFichier).title}`, "text/plain; charset=utf-8");
        return repondre(res, 404, { message: "Not Found" });
      });
    });
    serveur.listen(Number(port), "127.0.0.1", () => resolve({ documents }));
  });
