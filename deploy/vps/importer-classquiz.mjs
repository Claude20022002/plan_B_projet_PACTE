// Sortie de ClassQuiz (lot SC-2) : importe dans le Studio quiz les quiz de tous les enseignants ACTIFS
// (compte Planner actif, reconnu à son adresse e-mail ; décision du 20 octobre 2026). Les quiz arrivent
// en brouillon (questions à relire) ; relancer la commande ne recrée rien. Les sondages et les
// diapositives ne se reprennent pas : ils sont dits dans le bilan. Le bilan complet est écrit sur la
// sortie standard en JSON, un résumé lisible sur la sortie d'erreur. Le service de quiz doit être
// en ligne (QUIZ_API_INTERNE et QUIZ_WEBHOOK_SECRET du serveur).
// Exécution : docker compose exec -T backend node --input-type=module - < deploy/vps/importer-classquiz.mjs > bilan-import-classquiz.json
import sequelize from "/app/config/db.js";
import { importerPourEnseignantsActifs } from "/app/services/studio/importClassQuiz.js";

const log = (m) => process.stderr.write(`${m}\n`);

const bilans = await importerPourEnseignantsActifs();
for (const b of bilans) {
    const ignorees = b.quiz.reduce((n, q) => n + (q.ignorees?.length ?? 0), 0);
    log(`${b.enseignant} <${b.email}> : ${b.importes} importé(s), ${b.deja_importes} déjà importé(s), ${ignorees} question(s) ignorée(s)${b.erreurs ? `, ${b.erreurs} erreur(s)` : ""}${b.message ? ` : ${b.message}` : ""}`);
}
log(`${bilans.reduce((n, b) => n + b.importes, 0)} quiz importés pour ${bilans.length} enseignants.`);
process.stdout.write(`${JSON.stringify(bilans, null, 2)}\n`);
await sequelize.close();
