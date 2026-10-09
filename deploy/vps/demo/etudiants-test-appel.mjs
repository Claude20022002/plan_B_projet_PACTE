// Recette de l'appel par QR code : un groupe « TEST APPEL » de N étudiants de test et une séance
// AUJOURD'HUI pour un enseignant, pour essayer l'appel avec de vrais téléphones.
//  - étudiants test.appel1@hestim.ma … test.appelN@hestim.ma, chacun avec un mot de passe aléatoire
//    (sur la sortie standard : à ajouter au fichier root des identifiants, jamais ailleurs) ;
//  - la séance du jour du groupe, avec l'enseignant (ENSEIGNANT_EMAIL, sinon l'enseignant de démo) ;
//  - RESET=1 : remet l'essai à zéro (téléphones déliés, présences, signalements et appel du jour
//    effacés) sans changer les mots de passe ; à relancer entre deux essais.
// Le script peut être relancé : il réutilise le groupe, les comptes et la séance.
// Exécution (dans /opt/hestim) :
//   docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml \
//     exec -T -e NOMBRE=6 backend node --input-type=module - < deploy/vps/demo/etudiants-test-appel.mjs >> /root/hestim-identifiants.txt
import crypto from "crypto";
import { Op } from "sequelize";
import sequelize from "/app/config/db.js";
import { Affectation, AppareilEtudiant, AppelSeance, Appartenir, Cours, Creneau, Etudiant, Groupe, Presence, Salle, SignalementPresence, Users } from "/app/models/index.js";
import { hashPassword } from "/app/utils/passwordHelper.js";

const log = (m) => process.stderr.write(`${m}\n`);
const NOMBRE = Math.min(30, Math.max(1, Number(process.env.NOMBRE || 6)));
const RESET = process.env.RESET === "1";
const FUSEAU = "Africa/Casablanca";
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const maintenant = new Date();
const aujourdhui = maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU });
const heure = maintenant.toLocaleTimeString("fr-FR", { timeZone: FUSEAU, hour12: false });
const jour = JOURS[new Date(`${aujourdhui}T12:00:00Z`).getUTCDay()];

const enseignant =
    (process.env.ENSEIGNANT_EMAIL && (await Users.findOne({ where: { email: process.env.ENSEIGNANT_EMAIL, role: "enseignant" } }))) ||
    (await Users.findOne({ where: { email: "adil.benkirane0@hestim.ma", role: "enseignant" } })) ||
    (await Users.findOne({ where: { role: "enseignant", actif: true }, order: [["id_user", "ASC"]] }));
const admin = await Users.findOne({ where: { role: "admin" }, order: [["id_user", "ASC"]] });
if (!enseignant || !admin) throw new Error("Aucun enseignant ou administrateur");

// Un module que l'enseignant enseigne déjà (sinon le premier module), et sa filière
const dejaEnseigne = await Affectation.findOne({ where: { id_user_enseignant: enseignant.id_user }, order: [["date_seance", "DESC"]] });
const cours = (dejaEnseigne && (await Cours.findByPk(dejaEnseigne.id_cours))) || (await Cours.findOne({ order: [["id_cours", "ASC"]] }));
if (!cours) throw new Error("Aucun module");

const [groupe] = await Groupe.findOrCreate({
    where: { nom_groupe: "TEST APPEL" },
    defaults: { niveau: "Test", effectif: NOMBRE, annee_scolaire: "2026-2027", id_filiere: cours.id_filiere, type_groupe: "promotion" },
});

// Étudiants de test : créés une fois, mot de passe aléatoire à chaque création
const lignes = [`# Recette de l'appel, groupe TEST APPEL (${maintenant.toISOString()}) : à garder pour soi`];
const etudiants = [];
for (let i = 1; i <= NOMBRE; i += 1) {
    const email = `test.appel${i}@hestim.ma`;
    let user = await Users.findOne({ where: { email } });
    if (!user) {
        const motDePasse = `${crypto.randomBytes(9).toString("base64url")}-A9`;
        user = await Users.create({ nom: `Appel ${i}`, prenom: "Testeur", email, role: "etudiant", actif: true, password_hash: await hashPassword(motDePasse), must_change_password: false });
        await Etudiant.create({ id_user: user.id_user, numero_etudiant: `TEST-APPEL-${i}`, niveau: "Test" });
        lignes.push(`etudiant   ${email}  ${motDePasse}`);
    } else if (!user.actif) {
        await user.update({ actif: true });
    }
    await Appartenir.findOrCreate({ where: { id_user_etudiant: user.id_user, id_groupe: groupe.id_groupe } });
    etudiants.push(user);
}
const ids = etudiants.map((u) => u.id_user);

// Séance du jour : le créneau en cours ou le prochain d'aujourd'hui, sinon un créneau quelconque
let seance = await Affectation.findOne({ where: { id_groupe: groupe.id_groupe, date_seance: aujourdhui, statut: { [Op.ne]: "annule" } } });
if (!seance) {
    const creneau =
        (await Creneau.findOne({ where: { jour_semaine: jour, heure_fin: { [Op.gt]: heure } }, order: [["heure_debut", "ASC"]] })) ||
        (await Creneau.findOne({ where: { jour_semaine: jour }, order: [["heure_debut", "DESC"]] })) ||
        (await Creneau.findOne({ order: [["id_creneau", "ASC"]] }));
    const salle = await Salle.findOne({ order: [["id_salle", "ASC"]] });
    if (!creneau || !salle) throw new Error("Aucun créneau ou aucune salle");
    seance = await Affectation.create({
        date_seance: aujourdhui,
        statut: "confirme",
        id_cours: cours.id_cours,
        id_groupe: groupe.id_groupe,
        id_user_enseignant: enseignant.id_user,
        id_salle: salle.id_salle,
        id_creneau: creneau.id_creneau,
        id_user_admin: admin.id_user,
    });
    log(`Séance créée : ${cours.nom_cours}, ${aujourdhui}, créneau ${creneau.heure_debut}-${creneau.heure_fin}, salle ${salle.nom_salle}`);
} else {
    log(`Séance du jour réutilisée (#${seance.id_affectation})`);
}

if (RESET) {
    const liens = await AppareilEtudiant.destroy({ where: { id_user: ids } });
    const presences = await Presence.destroy({ where: { id_affectation: seance.id_affectation } });
    const signalements = await SignalementPresence.destroy({ where: { id_affectation: seance.id_affectation } });
    await AppelSeance.destroy({ where: { id_affectation: seance.id_affectation } });
    if (seance.statut === "realise") await seance.update({ statut: "confirme" });
    log(`Remise à zéro : ${liens} téléphone(s) délié(s), ${presences} présence(s), ${signalements} signalement(s), appel effacé`);
}

log(`Groupe TEST APPEL : ${NOMBRE} étudiant(s) ; enseignant ${enseignant.prenom} ${enseignant.nom} (${enseignant.email})`);
log(`Ouvrir l'appel : connecté comme cet enseignant, séance #${seance.id_affectation} du jour (Mes séances, ou /appel/${seance.id_affectation})`);
if (lignes.length > 1) process.stdout.write(`${lignes.join("\n")}\n`);
else log("Aucun nouveau compte : mots de passe inchangés (voir le fichier des identifiants)");
await sequelize.close();
