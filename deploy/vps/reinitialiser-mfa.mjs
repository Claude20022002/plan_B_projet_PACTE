// Secours : retire la double authentification d'un compte (téléphone perdu, plus de codes de
// secours, et aucun autre administrateur pour la réinitialiser depuis la page Utilisateurs).
// Les sessions du compte sont fermées ; un administrateur la reconfigurera à sa connexion.
// Exécution (dans /opt/hestim, après avoir vérifié l'identité de la personne) :
//   docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml \
//     exec -T -e EMAIL=prenom.nom@hestim.ma backend node --input-type=module - < deploy/vps/reinitialiser-mfa.mjs
import sequelize from "/app/config/db.js";
import { AuthSession, MfaCodeSecours, MfaDefi, Users } from "/app/models/index.js";

const email = (process.env.EMAIL || "").trim();
if (!email) throw new Error("EMAIL manquant");
const user = await Users.findOne({ where: { email } });
if (!user) throw new Error(`Aucun compte ${email}`);

await sequelize.transaction(async (transaction) => {
    await Users.update({ mfa_secret: null, mfa_active: false, mfa_dernier_pas: null }, { where: { id_user: user.id_user }, transaction });
    await MfaCodeSecours.destroy({ where: { id_user: user.id_user }, transaction });
    await MfaDefi.destroy({ where: { id_user: user.id_user }, transaction });
    await AuthSession.update({ revoked_at: new Date(), revoked_reason: "mfa_reset" }, { where: { id_user: user.id_user, revoked_at: null }, transaction });
});
console.log(`Double authentification retirée pour ${user.prenom} ${user.nom} (${email}) ; sessions fermées.`);
await sequelize.close();
