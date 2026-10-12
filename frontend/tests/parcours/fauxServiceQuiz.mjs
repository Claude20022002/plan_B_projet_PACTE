/**
 * Faux service de quiz des parcours (lots IA-5 et B-8) : un petit serveur HTTP qui répond aux routes
 * signées que Planner appelle (/api/v1/hestim/…), avec des quiz gardés en mémoire. Il vérifie la
 * signature comme le vrai (classquiz/routers/hestim.py) : une requête mal signée est refusée, donc
 * le parcours prouve aussi que Planner signe ce qu'il envoie. Ni partie en direct, ni base de données.
 */
import http from "node:http";
import crypto from "node:crypto";

/** Rend la signature attendue d'une requête (même calcul que services/quiz/clientClassQuiz.js). */
const signature = (secret, horodatage, methode, chemin, corps) =>
  crypto
    .createHmac("sha256", secret)
    .update(`${horodatage}.${methode}.${chemin}${corps === null ? "" : `.${crypto.createHash("sha256").update(corps).digest("hex")}`}`)
    .digest("hex");

const repondre = (res, statut, donnees) => {
  res.writeHead(statut, { "Content-Type": "application/json" });
  res.end(JSON.stringify(donnees));
};

/**
 * Démarre le faux service sur `port` et rend { quiz } : la table des quiz (id → { proprietaire,
 * titre, description, questions, modifie_le }), à remplir par la préparation des données.
 */
export const demarrerFauxServiceQuiz = (port, secret) =>
  new Promise((resolve) => {
    const quiz = new Map();
    const serveur = http.createServer((req, res) => {
      const morceaux = [];
      req.on("data", (m) => morceaux.push(m));
      req.on("end", () => {
        const corps = req.method === "GET" ? null : Buffer.concat(morceaux).toString("utf8");
        const attendue = signature(secret, req.headers["x-hestim-timestamp"] ?? "", req.method, req.url, corps);
        if (req.headers["x-hestim-signature"] !== attendue) return repondre(res, 401, { detail: "signature invalide" });
        const adresse = new URL(req.url, "http://faux");
        const email = adresse.searchParams.get("email");
        const [, id] = /^\/api\/v1\/hestim\/quiz\/([0-9a-f-]{36})$/.exec(adresse.pathname) ?? [];

        if (req.method === "GET" && adresse.pathname === "/api/v1/hestim/quizzes") {
          const siens = [...quiz.entries()].filter(([, q]) => q.proprietaire === email);
          return repondre(res, 200, siens.map(([cle, q]) => ({ id: cle, titre: q.titre, nb_questions: q.questions.length, modifie_le: q.modifie_le })));
        }
        if (req.method === "GET" && id) {
          const q = quiz.get(id);
          if (!q || q.proprietaire !== email) return repondre(res, 404, { detail: "introuvable" });
          return repondre(res, 200, { id, titre: q.titre, description: q.description, questions: q.questions });
        }
        if (req.method === "POST" && id) {
          const donnees = JSON.parse(corps);
          const q = quiz.get(id);
          if (!q || q.proprietaire !== donnees.email) return repondre(res, 422, { detail: "quiz introuvable pour cet enseignant" });
          Object.assign(q, { titre: donnees.titre, description: donnees.description ?? "", questions: donnees.questions.map((x) => ({ ...x, time: String(x.time) })), modifie_le: new Date().toISOString() });
          return repondre(res, 200, { id, titre: q.titre, nb_questions: q.questions.length });
        }
        if (req.method === "POST" && adresse.pathname === "/api/v1/hestim/quiz") {
          const donnees = JSON.parse(corps);
          const nouveau = crypto.randomUUID();
          quiz.set(nouveau, { proprietaire: donnees.email, titre: donnees.titre, description: donnees.description ?? "", questions: donnees.questions, modifie_le: new Date().toISOString() });
          return repondre(res, 201, { id: nouveau, titre: donnees.titre, nb_questions: donnees.questions.length });
        }
        return repondre(res, 404, { detail: "route inconnue" });
      });
    });
    serveur.listen(Number(port), "127.0.0.1", () => resolve({ quiz }));
  });
