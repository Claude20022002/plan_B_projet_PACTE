// Démonstration complète pour un enseignant (par défaut : Mme HAIDRAR, Bases de données NoSQL,
// IIIA 4e année) avec une classe de démonstration qui ne touche aucun vrai étudiant :
//  - le compte enseignant (DEMO_EMAIL, haidrar.demo@hestim.ma par défaut), mot de passe aléatoire,
//    sans obligation de le changer ni invitation par email ;
//  - le groupe « IIIA-4 DÉMO NoSQL » et NOMBRE étudiants de test (demo.nosql1@hestim.ma…) ;
//  - son service sur le module (enseignement de la période en cours, accepté) : la classe apparaît
//    dans « Mes classes », les devoirs, les jeux et les quiz ;
//  - des séances à son emploi du temps et à celui de la classe : AUJOURD'HUI (créneau en cours ou
//    prochain, pour l'appel par QR code), puis sur les deux semaines suivantes, chacune dans une
//    salle libre à ce créneau (aucun conflit avec le vrai planning).
// Les mots de passe des comptes créés sont écrits sur la sortie standard (à garder pour soi) ; le
// journal va sur la sortie d'erreur. Le script peut être relancé : il réutilise comptes, groupe,
// service et séances. RESET=1 remet l'appel du jour à zéro (téléphones déliés, présences effacées).
// Exécution (dans /opt/hestim) :
//   docker compose --env-file .env.docker -f docker-compose.yml -f deploy/vps/docker-compose.vps.yml \
//     exec -T backend node --input-type=module - < deploy/vps/demo/demo-enseignant.mjs >> /root/hestim-identifiants.txt
import crypto from "crypto";
import { Op } from "sequelize";
import sequelize from "/app/config/db.js";
import {
    Affectation,
    AppareilEtudiant,
    AppelSeance,
    Appartenir,
    Cours,
    CoursComposante,
    Creneau,
    Enseignant,
    Enseignement,
    EnseignementEnseignant,
    EnseignementGroupe,
    Etudiant,
    Filiere,
    Groupe,
    Periode,
    Presence,
    Salle,
    SignalementPresence,
    Users,
} from "/app/models/index.js";
import { hashPassword } from "/app/utils/passwordHelper.js";

const log = (m) => process.stderr.write(`${m}\n`);
const EMAIL = (process.env.DEMO_EMAIL || "haidrar.demo@hestim.ma").trim().toLowerCase();
const NOM = process.env.DEMO_NOM || "HAIDRAR";
const PRENOM = process.env.DEMO_PRENOM || "Mme";
const CODE_COURS = process.env.DEMO_COURS || "IIIA-4-NOSQL";
const NOM_GROUPE = process.env.DEMO_GROUPE || "IIIA-4 DÉMO NoSQL";
const PREFIXE = process.env.DEMO_PREFIXE || "demo.nosql";
const NOMBRE = Math.min(15, Math.max(1, Number(process.env.NOMBRE || 5)));
const RESET = process.env.RESET === "1";
const FUSEAU = "Africa/Casablanca";
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

