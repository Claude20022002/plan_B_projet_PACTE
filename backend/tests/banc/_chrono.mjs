import "./env.mjs";
import crypto from "crypto";
import request from "supertest";
const { default: sequelize } = await import("../../config/db.js");
const { default: app } = await import("../../app.js");
const { AuthSession, Users } = await import("../../models/index.js");
const { signerJetonAcces } = await import("../../utils/jetons.js");
sequelize.options.logging = false;
const admin = await Users.findOne({ where: { role: "admin" }, order: [["id_user", "ASC"]] });
const sid = crypto.randomUUID();
await AuthSession.create({ id_user: admin.id_user, session_id: sid, family_id: sid, refresh_token_hash: crypto.randomBytes(16).toString("hex"), expires_at: new Date(Date.now() + 3600e3) });
const jeton = signerJetonAcces({ sub: String(admin.id_user), sid, fid: sid, role: "admin" }, 3600);
const out = [];
for (const r of process.argv.slice(2)) {
  const t = [];
  for (let i = 0; i < 17; i++) { const a = performance.now(); await request(app).get(`/${r}`).set("Authorization", `Bearer ${jeton}`); t.push(performance.now() - a); }
  t.splice(0, 2); t.sort((x, y) => x - y);
  out.push(`${r} médiane ${Math.round(t[7])} ms`);
}
await AuthSession.destroy({ where: { session_id: sid } });
await sequelize.close();
console.log(out.join("\n"));
