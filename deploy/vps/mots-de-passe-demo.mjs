// Après le seed de démonstration sur un serveur public : plus aucun mot de passe connu.
// Trois comptes de démonstration (admin, enseignant, étudiant) reçoivent chacun un mot de passe
// aléatoire, écrit sur la sortie standard (à rediriger vers un fichier lisible par root) ;
// tous les autres reçoivent un mot de passe aléatoire que personne ne connaît. Sessions révoquées.
// Exécution : docker compose exec -T backend node --input-type=module - < deploy/vps/mots-de-passe-demo.mjs > /root/hestim-identifiants.txt
import crypto from "crypto";
import sequelize from "/app/config/db.js";
import { Users, AuthSession } from "/app/models/index.js";
import { hashPassword } from "/app/utils/passwordHelper.js";

const aleatoire = () => `${crypto.randomBytes(12).toString("base64url")}-A9`;
const premier = (role, email) =>
    Users.findOne({ where: email ? { email } : { role }, order: [["id_user", "ASC"]] });

const demo = [
    ["admin", await premier("admin", "admin@hestim.ma")],
    ["enseignant", (await premier("enseignant", "alain.benkirane0@hestim.ma")) || (await premier("enseignant"))],
    ["etudiant", await premier("etudiant")],
].filter(([, user]) => user);

// Un seul hachage pour les comptes non utilisés : son mot de passe est jeté aussitôt
await Users.update({ password_hash: await hashPassword(aleatoire()) }, { where: {} });

const lignes = [`# Comptes de démonstration HESTIM (${new Date().toISOString()}) — à garder pour soi`];
for (const [role, user] of demo) {
    const motDePasse = aleatoire();
    // L'admin choisit son propre mot de passe à la première connexion
    await user.update({ password_hash: await hashPassword(motDePasse), must_change_password: role === "admin" });
    lignes.push(`${role.padEnd(10)} ${user.email}  ${motDePasse}`);
}
await AuthSession.destroy({ where: {} });

process.stdout.write(`${lignes.join("\n")}\n`);
await sequelize.close();
