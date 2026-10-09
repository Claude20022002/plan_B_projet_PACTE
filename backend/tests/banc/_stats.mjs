// Réponses des routes de statistiques (comparaison avant/après une optimisation)
import "./env.mjs";
import crypto from "crypto";
import fs from "fs";
import request from "supertest";
const { default: sequelize } = await import("../../config/db.js");
const { default: app } = await import("../../app.js");
const { AuthSession, Users, Salle } = await import("../../models/index.js");
const { signerJetonAcces } = await import("../../utils/jetons.js");
sequelize.options.logging = false;
const admin = await Users.findOne({ where: { role: "admin" }, order: [["id_user", "ASC"]] });
const sid = crypto.randomUUID();
await AuthSession.create({ id_user: admin.id_user, session_id: sid, family_id: sid, refresh_token_hash: crypto.randomBytes(16).toString("hex"), expires_at: new Date(Date.now() + 3600e3) });
const jeton = signerJetonAcces({ sub: String(admin.id_user), sid, fid: sid, role: "admin" }, 3600);
const salle = await Salle.findOne({ order: [["id_salle", "ASC"]] });
const routes = ["dashboard", "kpis", "salles/occupation", "salles/frequence", `salles/${salle.id_salle}/occupation`, "enseignants/charge", "groupes/occupation", "activite/heures-creuses", "activite/pics"];
const sortie = {};
for (const r of routes) for (const q of ["", "?portee=tout", "?date_debut=2026-11-01&date_fin=2026-11-30"]) {
  const res = await request(app).get(`/api/statistiques/${r}${q}`).set("Authorization", `Bearer ${jeton}`);
  sortie[r + q] = { statut: res.status, corps: res.body };
}
await AuthSession.destroy({ where: { session_id: sid } });
fs.writeFileSync(process.argv[2], JSON.stringify(sortie, null, 1));
console.log(Object.entries(sortie).map(([k, v]) => `${v.statut} ${k}`).join("\n"));
await sequelize.close();
