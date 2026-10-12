/**
 * Fausse IA des parcours (lot B-8, « Créer un quiz ») : un serveur « compatible OpenAI »
 * (POST /v1/chat/completions) qui écrit autant de questions que la consigne en demande
 * (« Écris exactement N questions », backend/services/ia/consigne.js), sur le sujet donné. Elle ne
 * lit pas le texte : le parcours éprouve le chemin de Planner, pas la qualité des questions.
 */
import http from "node:http";

/** Rend les questions au format attendu de l'IA ({ questions: [{ question, type, reponses, explication, source }] }). */
export const questionsSur = (sujet, nombre) =>
  Array.from({ length: nombre }, (_, i) => ({
    question: `${sujet} : question ${i + 1} ?`,
    type: "ABCD",
    reponses: ["Bonne réponse", "Autre réponse", "Troisième réponse", "Quatrième réponse"].map((texte, j) => ({ texte: `${texte} ${i + 1}`, juste: j === 0 })),
    explication: "Réponse écrite par la fausse IA des parcours.",
    source: null,
  }));

/** Démarre la fausse IA sur `port` ; rend une promesse résolue quand elle écoute. */
export const demarrerFausseIa = (port) =>
  new Promise((resolve) => {
    const serveur = http.createServer((req, res) => {
      const morceaux = [];
      req.on("data", (m) => morceaux.push(m));
      req.on("end", () => {
        if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
          res.writeHead(404).end();
          return;
        }
        const demande = JSON.parse(Buffer.concat(morceaux).toString("utf8"));
        const message = demande.messages.find((m) => m.role === "user")?.content ?? "";
        const nombre = Number(/Écris exactement (\d+) question/.exec(message)?.[1] ?? 1);
        const sujet = /<sujet>\n([\s\S]*?)\n<\/sujet>/.exec(message)?.[1]?.trim() || "Le cours";
        const contenu = JSON.stringify({ questions: questionsSur(sujet, nombre) });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ choices: [{ message: { content: contenu }, finish_reason: "stop" }], usage: { prompt_tokens: 100, completion_tokens: 100 } }));
      });
    });
    serveur.listen(Number(port), "127.0.0.1", resolve);
  });
