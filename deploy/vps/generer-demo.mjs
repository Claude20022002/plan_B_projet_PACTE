// Génère et déploie l'emploi du temps du S1 sur les données de démonstration (solveur Timefold),
// au nom du premier admin, sans passer par l'API ni par un mot de passe. Attend la fin et résume.
// Exécution : docker compose exec -T backend node --input-type=module - < deploy/vps/generer-demo.mjs
import sequelize from "/app/config/db.js";
import { GenerationSession, Periode, Users } from "/app/models/index.js";
import { lancerGeneration } from "/app/services/generation/timefold/generation.js";

const DUREE = Number(process.env.DUREE_SECONDES || 90);
const admin = await Users.findOne({ where: { role: "admin" }, order: [["id_user", "ASC"]] });
const periode = await Periode.findOne({ where: { code: "S1" }, order: [["id_periode", "DESC"]] });
if (!admin || !periode) throw new Error("Admin ou période S1 introuvable : lancer le seed d'abord");

const session = await lancerGeneration({ id_periode: periode.id_periode, dureeSecondes: DUREE, user: admin });
console.log(`Génération #${session.id_generation_session} lancée (${DUREE} s de calcul)…`);

let etat = session;
let dernier = "";
while (["pending", "running"].includes(etat.status)) {
    await new Promise((r) => setTimeout(r, 5000));
    etat = await GenerationSession.findByPk(session.id_generation_session);
    if (etat.last_message !== dernier) console.log(`  ${etat.progress ?? 0} % — ${(dernier = etat.last_message)}`);
}
console.log(`Terminé : ${etat.status} — ${etat.last_message}`);
await sequelize.close();
process.exit(etat.status === "completed" ? 0 : 1);