const maintenant = new Date();
const aujourdhui = maintenant.toLocaleDateString("en-CA", { timeZone: FUSEAU });
const heure = maintenant.toLocaleTimeString("fr-FR", { timeZone: FUSEAU, hour12: false });
const decaler = (date, jours) => {
    const d = new Date(`${date}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + jours);
    return d.toISOString().slice(0, 10);
};
const jourDe = (date) => JOURS[new Date(`${date}T12:00:00Z`).getUTCDay()];
// Mot de passe aléatoire conforme à la politique (16 caractères, ni courant ni personnel)
const motDePasse = () => `${crypto.randomBytes(12).toString("base64url")}-Hq7`;
const identifiants = [`# Démonstration ${CODE_COURS} (${maintenant.toISOString()}) : à garder pour soi`];

const admin = await Users.findOne({ where: { role: "admin" }, order: [["id_user", "ASC"]] });
if (!admin) throw new Error("Aucun administrateur");

// ── Module et filière ──
let cours = await Cours.findOne({ where: { code_cours: CODE_COURS } });
if (!cours) {
    const filiere = (await Filiere.findOne({ where: { code_filiere: "IIIA" } })) || (await Filiere.findOne({ order: [["id_filiere", "ASC"]] }));
    if (!filiere) throw new Error("Aucune filière");
    cours = await Cours.create({ code_cours: CODE_COURS, nom_cours: "Bases de données NoSQL", niveau: "4A", volume_horaire: 27, type_cours: "CM", semestre: "S7", id_filiere: filiere.id_filiere });
    log(`Module créé : ${CODE_COURS}`);
}
const composante =
    (await CoursComposante.findOne({ where: { id_cours: cours.id_cours, type: "TP" } })) ||
    (await CoursComposante.findOne({ where: { id_cours: cours.id_cours } })) ||
    (await CoursComposante.create({ id_cours: cours.id_cours, type: "CM", volume_heures: 27, niveau_groupe: "promotion" }));

// ── Enseignante ──
let enseignante = await Users.findOne({ where: { email: EMAIL } });
if (!enseignante) {
    const mdp = motDePasse();
    enseignante = await Users.create({ nom: NOM, prenom: PRENOM, email: EMAIL, role: "enseignant", actif: true, password_hash: await hashPassword(mdp), must_change_password: false });
    await Enseignant.create({ id_user: enseignante.id_user, specialite: "Bases de données NoSQL", departement: "Informatique", statut: "vacataire" });
    identifiants.push(`enseignant ${EMAIL}  ${mdp}`);
    log(`Compte enseignant créé : ${PRENOM} ${NOM} (${EMAIL})`);
} else {
    if (enseignante.role !== "enseignant") throw new Error(`${EMAIL} existe déjà avec le rôle ${enseignante.role}`);
    if (!enseignante.actif) await enseignante.update({ actif: true });
    log(`Compte enseignant réutilisé : ${EMAIL} (mot de passe inchangé)`);
}

// ── Classe de démonstration et étudiants de test ──
const [groupe] = await Groupe.findOrCreate({
    where: { nom_groupe: NOM_GROUPE },
    defaults: { niveau: "4A", effectif: NOMBRE, annee_scolaire: "2026-2027", id_filiere: cours.id_filiere, type_groupe: "promotion" },
});
const etudiants = [];
for (let i = 1; i <= NOMBRE; i += 1) {
    const email = `${PREFIXE}${i}@hestim.ma`;
    let user = await Users.findOne({ where: { email } });
    if (!user) {
        const mdp = motDePasse();
        user = await Users.create({ nom: `NoSQL ${i}`, prenom: "Étudiant", email, role: "etudiant", actif: true, password_hash: await hashPassword(mdp), must_change_password: false });
        await Etudiant.create({ id_user: user.id_user, numero_etudiant: `DEMO-NOSQL-${i}`, niveau: "4A" });
        identifiants.push(`etudiant   ${email}  ${mdp}`);
    } else if (!user.actif) {
        await user.update({ actif: true });
    }
    await Appartenir.findOrCreate({ where: { id_user_etudiant: user.id_user, id_groupe: groupe.id_groupe } });
    etudiants.push(user);
}

// ── Service : enseignement de la période en cours, accepté ──
const periode =
    (await Periode.findOne({ where: { date_debut: { [Op.lte]: aujourdhui }, date_fin: { [Op.gte]: aujourdhui } } })) ||
    (await Periode.findOne({ where: { date_debut: { [Op.lte]: aujourdhui } }, order: [["date_debut", "DESC"]] }));
let enseignement = (
    await EnseignementGroupe.findOne({
        where: { id_groupe: groupe.id_groupe },
        include: [{ model: Enseignement, as: "enseignement", required: true, where: { id_composante: composante.id_composante } }],
    }).catch(() => null)
)?.enseignement;
if (!enseignement) {
    enseignement = await Enseignement.create({ id_composante: composante.id_composante, id_periode: periode?.id_periode ?? null, libelle: "Démonstration", heures_prevues: 27 });
    await EnseignementGroupe.findOrCreate({ where: { id_enseignement: enseignement.id_enseignement, id_groupe: groupe.id_groupe } });
}
const [service] = await EnseignementEnseignant.findOrCreate({
    where: { id_enseignement: enseignement.id_enseignement, id_user: enseignante.id_user },
    defaults: { role: "principal", statut_service: "accepte" },
});
if (service.statut_service !== "accepte") await service.update({ statut_service: "accepte" });

// ── Séances : aujourd'hui (pour l'appel), puis sur deux semaines ──
const chevauche = (a, b) => String(a.heure_debut) < String(b.heure_fin) && String(b.heure_debut) < String(a.heure_fin);
/** Une salle sans séance qui chevauche ce créneau ce jour-là (grilles différentes comprises). */
const salleLibre = async (date, creneau) => {
    const occupees = await Affectation.findAll({ where: { date_seance: date, statut: { [Op.ne]: "annule" }, id_salle: { [Op.ne]: null } }, include: [{ model: Creneau, as: "creneau" }] });
    const prises = new Set(occupees.filter((s) => s.creneau && chevauche(s.creneau, creneau)).map((s) => s.id_salle));
    return Salle.findOne({ where: { disponible: true, ...(prises.size ? { id_salle: { [Op.notIn]: [...prises] } } : {}) }, order: [["capacite", "ASC"], ["id_salle", "ASC"]] });
};
const seanceLe = async (date, { preferer = null } = {}) => {
    const existante = await Affectation.findOne({ where: { id_groupe: groupe.id_groupe, date_seance: date, statut: { [Op.ne]: "annule" } } });
    if (existante) return { seance: existante, creee: false };
    const jour = jourDe(date);
    if (jour === "dimanche") return { seance: null, creee: false };
    const grille = { jour_semaine: jour, variante: "normale" };
    const creneau =
        (preferer && (await Creneau.findOne({ where: { ...grille, heure_fin: { [Op.gt]: preferer } }, order: [["heure_debut", "ASC"]] }))) ||
        (await Creneau.findOne({ where: grille, order: [["heure_debut", preferer ? "DESC" : "ASC"]] })) ||
        (await Creneau.findOne({ order: [["id_creneau", "ASC"]] }));
    if (!creneau) throw new Error("Aucun créneau");
    const salle = await salleLibre(date, creneau);
    if (!salle) throw new Error(`Aucune salle libre le ${date} à ${creneau.heure_debut}`);
    const seance = await Affectation.create({
        date_seance: date,
        statut: date === aujourdhui ? "confirme" : "planifie",
        id_cours: cours.id_cours,
        id_groupe: groupe.id_groupe,
        id_user_enseignant: enseignante.id_user,
        id_salle: salle.id_salle,
        id_creneau: creneau.id_creneau,
        id_enseignement: enseignement.id_enseignement,
        id_user_admin: admin.id_user,
    });
    log(`Séance créée : ${date} ${String(creneau.heure_debut).slice(0, 5)}-${String(creneau.heure_fin).slice(0, 5)}, salle ${salle.nom_salle}`);
    return { seance, creee: true };
};

const { seance: duJour } = await seanceLe(aujourdhui, { preferer: heure });
if (!duJour) log("Aujourd'hui est un dimanche : pas de séance du jour, l'appel ne pourra pas s'ouvrir");
for (const ecart of [2, 7, 9, 14]) await seanceLe(decaler(aujourdhui, ecart));

if (RESET && duJour) {
    const ids = etudiants.map((u) => u.id_user);
    const liens = await AppareilEtudiant.destroy({ where: { id_user: ids } });
    const presences = await Presence.destroy({ where: { id_affectation: duJour.id_affectation } });
    await SignalementPresence.destroy({ where: { id_affectation: duJour.id_affectation } });
    await AppelSeance.destroy({ where: { id_affectation: duJour.id_affectation } });
    if (duJour.statut === "realise") await duJour.update({ statut: "confirme" });
    log(`Remise à zéro de l'appel du jour : ${liens} téléphone(s) délié(s), ${presences} présence(s) effacée(s)`);
}

log(`Classe « ${NOM_GROUPE} » : ${NOMBRE} étudiant(s) ; module ${cours.code_cours} ${cours.nom_cours} ; enseignante ${PRENOM} ${NOM} (${EMAIL})`);
if (duJour) log(`Appel du jour : séance #${duJour.id_affectation} (Mes séances, ou /appel/${duJour.id_affectation})`);
log("Quiz ClassQuiz : se connecter une fois à quiz.finadmintech.fr avec ce compte, puis lancer deploy/vps/demo/quiz-nosql.py");
if (identifiants.length > 1) process.stdout.write(`${identifiants.join("\n")}\n`);
else log("Aucun nouveau compte : mots de passe inchangés (voir le fichier des identifiants)");
await sequelize.close();
