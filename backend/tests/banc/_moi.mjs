import "./env.mjs";
import fs from "fs";
const { default: sequelize } = await import("../../config/db.js");
const { seancesDeLEtudiant } = await import("../../services/planning/monEmploiDuTemps.js");
sequelize.options.logging = false;
// Étudiants des groupes concernés par une mutualisation d'abord, puis d'autres
const [mutu] = await sequelize.query("SELECT DISTINCT ap.id_user_etudiant id FROM Appartenir ap JOIN EnseignementGroupes eg ON eg.id_groupe = ap.id_groupe WHERE eg.id_enseignement IN (SELECT id_enseignement FROM EnseignementGroupes GROUP BY id_enseignement HAVING COUNT(*) > 1) ORDER BY id LIMIT 15");
const [autres] = await sequelize.query("SELECT id_user_etudiant id FROM Appartenir ORDER BY id_user_etudiant DESC LIMIT 15");
const sortie = {}; let seances = 0;
for (const { id } of [...mutu, ...autres]) for (const [du, au] of [["2026-10-05", "2026-11-01"], ["2027-01-04", "2027-01-31"], ["2027-07-01", "2027-07-10"]]) {
  const r = await seancesDeLEtudiant(id, { du, au, aujourdhui: "2026-10-09" }); seances += r.seances.length;
  sortie[`${id}|${du}`] = r;
}
fs.writeFileSync(process.argv[2], JSON.stringify(sortie));
console.log(`${Object.keys(sortie).length} cas, ${seances} séances, ${mutu.length} étudiants à mutualisation`);
await sequelize.close();
