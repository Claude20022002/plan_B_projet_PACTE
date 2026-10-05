// Renouvelle les mots de passe des comptes de démonstration (après une fuite, par exemple) sans
// toucher aux autres comptes. Entrée standard : « rôle email » par ligne ; sortie standard : le
// fichier des identifiants avec les nouveaux mots de passe. Les sessions de ces comptes sont
// fermées. Exécution (root) : sh deploy/vps/renouveler-demo.sh
import crypto from "crypto";
import fs from "fs";
import sequelize from "/app/config/db.js";
import { AuthSession, Users } from "/app/models/index.js";
import { hashPassword } from "/app/utils/passwordHelper.js";

const aleatoire = () => `${crypto.randomBytes(12).toString("base64url")}-A9`;
const comptes = fs
    .readFileSync(process.env.IDENTIFIANTS ?? "/dev/stdin", "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => l.trim().split(/\s+/))
    .map(([role, email]) => ({ role, email }));

const lignes = [`# Comptes de démonstration HESTIM (renouvelés le ${new Date().toISOString()}) — à garder pour soi`];
for (const { role, email } of comptes) {
    const user = await Users.findOne({ where: { email } });
    if (!user) continue;
    const motDePasse = aleatoire();
    await user.update({ password_hash: await hashPassword(motDePasse), must_change_password: false });
    await AuthSession.destroy({ where: { id_user: user.id_user } });
    lignes.push(`${role.padEnd(10)} ${email}  ${motDePasse}`);
}
process.stdout.write(`${lignes.join("\n")}\n`);
process.stderr.write(`${lignes.length - 1} compte(s) renouvelé(s)\n`);
await sequelize.close();
