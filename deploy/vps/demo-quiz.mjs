// Démonstration (captures de présentation) : un étudiant de 4A IIIA reçoit un mot de passe aléatoire
// (ligne « etudiant-iiia email motdepasse » sur la sortie standard, à ajouter au fichier root des
// identifiants) et une partie ClassQuiz « en cours » est rattachée à sa prochaine séance, avec la
// notification « Quiz en cours » qu'aurait produite le webhook. Journal sur la sortie d'erreur.
// Exécution : docker compose exec -T backend node --input-type=module - < deploy/vps/demo-quiz.mjs >> /root/hestim-identifiants.txt
import crypto from "crypto";
import { Op } from "sequelize";
import sequelize from "/app/config/db.js";
import { Affectation, Appartenir, Cours, Groupe, QuizPartie, Users } from "/app/models/index.js";
import { hashPassword } from "/app/utils/passwordHelper.js";
import { creerNotificationsMultiples } from "/app/utils/notificationHelper.js";
import { groupesANotifier } from "/app/services/planning/seances.js";

const log = (m) => process.stderr.write(`${m}\n`);
const aujourdhui = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Casablanca" });

const promo = await Groupe.findOne({ where: { nom_groupe: "4A IIIA" } });
if (!promo) throw new Error("Promotion 4A IIIA introuvable");
const familles = await groupesANotifier([promo.id_groupe]);
const inscription = await Appartenir.findOne({ where: { id_groupe: familles }, order: [["id_user_etudiant", "ASC"]] });
const etudiant = await Users.findByPk(inscription.id_user_etudiant);

// Groupes de l'étudiant et leurs parents : ce sont eux que visent ses séances
const sesGroupes = (await Appartenir.findAll({ where: { id_user_etudiant: etudiant.id_user } })).map((a) => a.id_groupe);
const seance = await Affectation.findOne({
    where: { id_groupe: [...new Set([...sesGroupes, promo.id_groupe])], date_seance: { [Op.gte]: aujourdhui }, statut: { [Op.ne]: "annule" } },
    include: [{ model: Cours, as: "cours" }],
    order: [["date_seance", "ASC"], ["id_creneau", "ASC"]],
});
if (!seance) throw new Error("Aucune séance à venir pour cet étudiant");

const motDePasse = `${crypto.randomBytes(12).toString("base64url")}-A9`;
await etudiant.update({ password_hash: await hashPassword(motDePasse), must_change_password: false });

const partie = await QuizPartie.create({
    game_id: crypto.randomUUID(),
    pin: String(crypto.randomInt(100000, 999999)),
    titre: `Révision — ${seance.cours?.nom_cours ?? "séance"}`,
    mode: "kahoot",
    id_user_enseignant: seance.id_user_enseignant,
    id_affectation: seance.id_affectation,
    demarree_le: new Date(),
});
await creerNotificationsMultiples({
    id_users: [etudiant.id_user],
    titre: "Quiz en cours",
    message: `${partie.titre}. Rejoignez la partie depuis l'application.`,
    type_notification: "info",
    lien: "/jeux",
});
log(`Partie #${partie.id_quiz_partie} « ${partie.titre} » (séance du ${seance.date_seance}) pour ${etudiant.prenom} ${etudiant.nom}`);
process.stdout.write(`${"etudiant-iiia".padEnd(10)} ${etudiant.email}  ${motDePasse}\n`);
await sequelize.close();
