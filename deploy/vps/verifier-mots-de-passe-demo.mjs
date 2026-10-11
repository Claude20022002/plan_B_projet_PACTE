// Contrôle de recette (lot A-2) : aucun compte ne doit s'ouvrir avec un mot de passe de
// démonstration connu du dépôt (« password123 » du seed, « Hestim@2026 » des tests).
// Lecture seule : le script ne modifie aucun compte et n'affiche aucun mot de passe.
//  - MOTS_DE_PASSE="un,deux" : mots de passe à essayer en plus (anciens identifiants de démo) ;
//  - code de sortie 0 si aucun compte n'est concerné, 1 sinon (la liste part sur la sortie standard).
// Correction d'un compte trouvé : « Réinitialiser le mot de passe » dans la page Utilisateurs,
// ou deploy/vps/renouveler-demo.sh pour les comptes de démonstration.
// Exécution (dans /opt/hestim) :
//   docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml \
//     exec -T backend node --input-type=module - < deploy/vps/verifier-mots-de-passe-demo.mjs
import sequelize from "/app/config/db.js";
import { Users } from "/app/models/index.js";
import { comparePassword } from "/app/utils/passwordHelper.js";

const log = (m) => process.stderr.write(`${m}\n`);
const CONNUS = ["password123", "Hestim@2026"];
const enPlus = (process.env.MOTS_DE_PASSE || "").split(",").map((m) => m.trim()).filter(Boolean);
const essais = [...new Set([...CONNUS, ...enPlus])];

const comptes = await Users.findAll({ attributes: ["id_user", "email", "role", "actif", "password_hash"], order: [["id_user", "ASC"]] });
log(`${comptes.length} compte(s), ${essais.length} mot(s) de passe essayé(s)`);

// Après mots-de-passe-demo.mjs, les comptes non utilisés partagent une même empreinte :
// elle n'est comparée qu'une fois (bcrypt est lent exprès)
const parEmpreinte = new Map();
const ouvre = async (empreinte) => {
    if (!parEmpreinte.has(empreinte)) {
        let trouve = false;
        for (const essai of essais) {
            // Une empreinte illisible (compte sans mot de passe utilisable) ne s'ouvre avec rien
            if (await comparePassword(essai, empreinte).catch(() => false)) {
                trouve = true;
                break;
            }
        }
        parEmpreinte.set(empreinte, trouve);
    }
    return parEmpreinte.get(empreinte);
};

const concernes = [];
for (const compte of comptes) {
    if (compte.password_hash && (await ouvre(compte.password_hash))) concernes.push(compte);
}

for (const c of concernes) process.stdout.write(`${String(c.id_user).padEnd(6)} ${c.role.padEnd(10)} ${c.actif ? "actif  " : "inactif"} ${c.email}\n`);
log(concernes.length ? `ÉCHEC : ${concernes.length} compte(s) s'ouvrent avec un mot de passe de démonstration` : "OK : aucun compte ne s'ouvre avec un mot de passe de démonstration");
await sequelize.close();
process.exit(concernes.length ? 1 : 0);
